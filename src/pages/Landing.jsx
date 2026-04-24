import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'
import { LiveNotificationStack } from '../components/activity/LiveNotificationStack'
import {
  MessageCircle,
  Instagram,
  Zap,
  Bot,
  User,
  CheckCircle2,
  Inbox,
  Kanban,
  BarChart3,
  Link2,
  Shield,
  Bell,
  Sparkles,
} from 'lucide-react'
import AuroraPricing from '../components/ui/aurora-pricing'
import { LogoFull } from '../components/ui/Logo'

/* ── DATA ── */
const CONVERSATIONS = [
  { name: 'Mariana Costa',  color: '#7c3aed', ch: 'WhatsApp',  preview: 'Quero saber sobre os planos...' },
  { name: 'Rafael Mendes',  color: '#0ea5e9', ch: 'Instagram', preview: 'O agente IA funciona 24h?' },
  { name: 'Tech Solutions', color: '#f59e0b', ch: 'Web Chat',  preview: 'Precisamos de 3 workspaces' },
  { name: 'Juliana Faria',  color: '#10b981', ch: 'E-mail',    preview: 'Nota fiscal incorreta #45821' },
  { name: 'Diego Rezende',  color: '#f97316', ch: 'WhatsApp',  preview: 'Quero fechar o plano anual' },
]

const CHAT_DATA = [
  { from: 'in',  text: 'Olá. Quero saber mais sobre o plano Growth para minha equipe.' },
  { from: 'out', text: 'Oi, Mariana. O Growth por R$349/mês inclui 5 canais, 10 agentes e 10k conversas. Quer começar com 14 dias grátis?' },
  { from: 'in',  text: 'Que canais vocês suportam? Usamos muito WhatsApp e Instagram.' },
  { from: 'out', text: 'WhatsApp, Instagram, Facebook, e-mail e webchat — tudo em um único inbox.' },
  { from: 'in',  text: 'Perfeito. Como faço para testar?' },
]

const AI_SUGGESTS = [
  'Sugestão IA: apresente a implantação assistida e entregue os acessos já configurados.',
  'Sugestão IA: o plano Growth cobre bem esse volume e esses canais.',
  'Sugestão IA: envie o link do app e o passo a passo do trial de 14 dias.',
]

const DEMO_LIVE_EVENTS = [
  {
    id: 'demo-1',
    kind: 'message',
    title: 'Nova mensagem recebida',
    subtitle: 'Mariana Costa · WhatsApp',
    body: 'Quero fechar o plano anual com condições especiais para o time.',
  },
  {
    id: 'demo-2',
    kind: 'pipeline',
    title: 'Lead convertido',
    subtitle: 'Pipeline · Negociação',
    body: 'Oportunidade atualizada após envio da proposta comercial.',
  },
  {
    id: 'demo-3',
    kind: 'message',
    title: 'Nova mensagem recebida',
    subtitle: 'Tech Solutions · E-mail',
    body: 'Precisamos de três workspaces com permissões separadas.',
  },
]

const KB_DATA = [
  {
    label: 'Novos', color: '#38bdf8', cards: [
      { name: 'Mariana Costa',  msg: 'Quero o plano Growth...', tag: 'lead',    tagBg: 'rgba(124,58,237,.15)', tagTxt: '#a78bfa' },
      { name: 'Rafael Mendes',  msg: 'IA funciona 24/7?',       tag: 'suporte', tagBg: 'rgba(34,211,238,.12)', tagTxt: '#22d3ee' },
    ],
  },
  {
    label: 'Em atend.', color: '#7c3aed', cards: [
      { name: 'Tech Solutions', msg: '3 workspaces separados',   tag: 'lead',   tagBg: 'rgba(124,58,237,.15)', tagTxt: '#a78bfa' },
    ],
  },
  {
    label: 'Negociação', color: '#10b981', cards: [
      { name: 'Startup Inov.', msg: 'Plano anual com desconto?', tag: 'venda',  tagBg: 'rgba(16,185,129,.15)', tagTxt: '#10b981' },
    ],
  },
]

const WA_URL = 'https://wa.me/5524974057429?text=Ol%C3%A1!%20Tenho%20interesse%20no%20ALO%20AI.'


/* ════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate()

  // Refs
  const canvasRef   = useRef(null)
  const mouseRef    = useRef({ x: 0, y: 0 })
  const rafRef      = useRef(null)
  const chatMsgsRef = useRef(null)

  // State
  const [scrolled,      setScrolled]      = useState(false)
  const [activeConv,    setActiveConv]    = useState(0)
  const [chatMessages,  setChatMessages]  = useState([])
  const [showTyping,    setShowTyping]    = useState(false)
  const [aiSuggest,     setAiSuggest]     = useState(AI_SUGGESTS[0])

  /* ── GRID CANVAS ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W, H

    const resize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = e => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    document.addEventListener('mousemove', onMove)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const size = 48
      const cols = Math.ceil(W / size) + 1
      const rows = Math.ceil(H / size) + 1
      const { x: mx, y: my } = mouseRef.current

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x    = i * size
          const y    = j * size
          const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2)
          const alpha = dist < 220 ? 0.06 + (1 - dist / 220) * 0.18 : 0.03
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(124,58,237,${alpha})`
          ctx.fill()
        }
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', onMove)
    }
  }, [])

  /* ── NAV SCROLL ── */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  /* ── SCROLL REVEAL ── */
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.alo-landing .reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  /* ── CHAT ANIMATION ── */
  useEffect(() => {
    let cancelled = false
    let msgIdx = 0, sugIdx = 0

    const addMsg = msg => {
      if (cancelled) return
      setChatMessages(prev => [...prev, msg])
      setTimeout(() => {
        if (chatMsgsRef.current) chatMsgsRef.current.scrollTop = chatMsgsRef.current.scrollHeight
      }, 50)
    }

    const next = () => {
      if (cancelled) return
      if (msgIdx >= CHAT_DATA.length) {
        setTimeout(() => {
          if (!cancelled) { setChatMessages([]); msgIdx = 0; setTimeout(next, 1200) }
        }, 0)
        return
      }

      const msg = CHAT_DATA[msgIdx]
      if (msg.from === 'in') {
        addMsg(msg)
        msgIdx++
        setTimeout(next, 1600)
      } else {
        setShowTyping(true)
        setTimeout(() => {
          if (cancelled) return
          setShowTyping(false)
          addMsg(msg)
          msgIdx++
          sugIdx = (sugIdx + 1) % AI_SUGGESTS.length
          setAiSuggest(AI_SUGGESTS[sugIdx])
          setTimeout(next, 2000)
        }, 1800)
      }
    }

    const t = setTimeout(next, 800)
    return () => { cancelled = true; clearTimeout(t) }
  }, [])

  /* ════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════ */
  return (
    <div className="alo-landing">
      <canvas ref={canvasRef} className="grid-canvas" />

      {/* ── NAV ── */}
      <nav className={scrolled ? 'scrolled' : ''}>
        <div className="logo">
          <LogoFull size={22} />
        </div>
        <ul>
          <li><a href="#produto">Produto</a></li>
          <li><a href="#beneficios">Recursos</a></li>
          <li><a href="#atividade">Atividade</a></li>
          <li><a href="#precos">Preços</a></li>
        </ul>
        <div className="nav-cta">
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>Entrar</button>
          <a href={WA_URL} target="_blank" rel="noreferrer" className="btn btn-pri">Falar conosco →</a>
        </div>
      </nav>

      {/* ── HERO — tom inspirado em landing SaaS com IA (prioridade: resultado + multicanal) ── */}
      <section className="hero">
        <div className="hero-badge">
          <div className="dot" />
          Novidade · Assistente de IA no mesmo fluxo do inbox
        </div>
        <h1>
          Transforme sua operação com IA aplicada<br />
          ao <em>atendimento multicanal</em>.
        </h1>
        <p className="hero-sub">
          Revolucione o fluxo de trabalho com uma plataforma que unifica WhatsApp, Instagram, e-mail e chat,
          prioriza o que gera receita e mantém seu time no controle — com automações alinhadas ao tom da marca e
          prontas para escalar.
        </p>
        <div className="hero-ctas">
          <a href={WA_URL} target="_blank" rel="noreferrer" className="btn btn-pri btn-lg">
            Falar com vendas
          </a>
          <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate('/login')}>
            Entrar na plataforma
          </button>
        </div>
        <p className="hero-note">Sem fidelidade · Onboarding assistido · LGPD-ready</p>
      </section>

      <section className="social-proof reveal">
        <p className="social-proof-text">
          Equipes de operações e CX usam ALO AI para responder mais rápido sem perder contexto entre WhatsApp, Instagram, e-mail e chat.
        </p>
      </section>

      {/* ── PRODUCT VISUAL ── */}
      <section id="produto" className="visual-section reveal">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="section-label">Pré-visualização</div>
          <h2 className="section-title">Inbox unificado, contexto compartilhado.</h2>
          <p className="section-sub center" style={{ maxWidth: 520, margin: '12px auto 0' }}>
            O mesmo painel para triagem, resposta e sugestões da IA — como sua equipe veria no dia a dia.
          </p>
        </div>

        <div className="visual-wrap">
          <div className="visual-glow visual-glow--subtle" />
          <div className="visual-header">
            <div className="dot-red" />
            <div className="dot-yellow" />
            <div className="dot-green" />
            <span style={{ fontSize: '12px', color: 'var(--txt3)', marginLeft: '12px', fontFamily: 'var(--font)' }}>
              ALO AI — Inbox
            </span>
          </div>

          <div className="visual-body">
            {/* Conversation list */}
            <div className="conv-list">
              {CONVERSATIONS.map((c, i) => (
                <div
                  key={i}
                  className={`conv-item${activeConv === i ? ' active' : ''}`}
                  onClick={() => setActiveConv(i)}
                >
                  <div className="conv-avatar" style={{ background: c.color }}>
                    {c.name[0]}
                  </div>
                  <div className="conv-info">
                    <div className="conv-name">{c.name}</div>
                    <div className="conv-preview">{c.preview}</div>
                    <div className="conv-meta">
                      <div className="chan-badge">{c.ch}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat area */}
            <div className="chat-area">
              <div className="chat-msgs" ref={chatMsgsRef}>
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`msg msg-${msg.from} fade-in`}>
                    {msg.text}
                  </div>
                ))}
              </div>

              {showTyping && (
                <div className="typing">
                  <div className="typing-dots">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                  <span>digitando...</span>
                </div>
              )}

              <div className="ai-suggest">
                <span>{aiSuggest}</span>
                <button className="use-btn">Usar ↵</button>
              </div>

              <div className="chat-input">
                Digite uma mensagem...
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" className="flow-section">
        <div className="section-label reveal">Fluxo</div>
        <h2 className="section-title reveal">Da mensagem à resolução, sem atrito.</h2>
        <p className="section-sub reveal">
          Canais entram padronizados, a IA propõe o próximo passo e o agente mantém o controle da conversa.
        </p>

        <div className="flow-visual reveal">
          {[
            { Icon: MessageCircle, label: 'WhatsApp', active: false },
            { Icon: Instagram, label: 'Instagram', active: false },
            { Icon: Zap, label: 'ALO AI', active: true },
            { Icon: Bot, label: 'Automação IA', active: false },
            { Icon: User, label: 'Agente certo', active: false },
            { Icon: CheckCircle2, label: 'Resolvido', active: false, cyan: true },
          ].map(({ Icon, label, active, cyan }, i, arr) => (
            <div className="flow-step" key={label}>
              <div className="flow-node">
                <div className={`flow-icon ${active ? 'active' : ''} ${cyan ? 'cyan' : ''}`}>
                  <Icon size={22} strokeWidth={2} aria-hidden />
                </div>
                <div className="flow-label">{label}</div>
              </div>
              {i < arr.length - 1 && (
                <div className="flow-arrow">
                  <div className="flow-particle" style={{ animationDelay: `${i * 0.35}s` }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px', marginTop: '64px' }}>
          {[
            { val: '2s',   lbl: 'Tempo de roteamento',  color: 'var(--pri)' },
            { val: '98%',  lbl: 'Satisfação média',      color: 'var(--cyan)' },
            { val: '24/7', lbl: 'Com Agente IA ativo',   grad: true },
            { val: '5min', lbl: 'Para entrar em produção',color: 'var(--pri)' },
          ].map((s, i) => (
            <div
              key={i}
              className={`reveal reveal-delay-${i + 1}`}
              style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg1)', textAlign: 'center' }}
            >
              <div style={{
                fontFamily: 'var(--font-h)', fontSize: '40px', fontWeight: 800,
                letterSpacing: '-.02em',
                ...(s.grad
                  ? { background: 'linear-gradient(135deg,var(--pri),var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
                  : { color: s.color }),
              }}>
                {s.val}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--txt2)', marginTop: '4px' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="beneficios" className="benefits">
        <div style={{ marginBottom: '48px' }}>
          <div className="section-label reveal">Recursos</div>
          <h2 className="section-title reveal">Construído para operações reais.</h2>
          <p className="section-sub reveal" style={{ marginBottom: 0 }}>
            Menos troca de aba. Mais contexto por contato, canal e etapa do funil.
          </p>
        </div>
        <div className="benefits-grid">
          {[
            { Icon: Inbox, bg: 'rgba(124,58,237,.12)', title: 'Inbox multicanal', desc: 'WhatsApp, Instagram, e-mail e web em uma fila única com prioridade e SLA visíveis.', delay: 1 },
            { Icon: Bot, bg: 'rgba(34,211,238,.1)', title: 'Automação com IA', desc: 'Classificação, roteamento e rascunhos alinhados ao tom da marca — o agente aprova o que sai.', delay: 2 },
            { Icon: Bell, bg: 'rgba(16,185,129,.1)', title: 'Alertas em tempo real', desc: 'Chegada de mensagem, mudança de etapa e gatilhos do pipeline sem sair do fluxo de trabalho.', delay: 3 },
            { Icon: Kanban, bg: 'rgba(245,158,11,.1)', title: 'Pipeline CRM', desc: 'Cartões por estágio, dono da conversa e histórico completo antes de responder.', delay: 4 },
            { Icon: Sparkles, bg: 'rgba(239,68,68,.1)', title: 'Respostas inteligentes', desc: 'Sugestões curtas e acionáveis com base no histórico e na base de conhecimento.', delay: 5 },
            { Icon: BarChart3, bg: 'rgba(124,58,237,.12)', title: 'Métricas acionáveis', desc: 'Volume, tempo de primeira resposta e CSAT por canal — foco no que muda o resultado.', delay: 1 },
            { Icon: Shield, bg: 'rgba(34,211,238,.08)', title: 'Dados isolados', desc: 'Workspace por empresa, permissões por time e trilha de auditoria para exigências de segurança.', delay: 2 },
            { Icon: Link2, bg: 'rgba(124,58,237,.1)', title: 'CRM integrado', desc: 'Contatos, empresas e campos personalizados no mesmo lugar que o atendimento.', delay: 3 },
          ].map((b) => (
            <div key={b.title} className={`benefit-card reveal reveal-delay-${b.delay}`}>
              <div className="benefit-icon" style={{ background: b.bg }}>
                <b.Icon size={22} strokeWidth={2} aria-hidden />
              </div>
              <div className="benefit-title">{b.title}</div>
              <div className="benefit-desc">{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY ── */}
      <section className="why-section reveal">
        <div>
          <div className="section-label">Por que ALO AI</div>
          <h2 className="section-title" style={{ marginBottom: '48px' }}>
            Feito para times que<br />medem resultado.
          </h2>
          <div className="why-list">
            {[
              { n: '01', title: 'Implantação feita por nós',    desc: 'Você não precisa configurar nada. Nossa equipe faz o onboarding completo e entrega os acessos prontos para uso.' },
              { n: '02', title: 'WhatsApp por empresa',         desc: 'Cada cliente conecta seu próprio número diretamente na plataforma. Sessão persistente, reconexão automática.' },
              { n: '03', title: 'IA treinada com seus dados',   desc: 'O Agente IA aprende com os documentos e textos da sua empresa. Responde como um atendente humano, no seu tom.' },
            ].map(w => (
              <div key={w.n} className="why-item">
                <div className="why-num">{w.n}</div>
                <div className="why-content">
                  <h3>{w.title}</h3>
                  <p>{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="why-visual">
          <div className="kanban-preview">
            {KB_DATA.map(col => (
              <div key={col.label} className="kb-col">
                <div className="kb-col-head">
                  <div className="kb-col-dot" style={{ background: col.color }} />
                  {col.label}
                </div>
                {col.cards.map((card, i) => (
                  <div
                    key={i}
                    className="kb-card"
                    style={{ animation: `cardFloat ${3 + i}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }}
                  >
                    <div className="kb-card-name">{card.name}</div>
                    <div className="kb-card-msg">{card.msg}</div>
                    <div
                      className="kb-card-tag"
                      style={{ background: card.tagBg, color: card.tagTxt }}
                    >
                      {card.tag}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE ACTIVITY (demo) ── */}
      <section id="atividade" className="live-activity-section reveal">
        <div className="section-label">Ao vivo</div>
        <h2>Notificações conectadas ao atendimento</h2>
        <p className="section-sub">
          No app, cada alerta reflete mensagens e mudanças de pipeline — aqui, uma prévia estática do mesmo padrão visual.
        </p>
        <LiveNotificationStack demo demoItems={DEMO_LIVE_EVENTS} />
      </section>

      {/* ── PRICING ── */}
      <section id="precos" className="pricing-section pricing-section--aurora">
        <div className="section-label reveal">Preços</div>
        <AuroraPricing />
      </section>


      <section className="cta-section">
        <div className="cta-glow cta-glow--subtle" />
        <div className="cta-box reveal">
          <div className="section-label" style={{ textAlign: 'center', marginBottom: '20px' }}>
            Próximo passo
          </div>
          <h2>
            Menos ferramentas.<br />
            Mais conversas que viram receita.
          </h2>
          <p>
            14 dias para testar com o time. Onboarding assistido e acessos prontos em até 24 horas úteis.
          </p>
          <div className="cta-btns">
            <a
              href={WA_URL}
              target="_blank"
              rel="noreferrer"
              className="btn btn-pri btn-lg"
            >
              Falar no WhatsApp →
            </a>
          </div>
          <p className="cta-note">Setup feito pela nossa equipe · Suporte em português · LGPD compliant</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="logo">
          <LogoFull size={22} />
        </div>
        <div className="footer-links">
          <a href="#">Privacidade</a>
          <a href="#">Termos</a>
          <a href="#">LGPD</a>
          <a href={WA_URL} target="_blank" rel="noreferrer">Falar com implantação</a>
        </div>
        <p className="footer-copy">© 2026 ALO AI · Todos os direitos reservados</p>
      </footer>
    </div>
  )
}
