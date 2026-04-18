import { useEffect, useMemo, useState } from 'react'
import { Search, Tags } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { EmptyState, GlassCard, PageHeader, PageShell, SkeletonBlock, StatusPill } from '../components/app/WorkspaceUI'

function avatarTone(value) {
  const palette = ['#8B5CF6', '#0EA5E9', '#F59E0B', '#10B981', '#EC4899', '#F97316']
  let hash = 0
  for (const character of value || '') hash = (hash * 31 + character.charCodeAt(0)) % palette.length
  return palette[hash]
}

export default function Contacts() {
  const { ws, loading: authLoading, workspaceReady } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contacts, setContacts] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [draftTag, setDraftTag] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadContacts() {
      if (authLoading || !workspaceReady) {
        setLoading(true)
        setError('')
        return
      }

      if (!ws) {
        setContacts([])
        setLoading(false)
        setError('')
        return
      }

      setLoading(true)
      setError('')
      try {
        const [contactsRes, conversationsRes] = await Promise.all([
          supabase
            .from('contacts')
            .select('id, name, phone, email, company, tags, created_at')
            .eq('workspace_id', ws.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('conversations')
            .select('id, contact_id, status, priority, last_message, last_message_at, channels(type, name)')
            .eq('workspace_id', ws.id)
            .order('last_message_at', { ascending: false }),
        ])

        if (contactsRes.error) throw contactsRes.error
        if (conversationsRes.error) throw conversationsRes.error

        const byContact = new Map()
        ;(conversationsRes.data || []).forEach((conversation) => {
          if (!byContact.has(conversation.contact_id)) byContact.set(conversation.contact_id, [])
          byContact.get(conversation.contact_id).push(conversation)
        })

        const nextContacts = (contactsRes.data || []).map((contact) => {
          const history = byContact.get(contact.id) || []
          const latest = history[0]
          return {
            ...contact,
            history,
            latestStatus: latest?.status || 'new',
            latestPriority: latest?.priority || 'medium',
            latestMessage: latest?.last_message || 'Sem conversas registradas',
            latestChannel: latest?.channels?.name || latest?.channels?.type || 'Sem canal',
            latestAt: latest?.last_message_at || contact.created_at,
            totalConversations: history.length,
          }
        })

        if (!ignore) {
          setContacts(nextContacts)
          setSelectedId((current) => current || nextContacts[0]?.id || null)
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Nao foi possivel carregar o CRM.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadContacts()
    return () => { ignore = true }
  }, [ws, authLoading, workspaceReady])

  const filtered = useMemo(() => {
    return contacts.filter((contact) => {
      const query = search.toLowerCase().trim()
      const matchesSearch =
        !query ||
        contact.name?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'all' || contact.latestStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [contacts, search, statusFilter])

  const selected = filtered.find((item) => item.id === selectedId) || contacts.find((item) => item.id === selectedId) || null

  if (!authLoading && workspaceReady && !ws) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="CRM operacional"
          title="Relacionamento com contexto completo"
          description="Conecte um workspace para habilitar contatos, tags e historico."
        />
        <EmptyState title="Workspace nao encontrado" description="Essa conta ainda nao foi vinculada a um workspace no Supabase." />
      </PageShell>
    )
  }

  async function saveTags(nextTags) {
    if (!selected) return
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ tags: nextTags })
      .eq('id', selected.id)
    if (updateError) {
      setError(updateError.message || 'Nao foi possivel salvar as tags.')
      return
    }

    setContacts((current) => current.map((contact) => (
      contact.id === selected.id ? { ...contact, tags: nextTags } : contact
    )))
  }

  function handleAddTag() {
    const value = draftTag.trim()
    if (!value || !selected) return
    if ((selected.tags || []).includes(value)) {
      setDraftTag('')
      return
    }
    saveTags([...(selected.tags || []), value])
    setDraftTag('')
  }

  function handleRemoveTag(tag) {
    if (!selected) return
    saveTags((selected.tags || []).filter((item) => item !== tag))
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="CRM operacional"
        title="Relacionamento com contexto completo"
        description="Lista, filtros e historico lateral para responder com contexto sem sair da operacao."
        actions={<StatusPill tone="default">{contacts.length} contatos</StatusPill>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, .8fr)', gap: 16 }}>
        <GlassCard style={{ minHeight: 640 }}>
          <div style={{ padding: 22, display: 'grid', gap: 16 }}>
            <div className="workspace-toolbar" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                  <Search size={16} style={{ position: 'absolute', top: 14, left: 14, color: 'var(--txt4)' }} />
                  <input
                    className="workspace-input"
                    style={{ paddingLeft: 40 }}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nome, empresa ou e-mail"
                  />
                </div>
                <select className="workspace-select" style={{ width: 180 }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">Todos os status</option>
                  <option value="open">Em andamento</option>
                  <option value="waiting">Aguardando</option>
                  <option value="resolved">Resolvido</option>
                  <option value="new">Novo</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,.03)' }}>
                    <SkeletonBlock height={16} width="24%" />
                    <SkeletonBlock height={13} width="40%" style={{ marginTop: 10 }} />
                  </div>
                ))}
              </div>
            ) : error ? (
              <EmptyState icon="!" title="Nao foi possivel carregar os contatos" description={error} />
            ) : !filtered.length ? (
              <EmptyState
                icon="CRM"
                title="Nenhum contato encontrado"
                description="Ajuste busca e filtros para visualizar o CRM."
              />
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.2fr) 180px 140px 120px',
                    gap: 12,
                    padding: '0 14px',
                    color: 'var(--txt4)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>Contato</span>
                  <span>Empresa</span>
                  <span>Ultima interacao</span>
                  <span>Canal</span>
                </div>

                {filtered.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setSelectedId(contact.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1.2fr) 180px 140px 120px',
                      gap: 12,
                      alignItems: 'center',
                      padding: 14,
                      borderRadius: 20,
                      border: selected?.id === contact.id ? '1px solid var(--selection-border)' : '1px solid rgba(255,255,255,.06)',
                      background: selected?.id === contact.id ? 'var(--selection-bg)' : 'rgba(255,255,255,.03)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 16,
                          background: avatarTone(contact.name),
                          display: 'grid',
                          placeItems: 'center',
                          color: '#fff',
                          fontWeight: 800,
                        }}
                      >
                        {(contact.name || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {contact.name || 'Sem nome'}
                        </div>
                        <div style={{ color: 'var(--txt3)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {contact.email || contact.phone || 'Sem contato principal'}
                        </div>
                      </div>
                    </div>
                    <span style={{ color: 'var(--txt2)' }}>{contact.company || 'Nao informado'}</span>
                    <span style={{ color: 'var(--txt3)' }}>
                      {new Date(contact.latestAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <div style={{ justifySelf: 'start' }}>
                      <StatusPill tone="info">{contact.latestChannel}</StatusPill>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard style={{ minHeight: 640 }}>
          {selected ? (
            <div style={{ padding: 22, display: 'grid', gap: 18 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 22,
                    background: avatarTone(selected.name),
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    fontSize: 24,
                    fontWeight: 800,
                  }}
                >
                  {(selected.name || '?').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 24, fontFamily: 'var(--font-display)', letterSpacing: '-.04em' }}>
                    {selected.name || 'Contato sem nome'}
                  </h2>
                  <p style={{ color: 'var(--txt3)', marginTop: 6 }}>{selected.company || 'Empresa nao informada'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <StatusPill tone="info">{selected.latestChannel}</StatusPill>
                <StatusPill tone={selected.latestStatus === 'resolved' ? 'success' : 'warning'}>
                  {selected.latestStatus}
                </StatusPill>
                <StatusPill tone="default">{selected.totalConversations} conversas</StatusPill>
              </div>

              <GlassCard style={{ margin: 0, padding: 18 }}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <InfoRow label="Telefone" value={selected.phone || 'Nao informado'} />
                  <InfoRow label="E-mail" value={selected.email || 'Nao informado'} />
                  <InfoRow label="Ultima mensagem" value={selected.latestMessage} />
                </div>
              </GlassCard>

              <GlassCard style={{ margin: 0, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <strong style={{ fontSize: 15 }}>Tags editaveis</strong>
                  <StatusPill tone="default"><Tags size={12} /> {(selected.tags || []).length}</StatusPill>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(selected.tags || []).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        border: '1px solid rgba(255,255,255,.08)',
                        background: 'rgba(255,255,255,.05)',
                        color: 'var(--txt2)',
                        padding: '8px 12px',
                        borderRadius: 999,
                        cursor: 'pointer',
                      }}
                    >
                      {tag} x
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <input
                    className="workspace-input"
                    value={draftTag}
                    onChange={(event) => setDraftTag(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') handleAddTag() }}
                    placeholder="Adicionar tag"
                  />
                  <button type="button" className="workspace-button workspace-button--secondary" onClick={handleAddTag}>
                    Salvar
                  </button>
                </div>
              </GlassCard>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Historico de conversas</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {selected.history.length ? selected.history.map((conversation) => (
                    <div
                      key={conversation.id}
                      style={{
                        padding: 14,
                        borderRadius: 18,
                        border: '1px solid rgba(255,255,255,.06)',
                        background: 'rgba(255,255,255,.03)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                        <StatusPill tone="info">{conversation.channels?.name || conversation.channels?.type || 'Canal'}</StatusPill>
                        <span style={{ color: 'var(--txt4)', fontSize: 12 }}>
                          {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleString('pt-BR') : 'Sem data'}
                        </span>
                      </div>
                      <div style={{ color: 'var(--txt2)', lineHeight: 1.6 }}>{conversation.last_message || 'Sem resumo'}</div>
                    </div>
                  )) : (
                    <EmptyState title="Sem historico ainda" description="Quando o contato iniciar uma conversa, ela aparece aqui." />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="○"
              title="Selecione um contato"
              description="O painel lateral mostra detalhes, tags e historico completo da relacao."
            />
          )}
        </GlassCard>
      </div>
    </PageShell>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <span style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span>
      <span style={{ color: 'var(--txt2)', lineHeight: 1.6 }}>{value}</span>
    </div>
  )
}
