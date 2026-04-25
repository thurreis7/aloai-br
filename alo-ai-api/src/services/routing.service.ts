import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { SupabaseService } from './supabase.service'
import { AiContextService } from './ai-context.service'
import { LeadService } from './lead.service'

const ALLOWED_QUEUES = new Set(['suporte', 'comercial', 'financeiro', 'triagem'])
const ALLOWED_INTENTS = new Set(['suporte', 'comercial', 'financeiro', 'duvida_geral', 'spam'])
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high'])

function normalizeText(value: string) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function normalizeChannelType(value: string) {
  const type = String(value || '').trim().toLowerCase()
  if (type === 'gmail') return 'email'
  return type
}

function normalizeQueue(value: string) {
  const normalized = String(value || '').trim().toLowerCase()
  return ALLOWED_QUEUES.has(normalized) ? normalized : 'triagem'
}

function normalizeIntent(value: string) {
  const normalized = String(value || '').trim().toLowerCase()
  return ALLOWED_INTENTS.has(normalized) ? normalized : 'duvida_geral'
}

function normalizePriority(value: string, fallback = 'medium') {
  const normalized = String(value || '').trim().toLowerCase()
  return ALLOWED_PRIORITIES.has(normalized) ? normalized : fallback
}

function inferIntentFromText(content: string) {
  const text = normalizeText(content)
  const groups: Array<{ intent: string; keywords: string[]; confidence: number }> = [
    { intent: 'spam', keywords: ['clique aqui', 'sorteio', 'promocao', 'propaganda', 'bitcoin'], confidence: 0.94 },
    { intent: 'financeiro', keywords: ['boleto', 'fatura', 'pagamento', 'nota fiscal', 'cobranca', 'reembolso'], confidence: 0.88 },
    { intent: 'comercial', keywords: ['plano', 'preco', 'orcamento', 'proposta', 'contratar', 'demo'], confidence: 0.86 },
    { intent: 'suporte', keywords: ['erro', 'problema', 'nao funciona', 'falha', 'suporte', 'ajuda'], confidence: 0.86 },
  ]

  for (const group of groups) {
    if (group.keywords.some((keyword) => text.includes(keyword))) {
      return { intent: group.intent, confidence: group.confidence }
    }
  }

  return { intent: 'duvida_geral', confidence: 0.62 }
}

function inferPriorityFromText(content: string, fallback = 'medium') {
  const text = normalizeText(content)
  const highKeywords = ['urgente', 'imediato', 'imediatamente', 'critico', 'cancelamento', 'nao consigo acessar']
  const lowKeywords = ['quando puder', 'sem pressa', 'duvida', 'curiosidade']
  if (highKeywords.some((token) => text.includes(token))) return 'high'
  if (lowKeywords.some((token) => text.includes(token))) return 'low'
  return normalizePriority(fallback, 'medium')
}

function fallbackQueueByIntent(intent: string) {
  if (intent === 'suporte') return 'suporte'
  if (intent === 'comercial') return 'comercial'
  if (intent === 'financeiro') return 'financeiro'
  return 'triagem'
}

function toReason(channelType: string, intent: string, ruleName?: string) {
  const base = `Roteado por canal ${channelType || 'desconhecido'} -> intencao: ${intent}`
  return ruleName ? `${base} (regra: ${ruleName})` : base
}

function canViewReasoning(role: string) {
  return ['owner', 'admin', 'supervisor'].includes(String(role || '').toLowerCase())
}

@Injectable()
export class RoutingService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly aiContextService: AiContextService,
    private readonly leadService: LeadService,
  ) {}

  async classifyConversation(input: {
    workspaceId: string
    conversationId: string
    role: string
  }) {
    const { conversation, messages } = await this.aiContextService.loadConversationContext(input.workspaceId, input.conversationId)
    const channel = Array.isArray(conversation.channels) ? conversation.channels[0] : conversation.channels
    const channelType = normalizeChannelType(String(channel?.type || ''))
    const latestClient = [...messages].reverse().find((item) => item.sender_type === 'client')
    const latestText = String(latestClient?.content || conversation.last_message || '').trim()

    const inferred = inferIntentFromText(latestText)
    const intent = normalizeIntent(inferred.intent)
    const priority = inferPriorityFromText(latestText, conversation.priority || 'medium')
    const reasoning = toReason(channelType, intent)

    return {
      intent,
      priority,
      confidence: Number(inferred.confidence.toFixed(3)),
      reasoning: canViewReasoning(input.role) ? reasoning : null,
    }
  }

  async recommendRouting(input: {
    workspaceId: string
    conversationId: string
    role: string
  }) {
    const { conversation } = await this.aiContextService.loadConversationContext(input.workspaceId, input.conversationId)
    const channel = Array.isArray(conversation.channels) ? conversation.channels[0] : conversation.channels
    const channelType = normalizeChannelType(String(channel?.type || ''))
    const classification = await this.classifyConversation(input)

    const { data: rules, error } = await this.supabase.admin
      .from('routing_rules')
      .select('id, name, priority, channel_type, team_key, assigned_user_id, target_state, conditions')
      .eq('workspace_id', input.workspaceId)
      .eq('enabled', true)
      .order('priority', { ascending: true })

    if (error) throw new InternalServerErrorException(error.message)

    let queue = fallbackQueueByIntent(classification.intent)
    let source = 'fallback'
    let matchedRule: { id: string; name: string } | null = null

    for (const rule of rules || []) {
      const requiredChannel = normalizeChannelType(String(rule.channel_type || ''))
      if (requiredChannel && requiredChannel !== channelType) continue

      const conditions = rule.conditions && typeof rule.conditions === 'object' ? rule.conditions : {}
      const acceptedIntents = Array.isArray(conditions.intents)
        ? conditions.intents.map((item: string) => normalizeIntent(item))
        : []
      const singleIntent = normalizeIntent(conditions.intent || '')
      if (acceptedIntents.length && !acceptedIntents.includes(classification.intent)) continue
      if (conditions.intent && singleIntent !== classification.intent) continue

      const acceptedPriorities = Array.isArray(conditions.priorities)
        ? conditions.priorities.map((item: string) => normalizePriority(item))
        : []
      if (acceptedPriorities.length && !acceptedPriorities.includes(classification.priority)) continue

      queue = normalizeQueue(String(rule.team_key || conditions.queue || queue))
      source = 'rule'
      matchedRule = { id: rule.id, name: rule.name }
      break
    }

    const reasoning = toReason(channelType, classification.intent, matchedRule?.name)

    return {
      queue,
      intent: classification.intent,
      priority: classification.priority,
      confidence: classification.confidence,
      source,
      matchedRule,
      reasoning: canViewReasoning(input.role) ? reasoning : null,
      routingReasonRaw: reasoning,
    }
  }

  async applyRouting(input: {
    workspaceId: string
    conversationId: string
    role: string
    manual?: {
      queue?: string
      intent?: string
      priority?: string
      reason?: string
    }
  }) {
    const { data: conversation, error: conversationError } = await this.supabase.admin
      .from('conversations')
      .select('id, workspace_id, contact_id, channel_id, assigned_to')
      .eq('workspace_id', input.workspaceId)
      .eq('id', input.conversationId)
      .maybeSingle()

    if (conversationError) throw new InternalServerErrorException(conversationError.message)
    if (!conversation) throw new NotFoundException('Conversa nao encontrada.')

    const isManual = Boolean(input.manual?.queue || input.manual?.intent || input.manual?.priority)
    const recommendation = isManual
      ? null
      : await this.recommendRouting({
          workspaceId: input.workspaceId,
          conversationId: input.conversationId,
          role: input.role,
        })

    const queue = normalizeQueue(input.manual?.queue || recommendation?.queue || 'triagem')
    const intent = normalizeIntent(input.manual?.intent || recommendation?.intent || 'duvida_geral')
    const priority = normalizePriority(input.manual?.priority || recommendation?.priority || 'medium')
    const confidence = Number((recommendation?.confidence ?? 0.600).toFixed(3))
    const source = isManual ? 'manual' : recommendation?.source || 'fallback'
    const routingReason = String(
      input.manual?.reason || recommendation?.routingReasonRaw || toReason('', intent),
    ).trim()

    const { data: updatedConversation, error: updateError } = await this.supabase.admin
      .from('conversations')
      .update({
        priority,
        routing_queue: queue,
        routing_intent: intent,
        routing_confidence: confidence,
        routing_reason: routingReason,
        routing_source: source,
      })
      .eq('workspace_id', input.workspaceId)
      .eq('id', input.conversationId)
      .select('id, workspace_id, state, status, priority, assigned_to, assigned_by, unread_count, last_message, last_message_at, routing_queue, routing_intent, routing_confidence, routing_reason, routing_source')
      .single()

    if (updateError) throw new InternalServerErrorException(updateError.message)

    if (conversation.contact_id) {
      await this.leadService.upsertForConversation({
        workspaceId: input.workspaceId,
        conversationId: input.conversationId,
        contactId: conversation.contact_id,
        sourceChannelId: conversation.channel_id,
        ownerId: conversation.assigned_to,
        status: 'open',
      })
    }

    return {
      conversation: {
        ...updatedConversation,
        routing_reason: canViewReasoning(input.role) ? updatedConversation.routing_reason : '',
      },
      recommendation: recommendation
        ? {
            ...recommendation,
            reasoning: canViewReasoning(input.role) ? recommendation.routingReasonRaw : null,
          }
        : null,
    }
  }
}

