import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { SupabaseService } from './supabase.service'
import { TranscriptionService } from './transcription.service'

const TRIAGE_TAGS = new Set(['suporte', 'vendas', 'cobranca', 'urgente', 'spam', 'recorrente', 'outros'])
const SENTIMENT_VALUES = new Set(['normal', 'frustrated', 'angry', 'urgent'])

function normalizeAiText(value: string) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

@Injectable()
export class MessagingService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly transcriptionService: TranscriptionService,
  ) {}

  private normalizeHeaderValue(value: string | string[] | undefined) {
    return String(Array.isArray(value) ? value[0] : value || '').trim()
  }

  private normalizePhone(remoteJid?: string) {
    return String(remoteJid || '').replace('@s.whatsapp.net', '').replace('@c.us', '').trim()
  }

  private getInboundText(msg: any) {
    if (msg?.message?.audioMessage) return '[audio]'
    return msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || '[midia]'
  }

  private getInboundMessageType(msg: any) {
    if (msg?.message?.audioMessage) return 'audio'
    if (msg?.message?.imageMessage) return 'image'
    if (msg?.message?.videoMessage) return 'video'
    if (msg?.message?.documentMessage) return 'document'
    return 'text'
  }

  private getInboundMediaUrl(payload: any, msg: any) {
    return String(
      payload?.mediaUrl
      || payload?.data?.mediaUrl
      || payload?.data?.media_url
      || msg?.message?.audioMessage?.url
      || msg?.message?.imageMessage?.url
      || msg?.message?.videoMessage?.url
      || msg?.message?.documentMessage?.url
      || '',
    ).trim() || null
  }

  private getMessageTimestamp(msg: any) {
    const epochSeconds = Number(msg?.messageTimestamp || 0)
    if (!Number.isFinite(epochSeconds) || epochSeconds <= 0) return new Date().toISOString()
    return new Date(epochSeconds * 1000).toISOString()
  }

  private isDuplicateError(error: any) {
    const message = String(error?.message || '').toLowerCase()
    return error?.code === '23505' || message.includes('duplicate key') || message.includes('already exists')
  }

  private inferTriageTag(textValue: string) {
    const text = normalizeAiText(textValue)
    if (/(spam|promocao|divulga|marketing|lista de transmissao)/.test(text)) return 'spam'
    if (/(urgente|agora|imediato|emergencia|parou|nao funciona|nao estou conseguindo)/.test(text)) return 'urgente'
    if (/(boleto|pagamento|cobranca|fatura|nota fiscal|reembolso)/.test(text)) return 'cobranca'
    if (/(preco|plano|comprar|orcamento|proposta|valor)/.test(text)) return 'vendas'
    if (/(de novo|novamente|continua|recorrente|segunda vez|terceira vez)/.test(text)) return 'recorrente'
    if (/(erro|problema|ajuda|suporte|duvida|falha|bug)/.test(text)) return 'suporte'
    return 'outros'
  }

  private inferSentiment(textValue: string) {
    const text = normalizeAiText(textValue)
    if (/(processo|reclamacao|procon|advogado|cancelar agora|nunca mais)/.test(text)) {
      return { sentiment: 'angry', confidence: 0.9 }
    }
    if (/(urgente|imediato|agora|emergencia|preciso hoje|sem acesso|parado)/.test(text)) {
      return { sentiment: 'urgent', confidence: 0.85 }
    }
    if (/(chateado|frustrado|irritado|demora|cansado|nao resolveu|nao resolveu)/.test(text)) {
      return { sentiment: 'frustrated', confidence: 0.8 }
    }
    return { sentiment: 'normal', confidence: 0.6 }
  }

  private normalizeRuntimeTriageTag(value: string) {
    const normalized = normalizeAiText(value).replace(/[^a-z0-9_]+/g, '')
    return TRIAGE_TAGS.has(normalized) ? normalized : 'outros'
  }

  private normalizeRuntimeSentiment(value: string) {
    const normalized = normalizeAiText(value)
    return SENTIMENT_VALUES.has(normalized) ? normalized : 'normal'
  }

  private async isWorkspaceAiEnabled(workspaceId: string) {
    const { data, error } = await this.supabase.admin
      .from('workspaces')
      .select('ai_enabled, plan')
      .eq('id', workspaceId)
      .maybeSingle()

    if (error) {
      console.warn({
        topic: 'ai_runtime_workspace_check_failed',
        workspace_id: workspaceId,
        error: error.message,
      })
      return false
    }

    const plan = String(data?.plan || '').toLowerCase()
    return data?.ai_enabled === true && ['pro', 'business'].includes(plan)
  }

  private async applyAiRuntimeSignals(input: {
    workspaceId: string
    conversationId: string
    text: string
    isNewConversation: boolean
  }) {
    try {
      if (!await this.isWorkspaceAiEnabled(input.workspaceId)) return

      const update: Record<string, any> = {}
      if (input.isNewConversation) {
        update.triage_tag = this.normalizeRuntimeTriageTag(this.inferTriageTag(input.text))
      }

      const { data: conversation, error } = await this.supabase.admin
        .from('conversations')
        .select('sentiment_checked_at')
        .eq('workspace_id', input.workspaceId)
        .eq('id', input.conversationId)
        .maybeSingle()

      if (error) throw error

      const checkedAt = conversation?.sentiment_checked_at ? new Date(conversation.sentiment_checked_at).getTime() : 0
      const canCheckSentiment = !checkedAt || Date.now() - checkedAt >= 60_000
      if (canCheckSentiment) {
        const inferred = this.inferSentiment(input.text)
        update.sentiment_checked_at = new Date().toISOString()
        if (inferred.confidence >= 0.75) {
          update.sentiment = this.normalizeRuntimeSentiment(inferred.sentiment)
          update.sentiment_confidence = inferred.confidence
        }
      }

      if (!Object.keys(update).length) return

      const { error: updateError } = await this.supabase.admin
        .from('conversations')
        .update(update)
        .eq('workspace_id', input.workspaceId)
        .eq('id', input.conversationId)

      if (updateError) throw updateError
    } catch (error) {
      console.warn({
        topic: 'ai_runtime_signals_failed',
        workspace_id: input.workspaceId,
        conversation_id: input.conversationId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  private async findWhatsappChannelByInstanceKey(instanceKey: string, instanceName?: string) {
    const normalizedInstanceName = String(instanceName || '').trim()
    const workspaceId = this.extractWorkspaceIdFromInstanceName(normalizedInstanceName)

    if (!instanceKey || !normalizedInstanceName || !workspaceId) {
      throw new UnauthorizedException('Invalid webhook key')
    }

    const byInstance = await this.supabase.admin
      .from('channels')
      .select('id, workspace_id, company_id, type, config, external_instance_id')
      .eq('workspace_id', workspaceId)
      .eq('type', 'whatsapp')
      .eq('external_instance_id', normalizedInstanceName)
      .maybeSingle()

    if (byInstance.error || !byInstance.data?.id) throw new UnauthorizedException('Invalid webhook key')

    const channelWorkspaceId = byInstance.data.workspace_id || byInstance.data.company_id
    if (!channelWorkspaceId) throw new UnauthorizedException('Invalid webhook key')

    return { ...byInstance.data, workspace_id: channelWorkspaceId }
  }

  private async createWebhookLog(workspaceId: string, payload: any) {
    const { data, error } = await this.supabase.admin
      .from('webhook_logs')
      .insert({
        workspace_id: workspaceId,
        channel_type: 'whatsapp',
        event_type: payload?.event || 'unknown',
        payload: payload || {},
        status: 'received',
      })
      .select('id')
      .single()

    if (error) {
      console.warn({
        topic: 'whatsapp_webhook_log_create_failed',
        workspace_id: workspaceId,
        error: error.message,
      })
      return null
    }

    return data?.id || null
  }

  private async updateWebhookLog(webhookLogId: string | null, status: 'processed' | 'failed', error?: unknown) {
    if (!webhookLogId) return

    const payload: Record<string, any> = {
      status,
      processed_at: new Date().toISOString(),
    }

    if (error) payload.error = error instanceof Error ? error.message : String(error)

    const { error: updateError } = await this.supabase.admin
      .from('webhook_logs')
      .update(payload)
      .eq('id', webhookLogId)

    if (updateError) {
      console.warn({
        topic: 'whatsapp_webhook_log_update_failed',
        webhook_log_id: webhookLogId,
        status,
        error: updateError.message,
      })
    }
  }

  private async markIdempotencyProcessed(workspaceId: string, channelMessageId: string, payload: any) {
    const result = await this.supabase.admin
      .from('idempotency_keys')
      .upsert({
        workspace_id: workspaceId,
        provider: 'whatsapp',
        event_id: channelMessageId,
        payload,
        status: 'processed',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'workspace_id,provider,event_id' })

    if (result.error) {
      console.warn({
        topic: 'whatsapp_idempotency_mark_failed',
        workspace_id: workspaceId,
        event_id: channelMessageId,
        error: result.error.message,
      })
    }
  }

  private async findMessageByChannelMessageId(channelMessageId: string, workspaceId: string) {
    const byCanonical = await this.supabase.admin
      .from('messages')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('channel_message_id', channelMessageId)
      .maybeSingle()

    if (byCanonical.error) throw new InternalServerErrorException(byCanonical.error.message)
    if (byCanonical.data?.id) return byCanonical.data

    const byLegacy = await this.supabase.admin
      .from('messages')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('external_message_id', channelMessageId)
      .maybeSingle()

    if (byLegacy.error) throw new InternalServerErrorException(byLegacy.error.message)
    return byLegacy.data || null
  }

  private extractWorkspaceIdFromInstanceName(instanceName: string) {
    const [, workspaceId] = String(instanceName || '').match(/^workspace_([0-9a-f-]{36})$/i) || []
    return workspaceId || null
  }

  private extractInstanceName(payload: any) {
    return String(
      payload?.instance?.instanceName
      || payload?.data?.instance?.instanceName
      || payload?.instance
      || payload?.instanceName
      || payload?.data?.instance
      || payload?.data?.instanceName
      || '',
    ).trim()
  }

  async acknowledgeWhatsappWebhook(apikey: string | string[] | undefined, body: any) {
    const instanceKey = this.normalizeHeaderValue(apikey)
    const channel = await this.findWhatsappChannelByInstanceKey(instanceKey, this.extractInstanceName(body))
    return { channel, payload: body }
  }

  async processAcknowledgedWhatsappWebhook(job: { channel: any; payload: any }) {
    const webhookLogId = await this.createWebhookLog(job.channel.workspace_id, job.payload)
    try {
      await this.processInboundMessage(job.payload, job.channel)
      await this.updateWebhookLog(webhookLogId, 'processed')
    } catch (error) {
      await this.updateWebhookLog(webhookLogId, 'failed', error)
      throw error
    }
  }

  async handleWhatsappWebhook(body: any) {
    const channel = await this.findWhatsappChannelByInstanceKey(body?.apikey, this.extractInstanceName(body))
    await this.processInboundMessage(body, channel)
    return { ok: true }
  }

  async handleMessageStatusUpdate(payload: any) {
    const channelMessageId = this.extractStatusChannelMessageId(payload)
    const status = this.mapMessageAckStatus(this.extractAckStatus(payload))
    const workspaceId = payload?.workspace_id
      || payload?.workspaceId
      || payload?.data?.workspace_id
      || payload?.data?.workspaceId
      || this.extractWorkspaceIdFromInstanceName(this.extractInstanceName(payload))

    if (!channelMessageId || !status || !workspaceId) {
      console.warn({
        topic: 'whatsapp_message_status_update_ignored',
        channel_message_id: channelMessageId || null,
        workspace_id: workspaceId || null,
      })
      return { ok: true, ignored: true }
    }

    const { data, error } = await this.supabase.admin
      .from('messages')
      .update({ status })
      .eq('workspace_id', workspaceId)
      .eq('channel_message_id', channelMessageId)
      .eq('sender_type', 'agent')
      .select('id')
      .maybeSingle()

    if (error) throw new InternalServerErrorException(error.message)
    if (!data?.id) {
      console.warn({
        topic: 'whatsapp_message_status_update_not_found',
        workspace_id: workspaceId,
        channel_message_id: channelMessageId,
      })
    }

    return { ok: true }
  }

  private extractStatusChannelMessageId(payload: any) {
    return String(
      payload?.key?.id
      || payload?.data?.key?.id
      || payload?.update?.key?.id
      || payload?.data?.update?.key?.id
      || payload?.messageId
      || payload?.data?.messageId
      || '',
    ).trim()
  }

  private extractAckStatus(payload: any) {
    return payload?.update?.status
      ?? payload?.data?.update?.status
      ?? payload?.status
      ?? payload?.data?.status
      ?? payload?.ack
      ?? payload?.data?.ack
      ?? payload?.update?.ack
      ?? payload?.data?.update?.ack
  }

  private mapMessageAckStatus(value: any) {
    const normalized = String(value ?? '').toLowerCase()
    if (normalized === '1' || normalized === 'sent') return 'sent'
    if (normalized === '2' || normalized === 'delivered') return 'delivered'
    if (normalized === '3' || normalized === 'read') return 'read'
    if (normalized === '-1' || normalized === 'error' || normalized === 'failed') return 'failed'
    return null
  }

  private async processInboundMessage(payload: any, channel: any) {
    try {
      return await this.processInboundMessageUnsafe(payload, channel)
    } catch (error) {
      console.error({
        topic: 'whatsapp_process_inbound_failed',
        workspace_id: channel?.workspace_id,
        channel_id: channel?.id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  private async processInboundMessageUnsafe(payload: any, channel: any) {
    if (payload?.event !== 'messages.upsert') return { ok: true, ignored: true }

    const msg = payload?.data
    if (!msg || msg.key?.fromMe) return { ok: true, ignored: true }

    const channelMessageId = String(msg?.key?.id || '').trim()
    if (!channelMessageId) throw new BadRequestException('channel_message_id ausente.')

    const workspaceId = channel.workspace_id
    const phone = this.normalizePhone(msg.key?.remoteJid)
    const text = this.getInboundText(msg)
    const timestamp = this.getMessageTimestamp(msg)
    const messageType = this.getInboundMessageType(msg)
    const mediaUrl = this.getInboundMediaUrl(payload, msg)
    const senderType = 'contact'
    const isInternalNote = false
    const shouldIncrementUnread = senderType === 'contact' && !isInternalNote

    const existingMessage = await this.findMessageByChannelMessageId(channelMessageId, workspaceId)
    if (existingMessage?.id) {
      return { ok: true, duplicate: true }
    }

    let contactRes = await this.supabase.admin
      .from('contacts')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('phone', phone)
      .maybeSingle()

    if (!contactRes.data?.id) {
      contactRes = await this.supabase.admin
        .from('contacts')
        .insert({
          workspace_id: workspaceId,
          company_id: workspaceId,
          phone,
          name: phone,
          channel_origin: 'whatsapp',
        })
        .select('id')
        .single()
    }

    if (contactRes.error || !contactRes.data?.id) {
      throw new InternalServerErrorException(contactRes.error?.message || 'Falha ao criar contato.')
    }

    const contact = contactRes.data
    let conversationRes = await this.supabase.admin
      .from('conversations')
      .select('id, unread_count')
      .eq('workspace_id', workspaceId)
      .eq('contact_id', contact.id)
      .eq('channel_id', channel.id)
      .neq('state', 'closed')
      .neq('status', 'resolved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (conversationRes.error) {
      throw new InternalServerErrorException(conversationRes.error.message)
    }

    const isNewConversation = !conversationRes.data?.id

    if (isNewConversation) {
      conversationRes = await this.supabase.admin
        .from('conversations')
        .insert({
          workspace_id: workspaceId,
          company_id: workspaceId,
          contact_id: contact.id,
          channel_id: channel.id,
          channel_type: 'whatsapp',
          status: 'open',
          state: 'new',
          priority: 'medium',
          last_message: text,
          last_message_at: timestamp,
          unread_count: shouldIncrementUnread ? 1 : 0,
        })
        .select('id')
        .single()
    } else {
      const currentUnread = Number((conversationRes.data as any)?.unread_count || 0)
      const updateRes = await this.supabase.admin
        .from('conversations')
        .update({
          state: 'open',
          status: 'open',
          last_message: text,
          last_message_at: timestamp,
          unread_count: shouldIncrementUnread ? currentUnread + 1 : currentUnread,
        })
        .eq('workspace_id', workspaceId)
        .eq('id', conversationRes.data.id)

      if (updateRes.error) throw new InternalServerErrorException(updateRes.error.message)
    }

    if (conversationRes.error || !conversationRes.data?.id) {
      throw new InternalServerErrorException(conversationRes.error?.message || 'Falha ao criar conversa.')
    }

    const messageInsert = await this.supabase.admin
      .from('messages')
      .insert({
        workspace_id: workspaceId,
        company_id: workspaceId,
        conversation_id: conversationRes.data.id,
        contact_id: contact.id,
        sender_type: senderType,
        direction: 'inbound',
        channel_type: 'whatsapp',
        external_message_id: channelMessageId,
        channel_message_id: channelMessageId,
        type: messageType,
        media_url: mediaUrl,
        content: text,
        status: 'received',
        metadata: { phone, timestamp, raw: msg },
      })
      .select('id')
      .single()

    if (messageInsert.error) {
      if (this.isDuplicateError(messageInsert.error)) {
        return { ok: true, duplicate: true }
      }
      throw new InternalServerErrorException(messageInsert.error.message)
    }

    await this.markIdempotencyProcessed(workspaceId, channelMessageId, {
      phone,
      instance: payload?.instance,
      raw: msg,
      received_at: timestamp,
    })

    if (messageType === 'audio' && mediaUrl) {
      void this.transcriptionService.transcribeAudio(messageInsert.data.id, mediaUrl, workspaceId)
    }

    void this.applyAiRuntimeSignals({
      workspaceId,
      conversationId: conversationRes.data.id,
      text,
      isNewConversation,
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
