export const REALTIME_EVENTS = Object.freeze({
  CONVERSATION_CREATED: 'conversation.created',
  MESSAGE_CREATED: 'message.created',
  CONVERSATION_UPDATED: 'conversation.updated',
  ASSIGNMENT_UPDATED: 'assignment.updated',
  KANBAN_UPDATED: 'kanban.updated',
  PRESENCE_UPDATED: 'presence.updated',
})

export const REALTIME_EVENT_VERSION = 1

export const REQUIRED_ENVELOPE_FIELDS = Object.freeze([
  'event',
  'workspace_id',
  'resource_type',
  'resource_id',
  'actor_id',
  'occurred_at',
  'version',
  'payload',
])

const RESOURCE_TYPE_BY_EVENT = Object.freeze({
  [REALTIME_EVENTS.CONVERSATION_CREATED]: 'conversation',
  [REALTIME_EVENTS.MESSAGE_CREATED]: 'message',
  [REALTIME_EVENTS.CONVERSATION_UPDATED]: 'conversation',
  [REALTIME_EVENTS.ASSIGNMENT_UPDATED]: 'assignment',
  [REALTIME_EVENTS.KANBAN_UPDATED]: 'kanban',
  [REALTIME_EVENTS.PRESENCE_UPDATED]: 'presence',
})

const CANONICAL_EVENTS = new Set(Object.values(REALTIME_EVENTS))

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null) ?? null
}

function rowFromPayload(payload) {
  if (!payload) return {}
  return payload.new || payload.record || payload.row || payload || {}
}

function previousRowFromPayload(payload) {
  if (!payload) return {}
  return payload.old || payload.previous || {}
}

function changed(row, old, key) {
  if (!old || !Object.prototype.hasOwnProperty.call(old, key)) return false
  return row?.[key] !== old?.[key]
}

export function eventFromPostgresChange(payload) {
  const table = payload?.table || ''
  const eventType = String(payload?.eventType || payload?.type || '').toUpperCase()
  const row = rowFromPayload(payload)
  const old = previousRowFromPayload(payload)

  if (table === 'messages' && eventType === 'INSERT') return REALTIME_EVENTS.MESSAGE_CREATED

  if (table === 'conversations') {
    if (eventType === 'INSERT') return REALTIME_EVENTS.CONVERSATION_CREATED
    if (changed(row, old, 'assigned_to') || changed(row, old, 'assigned_by')) return REALTIME_EVENTS.ASSIGNMENT_UPDATED
    if (changed(row, old, 'state') || changed(row, old, 'status')) return REALTIME_EVENTS.KANBAN_UPDATED
    return REALTIME_EVENTS.CONVERSATION_UPDATED
  }

  if (['workspace_members', 'workspace_users', 'users'].includes(table)) return REALTIME_EVENTS.PRESENCE_UPDATED

  return null
}

export function toRealtimeEnvelope(payload, event, options = {}) {
  const row = rowFromPayload(payload)
  const old = previousRowFromPayload(payload)
  const table = payload?.table || options.table || null

  return {
    event,
    workspace_id: firstDefined(row.workspace_id, row.company_id, old.workspace_id, old.company_id, options.workspaceId),
    resource_type: options.resourceType || RESOURCE_TYPE_BY_EVENT[event] || table || 'resource',
    resource_id: firstDefined(row.id, row.conversation_id, row.user_id, old.id, old.conversation_id, old.user_id, options.resourceId),
    actor_id: firstDefined(options.actorId, row.updated_by, row.assigned_by, row.user_id, old.user_id),
    occurred_at: firstDefined(row.updated_at, row.created_at, row.last_message_at, old.updated_at, old.created_at, options.occurredAt, new Date().toISOString()),
    version: options.version || REALTIME_EVENT_VERSION,
    payload: {
      table,
      schema: payload?.schema || options.schema || 'public',
      eventType: payload?.eventType || payload?.type || null,
      new: row,
      old,
    },
  }
}

export function envelopeFromPostgresChange(payload, options = {}) {
  const event = options.event || eventFromPostgresChange(payload)
  if (!event) return null
  return toRealtimeEnvelope(payload, event, options)
}

export function validateRealtimeEnvelope(envelope) {
  const missing = REQUIRED_ENVELOPE_FIELDS.filter((field) => envelope?.[field] === undefined || envelope?.[field] === null)
  const errors = []

  if (envelope?.event && !CANONICAL_EVENTS.has(envelope.event)) errors.push(`unknown event ${envelope.event}`)
  if (envelope?.version !== REALTIME_EVENT_VERSION) errors.push(`unsupported version ${envelope?.version}`)
  if (envelope?.payload && typeof envelope.payload !== 'object') errors.push('payload must be an object')

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  }
}

export function isRealtimeEnvelopeValid(envelope) {
  return validateRealtimeEnvelope(envelope).valid
}

export function isWorkspaceEnvelope(envelope, workspaceId) {
  if (!envelope || !workspaceId) return Boolean(envelope)
  return envelope.workspace_id === workspaceId
}

export function shouldHandleRealtimeEnvelope(envelope, workspaceId, events = Object.values(REALTIME_EVENTS)) {
  if (!isWorkspaceEnvelope(envelope, workspaceId)) return false
  if (!validateRealtimeEnvelope(envelope).valid) return false
  return events.includes(envelope.event)
}
