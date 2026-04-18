import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, CheckCircle, Zap } from 'lucide-react'
import clsx from 'clsx'

const WA_BASE = 'https://wa.me/5524974057429'
const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeSPdzOKcql4Du4S9c_DY5_lsbP-UCWxfW9V_dYCN4kiFzZxw/viewform'

function waLink(planName) {
  const text = `Olá! Tenho interesse no plano ${planName} da ALO AI.`
  return `${WA_BASE}?text=${encodeURIComponent(text)}`
}

const plans = [
  {
    name: 'Starter',
    price: { monthly: 199, yearly: 1910 },
    description: 'Para equipes pequenas que querem organizar o atendimento.',
    features: ['2 canais conectados', '3 agentes', '2.000 conversas/mês', 'Inbox + Kanban'],
    isFeatured: false,
    badge: null,
    waPlanLabel: 'Starter',
  },
  {
    name: 'Growth',
    price: { monthly: 349, yearly: 3350 },
    description: 'O equilíbrio perfeito entre preço e funcionalidades.',
    features: [
      '5 canais conectados',
      '10 agentes',
      '10.000 conversas/mês',
      'Kanban + SLA + Relatórios',
      'Suporte prioritário',
    ],
    isFeatured: true,
    badge: { label: 'MAIS VENDIDO', className: 'bg-violet-400 text-black' },
    waPlanLabel: 'Growth',
  },
  {
    name: 'Business',
    price: { monthly: 599, yearly: 5750 },
    description: 'Tudo ilimitado + white-label + gerente de conta.',
    features: [
      'Canais ilimitados',
      'Agentes ilimitados',
      'API + Webhooks',
      'White-label',
      'Gerente de conta exclusivo',
    ],
    isFeatured: false,
    badge: { label: 'MELHOR CUSTO-BENEFÍCIO', className: 'bg-amber-500 text-black' },
    waPlanLabel: 'Business',
  },
]

/**
 * Bloco de preços estilo Aurora (Tailwind + framer-motion).
 * Usa anual com ~20% de economia em relação a 12× mensal.
 */
export default function AuroraPricing() {
  const [billingCycle, setBillingCycle] = useState('monthly')

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15 + 0.3,
        duration: 0.6,
        ease: 'easeInOut',
      },
    }),
  }

  return (
    <div className="relative w-full flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-gray-700/50 bg-gray-950 p-6 md:p-8">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="aurora-bg">
          <div className="aurora-shape-1" />
          <div className="aurora-shape-2" />
        </div>
      </div>
      <style>{`
        .aurora-bg { position: absolute; inset: 0; filter: blur(100px); }
        .aurora-shape-1, .aurora-shape-2 { position: absolute; border-radius: 50%; }
        .aurora-shape-1 { width: 600px; height: 600px; background-color: rgba(0, 128, 255, 0.5); top: 10%; left: 10%; animation: moveAurora1 20s infinite alternate ease-in-out; }
        .aurora-shape-2 { width: 500px; height: 500px; background-color: rgba(128, 0, 255, 0.5); bottom: 10%; right: 10%; animation: moveAurora2 25s infinite alternate ease-in-out; }
        @keyframes moveAurora1 { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(100px, 50px) rotate(180deg); } }
        @keyframes moveAurora2 { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(-100px, -50px) rotate(-180deg); } }
      `}</style>

      <div className="relative z-10 flex w-full flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5"
        >
          <Zap className="h-4 w-4 text-indigo-300" />
          <span className="text-sm font-medium text-gray-200">Preços flexíveis e transparentes</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
          className="mb-4 text-4xl font-bold tracking-tighter text-white md:text-5xl lg:text-6xl"
        >
          Planos claros. Sem ruído.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.7, ease: 'easeInOut' }}
          className="mb-10 max-w-lg text-sm text-gray-400 md:text-base"
        >
          O plano Growth concentra o que a maioria das equipes precisa para escalar atendimento e CRM.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeInOut' }}
          className="mb-10 flex flex-wrap items-center justify-center gap-3"
        >
          <span className={clsx('text-lg', billingCycle === 'monthly' ? 'text-white' : 'text-gray-500')}>
            Mensal
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={billingCycle === 'yearly'}
            className="flex h-8 w-14 cursor-pointer items-center rounded-full bg-gray-700 p-1"
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          >
            <motion.div
              className="h-6 w-6 rounded-full bg-indigo-500"
              layout
              transition={{ type: 'spring', stiffness: 700, damping: 30 }}
              style={{ marginLeft: billingCycle === 'yearly' ? 'auto' : '0' }}
            />
          </button>
          <span className={clsx('text-lg', billingCycle === 'yearly' ? 'text-white' : 'text-gray-500')}>
            Anual
          </span>
          <span className="text-sm font-semibold text-indigo-400">(Economize 20%)</span>
        </motion.div>
      </div>

      <div className="grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            custom={index}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -10, scale: 1.02 }}
            className={clsx(
              'group relative overflow-hidden rounded-2xl border border-gray-700/50 p-8',
              plan.isFeatured ? 'bg-gray-900/80' : 'bg-gray-950/50 backdrop-blur-sm'
            )}
          >
            <div
              className={clsx(
                'absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-30',
                plan.isFeatured ? 'card-aurora-featured' : 'card-aurora'
              )}
            />
            {plan.badge && (
              <div
                className={clsx(
                  'absolute right-0 top-0 rounded-bl-lg px-4 py-1.5 text-xs font-bold',
                  plan.badge.className
                )}
              >
                {plan.badge.label}
              </div>
            )}
            <div className="relative z-10 flex h-full flex-col">
              <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
              <p className="mt-2 text-gray-400">{plan.description}</p>

              <div className="mt-8 flex items-baseline">
                <span className="text-5xl font-bold tracking-tight text-white">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={billingCycle}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      R${plan.price[billingCycle]}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="ml-2 text-gray-400">
                  /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                </span>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-gray-300">
                    <CheckCircle className="mr-3 h-5 w-5 shrink-0 text-indigo-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={waLink(plan.waPlanLabel)}
                target="_blank"
                rel="noreferrer"
                className={clsx(
                  'mt-auto w-full rounded-lg py-3 pt-4 text-center text-lg font-semibold transition-colors',
                  plan.isFeatured
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                )}
              >
                Começar →
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      <style>{`
        .card-aurora, .card-aurora-featured {
          background-size: 300% 300%;
          animation: gradient-animation 10s ease infinite;
          filter: blur(50px);
        }
        .card-aurora { background-image: linear-gradient(45deg, #0077ff, #00ff77); }
        .card-aurora-featured { background-image: linear-gradient(45deg, #8A2BE2, #4A00E0); }
        @keyframes gradient-animation {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      {/* Agente IA + formulário (mesmo conteúdo da landing) */}
      <div className="relative z-10 mt-10 w-full max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] px-6 py-5">
          <div className="flex items-center gap-3.5">
            <span className="flex text-cyan-300" aria-hidden>
              <Bot className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <div>
              <div className="text-[15px] font-bold">Agente IA — adicional em qualquer plano</div>
              <div className="text-[13px] text-gray-400">
                Respostas 24/7 · Classificação de intenção · Base de conhecimento (RAG) · Análise de sentimento
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xl font-bold text-white">+R$149/mês</div>
            <div className="text-[11px] text-gray-500">por workspace</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] px-7 py-5">
          <div>
            <div className="text-[15px] font-bold">Já conversou com a gente e quer avançar?</div>
            <div className="text-[13px] text-gray-400">
              Preencha o formulário — nossa equipe configura tudo e entrega os acessos em até 24h.
            </div>
          </div>
          <a
            href={FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-gray-600 bg-transparent px-5 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:border-gray-500 hover:bg-gray-800"
          >
            Preencher formulário →
          </a>
        </div>
      </div>
    </div>
  )
}
