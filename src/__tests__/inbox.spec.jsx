import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Inbox from '../pages/Inbox.jsx'

// ref: ALOAI-v1-spec.md Section 15 UX Behavioral Requirements

const testState = vi.hoisted(() => ({
  conversations: [],
  messages: [],
  apiJson: vi.fn(),
  apiFetch: vi.fn(),
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'agent-1' },
    ws: { id: 'workspace-1' },
    workspaceReady: true,
    loading: false,
  }),
}))

vi.mock('../hooks/usePermissions', () => ({
  usePermissions: () => ({
    can: () => true,
    convScope: () => 'all',
    canViewRoutingReason: true,
    canViewHandoffHistory: true,
    canManageHandoff: true,
  }),
}))

vi.mock('../lib/api', () => ({
  apiJson: (...args) => testState.apiJson(...args),
  apiFetch: (...args) => testState.apiFetch(...args),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (table) => {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        limit: () => query,
        then: (resolve, reject) => {
          const data = table === 'conversations' ? testState.conversations : []
          return Promise.resolve({ data, error: null }).then(resolve, reject)
        },
      }
      return query
    },
    channel: () => ({
      on() { return this },
      subscribe() { return this },
    }),
    removeChannel: vi.fn(),
  },
}))

function conversation({ isVip = false } = {}) {
  return {
    id: 'conv-1',
    state: 'open',
    status: 'open',
    priority: 'medium',
    unread_count: 0,
    last_message: 'Mensagem recente',
    last_message_at: '2026-06-14T12:00:00.000Z',
    created_at: '2026-06-14T11:59:00.000Z',
    assigned_to: 'agent-1',
    routing_queue: 'triagem',
    routing_intent: 'duvida_geral',
    routing_confidence: 0.8,
    routing_reason: '',
    routing_source: 'fallback',
    triage_tag: 'suporte',
    sentiment: 'normal',
    sentiment_confidence: 0,
    ai_state: {},
    escalation_reason: 'none',
    contacts: {
      id: 'contact-1',
      name: 'Cliente Teste',
      phone: '5511999999999',
      company: 'ACME',
      email: 'cliente@example.com',
      is_vip: isVip,
    },
    channels: { id: 'channel-1', type: 'whatsapp', name: 'WhatsApp' },
  }
}

function message(overrides = {}) {
  return {
    id: 'msg-1',
    sender_type: 'agent',
    direction: 'outbound',
    content: 'Mensagem de teste',
    status: 'sent',
    is_internal_note: false,
    type: 'text',
    media_url: null,
    metadata: {},
    created_at: '2026-06-14T12:01:00.000Z',
    ...overrides,
  }
}

async function renderInbox({ isVip = false, messages = [message()] } = {}) {
  testState.conversations = [conversation({ isVip })]
  testState.messages = messages
  testState.apiJson.mockImplementation(async (url) => {
    if (String(url).includes('/messages')) return { messages: testState.messages }
    if (String(url).includes('/next-action')) return { available: false, action: null }
    if (String(url).includes('/handoff-history')) return { events: [] }
    return {}
  })
  testState.apiFetch.mockResolvedValue({ ok: true, json: async () => ({}) })

  const view = render(
    <MemoryRouter>
      <Inbox />
    </MemoryRouter>,
  )
  await screen.findByText('Cliente Teste')
  if (messages.length) await screen.findByText(messages[0].content)
  return view
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Inbox UX contracts', () => {
  beforeEach(() => {
    testState.conversations = []
    testState.messages = []
  })

  it('renders VIP star badge when contact.is_vip = true', async () => {
    await renderInbox({ isVip: true })

    expect(screen.getByLabelText('Cliente VIP')).toBeInTheDocument()
  })

  it('does not render VIP star when contact.is_vip = false', async () => {
    await renderInbox({ isVip: false })

    expect(screen.queryByLabelText('Cliente VIP')).not.toBeInTheDocument()
  })

  it('internal note toggle changes composer background to amber tint', async () => {
    await renderInbox()

    fireEvent.click(screen.getByRole('button', { name: /nota interna/i }))

    expect(screen.getByPlaceholderText('Digite uma mensagem...').style.background).toContain('245')
  })

  it("internal note send button label changes to 'Salvar nota'", async () => {
    await renderInbox()

    fireEvent.click(screen.getByRole('button', { name: /nota interna/i }))

    expect(screen.getByRole('button', { name: /salvar nota/i })).toBeInTheDocument()
  })

  it('read receipt shows CheckCheck with cyan color when status = read', async () => {
    const { container } = await renderInbox({ messages: [message({ status: 'read' })] })
    const icon = container.querySelector('.lucide-check-check')

    expect(icon).toBeTruthy()
    expect(icon.closest('span')).toHaveStyle({ color: '#22D3EE' })
  })

  it('read receipt shows CheckCheck with gray color when status = delivered', async () => {
    const { container } = await renderInbox({ messages: [message({ status: 'delivered' })] })
    const icon = container.querySelector('.lucide-check-check')

    expect(icon).toBeTruthy()
    expect(icon.closest('span').getAttribute('style')).toContain('var(--txt3)')
  })

  it('read receipt shows Check with gray color when status = sent', async () => {
    const { container } = await renderInbox({ messages: [message({ status: 'sent' })] })
    const icon = container.querySelector('.lucide-check')

    expect(icon).toBeTruthy()
    expect(icon.closest('span').getAttribute('style')).toContain('var(--txt3)')
  })

  it('read receipt shows AlertCircle when status = failed', async () => {
    const { container } = await renderInbox({ messages: [message({ status: 'failed' })] })

    expect(container.querySelector('.lucide-circle-alert')).toBeTruthy()
    expect(screen.getByText('Nao enviado')).toBeInTheDocument()
  })

  it('does not show a status icon on internal notes', async () => {
    const { container } = await renderInbox({
      messages: [message({ is_internal_note: true, content: 'Nota interna salva' })],
    })

    expect(container.querySelector('.lucide-check')).toBeFalsy()
    expect(container.querySelector('.lucide-check-check')).toBeFalsy()
  })

  it('does not show a status icon on contact messages', async () => {
    const { container } = await renderInbox({
      messages: [message({ sender_type: 'contact', direction: 'inbound', content: 'Mensagem do cliente' })],
    })

    expect(container.querySelector('.lucide-check')).toBeFalsy()
    expect(container.querySelector('.lucide-check-check')).toBeFalsy()
  })

  it("transcription shows 'Transcrevendo...' when transcription_status = pending", async () => {
    await renderInbox({
      messages: [message({
        type: 'audio',
        media_url: 'https://media.example/audio.ogg',
        transcription_status: 'pending',
      })],
    })

    expect(screen.getByText('Transcrevendo...')).toBeInTheDocument()
  })

  it('transcription shows text when transcription_status = done', async () => {
    await renderInbox({
      messages: [message({
        type: 'audio',
        media_url: 'https://media.example/audio.ogg',
        transcription_status: 'done',
        transcription: 'Texto transcrito do audio',
      })],
    })

    expect(screen.getByText('Texto transcrito do audio')).toBeInTheDocument()
  })

  it('transcription shows error message when transcription_status = failed', async () => {
    await renderInbox({
      messages: [message({
        type: 'audio',
        media_url: 'https://media.example/audio.ogg',
        transcription_status: 'failed',
      })],
    })

    await waitFor(() => expect(screen.getByText(/transcrito/i)).toBeInTheDocument())
  })
})
