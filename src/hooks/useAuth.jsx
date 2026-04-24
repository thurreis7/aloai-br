import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import { persistActiveWorkspace, resolveAuthAccess } from '../lib/access'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,           setUser]           = useState(null)   // auth.users
  const [profile,        setProfile]        = useState(null)
  const [company,        setCompany]        = useState(null)
  const [workspaces,     setWorkspaces]     = useState([])
  const [memberships,    setMemberships]    = useState([])
  const [isOwner,        setIsOwner]        = useState(false)
  const [role,           setRole]           = useState(null)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [workspaceReady, setWorkspaceReady] = useState(false)

  async function loadProfile(userId) {
    setWorkspaceReady(false)
    try {
      const access = await resolveAuthAccess(userId)

      setProfile(access.profile)
      setCompany(access.activeWorkspace)
      setWorkspaces(access.workspaces)
      setMemberships(access.memberships)
      setIsOwner(access.isOwner)
      setRole(access.role)
      setActiveWorkspaceId(access.activeWorkspaceId)
    } catch (e) {
      console.error('[Auth] Erro inesperado:', e)
      setProfile(null)
      setCompany(null)
      setWorkspaces([])
      setMemberships([])
      setIsOwner(false)
      setRole(null)
      setActiveWorkspaceId(null)
    } finally {
      setWorkspaceReady(true)
    }
  }

  const switchWorkspace = (workspaceId) => {
    persistActiveWorkspace(workspaceId)
    setActiveWorkspaceId(workspaceId)
    setCompany(workspaces.find((item) => item.id === workspaceId) || null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user || null
      setUser(u)
      setLoading(false)
      if (u) loadProfile(u.id)
      else setWorkspaceReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user || null
      setUser(u)
      setLoading(false)
      if (u) loadProfile(u.id)
      else {
        setProfile(null)
        setCompany(null)
        setWorkspaces([])
        setMemberships([])
        setIsOwner(false)
        setRole(null)
        setActiveWorkspaceId(null)
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
    if (profile?.id) {
      await supabase.from('users').update({ is_online: false }).eq('id', profile.id)
    }
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setCompany(null)
    setWorkspaces([])
    setMemberships([])
    setIsOwner(false)
    setRole(null)
    setActiveWorkspaceId(null)
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const activeMembership = memberships.find((item) => item.workspace_id === activeWorkspaceId) || null

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      company,
      workspaces,
      memberships,
      isOwner,
      role,
      activeWorkspaceId,
      loading,
      workspaceReady,
      ws:     company,
      wsRole: profile ? {
        role: isOwner ? 'owner' : (activeMembership?.role || role),
        workspace_id: activeMembership?.workspace_id || activeWorkspaceId,
        company_id: activeMembership?.company_id || profile?.company_id || activeWorkspaceId || null,
      } : null,
      signIn,
      signOut,
      resetPassword,
      reloadProfile: () => user ? loadProfile(user.id) : Promise.resolve(),
      switchWorkspace,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
