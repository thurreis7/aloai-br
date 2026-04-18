import React, { useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Building2 } from 'lucide-react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'placeholder:text-white/40 selection:bg-purple-500/40 selection:text-white flex h-9 w-full min-w-0 rounded-md border border-white/10 bg-transparent px-3 py-1 text-base shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-violet-400/50 focus-visible:ring-[3px] focus-visible:ring-violet-500/20',
        className
      )}
      {...props}
    />
  )
}

/** Card com borda animada, tilt 3D e vidro — mesmo shell do login e do cadastro */
export function AuthCardChrome({ children }: { children: React.ReactNode }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-300, 300], [3, -3])
  const rotateY = useTransform(mouseX, [-300, 300], [-3, 3])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="w-full"
      style={{ perspective: 1500 }}
    >
      <motion.div
        className="relative"
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ z: 10 }}
      >
        <div className="group relative">
          <motion.div
            className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-70"
            animate={{
              boxShadow: [
                '0 0 10px 2px rgba(255,255,255,0.03)',
                '0 0 15px 5px rgba(255,255,255,0.05)',
                '0 0 10px 2px rgba(255,255,255,0.03)',
              ],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatType: 'mirror',
            }}
          />

          <div className="absolute -inset-[1px] overflow-hidden rounded-2xl">
            <motion.div
              className="absolute left-0 top-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
              initial={{ filter: 'blur(2px)' }}
              animate={{
                left: ['-50%', '100%'],
                opacity: [0.3, 0.7, 0.3],
                filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'],
              }}
              transition={{
                left: {
                  duration: 2.5,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatDelay: 1,
                },
                opacity: {
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: 'mirror',
                },
                filter: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: 'mirror',
                },
              }}
            />
            <motion.div
              className="absolute right-0 top-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
              initial={{ filter: 'blur(2px)' }}
              animate={{
                top: ['-50%', '100%'],
                opacity: [0.3, 0.7, 0.3],
                filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'],
              }}
              transition={{
                top: {
                  duration: 2.5,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatDelay: 1,
                  delay: 0.6,
                },
                opacity: {
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 0.6,
                },
                filter: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 0.6,
                },
              }}
            />
            <motion.div
              className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
              initial={{ filter: 'blur(2px)' }}
              animate={{
                right: ['-50%', '100%'],
                opacity: [0.3, 0.7, 0.3],
                filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'],
              }}
              transition={{
                right: {
                  duration: 2.5,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatDelay: 1,
                  delay: 1.2,
                },
                opacity: {
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 1.2,
                },
                filter: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 1.2,
                },
              }}
            />
            <motion.div
              className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
              initial={{ filter: 'blur(2px)' }}
              animate={{
                bottom: ['-50%', '100%'],
                opacity: [0.3, 0.7, 0.3],
                filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'],
              }}
              transition={{
                bottom: {
                  duration: 2.5,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatDelay: 1,
                  delay: 1.8,
                },
                opacity: {
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 1.8,
                },
                filter: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: 1.8,
                },
              }}
            />
            <motion.div
              className="absolute left-0 top-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'mirror',
              }}
            />
            <motion.div
              className="absolute right-0 top-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                repeatType: 'mirror',
                delay: 0.5,
              }}
            />
            <motion.div
              className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                repeatType: 'mirror',
                delay: 1,
              }}
            />
            <motion.div
              className="absolute bottom-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2.3,
                repeat: Infinity,
                repeatType: 'mirror',
                delay: 1.5,
              }}
            />
          </div>

          <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-white/[0.03] via-white/[0.05] to-white/[0.03] opacity-0 transition-opacity duration-500 group-hover:opacity-30" />

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.08] px-6 py-5 shadow-2xl backdrop-blur-xl min-h-[260px]">
            {children}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export type AuthMode = 'login' | 'register' | 'reset'

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/60 via-gray-900 to-black" />

      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      <div className="absolute left-1/2 top-0 h-[50vh] w-[100vh] -translate-x-1/2 transform rounded-b-[50%] bg-purple-950/20 blur-[100px]" />
      <div className="absolute bottom-0 left-1/2 h-[70vh] w-[80vh] -translate-x-1/2 transform rounded-t-full bg-purple-950/10 blur-[80px]" />

      {/* LOGO + FRASE DE IMPACTO acima do quadro */}
      <div className="relative z-20 flex flex-col items-center gap-0 mb-3">
        <img
          src="/brand/logo-full-wtbg.png"
          alt="ALO AI"
          className="h-40 w-auto max-w-[min(560px,92vw)] object-contain"
          style={{ filter: 'brightness(1.15)' }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-stretch px-4">
        {children}
      </div>
    </div>
  )
}

export type SignInCardProps = {
  productName?: string
  email: string
  password: string
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  rememberMe?: boolean
  onRememberMeChange?: (v: boolean) => void
  loading?: boolean
  error?: string | null
  success?: string | null
  onForgotPassword?: () => void
}

export function SignInCard({
  productName = 'ALO AI',
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  rememberMe = true,
  onRememberMeChange,
  loading = false,
  error,
  success,
  onForgotPassword,
}: SignInCardProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null)

  return (
    <AuthCardChrome>

            <div className="mb-5 space-y-2 text-center">

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-xl font-bold text-transparent"
              >
                Bem-vindo de volta
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-white/60"
              >
                Entre para continuar no {productName}
              </motion.p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              {(error || success) && (
                <div
                  className={cn(
                    'rounded-lg border px-3 py-2 text-center text-sm leading-relaxed',
                    error
                      ? 'border-red-500/30 bg-red-500/10 text-red-200'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  )}
                >
                  {error || success}
                </div>
              )}

              <motion.div className="space-y-2">
                {/* E-mail */}
                <motion.div
                  className={cn('relative', focusedInput === 'email' && 'z-10')}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <div className="absolute -inset-[0.5px] rounded-lg bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 transition-all duration-300 group-hover:opacity-100" />

                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Mail
                      className={cn(
                        'absolute left-3 h-4 w-4 transition-all duration-300',
                        focusedInput === 'email' ? 'text-white' : 'text-white/40'
                      )}
                    />

                    <Input
                      type="email"
                      placeholder="E-mail"
                      value={email}
                      onChange={(e) => onEmailChange(e.target.value)}
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                      className="h-11 w-full border-transparent bg-transparent pl-10 pr-3 text-sm text-white placeholder:text-white/30 transition-all duration-300 focus:border-violet-400/50"
                      autoComplete="email"
                    />

                    {focusedInput === 'email' && (
                      <motion.div
                        layoutId="email-highlight"
                        className="absolute inset-0 -z-10 bg-white/5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                </motion.div>

                {/* Esqueci minha senha — acima do campo de senha */}
                {onForgotPassword && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="bg-transparent text-xs text-violet-400/80 shadow-none transition-colors duration-200 hover:bg-transparent hover:text-violet-300 focus-visible:bg-transparent focus-visible:outline-none"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                )}

                {/* Senha */}
                <motion.div
                  className={cn('relative', focusedInput === 'password' && 'z-10')}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <div className="absolute -inset-[0.5px] rounded-lg bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 transition-all duration-300 group-hover:opacity-100" />

                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Lock
                      className={cn(
                        'absolute left-3 h-4 w-4 transition-all duration-300',
                        focusedInput === 'password' ? 'text-white' : 'text-white/40'
                      )}
                    />

                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                      className="h-14 w-full border-transparent bg-transparent pl-10 pr-10 text-base text-white placeholder:text-white/30 transition-all duration-300 focus:border-violet-400/50"
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 cursor-pointer rounded-md bg-transparent p-1.5 text-white/40 shadow-none outline-none ring-0 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-white/25"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <Eye className="h-4 w-4 text-white/40 transition-colors duration-300 hover:text-white" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-white/40 transition-colors duration-300 hover:text-white" />
                      )}
                    </button>

                    {focusedInput === 'password' && (
                      <motion.div
                        layoutId="password-highlight"
                        className="absolute inset-0 -z-10 bg-white/5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                </motion.div>
              </motion.div>

              {/* Lembrar-me — logo abaixo do campo de senha */}
              <div className="flex items-center pt-1">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => onRememberMeChange?.(!rememberMe)}
                      className="h-5 w-5 appearance-none rounded border-2 border-violet-400/60 bg-violet-400/10 transition-all duration-200 checked:border-violet-400 checked:bg-violet-600 focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                    {rememberMe && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="pointer-events-none absolute inset-0 flex items-center justify-center text-white"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                  <label
                    htmlFor="remember-me"
                    className="text-base text-white/70 transition-colors duration-200 hover:text-white/90"
                  >
                    Lembrar-me
                  </label>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="group/button relative mt-5 w-full"
              >
                <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 blur-lg transition-opacity duration-300 group-hover/button:opacity-70" />

                <div className="relative flex h-12 items-center justify-center overflow-hidden rounded-lg bg-white font-medium text-black transition-all duration-300">
                  <motion.div
                    className="absolute inset-0 -z-10 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      ease: 'easeInOut',
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                    style={{
                      opacity: loading ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                    }}
                  />

                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center"
                      >
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/70 border-t-transparent" />
                      </motion.div>
                    ) : (
                      <motion.span
                        key="button-text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-1 text-base font-medium"
                      >
                        Entrar
                        <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover/button:translate-x-1" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>

            </form>
    </AuthCardChrome>
  )
}

/** @deprecated Use named export SignInCard — kept for demo-style imports */
export const Component = SignInCard

const glassCardClass =
  'relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 px-8 py-8 shadow-2xl backdrop-blur-xl min-h-[250px]'

export type RegisterAuthCardProps = {
  productName?: string
  name: string
  company: string
  email: string
  password: string
  onNameChange: (v: string) => void
  onCompanyChange: (v: string) => void
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  loading?: boolean
  error?: string | null
  onBackToLogin?: () => void
}

export function RegisterAuthCard({
  name,
  company,
  email,
  password,
  onNameChange,
  onCompanyChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  loading = false,
  error,
  onBackToLogin,
}: RegisterAuthCardProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState<'name' | 'company' | 'email' | 'password' | null>(
    null
  )

  const fieldRow = (
    key: 'name' | 'company' | 'email' | 'password',
    icon: React.ReactNode,
    input: React.ReactNode
  ) => (
    <motion.div
      className={cn('relative', focusedInput === key && 'z-10')}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="absolute -inset-[0.5px] rounded-lg bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 transition-all duration-300 group-hover:opacity-100" />
      <div className="relative flex items-center overflow-hidden rounded-lg">
        {icon}
        {input}
        {focusedInput === key && (
          <motion.div
            layoutId={`reg-${key}-highlight`}
            className="absolute inset-0 -z-10 bg-white/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    </motion.div>
  )

  return (
    <AuthCardChrome>
      <div className="mb-8 space-y-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-3xl font-bold text-transparent"
        >
          Crie sua conta
        </motion.h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-200">
            {error}
          </div>
        )}

        <motion.div className="space-y-3">
          {fieldRow(
            'name',
            <User
              className={cn(
                'absolute left-3 h-4 w-4 transition-all duration-300',
                focusedInput === 'name' ? 'text-white' : 'text-white/40'
              )}
            />,
            <Input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onFocus={() => setFocusedInput('name')}
              onBlur={() => setFocusedInput(null)}
              className="h-14 w-full border-transparent bg-transparent pl-10 pr-3 text-base text-white placeholder:text-white/30 transition-all duration-300 focus:border-violet-400/50"
              autoComplete="name"
            />
          )}
          {fieldRow(
            'company',
            <Building2
              className={cn(
                'absolute left-3 h-4 w-4 transition-all duration-300',
                focusedInput === 'company' ? 'text-white' : 'text-white/40'
              )}
            />,
            <Input
              type="text"
              placeholder="Nome da empresa"
              value={company}
              onChange={(e) => onCompanyChange(e.target.value)}
              onFocus={() => setFocusedInput('company')}
              onBlur={() => setFocusedInput(null)}
              className="h-14 w-full border-transparent bg-transparent pl-10 pr-3 text-base text-white placeholder:text-white/30 transition-all duration-300 focus:border-violet-400/50"
              autoComplete="organization"
            />
          )}
          {fieldRow(
            'email',
            <Mail
              className={cn(
                'absolute left-3 h-4 w-4 transition-all duration-300',
                focusedInput === 'email' ? 'text-white' : 'text-white/40'
              )}
            />,
            <Input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              className="h-14 w-full border-transparent bg-transparent pl-10 pr-3 text-base text-white placeholder:text-white/30 transition-all duration-300 focus:border-violet-400/50"
              autoComplete="email"
            />
          )}
          <motion.div
            className={cn('relative', focusedInput === 'password' && 'z-10')}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="absolute -inset-[0.5px] rounded-lg bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 transition-all duration-300 group-hover:opacity-100" />
            <div className="relative flex items-center overflow-hidden rounded-lg">
              <Lock
                className={cn(
                  'absolute left-3 h-4 w-4 transition-all duration-300',
                  focusedInput === 'password' ? 'text-white' : 'text-white/40'
                )}
              />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                className="h-14 w-full border-transparent bg-transparent pl-10 pr-10 text-base text-white placeholder:text-white/30 transition-all duration-300 focus:border-violet-400/50"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 cursor-pointer rounded-md bg-transparent p-1.5 text-white/40 shadow-none outline-none ring-0 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-white/25"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <Eye className="h-4 w-4 text-white/40 transition-colors duration-300 hover:text-white" />
                ) : (
                  <EyeOff className="h-4 w-4 text-white/40 transition-colors duration-300 hover:text-white" />
                )}
              </button>
              {focusedInput === 'password' && (
                <motion.div
                  layoutId="reg-password-highlight"
                  className="absolute inset-0 -z-10 bg-white/5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </div>
          </motion.div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="group/button relative mt-5 w-full"
        >
          <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 blur-lg transition-opacity duration-300 group-hover/button:opacity-70" />
          <div className="relative flex h-12 items-center justify-center overflow-hidden rounded-lg bg-white font-medium text-black transition-all duration-300">
            <motion.div
              className="absolute inset-0 -z-10 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 1.5,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatDelay: 1,
              }}
              style={{
                opacity: loading ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/70 border-t-transparent" />
                </motion.div>
              ) : (
                <motion.span
                  key="btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-1 text-sm font-medium"
                >
                  Criar conta grátis
                  <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover/button:translate-x-1" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.button>

        <p className="text-center text-base leading-relaxed text-white/75">
          Ao criar uma conta você concorda com os{' '}
          <a href="/termos" target="_blank" className="font-medium text-violet-400/90 transition-colors hover:text-violet-300">
            Termos
          </a>{' '}
          e a{' '}
          <a href="/privacidade" target="_blank" className="font-medium text-violet-400/90 transition-colors hover:text-violet-300">
            Política de Privacidade
          </a>
          .
        </p>

        {onBackToLogin && (
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full rounded-md bg-transparent py-1 text-center text-sm text-violet-400/90 shadow-none transition-colors hover:bg-transparent hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            ← Voltar ao login
          </button>
        )}
      </form>
    </AuthCardChrome>
  )
}

export type ResetAuthCardProps = {
  email: string
  onEmailChange: (v: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  loading?: boolean
  error?: string | null
  onBackToLogin?: () => void
}

export function ResetAuthCard({
  email,
  onEmailChange,
  onSubmit,
  loading = false,
  error,
  onBackToLogin,
}: ResetAuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className={glassCardClass}>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
            backgroundSize: '30px 30px',
          }}
        />
        <div className="relative mb-5 space-y-1 text-center">
          <h1 className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-2xl font-bold text-transparent">
            Recuperar senha
          </h1>
          <p className="text-xs text-white/60">Enviaremos um link para seu e-mail.</p>
        </div>
        <form onSubmit={onSubmit} className="relative space-y-3">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="relative flex items-center overflow-hidden rounded-lg">
            <Mail className="absolute left-3 h-4 w-4 text-white/40" />
            <Input
              type="email"
              placeholder="E-mail cadastrado"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="h-12 w-full border-white/15 bg-transparent pl-10 text-base text-white placeholder:text-white/30 transition-all duration-300 focus:border-violet-400/50"
              autoComplete="email"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border border-violet-500/50 bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-none transition-colors hover:bg-violet-500 disabled:opacity-60"
          >
            {loading ? 'Enviando…' : 'Enviar link de recuperação'}
          </motion.button>
          {onBackToLogin && (
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full rounded-md bg-transparent py-1 text-center text-sm text-white/70 shadow-none transition-colors hover:bg-transparent hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              ← Voltar ao login
            </button>
          )}
        </form>
      </div>
    </motion.div>
  )
}

export type SuccessAuthCardProps = {
  title: string
  message: string
  actionLabel: string
  onAction: () => void
}

export function SuccessAuthCard({ title, message, actionLabel, onAction }: SuccessAuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className={cn(glassCardClass, 'text-center')}>
        <div className="mb-4 flex justify-center text-purple-300">
          <Mail size={44} strokeWidth={1.5} aria-hidden />
        </div>
        <h2 className="mb-2 text-lg font-bold text-white">{title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-white/60">{message}</p>
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-medium text-white/80 underline-offset-4 transition-colors hover:text-white"
        >
          {actionLabel}
        </button>
      </div>
    </motion.div>
  )
}
