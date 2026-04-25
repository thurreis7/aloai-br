import { useEffect, useMemo, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePermissions } from '../hooks/usePermissions'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../lib/api'
import { EmptyState, GlassCard, PageHeader, PageShell, SkeletonBlock, StatusPill } from '../components/app/WorkspaceUI'

const STATE_COLUMNS = [
  { id: 'new', label: 'Novo', tone: 'info' },
  { id: 'open', label: 'Aberto', tone: 'default' },
  { id: 'ai_handling', label: 'IA ativa', tone: 'info' },
  { id: 'human_handling', label: 'Atendimento humano', tone: 'warning' },
  { id: 'waiting_customer', label: 'Aguardando cliente', tone: 'warning' },
  { id: 'closed', label: 'Encerrado', tone: 'success' },
]

const STATE_LABELS = Object.fromEntries(STATE_COLUMNS.map((column) => [column.id, column.label]))

function normalizeConversationState(state, status) {
  const candidate = String(state || status || 'new').trim().toLowerCase()
  if (STATE_LABELS[candidate]) return candidate
  if (candidate === 'resolved') return 'closed'
  if (candidate === 'waiting') return 'waiting_customer'
  if (candidate === 'bot') return 'ai_handling'
  return 'new'
}

function toneForPriority(priority) {
  if (priority === 'high') return 'error'
  if (priority === 'medium') return 'warning'
  return 'success'
}

function isCopilotPaused(aiState) {
  if (!aiState || typeof aiState !== 'object' || Array.isArray(aiState)) return false
  const copilot = aiState.copilot
  if (!copilot || typeof copilot !== 'object' || Array.isArray(copilot)) return false
  if (copilot.paused === true) return true
  return String(copilot.mode || '').toLowerCase() === 'paused'
}

function isOpenState(state) {
  return normalizeConversationState(state) !== 'closed'
}

export default function Kanban() {
  const { can } = usePermissions()
  const { ws, loading: authLoading, workspaceReady } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cards, setCards] = useState([])
  const [draggingId, setDraggingId] = useState(null)
  const [dropColumn, setDropColumn] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const boardRef = useRef(null)

  useEffect(() => {
    let ignore = false

    async function loadBoard() {
      if (authLoading || !workspaceReady) {
        setLoading(true)
        setError('')
        return
      }

      if (!ws) {
        setCards([])
        setLoading(false)
        setError('')
        return
      }

        setLoading(true)
        setError('')
        try {
          const { data, error: queryError } = await supabase
            .from('conversations')
            .select('id, state, status, priority, routing_queue, routing_intent, routing_reason, assigned_to, ai_state, escalated_at, escalation_reason, escalation_note, last_message, last_message_at, contacts(name, company), channels(name, type), leads(status, owner_id, source_channel_id)')
            .eq('workspace_id', ws.id)
            .order('last_message_at', { ascending: false })

        if (queryError) throw queryError

        if (!ignore) {
          setCards((data || []).map((item) => ({
            ...(() => {
              const lead = Array.isArray(item.leads) ? item.leads[0] : item.leads
              return { leadStatus: lead?.status || 'open' }
            })(),
            id: item.id,
            state: normalizeConversationState(item.state, item.status),
            priority: item.priority || 'medium',
            routingQueue: item.routing_queue || 'triagem',
            routingIntent: item.routing_intent || 'duvida_geral',
            routingReason: item.routing_reason || '',
            assignedTo: item.assigned_to || null,
            aiState: item.ai_state || {},
            escalatedAt: item.escalated_at || null,
            escalationReason: String(item.escalation_reason || 'none').toLowerCase(),
            escalationNote: item.escalation_note || '',
            message: item.last_message || 'Sem preview',
            updatedAt: item.last_message_at,
            contactName: item.contacts?.name || 'Contato sem nome',
            company: item.contacts?.company || 'Empresa nao informada',
            channel: item.channels?.name || item.channels?.type || 'Canal',
          })))
          setSelectedId((current) => current || data?.[0]?.id || null)
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Nao foi possivel carregar o kanban.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadBoard()
    return () => { ignore = true }
  }, [ws, authLoading, workspaceReady])

  const grouped = useMemo(() => {
    return STATE_COLUMNS.map((column) => ({
      ...column,
      cards: cards.filter((card) => card.state === column.id),
    }))
  }, [cards])

  const selected = cards.find((item) => item.id === selectedId) || null
  const operational = useMemo(() => {
    const activeCards = cards.filter((card) => isOpenState(card.state))
    const queueBacklog = activeCards.reduce((acc, card) => {
      const queue = String(card.routingQueue || 'triagem').toLowerCase()
      acc[queue] = (acc[queue] || 0) + 1
      return acc
    }, {})

    return {
      unassigned: activeCards.filter((card) => !card.assignedTo).length,
      escalated: activeCards.filter((card) => card.escalationReason !== 'none' || Boolean(card.escalatedAt)).length,
      aiPaused: activeCards.filter((card) => isCopilotPaused(card.aiState)).length,
      queueBacklog: Object.entries(queueBacklog).sort((a, b) => b[1] - a[1]),
    }
  }, [cards])

  if (!authLoading && workspaceReady && !ws) {
    return (
      <PageShell contentStyle={{ gap: 16 }}>
        <PageHeader
          eyebrow="Lifecycle sincronizado"
          title="Kanban da conversa"
          description="Conecte um workspace para habilitar o board e o drag and drop."
        />
        <EmptyState title="Workspace nao encontrado" description="Essa conta ainda nao foi vinculada ao workspace no Supabase." />
      </PageShell>
    )
  }

  async function moveCard(cardId, nextColumn) {
    if (!can('perm_kanban_move')) return
    const previousCards = cards
    setCards((current) => current.map((card) => card.id === cardId ? { ...card, state: nextColumn } : card))

    try {
      const response = await apiFetch(`/workspaces/${ws.id}/conversations/${cardId}/state`, {
        method: 'PATCH',
        body: JSON.stringify({ state: nextColumn }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Nao foi possivel salvar a etapa do card.')
      }
      if (payload?.conversation) {
        setCards((current) => current.map((card) => (
          card.id === cardId ? { ...card, state: normalizeConversationState(payload.conversation.state, payload.conversation.status) } : card
        )))
      }
    } catch (updateError) {
      setCards(previousCards)
      setError(updateError.message || 'Nao foi possivel salvar a etapa do card.')
    }
  }

  return (
    <PageShell contentStyle={{ gap: 16 }}>
      <PageHeader
        eyebrow="Lifecycle sincronizado"
        title="Kanban da conversa"
        description="Seis estados canônicos, drag and drop salvo no banco e leitura instantanea de prioridade, preview e acao."
        actions={(
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
            <StatusPill tone={can('perm_kanban_move') ? 'success' : 'warning'}>{can('perm_kanban_move') ? 'Edicao liberada' : 'Somente leitura'}</StatusPill>
            {can('perm_reports_metrics') ? <StatusPill tone="default">Sem dono: {operational.unassigned}</StatusPill> : null}
            {can('perm_reports_metrics') ? <StatusPill tone="error">Escalonadas: {operational.escalated}</StatusPill> : null}
            {can('perm_reports_metrics') ? <StatusPill tone="warning">IA pausada: {operational.aiPaused}</StatusPill> : null}
          </div>
        )}
      />

      {can('perm_reports_metrics') ? (
        <GlassCard style={{ margin: 0, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--txt3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>Backlog por fila</span>
            {operational.queueBacklog.length ? operational.queueBacklog.map(([queue, count]) => (
              <StatusPill key={queue} tone="default">{queue}: {count}</StatusPill>
            )) : <StatusPill tone="success">sem backlog</StatusPill>}
          </div>
        </GlassCard>
      ) : null}

      {error ? (
        <EmptyState icon="!" title="Falha ao carregar o kanban" description={error} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, minHeight: 640 }}>
          <div
            ref={boardRef}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, minmax(240px, 1fr))',
              gap: 14,
              overflowX: 'auto',
              paddingBottom: 8,
            }}
          >
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <GlassCard key={index} style={{ minHeight: 520, padding: 16 }}>
                  <SkeletonBlock height={18} width="45%" />
                  <SkeletonBlock height={64} width="100%" style={{ marginTop: 14 }} />
                  <SkeletonBlock height={64} width="100%" style={{ marginTop: 10 }} />
                  <SkeletonBlock height={64} width="100%" style={{ marginTop: 10 }} />
                </GlassCard>
              ))
            ) : grouped.map((column) => (
              <GlassCard
                key={column.id}
                style={{
                  padding: 14,
                  minHeight: 520,
                  borderColor: dropColumn === column.id ? 'rgba(139,92,246,.4)' : undefined,
                }}
                onDragOver={(event) => {
                  if (!can('perm_kanban_move')) return
                  event.preventDefault()
                  setDropColumn(column.id)
                }}
                onDrop={(event) => {
                  if (!can('perm_kanban_move')) return
                  event.preventDefault()
                  if (draggingId) moveCard(draggingId, column.id)
                  setDraggingId(null)
                  setDropColumn(null)
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{column.label}</div>
                    <div style={{ color: 'var(--txt3)', fontSize: 12 }}>{column.cards.length} cards</div>
                  </div>
                  <StatusPill tone={column.tone}>{STATE_LABELS[column.id]}</StatusPill>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {column.cards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      draggable={can('perm_kanban_move')}
                      onDragStart={() => setDraggingId(card.id)}
                      onDragEnd={() => {
                        setDraggingId(null)
                        setDropColumn(null)
                      }}
                      onClick={() => setSelectedId(card.id)}
                      style={{
                        padding: 14,
                        borderRadius: 18,
                        border: selected?.id === card.id ? '1px solid var(--selection-border)' : '1px solid rgba(255,255,255,.06)',
                        background: draggingId === card.id ? 'rgba(255,255,255,.02)' : selected?.id === card.id ? 'var(--selection-bg)' : 'rgba(255,255,255,.03)',
                        color: 'inherit',
                        textAlign: 'left',
                        cursor: can('perm_kanban_move') ? 'grab' : 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>{card.contactName}</div>
                          <div style={{ color: 'var(--txt3)', fontSize: 13 }}>{card.company}</div>
                        </div>
                        <GripVertical size={14} color="var(--txt4)" />
                      </div>
                      <p style={{ marginTop: 12, color: 'var(--txt2)', lineHeight: 1.55 }}>{card.message}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
                        <StatusPill tone={toneForPriority(card.priority)}>{card.priority}</StatusPill>
                        <StatusPill tone="default">{card.channel}</StatusPill>
                        <StatusPill tone="info">{card.routingQueue}</StatusPill>
                        {card.escalationReason !== 'none' ? <StatusPill tone="error">escalonada</StatusPill> : null}
                      </div>
                    </button>
                  ))}
                  {!column.cards.length ? (
                    <div style={{ padding: 18, borderRadius: 18, border: '1px dashed rgba(255,255,255,.08)', color: 'var(--txt4)', textAlign: 'center' }}>
                      Solte um card aqui
                    </div>
                  ) : null}
                </div>
              </GlassCard>
            ))}
          </div>

          <GlassCard style={{ padding: 22, minHeight: 640 }}>
            {selected ? (
              <div style={{ display: 'grid', gap: 18 }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <StatusPill tone="info">{selected.channel}</StatusPill>
                    <StatusPill tone={toneForPriority(selected.priority)}>{selected.priority}</StatusPill>
                    <StatusPill tone="default">{STATE_LABELS[selected.state]}</StatusPill>
                    <StatusPill tone="info">{selected.routingQueue}</StatusPill>
                    <StatusPill tone="default">{selected.routingIntent}</StatusPill>
                    <StatusPill tone={selected.leadStatus === 'qualified' ? 'success' : selected.leadStatus === 'disqualified' ? 'error' : 'default'}>
                      {selected.leadStatus}
                    </StatusPill>
                    <StatusPill tone={isCopilotPaused(selected.aiState) ? 'warning' : 'default'}>
                      {isCopilotPaused(selected.aiState) ? 'copilot pausado' : 'copilot ativo'}
                    </StatusPill>
                    {selected.escalationReason !== 'none' ? <StatusPill tone="error">{selected.escalationReason}</StatusPill> : null}
                  </div>
                  <h2 style={{ fontSize: 28, fontFamily: 'var(--font-display)', letterSpacing: '-.04em' }}>{selected.contactName}</h2>
                  <p style={{ color: 'var(--txt3)', marginTop: 8 }}>{selected.company}</p>
                </div>

                <GlassCard style={{ margin: 0, padding: 18 }}>
                  <div style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                    Preview da conversa
                  </div>
                  <div style={{ color: 'var(--txt2)', lineHeight: 1.7 }}>{selected.message}</div>
                  {selected.routingReason ? (
                    <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', color: 'var(--txt2)', lineHeight: 1.6 }}>
                      {selected.routingReason}
                    </div>
                  ) : null}
                  {selected.escalationNote ? (
                    <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: '1px solid rgba(248,113,113,.2)', background: 'rgba(248,113,113,.08)', color: 'var(--txt2)', lineHeight: 1.6 }}>
                      {selected.escalationNote}
                    </div>
                  ) : null}
                </GlassCard>

                <GlassCard style={{ margin: 0, padding: 18 }}>
                  <div style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                    Mover rapidamente
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {STATE_COLUMNS.filter((column) => column.id !== selected.state).map((column) => (
                      <button
                        key={column.id}
                        type="button"
                        className="workspace-button workspace-button--secondary"
                        onClick={() => moveCard(selected.id, column.id)}
                        disabled={!can('perm_kanban_move')}
                        style={{ textAlign: 'left', justifyContent: 'space-between', display: 'flex' }}
                      >
                        <span>{column.label}</span>
                        <span>{column.id}</span>
                      </button>
                    ))}
                  </div>
                </GlassCard>

                {!can('perm_kanban_move') ? (
                  <EmptyState
                    icon="!"
                    title="Movimentacao bloqueada"
                    description="Seu perfil pode acompanhar o pipeline, mas nao mover cards entre etapas."
                  />
                ) : null}
              </div>
            ) : (
              <EmptyState
                icon="○"
                title="Escolha um card"
                description="O painel lateral mostra o contexto e permite mover o negocio sem sair do board."
              />
            )}
          </GlassCard>
        </div>
      )}
    </PageShell>
  )
}
