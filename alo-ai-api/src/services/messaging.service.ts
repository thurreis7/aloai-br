import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { SupabaseService } from './supabase.service'

@Injectable()
export class MessagingService {
  constructor(private readonly supabase: SupabaseService) {}

  async handleWhatsappWebhook(body: any) {
    if (body?.event !== 'messages.upsert') return { ok: true }

    const msg = body?.data
    if (!msg || msg.key?.fromMe) return { ok: true }

    const phone = String(msg.key.remoteJid || '').replace('@s.whatsapp.net', '')
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[midia]'
    const timestamp = new Date(Number(msg.messageTimestamp || 0) * 1000).toISOString()
    const instance = body.instance

    const channelRes = await this.supabase.admin
      .from('channels')
      .select('id, workspace_id, company_id, type')
      .eq('type', 'whatsapp')
      .eq('config->>instance', instance)
      .maybeSingle()

    const channel = channelRes.data
    const workspaceId = channel?.workspace_id || channel?.company_id
    if (!channel || !workspaceId) return { ok: true }

    let contactRes = await this.supabase.admin
      .from('contacts')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('phone', phone)
      .maybeSingle()

    if (!contactRes.data?.id) {
      contactRes = await this.supabase.admin
        .from('contacts')
        .insert({ workspace_id: workspaceId, company_id: workspaceId, phone, name: phone })
        .select('id')
        .single()
    }

    const contact = contactRes.data
    let conversationRes = await this.supabase.admin
      .from('conversations')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('contact_id', contact.id)
      .eq('channel_id', channel.id)
      .neq('state', 'closed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!conversationRes.data?.id) {
      conversationRes = await this.supabase.admin
        .from('conversations')
        .insert({
          workspace_id: workspaceId,
          company_id: workspaceId,
          contact_id: contact.id,
          channel_id: channel.id,
          state: 'new',
          priority: 'medium',
          last_message: text,
          last_message_at: timestamp,
          unread_count: 1,
        })
        .select('id')
        .single()
    } else {
      await this.supabase.admin
        .from('conversations')
        .update({
          state: 'open',
          last_message: text,
          last_message_at: timestamp,
          unread_count: 1,
        })
        .eq('id', conversationRes.data.id)
    }

    await this.supabase.admin
      .from('messages')
      .insert({
        workspace_id: workspaceId,
        company_id: workspaceId,
        conversation_id: conversationRes.data.id,
        sender_type: 'client',
        direction: 'inbound',
        channel_type: 'whatsapp',
        content: text,
        metadata: { phone, timestamp, raw: msg },
      })

    return { ok: true }
  }

  async sendWhatsappMessage(input: { phone: string; text: string; instance: string }) {
    const { phone, text, instance } = input
    if (!phone || !text || !instance) {
      throw new BadRequestException('phone, text e instance sao obrigatorios.')
    }

    const res = await fetch(`${process.env.EVOLUTION_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.EVOLUTION_API_KEY || '',
      },
      body: JSON.stringify({
        number: phone,
        options: { delay: 500 },
        textMessage: { text },
      }),
    })

    if (!res.ok) {
      throw new InternalServerErrorException(`Evolution API returned ${res.status}.`)
    }

    return res.json()
  }
}
