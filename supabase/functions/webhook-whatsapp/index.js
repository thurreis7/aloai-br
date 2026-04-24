import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export default async (req) => {
  try {
    const body = await req.json()

    if (body.event !== 'messages.upsert') {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const msg = body.data
    if (!msg || msg.key?.fromMe) {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const phone = msg.key.remoteJid.replace('@s.whatsapp.net', '')
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[midia]'
    const timestamp = new Date(msg.messageTimestamp * 1000).toISOString()
    const instance = body.instance

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: channel, error: channelErr } = await supabase
      .from('channels')
      .select('id, workspace_id, company_id, type')
      .eq('type', 'whatsapp')
      .eq('config->>instance', instance)
      .single()

    if (channelErr) throw channelErr
    if (!channel) {
      console.warn(`Instancia ${instance} nao vinculada a nenhum workspace`)
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const scopedWorkspaceId = channel.workspace_id || channel.company_id
    if (!scopedWorkspaceId) {
      console.warn(`Canal ${channel.id} sem workspace_id/company_id canonico`)
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    let { data: contact, error: contactErr } = await supabase
      .from('contacts')
      .select('id')
      .eq('workspace_id', scopedWorkspaceId)
      .eq('phone', phone)
      .single()

    if (contactErr && contactErr.code !== 'PGRST116') throw contactErr
    if (!contact) {
      const { data: newContact, error: insertContactErr } = await supabase
        .from('contacts')
        .insert({ workspace_id: scopedWorkspaceId, phone, name: phone })
        .select('id')
        .single()

      if (insertContactErr) throw insertContactErr
      contact = newContact
    }

    let { data: conversation, error: convErr } = await supabase
      .from('conversations')
      .select('id')
      .eq('workspace_id', scopedWorkspaceId)
      .eq('contact_id', contact.id)
      .eq('channel_id', channel.id)
      .neq('status', 'resolved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (convErr && convErr.code !== 'PGRST116') throw convErr
    if (!conversation) {
      const { data: newConv, error: insertConvErr } = await supabase
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

      if (insertConvErr) throw insertConvErr
      conversation = newConv
    } else {
      const { error: updateErr } = await supabase
        .from('conversations')
        .update({ last_message: text, last_message_at: timestamp })
        .eq('id', conversation.id)

      if (updateErr) throw updateErr
    }

    const { error: msgErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'client',
        content: text,
        metadata: { phone, timestamp, raw: msg },
      })

    if (msgErr) throw msgErr

    console.info(`Mensagem salva - conversa ${conversation.id}`)
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
