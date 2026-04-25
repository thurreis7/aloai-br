import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { MessagingService } from './messaging.service'
import { SupabaseService } from './supabase.service'

const ALLOWED_STATES = new Set(['new', 'open', 'ai_handling', 'human_handling', 'waiting_customer', 'closed'])
const ALLOWED_ESCALATION_REASONS = new Set(['none', 'sensitive', 'unresolved', 'high_value', 'out_of_hours', 'other'])
const PRIVILEGED_ROLES = new Set(['owner', 'admin', 'supervisor'])
const CONVERSATION_SELECT = 'id, workspace_id, state, status, priority, assigned_to, assigned_by, unread_count, last_message, last_message_at, routing_queue, routing_intent, routing_confidence, routing_reason, routing_source, ai_state, escalated_at, escalated_by, escalation_reason, escalation_note'

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

function normalizeEscalationReason(value: string) {
  const normalized = String(value || '').trim().toLowerCase()
  return ALLOWED_ESCALATION_REASONS.has(normalized) ? normalized : ''
}

function normalizeAiState(value: any) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value
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

    const isPrivileged = this.isPrivileged(input.role)
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
      .select(CONVERSATION_SELECT)
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
      .select(CONVERSATION_SELECT)
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
      .select(CONVERSATION_SELECT)
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

    const isPrivileged = this.isPrivileged(input.role)
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

  async takeoverConversation(input: {
    workspaceId: string
    conversationId: string
    userId: string
    role: string
  }) {
    const conversation = await this.loadConversation(input.workspaceId, input.conversationId)
    if (!conversation) throw new NotFoundException('Conversa nao encontrada.')

    this.assertOperatorAccess(conversation, input.userId, input.role, 'Apenas o responsavel ou supervisores podem assumir a conversa.')

    const now = new Date().toISOString()
    const aiState = normalizeAiState(conversation.ai_state)
    const nextAiState = {
      ...aiState,
      handoff: {
        ...(normalizeAiState(aiState.handoff)),
        mode: 'human',
        last_takeover_at: now,
        last_takeover_by: input.userId,
      },
      copilot: {
        ...(normalizeAiState(aiState.copilot)),
        paused: true,
        mode: 'paused',
        pause_source: 'human_takeover',
        resume_required: true,
        paused_at: now,
        paused_by: input.userId,
      },
    }

    const { data, error } = await this.supabase.admin
      .from('conversations')
      .update({
        state: 'human_handling',
        assigned_to: input.userId,
        assigned_by: input.userId,
        ai_state: nextAiState,
      })
      .eq('workspace_id', input.workspaceId)
      .eq('id', input.conversationId)
      .select(CONVERSATION_SELECT)
      .single()

    if (error) throw new InternalServerErrorException(error.message)

    await this.tryInsertAuditLog({
      workspaceId: input.workspaceId,
      action: 'conversation_handoff_takeover',
      resource: 'conversation',
      resourceId: input.conversationId,
    })

    return { conversation: data }
  }

  async reactivateCopilot(input: {
    workspaceId: string
    conversationId: string
    userId: string
    role: string
  }) {
    const conversation = await this.loadConversation(input.workspaceId, input.conversationId)
    if (!conversation) throw new NotFoundException('Conversa nao encontrada.')
    if (normalizeState(conversation.state) === 'closed') {
      throw new BadRequestException('Conversa encerrada nao pode reativar copilot.')
    }

    this.assertOperatorAccess(conversation, input.userId, input.role, 'Apenas o responsavel ou supervisores podem reativar o copilot.')

    const now = new Date().toISOString()
    const aiState = normalizeAiState(conversation.ai_state)
    const nextAiState = {
      ...aiState,
      handoff: {
        ...(normalizeAiState(aiState.handoff)),
        mode: normalizeState(conversation.state) === 'ai_handling' ? 'ai' : 'human',
      },
      copilot: {
        ...(normalizeAiState(aiState.copilot)),
        paused: false,
        mode: 'assistant',
        resume_required: false,
        reactivated_at: now,
        reactivated_by: input.userId,
      },
    }

    const { data, error } = await this.supabase.admin
      .from('conversations')
      .update({ ai_state: nextAiState })
      .eq('workspace_id', input.workspaceId)
      .eq('id', input.conversationId)
      .select(CONVERSATION_SELECT)
      .single()

    if (error) throw new InternalServerErrorException(error.message)

    await this.tryInsertAuditLog({
      workspaceId: input.workspaceId,
      action: 'conversation_copilot_reactivated',
      resource: 'conversation',
      resourceId: input.conversationId,
    })

    return { conversation: data }
  }

  async escalateConversation(input: {
    workspaceId: string
    conversationId: string
    userId: string
    role: string
    reason?: string
    note?: string
  }) {
    const conversation = await this.loadConversation(input.workspaceId, input.conversationId)
    if (!conversation) throw new NotFoundException('Conversa nao encontrada.')
    if (normalizeState(conversation.state) === 'closed') {
      throw new BadRequestException('Conversa encerrada nao pode ser escalonada.')
    }

    this.assertOperatorAccess(conversation, input.userId, input.role, 'Apenas o responsavel ou supervisores podem escalonar a conversa.')

    const reason = normalizeEscalationReason(input.reason || '')
    if (!reason || reason === 'none') {
      throw new BadRequestException('reason invalido. Use sensitive, unresolved, high_value, out_of_hours ou other.')
    }

    const note = String(input.note || '').trim().slice(0, 500)
    const now = new Date().toISOString()
    const aiState = normalizeAiState(conversation.ai_state)
    const nextAiState = {
      ...aiState,
      escalation: {
        ...(normalizeAiState(aiState.escalation)),
        active: true,
        reason,
        note,
        escalated_at: now,
        escalated_by: input.userId,
      },
    }

    const { data, error } = await this.supabase.admin
      .from('conversations')
      .update({
        escalated_at: now,
        escalated_by: input.userId,
        escalation_reason: reason,
        escalation_note: note,
        ai_state: nextAiState,
      })
      .eq('workspace_id', input.workspaceId)
      .eq('id', input.conversationId)
      .select(CONVERSATION_SELECT)
      .single()

    if (error) throw new InternalServerErrorException(error.message)

    await this.tryInsertAuditLog({
      workspaceId: input.workspaceId,
      action: 'conversation_manual_escalation',
      resource: 'conversation',
      resourceId: input.conversationId,
    })

    return { conversation: data }
  }

  async getHandoffHistory(input: {
    workspaceId: string
    conversationId: string
    userId: string
    role: string
  }) {
    const conversation = await this.loadConversation(input.workspaceId, input.conversationId)
    if (!conversation) throw new NotFoundException('Conversa nao encontrada.')

    this.assertOperatorAccess(
      conversation,
      input.userId,
      input.role,
      'Sem permissao para visualizar historico de handoff desta conversa.',
    )

    let query = this.supabase.admin
      .from('audit_logs')
      .select('*')
      .or(`workspace_id.eq.${input.workspaceId},company_id.eq.${input.workspaceId}`)
      .eq('resource', 'conversation')
      .eq('resource_id', input.conversationId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!this.isPrivileged(input.role)) {
      query = query.like('action', 'conversation_%')
    }

    const { data, error } = await query
    if (error) throw new InternalServerErrorException(error.message)

    const events = (data || [])
      .filter((item: any) => String(item?.action || '').startsWith('conversation_'))
      .map((item: any) => ({
        id: item.id || `${item.action}-${item.created_at}`,
        action: item.action,
        created_at: item.created_at || null,
        metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata : {},
      }))

    return { events }
  }

  private isPrivileged(role: string) {
    return PRIVILEGED_ROLES.has(String(role || '').toLowerCase())
  }

  private assertOperatorAccess(conversation: any, userId: string, role: string, message: string) {
    const isPrivileged = this.isPrivileged(role)
    const isAssignee = conversation.assigned_to === userId
    if (!isPrivileged && !isAssignee) {
      throw new ForbiddenException(message)
    }
  }

  private async tryInsertAuditLog(input: {
    workspaceId: string
    action: string
    resource: string
    resourceId: string
  }) {
    const payload = {
      workspace_id: input.workspaceId,
      company_id: input.workspaceId,
      action: input.action,
      resource: input.resource,
      resource_id: input.resourceId,
    }

    const byWorkspace = await this.supabase.admin.from('audit_logs').insert(payload)
    if (!byWorkspace.error) return

    await this.supabase.admin
      .from('audit_logs')
      .insert({
        company_id: input.workspaceId,
        action: input.action,
        resource: input.resource,
        resource_id: input.resourceId,
      })
  }

  private async loadConversation(workspaceId: string, conversationId: string): Promise<any> {
    const { data, error } = await this.supabase.admin
      .from('conversations')
      .select(`
        id, workspace_id, state, status, priority, assigned_to, assigned_by, unread_count, routing_queue, routing_intent, routing_confidence, routing_reason, routing_source, ai_state, escalated_at, escalated_by, escalation_reason, escalation_note,
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
