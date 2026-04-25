import { useEffect, useMemo, useState } from 'react'
import { Bot, Clock3, ShieldCheck, Sparkles, Wand2 } from 'lucide-react'
import { apiJson } from '../lib/api'
import { DEFAULT_AI_CHANNEL_POLICY, normalizeAiChannelPolicy } from '../lib/channels'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { EmptyState, GlassCard, PageHeader, PageShell, StatusPill } from '../components/app/WorkspaceUI'

const DEFAULT_STATE = {
  enabled: false,
  autoReplyEnabled: false,
  tone: 'consultivo',
  confidenceThreshold: 0.7,
  channelPolicy: DEFAULT_AI_CHANNEL_POLICY,
  schedulePolicy: {
    mode: 'always',
    timezone: 'America/Sao_Paulo',
    days: [1, 2, 3, 4, 5],
    start: '08:00',
    end: '20:00',
    summary: '08:00 - 20:00',
  },
}

export default function Automation() {
  const { wsRole, ws } = useAuth()
  const { canEditAiConfig } = usePermissions()
  const workspaceId = wsRole?.workspace_id || ws?.id || null
  const [state, setState] = useState(DEFAULT_STATE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadConfig() {
      if (!workspaceId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const { config } = await apiJson(`/workspaces/${workspaceId}/ai-assist/config`)
        if (ignore) return

        setState({
          enabled: Boolean(config?.enabled),
          autoReplyEnabled: Boolean(config?.autoReplyEnabled),
          tone: config?.tone || 'consultivo',
          confidenceThreshold: Number(config?.confidenceThreshold || 0.7),
          channelPolicy: normalizeAiChannelPolicy(config?.channelPolicy),
          schedulePolicy: {
            ...DEFAULT_STATE.schedulePolicy,
            ...(config?.schedulePolicy || {}),
          },
        })
        setSavedAt(config?.updatedAt || '')
      } catch (err) {
        if (!ignore) setError(err.message || 'Nao foi possivel carregar a politica de IA.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadConfig()
    return () => { ignore = true }
  }, [workspaceId])

  async function persist(nextState = state) {
    if (!workspaceId || !canEditAiConfig) return

    setSaving(true)
    setError('')
    try {
      const { config } = await apiJson(`/workspaces/${workspaceId}/ai-assist/config`, {
        method: 'PATCH',
        body: JSON.stringify({
          enabled: nextState.enabled,
          autoReplyEnabled: nextState.autoReplyEnabled,
          tone: nextState.tone,
          confidenceThreshold: nextState.confidenceThreshold,
          channelPolicy: nextState.channelPolicy,
          schedulePolicy: nextState.schedulePolicy,
        }),
      })

      setState({
        enabled: Boolean(config?.enabled),
        autoReplyEnabled: Boolean(config?.autoReplyEnabled),
        tone: config?.tone || 'consultivo',
        confidenceThreshold: Number(config?.confidenceThreshold || 0.7),
        channelPolicy: normalizeAiChannelPolicy(config?.channelPolicy),
        schedulePolicy: {
          ...DEFAULT_STATE.schedulePolicy,
          ...(config?.schedulePolicy || {}),
        },
      })
      setSavedAt(config?.updatedAt || new Date().toISOString())
    } catch (err) {
      setError(err.message || 'Nao foi possivel salvar a politica de IA.')
    } finally {
      setSaving(false)
    }
  }

  const enabledChannels = useMemo(
    () => Object.entries(state.channelPolicy).filter(([, allowed]) => allowed).map(([channel]) => channel),
    [state.channelPolicy],
  )

  const statusLabel = state.enabled ? 'IA ativa' : 'IA pausada'

  return (
    <PageShell>
      <PageHeader
        eyebrow="Agente IA"
        title="Politica operacional do workspace"
        description="Esta tela deixa de ser um mock local e passa a gravar enablement, tom, threshold e janelas de sugestao no contrato do backend."
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusPill tone={state.enabled ? 'success' : 'warning'}>{statusLabel}</StatusPill>
            <button
              type="button"
              className="workspace-button"
              disabled={!canEditAiConfig || loading || saving}
              onClick={() => persist()}
              title={canEditAiConfig ? '' : 'Somente owner e admin podem editar a politica de IA.'}
            >
              {saving ? 'Salvando...' : 'Salvar politica'}
            </button>
          </div>
        }
      />

      {error ? (
        <GlassCard style={{ padding: 22, marginBottom: 16 }}>
          <EmptyState icon="!" title="Politica indisponivel" description={error} />
        </GlassCard>
      ) : null}

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
                  O enablement controla se o workspace pode receber sugestoes on-demand no Inbox.
                </p>
              </div>
              <button
                type="button"
                className={state.enabled ? 'workspace-button' : 'workspace-button workspace-button--secondary'}
                disabled={!canEditAiConfig || loading}
                onClick={() => setState((current) => ({ ...current, enabled: !current.enabled }))}
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
                disabled={!canEditAiConfig || loading}
                value={state.tone}
                onChange={(event) => setState((current) => ({ ...current, tone: event.target.value }))}
              >
                <option value="consultivo">Consultivo</option>
                <option value="direto">Direto</option>
                <option value="acolhedor">Acolhedor</option>
              </select>
            </GlassCard>

            <GlassCard style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <ShieldCheck size={16} color="var(--warn)" />
                <span style={{ color: 'var(--txt3)' }}>Threshold</span>
              </div>
              <input
                className="workspace-input"
                style={{ marginTop: 14 }}
                type="number"
                min="0.1"
                max="0.999"
                step="0.01"
                disabled={!canEditAiConfig || loading}
                value={state.confidenceThreshold}
                onChange={(event) => setState((current) => ({ ...current, confidenceThreshold: Number(event.target.value || 0.7) }))}
              />
            </GlassCard>

            <GlassCard style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Clock3 size={16} color="var(--warn)" />
                <span style={{ color: 'var(--txt3)' }}>Janela</span>
              </div>
              <input
                className="workspace-input"
                style={{ marginTop: 14 }}
                disabled={!canEditAiConfig || loading}
                value={state.schedulePolicy.summary}
                onChange={(event) => setState((current) => ({
                  ...current,
                  schedulePolicy: {
                    ...current.schedulePolicy,
                    mode: 'window',
                    summary: event.target.value,
                  },
                }))}
              />
            </GlassCard>
          </div>

          <GlassCard style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <div>
                <strong>Canais liberados para sugestao</strong>
                <p style={{ color: 'var(--txt3)', marginTop: 8 }}>A policy afeta apenas a disponibilidade das sugestoes em Phase 3. Ela nao concede envio automatico.</p>
              </div>
              <StatusPill tone="info">{enabledChannels.length} canais</StatusPill>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['whatsapp', 'instagram', 'email', 'webchat'].map((channel) => (
                <button
                  key={channel}
                  type="button"
                  disabled={!canEditAiConfig || loading}
                  onClick={() => setState((current) => ({
                    ...current,
                    channelPolicy: {
                      ...current.channelPolicy,
                      [channel]: !current.channelPolicy[channel],
                    },
                  }))}
                  style={{
                    border: state.channelPolicy[channel] ? '1px solid var(--selection-border)' : '1px solid transparent',
                    borderRadius: 999,
                    padding: '8px 12px',
                    cursor: canEditAiConfig ? 'pointer' : 'not-allowed',
                    background: state.channelPolicy[channel] ? 'var(--selection-bg)' : 'rgba(255,255,255,.05)',
                    color: state.channelPolicy[channel] ? 'var(--selection-text)' : 'var(--txt3)',
                    opacity: canEditAiConfig ? 1 : 0.7,
                  }}
                >
                  {channel}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <GlassCard style={{ padding: 22 }}>
            <strong>Politica de auto-reply</strong>
            <p style={{ color: 'var(--txt3)', marginTop: 8 }}>Phase 3 grava apenas a policy. Nenhum envio automatico novo entra em producao nesta etapa.</p>
            <button
              type="button"
              className={state.autoReplyEnabled ? 'workspace-button' : 'workspace-button workspace-button--secondary'}
              style={{ marginTop: 16 }}
              disabled={!canEditAiConfig || loading}
              onClick={() => setState((current) => ({ ...current, autoReplyEnabled: !current.autoReplyEnabled }))}
            >
              {state.autoReplyEnabled ? 'Policy habilitada' : 'Policy desabilitada'}
            </button>
          </GlassCard>

          <GlassCard style={{ padding: 22 }}>
            <strong>Preview operacional</strong>
            <p style={{ color: 'var(--txt3)', marginTop: 8, lineHeight: 1.6 }}>
              Quando a IA estiver {state.enabled ? 'ativa' : 'pausada'}, o Inbox pede sugestoes em tom <strong>{state.tone}</strong>, com threshold <strong>{state.confidenceThreshold.toFixed(2)}</strong>, usando <strong>{enabledChannels.join(', ') || 'nenhum canal'}</strong> e a janela <strong>{state.schedulePolicy.summary}</strong>.
            </p>
            {savedAt ? (
              <div style={{ color: 'var(--txt3)', fontSize: 12, marginTop: 10 }}>
                Ultima persistencia: {new Date(savedAt).toLocaleString('pt-BR')}
              </div>
            ) : null}
            {!state.enabled ? (
              <EmptyState
                icon="!"
                title="IA em pausa"
                description="O workspace segue com atendimento humano e sem sugestoes on-demand ate nova ativacao."
              />
            ) : null}
          </GlassCard>
        </div>
      </div>
    </PageShell>
  )
}
