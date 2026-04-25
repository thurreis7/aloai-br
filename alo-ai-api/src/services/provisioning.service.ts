import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { SupabaseService } from './supabase.service'

type WorkspaceSetupInput = {
  companyName: string
  ownerName: string
  channel: string
  plan?: string
  aiEnabled?: boolean
  teamMembers: Array<{ name: string; email?: string; password?: string; role?: string }>
  ownerId: string
}

type CreateUserInput = {
  workspaceId: string
  companyName: string
  fullName: string
  email?: string
  password?: string
  role?: string
}

function slugify(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeChannelType(type: string) {
  const normalized = String(type || '').trim().toLowerCase()
  if (!normalized) return ''
  if (normalized === 'gmail') return 'email'
  return normalized
}

function getChannelName(type: string) {
  const normalized = normalizeChannelType(type)
  if (normalized === 'whatsapp') return 'WhatsApp Business'
  if (normalized === 'instagram') return 'Instagram'
  if (normalized === 'email') return 'E-mail'
  if (normalized === 'webchat') return 'Web Chat'
  return normalized || 'Canal'
}

@Injectable()
export class ProvisioningService {
  constructor(private readonly supabase: SupabaseService) {}

  async listWorkspaces() {
    const workspacesRes = await this.supabase.admin
      .from('workspaces')
      .select('id, company_name, name, slug, plan, ai_enabled, created_by, created_at')
      .order('created_at', { ascending: true })

    if (!workspacesRes.error) {
      return (workspacesRes.data || []).map((item) => this.normalizeWorkspace(item))
    }

    return []
  }

  async setupWorkspace(input: WorkspaceSetupInput) {
    if (!input.companyName || !input.ownerName || !input.channel || !input.teamMembers?.length) {
      throw new BadRequestException('Dados obrigatorios ausentes.')
    }

    const workspace = await this.createWorkspaceRecord({
      companyName: input.companyName,
      plan: input.plan || 'growth',
      aiEnabled: Boolean(input.aiEnabled),
      ownerId: input.ownerId,
    })

    const createdMembers = []
    for (const member of input.teamMembers) {
      if (!member?.name?.trim()) continue
      const created = await this.createWorkspaceUser({
        workspaceId: workspace.id,
        companyName: input.companyName,
        fullName: member.name.trim(),
        email: member.email,
        password: member.password,
        role: member.role,
      })
      createdMembers.push(created)
    }

    const channel = await this.upsertChannel(workspace.id, input.channel)
    await this.tryInsertAuditLog({
      workspaceId: workspace.id,
      action: 'workspace_setup',
      resource: 'workspace',
      resourceId: workspace.id,
    })

    return { ok: true, workspace, channel, members: createdMembers }
  }

  async createWorkspaceUser(input: CreateUserInput) {
    const email = input.email?.trim() || `${slugify(input.fullName)}@${slugify(input.companyName)}.aloai.local`
    const password = input.password?.trim() || `${slugify(input.companyName)}123`
    const role = this.normalizeRole(input.role)

    const authRes = await this.supabase.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    })

    if (authRes.error || !authRes.data.user) {
      throw new InternalServerErrorException(authRes.error?.message || 'Nao foi possivel criar o usuario.')
    }

    const userId = authRes.data.user.id
    await this.upsertUserRecord({
      userId,
      email,
      fullName: input.fullName,
      role,
      workspaceId: input.workspaceId,
    })
    await this.upsertMembership({ workspaceId: input.workspaceId, userId, role, displayName: input.fullName })
    await this.seedPermissionsIfNeeded({ workspaceId: input.workspaceId, userId, role })

    return {
      id: userId,
      full_name: input.fullName,
      email,
      role,
      password,
      workspace_id: input.workspaceId,
      company_id: input.workspaceId,
    }
  }

  private normalizeWorkspace(item: any) {
    const name = item.company_name || item.name || item.slug || `Cliente ${String(item.id).slice(0, 8)}`
    return {
      id: item.id,
      name,
      company_name: item.company_name || item.name || name,
      slug: item.slug || null,
      plan: item.plan || null,
      ai_enabled: Boolean(item.ai_enabled),
      created_by: item.created_by || null,
      created_at: item.created_at || null,
    }
  }

  private normalizeRole(role?: string) {
    if (role === 'owner') return 'owner'
    if (role === 'admin') return 'admin'
    if (role === 'supervisor') return 'supervisor'
    return 'agent'
  }

  private async createWorkspaceRecord({ companyName, plan, aiEnabled, ownerId }: any) {
    const slug = `${slugify(companyName)}-${Date.now().toString(36)}`
    const payload = {
      company_name: companyName,
      name: companyName,
      slug,
      plan,
      ai_enabled: aiEnabled,
      created_by: ownerId,
    }

    const res = await this.supabase.admin
      .from('workspaces')
      .insert(payload)
      .select('id, company_name, name, slug, plan, ai_enabled, created_by, created_at')
      .single()

    if (!res.error && res.data?.id) return this.normalizeWorkspace(res.data)

    throw new InternalServerErrorException(res.error?.message || 'Nao foi possivel criar o workspace.')
  }

  private async upsertUserRecord({ userId, email, fullName, role, workspaceId }: any) {
    const payload = {
      id: userId,
      name: fullName,
      email,
      role,
      workspace_id: workspaceId,
      company_id: workspaceId,
    }

    const { error } = await this.supabase.admin.from('users').upsert(payload)
    if (error) throw new InternalServerErrorException(`users: ${error.message}`)
  }

  private async upsertMembership({ workspaceId, userId, role, displayName }: any) {
    const memberPayload = {
      workspace_id: workspaceId,
      user_id: userId,
      role,
      display_name: displayName,
      company_id: workspaceId,
    }

    await this.supabase.admin
      .from('workspace_members')
      .upsert(memberPayload, { onConflict: 'workspace_id,user_id' })

    await this.supabase.admin
      .from('workspace_users')
      .upsert({ workspace_id: workspaceId, user_id: userId, role, company_id: workspaceId }, { onConflict: 'workspace_id,user_id' })
  }

  private async seedPermissionsIfNeeded({ workspaceId, userId, role }: any) {
    if (role === 'owner' || role === 'admin') return

    const defaultsByRole: Record<string, Record<string, any>> = {
      supervisor: {
        perm_channels_view: true,
        perm_channels_respond: true,
        perm_conv_scope: 'all',
        perm_reply: true,
        perm_transfer: true,
        perm_close: true,
        perm_kanban_move: true,
        perm_tags: true,
        perm_history: true,
        perm_kanban_view: true,
        perm_kanban_edit: true,
        perm_reports_metrics: true,
        perm_reports_team: true,
        perm_ai: true,
        perm_manage_users: false,
        perm_connect_channels: false,
        perm_integrations: false,
      },
      agent: {
        perm_channels_view: true,
        perm_channels_respond: true,
        perm_conv_scope: 'own',
        perm_reply: true,
        perm_transfer: false,
        perm_close: true,
        perm_kanban_move: false,
        perm_tags: true,
        perm_history: false,
        perm_kanban_view: true,
        perm_kanban_edit: false,
        perm_reports_metrics: false,
        perm_reports_team: false,
        perm_ai: true,
        perm_manage_users: false,
        perm_connect_channels: false,
        perm_integrations: false,
      },
    }

    const defaults = defaultsByRole[role] || defaultsByRole.agent
    await this.supabase.admin
      .from('user_permissions')
      .upsert({ ...defaults, user_id: userId, workspace_id: workspaceId, company_id: workspaceId }, { onConflict: 'workspace_id,user_id' })
  }

  async upsertChannel(workspaceId: string, channelType: string, config: Record<string, any> = {}) {
    const normalizedType = normalizeChannelType(channelType)
    const payload = {
      workspace_id: workspaceId,
      company_id: workspaceId,
      type: normalizedType,
      name: getChannelName(normalizedType),
      is_active: true,
      connection_status: 'active',
      config,
    }

    const res = await this.supabase.admin
      .from('channels')
      .upsert(payload, { onConflict: 'workspace_id,type' })
      .select('id, workspace_id, company_id, type, name, is_active, connection_status, config, created_at, updated_at')
      .single()

    if (!res.error && res.data) return res.data
    throw new InternalServerErrorException(res.error?.message || 'Nao foi possivel configurar o canal.')
  }

  async listChannels(workspaceId: string) {
    const res = await this.supabase.admin
      .from('channels')
      .select('id, workspace_id, company_id, type, name, is_active, connection_status, config, created_at, updated_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (res.error) throw new InternalServerErrorException(res.error.message)
    return res.data || []
  }

  async disconnectChannel(workspaceId: string, channelId: string) {
    const res = await this.supabase.admin
      .from('channels')
      .update({ is_active: false, connection_status: 'inactive' })
      .eq('workspace_id', workspaceId)
      .eq('id', channelId)
      .select('id, workspace_id, type, connection_status, is_active')
      .single()

    if (res.error) throw new InternalServerErrorException(res.error.message)
    return res.data
  }

  private async tryInsertAuditLog({ workspaceId, action, resource, resourceId }: any) {
    await this.supabase.admin
      .from('audit_logs')
      .insert({
        workspace_id: workspaceId,
        company_id: workspaceId,
        action,
        resource,
        resource_id: resourceId,
      })
  }
}
