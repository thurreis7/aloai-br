import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase, setRemember } from '../lib/supabase'
import {
  AuthPageShell,
  SignInCard,
  ResetAuthCard,
  SuccessAuthCard,
} from '@/components/ui/sign-in-card-2'

export default function Login() {
  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setError('')
    setSuccess('')
  }

  useEffect(() => {
    if (import.meta.env.DEV && window.location.hostname === 'localhost') {
      console.log('[Login] Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('[Login] Supabase key length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Preencha e-mail e senha.')
      return
    }
    setLoading(true)
    reset()
    try {
      setRemember(rememberMe)
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (err) {
        console.error('[Login] Supabase error:', err.message, err.status)
        throw err
      }
      console.log('[Login] Success:', !!data?.session)
      navigate('/app/inbox')
    } catch (err) {
      const msg = err.message
      console.error('[Login] Catch:', msg)
      setError(
        msg?.includes('Invalid login') || msg?.includes('credentials')
          ? 'E-mail ou senha incorretos.'
          : msg?.includes('Email not confirmed')
            ? 'Confirme seu e-mail antes de entrar.'
            : msg || 'Erro ao entrar. Tente novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Informe seu e-mail.')
      return
    }
    setLoading(true)
    reset()
    try {
      await resetPassword(email)
      setSuccess('Link enviado! Verifique sua caixa de entrada.')
    } catch {
      setError('Não foi possível enviar o e-mail. Verifique o endereço.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell>
      {mode === 'login' && (
        <SignInCard
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleLogin}
          loading={loading}
          error={error}
          onForgotPassword={() => {
            setMode('reset')
            reset()
          }}
          rememberMe={rememberMe}
          onRememberMeChange={setRememberMe}
        />
      )}

      {mode === 'reset' && !success && (
        <ResetAuthCard
          email={email}
          onEmailChange={setEmail}
          onSubmit={handleReset}
          loading={loading}
          error={error}
          onBackToLogin={() => {
            setMode('login')
            reset()
          }}
        />
      )}

      {mode === 'reset' && success && (
        <SuccessAuthCard
          title="E-mail enviado!"
          message={success}
          actionLabel="← Voltar ao login"
          onAction={() => {
            setMode('login')
            setSuccess('')
          }}
        />
      )}

      <div className="flex flex-col items-center gap-2 pb-4 pt-8">
        {!success && (
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-md bg-transparent px-2 py-1 text-xs text-white/55 shadow-none transition-colors hover:bg-transparent hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            ← Voltar ao site
          </button>
        )}
        <p className="text-center text-xs text-white/45">
          © 2026 ALO AI · Todos os direitos reservados
        </p>
      </div>
    </AuthPageShell>
  )
}
