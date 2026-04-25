import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { SupabaseService } from './supabase.service'

const DEFAULT_CHANNEL_POLICY = {
  whatsapp: true,
  instagram: false,
  email: true,
  webchat: true,
}

const DEFAULT_SCHEDULE_POLICY = {
  mode: 'always',
  timezone: 'America/Sao_Paulo',
  days: [1, 2, 3, 4, 5],
  start: '08:00',
  end: '20:00',
  summary: '08:00 - 20:00',
}

const DEFAULT_WORKSPACE_CONTEXT = {
  company_context: '',
  business_summary: '',
  restrictions: '',
}

function normalizeChannelType(type: string) {
  const normalized = String(type || '').trim().toLowerCase()
  if (normalized === 'gmail') return 'email'
  return normalized
}

function parseTimeString(value: string, fallback: string) {
  const candidate = String(value || '').trim()
  if (/^\d{2}:\d{2}$/.test(candidate)) return candidate
  return fallback
}

function coerceBoolean(value: any, fallback: boolean) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value === 'true') return true
    if (value === 'false') return false
  }
  return fallback
}

function normalizeWorkspaceContext(input: any = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  return {
    company_context: String(source.company_context ?? source.companyContext ?? DEFAULT_WORKSPACE_CONTEXT.company_context),
    business_summary: String(source.business_summary ?? source.businessSummary ?? DEFAULT_WORKSPACE_CONTEXT.business_summary),
    restrictions: String(source.restrictions ?? DEFAULT_WORKSPACE_CONTEXT.restrictions),
  }
}

function normalizeFaqRules(input: any): Array<{ id: string; question: string; answer: string }> {
  const items = Array.isArray(input) ? input : []
  return items
    .map((item, index) => {
      const question = String(item?.question ?? item?.q ?? '').trim()
      const answer = String(item?.answer ?? item?.a ?? '').trim()
      if (!question || !answer) return null
      return {
        id: String(item?.id || `faq-${index + 1}`),
        question,
        answer,
      }
    })
    .filter(Boolean) as Array<{ id: string; question: string; answer: string }>
}

function normalizeKnowledgeFiles(input: any) {
  const items = Array.isArray(input) ? input : []
  return items
    .map((item) => {
      const path = String(item?.path ?? item?.id ?? '').trim()
      if (!path) return null
      return {
        path,
        name: String(item?.name || path.split('/').pop() || 'arquivo'),
        size: Number(item?.size ?? item?.metadata?.size ?? 0) || 0,
        content_type: String(item?.content_type ?? item?.contentType ?? item?.metadata?.mimetype ?? ''),
        uploaded_at: String(item?.uploaded_at ?? item?.uploadedAt ?? new Date().toISOString()),
      }
    })
    .filter(Boolean)
}

function normalizeChannelPolicy(input: any, channels?: any) {
  if (Array.isArray(channels)) {
    const allowed = new Set(channels.map((item) => normalizeChannelType(item)).filter(Boolean))
    return {
      whatsapp: allowed.has('whatsapp'),
      instagram: allowed.has('instagram'),
      email: allowed.has('email'),
      webchat: allowed.has('webchat'),
    }
  }

  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  return {
    whatsapp: coerceBoolean(source.whatsapp, DEFAULT_CHANNEL_POLICY.whatsapp),
    instagram: coerceBoolean(source.instagram, DEFAULT_CHANNEL_POLICY.instagram),
    email: coerceBoolean(source.email, DEFAULT_CHANNEL_POLICY.email),
    webchat: coerceBoolean(source.webchat, DEFAULT_CHANNEL_POLICY.webchat),
  }
}

function normalizeSchedulePolicy(input: any, legacySchedule?: any) {
  const inferRangeFromSummary = (summary: string) => {
    const match = String(summary || '').match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
    if (!match) return null
    return { start: match[1], end: match[2] }
  }

  if (typeof input === 'string' || typeof legacySchedule === 'string') {
    const summary = String(input || legacySchedule || DEFAULT_SCHEDULE_POLICY.summary).trim()
    const inferredRange = inferRangeFromSummary(summary)
    return {
      ...DEFAULT_SCHEDULE_POLICY,
      mode: 'window',
      start: inferredRange?.start || DEFAULT_SCHEDULE_POLICY.start,
      end: inferredRange?.end || DEFAULT_SCHEDULE_POLICY.end,
      summary,
    }
  }

  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  const days = Array.isArray(source.days) ? source.days.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item >= 0 && item <= 6) : DEFAULT_SCHEDULE_POLICY.days
  const summary = String(source.summary || legacySchedule || DEFAULT_SCHEDULE_POLICY.summary)
  const inferredRange = inferRangeFromSummary(summary)
  return {
    mode: ['always', 'window', 'paused'].includes(String(source.mode || '')) ? String(source.mode) : DEFAULT_SCHEDULE_POLICY.mode,
    timezone: String(source.timezone || DEFAULT_SCHEDULE_POLICY.timezone),
    days: days.length ? days : DEFAULT_SCHEDULE_POLICY.days,
    start: parseTimeString(String(source.start || inferredRange?.start || ''), DEFAULT_SCHEDULE_POLICY.start),
    end: parseTimeString(String(source.end || inferredRange?.end || ''), DEFAULT_SCHEDULE_POLICY.end),
    summary,
  }
}

function normalizeConfidenceThreshold(value: any, fallback = 0.7) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(0.999, Math.max(0.1, Number(numeric.toFixed(3))))
}

function weekdayToNumber(value: string) {
  const map: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  }
  return map[value.toLowerCase()] ?? 0
}

function getZonedClock(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const parts = formatter.formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    day: weekdayToNumber(String(values.weekday || 'sun')),
    clock: `${values.hour || '00'}:${values.minute || '00'}`,
  }
}

function isClockWithinWindow(clock: string, start: string, end: string) {
  if (!/^\d{2}:\d{2}$/.test(clock) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return true
  if (start <= end) return clock >= start && clock <= end
  return clock >= start || clock <= end
}

@Injectable()
export class AiContextService {
  constructor(private readonly supabase: SupabaseService) {}

  getDefaultConfig(workspaceId: string) {
    return {
      workspaceId,
      enabled: false,
      autoReplyEnabled: false,
      confidenceThreshold: 0.7,
      tone: 'consultivo',
      workspaceContext: { ...DEFAULT_WORKSPACE_CONTEXT },
      faqRules: [],
      knowledgeFiles: [],
      channelPolicy: { ...DEFAULT_CHANNEL_POLICY },
      schedulePolicy: { ...DEFAULT_SCHEDULE_POLICY },
    }
  }

  normalizeConfigRow(workspaceId: string, row?: any) {
    if (!row) return this.getDefaultConfig(workspaceId)

    return {
      id: row.id,
      workspaceId,
      enabled: Boolean(row.enabled),
      autoReplyEnabled: Boolean(row.auto_reply_enabled),
      confidenceThreshold: normalizeConfidenceThreshold(row.confidence_threshold, 0.7),
      tone: String(row.tone || 'consultivo'),
      workspaceContext: normalizeWorkspaceContext(row.workspace_context),
      faqRules: normalizeFaqRules(row.faq_rules),
      knowledgeFiles: normalizeKnowledgeFiles(row.knowledge_files),
      channelPolicy: normalizeChannelPolicy(row.channel_policy),
      schedulePolicy: normalizeSchedulePolicy(row.schedule_policy),
      updatedAt: row.updated_at || null,
      createdAt: row.created_at || null,
    }
  }

  buildPatchPayload(workspaceId: string, current: any, patch: any) {
    const base = this.normalizeConfigRow(workspaceId, current)
    const workspaceContext = patch?.workspaceContext || patch?.workspace_context
    const faqRules = patch?.faqRules || patch?.faq_rules
    const knowledgeFiles = patch?.knowledgeFiles || patch?.knowledge_files
    const channelPolicy = patch?.channelPolicy || patch?.channel_policy
    const schedulePolicy = patch?.schedulePolicy || patch?.schedule_policy

    return {
      workspace_id: workspaceId,
      company_id: workspaceId,
      enabled: patch?.enabled === undefined ? base.enabled : Boolean(patch.enabled),
      auto_reply_enabled: patch?.autoReplyEnabled === undefined && patch?.auto_reply_enabled === undefined
        ? base.autoReplyEnabled
        : Boolean(patch?.autoReplyEnabled ?? patch?.auto_reply_enabled),
      confidence_threshold: patch?.confidenceThreshold === undefined && patch?.confidence_threshold === undefined
        ? base.confidenceThreshold
        : normalizeConfidenceThreshold(patch?.confidenceThreshold ?? patch?.confidence_threshold, base.confidenceThreshold),
      tone: String(patch?.tone || base.tone || 'consultivo'),
      workspace_context: workspaceContext === undefined ? base.workspaceContext : normalizeWorkspaceContext(workspaceContext),
      faq_rules: faqRules === undefined ? base.faqRules : normalizeFaqRules(faqRules),
      knowledge_files: knowledgeFiles === undefined ? base.knowledgeFiles : normalizeKnowledgeFiles(knowledgeFiles),
      channel_policy: channelPolicy === undefined && patch?.channels === undefined
        ? base.channelPolicy
        : normalizeChannelPolicy(channelPolicy, patch?.channels),
      schedule_policy: schedulePolicy === undefined && patch?.schedule === undefined
        ? base.schedulePolicy
        : normalizeSchedulePolicy(schedulePolicy, patch?.schedule),
    }
  }

  async loadWorkspaceConfigRow(workspaceId: string) {
    const { data, error } = await this.supabase.admin
      .from('ai_workspace_configs')
      .select('id, workspace_id, enabled, auto_reply_enabled, confidence_threshold, tone, workspace_context, faq_rules, knowledge_files, channel_policy, schedule_policy, created_at, updated_at')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) throw new InternalServerErrorException(error.message)
    return data || null
  }

  async loadConversationContext(workspaceId: string, conversationId: string) {
    const { data: conversation, error: conversationError } = await this.supabase.admin
      .from('conversations')
      .select(`
        id, workspace_id, state, status, priority, ai_state, last_message, last_message_at,
        contacts ( id, name, phone, email, company ),
        channels ( id, type, name )
      `)
      .eq('workspace_id', workspaceId)
      .eq('id', conversationId)
      .maybeSingle()

    if (conversationError) throw new InternalServerErrorException(conversationError.message)
    if (!conversation) throw new NotFoundException('Conversa nao encontrada.')

    const { data: messages, error: messagesError } = await this.supabase.admin
      .from('messages')
      .select('id, sender_type, direction, content, created_at')
      .eq('workspace_id', workspaceId)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    if (messagesError) throw new InternalServerErrorException(messagesError.message)

    return {
      conversation,
      messages: messages || [],
    }
  }

  evaluateSuggestionAvailability(config: any, channelType: string, date = new Date()) {
    if (!config.enabled) {
      return { available: false, reason: 'IA pausada neste workspace.' }
    }

    const normalizedChannel = normalizeChannelType(channelType)
    if (normalizedChannel && config.channelPolicy?.[normalizedChannel] === false) {
      return { available: false, reason: `Sugestoes desativadas para o canal ${normalizedChannel}.` }
    }

    const schedulePolicy = config.schedulePolicy || DEFAULT_SCHEDULE_POLICY
    if (schedulePolicy.mode === 'paused') {
      return { available: false, reason: 'Sugestoes pausadas pela janela operacional.' }
    }

    if (schedulePolicy.mode === 'window') {
      const zoned = getZonedClock(date, schedulePolicy.timezone || DEFAULT_SCHEDULE_POLICY.timezone)
      const allowedDays = Array.isArray(schedulePolicy.days) && schedulePolicy.days.length ? schedulePolicy.days : DEFAULT_SCHEDULE_POLICY.days
      if (!allowedDays.includes(zoned.day) || !isClockWithinWindow(zoned.clock, schedulePolicy.start || DEFAULT_SCHEDULE_POLICY.start, schedulePolicy.end || DEFAULT_SCHEDULE_POLICY.end)) {
        return { available: false, reason: 'Fora da janela configurada para sugestoes.' }
      }
    }

    return { available: true, reason: null }
  }
}
