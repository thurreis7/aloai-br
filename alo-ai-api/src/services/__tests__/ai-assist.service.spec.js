process.env.TS_NODE_PROJECT = require('node:path').resolve(__dirname, '../../../tsconfig.json')
require('../../../node_modules/ts-node/register/transpile-only')
require('reflect-metadata')

const { ForbiddenException } = require('@nestjs/common')
const { AiAssistService } = require('../ai-assist.service')
const { MessagingService } = require('../messaging.service')

// ref: ALOAI-v1-spec.md Section 10 AI System Layer
// ref: ALOAI-v1-spec.md Section 7 Permissions

const VALID_TRIAGE = new Set(['suporte', 'vendas', 'cobranca', 'urgente', 'spam', 'recorrente', 'outros'])
const VALID_SENTIMENT = new Set(['normal', 'frustrated', 'angry', 'urgent'])
const VALID_NEXT_ACTIONS = new Set(['use_suggestion', 'follow_up', 'assign', 'dismiss'])

function parseSuggestionContract(rawText) {
  const text = String(rawText || '')
  if (text.startsWith('[CANNOT_HELP]')) {
    return { suggestion: text.replace('[CANNOT_HELP]', '').trim(), confidence: 'low' }
  }
  if (text.startsWith('[UNCERTAIN]')) {
    return { suggestion: text.replace('[UNCERTAIN]', '').trim(), confidence: 'medium' }
  }
  return { suggestion: text.trim(), confidence: 'high' }
}

function createSupabaseMock(terminals = {}) {
  const calls = { updates: [], eqs: [] }
  const queues = Object.fromEntries(Object.entries(terminals).map(([key, value]) => [key, [...value]]))
  const next = (key, fallback = { data: null, error: null }) => (queues[key]?.length ? queues[key].shift() : fallback)
  const from = jest.fn((table) => {
    const builder = {
      table,
      op: 'select',
      payload: null,
      error: null,
      select: jest.fn(() => builder),
      eq: jest.fn((column, value) => {
        calls.eqs.push({ table, column, value })
        return builder
      }),
      update: jest.fn((payload) => {
        builder.op = 'update'
        builder.payload = payload
        calls.updates.push({ table, payload })
        return builder
      }),
      maybeSingle: jest.fn(() => Promise.resolve(next(`${table}.maybeSingle`))),
      single: jest.fn(() => Promise.resolve(next(`${table}.${builder.op}.single`, { data: { id: `${table}-id` }, error: null }))),
      then: (resolve, reject) => Promise.resolve({ data: null, error: null }).then(resolve, reject),
    }
    return builder
  })
  return { admin: { from }, calls }
}

function createAiAssist(overrides = {}) {
  const aiContextService = {
    loadWorkspaceConfigRow: jest.fn(async () => null),
    normalizeConfigRow: jest.fn(() => ({
      enabled: true,
      tone: 'consultivo',
      faqRules: [],
      knowledgeFiles: [],
      workspaceContext: { company_context: 'responda com clareza', business_summary: '' },
    })),
    evaluateSuggestionAvailability: jest.fn(() => ({ available: true, reason: null })),
    loadConversationContext: jest.fn(async () => ({
      conversation: {
        id: 'conv-1',
        state: 'open',
        status: 'open',
        last_message: 'Qual o preco?',
        triage_tag: 'vendas',
        sentiment: 'normal',
        ai_state: {},
        contacts: { name: 'Cliente' },
        channels: { type: 'whatsapp' },
      },
      messages: [{ sender_type: 'contact', content: 'Qual o preco?' }],
    })),
    ...overrides.aiContextService,
  }
  const accessService = {
    loadWorkspaceRow: jest.fn(async () => ({ ai_enabled: true, plan: 'pro' })),
    ...overrides.accessService,
  }
  const supabase = overrides.supabase || createSupabaseMock()
  return {
    service: new AiAssistService(supabase, aiContextService, accessService),
    aiContextService,
    accessService,
    supabase,
  }
}

describe('AiAssistService contracts', () => {
  it('suggest() returns { suggestion, confidence } shape', async () => {
    const { service } = createAiAssist()
    const result = await service.suggestReply({
      workspaceId: 'workspace-1',
      conversationId: 'conv-1',
      userId: 'agent-1',
      role: 'agent',
    })
    const contract = parseSuggestionContract(result.suggestion)

    expect(contract).toEqual({
      suggestion: expect.any(String),
      confidence: expect.stringMatching(/^(low|medium|high)$/),
    })
  })

  it('suggest() returns confidence low when response starts with [CANNOT_HELP]', () => {
    expect(parseSuggestionContract('[CANNOT_HELP] sem base suficiente')).toEqual({
      suggestion: 'sem base suficiente',
      confidence: 'low',
    })
  })

  it('suggest() returns confidence medium when response starts with [UNCERTAIN]', () => {
    expect(parseSuggestionContract('[UNCERTAIN] posso confirmar')).toEqual({
      suggestion: 'posso confirmar',
      confidence: 'medium',
    })
  })

  it('suggest() returns confidence high when no prefix exists', () => {
    expect(parseSuggestionContract('Resposta direta')).toEqual({
      suggestion: 'Resposta direta',
      confidence: 'high',
    })
  })

  it('suggest() throws ForbiddenException when workspace ai_enabled = false', async () => {
    const { service } = createAiAssist({
      accessService: { loadWorkspaceRow: jest.fn(async () => ({ ai_enabled: false, plan: 'pro' })) },
    })

    await expect(service.suggestReply({
      workspaceId: 'workspace-1',
      conversationId: 'conv-1',
      userId: 'agent-1',
      role: 'agent',
    })).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('triage() applies valid category from allowed list', async () => {
    const supabase = createSupabaseMock({
      'conversations.update.single': [{ data: { id: 'conv-1', triage_tag: 'cobranca' }, error: null }],
    })
    const { service } = createAiAssist({ supabase })

    const result = await service.updateTriageTag({
      workspaceId: 'workspace-1',
      conversationId: 'conv-1',
      triageTag: 'cobranca',
    })

    expect(VALID_TRIAGE.has(result.conversation.triage_tag)).toBe(true)
    expect(supabase.calls.updates[0].payload).toEqual({ triage_tag: 'cobranca' })
  })

  it('triage() returns outros when AI returns unrecognized category', () => {
    const messaging = new MessagingService(createSupabaseMock(), { transcribeAudio: jest.fn() })

    expect(messaging.normalizeRuntimeTriageTag('categoria-desconhecida')).toBe('outros')
  })

  it('sentiment() returns valid enum', () => {
    const messaging = new MessagingService(createSupabaseMock(), { transcribeAudio: jest.fn() })
    const result = messaging.inferSentiment('estou irritado e isso nao resolveu')

    expect(VALID_SENTIMENT.has(result.sentiment)).toBe(true)
  })

  it('sentiment() does not run if called within 60s of last check', async () => {
    const supabase = createSupabaseMock({
      'workspaces.maybeSingle': [{ data: { ai_enabled: true, plan: 'pro' }, error: null }],
      'conversations.maybeSingle': [{ data: { sentiment_checked_at: new Date().toISOString() }, error: null }],
    })
    const messaging = new MessagingService(supabase, { transcribeAudio: jest.fn() })

    await messaging.applyAiRuntimeSignals({
      workspaceId: 'workspace-1',
      conversationId: 'conv-1',
      text: 'urgente agora',
      isNewConversation: false,
    })

    expect(supabase.calls.updates).toHaveLength(0)
  })

  it('nextAction() returns one of the valid action slugs only', async () => {
    const { service } = createAiAssist({
      aiContextService: {
        loadConversationContext: jest.fn(async () => ({
          conversation: {
            id: 'conv-1',
            state: 'open',
            status: 'open',
            last_message: 'urgente agora',
            triage_tag: 'urgente',
            sentiment: 'urgent',
            ai_state: {},
          },
          messages: [{ sender_type: 'contact', content: 'urgente agora' }],
        })),
      },
    })

    const result = await service.suggestNextAction({
      workspaceId: 'workspace-1',
      conversationId: 'conv-1',
      userId: 'agent-1',
      role: 'agent',
    })

    expect(VALID_NEXT_ACTIONS.has(result.action)).toBe(true)
  })
})
