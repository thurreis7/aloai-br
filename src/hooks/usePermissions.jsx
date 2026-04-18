import { useState, useEffect, useContext, createContext } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

/* ─── Default permissions per role ─── */
const ROLE_DEFAULTS = {
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
  const { user, wsRole } = useAuth()
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
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        let userRole = userData?.role || wsRole?.role

        if (!userRole) {
          const { data: memberData } = await supabase
            .from('workspace_members')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()
          userRole = memberData?.role || 'agent'
        }

        setRole(userRole)

        // Admins sempre têm acesso total — não precisa checar tabela
        if (userRole === 'admin') {
          setPermissions(ROLE_DEFAULTS.admin)
          setLoading(false)
          return
        }

        // Busca permissões customizadas
        const { data: perms } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        setPermissions(perms || ROLE_DEFAULTS[userRole])
      } catch {
        setPermissions(ROLE_DEFAULTS['agent'])
        setRole('agent')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user, wsRole])

  const can = (permission) => {
    if (!permissions) return false
    if (role === 'admin') return true
    return !!permissions[permission]
  }

  const convScope = () => permissions?.perm_conv_scope || 'own'

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
