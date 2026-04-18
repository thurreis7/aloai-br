import { useEffect, useMemo, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePermissions } from '../hooks/usePermissions'
import { useAuth } from '../hooks/useAuth'
import { EmptyState, GlassCard, PageHeader, PageShell, SkeletonBlock, StatusPill } from '../components/app/WorkspaceUI'

const COLUMNS = [
  { id: 'new', label: 'Novos', tone: 'info' },
  { id: 'open', label: 'Qualificando', tone: 'default' },
  { id: 'waiting', label: 'Aguardando', tone: 'warning' },
  { id: 'negotiation', label: 'Negociacao', tone: 'info' },
  { id: 'followup', label: 'Follow-up', tone: 'warning' },
  { id: 'resolved', label: 'Fechados', tone: 'success' },
]

function toneForPriority(priority) {
  if (priority === 'high') return 'error'
  if (priority === 'medium') return 'warning'
  return 'success'
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
          .select('id, status, priority, last_message, last_message_at, contacts(name, company), channels(name, type)')
          .eq('workspace_id', ws.id)
          .order('last_message_at', { ascending: false })

        if (queryError) throw queryError

        if (!ignore) {
          setCards((data || []).map((item) => ({
            id: item.id,
            status: COLUMNS.some((column) => column.id === item.status) ? item.status : 'new',
            priority: item.priority || 'medium',
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
    return COLUMNS.map((column) => ({
      ...column,
      cards: cards.filter((card) => card.status === column.id),
    }))
  }, [cards])

  const selected = cards.find((item) => item.id === selectedId) || null

  if (!authLoading && workspaceReady && !ws) {
    return (
      <PageShell contentStyle={{ gap: 16 }}>
        <PageHeader
          eyebrow="Pipeline sincronizado"
          title="Kanban comercial e operacional"
          description="Conecte um workspace para habilitar o pipeline e o drag and drop."
        />
        <EmptyState title="Workspace nao encontrado" description="Essa conta ainda nao foi vinculada ao workspace no Supabase." />
      </PageShell>
    )
  }

  async function moveCard(cardId, nextColumn) {
    if (!can('perm_kanban_move')) return
    const previousCards = cards
    setCards((current) => current.map((card) => card.id === cardId ? { ...card, status: nextColumn } : card))

    const { error: updateError } = await supabase
      .from('conversations')
      .update({ status: nextColumn })
      .eq('id', cardId)
      .eq('workspace_id', ws.id)

    if (updateError) {
      setCards(previousCards)
      setError(updateError.message || 'Nao foi possivel salvar a etapa do card.')
    }
  }

  return (
    <PageShell contentStyle={{ gap: 16 }}>
      <PageHeader
        eyebrow="Pipeline sincronizado"
        title="Kanban comercial e operacional"
        description="Seis colunas fixas, drag and drop salvo no banco e leitura instantanea de prioridade, preview e acao."
        actions={<StatusPill tone={can('perm_kanban_move') ? 'success' : 'warning'}>{can('perm_kanban_move') ? 'Edicao liberada' : 'Somente leitura'}</StatusPill>}
      />

      {error ? (
        <EmptyState icon="!" title="Falha ao carregar o pipeline" description={error} />
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
                  <StatusPill tone={column.tone}>{column.id}</StatusPill>
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
                  </div>
                  <h2 style={{ fontSize: 28, fontFamily: 'var(--font-display)', letterSpacing: '-.04em' }}>{selected.contactName}</h2>
                  <p style={{ color: 'var(--txt3)', marginTop: 8 }}>{selected.company}</p>
                </div>

                <GlassCard style={{ margin: 0, padding: 18 }}>
                  <div style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                    Preview da conversa
                  </div>
                  <div style={{ color: 'var(--txt2)', lineHeight: 1.7 }}>{selected.message}</div>
                </GlassCard>

                <GlassCard style={{ margin: 0, padding: 18 }}>
                  <div style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                    Mover rapidamente
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {COLUMNS.filter((column) => column.id !== selected.status).map((column) => (
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
