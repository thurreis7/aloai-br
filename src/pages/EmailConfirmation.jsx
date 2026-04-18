import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AuthPageShell, SuccessAuthCard } from '@/components/ui/sign-in-card-2'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react'

export default function EmailConfirmation() {
  const navigate = useNavigate()
  const [state, setState] = useState('loading') // loading | success | error
  const [email, setEmail] = useState('')

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', '?'))
    const type = params.get('type')
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    // Confirmação via hash deep-link do Supabase
    if (type === 'signup' && accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }).then(({ data, error }) => {
        if (error || !data?.session) {
          setState('error')
          return
        }
        setState('success')
        setEmail(data.session.user.email || '')
        setTimeout(() => navigate('/app/inbox'), 2000)
      })
      return
    }

    // Já tem sessão ativa (usuário clicou link pelo navegador)
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        setState('success')
        setEmail(data.session.user.email || '')
        setTimeout(() => navigate('/app/inbox'), 2000)
      } else {
        setState('error')
      }
    })
  }, [navigate])

  const handleResendEmail = async () => {
    if (!email) return
    const { error } = await supabase.auth.signUp({ email })
    if (!error) {
      // Recarrega para mostrar estado de loading novamente
      setState('loading')
    }
  }

  return (
    <AuthPageShell>
      {state === 'loading' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 px-8 py-14 shadow-2xl backdrop-blur-xl min-h-[380px]">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
              <h2 className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-2xl font-bold text-transparent">
                Verificando seu e-mail...
              </h2>
              <p className="text-sm text-white/60">Aguarde um momento.</p>
            </div>
          </div>
        </motion.div>
      )}

      {state === 'success' && (
        <SuccessAuthCard
          title="E-mail confirmado!"
          message={`Conta confirmada para ${email}. Redirecionando para a plataforma...`}
          actionLabel="Ir para o inbox →"
          onAction={() => navigate('/app/inbox')}
        />
      )}

      {state === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 px-8 py-14 shadow-2xl backdrop-blur-xl min-h-[380px]">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <XCircle className="h-10 w-10 text-red-400" />
              <h2 className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-xl font-bold text-transparent">
                Link inválido ou expirado
              </h2>
              <p className="text-sm text-white/60 max-w-xs">
                O link pode ter sido usado antes, expirado ou estar com formato incorreto.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/20"
              >
                Voltar ao login
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AuthPageShell>
  )
}
