import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const REMEMBER_KEY = 'supabase-always-remember'
const STORAGE_KEY = `sb-${SUPABASE_URL.replace(/https?:\/\//, '').split('.')[0]}-auth-token`

// Wrapper que escolhe onde armazenar a sessão
class HybridStorage {
  constructor() {
    const remember = localStorage.getItem(REMEMBER_KEY)
    this._storage = remember === 'false' ? sessionStorage : localStorage
  }
  getItem(key) { return this._storage.getItem(key) }
  setItem(key, value) { this._storage.setItem(key, value) }
  removeItem(key) { this._storage.removeItem(key) }
}

/* Migra sessão existente se a flag mudar */
export function setRemember(remember) {
  if (remember) {
    // Move from sessionStorage to localStorage
    const token = sessionStorage.getItem(STORAGE_KEY)
    if (token) {
      localStorage.setItem(STORAGE_KEY, token)
      sessionStorage.removeItem(STORAGE_KEY)
    }
    localStorage.setItem(REMEMBER_KEY, 'true')
  } else {
    // Move from localStorage to sessionStorage
    const token = localStorage.getItem(STORAGE_KEY)
    if (token) {
      sessionStorage.setItem(STORAGE_KEY, token)
      localStorage.removeItem(STORAGE_KEY)
    }
    localStorage.setItem(REMEMBER_KEY, 'false')
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: new HybridStorage(),
    storageKey: STORAGE_KEY,
  },
})
