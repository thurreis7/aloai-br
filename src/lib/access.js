import { supabase } from './supabase'

export const ACTIVE_WORKSPACE_STORAGE_KEY = 'alo-active-workspace-id'

function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeStorageSet(key, value) {
  try {
    if (value) window.localStorage.setItem(key, value)
    else window.localStorage.removeItem(key)
  } catch {
    // noop
  }
}

function normalizeWorkspace(workspace) {
  if (!workspace) return null

  return {
    ...workspace,
    id: workspace.id,
    name: workspace.company_name || workspace.name || workspace.slug || 'Workspace',
    company_name: workspace.company_name || workspace.name || workspace.slug || 'Workspace',
  }
}

function uniqueWorkspaces(items) {
  const map = new Map()
  items.forEach((item) => {
    const workspace = normalizeWorkspace(item)
    if (workspace?.id && !map.has(workspace.id)) map.set(workspace.id, workspace)
  })
  return Array.from(map.values())
}

async function loadProfileFromProfiles(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_owner, avatar_url, workspace_id, company_id')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name || '',
    role: data.role || 'agent',
    is_owner: Boolean(data.is_owner) || data.role === 'owner',
    avatar_url: data.avatar_url || null,
    workspace_id: data.workspace_id || data.company_id || null,
    source: 'profiles',
    raw: data,
  }
}

async function loadProfileFromLegacyUsers(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, avatar_url, company_id, departments, is_online')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    full_name: data.name || '',
    role: data.role || 'agent',
    is_owner: data.role === 'owner',
    avatar_url: data.avatar_url || null,
    workspace_id: data.company_id || null,
    departments: data.departments || [],
    is_online: Boolean(data.is_online),
    source: 'users',
    raw: data,
  }
}

async function loadMembershipsFromWorkspaceUsers(userId) {
  const { data, error } = await supabase
    .from('workspace_users')
    .select(`
      id,
      workspace_id,
      user_id,
      role,
      created_at,
      workspaces (
        id,
        company_name,
        name,
        slug,
        plan,
        ai_enabled,
        created_by,
        created_at
      )
    `)
    .eq('user_id', userId)

  if (error) throw error

  return (data || []).map((item) => ({
    id: item.id,
    workspace_id: item.workspace_id,
    user_id: item.user_id,
    role: item.role || 'agent',
    created_at: item.created_at || null,
    workspace: normalizeWorkspace(item.workspaces),
    source: 'workspace_users',
  }))
}

async function loadMembershipsFromWorkspaceMembers(userId) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      id,
      workspace_id,
      user_id,
      role,
      created_at,
      display_name,
      is_online,
      workspaces (
        id,
        company_name,
        name,
        slug,
        plan,
        ai_enabled,
        created_by,
        created_at
      )
    `)
    .eq('user_id', userId)

  if (error) throw error

  return (data || []).map((item) => ({
    id: item.id,
    workspace_id: item.workspace_id,
    user_id: item.user_id,
    role: item.role || 'agent',
    created_at: item.created_at || null,
    display_name: item.display_name || null,
    is_online: Boolean(item.is_online),
    workspace: normalizeWorkspace(item.workspaces),
    source: 'workspace_members',
  }))
}

async function loadAllWorkspaces() {
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, company_name, name, slug, plan, ai_enabled, created_by, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error
  return uniqueWorkspaces(data || [])
}

async function loadWorkspaceById(workspaceId) {
  if (!workspaceId) return null

  const { data, error } = await supabase
    .from('workspaces')
    .select('id, company_name, name, slug, plan, ai_enabled, created_by, created_at')
    .eq('id', workspaceId)
    .maybeSingle()

  if (error) throw error
  return normalizeWorkspace(data)
}

function pickActiveWorkspaceId({ isOwner, profile, memberships, workspaces }) {
  const storedId = safeStorageGet(ACTIVE_WORKSPACE_STORAGE_KEY)
  const availableIds = new Set(workspaces.map((item) => item.id))

  if (storedId && availableIds.has(storedId)) return storedId

  if (!isOwner) {
    const membershipWorkspaceId = memberships[0]?.workspace_id
    if (membershipWorkspaceId && availableIds.has(membershipWorkspaceId)) return membershipWorkspaceId

    if (profile?.workspace_id && availableIds.has(profile.workspace_id)) return profile.workspace_id
  }

  return workspaces[0]?.id || null
}

export async function resolveAuthAccess(userId) {
  let profile = null

  try {
    profile = await loadProfileFromProfiles(userId)
  } catch {
    profile = null
  }

  if (!profile) {
    try {
      profile = await loadProfileFromLegacyUsers(userId)
    } catch {
      profile = null
    }
  }

  let memberships = []

  try {
    memberships = await loadMembershipsFromWorkspaceUsers(userId)
  } catch {
    memberships = []
  }

  if (!memberships.length) {
    try {
      memberships = await loadMembershipsFromWorkspaceMembers(userId)
    } catch {
      memberships = []
    }
  }

  if (!memberships.length && profile?.workspace_id) {
    try {
      const workspace = await loadWorkspaceById(profile.workspace_id)
      if (workspace) {
        memberships = [{
          id: `profile-${profile.workspace_id}`,
          workspace_id: workspace.id,
          user_id: userId,
          role: profile.role || 'agent',
          created_at: null,
          workspace,
          source: 'profile_workspace',
        }]
      }
    } catch {
      memberships = memberships
    }
  }

  const isOwner = Boolean(profile?.is_owner) || profile?.role === 'owner'
  let workspaces = uniqueWorkspaces(memberships.map((item) => item.workspace).filter(Boolean))

  if (isOwner) {
    try {
      workspaces = await loadAllWorkspaces()
    } catch {
      workspaces = uniqueWorkspaces(memberships.map((item) => item.workspace).filter(Boolean))
    }
  }

  const activeWorkspaceId = pickActiveWorkspaceId({ isOwner, profile, memberships, workspaces })
  const activeWorkspace = workspaces.find((item) => item.id === activeWorkspaceId) || null
  const activeMembership = memberships.find((item) => item.workspace_id === activeWorkspaceId) || null
  const effectiveRole = isOwner ? 'owner' : (activeMembership?.role || profile?.role || 'agent')

  safeStorageSet(ACTIVE_WORKSPACE_STORAGE_KEY, activeWorkspaceId)

  return {
    profile,
    memberships,
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    activeMembership,
    isOwner,
    role: effectiveRole,
  }
}

export function persistActiveWorkspace(workspaceId) {
  safeStorageSet(ACTIVE_WORKSPACE_STORAGE_KEY, workspaceId)
}
