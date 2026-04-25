import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { SupabaseService } from './supabase.service'

const LEAD_STATUSES = new Set(['open', 'qualified', 'disqualified'])

function normalizeLeadStatus(input: string | undefined) {
  const value = String(input || '').trim().toLowerCase()
  if (LEAD_STATUSES.has(value)) return value
  if (value === 'won' || value === 'resolved') return 'qualified'
  if (value === 'lost' || value === 'closed') return 'disqualified'
  return 'open'
}

@Injectable()
export class LeadService {
  constructor(private readonly supabase: SupabaseService) {}

  async upsertForConversation(input: {
    workspaceId: string
    conversationId: string
    contactId: string
    sourceChannelId?: string | null
    ownerId?: string | null
    status?: string
  }) {
    const { data: existing, error: existingError } = await this.supabase.admin
      .from('leads')
      .select('id, status, owner_id, source_channel_id, conversation_id')
      .eq('workspace_id', input.workspaceId)
      .eq('conversation_id', input.conversationId)
      .maybeSingle()

    if (existingError) throw new InternalServerErrorException(existingError.message)

    const payload = {
      workspace_id: input.workspaceId,
      company_id: input.workspaceId,
      contact_id: input.contactId,
      conversation_id: input.conversationId,
      owner_id: input.ownerId ?? existing?.owner_id ?? null,
      source_channel_id: input.sourceChannelId ?? existing?.source_channel_id ?? null,
      status: normalizeLeadStatus(input.status || existing?.status || 'open'),
    }

    const query = existing?.id
      ? this.supabase.admin.from('leads').update(payload).eq('id', existing.id)
      : this.supabase.admin.from('leads').insert(payload)

    const { data, error } = await query
      .select('id, workspace_id, contact_id, owner_id, source_channel_id, conversation_id, status, created_at, updated_at')
      .single()

    if (error) throw new InternalServerErrorException(error.message)
    return data
  }

  async updateConversationQualification(input: {
    workspaceId: string
    conversationId: string
    status?: string
    ownerId?: string | null
  }) {
    const { data: conversation, error: conversationError } = await this.supabase.admin
      .from('conversations')
      .select('id, workspace_id, contact_id, channel_id, assigned_to')
      .eq('workspace_id', input.workspaceId)
      .eq('id', input.conversationId)
      .maybeSingle()

    if (conversationError) throw new InternalServerErrorException(conversationError.message)
    if (!conversation) throw new NotFoundException('Conversa nao encontrada.')
    if (!conversation.contact_id) throw new BadRequestException('Conversa sem contato vinculado.')

    const lead = await this.upsertForConversation({
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      contactId: conversation.contact_id,
      sourceChannelId: conversation.channel_id,
      ownerId: input.ownerId === undefined ? conversation.assigned_to : input.ownerId,
      status: input.status,
    })

    await this.supabase.admin
      .from('conversations')
      .update({ lead_id: lead.id })
      .eq('workspace_id', input.workspaceId)
      .eq('id', input.conversationId)

    return { lead }
  }
}

