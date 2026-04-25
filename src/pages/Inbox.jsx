import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { apiFetch } from '../lib/api'
import { MessageCircle, Inbox as InboxIconLucide } from 'lucide-react'
import {
  getChannelColor,
  getChannelDisplayName,
  getChannelIcon,
  canComposeOnChannel,
  normalizeChannelType,
} from '../lib/channels'

/* ══ HELPERS ══════════════════════════════════════════ */
const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const fmtTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const PRI_COLORS = { high:'#ef4444', medium:'#f59e0b', low:'#10b981' }
const PRI_LABELS = { high:'Alta', medium:'Média', low:'Baixa' }
const STATE_LABELS = {
  new:'Novo',
  open:'Aberto',
  ai_handling:'IA ativa',
  human_handling:'Atendimento humano',
  waiting_customer:'Aguardando cliente',
  closed:'Encerrado',
}
const STATE_FILTERS = ['all', 'new', 'open', 'ai_handling', 'human_handling', 'waiting_customer', 'closed']

const normalizeConversationState = (state, status) => {
  const candidate = String(state || status || 'new').trim().toLowerCase()
  if (['new', 'open', 'ai_handling', 'human_handling', 'waiting_customer', 'closed'].includes(candidate)) return candidate
  if (candidate === 'resolved') return 'closed'
  if (candidate === 'waiting') return 'waiting_customer'
  if (candidate === 'bot') return 'ai_handling'
  if (candidate === 'open') return 'open'
  return 'new'
}

const initials = (name) =>
  (name || '?').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()

const avatarColor = (str) => {
  const colors = ['#7c3aed','#0ea5e9','#f59e0b','#10b981','#f97316','#ec4899','#8b5cf6']
  let h = 0; for (const c of str || '') h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

/* ══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════ */
function ChannelGlyph({ type, size = 14 }) {
  const Cmp = getChannelIcon(type) || InboxIconLucide
  return <Cmp size={size} strokeWidth={2} aria-hidden />
}

export default function Inbox() {
  const { user, ws, workspaceReady, loading: authLoading } = useAuth()
  const { can, convScope } = usePermissions()
  const [searchParams, setSearchParams] = useSearchParams()

  /* ── State ── */
  const [convs,       setConvs]       = useState([])
  const [msgs,        setMsgs]        = useState({})        // { convId: [...msgs] }
  const [activeId,    setActiveId]    = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [msgsLoading, setMsgsLoading] = useState(false)
  const [input,       setInput]       = useState('')
  const [sending,     setSending]     = useState(false)
  const [search,      setSearch]      = useState('')
  const [filterState,setFilterState]= useState('all')
  const [aiSug,       setAiSug]       = useState('')
  const [aiLoading,   setAiLoading]   = useState(false)
  const [showPanel,   setShowPanel]   = useState(true)

  /* ── Refs ── */
  const msgsEndRef   = useRef(null)
  const inputRef     = useRef(null)
  const realtimeSub  = useRef(null)

  /* ── Computed ── */
  const activeConv = convs.find(c => c.id === activeId)
  const filtered   = convs.filter(c => {
    const matchSearch = !search ||
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.last_message?.toLowerCase().includes(search.toLowerCase())
    const matchState = filterState === 'all' || c.state === filterState
    return matchSearch && matchState
  })
  const composerLocked = activeConv?.channel_type === 'instagram' || !canComposeOnChannel(activeConv?.channel_type)
  const canWriteReply = can('perm_reply') && !composerLocked && activeConv?.state !== 'closed'

  /* ═══════════════════════════════════════════════════
     LOAD CONVERSATIONS
     ═══════════════════════════════════════════════════ */
  const loadConvs = useCallback(async () => {
    if (authLoading || !workspaceReady || !user) {
      setLoading(true)
      return
    }

    if (!ws?.id) {
      setConvs([])
      setActiveId(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      let query = supabase
        .from('conversations')
        .select(`
          id, state, status, priority, unread_count,
          last_message, last_message_at, created_at,
          assigned_to,
          contacts ( id, name, phone, company, email ),
          channels  ( id, type, name )
        `)
        .eq('workspace_id', ws.id)
        .order('last_message_at', { ascending: false })
        .limit(60)

      /* Filtra por scope de permissão */
      const scope = convScope()
      if (scope === 'own')  query = query.eq('assigned_to', user.id)
      // 'team' e 'all' → sem filtro extra (RLS já isola por company)

      const { data, error } = await query
      if (error) throw error

      setConvs((data || []).map(mapConv))
      if (data?.length && !activeId) setActiveId(data[0].id)
    } catch (e) {
      console.error('Erro ao carregar conversas:', e)
    } finally {
      setLoading(false)
    }
  }, [user, ws, workspaceReady, authLoading, convScope, activeId])

  /* ═══════════════════════════════════════════════════
     LOAD MESSAGES
     ═══════════════════════════════════════════════════ */
  const loadMsgs = useCallback(async (convId) => {
    if (!convId || msgs[convId]) return
    setMsgsLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      setMsgs(prev => ({ ...prev, [convId]: (data || []).map(mapMsg) }))
    } catch (e) {
      console.error('Erro ao carregar mensagens:', e)
    } finally {
      setMsgsLoading(false)
    }
  }, [msgs])

  /* ═══════════════════════════════════════════════════
     REALTIME SUBSCRIPTION
     ═══════════════════════════════════════════════════ */
  useEffect(() => {
    if (!user) return

    realtimeSub.current = supabase
      .channel('inbox-realtime')
      /* Nova mensagem */
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new
          const mapped = mapMsg(m)

          /* Adiciona à lista de msgs se a conversa já está carregada */
          setMsgs(prev => {
            if (!prev[m.conversation_id]) return prev
            const exists = prev[m.conversation_id].some(x => x.id === m.id)
            if (exists) return prev
            return { ...prev, [m.conversation_id]: [...prev[m.conversation_id], mapped] }
          })

          /* Atualiza preview na lista de conversas */
          setConvs(prev => prev.map(c =>
            c.id === m.conversation_id
              ? { ...c, last_message: m.content, last_message_at: m.created_at,
                  unread: c.id !== activeId ? (c.unread || 0) + 1 : 0 }
              : c
          ))
        }
      )
      /* Conversa atualizada */
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        (payload) => {
          setConvs(prev => prev.map(c =>
            c.id === payload.new.id ? { ...c, ...mapConvPartial(payload.new) } : c
          ))
        }
      )
      /* Nova conversa */
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        () => loadConvs()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(realtimeSub.current)
    }
  }, [user, activeId]) // eslint-disable-line

  /* ═══════════════════════════════════════════════════
     EFFECTS
     ═══════════════════════════════════════════════════ */
  useEffect(() => { loadConvs() }, [loadConvs])

  useEffect(() => {
    if (loading) return
    const cid = searchParams.get('conv')
    if (!cid || !convs.length) return
    const found = convs.find((c) => String(c.id) === String(cid))
    if (found) setActiveId((cur) => (cur === found.id ? cur : found.id))
  }, [loading, convs, searchParams])

  useEffect(() => {
    if (activeId) {
      loadMsgs(activeId)
      markAsRead(activeId)
      generateAiSuggestion(activeId)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [activeId]) // eslint-disable-line

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, activeId])

  /* ═══════════════════════════════════════════════════
     ACTIONS
     ═══════════════════════════════════════════════════ */
  const markAsRead = async (convId) => {
    setConvs(prev => prev.map(c => c.id === convId ? { ...c, unread: 0 } : c))
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeId || sending || !canWriteReply) return
    const text = input.trim()
    setInput('')
    setSending(true)

    /* Optimistic UI */
    const tempMsg = { id: `temp-${Date.now()}`, from: 'agent', text, time: now(), temp: true }
    setMsgs(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), tempMsg] }))

    try {
      const response = await apiFetch(`/workspaces/${ws?.id}/conversations/${activeId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Nao foi possivel enviar a mensagem.')
      }

      const saved = payload?.message
      const conversation = payload?.conversation
      setMsgs(prev => ({
        ...prev,
        [activeId]: (prev[activeId] || []).map(m =>
          m.id === tempMsg.id ? (saved ? mapMsg(saved) : m) : m
        ),
      }))
      if (conversation) {
        setConvs(prev => prev.map(c => (c.id === activeId ? { ...c, ...mapConvPartial(conversation) } : c)))
      }
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e)
      /* Reverte optimistic */
      setMsgs(prev => ({
        ...prev,
        [activeId]: (prev[activeId] || []).filter(m => m.id !== tempMsg.id),
      }))
      setInput(text) // devolve o texto
    } finally {
      setSending(false)
    }
  }

  const generateAiSuggestion = async (convId) => {
    const convMsgs = msgs[convId]
    if (!convMsgs?.length || !can('perm_ai')) return
    setAiSug('')
    setAiLoading(true)
    try {
      /* Últimas 4 mensagens como contexto */
      const context = convMsgs.slice(-4).map(m =>
        `${m.from === 'client' ? 'Cliente' : 'Agente'}: ${m.text}`
      ).join('\n')

      const suggests = [
        'Entendi! Posso te ajudar com mais detalhes sobre isso.',
        'Claro, vou verificar essa informação agora mesmo.',
        'Perfeito! Quer que eu agende um contato com nossa equipe?',
        'Obrigado pelo contato! Vou resolver isso em instantes.',
        'Certo! Posso te enviar mais informações sobre nossos planos?',
      ]
      /* Simulação local enquanto não há endpoint de IA */
      await new Promise(r => setTimeout(r, 600))
      setAiSug(suggests[Math.floor(Math.random() * suggests.length)])
    } catch {
      setAiSug('')
    } finally {
      setAiLoading(false)
    }
  }

  const closeConv = async () => {
    if (!activeId || !can('perm_close')) return
    try {
      const response = await apiFetch(`/workspaces/${ws?.id}/conversations/${activeId}/close`, {
        method: 'POST',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Nao foi possivel encerrar a conversa.')
      }
      if (payload?.conversation) {
        setConvs(prev => prev.map(c => (c.id === activeId ? { ...c, ...mapConvPartial(payload.conversation) } : c)))
      }
    } catch (error) {
      console.error('Erro ao encerrar conversa:', error)
    }
  }

  const transferConv = async (toUserId) => {
    if (!activeId || !can('perm_transfer')) return
    try {
      const response = await apiFetch(`/workspaces/${ws?.id}/conversations/${activeId}/assignment`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedTo: toUserId }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Nao foi possivel reatribuir a conversa.')
      }
      if (payload?.conversation) {
        setConvs(prev => prev.map(c => (c.id === activeId ? { ...c, ...mapConvPartial(payload.conversation) } : c)))
      }
    } catch (error) {
      console.error('Erro ao reatribuir conversa:', error)
    }
  }

  /* ═══════════════════════════════════════════════════
     MAPPERS
     ═══════════════════════════════════════════════════ */
  const mapConv = (c) => {
    const channelType = normalizeChannelType(c.channels?.type)
    return {
    id:              c.id,
    state:           normalizeConversationState(c.state, c.status),
    status:          c.status || c.state || 'new',
    priority:        c.priority || 'medium',
    unread:          c.unread_count || 0,
    last_message:    c.last_message || '',
    last_message_at: c.last_message_at,
    assigned_to:     c.assigned_to,
    contact_id:      c.contacts?.id,
    contact_name:    c.contacts?.name || c.contacts?.phone || 'Desconhecido',
    contact_phone:   c.contacts?.phone,
    contact_company: c.contacts?.company || '',
    contact_email:   c.contacts?.email || '',
    channel_id:      c.channels?.id,
    channel_type:    channelType,
    channel_name:    getChannelDisplayName(channelType, c.channels?.name),
    }
  }

  const mapConvPartial = (c) => ({
    state:           normalizeConversationState(c.state, c.status),
    status:          c.status || c.state || 'new',
    priority:        c.priority,
    unread:          c.unread_count || 0,
    last_message:    c.last_message,
    last_message_at: c.last_message_at,
    assigned_to:     c.assigned_to,
  })

  const mapMsg = (m) => ({
    id:   m.id,
    from: m.sender_type === 'client' ? 'client' : m.sender_type === 'bot' ? 'ai' : 'agent',
    text: m.content,
    time: fmtTime(m.created_at),
    temp: false,
  })

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  const convMsgs = msgs[activeId] || []

  return (
    <div style={s.root}>

      {/* ── LISTA DE CONVERSAS ── */}
      <div style={s.sidebar}>

        {/* Header */}
        <div style={s.sidebarHead}>
          <div style={s.sidebarTitle}>
            Conversas
            {convs.reduce((a,c)=>a+c.unread,0) > 0 && (
              <span style={s.totalBadge}>{convs.reduce((a,c)=>a+c.unread,0)}</span>
            )}
          </div>
          <div style={s.searchRow}>
            <input
              style={s.searchInput}
              placeholder="Buscar conversa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={s.filterRow}>
            {STATE_FILTERS.map(st => (
              <button
                key={st}
                style={{...s.filterBtn, ...(filterState===st ? s.filterBtnActive : {})}}
                onClick={() => setFilterState(st)}
              >
                {{
                  all:'Todas',
                  new:'Novas',
                  open:'Abertas',
                  ai_handling:'IA ativa',
                  human_handling:'Humanas',
                  waiting_customer:'Aguardando cliente',
                  closed:'Encerradas',
                }[st]}
              </button>
            ))}
          </div>
        </div>

        {/* Conv list */}
        <div style={s.convList}>
          {loading ? (
            <div style={s.emptyState}>
              <div style={s.spinner} />
              <span style={{color:'var(--txt3)',fontSize:13}}>Carregando...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={s.emptyState}>
              <InboxIconLucide size={32} strokeWidth={1.5} color="var(--txt4)" aria-hidden />
              <span style={{color:'var(--txt3)',fontSize:13}}>Nenhuma conversa</span>
            </div>
          ) : filtered.map(c => (
            <div
              key={c.id}
              style={{
                ...s.convItem,
                ...(activeId === c.id ? s.convItemActive : {}),
              }}
              onClick={() => {
                setActiveId(c.id)
                setSearchParams({ conv: c.id }, { replace: true })
              }}
            >
              {/* Avatar */}
                <div style={{...s.avatar, background: avatarColor(c.contact_name)}}>
                  {initials(c.contact_name)}
                  <div style={{
                    ...s.avatarStatus,
                    background: c.state === 'closed' ? '#10b981' : c.state === 'waiting_customer' ? '#f59e0b' : '#7c3aed',
                  }} />
                </div>

              {/* Info */}
              <div style={s.convInfo}>
                <div style={s.convTopRow}>
                  <span style={s.convName}>{c.contact_name}</span>
                  <span style={s.convTime}>{fmtTime(c.last_message_at)}</span>
                </div>
                <div style={s.convPreview}>{c.last_message || 'Sem mensagens'}</div>
                <div style={s.convMeta}>
                  <span style={{...s.chanTag, color: getChannelColor(c.channel_type), background: `${getChannelColor(c.channel_type)}18`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <ChannelGlyph type={c.channel_type} size={12} />
                    {c.channel_name}
                  </span>
                  <span style={{...s.priTag, color: PRI_COLORS[c.priority], background:`${PRI_COLORS[c.priority]}18`}}>
                    {PRI_LABELS[c.priority]}
                  </span>
                </div>
              </div>

              {/* Unread badge */}
              {c.unread > 0 && (
                <div style={s.unreadBadge}>{c.unread > 9 ? '9+' : c.unread}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── ÁREA DO CHAT ── */}
      {!ws ? (
        <div style={{...s.chatArea, ...s.emptyState}}>
          <InboxIconLucide size={40} strokeWidth={1.25} color="var(--txt4)" aria-hidden />
          <span style={{color:'var(--txt3)',fontSize:14}}>Selecione um workspace para visualizar as conversas</span>
        </div>
      ) : !activeConv ? (
        <div style={{...s.chatArea, ...s.emptyState}}>
          <InboxIconLucide size={40} strokeWidth={1.25} color="var(--txt4)" aria-hidden />
          <span style={{color:'var(--txt3)',fontSize:14}}>Selecione uma conversa</span>
        </div>
      ) : (
        <div style={s.chatArea}>

          {/* Chat header */}
          <div style={s.chatHeader}>
            <div style={{...s.avatar, background: avatarColor(activeConv.contact_name), width:34, height:34, fontSize:12}}>
              {initials(activeConv.contact_name)}
            </div>
            <div>
              <div style={{fontWeight:700, fontSize:14}}>{activeConv.contact_name}</div>
              <div style={{fontSize:11, color:'var(--txt3)', display:'flex', alignItems:'center', gap:6}}>
                <span style={{ color: getChannelColor(activeConv.channel_type), display: 'inline-flex', alignItems: 'center' }}>
                  <ChannelGlyph type={activeConv.channel_type} size={14} />
                </span>
                {activeConv.channel_name}
                {activeConv.contact_company && <> · {activeConv.contact_company}</>}
                <span style={{...s.priTag, color: PRI_COLORS[activeConv.priority], background:`${PRI_COLORS[activeConv.priority]}18`}}>
                  {PRI_LABELS[activeConv.priority]}
                </span>
              </div>
            </div>

            <div style={{marginLeft:'auto', display:'flex', gap:8}}>
              {can('perm_close') && activeConv.state !== 'closed' && (
                <button style={s.headerBtn} onClick={closeConv} title="Encerrar">✓ Encerrar</button>
              )}
              <button
                style={s.headerBtn}
                onClick={() => setShowPanel(p => !p)}
                title="Painel lateral"
              >
                ⊞
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={s.msgs}>
            {msgsLoading ? (
              <div style={{...s.emptyState, flex:1}}>
                <div style={s.spinner} />
              </div>
            ) : convMsgs.length === 0 ? (
              <div style={{...s.emptyState, flex:1}}>
                <MessageCircle size={28} strokeWidth={1.5} color="var(--txt4)" aria-hidden />
                <span style={{color:'var(--txt3)', fontSize:13}}>Nenhuma mensagem ainda</span>
              </div>
            ) : (
              convMsgs.map((m, i) => {
                const isOut = m.from === 'agent' || m.from === 'ai'
                return (
                  <div
                    key={m.id || i}
                    className="fade-in"
                    style={{...s.msgRow, ...(isOut ? s.msgRowOut : {})}}
                  >
                    {!isOut && (
                      <div style={{...s.msgAv, background: avatarColor(activeConv.contact_name)}}>
                        {initials(activeConv.contact_name)}
                      </div>
                    )}
                    <div>
                      {m.from === 'ai' && (
                        <div style={s.aiLabel}>✦ IA</div>
                      )}
                      <div style={{
                        ...s.bubble,
                        ...(isOut ? (m.from === 'ai' ? s.bubbleAi : s.bubbleOut) : s.bubbleIn),
                        opacity: m.temp ? 0.65 : 1,
                      }}>
                        {m.text}
                      </div>
                      <div style={{...s.msgTime, ...(isOut ? {textAlign:'right'} : {})}}>
                        {m.time}{m.temp && ' · enviando...'}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={msgsEndRef} />
          </div>

          {/* AI suggestion bar */}
          {can('perm_ai') && (aiSug || aiLoading) && (
            <div style={s.aiBar}>
              <span style={{fontSize:13, flexShrink:0}}>✦</span>
              <div style={{flex:1, fontSize:12, color:'var(--txt2)', lineHeight:1.5}}>
                {aiLoading ? (
                  <span style={{color:'var(--txt3)'}}>Gerando sugestão...</span>
                ) : aiSug}
              </div>
              {aiSug && !aiLoading && (
                <button
                  style={s.aiUseBtn}
                  onClick={() => { setInput(aiSug); inputRef.current?.focus() }}
                >
                  Usar ↵
                </button>
              )}
            </div>
          )}

          {/* Input */}
          <div style={s.inputRow}>
            <input
              ref={inputRef}
              style={{...s.inputField, ...(composerLocked || activeConv.state === 'closed' ? {opacity:.5} : {})}}
              placeholder={
                !can('perm_reply')       ? 'Sem permissão para responder' :
                composerLocked ? 'Instagram inbound é somente leitura' :
                activeConv.state === 'closed' ? 'Conversa encerrada' :
                'Digite uma mensagem...'
              }
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={!canWriteReply || sending}
              title={composerLocked ? 'Instagram inbound não permite envio direto pelo composer.' : ''}
            />
            <button
              style={{...s.sendBtn, opacity: sending || !input.trim() || !canWriteReply ? .5 : 1}}
              onClick={sendMessage}
              disabled={sending || !input.trim() || !canWriteReply}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── CONTACT PANEL ── */}
      {activeConv && showPanel && (
        <div style={s.panel}>

          {/* Avatar top */}
          <div style={s.panelTop}>
            <div style={{...s.avatar, background: avatarColor(activeConv.contact_name), width:46, height:46, fontSize:16, margin:'0 auto 10px'}}>
              {initials(activeConv.contact_name)}
            </div>
            <div style={{fontWeight:700, fontSize:14, textAlign:'center'}}>{activeConv.contact_name}</div>
            {activeConv.contact_company && (
              <div style={{fontSize:11, color:'var(--txt3)', textAlign:'center', marginTop:2}}>{activeConv.contact_company}</div>
            )}
            <div style={{display:'flex', gap:4, justifyContent:'center', marginTop:8, flexWrap:'wrap'}}>
              <span style={{...s.chanTag, color: getChannelColor(activeConv.channel_type), background:`${getChannelColor(activeConv.channel_type)}18`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ChannelGlyph type={activeConv.channel_type} size={12} />
                {activeConv.channel_name}
              </span>
              <span style={{...s.chanTag, color: activeConv.state === 'closed' ? '#10b981' : '#7c3aed', background: activeConv.state === 'closed' ? 'rgba(16,185,129,.1)' : 'rgba(124,58,237,.1)'}}>
                {STATE_LABELS[activeConv.state] || activeConv.state}
              </span>
            </div>
          </div>

          <div style={s.panelDivider} />

          {/* Info */}
          <div style={s.panelSection}>
            <div style={s.panelSectionTitle}>Informações</div>
            {[
              ['Telefone',   activeConv.contact_phone  || '—'],
              ['E-mail',     activeConv.contact_email  || '—'],
              ['Empresa',    activeConv.contact_company|| '—'],
              ['Prioridade', PRI_LABELS[activeConv.priority] || '—'],
              ['Estado',     STATE_LABELS[activeConv.state] || '—'],
            ].map(([k,v]) => (
              <div key={k} style={s.panelRow}>
                <span style={s.panelKey}>{k}</span>
                <span style={s.panelVal}>{v}</span>
              </div>
            ))}
          </div>

          <div style={s.panelDivider} />

          {/* Stats */}
          <div style={s.panelGrid}>
            {[
              { v: convMsgs.length,  l: 'Mensagens' },
              { v: '—',              l: 'CSAT'       },
              { v: '1',              l: 'Conversas'  },
              { v: '—',              l: 'Resp. IA'   },
            ].map(item => (
              <div key={item.l} style={s.panelStat}>
                <div style={{fontSize:18, fontWeight:800, letterSpacing:'-.02em'}}>{item.v}</div>
                <div style={{fontSize:9, color:'var(--txt3)', marginTop:2}}>{item.l}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          {can('perm_close') && activeConv.state !== 'closed' && (
            <button style={s.resolveBtn} onClick={closeConv}>
              ✓ Encerrar conversa
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ══ STYLES ═══════════════════════════════════════════ */
const s = {
  root: {
    display: 'flex', height: '100%', overflow: 'hidden',
    fontFamily: 'var(--font, DM Sans, sans-serif)',
    background: 'var(--bg-page, #0c0b14)',
    color: 'var(--txt1, #f5f3ff)',
  },

  /* Sidebar */
  sidebar: {
    width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column',
    background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)',
    backdropFilter: 'blur(16px)', WebKitBackdropFilter: 'blur(16px)',
    borderRight: '1px solid var(--border)', overflow: 'hidden',
  },
  sidebarHead: {
    padding: '14px 12px 8px',
    background: 'color-mix(in srgb, var(--bg-page) 70%, transparent)',
    backdropFilter: 'blur(16px)', WebKitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
  },
  sidebarTitle: {
    fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
  },
  totalBadge: {
    background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 800,
    borderRadius: 20, padding: '1px 7px', minWidth: 18, textAlign: 'center',
  },
  searchRow: { display: 'flex' },
  searchInput: {
    flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 8, padding: '7px 10px', color: 'var(--txt1, #f5f3ff)',
    fontSize: 12, outline: 'none', fontFamily: 'inherit',
  },
  filterRow: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  filterBtn: {
    fontSize: 10, fontWeight: 600, padding: '4px 9px', borderRadius: 20,
    border: '1px solid rgba(255,255,255,.07)', background: 'transparent',
    color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all .15s',
  },
  filterBtnActive: {
    background: 'rgba(124,58,237,.18)', borderColor: 'rgba(124,58,237,.4)',
    color: '#a78bfa',
  },
  convList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' },

  /* Conv item */
  convItem: {
    display: 'flex', gap: 9, padding: '10px 12px', cursor: 'pointer',
    borderBottom: '1px solid color-mix(in srgb, var(--border) 50%, transparent)',
    borderLeft: '2px solid transparent', transition: 'all .15s', alignItems: 'flex-start',
  },
  convItemActive: {
    background: 'rgba(124,58,237,.1)', borderLeftColor: '#7c3aed',
  },
  convInfo: { flex: 1, minWidth: 0 },
  convTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  convName: { fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 },
  convTime: { fontSize: 9.5, color: 'var(--txt3, #5a5272)', flexShrink: 0 },
  convPreview: { fontSize: 11, color: 'var(--txt3, #5a5272)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 },
  convMeta: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  chanTag: { fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8 },
  priTag:  { fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8 },
  unreadBadge: {
    background: '#7c3aed', color: '#fff', fontSize: 9, fontWeight: 800,
    borderRadius: '50%', width: 16, height: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },

  /* Avatar */
  avatar: {
    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff', position: 'relative',
  },
  avatarStatus: {
    position: 'absolute', bottom: 0, right: 0, width: 8, height: 8,
    borderRadius: '50%', border: '1.5px solid var(--bg-page, #0c0b14)',
  },

  /* Chat area */
  chatArea: {
    flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0,
  },
  chatHeader: {
    padding: '10px 16px',
    background: 'color-mix(in srgb, var(--bg-card) 88%, transparent)',
    backdropFilter: 'blur(16px)', WebKitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
  },
  headerBtn: {
    padding: '5px 12px', borderRadius: 7, background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.08)', color: 'var(--txt2, #a89fc4)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all .15s',
  },
  msgs: {
    flex: 1, padding: '14px 16px', overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  msgRow: { display: 'flex', gap: 6, alignItems: 'flex-end' },
  msgRowOut: { flexDirection: 'row-reverse' },
  msgAv: {
    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 8, fontWeight: 700, color: '#fff',
  },
  aiLabel: { fontSize: 8.5, fontWeight: 700, color: '#22d3ee', letterSpacing: '.08em', marginBottom: 3, textAlign: 'right' },
  bubble: { padding: '8px 12px', borderRadius: 13, fontSize: 13, lineHeight: 1.55, maxWidth: 340, wordBreak: 'break-word' },
  bubbleIn:  { background: 'rgba(255,255,255,.07)', color: 'var(--txt2, #a89fc4)', borderBottomLeftRadius: 3 },
  bubbleOut: { background: '#7c3aed', color: '#fff', borderBottomRightRadius: 3, boxShadow: '0 2px 10px rgba(124,58,237,.3)' },
  bubbleAi:  { background: 'linear-gradient(135deg,rgba(34,211,238,.1),rgba(124,58,237,.08))', border: '1px solid rgba(34,211,238,.2)', color: 'var(--txt1, #f5f3ff)', borderBottomRightRadius: 3 },
  msgTime: { fontSize: 9.5, color: 'var(--txt4, #352f50)', marginTop: 2 },

  /* AI bar */
  aiBar: {
    margin: '0 12px 8px', padding: '8px 11px', borderRadius: 9,
    border: '1px solid rgba(124,58,237,.25)',
    background: 'linear-gradient(135deg,rgba(124,58,237,.08),rgba(34,211,238,.04))',
    display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0,
  },
  aiUseBtn: {
    fontSize: 10, color: '#7c3aed', background: 'rgba(124,58,237,.14)',
    border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
    fontFamily: 'inherit', fontWeight: 600, flexShrink: 0, transition: 'all .15s',
  },

  /* Input */
  inputRow: {
    display: 'flex', gap: 8, padding: '10px 12px', flexShrink: 0,
    borderTop: '1px solid var(--border)',
    background: 'color-mix(in srgb, var(--bg-card) 90%, transparent)',
    backdropFilter: 'blur(12px)', WebKitBackdropFilter: 'blur(12px)',
  },
  inputField: {
    flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 9, padding: '9px 12px', color: 'var(--txt1, #f5f3ff)',
    fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'border-color .2s',
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 9, background: '#7c3aed', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all .18s',
  },

  /* Contact panel */
  panel: {
    width: 210, flexShrink: 0,
    background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)',
    backdropFilter: 'blur(16px)', WebKitBackdropFilter: 'blur(16px)',
    borderLeft: '1px solid var(--border)',
    overflowY: 'auto', display: 'flex', flexDirection: 'column',
  },
  panelTop: { padding: '16px 12px 10px' },
  panelDivider: { height: 1, background: 'rgba(255,255,255,.05)' },
  panelSection: { padding: '10px 12px' },
  panelSectionTitle: { fontSize: 9, fontWeight: 700, color: 'var(--txt3, #5a5272)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 },
  panelRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  panelKey: { fontSize: 10.5, color: 'var(--txt3, #5a5272)' },
  panelVal: { fontSize: 10.5, fontWeight: 500, maxWidth: 110, textAlign: 'right', wordBreak: 'break-word' },
  panelGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, padding: '10px 12px' },
  panelStat: {
    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.05)',
    borderRadius: 8, padding: '7px', textAlign: 'center',
  },
  resolveBtn: {
    margin: '8px 12px 12px', padding: '8px', width: 'calc(100% - 24px)',
    borderRadius: 8, background: '#10b981', border: 'none', color: '#fff',
    fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer',
    transition: 'all .18s',
  },

  /* Utils */
  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
  },
  spinner: {
    width: 22, height: 22, borderRadius: '50%',
    border: '2px solid rgba(124,58,237,.2)', borderTopColor: '#7c3aed',
    animation: 'spin 0.8s linear infinite',
  },
}
