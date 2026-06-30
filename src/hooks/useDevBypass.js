import { useEffect } from 'react'

export const DEV_USER = {
  id: 'dev-bypass-user',
  email: 'dev@aloai.local',
  name: 'Dev Admin',
  role: 'admin',
  workspace_id: 'dev-workspace-id',
  workspace: {
    id: 'dev-workspace-id',
    name: 'ALO AI Dev',
    plan: 'business',
    ai_enabled: true,
  },
}

export function isDevBypassEnabled() {
  if (import.meta.env.PROD) return false
  return import.meta.env.VITE_DEV_BYPASS === 'true'
}

export function useDevBypass(setSession) {
  useEffect(() => {
    if (import.meta.env.PROD) return
    if (import.meta.env.VITE_DEV_BYPASS !== 'true') return

    setSession(DEV_USER)
  }, [setSession])
}
