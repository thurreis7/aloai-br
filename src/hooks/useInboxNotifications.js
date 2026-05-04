import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  REALTIME_EVENTS,
  envelopeFromPostgresChange,
  isWorkspaceEnvelope,
  validateRealtimeEnvelope,
} from '../lib/realtimeEvents'

const MAX = 12

function normalizeConversationState(state, status) {
  const candidate = String(state || status || 'new').trim().toLowerCase()
  if (['new', 'open', 'ai_handling', 'human_handling', 'waiting_customer', 'closed'].includes(candidate)) return candidate
  if (candidate === 'resolved') return 'closed'
  if (candidate === 'waiting') return 'waiting_customer'
  if (candidate === 'bot') return 'ai_handling'
  return 'new'
}

export function useInboxNotifications(user) {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const seenRef = useRef(new Set())

  const pushEvent = useCallback((ev) => {
    setEvents((prev) => {
      const next = [ev, ...prev.filter((item) => item.id !== ev.id)]
      return next.slice(0, MAX)
    })
  }, [])

  const dismiss = useCallback((id) => {
    setEvents((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const openConversation = useCallback(
    (conversationId) => {
      if (!conversationId) return
      navigate(`/app/inbox?conv=${encodeURIComponent(conversationId)}`)
    },
    [navigate]
  )

  useEffect(() => {
    if (!user?.id) return
    const workspaceId = user.workspace_id || user.company_id || user.active_workspace_id || null

    const shouldUseEnvelope = (payload, event) => {
      const envelope = envelopeFromPostgresChange(payload, { workspaceId })
      if (envelope?.event !== event) return false
      if (!validateRealtimeEnvelope(envelope).valid) return false
      return !workspaceId || isWorkspaceEnvelope(envelope, workspaceId)
    }

    const channel = supabase
      .channel('alo-ai-live-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          if (!shouldUseEnvelope(payload, REALTIME_EVENTS.MESSAGE_CREATED)) return
          const message = payload.new
          if (!message?.conversation_id) return
          if (message.sender_type !== 'client') return

          const dedupe = `msg-${message.id}`
          if (seenRef.current.has(dedupe)) return
          seenRef.current.add(dedupe)

          let contactName = 'Contato'
          try {
            const { data: row } = await supabase
              .from('conversations')
              .select('contacts ( name )')
              .eq('id', message.conversation_id)
              .maybeSingle()
            contactName = row?.contacts?.name || contactName
          } catch {
            /* ignore */
          }

          pushEvent({
            id: dedupe,
            kind: 'message',
            title: 'Nova mensagem recebida',
            subtitle: contactName,
            body: (message.content || '').slice(0, 120),
            conversationId: message.conversation_id,
            at: message.created_at || new Date().toISOString(),
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        (payload) => {
          const allowed = [
            REALTIME_EVENTS.CONVERSATION_UPDATED,
            REALTIME_EVENTS.ASSIGNMENT_UPDATED,
            REALTIME_EVENTS.KANBAN_UPDATED,
          ]
          if (!allowed.some((event) => shouldUseEnvelope(payload, event))) return
          const row = payload.new
          const old = payload.old
          if (!row?.id) return
          const state = normalizeConversationState(row.state, row.status)
          const previousState = normalizeConversationState(old?.state, old?.status)
          if (state === previousState) return

          const dedupe = `state-${row.id}-${state}`
          if (seenRef.current.has(dedupe)) return
          seenRef.current.add(dedupe)

          const titleByState = {
            new: 'Nova conversa',
            open: 'Conversa aberta',
            ai_handling: 'IA em atendimento',
            human_handling: 'Atendimento humano',
            waiting_customer: 'Aguardando cliente',
            closed: 'Conversa encerrada',
          }

          pushEvent({
            id: dedupe,
            kind: 'state',
            title: titleByState[state] || 'Estado atualizado',
            subtitle: state || 'conversation',
            body: row.last_message ? String(row.last_message).slice(0, 120) : '',
            conversationId: row.id,
            at: new Date().toISOString(),
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, pushEvent])

  return { events, dismiss, openConversation }
}
