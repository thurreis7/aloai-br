import { useEffect, useMemo, useState } from 'react'
import { Instagram, Mail, MessageCircle, Radio, Send, Smartphone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePermissions } from '../hooks/usePermissions'
import { useAuth } from '../hooks/useAuth'
import { EmptyState, GlassCard, PageHeader, PageShell, SkeletonBlock, StatusPill } from '../components/app/WorkspaceUI'

const CHANNEL_LIBRARY = [
  { type: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, description: 'Canal principal para atendimento e vendas com onboarding via QR Code.' },
  { type: 'instagram', name: 'Instagram', icon: Instagram, description: 'Direct conectado para operar leads e suporte em uma mesma fila.' },
  { type: 'telegram', name: 'Telegram', icon: Send, description: 'Bot com roteamento rapido para suporte, grupos e notificacoes.' },
  { type: 'gmail', name: 'Gmail', icon: Mail, description: 'Caixa compartilhada com assinatura, fila e contexto de SLA.' },
  { type: 'webchat', name: 'Webchat', icon: Radio, description: 'Widget do site com captura de contexto e automacoes.' },
]

const CHANNEL_FIELDS = {
  whatsapp: [
    { key: 'display_number', label: 'Numero exibido', placeholder: '+55 11 99999-9999' },
    { key: 'business_account_id', label: 'Business Account ID', placeholder: 'Meta / BSP' },
    { key: 'welcome_template', label: 'Template inicial', placeholder: 'boas-vindas-v1' },
  ],
  instagram: [
    { key: 'handle', label: 'Perfil', placeholder: '@suaempresa' },
    { key: 'page_id', label: 'Page ID', placeholder: 'Pagina vinculada' },
    { key: 'sync_mode', label: 'Modo de sincronizacao', placeholder: 'DM + comentarios' },
  ],
  telegram: [
    { key: 'bot_username', label: 'Bot username', placeholder: '@alo_ai_bot' },
    { key: 'bot_token', label: 'Bot token', placeholder: '123456:ABC...' },
    { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://...' },
  ],
  gmail: [
    { key: 'inbox_email', label: 'Conta Gmail', placeholder: 'time@empresa.com' },
    { key: 'signature_name', label: 'Assinatura', placeholder: 'Equipe ALO AI' },
    { key: 'label_name', label: 'Label de sincronizacao', placeholder: 'ALO-AI' },
  ],
  webchat: [
    { key: 'site_url', label: 'Site', placeholder: 'https://seusite.com.br' },
    { key: 'widget_id', label: 'Widget ID', placeholder: 'widget_prod_01' },
    { key: 'greeting', label: 'Mensagem inicial', placeholder: 'Como podemos ajudar?' },
  ],
}

export default function Channels() {
  const { can } = usePermissions()
  const { ws, loading: authLoading, workspaceReady } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [channels, setChannels] = useState([])
  const [selectedType, setSelectedType] = useState('whatsapp')
  const [draftConfig, setDraftConfig] = useState({})

  useEffect(() => {
    let ignore = false

    async function loadChannels() {
      if (authLoading || !workspaceReady) {
        setLoading(true)
        setError('')
        return
      }

      if (!ws) {
        setChannels([])
        setLoading(false)
        setError('')
        return
      }

      setLoading(true)
      setError('')
      try {
        const { data, error: queryError } = await supabase
          .from('channels')
          .select('id, type, name, is_active, config, created_at')
          .eq('workspace_id', ws.id)
          .order('created_at', { ascending: false })

        if (queryError) throw queryError
        if (!ignore) setChannels(data || [])
      } catch (err) {
        if (!ignore) setError(err.message || 'Nao foi possivel carregar os canais.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadChannels()
    return () => { ignore = true }
  }, [ws, authLoading, workspaceReady])

  const mergedChannels = useMemo(() => {
    return CHANNEL_LIBRARY.map((base) => {
      const current = channels.find((channel) => channel.type === base.type)
      return {
        ...base,
        id: current?.id || null,
        isActive: current?.is_active || false,
        channelName: current?.name || base.name,
        config: current?.config || {},
      }
    })
  }, [channels])

  const activeCount = mergedChannels.filter((channel) => channel.isActive).length
  const selectedChannel = mergedChannels.find((channel) => channel.type === selectedType) || mergedChannels[0]

  useEffect(() => {
    setDraftConfig(selectedChannel?.config || {})
  }, [selectedChannel])

  async function toggleChannel(channel) {
    if (!channel.id || !can('perm_connect_channels') || !ws) return
    const nextValue = !channel.isActive
    setChannels((current) => current.map((item) => item.id === channel.id ? { ...item, is_active: nextValue } : item))

    const { error: updateError } = await supabase
      .from('channels')
      .update({ is_active: nextValue })
      .eq('id', channel.id)
      .eq('workspace_id', ws.id)

    if (updateError) {
      setChannels((current) => current.map((item) => item.id === channel.id ? { ...item, is_active: channel.isActive } : item))
      setError(updateError.message || 'Nao foi possivel atualizar o canal.')
    }
  }

  async function saveChannelConfig(channel) {
    if (!ws || !can('perm_connect_channels')) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        workspace_id: ws.id,
        type: channel.type,
        name: draftConfig.channel_name?.trim() || channel.channelName || channel.name,
        is_active: channel.id ? channel.isActive : true,
        config: draftConfig,
      }

      if (channel.id) {
        const { error: updateError } = await supabase
          .from('channels')
          .update({ name: payload.name, config: payload.config })
          .eq('id', channel.id)
          .eq('workspace_id', ws.id)

        if (updateError) throw updateError
        setChannels((current) => current.map((item) => item.id === channel.id ? { ...item, name: payload.name, config: payload.config } : item))
      } else {
        const { data, error: insertError } = await supabase
          .from('channels')
          .insert(payload)
          .select('id, type, name, is_active, config, created_at')
          .single()

        if (insertError) throw insertError
        setChannels((current) => [data, ...current.filter((item) => item.type !== channel.type)])
      }
    } catch (err) {
      setError(err.message || 'Nao foi possivel salvar a configuracao do canal.')
    } finally {
      setSaving(false)
    }
  }

  if (!authLoading && workspaceReady && !ws) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Central de conexoes"
          title="Canais conectados com leitura imediata"
          description="Conecte esta conta a um workspace para habilitar canais, contatos e pipeline."
        />
        <EmptyState title="Workspace nao encontrado" description="Essa conta ainda nao foi vinculada a um workspace no Supabase." />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Central de conexoes"
        title="Canais conectados com leitura imediata"
        description="Configuracao editavel por canal com estados reais de ativacao e onboarding."
        actions={<StatusPill tone={activeCount ? 'success' : 'warning'}>{activeCount} ativos</StatusPill>}
      />

      {error ? (
        <EmptyState icon="!" title="Falha ao carregar os canais" description={error} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) 360px', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <GlassCard key={index} style={{ padding: 18, minHeight: 200 }}>
                  <SkeletonBlock width={48} height={48} radius={16} />
                  <SkeletonBlock width="42%" height={16} style={{ marginTop: 16 }} />
                  <SkeletonBlock width="100%" height={12} style={{ marginTop: 14 }} />
                  <SkeletonBlock width="84%" height={12} style={{ marginTop: 8 }} />
                </GlassCard>
              ))
            ) : mergedChannels.map((channel) => {
              const Icon = channel.icon
              const selected = selectedType === channel.type
              return (
                <GlassCard key={channel.type} interactive style={{ padding: 18 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedType(channel.type)}
                    style={{ background: 'transparent', border: 0, padding: 0, color: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 18,
                          display: 'grid',
                          placeItems: 'center',
                          background: channel.isActive ? 'rgba(16,185,129,.16)' : selected ? 'var(--selection-bg)' : 'rgba(255,255,255,.06)',
                          color: channel.isActive ? 'var(--success)' : selected ? 'var(--selection-text)' : 'var(--txt2)',
                        }}
                      >
                        <Icon size={22} />
                      </div>
                      <StatusPill tone={channel.isActive ? 'success' : 'default'}>
                        {channel.isActive ? 'Ativo' : channel.id ? 'Pausado' : 'Nao conectado'}
                      </StatusPill>
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{channel.channelName}</div>
                      <p style={{ marginTop: 8, color: 'var(--txt3)', lineHeight: 1.6 }}>{channel.description}</p>
                    </div>
                  </button>

                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    {channel.id ? (
                      <button
                        type="button"
                        className="workspace-button workspace-button--secondary"
                        onClick={() => toggleChannel(channel)}
                        disabled={!can('perm_connect_channels')}
                        style={{ flex: 1 }}
                      >
                        {channel.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="workspace-button"
                        onClick={() => setSelectedType(channel.type)}
                        style={{ flex: 1 }}
                      >
                        Configurar
                      </button>
                    )}
                  </div>
                </GlassCard>
              )
            })}
          </div>

          <GlassCard style={{ padding: 22, minHeight: 580 }}>
            {selectedChannel ? (
              <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: 28, fontFamily: 'var(--font-display)', letterSpacing: '-.04em' }}>
                      {selectedChannel.name}
                    </h2>
                    <p style={{ color: 'var(--txt3)', marginTop: 8 }}>{selectedChannel.description}</p>
                  </div>
                  <StatusPill tone={selectedChannel.isActive ? 'success' : 'warning'}>
                    {selectedChannel.isActive ? 'Recebendo trafego' : 'Onboarding pendente'}
                  </StatusPill>
                </div>

                {selectedChannel.type === 'whatsapp' ? (
                  <GlassCard style={{ margin: 0, padding: 18 }}>
                    <div style={{ display: 'grid', gap: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Smartphone size={16} color="var(--success)" />
                        <strong>Fluxo de QR Code</strong>
                      </div>
                      <div
                        style={{
                          width: 184,
                          height: 184,
                          margin: '0 auto',
                          borderRadius: 24,
                          background: '#fff',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <QRCodePreview />
                      </div>
                      <ol style={{ display: 'grid', gap: 8, color: 'var(--txt2)', paddingLeft: 18, lineHeight: 1.6 }}>
                        <li>Acesse Dispositivos vinculados no WhatsApp do celular.</li>
                        <li>Escaneie o QR e aguarde a sincronizacao inicial.</li>
                        <li>Ative o canal apenas depois do teste de envio.</li>
                      </ol>
                    </div>
                  </GlassCard>
                ) : null}

                <GlassCard style={{ margin: 0, padding: 18 }}>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <InfoRow label="Nome interno" value={selectedChannel.channelName} />
                    <InfoRow label="Status" value={selectedChannel.isActive ? 'Ativo' : 'Inativo'} />
                    <InfoRow label="Tipo" value={selectedChannel.type} />
                    <InfoRow label="Automacao sugerida" value={selectedChannel.type === 'whatsapp' ? 'Priorizar IA para mensagens fora do horario' : 'Usar regras leves com atribuicao por fila'} />
                  </div>
                </GlassCard>

                <GlassCard style={{ margin: 0, padding: 18 }}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>Configuracao do canal</div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <label style={{ display: 'grid', gap: 6 }}>
                      <span style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>Nome interno</span>
                      <input
                        className="workspace-input"
                        value={draftConfig.channel_name || selectedChannel.channelName || ''}
                        onChange={(event) => setDraftConfig((current) => ({ ...current, channel_name: event.target.value }))}
                        placeholder={selectedChannel.name}
                        disabled={!can('perm_connect_channels')}
                      />
                    </label>
                    {(CHANNEL_FIELDS[selectedChannel.type] || []).map((field) => (
                      <label key={field.key} style={{ display: 'grid', gap: 6 }}>
                        <span style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>{field.label}</span>
                        <input
                          className="workspace-input"
                          value={draftConfig[field.key] || ''}
                          onChange={(event) => setDraftConfig((current) => ({ ...current, [field.key]: event.target.value }))}
                          placeholder={field.placeholder}
                          disabled={!can('perm_connect_channels')}
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      className="workspace-button"
                      disabled={!can('perm_connect_channels') || saving}
                      onClick={() => saveChannelConfig(selectedChannel)}
                    >
                      {saving ? 'Salvando...' : selectedChannel.id ? 'Salvar configuracao' : 'Criar e conectar canal'}
                    </button>
                  </div>
                </GlassCard>

                <GlassCard style={{ margin: 0, padding: 18 }}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>Checklist de configuracao</div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <ChecklistItem label="Canal autenticado" checked={Boolean(selectedChannel.id)} />
                    <ChecklistItem label="Ativacao operacional" checked={selectedChannel.isActive} />
                    <ChecklistItem label="Permissao para editar" checked={can('perm_connect_channels')} />
                  </div>
                </GlassCard>
              </div>
            ) : (
              <EmptyState title="Escolha um canal" description="O painel lateral concentra QR, checklist e parametros por tipo." />
            )}
          </GlassCard>
        </div>
      )}
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

function ChecklistItem({ label, checked }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, borderRadius: 16, background: 'rgba(255,255,255,.03)' }}>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: checked ? 'var(--success)' : 'rgba(255,255,255,.08)',
          boxShadow: checked ? '0 0 24px rgba(16,185,129,.28)' : 'none',
        }}
      />
      <span style={{ color: 'var(--txt2)' }}>{label}</span>
    </div>
  )
}

function QRCodePreview() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <rect width="120" height="120" rx="20" fill="white" />
      <rect x="10" y="10" width="28" height="28" rx="4" stroke="#111827" strokeWidth="6" />
      <rect x="82" y="10" width="28" height="28" rx="4" stroke="#111827" strokeWidth="6" />
      <rect x="10" y="82" width="28" height="28" rx="4" stroke="#111827" strokeWidth="6" />
      <rect x="18" y="18" width="12" height="12" rx="1" fill="#111827" />
      <rect x="90" y="18" width="12" height="12" rx="1" fill="#111827" />
      <rect x="18" y="90" width="12" height="12" rx="1" fill="#111827" />
      <rect x="54" y="18" width="10" height="10" rx="1" fill="#111827" />
      <rect x="54" y="36" width="10" height="10" rx="1" fill="#111827" />
      <rect x="70" y="50" width="10" height="10" rx="1" fill="#111827" />
      <rect x="54" y="66" width="10" height="10" rx="1" fill="#111827" />
      <rect x="70" y="82" width="10" height="10" rx="1" fill="#111827" />
      <rect x="86" y="66" width="10" height="10" rx="1" fill="#111827" />
      <rect x="54" y="98" width="10" height="10" rx="1" fill="#111827" />
      <rect x="36" y="54" width="10" height="10" rx="1" fill="#111827" />
    </svg>
  )
}
