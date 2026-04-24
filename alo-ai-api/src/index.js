import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const app = Fastify({ logger: true })
await app.register(cors, { origin: true })

const adminSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeChannelType(type) {
  const normalized = String(type || '').trim().toLowerCase()
  if (!normalized) return ''
  if (normalized === 'gmail') return 'email'
  return normalized
}

function getChannelName(type) {
  const normalized = normalizeChannelType(type)
  if (normalized === 'whatsapp') return 'WhatsApp Business'
  if (normalized === 'instagram') return 'Instagram'
  if (normalized === 'email') return 'E-mail'
  if (normalized === 'webchat') return 'Web Chat'
  return normalized || 'Canal'
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || ''
  const [, token] = authHeader.match(/^Bearer\s+(.+)$/i) || []
  return token || null
}

async function getRequestUser(req) {
  const token = getBearerToken(req)
  if (!token) throw new Error('Sessao ausente.')

  const { data, error } = await adminSupabase.auth.getUser(token)
  if (error || !data?.user) throw new Error('Sessao invalida.')

  return data.user
}

async function loadAccessContext(userId) {
  const userRes = await adminSupabase
    .from('users')
    .select('id, role, company_id, name, email')
    .eq('id', userId)
    .maybeSingle()

  if (userRes.error || !userRes.data) {
    return {
      profile: null,
      isOwner: false,
      role: 'agent',
      companyId: null,
    }
  }

  const profile = userRes.data
  const isOwner = profile.role === 'owner'

  return {
    profile,
    isOwner,
    role: profile.role || 'agent',
    companyId: profile.company_id || null,
  }
}

async function requireAuthenticated(req, reply) {
  try {
    req.currentUser = await getRequestUser(req)
    req.accessContext = await loadAccessContext(req.currentUser.id)
    return true
  } catch (error) {
    reply.status(401).send({ error: error.message || 'Nao autenticado.' })
    return false
  }
}

async function requireOwner(req, reply) {
  const ok = await requireAuthenticated(req, reply)
  if (!ok) return false

  if (!req.accessContext?.isOwner) {
    reply.status(403).send({ error: 'Apenas o owner global pode executar esta acao.' })
    return false
  }

  return true
}

async function hasCompanyAccess(userId, companyId) {
  const context = await loadAccessContext(userId)
  if (context.isOwner) return true
  return context.companyId === companyId
}

function normalizeClient(item) {
  if (!item?.id) return null
  const name = item.company_name || item.name || item.slug || `Cliente ${String(item.id).slice(0, 8)}`
  return {
    id: item.id,
    name,
    company_name: item.company_name || item.name || name,
    slug: item.slug || null,
    plan: item.plan || null,
    ai_enabled: Boolean(item.ai_enabled),
    created_by: item.created_by || null,
    created_at: item.created_at || null,
  }
}

function uniqueClients(items) {
  const map = new Map()
  items.forEach((item) => {
    const normalized = normalizeClient(item)
    if (normalized?.id && !map.has(normalized.id)) map.set(normalized.id, normalized)
  })
  return Array.from(map.values())
}

async function listClients() {
  try {
    const workspacesRes = await adminSupabase
      .from('workspaces')
      .select('id, company_name, name, slug, plan, ai_enabled, created_by, created_at')
      .order('created_at', { ascending: true })

    if (!workspacesRes.error) {
      const rows = uniqueClients(workspacesRes.data || [])
      if (rows.length) return rows
    }
  } catch {
    // ignore
  }

  try {
    const companiesRes = await adminSupabase
      .from('companies')
      .select('id, company_name, name, slug, plan, ai_enabled, created_by, created_at')
      .order('created_at', { ascending: true })

    if (!companiesRes.error) {
      const rows = uniqueClients(companiesRes.data || [])
      if (rows.length) return rows
    }
  } catch {
    // ignore
  }

  const usersRes = await adminSupabase
    .from('users')
    .select('company_id')
    .not('company_id', 'is', null)

  if (usersRes.error) return []

  const rows = uniqueClients((usersRes.data || []).map((item) => ({ id: item.company_id })))
  return rows
}

async function createClientRecord({ companyName, plan, aiEnabled, ownerId }) {
  const slug = `${slugify(companyName)}-${Date.now().toString(36)}`

  const companiesPayload = {
    company_name: companyName,
    name: companyName,
    slug,
    plan,
    ai_enabled: aiEnabled,
    created_by: ownerId,
  }

  try {
    const companiesRes = await adminSupabase
      .from('companies')
      .insert(companiesPayload)
      .select('id, company_name, name, slug, plan, ai_enabled, created_by, created_at')
      .single()

    if (!companiesRes.error && companiesRes.data?.id) {
      return normalizeClient(companiesRes.data)
    }
  } catch {
    // ignore
  }

  try {
    const workspacesRes = await adminSupabase
      .from('workspaces')
      .insert(companiesPayload)
      .select('id, company_name, name, slug, plan, ai_enabled, created_by, created_at')
      .single()

    if (!workspacesRes.error && workspacesRes.data?.id) {
      return normalizeClient(workspacesRes.data)
    }
  } catch {
    // ignore
  }

  const id = randomUUID()
  return normalizeClient({
    id,
    company_name: companyName,
    name: companyName,
    slug,
    plan,
    ai_enabled: aiEnabled,
    created_by: ownerId,
    created_at: new Date().toISOString(),
  })
}

async function upsertUserRecord({ userId, email, fullName, role, companyId }) {
  const payload = {
    id: userId,
    name: fullName,
    email,
    role,
    company_id: companyId,
  }

  const { error } = await adminSupabase.from('users').upsert(payload)
  if (error) throw new Error(`users: ${error.message}`)
}

async function seedPermissionsIfPossible({ userId, role, companyId }) {
  if (role === 'owner' || role === 'admin') return

  const defaultsByRole = {
    supervisor: {
      perm_channels_view: true,
      perm_channels_respond: true,
      perm_conv_scope: 'all',
      perm_reply: true,
      perm_transfer: true,
      perm_close: true,
      perm_kanban_move: true,
      perm_tags: true,
      perm_history: true,
      perm_kanban_view: true,
      perm_kanban_edit: true,
      perm_reports_metrics: true,
      perm_reports_team: true,
      perm_ai: true,
      perm_manage_users: false,
      perm_connect_channels: false,
      perm_integrations: false,
    },
    agent: {
      perm_channels_view: true,
      perm_channels_respond: true,
      perm_conv_scope: 'own',
      perm_reply: true,
      perm_transfer: false,
      perm_close: false,
      perm_kanban_move: false,
      perm_tags: true,
      perm_history: false,
      perm_kanban_view: true,
      perm_kanban_edit: false,
      perm_reports_metrics: false,
      perm_reports_team: false,
      perm_ai: true,
      perm_manage_users: false,
      perm_connect_channels: false,
      perm_integrations: false,
    },
  }

  const defaults = defaultsByRole[role] || defaultsByRole.agent

  const byCompany = await adminSupabase
    .from('user_permissions')
    .upsert({ ...defaults, user_id: userId, company_id: companyId }, { onConflict: 'user_id,company_id' })

  if (!byCompany.error) return

  await adminSupabase
    .from('user_permissions')
    .upsert({ ...defaults, user_id: userId, workspace_id: companyId }, { onConflict: 'user_id,workspace_id' })
}

async function createCompanyUser({ companyId, companyName, member }) {
  if (!member.name?.trim()) return null

  const email = member.email?.trim() || `${slugify(member.name)}@${slugify(companyName)}.aloai.local`
  const password = member.password?.trim() || `${slugify(companyName)}123`
  const role = member.role === 'admin' ? 'admin' : (member.role === 'supervisor' ? 'supervisor' : 'agent')

  const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: member.name.trim() },
  })

  if (authError) throw new Error(authError.message)

  await upsertUserRecord({
    userId: authUser.user.id,
    email,
    fullName: member.name.trim(),
    role,
    companyId,
  })

  await seedPermissionsIfPossible({ userId: authUser.user.id, role, companyId })

  return {
    id: authUser.user.id,
    full_name: member.name.trim(),
    email,
    role,
    password,
    company_id: companyId,
  }
}

async function tryInsertChannel({ companyId, channel }) {
  const channelType = normalizeChannelType(channel)
  const payload = {
    type: channelType,
    name: getChannelName(channelType),
    is_active: true,
    config: {},
  }

  const byWorkspace = await adminSupabase
    .from('channels')
    .insert({ ...payload, workspace_id: companyId })
    .select('id, type')
    .single()

  if (!byWorkspace.error) return byWorkspace.data

  const byCompany = await adminSupabase
    .from('channels')
    .insert({ ...payload, company_id: companyId })
    .select('id, type')
    .single()

  return byCompany.error ? null : byCompany.data
}

async function tryInsertAuditLog({ companyId, action, resource, resourceId }) {
  const byWorkspace = await adminSupabase
    .from('audit_logs')
    .insert({ workspace_id: companyId, action, resource, resource_id: resourceId })

  if (!byWorkspace.error) return

  await adminSupabase
    .from('audit_logs')
    .insert({ company_id: companyId, action, resource, resource_id: resourceId })
}

app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

app.get('/admin/workspaces', async (req, reply) => {
  if (!(await requireOwner(req, reply))) return

  const clients = await listClients()
  reply.send({ workspaces: clients })
})

app.post('/admin/users', async (req, reply) => {
  if (!(await requireOwner(req, reply))) return

  const { companyId, workspaceId, fullName, email, password, role } = req.body || {}
  const scopedCompanyId = companyId || workspaceId

  if (!scopedCompanyId || !fullName || !email || !password) {
    return reply.status(400).send({ error: 'companyId, fullName, email e password sao obrigatorios.' })
  }

  try {
    const member = await createCompanyUser({
      companyId: scopedCompanyId,
      companyName: scopedCompanyId,
      member: { name: fullName, email, password, role },
    })

    reply.send({ ok: true, user: member })
  } catch (error) {
    reply.status(500).send({ error: error.message || 'Nao foi possivel criar o usuario.' })
  }
})

app.post('/workspace/setup', async (req, reply) => {
  if (!(await requireOwner(req, reply))) return

  const { companyName, ownerName, channel, plan, aiEnabled, teamMembers } = req.body || {}
  if (!companyName || !ownerName || !channel || !teamMembers?.length) {
    return reply.status(400).send({ error: 'Dados obrigatorios ausentes.' })
  }

  try {
    const client = await createClientRecord({
      companyName,
      plan: plan || 'growth',
      aiEnabled: Boolean(aiEnabled),
      ownerId: req.currentUser.id,
    })

    const createdMembers = []
    for (const member of teamMembers) {
      const created = await createCompanyUser({
        companyId: client.id,
        companyName,
        member,
      })
      if (created) createdMembers.push(created)
    }

    const channelData = await tryInsertChannel({ companyId: client.id, channel })
    await tryInsertAuditLog({
      companyId: client.id,
      action: 'workspace_setup',
      resource: 'workspace',
      resourceId: client.id,
    })

    reply.send({
      ok: true,
      workspace: client,
      channel: channelData,
      members: createdMembers,
    })
  } catch (error) {
    req.log.error(error)
    reply.status(500).send({ error: error.message || 'Nao foi possivel configurar o cliente.' })
  }
})

app.post('/webhook/whatsapp', async (req, reply) => {
  const body = req.body
  if (body.event !== 'messages.upsert') return reply.send({ ok: true })

  const msg = body.data
  if (!msg || msg.key?.fromMe) return reply.send({ ok: true })

  const phone = msg.key.remoteJid.replace('@s.whatsapp.net', '')
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[midia]'
  const timestamp = new Date(msg.messageTimestamp * 1000).toISOString()
  const instance = body.instance

  try {
    const { data: channel } = await adminSupabase
      .from('channels')
      .select('id, workspace_id, company_id, type')
      .eq('type', 'whatsapp')
      .eq('config->>instance', instance)
      .single()

    if (!channel) return reply.send({ ok: true })
    const scopedWorkspaceId = channel.workspace_id || channel.company_id
    if (!scopedWorkspaceId) return reply.send({ ok: true })

    let { data: contact } = await adminSupabase
      .from('contacts')
      .select('id')
      .eq('workspace_id', scopedWorkspaceId)
      .eq('phone', phone)
      .single()

    if (!contact) {
      const { data: newContact } = await adminSupabase
        .from('contacts')
        .insert({ workspace_id: scopedWorkspaceId, phone, name: phone })
        .select('id')
        .single()
      contact = newContact
    }

    let { data: conversation } = await adminSupabase
      .from('conversations')
      .select('id')
      .eq('workspace_id', scopedWorkspaceId)
      .eq('contact_id', contact.id)
      .eq('channel_id', channel.id)
      .neq('status', 'resolved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!conversation) {
      const { data: newConversation } = await adminSupabase
        .from('conversations')
        .insert({
          workspace_id: scopedWorkspaceId,
          contact_id: contact.id,
          channel_id: channel.id,
          status: 'open',
          priority: 'medium',
          last_message: text,
          last_message_at: timestamp,
        })
        .select('id')
        .single()
      conversation = newConversation
    } else {
      await adminSupabase
        .from('conversations')
        .update({ last_message: text, last_message_at: timestamp })
        .eq('id', conversation.id)
    }

    await adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'client',
        content: text,
        metadata: { phone, timestamp, raw: msg },
      })

    reply.send({ ok: true })
  } catch (error) {
    req.log.error(error)
    reply.status(500).send({ error: error.message })
  }
})

app.post('/send/whatsapp', async (req, reply) => {
  if (!(await requireAuthenticated(req, reply))) return

  const { phone, text, instance, workspaceId } = req.body || {}
  if (!phone || !text || !instance) {
    return reply.status(400).send({ error: 'phone, text e instance sao obrigatorios.' })
  }

  if (workspaceId) {
    const allowed = await hasCompanyAccess(req.currentUser.id, workspaceId)
    if (!allowed) return reply.status(403).send({ error: 'Acesso negado ao cliente informado.' })
  }

  const res = await fetch(`${process.env.EVOLUTION_URL}/message/sendText/${instance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: phone,
      options: { delay: 500 },
      textMessage: { text },
    }),
  })

  const data = await res.json()
  reply.send(data)
})

await app.listen({ port: process.env.PORT || 3001, host: '0.0.0.0' })
