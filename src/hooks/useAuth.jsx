import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [ws,       setWs]       = useState(null)  // workspace info
  const [wsRole,   setWsRole]   = useState(null)  // role no workspace
  const [workspaceReady, setWorkspaceReady] = useState(false)

  /** Busca workspace e role do usuário logado */
  async function loadWorkspace(userId) {
    setWorkspaceReady(false)
    try {
      const { data: members } = await supabase
        .from('workspace_members')
        .select('*, workspaces(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      const member = Array.isArray(members) ? members[0] : null

      if (member) {
        setWs(member.workspaces)
        setWsRole({ role: member.role, workspace_id: member.workspace_id })
      } else {
        setWs(null)
        setWsRole(null)
      }
    } catch {
      // Tabela pode não existir ainda — ignora
      setWs(null)
      setWsRole(null)
    } finally {
      setWorkspaceReady(true)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null)
      setLoading(false)
      if (data?.session?.user) loadWorkspace(data.session.user.id)
      else setWorkspaceReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user || null
      setUser(u)
      setLoading(false)
      if (u) loadWorkspace(u.id)
      else {
        setWs(null)
        setWsRole(null)
        setWorkspaceReady(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setWs(null)
    setWsRole(null)
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, ws, wsRole, workspaceReady, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
