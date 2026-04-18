import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { createClient } from '@supabase/supabase-js'

const app = Fastify({ logger: true })
await app.register(cors, { origin: true })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/* Gera slug a partir do nome */
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

/* ── Workspace Setup — cria tudo de uma vez ── */
app.post('/workspace/setup', async (req, reply) => {
  const { companyName, ownerName, channel, plan, aiEnabled, teamMembers } = req.body

  /* Validação */
  if (!companyName || !ownerName || !channel || !teamMembers?.length) {
    return reply.status(400).send({ error: 'Dados obrigatórios ausentes' })
  }

  try {
    /* Step 1: Criar workspace */
    const slug = slugify(companyName) + '-' + Date.now().toString(36)
    const { data: workspace, error: wsErr } = await supabase
      .from('workspaces')
      .insert({
        name: companyName,
        slug,
        plan: plan || 'growth',
        ai_enabled: !!aiEnabled,
      })
      .select('id')
      .single()
    if (wsErr) throw new Error(`workspace: ${wsErr.message}`)

    /* Step 2: Criar channel */
    const { data: chData, error: chErr } = await supabase
      .from('channels')
      .insert({
        workspace_id: workspace.id,
        type: channel,
        name: channel === 'whatsapp' ? 'WhatsApp Business'
            : channel === 'instagram' ? 'Instagram'
            : channel === 'email' ? 'E-mail'
            : 'Web Chat',
        is_active: true,
        config: {},
      })
      .select('id')
      .single()
    if (chErr) throw new Error(`channel: ${chErr.message}`)

    /* Step 3: Criar cada membro no Auth e vincular ao workspace */
    const createdMembers = []
    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    for (const m of teamMembers) {
      if (!m.name?.trim()) continue

      const email = slugify(m.name) + '@' + slug + '.aloai.local'
      const defaultPassword = slugify(companyName) + '123'

      /* Criar usuário via Admin API */
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { full_name: m.name.trim(), company: companyName },
      })
      if (authErr) {
        app.log.warn(`Falha ao criar auth user para ${m.name}: ${authErr.message}`)
        continue
      }

      /* Inserir na tabela users (para o usePermissions e a UI de Settings funcionarem) */
      const { error: userErr } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          name: m.name.trim(),
          email,
          role: m.role === 'admin' ? 'admin' : 'agent',
          company_id: workspace.id,
        })
      if (userErr) {
        app.log.warn(`Falha ao criar users row para ${m.name}: ${userErr.message}`)
      }

      /* Vincular ao workspace */
      const { error: memErr } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: authUser.user.id,
          role: m.role === 'admin' ? 'admin' : 'agent',
          display_name: m.name.trim(),
        })
      if (memErr) {
        app.log.warn(`Falha ao vincular membro ${m.name}: ${memErr.message}`)
      }

      createdMembers.push({
        name: m.name.trim(),
        role: m.role || 'agent',
        email,
        password: defaultPassword,
      })
    }

    /* Step 4: Log de auditoria */
    await supabase.from('audit_logs').insert({
      workspace_id: workspace.id,
      action: 'workspace_setup',
      resource: 'workspace',
      resource_id: workspace.id,
    })

    reply.send({
      ok: true,
      workspace: { id: workspace.id, slug, name: companyName },
      channel: { id: chData.id, type: channel },
      members: createdMembers,
    })
  } catch (err) {
    app.log.error(err)
    reply.status(500).send({ error: err.message })
  }
})

/* ── Webhook — recebe mensagens da Evolution API ── */
app.post('/webhook/whatsapp', async (req, reply) => {
  const body = req.body

  /* Ignora eventos que não são mensagens recebidas */
  if (body.event !== 'messages.upsert') return reply.send({ ok: true })

  const msg = body.data
  if (!msg || msg.key?.fromMe) return reply.send({ ok: true })

  const phone     = msg.key.remoteJid.replace('@s.whatsapp.net', '')
  const text      = msg.message?.conversation
               || msg.message?.extendedTextMessage?.text
               || '[mídia]'
  const timestamp = new Date(msg.messageTimestamp * 1000).toISOString()
  const instance  = body.instance

  try {
    /* 1. Busca ou cria workspace vinculado à instância */
    const { data: channel } = await supabase
      .from('channels')
      .select('id, workspace_id')
      .eq('type', 'whatsapp')
      .eq('config->>instance', instance)
      .single()

    if (!channel) {
      app.log.warn(`Instância ${instance} não vinculada a nenhum workspace`)
      return reply.send({ ok: true })
    }

    /* 2. Busca ou cria contato */
    let { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('workspace_id', channel.workspace_id)
      .eq('phone', phone)
      .single()

    if (!contact) {
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({ workspace_id: channel.workspace_id, phone, name: phone })
        .select('id')
        .single()
      contact = newContact
    }

    /* 3. Busca ou cria conversa aberta */
    let { data: conversation } = await supabase
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
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          workspace_id: channel.workspace_id,
          contact_id:   contact.id,
          channel_id:   channel.id,
          status:       'open',
          priority:     'medium',
          last_message: text,
          last_message_at: timestamp,
        })
        .select('id')
        .single()
      conversation = newConv
    } else {
      /* Atualiza última mensagem */
      await supabase
        .from('conversations')
        .update({ last_message: text, last_message_at: timestamp, unread_count: supabase.rpc('increment', { x: 1 }) })
        .eq('id', conversation.id)
    }

    /* 4. Salva a mensagem */
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_type:     'client',
        content:         text,
        metadata:        { phone, timestamp, raw: msg },
      })

    app.log.info(`Mensagem salva — conversa ${conversation.id}`)
    reply.send({ ok: true })

  } catch (err) {
    app.log.error(err)
    reply.status(500).send({ error: err.message })
  }
})

/* ── Enviar mensagem pelo WhatsApp ── */
app.post('/send/whatsapp', async (req, reply) => {
  const { phone, text, instance } = req.body

  const res = await fetch(`${process.env.EVOLUTION_URL}/message/sendText/${instance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.EVOLUTION_API_KEY,
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

/* ── Health check ── */
app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

await app.listen({ port: process.env.PORT || 3001, host: '0.0.0.0' })