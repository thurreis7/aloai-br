import { useState, useEffect, useContext, createContext } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const ROLE_DEFAULTS = {
  owner: {
    perm_channels_view: true, perm_channels_respond: true,
    perm_conv_scope: 'all',
    perm_reply: true, perm_transfer: true, perm_close: true,
    perm_kanban_move: true, perm_tags: true, perm_history: true,
    perm_kanban_view: true, perm_kanban_edit: true,
    perm_reports_metrics: true, perm_reports_team: true,
    perm_ai: true,
    perm_manage_users: true, perm_connect_channels: true, perm_integrations: true,
  },
  admin: {
    perm_channels_view: true, perm_channels_respond: true,
    perm_conv_scope: 'all',
    perm_reply: true, perm_transfer: true, perm_close: true,
    perm_kanban_move: true, perm_tags: true, perm_history: true,
    perm_kanban_view: true, perm_kanban_edit: true,
    perm_reports_metrics: true, perm_reports_team: true,
    perm_ai: true,
    perm_manage_users: true, perm_connect_channels: true, perm_integrations: true,
  },
  supervisor: {
    perm_channels_view: true, perm_channels_respond: true,
    perm_conv_scope: 'all',
    perm_reply: true, perm_transfer: true, perm_close: true,
    perm_kanban_move: true, perm_tags: true, perm_history: true,
    perm_kanban_view: true, perm_kanban_edit: true,
    perm_reports_metrics: true, perm_reports_team: true,
    perm_ai: true,
    perm_manage_users: false, perm_connect_channels: false, perm_integrations: false,
  },
  agent: {
    perm_channels_view: true, perm_channels_respond: true,
    perm_conv_scope: 'own',
    perm_reply: true, perm_transfer: false, perm_close: false,
    perm_kanban_move: false, perm_tags: true, perm_history: false,
    perm_kanban_view: true, perm_kanban_edit: false,
    perm_reports_metrics: false, perm_reports_team: false,
    perm_ai: true,
    perm_manage_users: false, perm_connect_channels: false, perm_integrations: false,
  },
}

const PermissionsContext = createContext(null)

export function PermissionsProvider({ children }) {
  const { user, profile, wsRole, isOwner } = useAuth()
  const [permissions, setPermissions] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setPermissions(null)
      setRole(null)
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      try {
        // Role: vem do profile (public.users) ou do wsRole como fallback
        const userRole = isOwner ? 'owner' : (profile?.role || wsRole?.role || 'agent')
        setRole(userRole)

        // owner e admin sempre têm acesso total — sem precisar checar tabela
        if (userRole === 'owner' || userRole === 'admin') {
          setPermissions(ROLE_DEFAULTS[userRole])
          setLoading(false)
          return
        }

        // Para outros roles: busca permissões customizadas
        const { data: perms } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', wsRole?.workspace_id)
          .maybeSingle()

        setPermissions(perms || ROLE_DEFAULTS[userRole] || ROLE_DEFAULTS.agent)
      } catch {
        const fallbackRole = isOwner ? 'owner' : (profile?.role || 'agent')
        setPermissions(ROLE_DEFAULTS[fallbackRole] || ROLE_DEFAULTS.agent)
        setRole(fallbackRole)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user, profile, wsRole, isOwner])

  const can = (permission) => {
    if (isOwner || role === 'owner' || role === 'admin') return true
    if (!permissions) return false
    return !!permissions[permission]
  }

  const convScope = () => {
    if (isOwner || role === 'owner' || role === 'admin') return 'all'
    return permissions?.perm_conv_scope || 'own'
  }

  return (
    <PermissionsContext.Provider value={{ permissions, role, loading, can, convScope }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext)
  if (!ctx) throw new Error('usePermissions must be used inside PermissionsProvider')
  return ctx
}
