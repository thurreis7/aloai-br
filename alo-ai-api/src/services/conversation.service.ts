import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { MessagingService } from './messaging.service'
import { SupabaseService } from './supabase.service'

const ALLOWED_STATES = new Set(['new', 'open', 'ai_handling', 'human_handling', 'waiting_customer', 'closed'])

function normalizeChannelType(type: string) {
  const normalized = String(type || '').trim().toLowerCase()
  if (!normalized) return ''
  if (normalized === 'gmail') return 'email'
  return normalized
}

function normalizeState(state: string) {
  const normalized = String(state || '').trim().toLowerCase()
  if (!normalized) return ''
  if (ALLOWED_STATES.has(normalized)) return normalized
  if (normalized === 'resolved') return 'closed'
  if (normalized === 'waiting') return 'waiting_customer'
  if (normalized === 'bot') return 'ai_handling'
  return ''
}

@Injectable()
export class ConversationService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly messagingService: MessagingService,
  ) {}

  async sendConversationMessage(input: {
    workspaceId: string
    conversationId: string
    userId: string
    role: string
    text: string
  }) {
    const conversation: any = await this.loadConversation(input.workspaceId, input.conversationId)
    if (!conversation) throw new NotFoundException('Conversa nao encontrada.')

    const isPrivileged = ['owner', 'admin', 'supervisor'].includes(input.role)
    const isAssignee = conversation.assigned_to === input.userId
    if (!isPrivileged && !isAssignee) {
      throw new ForbiddenException('Apenas o responsavel ou supervisores podem enviar mensagens.')
    }

    const channelType = normalizeChannelType(conversation.channels?.type)
    const payload: any = {
      workspace_id: input.workspaceId,
      company_id: input.workspaceId,
      conversation_id: input.conversationId,
      sender_id: input.userId,
      sender_type: 'agent',
      direction: 'outbound',
      channel_type: channelType || null,
      content: input.text,
      metadata: {
        source: 'conversation-controller',
        actor_id: input.userId,
      },
    }

    let externalMessageId: string | null = null
    if (channelType === 'whatsapp') {
      const phone = conversation.contacts?.phone
      const instance = conversation.channels?.config?.instance
      if (!phone || !instance) {
        throw new BadRequestException('Canal WhatsApp sem numero ou instance configurado.')
      }

      const transport = await this.messagingService.sendWhatsappMessage({
        phone,
        text: input.text,
        instance,
      })

      externalMessageId =
        transport?.key?.id ||
        transport?.messageId ||
        transport?.data?.key?.id ||
        null

      payload.metadata = {
        ...payload.metadata,
        transport,
      }
      if (externalMessageId) {
        payload.external_message_id = externalMessageId
      }
    }

    const { error: insertError, data: insertedMessage } = await this.supabase.admin
      .from('messages')
      .insert(payload)
      .select('id, workspace_id, conversation_id, sender_type, direction, channel_type, external_message_id, content, metadata, created_at')
      .single()

    if (insertError) {
      throw new InternalServerErrorException(insertError.message)
    }

    const { error: conversationError, data: updatedConversation } = await this.supabase.admin
      .from('conversations')
      .update({
        last_message: input.text,
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      })
      .eq('workspace_id', input.workspaceId)
      .eq('id', input.conversationId)
      .select('id, workspace_id, state, status, priority, assigned_to, assigned_by, last_message, last_message_at, unread_count')
      .single()

    if (conversationError) {
      throw new InternalServerErrorException(conversationError.message)
    }

    return {
      conversation: updatedConversation,
      message: insertedMessage,
    }
  }

  async updateConversationState(input: {
    workspaceId: string
    conversationId: string
    state: string
  }) {
    const state = normalizeState(input.state)
    if (!state) throw new BadRequestException('state invalido.')

    const { data, error } = await this.supabase.admin
      .from('conversations')
      .update({ state })
      .eq('workspace_id', input.workspaceId)
      .eq('id', input.conversationId)
      .select('id, workspace_id, state, status, priority, assigned_to, assigned_by, last_message, last_message_at, unread_count')
      .single()

    if (error) throw new InternalServerErrorException(error.message)
    return { conversation: data }
  }

  async assignConversation(input: {
    workspaceId: string
    conversationId: string
    assignedTo: string
    assignedBy: string
  }) {
    const { data, error } = await this.supabase.admin
      .from('conversations')
      .update({
        assigned_to: input.assignedTo,
        assigned_by: input.assignedBy,
      })
      .eq('workspace_id', input.workspaceId)
      .eq('id', input.conversationId)
      .select('id, workspace_id, state, status, priority, assigned_to, assigned_by, last_message, last_message_at, unread_count')
      .single()

    if (error) throw new InternalServerErrorException(error.message)
    return { conversation: data }
  }

  async closeConversation(input: {
    workspaceId: string
    conversationId: string
    userId: string
    role: string
  }) {
    const conversation: any = await this.loadConversation(input.workspaceId, input.conversationId)
    if (!conversation) throw new NotFoundException('Conversa nao encontrada.')

    const isPrivileged = ['owner', 'admin', 'supervisor'].includes(input.role)
    const isAssignee = conversation.assigned_to === input.userId
    if (!isPrivileged && !isAssignee) {
      throw new ForbiddenException('Apenas o responsavel ou supervisores podem encerrar a conversa.')
    }

    return this.updateConversationState({
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      state: 'closed',
    })
  }

  private async loadConversation(workspaceId: string, conversationId: string): Promise<any> {
    const { data, error } = await this.supabase.admin
      .from('conversations')
      .select(`
        id, workspace_id, state, status, priority, assigned_to, assigned_by, unread_count,
        contacts ( id, name, phone, email, company ),
        channels ( id, type, name, config )
      `)
      .eq('workspace_id', workspaceId)
      .eq('id', conversationId)
      .maybeSingle()

    if (error) throw new InternalServerErrorException(error.message)
    return data || null
  }
}
