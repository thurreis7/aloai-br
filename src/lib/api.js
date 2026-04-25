import { supabase } from './supabase'

export async function apiFetch(path, options = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  })
}

export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(payload?.error || 'Nao foi possivel concluir a requisicao.')
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}
