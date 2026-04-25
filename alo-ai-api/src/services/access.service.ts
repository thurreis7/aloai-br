import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { SupabaseService } from './supabase.service'

export type RequestAccessContext = {
  user: { id: string; email?: string | null }
  profile: any
  isOwner: boolean
  role: string
  workspaceIds: string[]
  activeWorkspaceId: string | null
}

@Injectable()
export class AccessService {
  constructor(private readonly supabase: SupabaseService) {}

  getBearerToken(authorization?: string) {
    const header = authorization || ''
    const [, token] = header.match(/^Bearer\s+(.+)$/i) || []
    return token || null
  }

  async resolveRequestContext(authorization?: string): Promise<RequestAccessContext> {
    const token = this.getBearerToken(authorization)
    if (!token) throw new UnauthorizedException('Sessao ausente.')

    const userRes = await this.supabase.admin.auth.getUser(token)
    if (userRes.error || !userRes.data?.user) {
      throw new UnauthorizedException('Sessao invalida.')
    }

    const user = userRes.data.user
    const profile = await this.loadProfile(user.id)
    const isOwner = profile?.role === 'owner' || profile?.is_owner === true
    const memberships = await this.loadMemberships(user.id)
    const workspaceIds = [...new Set(memberships.map((item) => item.workspace_id).filter(Boolean))]
    const activeWorkspaceId = profile?.workspace_id || (profile as any)?.company_id || workspaceIds[0] || null

    return {
      user: { id: user.id, email: user.email || null },
      profile,
      isOwner,
      role: isOwner ? 'owner' : (profile?.role || memberships[0]?.role || 'agent'),
      workspaceIds,
      activeWorkspaceId,
    }
  }

  async requireOwner(authorization?: string) {
    const context = await this.resolveRequestContext(authorization)
    if (!context.isOwner) {
      throw new ForbiddenException('Apenas o owner global pode executar esta acao.')
    }
    return context
  }

  async assertWorkspaceAccess(context: RequestAccessContext, workspaceId: string) {
    if (context.isOwner) return
    if (!workspaceId || !context.workspaceIds.includes(workspaceId)) {
      throw new ForbiddenException('Acesso negado ao workspace informado.')
    }
  }

  private async loadProfile(userId: string) {
    const extended = await this.supabase.admin
      .from('users')
      .select('id, name, email, role, workspace_id, company_id, is_owner')
      .eq('id', userId)
      .maybeSingle()

    if (!extended.error && extended.data) return extended.data

    const fallback = await this.supabase.admin
      .from('profiles')
      .select('id, full_name, email, role, workspace_id, is_owner')
      .eq('id', userId)
      .maybeSingle()

    if (!fallback.error && fallback.data) return fallback.data
    return null
  }

  private async loadMemberships(userId: string) {
    const membershipResults = await Promise.allSettled([
      this.supabase.admin
        .from('workspace_members')
        .select('workspace_id, role, user_id')
        .eq('user_id', userId),
      this.supabase.admin
        .from('workspace_users')
        .select('workspace_id, role, user_id')
        .eq('user_id', userId),
      this.supabase.admin
        .from('users')
        .select('company_id, workspace_id, role')
        .eq('id', userId)
        .maybeSingle(),
    ])

    const memberships: Array<{ workspace_id: string; role: string; user_id: string }> = []

    for (const result of membershipResults) {
      if (result.status !== 'fulfilled') continue
      const value: any = result.value
      if (Array.isArray(value.data)) {
        for (const item of value.data) {
          if (item?.workspace_id) memberships.push(item)
        }
        continue
      }

      const profile = value.data
      const workspaceId = profile?.workspace_id || profile?.company_id
      if (workspaceId) {
        memberships.push({ workspace_id: workspaceId, role: profile.role || 'agent', user_id: userId })
      }
    }

    return memberships
  }
}
