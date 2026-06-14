import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { apiFetch, apiJson } from '../lib/api'
import { AlertCircle, Check, CheckCheck, Loader2, MessageCircle, Inbox as InboxIconLucide, Star } from 'lucide-react'
import {
  REALTIME_EVENTS,
  envelopeFromPostgresChange,
  shouldHandleRealtimeEnvelope,
} from '../lib/realtimeEvents'
import {
  getChannelColor,
  getChannelDisplayName,
  getChannelIcon,
  canComposeOnChannel,
  normalizeChannelType,
} from '../lib/channels'

const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const fmtTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const PRI_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }
const PRI_LABELS = { high: 'Alta', medium: 'Media', low: 'Baixa' }
const STATE_LABELS = {
  new: 'Novo',
  open: 'Aberto',
  ai_handling: 'IA ativa',
  human_handling: 'Atendimento humano',
  waiting_customer: 'Aguardando cliente',
  closed: 'Encerrado',
}
const STATE_FILTERS = ['all', 'new', 'open', 'ai_handling', 'human_handling', 'waiting_customer', 'closed']
const ROUTING_QUEUE_LABELS = {
  suporte: 'Fila suporte',
  comercial: 'Fila comercial',
  financeiro: 'Fila financeiro',
  triagem: 'Fila triagem',
}
const ROUTING_INTENT_LABELS = {
  suporte: 'Intencao suporte',
  comercial: 'Intencao comercial',
  financeiro: 'Intencao financeiro',
  duvida_geral: 'Intencao geral',
  spam: 'Intencao spam',
}
const TRIAGE_LABELS = {
  suporte: 'Suporte',
  vendas: 'Vendas',
  cobranca: 'Cobranca',
  urgente: 'Urgente',
  spam: 'Spam',
  recorrente: 'Recorrente',
  outros: 'Outros',
}
const SENTIMENT_LABELS = {
  normal: 'Normal',
  frustrated: 'Frustrado',
  angry: 'Irritado',
  urgent: 'Urgente',
}
const SENTIMENT_COLORS = {
  frustrated: '#f59e0b',
  angry: '#ef4444',
  urgent: '#f97316',
}
const ESCALATION_REASON_LABELS = {
  none: 'Sem escalonamento',
  sensitive: 'Sensivel',
  unresolved: 'Nao resolvida',
  high_value: 'Alto valor',
  out_of_hours: 'Fora do horario',
  other: 'Outro',
}

const normalizeConversationState = (state, status) => {
  const candidate = String(state || status || 'new').trim().toLowerCase()
  if (['new', 'open', 'ai_handling', 'human_handling', 'waiting_customer', 'closed'].includes(candidate)) return candidate
  if (candidate === 'resolved') return 'closed'
  if (candidate === 'waiting') return 'waiting_customer'
  if (candidate === 'bot') return 'ai_handling'
  return 'new'
}

const normalizeRoutingQueue = (value) => {
  const key = String(value || '').trim().toLowerCase()
  return ROUTING_QUEUE_LABELS[key] ? key : 'triagem'
}

const normalizeRoutingIntent = (value) => {
  const key = String(value || '').trim().toLowerCase()
  return ROUTING_INTENT_LABELS[key] ? key : 'duvida_geral'
}

const normalizeTriageTag = (value) => {
  const key = String(value || '').trim().toLowerCase()
  return TRIAGE_LABELS[key] ? key : 'outros'
}

const normalizeSentiment = (value) => {
  const key = String(value || '').trim().toLowerCase()
  return SENTIMENT_LABELS[key] ? key : 'normal'
}

const normalizeAiState = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value
}

const isCopilotPaused = (value) => {
  const aiState = normalizeAiState(value)
  const copilot = normalizeAiState(aiState.copilot)
  if (copilot.paused === true) return true
  return String(copilot.mode || '').toLowerCase() === 'paused'
}

const initials = (name) => (name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

const avatarColor = (str) => {
  const colors = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#f97316', '#ec4899', '#8b5cf6']
  let h = 0
  for (const c of str || '') h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

function ChannelGlyph({ type, size = 14 }) {
  const Cmp = getChannelIcon(type) || InboxIconLucide
  return <Cmp size={size} strokeWidth={2} aria-hidden />
}

export default function Inbox() {
  const { user, ws, workspaceReady, loading: authLoading } = useAuth()
  const { can, convScope, canViewRoutingReason, canViewHandoffHistory, canManageHandoff } = usePermissions()
  const { conversationId: routeConversationId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const [convs, setConvs] = useState([])
  const [msgs, setMsgs] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msgsLoading, setMsgsLoading] = useState(false)
  const [input, setInput] = useState('')
  const [internalNote, setInternalNote] = useState(false)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [filterState, setFilterState] = useState('all')
  const [aiSug, setAiSug] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiReason, setAiReason] = useState('')
  const [nextAction, setNextAction] = useState(null)
  const [nextActionLoading, setNextActionLoading] = useState(false)
  const [nextActionDismissed, setNextActionDismissed] = useState({})
  const [routingLoading, setRoutingLoading] = useState(false)
  const [routingError, setRoutingError] = useState('')
  const [routingPreview, setRoutingPreview] = useState(null)
  const [triageSaving, setTriageSaving] = useState(false)
  const [handoffLoading, setHandoffLoading] = useState(false)
  const [handoffError, setHandoffError] = useState('')
  const [historyLoading, setHistoryLoading] = useState(false)
  const [handoffHistory, setHandoffHistory] = useState([])
  const [presenceMembers, setPresenceMembers] = useState([])
  const [escalationReason, setEscalationReason] = useState('sensitive')
  const [escalationNote, setEscalationNote] = useState('')
  const [showPanel, setShowPanel] = useState(true)

  const msgsEndRef = useRef(null)
  const inputRef = useRef(null)
  const realtimeSub = useRef(null)

  const activeConv = convs.find((c) => c.id === activeId)
  const filtered = convs.filter((c) => {
    const matchSearch =
      !search ||
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.last_message?.toLowerCase().includes(search.toLowerCase())
    const matchState = filterState === 'all' || c.state === filterState
    return matchSearch && matchState
  })
  const composerLocked = activeConv?.channel_type === 'instagram' || !canComposeOnChannel(activeConv?.channel_type)
  const canWriteReply = can('perm_reply') && !composerLocked && activeConv?.state !== 'closed'
  const canManageRouting = canViewRoutingReason
  const routingView = routingPreview && routingPreview.conversationId === activeId ? routingPreview : null
  const queueToShow = routingView?.queue || activeConv?.routing_queue || 'triagem'
  const intentToShow = routingView?.intent || activeConv?.routing_intent || 'duvida_geral'
  const routingReasonToShow = canViewRoutingReason
    ? (routingView?.reasoning || activeConv?.routing_reason || '')
    : ''
  const activeAiState = normalizeAiState(activeConv?.ai_state)
  const copilotPaused = isCopilotPaused(activeAiState)
  const handoffMode = String(activeAiState?.handoff?.mode || '').toLowerCase() || (activeConv?.state === 'ai_handling' ? 'ai' : 'human')
  const escalationReasonToShow = String(activeConv?.escalation_reason || 'none').toLowerCase()
  const canTriggerHandoff = canManageHandoff && activeConv?.state !== 'closed'
  const activeAssignee = presenceMembers.find((member) => member.user_id === activeConv?.assigned_to || member.id === activeConv?.assigned_to) || null
  const onlineAgents = presenceMembers.filter((member) => member.is_online).length
  const nextActionVisible = nextAction && nextAction.conversationId === activeId && !nextActionDismissed[activeId]

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
          last_message, last_message_at, created_at, assigned_to,
          routing_queue, routing_intent, routing_confidence, routing_reason, routing_source,
          triage_tag, sentiment, sentiment_confidence,
          ai_state, escalated_at, escalated_by, escalation_reason, escalation_note,
          contacts ( id, name, phone, company, email, is_vip ),
          channels  ( id, type, name )
        `)
        .eq('workspace_id', ws.id)
        .order('last_message_at', { ascending: false })
        .limit(60)

      const scope = convScope()
      if (scope === 'own') query = query.eq('assigned_to', user.id)

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

  const loadMsgs = useCallback(async (convId) => {
    if (!convId || !ws?.id || msgs[convId]) return
    setMsgsLoading(true)
    try {
      const payload = await apiJson(`/workspaces/${ws.id}/conversations/${convId}/messages`)
      const data = payload?.messages || []
      const error = null

      if (error) throw error
      setMsgs((prev) => ({ ...prev, [convId]: (data || []).map(mapMsg) }))
    } catch (e) {
      console.error('Erro ao carregar mensagens:', e)
    } finally {
      setMsgsLoading(false)
    }
  }, [msgs, ws?.id])

  const loadPresence = useCallback(async () => {
    if (authLoading || !workspaceReady || !ws?.id) {
      setPresenceMembers([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('id, user_id, display_name, role, is_online')
        .eq('workspace_id', ws.id)

      if (!error && (data || []).length) {
        setPresenceMembers((data || []).map((member) => ({
          id: member.id,
          user_id: member.user_id,
          name: member.display_name || 'Agente',
          role: member.role || 'agent',
          is_online: Boolean(member.is_online),
        })))
        return
      }

      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, role, is_online')
        .eq('company_id', ws.id)

      setPresenceMembers((usersData || []).map((member) => ({
        id: member.id,
        user_id: member.id,
        name: member.name || 'Agente',
        role: member.role || 'agent',
        is_online: Boolean(member.is_online),
      })))
    } catch {
      setPresenceMembers([])
    }
  }, [ws?.id, workspaceReady, authLoading])

  useEffect(() => {
    if (!user || !ws?.id) return

    const handleEnvelope = (payload, events, handler) => {
      const envelope = envelopeFromPostgresChange(payload, { workspaceId: ws.id })
      if (!shouldHandleRealtimeEnvelope(envelope, ws.id, events)) return
      handler(envelope.payload.new, envelope)
    }

    realtimeSub.current = supabase
      .channel('inbox-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `workspace_id=eq.${ws.id}` }, (payload) => {
        const m = payload.new || {}
        if (!m?.id || m.workspace_id !== ws.id) return

        if (payload.eventType === 'UPDATE') {
          setMsgs((prev) => {
            if (!prev[m.conversation_id]) return prev
            return {
              ...prev,
              [m.conversation_id]: prev[m.conversation_id].map((item) => (
                item.id === m.id ? {
                  ...item,
                  status: m.status || item.status,
                  transcription: m.transcription ?? item.transcription,
                  transcriptionSummary: m.transcription_summary ?? item.transcriptionSummary,
                  transcriptionStatus: m.transcription_status ?? item.transcriptionStatus,
                } : item
              )),
            }
          })
          return
        }

        if (payload.eventType !== 'INSERT') return
        const mapped = mapMsg(m)

        setMsgs((prev) => {
          if (!prev[m.conversation_id]) return prev
          const exists = prev[m.conversation_id].some((x) => x.id === m.id)
          if (exists) return prev
          return { ...prev, [m.conversation_id]: [...prev[m.conversation_id], mapped] }
        })

        if (!mapped.internalNote) {
          setConvs((prev) => prev.map((c) => (
            c.id === m.conversation_id
              ? {
                  ...c,
                  last_message: m.content,
                  last_message_at: m.created_at,
                  unread: mapped.from === 'client' && c.id !== activeId ? (c.unread || 0) + 1 : c.unread,
                }
              : c
          )))
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, (payload) => {
        handleEnvelope(payload, [
          REALTIME_EVENTS.CONVERSATION_UPDATED,
          REALTIME_EVENTS.ASSIGNMENT_UPDATED,
          REALTIME_EVENTS.KANBAN_UPDATED,
        ], (row) => {
          setConvs((prev) => prev.map((c) => (
            c.id === row.id ? { ...c, ...mapConvPartial(row) } : c
          )))
        })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, (payload) => {
        handleEnvelope(payload, [REALTIME_EVENTS.CONVERSATION_CREATED], () => loadConvs())
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members' }, (payload) => {
        handleEnvelope(payload, [REALTIME_EVENTS.PRESENCE_UPDATED], () => loadPresence())
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_users' }, (payload) => {
        handleEnvelope(payload, [REALTIME_EVENTS.PRESENCE_UPDATED], () => loadPresence())
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        handleEnvelope(payload, [REALTIME_EVENTS.PRESENCE_UPDATED], () => loadPresence())
      })
      .subscribe()

    return () => {
      supabase.removeChannel(realtimeSub.current)
    }
  }, [user, ws?.id, activeId, loadConvs, loadPresence, canViewRoutingReason])

  useEffect(() => { loadConvs() }, [loadConvs])
  useEffect(() => { loadPresence() }, [loadPresence])

  useEffect(() => {
    if (loading) return
    const cid = routeConversationId || searchParams.get('conv')
    if (!cid || !convs.length) return
    const found = convs.find((c) => String(c.id) === String(cid))
    if (found) setActiveId((cur) => (cur === found.id ? cur : found.id))
  }, [loading, convs, searchParams])

  useEffect(() => {
    if (!activeId) return
    loadMsgs(activeId)
    markAsRead(activeId)
    setAiSug('')
    setAiReason('')
    setNextAction(null)
    setRoutingError('')
    setRoutingPreview(null)
    setHandoffError('')
    setHandoffHistory([])
    setEscalationReason('sensitive')
    setEscalationNote('')
    setInternalNote(false)
    loadHandoffHistory(activeId)
    loadNextAction(activeId)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [activeId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, activeId])

  const markAsRead = async (convId) => {
    setConvs((prev) => prev.map((c) => (c.id === convId ? { ...c, unread: 0 } : c)))
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeId || sending || !canWriteReply) return
    const text = input.trim()
    const noteMode = internalNote
    setInput('')
    setInternalNote(false)
    setSending(true)

    const tempMsg = { id: `temp-${Date.now()}`, from: 'agent', text, time: now(), temp: true, internalNote: noteMode }
    setMsgs((prev) => ({ ...prev, [activeId]: [...(prev[activeId] || []), tempMsg] }))

    try {
      const response = await apiFetch(`/workspaces/${ws?.id}/conversations/${activeId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text, is_internal_note: noteMode }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || 'Nao foi possivel enviar a mensagem.')

      const saved = payload?.message
      const conversation = payload?.conversation
      setMsgs((prev) => ({
        ...prev,
        [activeId]: (prev[activeId] || []).map((m) => (m.id === tempMsg.id ? (saved ? mapMsg(saved) : m) : m)),
      }))
      if (conversation && !noteMode) {
        setConvs((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...mapConvPartial(conversation) } : c)))
      }
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e)
      setMsgs((prev) => ({ ...prev, [activeId]: (prev[activeId] || []).filter((m) => m.id !== tempMsg.id) }))
      setInput(text)
      setInternalNote(noteMode)
    } finally {
      setSending(false)
    }
  }

  const generateAiSuggestion = async (convId) => {
    if (!convId || !ws?.id || !can('perm_ai')) return
    setAiSug('')
    setAiReason('')
    setAiLoading(true)
    try {
      const payload = await apiJson(`/workspaces/${ws.id}/ai-assist/conversations/${convId}/suggest-reply`, { method: 'POST' })
      if (!payload?.available) {
        setAiReason(payload?.reason || 'Sugestao indisponivel para esta conversa.')
        return
      }
      setAiSug(payload?.suggestion || '')
      setAiReason(payload?.reason || '')
    } catch (error) {
      setAiSug('')
      setAiReason(error.message || 'Nao foi possivel gerar a sugestao.')
    } finally {
      setAiLoading(false)
    }
  }

  const loadNextAction = async (convId) => {
    if (!convId || !ws?.id || !can('perm_ai') || nextActionDismissed[convId]) {
      setNextAction(null)
      return
    }

    setNextActionLoading(true)
    try {
      const payload = await apiJson(`/workspaces/${ws.id}/ai-assist/conversations/${convId}/next-action`, { method: 'POST' })
      if (!payload?.available || !payload?.action) {
        setNextAction(null)
        return
      }
      setNextAction({ conversationId: convId, ...payload })
    } catch (error) {
      setNextAction(null)
    } finally {
      setNextActionLoading(false)
    }
  }

  const dismissNextAction = () => {
    if (!activeId) return
    setNextActionDismissed((prev) => ({ ...prev, [activeId]: true }))
    setNextAction(null)
  }

  const handleNextAction = async () => {
    if (!nextActionVisible) return
    if (nextAction.action === 'use_suggestion') {
      await generateAiSuggestion(activeId)
      return
    }
    if (nextAction.action === 'follow_up') {
      setInternalNote(true)
      setInput('Follow-up: ')
      inputRef.current?.focus()
      return
    }
    if (nextAction.action === 'assign') {
      setShowPanel(true)
      await suggestRouting()
      return
    }
    dismissNextAction()
  }

  const updateTriageTag = async (triageTag) => {
    if (!activeId || !ws?.id || !canManageRouting) return
    setTriageSaving(true)
    try {
      const payload = await apiJson(`/workspaces/${ws.id}/ai-assist/conversations/${activeId}/triage`, {
        method: 'PATCH',
        body: JSON.stringify({ triageTag }),
      })
      if (payload?.conversation) {
        setConvs((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...mapConvPartial(payload.conversation) } : c)))
      }
    } catch (error) {
      console.error('Erro ao atualizar triagem:', error)
    } finally {
      setTriageSaving(false)
    }
  }

  const suggestRouting = async () => {
    if (!activeId || !ws?.id) return
    setRoutingLoading(true)
    setRoutingError('')
    try {
      const payload = await apiJson(`/workspaces/${ws.id}/routing/conversations/${activeId}/recommend`, { method: 'POST' })
      setRoutingPreview({
        conversationId: activeId,
        queue: normalizeRoutingQueue(payload?.queue),
        intent: normalizeRoutingIntent(payload?.intent),
        source: payload?.source || 'fallback',
        confidence: Number(payload?.confidence || 0),
        reasoning: canViewRoutingReason ? (payload?.reasoning || '') : '',
      })
    } catch (error) {
      setRoutingError(error.message || 'Nao foi possivel sugerir fila.')
    } finally {
      setRoutingLoading(false)
    }
  }

  const applyRouting = async () => {
    if (!activeId || !ws?.id || !canManageRouting) return
    setRoutingLoading(true)
    setRoutingError('')
    try {
      const payload = await apiJson(`/workspaces/${ws.id}/routing/conversations/${activeId}/apply`, { method: 'POST' })
      if (payload?.conversation) {
        setConvs((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...mapConvPartial(payload.conversation) } : c)))
      }
      setRoutingPreview(null)
    } catch (error) {
      setRoutingError(error.message || 'Nao foi possivel aplicar fila.')
    } finally {
      setRoutingLoading(false)
    }
  }

  const loadHandoffHistory = async (convId) => {
    if (!convId || !ws?.id || !canViewHandoffHistory) {
      setHandoffHistory([])
      return
    }
    setHistoryLoading(true)
    setHandoffError('')
    try {
      const payload = await apiJson(`/workspaces/${ws.id}/conversations/${convId}/handoff-history`)
      setHandoffHistory(Array.isArray(payload?.events) ? payload.events : [])
    } catch (error) {
      setHandoffError(error.message || 'Nao foi possivel carregar historico de handoff.')
      setHandoffHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const takeoverConversation = async () => {
    if (!activeId || !ws?.id || !canTriggerHandoff) return
    setHandoffLoading(true)
    setHandoffError('')
    try {
      const payload = await apiJson(`/workspaces/${ws.id}/conversations/${activeId}/handoff/takeover`, { method: 'POST' })
      if (payload?.conversation) {
        setConvs((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...mapConvPartial(payload.conversation) } : c)))
      }
      await loadHandoffHistory(activeId)
    } catch (error) {
      setHandoffError(error.message || 'Nao foi possivel assumir a conversa.')
    } finally {
      setHandoffLoading(false)
    }
  }

  const reactivateCopilot = async () => {
    if (!activeId || !ws?.id || !canTriggerHandoff) return
    setHandoffLoading(true)
    setHandoffError('')
    try {
      const payload = await apiJson(`/workspaces/${ws.id}/conversations/${activeId}/copilot/reactivate`, { method: 'POST' })
      if (payload?.conversation) {
        setConvs((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...mapConvPartial(payload.conversation) } : c)))
      }
      await loadHandoffHistory(activeId)
    } catch (error) {
      setHandoffError(error.message || 'Nao foi possivel reativar o copilot.')
    } finally {
      setHandoffLoading(false)
    }
  }

  const escalateConversation = async () => {
    if (!activeId || !ws?.id || !canTriggerHandoff) return
    setHandoffLoading(true)
    setHandoffError('')
    try {
      const payload = await apiJson(`/workspaces/${ws.id}/conversations/${activeId}/escalate`, {
        method: 'POST',
        body: JSON.stringify({
          reason: escalationReason,
          note: escalationNote,
        }),
      })
      if (payload?.conversation) {
        setConvs((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...mapConvPartial(payload.conversation) } : c)))
      }
      setEscalationNote('')
      await loadHandoffHistory(activeId)
    } catch (error) {
      setHandoffError(error.message || 'Nao foi possivel escalonar a conversa.')
    } finally {
      setHandoffLoading(false)
    }
  }

  const closeConv = async () => {
    if (!activeId || !can('perm_close')) return
    try {
      const response = await apiFetch(`/workspaces/${ws?.id}/conversations/${activeId}/close`, { method: 'POST' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || 'Nao foi possivel encerrar a conversa.')
      if (payload?.conversation) {
        setConvs((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...mapConvPartial(payload.conversation) } : c)))
      }
    } catch (error) {
      console.error('Erro ao encerrar conversa:', error)
    }
  }

  const mapConv = (c) => {
    const channelType = normalizeChannelType(c.channels?.type)
    return {
      id: c.id,
      state: normalizeConversationState(c.state, c.status),
      status: c.status || c.state || 'new',
      priority: c.priority || 'medium',
      unread: c.unread_count || 0,
      last_message: c.last_message || '',
      last_message_at: c.last_message_at,
      assigned_to: c.assigned_to,
      routing_queue: normalizeRoutingQueue(c.routing_queue),
      routing_intent: normalizeRoutingIntent(c.routing_intent),
      routing_confidence: Number(c.routing_confidence || 0.6),
      routing_reason: canViewRoutingReason ? (c.routing_reason || '') : '',
      routing_source: c.routing_source || 'fallback',
      triage_tag: normalizeTriageTag(c.triage_tag),
      sentiment: normalizeSentiment(c.sentiment),
      sentiment_confidence: Number(c.sentiment_confidence || 0),
      ai_state: normalizeAiState(c.ai_state),
      escalated_at: c.escalated_at || null,
      escalated_by: c.escalated_by || null,
      escalation_reason: String(c.escalation_reason || 'none').toLowerCase(),
      escalation_note: c.escalation_note || '',
      contact_id: c.contacts?.id,
      contact_name: c.contacts?.name || c.contacts?.phone || 'Desconhecido',
      contact_phone: c.contacts?.phone,
      contact_company: c.contacts?.company || '',
      contact_email: c.contacts?.email || '',
      contact_is_vip: c.contacts?.is_vip === true,
      channel_id: c.channels?.id,
      channel_type: channelType,
      channel_name: getChannelDisplayName(channelType, c.channels?.name),
    }
  }

  const mapConvPartial = (c) => ({
    state: normalizeConversationState(c.state, c.status),
    status: c.status || c.state || 'new',
    priority: c.priority || 'medium',
    unread: c.unread_count || 0,
    last_message: c.last_message,
    last_message_at: c.last_message_at,
    assigned_to: c.assigned_to,
    routing_queue: normalizeRoutingQueue(c.routing_queue),
    routing_intent: normalizeRoutingIntent(c.routing_intent),
    routing_confidence: Number(c.routing_confidence || 0.6),
    routing_reason: canViewRoutingReason ? (c.routing_reason || '') : '',
    routing_source: c.routing_source || 'fallback',
    triage_tag: normalizeTriageTag(c.triage_tag),
    sentiment: normalizeSentiment(c.sentiment),
    sentiment_confidence: Number(c.sentiment_confidence || 0),
    ai_state: normalizeAiState(c.ai_state),
    escalated_at: c.escalated_at || null,
    escalated_by: c.escalated_by || null,
    escalation_reason: String(c.escalation_reason || 'none').toLowerCase(),
    escalation_note: c.escalation_note || '',
  })

  const mapMsg = (m) => ({
    id: m.id,
    from: ['client', 'contact'].includes(m.sender_type) ? 'client' : ['bot', 'ai'].includes(m.sender_type) ? 'ai' : 'agent',
    text: m.content,
    type: m.type || 'text',
    mediaUrl: m.media_url || m.metadata?.media_url || m.metadata?.mediaUrl || null,
    status: m.status || 'sent',
    transcription: m.transcription || '',
    transcriptionSummary: m.transcription_summary || '',
    transcriptionStatus: m.transcription_status || null,
    time: fmtTime(m.created_at),
    internalNote: m.is_internal_note === true,
    temp: false,
  })

  const convMsgs = msgs[activeId] || []

  return (
    <div style={s.root}>
      <div style={s.sidebar}>
        <div style={s.sidebarHead}>
          <div style={s.sidebarTitle}>
            Conversas
            {convs.reduce((a, c) => a + c.unread, 0) > 0 && (
              <span style={s.totalBadge}>{convs.reduce((a, c) => a + c.unread, 0)}</span>
            )}
          </div>
          <div style={s.searchRow}>
            <input
              style={s.searchInput}
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={s.filterRow}>
            {STATE_FILTERS.map((st) => (
              <button
                key={st}
                style={{ ...s.filterBtn, ...(filterState === st ? s.filterBtnActive : {}) }}
                onClick={() => setFilterState(st)}
              >
                {{
                  all: 'Todas',
                  new: 'Novas',
                  open: 'Abertas',
                  ai_handling: 'IA ativa',
                  human_handling: 'Humanas',
                  waiting_customer: 'Aguardando',
                  closed: 'Encerradas',
                }[st]}
              </button>
            ))}
          </div>
        </div>

        <div style={s.convList}>
          {loading ? (
            <div style={s.emptyState}>
              <div style={s.spinner} />
              <span style={{ color: 'var(--txt3)', fontSize: 13 }}>Carregando...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={s.emptyState}>
              <InboxIconLucide size={32} strokeWidth={1.5} color="var(--txt4)" aria-hidden />
              <span style={{ color: 'var(--txt3)', fontSize: 13 }}>Nenhuma conversa</span>
            </div>
          ) : filtered.map((c) => (
            <div
              key={c.id}
              style={{ ...s.convItem, ...(activeId === c.id ? s.convItemActive : {}) }}
              onClick={() => {
                setActiveId(c.id)
                setSearchParams({ conv: c.id }, { replace: true })
              }}
            >
              <div style={{ ...s.avatar, background: avatarColor(c.contact_name) }}>
                {initials(c.contact_name)}
                <div
                  style={{
                    ...s.avatarStatus,
                    background: c.state === 'closed' ? '#10b981' : c.state === 'waiting_customer' ? '#f59e0b' : '#7c3aed',
                  }}
                />
              </div>

              <div style={s.convInfo}>
                <div style={s.convTopRow}>
                  <span style={s.convName}>
                    {c.contact_is_vip ? <Star size={12} fill="var(--warning)" color="var(--warning)" aria-label="Cliente VIP" style={{ flexShrink: 0 }} /> : null}
                    {c.contact_name}
                  </span>
                  <span style={s.convTime}>{fmtTime(c.last_message_at)}</span>
                </div>
                <div style={s.convPreview}>{c.last_message || 'Sem mensagens'}</div>
                <div style={s.convMeta}>
                  <span style={{ ...s.chanTag, color: getChannelColor(c.channel_type), background: `${getChannelColor(c.channel_type)}18`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <ChannelGlyph type={c.channel_type} size={12} />
                    {c.channel_name}
                  </span>
                  <span style={{ ...s.priTag, color: PRI_COLORS[c.priority], background: `${PRI_COLORS[c.priority]}18` }}>
                    {PRI_LABELS[c.priority]}
                  </span>
                  <span style={{ ...s.queueTag, color: '#38bdf8', background: 'rgba(56,189,248,.16)' }}>
                    {ROUTING_QUEUE_LABELS[c.routing_queue]}
                  </span>
                  <span style={{ ...s.queueTag, color: '#a78bfa', background: 'rgba(167,139,250,.16)' }}>
                    {TRIAGE_LABELS[c.triage_tag]}
                  </span>
                  {c.sentiment !== 'normal' ? (
                    <span style={{ ...s.queueTag, color: SENTIMENT_COLORS[c.sentiment] || '#f59e0b', background: `${SENTIMENT_COLORS[c.sentiment] || '#f59e0b'}18` }}>
                      {SENTIMENT_LABELS[c.sentiment]}
                    </span>
                  ) : null}
                  {c.escalation_reason && c.escalation_reason !== 'none' ? (
                    <span style={{ ...s.queueTag, color: '#fca5a5', background: 'rgba(248,113,113,.18)' }}>
                      Escalonada
                    </span>
                  ) : null}
                </div>
              </div>

              {c.unread > 0 && <div style={s.unreadBadge}>{c.unread > 9 ? '9+' : c.unread}</div>}
            </div>
          ))}
        </div>
      </div>

      {!ws ? (
        <div style={{ ...s.chatArea, ...s.emptyState }}>
          <InboxIconLucide size={40} strokeWidth={1.25} color="var(--txt4)" aria-hidden />
          <span style={{ color: 'var(--txt3)', fontSize: 14 }}>Selecione um workspace para visualizar as conversas</span>
        </div>
      ) : !activeConv ? (
        <div style={{ ...s.chatArea, ...s.emptyState }}>
          <InboxIconLucide size={40} strokeWidth={1.25} color="var(--txt4)" aria-hidden />
          <span style={{ color: 'var(--txt3)', fontSize: 14 }}>Selecione uma conversa</span>
        </div>
      ) : (
        <div style={s.chatArea}>
          <div style={s.chatHeader}>
            <div style={{ ...s.avatar, background: avatarColor(activeConv.contact_name), width: 34, height: 34, fontSize: 12 }}>
              {initials(activeConv.contact_name)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{activeConv.contact_name}</div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ color: getChannelColor(activeConv.channel_type), display: 'inline-flex', alignItems: 'center' }}>
                  <ChannelGlyph type={activeConv.channel_type} size={14} />
                </span>
                {activeConv.channel_name}
                {activeConv.contact_company && <span>- {activeConv.contact_company}</span>}
                <span style={{ ...s.priTag, color: PRI_COLORS[activeConv.priority], background: `${PRI_COLORS[activeConv.priority]}18` }}>
                  {PRI_LABELS[activeConv.priority]}
                </span>
                <span style={{ ...s.queueTag, color: '#38bdf8', background: 'rgba(56,189,248,.16)' }}>
                  {ROUTING_QUEUE_LABELS[queueToShow]}
                </span>
                <span style={{ ...s.queueTag, color: '#fbbf24', background: 'rgba(251,191,36,.16)' }}>
                  {ROUTING_INTENT_LABELS[intentToShow]}
                </span>
                <span style={{ ...s.queueTag, color: '#a78bfa', background: 'rgba(167,139,250,.16)' }}>
                  {TRIAGE_LABELS[activeConv.triage_tag]}
                </span>
                {activeConv.sentiment !== 'normal' ? (
                  <span style={{ ...s.queueTag, color: SENTIMENT_COLORS[activeConv.sentiment] || '#f59e0b', background: `${SENTIMENT_COLORS[activeConv.sentiment] || '#f59e0b'}18` }}>
                    {SENTIMENT_LABELS[activeConv.sentiment]}
                  </span>
                ) : null}
              </div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {can('perm_close') && activeConv.state !== 'closed' && (
                <button style={s.headerBtn} onClick={closeConv} title="Encerrar">Encerrar</button>
              )}
              <button style={s.headerBtn} onClick={() => setShowPanel((p) => !p)} title="Painel lateral">
                Painel
              </button>
            </div>
          </div>

          <div style={s.msgs}>
            {msgsLoading ? (
              <div style={{ ...s.emptyState, flex: 1 }}>
                <div style={s.spinner} />
              </div>
            ) : convMsgs.length === 0 ? (
              <div style={{ ...s.emptyState, flex: 1 }}>
                <MessageCircle size={28} strokeWidth={1.5} color="var(--txt4)" aria-hidden />
                <span style={{ color: 'var(--txt3)', fontSize: 13 }}>Nenhuma mensagem ainda</span>
              </div>
            ) : (
              convMsgs.map((m, i) => {
                const isOut = m.internalNote || m.from === 'agent' || m.from === 'ai'
                return (
                  <div key={m.id || i} className="fade-in" style={{ ...s.msgRow, ...(isOut ? s.msgRowOut : {}) }}>
                    {!isOut && (
                      <div style={{ ...s.msgAv, background: avatarColor(activeConv.contact_name) }}>
                        {initials(activeConv.contact_name)}
                      </div>
                    )}
                    <div>
                      {m.internalNote && <div style={s.internalNoteLabel}>Nota interna</div>}
                      {m.from === 'ai' && <div style={s.aiLabel}>IA</div>}
                      <div
                        style={{
                          ...s.bubble,
                          ...(m.internalNote ? s.bubbleInternalNote : isOut ? (m.from === 'ai' ? s.bubbleAi : s.bubbleOut) : s.bubbleIn),
                          opacity: m.temp ? 0.65 : 1,
                        }}
                      >
                        {m.type === 'audio' && m.mediaUrl ? (
                          <AudioMessage message={m} />
                        ) : (
                          m.text
                        )}
                      </div>
                      <div style={{ ...s.msgTime, ...(isOut ? { textAlign: 'right' } : {}) }}>
                        <span>{m.time}{m.temp && ' - enviando...'}</span>
                        {m.from === 'agent' && !m.internalNote ? <MessageStatus status={m.status} /> : null}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={msgsEndRef} />
          </div>

          {can('perm_ai') && activeConv && (
            <div style={s.aiBar}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>IA</span>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5 }}>
                {nextActionLoading ? (
                  <div style={s.nextActionChip}>
                    <span>Buscando proxima acao...</span>
                  </div>
                ) : nextActionVisible ? (
                  <div style={s.nextActionChip}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--txt1)' }}>{nextAction.label}</div>
                      <div style={{ color: 'var(--txt3)' }}>{nextAction.description || nextAction.reason}</div>
                    </div>
                    {nextAction.action !== 'dismiss' ? (
                      <button type="button" style={s.nextActionBtn} onClick={handleNextAction}>
                        Aplicar
                      </button>
                    ) : null}
                    <button type="button" style={s.nextActionBtnGhost} onClick={dismissNextAction}>
                      Descartar
                    </button>
                  </div>
                ) : null}
                {nextActionVisible || nextActionLoading ? null : aiLoading ? (
                  <span style={{ color: 'var(--txt3)' }}>Gerando sugestao...</span>
                ) : aiSug ? (
                  aiSug
                ) : aiReason ? (
                  <span style={{ color: 'var(--txt3)' }}>{aiReason}</span>
                ) : (
                  <span style={{ color: 'var(--txt3)' }}>Peça uma sugestao on-demand usando o contexto salvo do workspace.</span>
                )}
              </div>
              {aiSug && !aiLoading ? (
                <button style={s.aiUseBtn} onClick={() => { setInput(aiSug); inputRef.current?.focus() }}>
                  Usar
                </button>
              ) : null}
              <button
                style={s.aiUseBtn}
                onClick={() => generateAiSuggestion(activeId)}
                disabled={aiLoading || !activeId}
                title="Gerar sugestao com o contexto ativo do workspace"
              >
                {aiLoading ? 'Gerando' : (aiSug ? 'Atualizar' : 'Gerar')}
              </button>
            </div>
          )}

          <div style={s.inputRow}>
            <input
              ref={inputRef}
              style={{
                ...s.inputField,
                ...(internalNote ? s.inputFieldInternalNote : {}),
                ...(composerLocked || activeConv.state === 'closed' ? { opacity: 0.5 } : {}),
              }}
              placeholder={
                !can('perm_reply')
                  ? 'Sem permissao para responder'
                  : composerLocked
                    ? 'Instagram inbound e somente leitura'
                    : activeConv.state === 'closed'
                      ? 'Conversa encerrada'
                      : 'Digite uma mensagem...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={!canWriteReply || sending}
            />
            <button
              type="button"
              style={{ ...s.noteToggle, ...(internalNote ? s.noteToggleActive : {}) }}
              onClick={() => setInternalNote((current) => !current)}
              disabled={!canWriteReply || sending}
            >
              Nota interna
            </button>
            <button
              style={{ ...s.sendBtn, ...(internalNote ? s.sendBtnNote : {}), opacity: sending || !input.trim() || !canWriteReply ? 0.5 : 1 }}
              onClick={sendMessage}
              disabled={sending || !input.trim() || !canWriteReply}
            >
              {internalNote ? 'Salvar nota' : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {activeConv && showPanel && (
        <div style={s.panel}>
          <div style={s.panelTop}>
            <div style={{ ...s.avatar, background: avatarColor(activeConv.contact_name), width: 46, height: 46, fontSize: 16, margin: '0 auto 10px' }}>
              {initials(activeConv.contact_name)}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, textAlign: 'center' }}>{activeConv.contact_name}</div>
            {activeConv.contact_company && (
              <div style={{ fontSize: 11, color: 'var(--txt3)', textAlign: 'center', marginTop: 2 }}>{activeConv.contact_company}</div>
            )}
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ ...s.chanTag, color: getChannelColor(activeConv.channel_type), background: `${getChannelColor(activeConv.channel_type)}18`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ChannelGlyph type={activeConv.channel_type} size={12} />
                {activeConv.channel_name}
              </span>
              <span style={{ ...s.chanTag, color: '#38bdf8', background: 'rgba(56,189,248,.16)' }}>
                {ROUTING_QUEUE_LABELS[queueToShow]}
              </span>
            </div>
          </div>

          <div style={s.panelDivider} />

          <div style={s.panelSection}>
            <div style={s.panelSectionTitle}>Informacoes</div>
            {[
              ['Telefone', activeConv.contact_phone || '-'],
              ['E-mail', activeConv.contact_email || '-'],
              ['Empresa', activeConv.contact_company || '-'],
              ['Prioridade', PRI_LABELS[activeConv.priority] || '-'],
              ['Estado', STATE_LABELS[activeConv.state] || '-'],
              ['Triagem', TRIAGE_LABELS[activeConv.triage_tag] || '-'],
              ['Sentimento', SENTIMENT_LABELS[activeConv.sentiment] || '-'],
              ['Responsavel', activeConv.assigned_to ? (activeAssignee?.name || 'Atribuido') : 'Sem dono'],
              ['Presenca', activeAssignee ? (activeAssignee.is_online ? 'Online' : 'Offline') : `${onlineAgents} online`],
            ].map(([k, v]) => (
              <div key={k} style={s.panelRow}>
                <span style={s.panelKey}>{k}</span>
                <span style={s.panelVal}>{v}</span>
              </div>
            ))}
          </div>

          <div style={s.panelDivider} />

          <div style={s.panelSection}>
            <div style={s.panelSectionTitle}>Roteamento</div>
            <div style={s.panelRow}>
              <span style={s.panelKey}>Fila</span>
              <span style={s.panelVal}>{ROUTING_QUEUE_LABELS[queueToShow]}</span>
            </div>
            <div style={s.panelRow}>
              <span style={s.panelKey}>Intencao</span>
              <span style={s.panelVal}>{ROUTING_INTENT_LABELS[intentToShow]}</span>
            </div>
            <div style={s.panelRow}>
              <span style={s.panelKey}>Fonte</span>
              <span style={s.panelVal}>{routingView?.source || activeConv.routing_source || 'fallback'}</span>
            </div>
            {routingView?.confidence ? (
              <div style={s.panelRow}>
                <span style={s.panelKey}>Confianca</span>
                <span style={s.panelVal}>{Math.round(routingView.confidence * 100)}%</span>
              </div>
            ) : null}
            {canViewRoutingReason && routingReasonToShow ? (
              <div style={s.routingReason}>
                {routingReasonToShow}
              </div>
            ) : null}
            {routingError ? <div style={s.routingError}>{routingError}</div> : null}
            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              {canManageRouting ? (
                <select
                  style={s.panelSelect}
                  value={activeConv.triage_tag || 'outros'}
                  onChange={(event) => updateTriageTag(event.target.value)}
                  disabled={triageSaving}
                >
                  {Object.entries(TRIAGE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : null}
              <button
                style={s.panelActionBtn}
                onClick={suggestRouting}
                disabled={routingLoading}
              >
                {routingLoading ? 'Processando...' : 'Sugerir fila'}
              </button>
              {canManageRouting ? (
                <button
                  style={{ ...s.panelActionBtn, ...s.panelActionBtnPrimary }}
                  onClick={applyRouting}
                  disabled={routingLoading}
                >
                  {routingLoading ? 'Processando...' : 'Aplicar fila'}
                </button>
              ) : null}
            </div>
          </div>

          <div style={s.panelDivider} />

          <div style={s.panelSection}>
            <div style={s.panelSectionTitle}>Handoff e copilot</div>
            <div style={s.panelRow}>
              <span style={s.panelKey}>Modo</span>
              <span style={s.panelVal}>{handoffMode === 'ai' ? 'IA em foco' : 'Humano em foco'}</span>
            </div>
            <div style={s.panelRow}>
              <span style={s.panelKey}>Copilot</span>
              <span style={s.panelVal}>{copilotPaused ? 'Pausado' : 'Ativo'}</span>
            </div>
            <div style={s.panelRow}>
              <span style={s.panelKey}>Escalonamento</span>
              <span style={s.panelVal}>{ESCALATION_REASON_LABELS[escalationReasonToShow] || ESCALATION_REASON_LABELS.none}</span>
            </div>
            {activeConv.escalation_note ? (
              <div style={s.routingReason}>
                {activeConv.escalation_note}
              </div>
            ) : null}
            {canTriggerHandoff ? (
              <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                {activeConv.state !== 'human_handling' ? (
                  <button
                    style={{ ...s.panelActionBtn, ...s.panelActionBtnWarn }}
                    onClick={takeoverConversation}
                    disabled={handoffLoading}
                  >
                    {handoffLoading ? 'Processando...' : 'Assumir atendimento'}
                  </button>
                ) : null}
                <button
                  style={{ ...s.panelActionBtn, ...s.panelActionBtnPrimary }}
                  onClick={reactivateCopilot}
                  disabled={handoffLoading || !copilotPaused}
                >
                  {handoffLoading ? 'Processando...' : 'Reativar copilot'}
                </button>
                <select
                  style={s.panelSelect}
                  value={escalationReason}
                  onChange={(event) => setEscalationReason(event.target.value)}
                  disabled={handoffLoading}
                >
                  <option value="sensitive">Sensivel</option>
                  <option value="unresolved">Nao resolvida</option>
                  <option value="high_value">Alto valor</option>
                  <option value="out_of_hours">Fora do horario</option>
                  <option value="other">Outro</option>
                </select>
                <textarea
                  style={s.panelTextarea}
                  placeholder="Nota opcional de escalonamento"
                  value={escalationNote}
                  onChange={(event) => setEscalationNote(event.target.value)}
                  rows={2}
                  disabled={handoffLoading}
                />
                <button
                  style={{ ...s.panelActionBtn, ...s.panelActionBtnDanger }}
                  onClick={escalateConversation}
                  disabled={handoffLoading}
                >
                  {handoffLoading ? 'Processando...' : 'Escalonar manualmente'}
                </button>
              </div>
            ) : null}
            {historyLoading ? (
              <div style={s.historyHint}>Carregando historico...</div>
            ) : null}
            {!historyLoading && handoffHistory.length > 0 ? (
              <div style={s.historyList}>
                {handoffHistory.slice(0, 6).map((event) => (
                  <div key={event.id} style={s.historyItem}>
                    <div style={{ fontSize: 10.5, fontWeight: 600 }}>{String(event.action || '').replace('conversation_', '')}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{fmtTime(event.created_at)}</div>
                  </div>
                ))}
              </div>
            ) : null}
            {handoffError ? <div style={s.routingError}>{handoffError}</div> : null}
          </div>

          <div style={s.panelDivider} />

          <div style={s.panelGrid}>
            {[
              { v: convMsgs.length, l: 'Mensagens' },
              { v: activeConv.unread || 0, l: 'Nao lidas' },
              { v: activeConv.assigned_to ? 'Atribuida' : 'Sem dono', l: 'Owner' },
              { v: activeConv.routing_queue === 'triagem' ? 'Fila' : 'Direta', l: 'Entrada' },
            ].map((item) => (
              <div key={item.l} style={s.panelStat}>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>{item.v}</div>
                <div style={{ fontSize: 9, color: 'var(--txt3)', marginTop: 2 }}>{item.l}</div>
              </div>
            ))}
          </div>

          {can('perm_close') && activeConv.state !== 'closed' && (
            <button style={s.resolveBtn} onClick={closeConv}>
              Encerrar conversa
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function MessageStatus({ status }) {
  if (status === 'failed') {
    return (
      <span style={{ ...s.messageStatus, color: 'var(--danger)' }}>
        <AlertCircle size={12} aria-hidden />
        Nao enviado
      </span>
    )
  }

  if (status === 'read') {
    return (
      <span style={{ ...s.messageStatus, color: '#22D3EE' }}>
        <CheckCheck size={12} aria-hidden />
      </span>
    )
  }

  if (status === 'delivered') {
    return (
      <span style={s.messageStatus}>
        <CheckCheck size={12} aria-hidden />
      </span>
    )
  }

  return (
    <span style={s.messageStatus}>
      <Check size={12} aria-hidden />
    </span>
  )
}

function AudioMessage({ message }) {
  return (
    <div>
      <audio controls src={message.mediaUrl} style={s.audioPlayer} />
      {message.transcriptionStatus === 'pending' ? (
        <div style={s.transcriptionState}>
          <Loader2 size={12} style={s.spinIcon} aria-hidden />
          Transcrevendo...
        </div>
      ) : null}
      {message.transcriptionStatus === 'done' && message.transcription ? (
        <div>
          {message.transcriptionSummary ? (
            <div style={s.transcriptionSummary}>
              Resumo: {message.transcriptionSummary}
            </div>
          ) : null}
          <p style={s.transcriptionText}>{message.transcription}</p>
        </div>
      ) : null}
      {message.transcriptionStatus === 'failed' ? (
        <div style={s.transcriptionFailed}>Áudio não pôde ser transcrito</div>
      ) : null}
    </div>
  )
}

const s = {
  root: {
    display: 'flex', height: '100%', overflow: 'hidden',
    fontFamily: 'var(--font, DM Sans, sans-serif)',
    background: 'var(--bg-page, #0c0b14)',
    color: 'var(--txt1, #f5f3ff)',
  },
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
  queueTag: { fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8 },
  priTag: { fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8 },
  unreadBadge: {
    background: '#7c3aed', color: '#fff', fontSize: 9, fontWeight: 800,
    borderRadius: '50%', width: 16, height: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff', position: 'relative',
  },
  avatarStatus: {
    position: 'absolute', bottom: 0, right: 0, width: 8, height: 8,
    borderRadius: '50%', border: '1.5px solid var(--bg-page, #0c0b14)',
  },
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
  internalNoteLabel: { fontSize: 10, fontWeight: 700, color: 'var(--txt3)', marginBottom: 4, textAlign: 'right' },
  bubble: { padding: '8px 12px', borderRadius: 13, fontSize: 13, lineHeight: 1.55, maxWidth: 340, wordBreak: 'break-word' },
  bubbleIn: { background: 'rgba(255,255,255,.07)', color: 'var(--txt2, #a89fc4)', borderBottomLeftRadius: 3 },
  bubbleOut: { background: '#7c3aed', color: '#fff', borderBottomRightRadius: 3, boxShadow: '0 2px 10px rgba(124,58,237,.3)' },
  bubbleAi: { background: 'linear-gradient(135deg,rgba(34,211,238,.1),rgba(124,58,237,.08))', border: '1px solid rgba(34,211,238,.2)', color: 'var(--txt1, #f5f3ff)', borderBottomRightRadius: 3 },
  bubbleInternalNote: { background: 'color-mix(in srgb, #F59E0B 15%, transparent)', borderLeft: '3px solid #F59E0B', color: 'var(--txt1, #f5f3ff)', borderBottomRightRadius: 3 },
  audioPlayer: { width: 220, height: 36, accentColor: 'var(--pri)' },
  transcriptionState: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    fontSize: 11,
    color: 'var(--txt3)',
  },
  transcriptionSummary: {
    marginTop: 6,
    fontSize: 11,
    color: 'var(--txt3)',
    fontStyle: 'italic',
    lineHeight: 1.45,
  },
  transcriptionText: {
    margin: '6px 0 0',
    fontSize: 12,
    color: 'var(--txt2)',
    lineHeight: 1.5,
  },
  transcriptionFailed: {
    marginTop: 6,
    fontSize: 11,
    color: 'var(--txt3)',
  },
  spinIcon: {
    animation: 'spin 0.8s linear infinite',
  },
  msgTime: { fontSize: 9.5, color: 'var(--txt4, #352f50)', marginTop: 2 },
  messageStatus: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginLeft: 6,
    color: 'var(--txt3)',
    verticalAlign: 'middle',
  },
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
  nextActionChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
    border: '1px solid rgba(34,211,238,.22)',
    background: 'rgba(34,211,238,.06)',
    borderRadius: 8,
    padding: '7px 8px',
    marginBottom: 6,
  },
  nextActionBtn: {
    fontSize: 10,
    color: '#67e8f9',
    background: 'rgba(34,211,238,.14)',
    border: '1px solid rgba(34,211,238,.26)',
    borderRadius: 6,
    padding: '3px 8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 700,
    flexShrink: 0,
  },
  nextActionBtnGhost: {
    fontSize: 10,
    color: 'var(--txt3)',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 6,
    padding: '3px 8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 600,
    flexShrink: 0,
  },
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
  inputFieldInternalNote: {
    background: 'rgba(245,158,11,0.06)',
    borderColor: 'rgba(245,158,11,.35)',
  },
  noteToggle: {
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    color: 'var(--txt2)',
    borderRadius: 999,
    padding: '0 12px',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  noteToggleActive: {
    background: 'rgba(245,158,11,.2)',
    borderColor: 'rgba(245,158,11,.4)',
    color: '#F59E0B',
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 9, background: '#7c3aed', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all .18s', color: '#fff', fontFamily: 'inherit', fontSize: 11, fontWeight: 800,
  },
  sendBtnNote: {
    width: 'auto',
    minWidth: 86,
    padding: '0 12px',
    background: '#F59E0B',
  },
  panel: {
    width: 230, flexShrink: 0,
    background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)',
    backdropFilter: 'blur(16px)', WebKitBackdropFilter: 'blur(16px)',
    borderLeft: '1px solid var(--border)',
    overflowY: 'auto', display: 'flex', flexDirection: 'column',
  },
  panelTop: { padding: '16px 12px 10px' },
  panelDivider: { height: 1, background: 'rgba(255,255,255,.05)' },
  panelSection: { padding: '10px 12px' },
  panelSectionTitle: { fontSize: 9, fontWeight: 700, color: 'var(--txt3, #5a5272)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 },
  panelRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  panelKey: { fontSize: 10.5, color: 'var(--txt3, #5a5272)' },
  panelVal: { fontSize: 10.5, fontWeight: 500, maxWidth: 120, textAlign: 'right', wordBreak: 'break-word' },
  panelGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, padding: '10px 12px' },
  panelStat: {
    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.05)',
    borderRadius: 8, padding: '7px', textAlign: 'center',
  },
  panelActionBtn: {
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    color: 'var(--txt2)',
    borderRadius: 8,
    padding: '7px 9px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  panelActionBtnPrimary: {
    border: '1px solid rgba(56,189,248,.4)',
    background: 'rgba(56,189,248,.14)',
    color: '#7dd3fc',
  },
  panelActionBtnWarn: {
    border: '1px solid rgba(250,204,21,.45)',
    background: 'rgba(250,204,21,.14)',
    color: '#fde68a',
  },
  panelActionBtnDanger: {
    border: '1px solid rgba(248,113,113,.45)',
    background: 'rgba(248,113,113,.14)',
    color: '#fecaca',
  },
  panelSelect: {
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    color: 'var(--txt2)',
    borderRadius: 8,
    padding: '7px 9px',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'inherit',
  },
  panelTextarea: {
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    color: 'var(--txt2)',
    borderRadius: 8,
    padding: '7px 9px',
    fontSize: 11,
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  historyHint: {
    marginTop: 8,
    fontSize: 10.5,
    color: 'var(--txt3)',
  },
  historyList: {
    marginTop: 8,
    display: 'grid',
    gap: 6,
  },
  historyItem: {
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.03)',
    borderRadius: 8,
    padding: '7px 8px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
  },
  routingReason: {
    marginTop: 8,
    padding: '8px 9px',
    fontSize: 11,
    lineHeight: 1.5,
    color: 'var(--txt2)',
    border: '1px solid rgba(255,255,255,.08)',
    background: 'rgba(255,255,255,.04)',
    borderRadius: 8,
  },
  routingError: {
    marginTop: 8,
    fontSize: 11,
    color: '#fca5a5',
  },
  resolveBtn: {
    margin: '8px 12px 12px', padding: '8px', width: 'calc(100% - 24px)',
    borderRadius: 8, background: '#10b981', border: 'none', color: '#fff',
    fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer',
    transition: 'all .18s',
  },
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
