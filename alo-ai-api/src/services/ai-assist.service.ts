import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { AiContextService } from './ai-context.service'
import { SupabaseService } from './supabase.service'
import { AccessService } from './access.service'

function tokenize(value: string) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3)
}

function pickTonePrefix(tone: string) {
  if (tone === 'direto') return 'Claro.'
  if (tone === 'acolhedor') return 'Claro, fico feliz em ajudar.'
  return 'Perfeito, vamos resolver isso com voce.'
}

function isCopilotPaused(aiState: any) {
  if (!aiState || typeof aiState !== 'object' || Array.isArray(aiState)) return false
  const copilot = aiState.copilot
  if (!copilot || typeof copilot !== 'object' || Array.isArray(copilot)) return false
  if (copilot.paused === true) return true
  return String(copilot.mode || '').toLowerCase() === 'paused'
}

const TRIAGE_TAGS = new Set(['suporte', 'vendas', 'cobranca', 'urgente', 'spam', 'recorrente', 'outros'])

function normalizeTriageTag(value: string) {
  const normalized = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]+/g, '')
  return TRIAGE_TAGS.has(normalized) ? normalized : null
}

@Injectable()
export class AiAssistService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly aiContextService: AiContextService,
    private readonly accessService: AccessService,
  ) {}

  async getWorkspaceConfig(workspaceId: string) {
    const row = await this.aiContextService.loadWorkspaceConfigRow(workspaceId)
    return {
      config: this.aiContextService.normalizeConfigRow(workspaceId, row),
    }
  }

  async updateWorkspaceConfig(workspaceId: string, patch: Record<string, any>) {
    const currentRow = await this.aiContextService.loadWorkspaceConfigRow(workspaceId)
    const payload = this.aiContextService.buildPatchPayload(workspaceId, currentRow, patch)

    const { data, error } = await this.supabase.admin
      .from('ai_workspace_configs')
      .upsert(payload, { onConflict: 'workspace_id' })
      .select('id, workspace_id, enabled, auto_reply_enabled, confidence_threshold, tone, workspace_context, faq_rules, knowledge_files, channel_policy, schedule_policy, created_at, updated_at')
      .single()

    if (error) throw new InternalServerErrorException(error.message)

    return {
      config: this.aiContextService.normalizeConfigRow(workspaceId, data),
    }
  }

  async suggestReply(input: {
    workspaceId: string
    conversationId: string
    userId: string
    role: string
  }) {
    await this.ensureAiWorkspaceEnabled(input.workspaceId)
    const configRow = await this.aiContextService.loadWorkspaceConfigRow(input.workspaceId)
    const config = this.aiContextService.normalizeConfigRow(input.workspaceId, configRow)
    const { conversation, messages } = await this.aiContextService.loadConversationContext(input.workspaceId, input.conversationId)
    const channel = Array.isArray(conversation.channels) ? conversation.channels[0] : conversation.channels
    const contact = Array.isArray(conversation.contacts) ? conversation.contacts[0] : conversation.contacts
    const channelType = String(channel?.type || '')
    const availability = this.aiContextService.evaluateSuggestionAvailability(config, channelType)

    if (!availability.available) {
      return {
        available: false,
        reason: availability.reason,
        suggestion: '',
        source: 'policy',
      }
    }

    const recentMessages = messages.slice(-6)
    const latestClientMessage = [...recentMessages].reverse().find((item) => ['client', 'contact'].includes(item.sender_type))
    const latestText = String(latestClientMessage?.content || conversation.last_message || '').trim()
    if (String(conversation.state || conversation.status || '').toLowerCase() === 'closed') {
      return {
        available: false,
        reason: 'Conversa encerrada nao recebe nova sugestao.',
        suggestion: '',
        source: 'state',
      }
    }
    if (isCopilotPaused(conversation.ai_state)) {
      return {
        available: false,
        reason: 'Copilot pausado por takeover humano. Reative manualmente para sugerir.',
        suggestion: '',
        source: 'handoff',
      }
    }
    if (!latestText) {
      return {
        available: false,
        reason: 'Nao ha contexto suficiente para sugerir uma resposta.',
        suggestion: '',
        source: 'empty',
      }
    }

    const faqMatch = this.findBestFaqMatch(config.faqRules, latestText)
    const suggestion = faqMatch
      ? this.buildFaqSuggestion(config, faqMatch.answer, contact?.name)
      : this.buildContextSuggestion(config, latestText, contact?.name)

    return {
      available: true,
      reason: null,
      suggestion,
      source: faqMatch ? 'faq' : 'workspace_context',
      context: {
        tone: config.tone,
        companyContext: config.workspaceContext.company_context,
        knowledgeFileCount: config.knowledgeFiles.length,
      },
    }
  }

  async suggestNextAction(input: {
    workspaceId: string
    conversationId: string
    userId: string
    role: string
  }) {
    await this.ensureAiWorkspaceEnabled(input.workspaceId)
    const { conversation, messages } = await this.aiContextService.loadConversationContext(input.workspaceId, input.conversationId)

    if (String(conversation.state || conversation.status || '').toLowerCase() === 'closed') {
      return { available: false, reason: 'Conversa encerrada.', action: null }
    }
    if (isCopilotPaused(conversation.ai_state)) {
      return { available: false, reason: 'Copilot pausado.', action: null }
    }

    const latestClientMessage = [...messages].reverse().find((item) => ['client', 'contact'].includes(item.sender_type))
    const latestText = String(latestClientMessage?.content || conversation.last_message || '').toLowerCase()
    const triageTag = normalizeTriageTag(conversation.triage_tag) || 'outros'
    const sentiment = String(conversation.sentiment || 'normal').toLowerCase()

    if (['angry', 'urgent'].includes(sentiment) || triageTag === 'urgente') {
      return {
        available: true,
        action: 'assign',
        label: 'Priorizar supervisor',
        description: 'Revisar dono e fila antes de responder.',
        reason: 'Conversa com sinal de urgencia ou irritacao.',
      }
    }

    if (triageTag === 'spam') {
      return {
        available: true,
        action: 'dismiss',
        label: 'Descartar chip',
        description: 'Manter conversa sem sugestao automatica.',
        reason: 'Triagem marcou a conversa como spam.',
      }
    }

    if (triageTag === 'vendas' || /(preco|plano|valor|orcamento|proposta|comprar)/.test(latestText)) {
      return {
        available: true,
        action: 'use_suggestion',
        label: 'Sugerir proposta',
        description: 'Gerar rascunho editavel para o operador.',
        reason: 'Intencao comercial detectada.',
      }
    }

    if (String(conversation.state || '').toLowerCase() === 'waiting_customer') {
      return {
        available: true,
        action: 'follow_up',
        label: 'Preparar follow-up',
        description: 'Inserir nota editavel no composer.',
        reason: 'Conversa aguardando retorno do cliente.',
      }
    }

    return {
      available: true,
      action: 'use_suggestion',
      label: 'Sugerir resposta',
      description: 'Gerar rascunho editavel; nada sera enviado automaticamente.',
      reason: 'Contexto suficiente para assistencia.',
    }
  }

  async updateTriageTag(input: {
    workspaceId: string
    conversationId: string
    triageTag: string
  }) {
    const triageTag = normalizeTriageTag(input.triageTag)
    if (!triageTag) throw new BadRequestException('Categoria de triagem invalida.')

    const { data, error } = await this.supabase.admin
      .from('conversations')
      .update({ triage_tag: triageTag })
      .eq('workspace_id', input.workspaceId)
      .eq('id', input.conversationId)
      .select(`
        id, workspace_id, state, status, priority, assigned_to, unread_count,
        last_message, last_message_at,
        routing_queue, routing_intent, routing_confidence, routing_reason, routing_source,
        triage_tag, sentiment, sentiment_confidence,
        ai_state, escalated_at, escalated_by, escalation_reason, escalation_note
      `)
      .maybeSingle()

    if (error) throw new InternalServerErrorException(error.message)
    if (!data?.id) throw new BadRequestException('Conversa nao encontrada.')
    return { conversation: data }
  }

  private findBestFaqMatch(faqRules: Array<{ question: string; answer: string; id: string }>, message: string) {
    const messageTokens = new Set(tokenize(message))
    let bestMatch: { id: string; question: string; answer: string } | null = null
    let bestScore = 0

    for (const item of faqRules) {
      const score = tokenize(item.question).reduce((total, token) => total + (messageTokens.has(token) ? 1 : 0), 0)
      if (score > bestScore) {
        bestScore = score
        bestMatch = item
      }
    }

    return bestScore > 0 ? bestMatch : null
  }

  private buildFaqSuggestion(config: any, answer: string, contactName?: string) {
    const prefix = pickTonePrefix(config.tone)
    const recipient = contactName ? `${contactName}, ` : ''
    return `${prefix} ${recipient}${answer}`.trim()
  }

  private buildContextSuggestion(config: any, latestText: string, contactName?: string) {
    const prefix = pickTonePrefix(config.tone)
    const recipient = contactName ? `${contactName}, ` : ''
    const companyContext = String(config.workspaceContext.company_context || '').trim()
    const businessSummary = String(config.workspaceContext.business_summary || '').trim()
    const anchor = companyContext || businessSummary || 'vou confirmar a melhor orientacao dentro do contexto do seu workspace'
    const latestSnippet = latestText.length > 120 ? `${latestText.slice(0, 117)}...` : latestText

    return `${prefix} ${recipient}sobre "${latestSnippet}", ${anchor}. Posso seguir com esse direcionamento?`.trim()
  }

  private async ensureAiWorkspaceEnabled(workspaceId: string) {
    const workspace = await this.accessService.loadWorkspaceRow(workspaceId)
    if (!workspace.ai_enabled) {
      throw new ForbiddenException({
        message: 'Recursos de IA estao desativados para este workspace.',
        code: 'AI_DISABLED',
      })
    }

    const allowedPlans = ['pro', 'business']
    if (!allowedPlans.includes(String(workspace.plan || '').toLowerCase())) {
      throw new ForbiddenException({
        message: 'Este plano nao permite recursos de IA.',
        code: 'AI_PLAN_NOT_ALLOWED',
        plan: workspace.plan,
      })
    }
  }
}
