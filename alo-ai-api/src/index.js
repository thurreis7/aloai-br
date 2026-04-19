import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { createClient } from '@supabase/supabase-js'

const app = Fastify({ logger: true })
await app.register(cors, { origin: true })

const adminSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
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
  let profile = null

  const profileRes = await adminSupabase
    .from('profiles')
    .select('id, role, is_owner, workspace_id, company_id')
    .eq('id', userId)
    .maybeSingle()

  if (!profileRes.error && profileRes.data) {
    profile = profileRes.data
  } else {
    const usersRes = await adminSupabase
      .from('users')
      .select('id, role, company_id')
      .eq('id', userId)
      .maybeSingle()

    profile = usersRes.data || null
  }

  let memberships = []

  const workspaceUsersRes = await adminSupabase
    .from('workspace_users')
    .select('workspace_id, role')
    .eq('user_id', userId)

  if (!workspaceUsersRes.error) {
    memberships = workspaceUsersRes.data || []
  }

  if (!memberships.length) {
    const workspaceMembersRes = await adminSupabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', userId)

    memberships = workspaceMembersRes.data || []
  }

  const isOwner = Boolean(profile?.is_owner) || profile?.role === 'owner'
  return { profile, memberships, isOwner }
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

async function hasWorkspaceAccess(userId, workspaceId) {
  const context = await loadAccessContext(userId)
  if (context.isOwner) return true

  if (context.profile?.workspace_id === workspaceId || context.profile?.company_id === workspaceId) {
    return true
  }

  return context.memberships.some((item) => item.workspace_id === workspaceId)
}

async function insertWorkspace({ companyName, plan, aiEnabled, ownerId }) {
  const attempts = [
    { company_name: companyName, name: companyName, slug: `${slugify(companyName)}-${Date.now().toString(36)}`, plan, ai_enabled: aiEnabled, created_by: ownerId },
    { name: companyName, slug: `${slugify(companyName)}-${Date.now().toString(36)}`, plan, ai_enabled: aiEnabled, created_by: ownerId },
    { name: companyName, slug: `${slugify(companyName)}-${Date.now().toString(36)}`, plan, ai_enabled: aiEnabled },
  ]

  let lastError = null

  for (const payload of attempts) {
    const { data, error } = await adminSupabase
      .from('workspaces')
      .insert(payload)
      .select('id, company_name, name, slug, plan, ai_enabled, created_by, created_at')
      .single()

    if (!error) return data
    lastError = error
  }

  throw new Error(`workspace: ${lastError?.message || 'falha ao criar workspace'}`)
}

async function insertProfileRecord({ userId, email, fullName, role, workspaceId }) {
  const profileAttempts = [
    { id: userId, email, full_name: fullName, role, is_owner: role === 'owner', workspace_id: workspaceId, company_id: workspaceId },
    { id: userId, email, full_name: fullName, role, is_owner: role === 'owner', company_id: workspaceId },
    { id: userId, email, full_name: fullName, role, is_owner: role === 'owner' },
  ]

  for (const payload of profileAttempts) {
    const { error } = await adminSupabase.from('profiles').upsert(payload)
    if (!error) break
  }

  const userAttempts = [
    { id: userId, name: fullName, email, role, company_id: workspaceId },
    { id: userId, name: fullName, email, role },
  ]

  for (const payload of userAttempts) {
    const { error } = await adminSupabase.from('users').upsert(payload)
    if (!error) break
  }
}

async function insertMembership({ userId, workspaceId, role, fullName }) {
  await adminSupabase.from('workspace_users').upsert({
    workspace_id: workspaceId,
    user_id: userId,
    role,
  }, { onConflict: 'workspace_id,user_id' })

  await adminSupabase.from('workspace_members').upsert({
    workspace_id: workspaceId,
    user_id: userId,
    role,
    display_name: fullName,
  }, { onConflict: 'workspace_id,user_id' })
}

async function createWorkspaceMember({ workspaceId, companyName, member }) {
  if (!member.name?.trim()) return null

  const email = member.email?.trim() || `${slugify(member.name)}@${slugify(companyName)}.aloai.local`
  const password = member.password?.trim() || `${slugify(companyName)}123`
  const role = member.role === 'admin' ? 'admin' : (member.role || 'agent')

  const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: member.name.trim() },
  })

  if (authError) throw new Error(authError.message)

  await insertProfileRecord({
    userId: authUser.user.id,
    email,
    fullName: member.name.trim(),
    role,
    workspaceId,
  })

  await insertMembership({
    workspaceId,
    userId: authUser.user.id,
    role,
    fullName: member.name.trim(),
  })

  return {
    id: authUser.user.id,
    full_name: member.name.trim(),
    email,
    role,
    password,
  }
}

app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

app.get('/admin/workspaces', async (req, reply) => {
  if (!(await requireOwner(req, reply))) return

  const { data, error } = await adminSupabase
    .from('workspaces')
    .select('id, company_name, name, slug, plan, ai_enabled, created_by, created_at')
    .order('created_at', { ascending: true })

  if (error) return reply.status(500).send({ error: error.message })
  reply.send({ workspaces: data || [] })
})

app.post('/admin/users', async (req, reply) => {
  if (!(await requireOwner(req, reply))) return

  const { workspaceId, fullName, email, password, role } = req.body || {}
  if (!workspaceId || !fullName || !email || !password) {
    return reply.status(400).send({ error: 'workspaceId, fullName, email e password sao obrigatorios.' })
  }

  try {
    const member = await createWorkspaceMember({
      workspaceId,
      companyName: workspaceId,
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
    const workspace = await insertWorkspace({
      companyName,
      plan: plan || 'growth',
      aiEnabled: Boolean(aiEnabled),
      ownerId: req.currentUser.id,
    })

    const { data: channelData, error: channelError } = await adminSupabase
      .from('channels')
      .insert({
        workspace_id: workspace.id,
        type: channel,
        name: channel === 'whatsapp' ? 'WhatsApp Business' : channel,
        is_active: true,
        config: {},
      })
      .select('id, type')
      .single()

    if (channelError) throw new Error(`channel: ${channelError.message}`)

    const createdMembers = []
    for (const member of teamMembers) {
      const created = await createWorkspaceMember({
        workspaceId: workspace.id,
        companyName,
        member,
      })
      if (created) createdMembers.push(created)
    }

    await adminSupabase.from('audit_logs').insert({
      workspace_id: workspace.id,
      action: 'workspace_setup',
      resource: 'workspace',
      resource_id: workspace.id,
    })

    reply.send({
      ok: true,
      workspace,
      channel: channelData,
      members: createdMembers,
    })
  } catch (error) {
    req.log.error(error)
    reply.status(500).send({ error: error.message || 'Nao foi possivel configurar o workspace.' })
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
      .select('id, workspace_id')
      .eq('type', 'whatsapp')
      .eq('config->>instance', instance)
      .single()

    if (!channel) return reply.send({ ok: true })

    let { data: contact } = await adminSupabase
      .from('contacts')
      .select('id')
      .eq('workspace_id', channel.workspace_id)
      .eq('phone', phone)
      .single()

    if (!contact) {
      const { data: newContact } = await adminSupabase
        .from('contacts')
        .insert({ workspace_id: channel.workspace_id, phone, name: phone })
        .select('id')
        .single()
      contact = newContact
    }

    let { data: conversation } = await adminSupabase
      .from('conversations')
      .select('id')
      .eq('workspace_id', channel.workspace_id)
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
          workspace_id: channel.workspace_id,
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
    const allowed = await hasWorkspaceAccess(req.currentUser.id, workspaceId)
    if (!allowed) return reply.status(403).send({ error: 'Acesso negado ao workspace informado.' })
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
