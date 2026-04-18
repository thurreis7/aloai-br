import { useMemo, useState } from 'react'
import { Bot, Clock3, Sparkles, Wand2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { EmptyState, GlassCard, PageHeader, PageShell, StatusPill } from '../components/app/WorkspaceUI'

const DEFAULT_STATE = {
  enabled: true,
  tone: 'consultivo',
  schedule: '08:00 - 20:00',
  channels: ['whatsapp', 'webchat'],
  rules: [
    { id: 1, if: 'Lead novo fora do horario', then: 'Assumir com IA e marcar follow-up' },
    { id: 2, if: 'Mensagem sem resposta ha 10 min', then: 'Priorizar na fila do supervisor' },
    { id: 3, if: 'Pedido de proposta', then: 'Mover para negociacao e atribuir comercial' },
  ],
  shortcuts: ['/boasvindas', '/precos', '/agendar-demo'],
}

export default function Automation() {
  const { wsRole } = useAuth()
  const storageKey = useMemo(() => `alo-automation-${wsRole?.workspace_id || 'default'}`, [wsRole])
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : DEFAULT_STATE
  })
  const [newShortcut, setNewShortcut] = useState('')

  function persist(nextState) {
    setState(nextState)
    localStorage.setItem(storageKey, JSON.stringify(nextState))
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Agente IA"
        title="Automacao clara, configuravel e vendavel"
        description="Ativacao do agente, comportamento operacional, regras automaticas e atalhos em uma mesma experiencia."
        actions={<StatusPill tone={state.enabled ? 'success' : 'warning'}>{state.enabled ? 'IA ativa' : 'IA pausada'}</StatusPill>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) 360px', gap: 16 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <GlassCard style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Bot size={18} color="var(--pri-l)" />
                  <strong>Ativacao do agente</strong>
                </div>
                <p style={{ color: 'var(--txt3)', marginTop: 10, lineHeight: 1.6 }}>
                  Controle a automacao por workspace mantendo clareza de horario, tom e canais permitidos.
                </p>
              </div>
              <button
                type="button"
                className={state.enabled ? 'workspace-button' : 'workspace-button workspace-button--secondary'}
                onClick={() => persist({ ...state, enabled: !state.enabled })}
              >
                {state.enabled ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </GlassCard>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            <GlassCard style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Sparkles size={16} color="var(--info)" />
                <span style={{ color: 'var(--txt3)' }}>Tom</span>
              </div>
              <select
                className="workspace-select"
                style={{ marginTop: 14 }}
                value={state.tone}
                onChange={(event) => persist({ ...state, tone: event.target.value })}
              >
                <option value="consultivo">Consultivo</option>
                <option value="direto">Direto</option>
                <option value="acolhedor">Acolhedor</option>
              </select>
            </GlassCard>

            <GlassCard style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Clock3 size={16} color="var(--warn)" />
                <span style={{ color: 'var(--txt3)' }}>Horario</span>
              </div>
              <input
                className="workspace-input"
                style={{ marginTop: 14 }}
                value={state.schedule}
                onChange={(event) => persist({ ...state, schedule: event.target.value })}
              />
            </GlassCard>

            <GlassCard style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Wand2 size={16} color="var(--success)" />
                <span style={{ color: 'var(--txt3)' }}>Canais</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                {['whatsapp', 'instagram', 'email', 'webchat'].map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => {
                      const active = state.channels.includes(channel)
                      persist({
                        ...state,
                        channels: active ? state.channels.filter((item) => item !== channel) : [...state.channels, channel],
                      })
                    }}
                    style={{
                      border: state.channels.includes(channel) ? '1px solid var(--selection-border)' : '1px solid transparent',
                      borderRadius: 999,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      background: state.channels.includes(channel) ? 'var(--selection-bg)' : 'rgba(255,255,255,.05)',
                      color: state.channels.includes(channel) ? 'var(--selection-text)' : 'var(--txt3)',
                    }}
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>

          <GlassCard style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <div>
                <strong>Regras automaticas</strong>
                <p style={{ color: 'var(--txt3)', marginTop: 8 }}>If → assign para priorizar filas, follow-up e roteamento.</p>
              </div>
              <StatusPill tone="info">{state.rules.length} regras</StatusPill>
            </div>
            <div className="workspace-list">
              {state.rules.map((rule) => (
                <div key={rule.id} style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>if</div>
                  <div style={{ marginTop: 6, fontWeight: 700 }}>{rule.if}</div>
                  <div style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 14 }}>then</div>
                  <div style={{ marginTop: 6, color: 'var(--txt2)' }}>{rule.then}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <GlassCard style={{ padding: 22 }}>
            <strong>Atalhos rapidos</strong>
            <p style={{ color: 'var(--txt3)', marginTop: 8 }}>Respostas acionadas por comando, prontas para agente humano ou IA.</p>
            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              {state.shortcuts.map((shortcut) => (
                <div key={shortcut} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', padding: 12, borderRadius: 16, background: 'rgba(255,255,255,.03)' }}>
                  <span>{shortcut}</span>
                  <StatusPill tone="default">Ativo</StatusPill>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <input
                className="workspace-input"
                placeholder="/novo-atalho"
                value={newShortcut}
                onChange={(event) => setNewShortcut(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && newShortcut.trim()) {
                    persist({ ...state, shortcuts: [...state.shortcuts, newShortcut.trim()] })
                    setNewShortcut('')
                  }
                }}
              />
              <button
                type="button"
                className="workspace-button workspace-button--secondary"
                onClick={() => {
                  if (!newShortcut.trim()) return
                  persist({ ...state, shortcuts: [...state.shortcuts, newShortcut.trim()] })
                  setNewShortcut('')
                }}
              >
                Adicionar
              </button>
            </div>
          </GlassCard>

          <GlassCard style={{ padding: 22 }}>
            <strong>Preview operacional</strong>
            <p style={{ color: 'var(--txt3)', marginTop: 8, lineHeight: 1.6 }}>
              Quando a IA estiver {state.enabled ? 'ativa' : 'pausada'}, ela responde em tom <strong>{state.tone}</strong>, opera no horario <strong>{state.schedule}</strong> e atua em <strong>{state.channels.join(', ') || 'nenhum canal'}</strong>.
            </p>
            {state.enabled ? null : (
              <EmptyState
                icon="!"
                title="IA em pausa"
                description="O workspace segue apenas com atendimento humano ate reativacao."
              />
            )}
          </GlassCard>
        </div>
      </div>
    </PageShell>
  )
}
