import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { AiContextService } from './ai-context.service'
import { SupabaseService } from './supabase.service'

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

@Injectable()
export class AiAssistService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly aiContextService: AiContextService,
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
    const latestClientMessage = [...recentMessages].reverse().find((item) => item.sender_type === 'client')
    const latestText = String(latestClientMessage?.content || conversation.last_message || '').trim()
    if (String(conversation.state || conversation.status || '').toLowerCase() === 'closed') {
      return {
        available: false,
        reason: 'Conversa encerrada nao recebe nova sugestao.',
        suggestion: '',
        source: 'state',
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
}
