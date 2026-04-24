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

function normalizeWorkspace(item) {
  if (!item?.id) return null
  const name = item.company_name || item.name || item.slug || `Cliente ${String(item.id).slice(0, 8)}`
  return {
    id: item.id,
    name,
    company_name: item.company_name || item.name || name,
    slug: item.slug || null,
    plan: item.plan || null,
    ai_enabled: Boolean(item.ai_enabled),
    created_at: item.created_at || null,
  }
}

function uniqueWorkspaces(items) {
  const map = new Map()
  items.forEach((item) => {
    const normalized = normalizeWorkspace(item)
    if (normalized?.id && !map.has(normalized.id)) map.set(normalized.id, normalized)
  })
  return Array.from(map.values())
}

function normalizeMembership(item, source) {
  const workspaceId = item?.workspace_id || item?.company_id || null
  const userId = item?.user_id || item?.id || null
  if (!workspaceId || !userId) return null

  return {
    id: item.id || `${source}-${userId}-${workspaceId}`,
    workspace_id: workspaceId,
    company_id: item.company_id || workspaceId,
    user_id: userId,
    role: item.role || 'agent',
    display_name: item.display_name || item.name || null,
    is_online: Boolean(item.is_online),
    created_at: item.created_at || null,
    workspace: null,
    source,
  }
}

function uniqueMemberships(items) {
  const map = new Map()
  items.forEach((item) => {
    const normalized = item?.source ? item : null
    if (!normalized?.workspace_id || !normalized?.user_id) return

    const key = `${normalized.user_id}:${normalized.workspace_id}`
    const current = map.get(key)
    if (!current) {
      map.set(key, normalized)
      return
    }

    if (current.source === 'users_company_id' && normalized.source !== 'users_company_id') {
      map.set(key, { ...current, ...normalized, company_id: normalized.company_id || normalized.workspace_id })
    }
  })
  return Array.from(map.values())
}

async function loadProfileFromUsers(userId) {
  const extendedRes = await supabase
    .from('users')
    .select('id, name, email, role, avatar_url, company_id, departments, is_online')
    .eq('id', userId)
    .maybeSingle()

  let data = extendedRes.data
  if (extendedRes.error) {
    const basicRes = await supabase
      .from('users')
      .select('id, name, email, role, company_id')
      .eq('id', userId)
      .maybeSingle()

    if (basicRes.error) throw basicRes.error
    data = basicRes.data
  }

  if (!data) return null

  return {
    id: data.id,
    email: data.email || '',
    full_name: data.name || '',
    role: data.role || 'agent',
    is_owner: data.role === 'owner',
    avatar_url: data.avatar_url || null,
    workspace_id: data.company_id || null,
    company_id: data.company_id || null,
    departments: data.departments || [],
    is_online: Boolean(data.is_online),
    source: 'users',
    raw: data,
  }
}

async function loadWorkspacesFromWorkspacesTable() {
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, company_name, name, slug, plan, ai_enabled, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error
  return uniqueWorkspaces(data || [])
}

async function loadWorkspacesFromCompaniesTable() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, company_name, name, slug, plan, ai_enabled, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error
  return uniqueWorkspaces(data || [])
}

async function loadWorkspacesFromUsersTable() {
  const { data, error } = await supabase
    .from('users')
    .select('company_id, name')
    .not('company_id', 'is', null)

  if (error) throw error

  const deduped = new Map()
  ;(data || []).forEach((item) => {
    if (!item.company_id || deduped.has(item.company_id)) return
    deduped.set(item.company_id, {
      id: item.company_id,
      company_name: item.name || `Cliente ${String(item.company_id).slice(0, 8)}`,
      name: item.name || `Cliente ${String(item.company_id).slice(0, 8)}`,
    })
  })

  return uniqueWorkspaces(Array.from(deduped.values()))
}

async function loadWorkspaceByIdFromWorkspaces(workspaceId) {
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, company_name, name, slug, plan, ai_enabled, created_at')
    .eq('id', workspaceId)
    .maybeSingle()

  if (error) throw error
  return normalizeWorkspace(data)
}

async function loadWorkspaceByIdFromCompanies(workspaceId) {
  const { data, error } = await supabase
    .from('companies')
    .select('id, company_name, name, slug, plan, ai_enabled, created_at')
    .eq('id', workspaceId)
    .maybeSingle()

  if (error) throw error
  return normalizeWorkspace(data)
}

async function loadWorkspaceByIdFromUsers(workspaceId) {
  const { data, error } = await supabase
    .from('users')
    .select('company_id, name')
    .eq('company_id', workspaceId)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data?.company_id) return null

  return normalizeWorkspace({
    id: data.company_id,
    company_name: data.name,
    name: data.name,
  })
}

async function loadMembershipsFromWorkspaceMembers(userId) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('id, workspace_id, user_id, role, display_name, is_online, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || [])
    .map((item) => normalizeMembership(item, 'workspace_members'))
    .filter(Boolean)
}

async function loadMembershipsFromWorkspaceUsers(userId) {
  const { data, error } = await supabase
    .from('workspace_users')
    .select('id, workspace_id, user_id, role, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || [])
    .map((item) => normalizeMembership(item, 'workspace_users'))
    .filter(Boolean)
}

async function loadMembershipsFromUsersCompany(userId) {
  const profile = await loadProfileFromUsers(userId)
  if (!profile?.company_id) return []

  return uniqueMemberships([
    normalizeMembership({
      id: `users-${profile.id}-${profile.company_id}`,
      workspace_id: profile.company_id,
      company_id: profile.company_id,
      user_id: profile.id,
      role: profile.role || 'agent',
      created_at: null,
      is_online: profile.is_online,
      display_name: profile.full_name,
    }, 'users_company_id'),
  ])
}

async function loadWorkspaceById(workspaceId) {
  if (!workspaceId) return null

  try {
    const fromWorkspaces = await loadWorkspaceByIdFromWorkspaces(workspaceId)
    if (fromWorkspaces) return fromWorkspaces
  } catch {
    // ignore
  }

  try {
    const fromCompanies = await loadWorkspaceByIdFromCompanies(workspaceId)
    if (fromCompanies) return fromCompanies
  } catch {
    // ignore
  }

  try {
    return await loadWorkspaceByIdFromUsers(workspaceId)
  } catch {
    return null
  }
}

async function loadAllWorkspaces() {
  try {
    const workspaces = await loadWorkspacesFromWorkspacesTable()
    if (workspaces.length) return workspaces
  } catch {
    // ignore
  }

  try {
    const companies = await loadWorkspacesFromCompaniesTable()
    if (companies.length) return companies
  } catch {
    // ignore
  }

  try {
    return await loadWorkspacesFromUsersTable()
  } catch {
    return []
  }
}

async function loadMemberships(userId) {
  const membershipGroups = await Promise.allSettled([
    loadMembershipsFromWorkspaceMembers(userId),
    loadMembershipsFromWorkspaceUsers(userId),
    loadMembershipsFromUsersCompany(userId),
  ])

  return uniqueMemberships(
    membershipGroups.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
  )
}

function pickActiveWorkspaceId({ isOwner, profile, workspaces }) {
  const availableIds = new Set(workspaces.map((item) => item.id))
  const storedId = safeStorageGet(ACTIVE_WORKSPACE_STORAGE_KEY)

  if (isOwner) {
    if (storedId && availableIds.has(storedId)) return storedId
    return workspaces[0]?.id || null
  }

  const companyId = profile?.company_id || profile?.workspace_id || null
  if (companyId && availableIds.has(companyId)) return companyId
  if (storedId && availableIds.has(storedId)) return storedId
  return workspaces[0]?.id || companyId || null
}

export async function resolveAuthAccess(userId) {
  let profile = null

  try {
    profile = await loadProfileFromUsers(userId)
  } catch {
    profile = null
  }

  const isOwner = profile?.role === 'owner'
  let memberships = await loadMemberships(userId)
  let workspaces = []

  if (isOwner) {
    workspaces = await loadAllWorkspaces()
    memberships = workspaces.map((workspace) => ({
      id: `owner-${profile?.id || userId}-${workspace.id}`,
      workspace_id: workspace.id,
      company_id: workspace.id,
      user_id: profile?.id || userId,
      role: 'owner',
      display_name: profile?.full_name || null,
      is_online: Boolean(profile?.is_online),
      created_at: null,
      workspace,
      source: 'owner_workspace',
    }))
  } else {
    const workspaceIds = [...new Set(memberships.map((item) => item.workspace_id).filter(Boolean))]
    const loadedWorkspaces = await Promise.all(workspaceIds.map(async (workspaceId) => {
      const workspace = await loadWorkspaceById(workspaceId)
      return workspace || {
        id: workspaceId,
        name: `Cliente ${String(workspaceId).slice(0, 8)}`,
        company_name: `Cliente ${String(workspaceId).slice(0, 8)}`,
      }
    }))
    workspaces = uniqueWorkspaces(loadedWorkspaces)
  }

  memberships = uniqueMemberships(
    memberships.map((membership) => ({
      ...membership,
      workspace: workspaces.find((item) => item.id === membership.workspace_id) || membership.workspace || null,
      company_id: membership.company_id || membership.workspace_id,
    }))
  )

  const activeWorkspaceId = pickActiveWorkspaceId({ isOwner, profile, workspaces })
  const activeWorkspace = workspaces.find((item) => item.id === activeWorkspaceId) || null
  const activeMembership = memberships.find((item) => item.workspace_id === activeWorkspaceId) || memberships[0] || null
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
