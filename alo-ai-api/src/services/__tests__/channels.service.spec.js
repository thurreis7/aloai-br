process.env.TS_NODE_PROJECT = require('node:path').resolve(__dirname, '../../../tsconfig.json')
require('../../../node_modules/ts-node/register/transpile-only')
require('reflect-metadata')

jest.mock('../../utils/encryption.util', () => ({
  encrypt: jest.fn(() => 'encrypted-config'),
  decrypt: jest.fn(() => JSON.stringify({ instanceName: 'workspace_workspace-1', apikey: 'secret-key' })),
}))

const { encrypt } = require('../../utils/encryption.util')
const { ChannelsService } = require('../channels.service')

// ref: ALOAI-v1-spec.md Section 9.1 WhatsApp

function createSupabaseMock(terminals = {}) {
  const calls = { inserts: [], updates: [], eqs: [], froms: [] }
  const queues = Object.fromEntries(Object.entries(terminals).map(([key, value]) => [key, [...value]]))
  const next = (key, fallback = { data: null, error: null }) => (queues[key]?.length ? queues[key].shift() : fallback)

  const from = jest.fn((table) => {
    calls.froms.push(table)
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
      order: jest.fn(() => builder),
      limit: jest.fn(() => builder),
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
      maybeSingle: jest.fn(() => Promise.resolve(next(`${table}.maybeSingle`))),
      single: jest.fn(() => Promise.resolve(next(`${table}.${builder.op}.single`, { data: { id: 'channel-1' }, error: null }))),
      then: (resolve, reject) => Promise.resolve({ data: null, error: null }).then(resolve, reject),
    }
    return builder
  })

  return { admin: { from }, calls }
}

describe('ChannelsService WhatsApp contracts', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      EVOLUTION_API_URL: 'https://evolution.example',
      EVOLUTION_API_KEY: 'secret-key',
    }
    global.fetch = jest.fn(async (url) => ({
      ok: true,
      json: async () => (
        String(url).includes('/connectionState/')
          ? { state: 'open' }
          : { qrcode: { base64: 'qr-code' } }
      ),
    }))
  })

  afterEach(() => {
    process.env = originalEnv
    jest.clearAllMocks()
  })

  it('connect() calls Evolution API POST /instance/create', async () => {
    const supabase = createSupabaseMock({
      'channels.maybeSingle': [{ data: null, error: null }],
      'channels.insert.single': [{ data: { id: 'channel-1' }, error: null }],
    })
    const service = new ChannelsService(supabase)

    await service.connectWhatsapp('workspace-1')

    expect(global.fetch).toHaveBeenCalledWith(
      'https://evolution.example/instance/create',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it.each([
    ['open', 'connected'],
    ['connecting', 'connecting'],
    ['close', 'disconnected'],
  ])("getStatus() maps '%s' to '%s'", async (evolutionState, expectedStatus) => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ state: evolutionState }) }))
    const supabase = createSupabaseMock({
      'channels.maybeSingle': [{
        data: { id: 'channel-1', workspace_id: 'workspace-1', type: 'whatsapp', config: 'encrypted-config', external_instance_id: 'workspace_workspace-1' },
        error: null,
      }],
    })
    const service = new ChannelsService(supabase)

    const result = await service.getWhatsappStatus('workspace-1', 'channel-1')

    expect(result.status).toBe(expectedStatus)
    expect(supabase.calls.updates.find((item) => item.table === 'channels').payload.status).toBe(expectedStatus)
  })

  it('disconnect() calls Evolution API DELETE and sets status disconnected without deleting row', async () => {
    const supabase = createSupabaseMock({
      'channels.maybeSingle': [{
        data: { id: 'channel-1', workspace_id: 'workspace-1', type: 'whatsapp', config: 'encrypted-config', external_instance_id: 'workspace_workspace-1' },
        error: null,
      }],
    })
    const service = new ChannelsService(supabase)

    await service.disconnectChannel('workspace-1', 'channel-1')

    expect(global.fetch).toHaveBeenCalledWith(
      'https://evolution.example/instance/delete/workspace_workspace-1',
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(supabase.calls.updates.find((item) => item.table === 'channels').payload.status).toBe('disconnected')
    expect(supabase.admin.from).not.toHaveBeenCalledWith('delete')
  })

  it('config is encrypted before insert and plaintext is not stored', async () => {
    const supabase = createSupabaseMock({
      'channels.maybeSingle': [{ data: null, error: null }],
      'channels.insert.single': [{ data: { id: 'channel-1' }, error: null }],
    })
    const service = new ChannelsService(supabase)

    await service.connectWhatsapp('workspace-1')

    const insert = supabase.calls.inserts.find((item) => item.table === 'channels')
    expect(encrypt).toHaveBeenCalled()
    expect(insert.payload.config).toBe('encrypted-config')
    expect(insert.payload.config).not.toContain('secret-key')
  })

  it('all queries include workspace_id', async () => {
    const supabase = createSupabaseMock({
      'channels.maybeSingle': [{ data: null, error: null }],
      'channels.insert.single': [{ data: { id: 'channel-1' }, error: null }],
    })
    const service = new ChannelsService(supabase)

    await service.connectWhatsapp('workspace-1')

    expect(supabase.calls.eqs.some((item) => item.table === 'channels' && item.column === 'workspace_id' && item.value === 'workspace-1')).toBe(true)
    expect(supabase.calls.inserts.find((item) => item.table === 'channels').payload.workspace_id).toBe('workspace-1')
  })
})
