import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Stacked cards: live CRM-style events. Landing uses `demo` mode with static items.
 * App uses `events` from useInboxNotifications + onOpenConversation.
 */
export function LiveNotificationStack({
  events = [],
  onOpen,
  demo = false,
  demoItems = [],
  className = '',
}) {
  const items = demo ? demoItems : events
  const [activeIndex, setActiveIndex] = useState(0)
  const total = items?.length || 0

  useEffect(() => {
    if (!demo || total <= 1) return
    const t = setInterval(() => {
      setActiveIndex((i) => (i + 1) % total)
    }, 5200)
    return () => clearInterval(t)
  }, [demo, total])

  useEffect(() => {
    if (activeIndex >= total) setActiveIndex(0)
  }, [activeIndex, total])

  const handleClick = useCallback(
    (item) => {
      if (item?.conversationId && onOpen) onOpen(item.conversationId)
    },
    [onOpen]
  )

  if (!total) return null

  const visibleBehind = 2

  return (
    <div className={`live-notif-stack ${className}`.trim()}>
      {items.map((item, index) => {
        const displayOrder = (index - activeIndex + total) % total
        let transform = ''
        let opacity = 0
        let z = 0

        if (displayOrder === 0) {
          transform = 'translateX(0)'
          opacity = 1
          z = total
        } else if (displayOrder <= visibleBehind) {
          const scale = 1 - 0.04 * displayOrder
          const ty = -0.35 * displayOrder
          transform = `scale(${scale}) translateY(${ty}rem)`
          opacity = 1 - 0.18 * displayOrder
          z = total - displayOrder
        } else {
          transform = 'scale(0)'
          opacity = 0
          z = 0
        }

        const interactive = !demo && item.conversationId

        return (
          <motion.button
            key={item.id}
            type="button"
            className={`live-notif-card ${interactive ? 'live-notif-card--interactive' : ''}`}
            style={{ transform, opacity, zIndex: z }}
            onClick={() => handleClick(item)}
            disabled={!interactive}
            initial={false}
            layout
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            whileHover={interactive ? { scale: 1.02 } : undefined}
            whileTap={interactive ? { scale: 0.98 } : undefined}
          >
            <span className="live-notif-kicker">
              {item.kind === 'pipeline' ? 'Pipeline' : 'Ao vivo'}
            </span>
            <span className="live-notif-title">{item.title}</span>
            <span className="live-notif-sub">{item.subtitle}</span>
            {item.body ? <p className="live-notif-body">{item.body}</p> : null}
            {interactive ? (
              <span className="live-notif-hint">Abrir conversa</span>
            ) : demo ? (
              <span className="live-notif-hint live-notif-hint--muted">Pré-visualização</span>
            ) : null}
          </motion.button>
        )
      })}

      {total > 1 && (
        <div className="live-notif-dots" role="tablist" aria-label="Eventos">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`live-notif-dot ${i === activeIndex ? 'live-notif-dot--active' : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Evento ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Compact floating list for app shell (last N notifications). */
export function LiveNotificationFeed({ events, onOpen, onDismiss, max = 4 }) {
  const list = (events || []).slice(0, max)

  return (
    <div className="live-feed">
      <div className="live-feed-head">Atividade</div>
      <AnimatePresence initial={false}>
        {list.map((ev) => (
          <motion.button
            key={ev.id}
            type="button"
            className="live-feed-row"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => ev.conversationId && onOpen?.(ev.conversationId)}
            disabled={!ev.conversationId}
          >
            <span className="live-feed-title">{ev.title}</span>
            <span className="live-feed-meta">{ev.subtitle}</span>
            {onDismiss && (
              <button
                type="button"
                className="live-feed-dismiss"
                aria-label="Dispensar"
                onClick={(e) => {
                  e.stopPropagation()
                  onDismiss(ev.id)
                }}
              >
                ×
              </button>
            )}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
