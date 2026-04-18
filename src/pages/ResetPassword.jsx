import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AuthPageShell, SuccessAuthCard } from '@/components/ui/sign-in-card-2'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [state, setState] = useState('form') // form | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password || !confirm) {
      setState('error')
      setErrorMsg('Preencha os dois campos.')
      return
    }
    if (password !== confirm) {
      setState('error')
      setErrorMsg('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      setState('error')
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setState('loading')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setErrorMsg(error.message || 'Erro ao atualizar a senha.')
      setState('error')
      return
    }
    setState('success')
  }

  return (
    <AuthPageShell>
      <AnimatePresence mode="wait">
        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 px-8 py-14 shadow-2xl backdrop-blur-xl min-h-[380px]">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
                <h2 className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-xl font-bold text-transparent">
                  Atualizando sua senha...
                </h2>
              </div>
            </div>
          </motion.div>
        )}

        {state === 'form' && (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="relative w-full"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 px-8 py-10 shadow-2xl backdrop-blur-xl min-h-[380px]">
              <div className="mb-8 space-y-3 text-center">
                <Lock className="mx-auto h-10 w-10 text-violet-400/80" />
                <h2 className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-2xl font-bold text-transparent">
                  Nova senha
                </h2>
                <p className="text-sm text-white/60">
                  Digite a nova senha para sua conta.
                </p>
              </div>

              <div className="mx-auto max-w-sm space-y-4">
                {state === 'error' && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-200">
                    {errorMsg}
                  </div>
                )}

                <div className="relative flex items-center overflow-hidden rounded-lg">
                  <Lock className="absolute left-3 h-4 w-4 text-white/40" />
                  <input
                    type={show ? 'text' : 'password'}
                    placeholder="Nova senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 w-full border-transparent bg-transparent pl-10 pr-10 text-base text-white placeholder:text-white/30 outline-none focus:border-violet-400/50 focus:ring-[3px] focus:ring-violet-500/20"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-2 text-white/40 hover:text-white"
                  >
                    {show ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative flex items-center overflow-hidden rounded-lg">
                  <Lock className="absolute left-3 h-4 w-4 text-white/40" />
                  <input
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="h-12 w-full border-transparent bg-transparent pl-10 pr-3 text-base text-white placeholder:text-white/30 outline-none focus:border-violet-400/50 focus:ring-[3px] focus:ring-violet-500/20"
                    autoComplete="new-password"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="group/button relative mt-6 w-full"
                >
                  <div className="relative flex h-12 items-center justify-center overflow-hidden rounded-lg bg-white font-medium text-black">
                    Atualizar senha
                    <ArrowRight className="h-3 w-3 ml-1 transition-transform duration-300 group-hover/button:translate-x-1" />
                  </div>
                </motion.button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full rounded-md bg-transparent py-2 text-center text-sm text-white/55 transition-colors hover:text-white/80"
                >
                  ← Voltar ao login
                </button>
              </div>
            </div>
          </motion.form>
        )}

        {state === 'success' && (
          <SuccessAuthCard
            key="success"
            title="Senha atualizada!"
            message="Sua senha foi alterada com sucesso. Use a nova senha para entrar."
            actionLabel="Ir para o login →"
            onAction={() => navigate('/login')}
          />
        )}
      </AnimatePresence>
    </AuthPageShell>
  )
}
