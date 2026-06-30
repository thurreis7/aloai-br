import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { SupabaseService } from './supabase.service'

type MessageRow = {
  conversation_id: string
  sender_id?: string | null
  sender_type: string
  created_at: string
}

@Injectable()
export class DashboardService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAgentPerformance(workspaceId: string) {
    const [membersRes, messagesRes] = await Promise.all([
      this.loadMembers(workspaceId),
      this.supabase.admin
        .from('messages')
        .select('id, workspace_id, conversation_id, sender_id, sender_type, created_at, is_internal_note')
        .eq('workspace_id', workspaceId)
        .eq('is_internal_note', false)
        .in('sender_type', ['contact', 'agent'])
        .order('created_at', { ascending: true }),
    ])

    if (messagesRes.error) throw new InternalServerErrorException(messagesRes.error.message)
    const members = membersRes
    const responseSums = new Map<string, { totalSeconds: number; count: number }>()
    const byConversation = new Map<string, MessageRow[]>()

    for (const item of (messagesRes.data || []) as MessageRow[]) {
      if (!item.conversation_id) continue
      const list = byConversation.get(item.conversation_id) || []
      list.push(item)
      byConversation.set(item.conversation_id, list)
    }

    for (const messages of byConversation.values()) {
      let pendingContactAt: number | null = null
      for (const message of messages) {
        const timestamp = new Date(message.created_at).getTime()
        if (!Number.isFinite(timestamp)) continue
        if (message.sender_type === 'contact') {
          pendingContactAt = timestamp
          continue
        }
        if (message.sender_type === 'agent' && pendingContactAt && message.sender_id) {
          const seconds = Math.max(0, (timestamp - pendingContactAt) / 1000)
          const current = responseSums.get(message.sender_id) || { totalSeconds: 0, count: 0 }
          current.totalSeconds += seconds
          current.count += 1
          responseSums.set(message.sender_id, current)
          pendingContactAt = null
        }
      }
    }

    return {
      agents: members.map((member: any) => {
        const stats = responseSums.get(member.user_id || member.id)
        return {
          agent_id: member.user_id || member.id,
          agent_name: member.display_name || member.name || 'Agente',
          avg_response_minutes: stats?.count ? Number((stats.totalSeconds / stats.count / 60).toFixed(1)) : null,
        }
      }),
    }
  }

  private async loadMembers(workspaceId: string) {
    const membersRes = await this.supabase.admin
      .from('workspace_members')
      .select('id, user_id, display_name, role')
      .eq('workspace_id', workspaceId)

    if (!membersRes.error && (membersRes.data || []).length) return membersRes.data || []

    const usersRes = await this.supabase.admin
      .from('users')
      .select('id, name, role')
      .eq('company_id', workspaceId)

    if (usersRes.error) throw new InternalServerErrorException(usersRes.error.message)
    return (usersRes.data || []).map((user: any) => ({
      id: user.id,
      user_id: user.id,
      display_name: user.name,
      role: user.role,
    }))
  }
}
