process.env.TS_NODE_PROJECT = require('node:path').resolve(__dirname, '../../../tsconfig.json')
require('../../../node_modules/ts-node/register/transpile-only')
require('reflect-metadata')

const { ConversationService } = require('../conversation.service')
const { MessagingService } = require('../messaging.service')

// ref: ALOAI-v1-spec.md Section 5 M01
// ref: ALOAI-v1-spec.md Section 8

function createSupabaseMock(terminals = {}) {
  const calls = { inserts: [], updates: [], eqs: [], froms: [], upserts: [] }
  const queues = Object.fromEntries(Object.entries(terminals).map(([key, value]) => [key, [...value]]))
  const next = (key, fallback = { data: null, error: null }) => (queues[key]?.length ? queues[key].shift() : fallback)

  const from = jest.fn((table) => {
    calls.froms.push(table)
    const builder = {
      table,
      op: 'select',
      payload: null,
      data: null,
      error: null,
      select: jest.fn(() => builder),
      eq: jest.fn((column, value) => {
        calls.eqs.push({ table, column, value })
        return builder
      }),
      neq: jest.fn(() => builder),
      is: jest.fn((column, value) => {
        calls.eqs.push({ table, column, value })
        return builder
      }),
      order: jest.fn(() => builder),
      limit: jest.fn(() => builder),
      or: jest.fn(() => builder),
      like: jest.fn(() => builder),
      insert: jest.fn((payload) => {
        builder.op = 'insert'
        builder.payload = payload
        calls.inserts.push({ table, payload })
        return builder
      }),
      update: jest.fn((payload) => {
        builder.op = 'update'
        builder.payload = payload
        calls.updates.push({ table, payload })
        return builder
      }),
      upsert: jest.fn((payload) => {
        builder.op = 'upsert'
        builder.payload = payload
        calls.upserts.push({ table, payload })
        return builder
      }),
      maybeSingle: jest.fn(() => Promise.resolve(next(`${table}.maybeSingle`))),
      single: jest.fn(() => Promise.resolve(next(`${table}.${builder.op}.single`, { data: { id: `${table}-id` }, error: null }))),
      then: (resolve, reject) => Promise.resolve({ data: builder.data, error: builder.error }).then(resolve, reject),
    }
    return builder
  })

  return { admin: { from }, calls }
}

function inboundPayload(overrides = {}) {
  return {
    event: 'messages.upsert',
    instance: 'workspace_workspace-1',
    data: {
      key: { id: overrides.id || 'msg-1', remoteJid: '5511999999999@s.whatsapp.net', fromMe: false },
      messageTimestamp: 1710000000,
      message: overrides.message || { conversation: overrides.text || 'Preciso de suporte' },
    },
    mediaUrl: overrides.mediaUrl,
  }
}

function defaultInboundSupabase(overrides = {}) {
  return createSupabaseMock({
    'messages.maybeSingle': overrides.messageLookups || [
      { data: null, error: null },
      { data: null, error: null },
    ],
    'contacts.maybeSingle': [{ data: { id: 'contact-1' }, error: null }],
    'conversations.maybeSingle': [overrides.conversation || { data: { id: 'conv-1', unread_count: 2 }, error: null }],
    'messages.insert.single': [{ data: { id: 'saved-message-1' }, error: null }],
    'workspaces.maybeSingle': [{ data: { ai_enabled: false, plan: 'starter' }, error: null }],
  })
}

describe('MessagingService inbound and conversation message contracts', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('inbound message saves with sender_type = contact', async () => {
    const supabase = defaultInboundSupabase()
    const service = new MessagingService(supabase, { transcribeAudio: jest.fn() })

    await service.processInboundMessageUnsafe(inboundPayload(), { id: 'channel-1', workspace_id: 'workspace-1' })

    const messageInsert = supabase.calls.inserts.find((item) => item.table === 'messages')
    expect(messageInsert.payload.sender_type).toBe('contact')
  })

  it('inbound message increments unread_count only for sender_type = contact', async () => {
    const supabase = defaultInboundSupabase()
    const service = new MessagingService(supabase, { transcribeAudio: jest.fn() })

    await service.processInboundMessageUnsafe(inboundPayload(), { id: 'channel-1', workspace_id: 'workspace-1' })

    const conversationUpdate = supabase.calls.updates.find((item) => item.table === 'conversations')
    expect(conversationUpdate.payload.unread_count).toBe(3)
  })

  it('inbound audio message triggers transcription without awaiting it', async () => {
    const supabase = defaultInboundSupabase()
    const pendingTranscription = new Promise(() => {})
    const transcriptionService = { transcribeAudio: jest.fn(() => pendingTranscription) }
    const service = new MessagingService(supabase, transcriptionService)

    const result = await Promise.race([
      service.processInboundMessageUnsafe(
        inboundPayload({
          id: 'audio-1',
          message: { audioMessage: { url: 'https://media.example/audio.ogg' } },
          mediaUrl: 'https://media.example/audio.ogg',
        }),
        { id: 'channel-1', workspace_id: 'workspace-1' },
      ),
      new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 50)),
    ])

    expect(result).toEqual({ ok: true })
    expect(transcriptionService.transcribeAudio).toHaveBeenCalledWith('saved-message-1', 'https://media.example/audio.ogg', 'workspace-1')
  })

  it('duplicate channel_message_id is discarded idempotently', async () => {
    const supabase = defaultInboundSupabase({
      messageLookups: [{ data: { id: 'existing-message' }, error: null }],
    })
    const service = new MessagingService(supabase, { transcribeAudio: jest.fn() })

    const result = await service.processInboundMessageUnsafe(inboundPayload(), { id: 'channel-1', workspace_id: 'workspace-1' })

    expect(result).toEqual({ ok: true, duplicate: true })
    expect(supabase.calls.inserts.some((item) => item.table === 'messages')).toBe(false)
  })

  it('internal note does not call Evolution API provider', async () => {
    const supabase = createSupabaseMock({
      'conversations.maybeSingle': [{
        data: {
          id: 'conv-1',
          workspace_id: 'workspace-1',
          assigned_to: 'agent-1',
          first_response_at: null,
          contacts: { phone: '5511999999999' },
          channels: { type: 'whatsapp', config: { instance: 'workspace-1' } },
        },
        error: null,
      }],
      'messages.insert.single': [{ data: { id: 'note-1', is_internal_note: true }, error: null }],
    })
    const messagingService = { sendWhatsappMessage: jest.fn() }
    const service = new ConversationService(supabase, messagingService, { evaluateConversation: jest.fn() })

    await service.sendConversationMessage({
      workspaceId: 'workspace-1',
      conversationId: 'conv-1',
      userId: 'agent-1',
      role: 'agent',
      text: 'Nota interna',
      isInternalNote: true,
    })

    expect(messagingService.sendWhatsappMessage).not.toHaveBeenCalled()
    expect(supabase.calls.inserts.find((item) => item.table === 'messages').payload.is_internal_note).toBe(true)
  })

  it('internal note does not increment unread_count', async () => {
    const supabase = createSupabaseMock({
      'conversations.maybeSingle': [{
        data: {
          id: 'conv-1',
          workspace_id: 'workspace-1',
          assigned_to: 'agent-1',
          unread_count: 4,
          first_response_at: null,
          contacts: { phone: '5511999999999' },
          channels: { type: 'whatsapp', config: { instance: 'workspace-1' } },
        },
        error: null,
      }],
      'messages.insert.single': [{ data: { id: 'note-1', is_internal_note: true }, error: null }],
    })
    const service = new ConversationService(supabase, { sendWhatsappMessage: jest.fn() }, { evaluateConversation: jest.fn() })

    await service.sendConversationMessage({
      workspaceId: 'workspace-1',
      conversationId: 'conv-1',
      userId: 'agent-1',
      role: 'agent',
      text: 'Nota interna',
      isInternalNote: true,
    })

    expect(supabase.calls.updates.filter((item) => item.table === 'conversations')).toHaveLength(0)
  })

  it('first_response_at is set on first agent message and not updated on subsequent messages', async () => {
    const supabase = createSupabaseMock({
      'conversations.maybeSingle': [
        {
          data: {
            id: 'conv-1',
            workspace_id: 'workspace-1',
            assigned_to: 'agent-1',
            first_response_at: null,
            contacts: { phone: null },
            channels: { type: 'email', config: {} },
          },
          error: null,
        },
        {
          data: {
            id: 'conv-1',
            workspace_id: 'workspace-1',
            assigned_to: 'agent-1',
            first_response_at: '2026-06-01T10:00:00.000Z',
            contacts: { phone: null },
            channels: { type: 'email', config: {} },
          },
          error: null,
        },
      ],
      'messages.insert.single': [
        { data: { id: 'msg-agent-1' }, error: null },
        { data: { id: 'msg-agent-2' }, error: null },
      ],
      'conversations.update.single': [
        { data: { id: 'conv-1', first_response_at: '2026-06-14T10:00:00.000Z' }, error: null },
        { data: { id: 'conv-1', first_response_at: '2026-06-01T10:00:00.000Z' }, error: null },
      ],
    })
    const service = new ConversationService(supabase, { sendWhatsappMessage: jest.fn() }, { evaluateConversation: jest.fn() })

    await service.sendConversationMessage({
      workspaceId: 'workspace-1',
      conversationId: 'conv-1',
      userId: 'agent-1',
      role: 'agent',
      text: 'Primeira resposta',
    })
    await service.sendConversationMessage({
      workspaceId: 'workspace-1',
      conversationId: 'conv-1',
      userId: 'agent-1',
      role: 'agent',
      text: 'Segunda resposta',
    })

    const firstResponseUpdates = supabase.calls.updates.filter((item) => (
      item.table === 'conversations'
      && Object.prototype.hasOwnProperty.call(item.payload, 'first_response_at')
    ))
    expect(firstResponseUpdates).toHaveLength(1)
  })
})
