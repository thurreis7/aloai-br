import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const MAX = 12

/**
 * Real-time events from Supabase: new inbound messages and resolved conversations.
 * Click handler should navigate to /app/inbox?conv=...
 */
export function useInboxNotifications(user) {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const seenRef = useRef(new Set())

  const pushEvent = useCallback((ev) => {
    setEvents((prev) => {
      const next = [ev, ...prev.filter((e) => e.id !== ev.id)]
      return next.slice(0, MAX)
    })
  }, [])

  const dismiss = useCallback((id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
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

    const channel = supabase
      .channel('alo-ai-live-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const m = payload.new
          if (!m?.conversation_id) return
          if (m.sender_type !== 'client') return

          const dedupe = `msg-${m.id}`
          if (seenRef.current.has(dedupe)) return
          seenRef.current.add(dedupe)

          let contactName = 'Contato'
          try {
            const { data: row } = await supabase
              .from('conversations')
              .select('contacts ( name )')
              .eq('id', m.conversation_id)
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
            body: (m.content || '').slice(0, 120),
            conversationId: m.conversation_id,
            at: m.created_at || new Date().toISOString(),
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        (payload) => {
          const row = payload.new
          const old = payload.old
          if (!row?.id) return
          if (row.status !== 'resolved') return
          if (old && old.status === 'resolved') return

          const dedupe = `res-${row.id}`
          if (seenRef.current.has(dedupe)) return
          seenRef.current.add(dedupe)

          pushEvent({
            id: dedupe,
            kind: 'pipeline',
            title: 'Lead convertido',
            subtitle: 'Etapa concluída no pipeline',
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
