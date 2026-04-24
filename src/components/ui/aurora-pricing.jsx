import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Brain, ChevronDown, Sparkles } from 'lucide-react'

const WA_BASE = 'https://wa.me/5524974057429'

function waLink(planName) {
  const text = `Olá! Tenho interesse no plano ${planName} da ALO AI.`
  return `${WA_BASE}?text=${encodeURIComponent(text)}`
}

const plans = [
  {
    planName: 'Starter',
    description: 'Para equipes que querem centralizar o atendimento e começar com estrutura.',
    price: '200',
    features: [
      '2 canais conectados',
      '3 agentes',
      '2.000 conversas/mês',
      'Inbox unificado',
      'Kanban de atendimento',
      'CRM básico',
      'Relatórios essenciais',
      'Suporte via WhatsApp',
    ],
    buttonText: 'Escolher Starter',
    isPopular: false,
    buttonVariant: 'secondary',
  },
  {
    planName: 'Growth',
    description: 'O plano ideal para crescer com contexto, controle operacional e CRM mais forte.',
    price: '350',
    features: [
      '5 canais conectados',
      '10 agentes',
      '10.000 conversas/mês',
      'Tudo do Starter +',
      'CRM completo com histórico',
      'Relatórios avançados',
      'Permissões por perfil',
      'Suporte prioritário',
    ],
    buttonText: 'Escolher Growth',
    isPopular: true,
    buttonVariant: 'primary',
  },
  {
    planName: 'Business',
    description: 'Para operações maduras que precisam escalar sem limite e com atendimento dedicado.',
    price: '600',
    features: [
      'Canais ilimitados',
      'Agentes ilimitados',
      'Conversas ilimitadas',
      'Tudo do Growth +',
      'Gerente de conta dedicado',
      'Onboarding assistido',
      'SLA garantido',
    ],
    buttonText: 'Escolher Business',
    isPopular: false,
    buttonVariant: 'secondary',
  },
]

const aiCapabilities = [
  'Responder clientes automaticamente',
  'Identificar intenção da mensagem',
  'Qualificar leads',
  'Agendar atendimentos',
  'Encaminhar conversas para o setor correto',
  'Recuperar histórico do cliente no CRM',
  'Personalizar respostas com contexto real da conversa',
  'Operar 24 horas por dia sem interrupção',
]

const aiLearningSources = [
  'Base de conhecimento da empresa',
  'Mensagens anteriores',
  'FAQs',
  'Documentos internos',
  'Produtos e serviços cadastrados',
]

function CheckIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function ShaderCanvas() {
  const canvasRef = useRef(null)
  const glRef = useRef(null)
  const programRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const gl = canvas.getContext('webgl', { antialias: true, alpha: true })
    if (!gl) return undefined

    glRef.current = gl

    const vertexShaderSource = `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `

    const fragmentShaderSource = `
      precision highp float;

      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec3 uBackgroundColor;

      mat2 rotate2d(float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return mat2(c, -s, s, c);
      }

      float variation(vec2 v1, vec2 v2, float strength, float speed) {
        return sin(dot(normalize(v1), normalize(v2)) * strength + iTime * speed) / 100.0;
      }

      float paintCircle(vec2 uv, vec2 center, float radius, float width) {
        vec2 diff = center - uv;
        float len = length(diff);
        len += variation(diff, vec2(0.0, 1.0), 5.0, 2.0);
        len -= variation(diff, vec2(1.0, 0.0), 5.0, 2.0);

        return smoothstep(radius - width, radius, len) - smoothstep(radius, radius + width, len);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        uv.x *= 1.35;
        uv.x -= 0.175;

        float radius = 0.34;
        vec2 center = vec2(0.5);
        float mask = 0.0;
        mask += paintCircle(uv, center, radius, 0.032);
        mask += paintCircle(uv, center, radius - 0.018, 0.01);
        mask += paintCircle(uv, center, radius + 0.018, 0.006);

        vec2 rotatedUv = rotate2d(iTime * 0.55) * uv;
        vec3 foregroundColor = vec3(0.22 + rotatedUv.x * 0.55, 0.82 + rotatedUv.y * 0.1, 0.95 - rotatedUv.y * rotatedUv.x);
        vec3 color = mix(uBackgroundColor, foregroundColor, mask);
        color = mix(color, vec3(1.0), paintCircle(uv, center, radius, 0.003));

        gl_FragColor = vec4(color, 1.0);
      }
    `

    const compileShader = (type, source) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }

      return shader
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vertexShader || !fragmentShader) return undefined

    const program = gl.createProgram()
    if (!program) return undefined

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
      return undefined
    }

    gl.useProgram(program)
    programRef.current = program

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )

    const positionLocation = gl.getAttribLocation(program, 'aPosition')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    const timeLocation = gl.getUniformLocation(program, 'iTime')
    const resolutionLocation = gl.getUniformLocation(program, 'iResolution')
    const backgroundLocation = gl.getUniformLocation(program, 'uBackgroundColor')

    if (backgroundLocation) {
      gl.uniform3fv(backgroundLocation, new Float32Array([0.03, 0.03, 0.06]))
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const render = (time) => {
      if (!timeLocation || !resolutionLocation) return
      gl.uniform1f(timeLocation, time * 0.001)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationFrameRef.current = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize)
    animationFrameRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', resize)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (programRef.current) gl.deleteProgram(programRef.current)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full opacity-70"
      aria-hidden="true"
    />
  )
}

function PricingCard({
  planName,
  description,
  price,
  features,
  buttonText,
  isPopular = false,
  buttonVariant = 'primary',
}) {
  const cardClasses = [
    'relative flex h-full w-full max-w-xs flex-1 flex-col rounded-[28px] border px-7 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-[14px] transition-all duration-300',
    'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10',
    isPopular
      ? 'scale-[1.03] ring-2 ring-cyan-400/25 from-white/[0.16] to-cyan-400/[0.06] border-cyan-300/30'
      : 'hover:-translate-y-1 hover:border-white/15',
  ].join(' ')

  const buttonClasses = [
    'mt-auto inline-flex w-full items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition',
    buttonVariant === 'primary'
      ? 'border-cyan-300/40 bg-cyan-300 text-slate-950 hover:bg-cyan-200'
      : 'border-white/12 bg-white/[0.06] text-white hover:bg-white/[0.12]',
  ].join(' ')

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55 }}
      whileHover={{ y: -8 }}
      className={cardClasses}
    >
      {isPopular && (
        <div className="absolute -top-4 right-4 rounded-full bg-cyan-300 px-3 py-1 text-[12px] font-semibold text-slate-950">
          Mais popular
        </div>
      )}

      <div className="mb-3">
        <h3 className="font-display text-[42px] font-extrabold tracking-[-0.05em] text-white md:text-[48px]">
          {planName}
        </h3>
        <p className="mt-2 text-[15px] leading-6 text-white/70">{description}</p>
      </div>

      <div className="my-6 flex items-end gap-2">
        <span className="font-display text-[44px] font-extrabold tracking-[-0.05em] text-white md:text-[50px]">
          R${price}
        </span>
        <span className="pb-2 text-[14px] text-white/60">/mês</span>
      </div>

      <div className="mb-5 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22)_50%,transparent)]" />

      <ul className="mb-7 flex flex-col gap-3 text-[14px] leading-5 text-white/90">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <a href={waLink(planName)} target="_blank" rel="noreferrer" className={buttonClasses}>
        {buttonText}
      </a>
    </motion.article>
  )
}

export default function AuroraPricing() {
  const [isAiExpanded, setIsAiExpanded] = useState(false)

  return (
    <div className="relative isolate w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#070710] px-4 py-10 text-white shadow-[0_28px_90px_rgba(0,0,0,0.35)] md:px-8 md:py-12">
      <div className="absolute inset-0 overflow-hidden rounded-[32px]">
        <ShaderCanvas />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,rgba(7,7,16,0.18),rgba(7,7,16,0.82))]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-14 w-full max-w-4xl text-center">
          <h2 className="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text font-display text-[44px] font-extrabold leading-[1.02] tracking-[-0.05em] text-transparent md:text-[60px]">
            Planos simples para escalar atendimento, CRM e IA no mesmo lugar.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-7 text-white/75 md:text-[18px]">
            Escolha a estrutura ideal para sua operação e adicione o Agente IA quando quiser automatizar respostas sem perder contexto.
          </p>
        </div>

        <div className="flex w-full max-w-5xl flex-col items-stretch justify-center gap-8 md:flex-row md:gap-6">
          {plans.map((plan) => (
            <PricingCard key={plan.planName} {...plan} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="relative mt-10 w-full max-w-6xl overflow-hidden rounded-[30px] border border-violet-400/20 bg-[linear-gradient(135deg,rgba(88,28,135,0.28),rgba(8,10,24,0.97)_44%,rgba(49,10,89,0.42))] px-6 py-6 shadow-[0_28px_90px_rgba(76,29,149,0.22)] backdrop-blur-xl md:px-8 md:py-7"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,181,253,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(109,40,217,0.18),transparent_34%)]" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-100/90">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                  Add-on premium
                </div>

                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-300/25 bg-violet-400/10 text-violet-100 shadow-[0_0_30px_rgba(109,40,217,0.22)]" aria-hidden="true">
                    <Brain className="h-7 w-7" strokeWidth={1.8} />
                  </span>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-[28px] font-extrabold tracking-[-0.04em] text-white md:text-[34px]">
                        Agente de IA
                      </h3>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-[12px] font-medium text-white/70">
                        <Bot className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Atendimento inteligente em tempo real
                      </span>
                    </div>

                    <p className="mt-3 max-w-2xl text-[15px] leading-7 text-white/76 md:text-[16px]">
                      Atua dentro da operação para responder, qualificar e encaminhar conversas com contexto real do seu negócio, em todos os canais conectados.
                    </p>

                    <div className="mt-4 grid gap-2 text-[13px] leading-5 text-white/76 sm:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                        <span>Disponível em qualquer plano</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                        <span>Treinado com o contexto exclusivo do workspace</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                        <span>Escala para humano quando necessário</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                        <span>Automação contínua com visão de CRM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 lg:min-w-[260px] lg:items-end lg:text-right">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Investimento</div>
                  <div className="mt-2 font-display text-[22px] font-bold tracking-[-0.03em] text-white/88">+ R$150/mês</div>
                  <div className="text-[12px] text-white/50">por workspace</div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAiExpanded((current) => !current)}
                  aria-expanded={isAiExpanded}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-300/30 bg-violet-400/12 px-4 py-3 text-sm font-semibold text-violet-50 transition duration-300 hover:border-violet-200/40 hover:bg-violet-400/18 lg:w-auto"
                >
                  {isAiExpanded ? 'Ocultar detalhes da IA' : 'Como a IA funciona?'}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${isAiExpanded ? 'rotate-180' : ''}`}
                    strokeWidth={2.4}
                  />
                </button>
              </div>
            </div>

            <motion.div
              initial={false}
              animate={{
                height: isAiExpanded ? 'auto' : 0,
                opacity: isAiExpanded ? 1 : 0,
                marginTop: isAiExpanded ? 4 : 0,
              }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid gap-5 rounded-[24px] border border-white/10 bg-[#0d0918]/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:grid-cols-[1.25fr_0.9fr] md:p-6">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-300/18 bg-violet-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-100/85">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                    Como a IA funciona no ALO AI
                  </div>

                  <p className="text-[14px] leading-7 text-white/74 md:text-[15px]">
                    A inteligência artificial do Alô AI atua diretamente no atendimento da empresa, analisando mensagens em tempo real em todos os canais conectados.
                  </p>

                  <div className="mt-5">
                    <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      O que ela executa
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {aiCapabilities.map((item) => (
                        <div key={item} className="flex items-start gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-[13px] leading-5 text-white/78">
                          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="rounded-[20px] border border-violet-300/14 bg-violet-400/[0.06] p-4">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-violet-100/70">
                      Fontes de aprendizado
                    </div>
                    <ul className="mt-3 grid gap-2 text-[13px] leading-5 text-white/76">
                      {aiLearningSources.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" strokeWidth={2} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4 text-[13px] leading-6 text-white/74">
                    Cada workspace pode ter seu próprio agente treinado com contexto exclusivo da operação.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
