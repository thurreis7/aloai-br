import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, Bot, MessageSquare, RadioTower, Users2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { getChannelColor, getChannelLabel, normalizeChannelType } from '../lib/channels'
import {
  REALTIME_EVENTS,
  envelopeFromPostgresChange,
  shouldHandleRealtimeEnvelope,
} from '../lib/realtimeEvents'
import {
  CardHeader,
  EmptyState,
  GlassCard,
  MetricCard,
  PageHeader,
  PageShell,
  SkeletonBlock,
  StatusPill,
} from '../components/app/WorkspaceUI'

function startOfDay(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function labelForDay(value) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(value)
}

function hourLabel(value) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(value)
}

function isCopilotPaused(aiState) {
  if (!aiState || typeof aiState !== 'object' || Array.isArray(aiState)) return false
  const copilot = aiState.copilot
  if (!copilot || typeof copilot !== 'object' || Array.isArray(copilot)) return false
  if (copilot.paused === true) return true
  return String(copilot.mode || '').toLowerCase() === 'paused'
}

function isBacklogConversation(conversation) {
  const state = String(conversation?.state || conversation?.status || '').toLowerCase()
  return state !== 'closed' && state !== 'resolved'
}

export default function Dashboard() {
  const { ws, workspaceReady, loading: authLoading } = useAuth()
  const { can } = usePermissions()
  const canViewOpsMetrics = can('perm_reports_metrics')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
      if (authLoading || !workspaceReady) {
        setLoading(true)
        return
      }

      if (!ws?.id) {
        setStats(null)
        setLoading(false)
        return
      }

      if (!silent) setLoading(true)
      setError('')
      try {
        const since = new Date()
        since.setDate(since.getDate() - 6)
        since.setHours(0, 0, 0, 0)

        const [conversationsRes, messagesRes, channelsRes, membersRes, leadsRes] = await Promise.all([
          supabase
            .from('conversations')
            .select('id, status, state, priority, routing_queue, routing_intent, created_at, last_message_at, channel_id, assigned_to, ai_state, escalated_at, escalation_reason')
            .eq('workspace_id', ws.id)
            .gte('created_at', since.toISOString()),
          supabase
            .from('messages')
            .select('id, sender_type, created_at, conversation_id, conversations!inner(workspace_id)')
            .eq('conversations.workspace_id', ws.id)
            .gte('created_at', since.toISOString()),
          supabase
            .from('channels')
            .select('id, type, name, is_active')
            .eq('workspace_id', ws.id),
          supabase
            .from('workspace_members')
            .select('id, user_id, display_name, role, is_online')
            .eq('workspace_id', ws.id),
          supabase
            .from('leads')
            .select('id, status, owner_id, source_channel_id, conversation_id')
            .eq('workspace_id', ws.id),
        ])

        if (conversationsRes.error) throw conversationsRes.error
        if (messagesRes.error) throw messagesRes.error
        if (channelsRes.error) throw channelsRes.error
        if (leadsRes.error) throw leadsRes.error
        let members = []
        if (!membersRes.error && (membersRes.data || []).length) {
          members = membersRes.data || []
        } else {
          try {
            const workspaceUsersRes = await supabase
              .from('workspace_users')
              .select('id, user_id, role, created_at')
              .eq('workspace_id', ws.id)

            if (!workspaceUsersRes.error && (workspaceUsersRes.data || []).length) {
              const usersMembersExtendedRes = await supabase
                .from('users')
                .select('id, name, role, is_online')
                .eq('company_id', ws.id)

              const usersById = new Map((usersMembersExtendedRes.data || []).map((user) => [user.id, user]))
              members = (workspaceUsersRes.data || []).map((member) => ({
                id: member.id,
                user_id: member.user_id,
                display_name: usersById.get(member.user_id)?.name || 'Membro',
                role: member.role,
                is_online: Boolean(usersById.get(member.user_id)?.is_online),
              }))
            }
          } catch {
            members = []
          }

          if (!members.length) {
            const usersMembersExtendedRes = await supabase
              .from('users')
              .select('id, name, role, is_online')
              .eq('company_id', ws.id)

            let users = usersMembersExtendedRes.data || []
            if (usersMembersExtendedRes.error) {
              const usersMembersBasicRes = await supabase
                .from('users')
                .select('id, name, role, company_id')
                .eq('company_id', ws.id)

              if (usersMembersBasicRes.error) throw usersMembersBasicRes.error
              users = usersMembersBasicRes.data || []
            }

            members = users.map((user) => ({
              id: user.id,
              user_id: user.id,
              display_name: user.name,
              role: user.role,
              is_online: Boolean(user.is_online),
            }))
          }
        }
        const conversations = conversationsRes.data || []
        const messages = messagesRes.data || []
        const channels = channelsRes.data || []
        const leads = leadsRes.data || []

        const todayStart = startOfDay(new Date())
        const todayConversations = conversations.filter((item) => startOfDay(item.created_at) === todayStart)
        const resolvedToday = todayConversations.filter((item) => item.status === 'resolved').length
        const activeConversations = conversations.filter((item) => item.status !== 'resolved').length
        const aiMessages = messages.filter((item) => item.sender_type === 'bot' || item.sender_type === 'ai').length
        const responseMessages = messages.filter((item) => item.sender_type === 'agent').length

        const dayBuckets = Array.from({ length: 7 }, (_, index) => {
          const value = new Date(since)
          value.setDate(since.getDate() + index)
          return {
            key: startOfDay(value),
            label: labelForDay(value),
            volume: 0,
            resolved: 0,
          }
        })

        const bucketMap = new Map(dayBuckets.map((item) => [item.key, item]))

        conversations.forEach((item) => {
          const bucket = bucketMap.get(startOfDay(item.created_at))
          if (!bucket) return
          bucket.volume += 1
          if (item.status === 'resolved') bucket.resolved += 1
        })

        const channelVolume = channels.map((channel) => {
          const channelType = normalizeChannelType(channel.type)
          const count = conversations.filter((item) => item.channel_id === channel.id).length
          return {
            id: channel.id,
            name: channel.name || getChannelLabel(channelType),
            type: channelType,
            count,
            color: getChannelColor(channelType),
          }
        }).sort((a, b) => b.count - a.count)

        const agentPerformance = members.map((member) => {
          const assigned = conversations.filter((item) => item.assigned_to === member.user_id)
          return {
            id: member.id,
            name: member.display_name || 'Agente',
            role: member.role,
            online: member.is_online,
            total: assigned.length,
            resolved: assigned.filter((item) => item.status === 'resolved').length,
            lastSeen: assigned.reduce((latest, item) => {
              const value = item.last_message_at ? new Date(item.last_message_at).getTime() : 0
              return Math.max(latest, value)
            }, 0),
          }
        }).sort((a, b) => b.resolved - a.resolved)

        const timeline = Array.from({ length: 8 }, (_, index) => {
          const value = new Date()
          value.setHours(value.getHours() - (7 - index), 0, 0, 0)
          return {
            label: hourLabel(value),
            received: messages.filter((item) => {
              const date = new Date(item.created_at)
              return date.getHours() === value.getHours() && date.toDateString() === value.toDateString()
            }).length,
          }
        })

        const connectedChannels = channels.filter((channel) => channel.is_active).length
        const onlineAgents = members.filter((member) => member.is_online).length
        const qualifiedLeads = leads.filter((lead) => lead.status === 'qualified').length
        const disqualifiedLeads = leads.filter((lead) => lead.status === 'disqualified').length
        const backlogConversations = conversations.filter((conversation) => isBacklogConversation(conversation))
        const triageQueue = backlogConversations.filter((conversation) => (conversation.routing_queue || 'triagem') === 'triagem').length
        const queueBacklog = backlogConversations.reduce((acc, conversation) => {
          const queue = String(conversation.routing_queue || 'triagem').toLowerCase()
          acc[queue] = (acc[queue] || 0) + 1
          return acc
        }, {})
        const queueBacklogEntries = Object.entries(queueBacklog).sort((a, b) => b[1] - a[1])
        const unassignedConversations = backlogConversations.filter((conversation) => !conversation.assigned_to).length
        const escalatedConversations = backlogConversations.filter((conversation) => {
          const reason = String(conversation.escalation_reason || 'none').toLowerCase()
          return Boolean(conversation.escalated_at) || reason !== 'none'
        }).length
        const aiPausedConversations = backlogConversations.filter((conversation) => isCopilotPaused(conversation.ai_state)).length

        const metrics = [
          {
            label: 'Conversas ativas',
            value: activeConversations,
            hint: `${todayConversations.length} abertas hoje`,
            accent: 'var(--pri)',
          },
          {
            label: 'Resolvidas hoje',
            value: resolvedToday,
            hint: `${Math.round((resolvedToday / Math.max(todayConversations.length, 1)) * 100)}% de fechamento`,
            accent: 'var(--success)',
          },
          {
            label: 'Acoes por IA',
            value: aiMessages,
            hint: `${responseMessages} respostas humanas no periodo`,
            accent: 'var(--info)',
          },
          {
            label: 'Qualificacao',
            value: `${qualifiedLeads}/${Math.max(leads.length, 1)}`,
            hint: `${disqualifiedLeads} desqualificados`,
            accent: 'var(--warn)',
          },
        ]

        if (canViewOpsMetrics) {
          metrics.push({
            label: 'Backlog por fila',
            value: backlogConversations.length,
            hint: queueBacklogEntries.length
              ? `${queueBacklogEntries[0][0]}: ${queueBacklogEntries[0][1]}`
              : 'sem backlog no periodo',
            accent: 'var(--error)',
          })
        }

        setStats({
            metrics,
            dayBuckets,
            timeline,
            channelVolume,
            agentPerformance,
            workspaceName: ws?.name || 'ALO AI',
            totals: {
              connectedChannels,
              automationRate: Math.round((aiMessages / Math.max(messages.length, 1)) * 100),
              triageQueue,
              qualifiedLeads,
              onlineAgents,
              teamSize: Math.max(members.length, 1),
              queueBacklog: queueBacklogEntries,
              unassignedConversations,
              escalatedConversations,
              aiPausedConversations,
            },
          })
      } catch (err) {
        setError(err.message || 'Nao foi possivel carregar o dashboard.')
      } finally {
        setLoading(false)
      }
    }, [ws, workspaceReady, authLoading, canViewOpsMetrics])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (!ws?.id) return undefined

    const handleDashboardChange = (payload) => {
      const envelope = envelopeFromPostgresChange(payload, { workspaceId: ws.id })
      if (shouldHandleRealtimeEnvelope(envelope, ws.id, Object.values(REALTIME_EVENTS))) {
        loadDashboard({ silent: true })
      }
    }

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, handleDashboardChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, handleDashboardChange)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handleDashboardChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members' }, handleDashboardChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_users' }, handleDashboardChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, handleDashboardChange)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ws?.id, loadDashboard])

  const topChannel = useMemo(() => stats?.channelVolume?.[0], [stats])

  return (
    <PageShell>
      <PageHeader
        eyebrow="Operacao em tempo real"
        title="Dashboard premium da operacao"
        description="Leitura clara de volume, produtividade do time e impacto da IA, com foco em prioridade e decisao rapida."
        actions={topChannel ? <StatusPill tone="info">Canal lider: {topChannel.name}</StatusPill> : null}
      />

      {loading ? (
        <>
          <div className="workspace-grid workspace-grid--metrics">
            {Array.from({ length: 4 }).map((_, index) => (
              <GlassCard key={index} style={{ padding: 18 }}>
                <SkeletonBlock width="32%" height={12} />
                <SkeletonBlock width="48%" height={34} style={{ marginTop: 14 }} />
                <SkeletonBlock width="70%" height={14} style={{ marginTop: 14 }} />
              </GlassCard>
            ))}
          </div>
          <div className="workspace-grid workspace-grid--main">
            <GlassCard style={{ minHeight: 320 }}>
              <SkeletonBlock height={18} width="36%" style={{ margin: 22 }} />
              <SkeletonBlock height={240} width="calc(100% - 44px)" style={{ margin: '0 22px 22px' }} />
            </GlassCard>
            <GlassCard style={{ minHeight: 320 }}>
              <SkeletonBlock height={18} width="42%" style={{ margin: 22 }} />
              <SkeletonBlock height={48} width="calc(100% - 44px)" style={{ margin: '0 22px 12px' }} />
              <SkeletonBlock height={48} width="calc(100% - 44px)" style={{ margin: '0 22px 12px' }} />
              <SkeletonBlock height={48} width="calc(100% - 44px)" style={{ margin: '0 22px 22px' }} />
            </GlassCard>
          </div>
        </>
      ) : error ? (
        <EmptyState
          icon="!"
          title="Nao foi possivel montar o dashboard"
          description={error}
        />
      ) : !ws ? (
        <EmptyState
          title="Workspace nao selecionado"
          description="Selecione um workspace para visualizar os indicadores operacionais."
        />
      ) : !stats ? (
        <EmptyState
          title="Sem dados suficientes"
          description="Conecte canais e receba conversas para liberar a visao operacional."
        />
      ) : (
        <>
          <div className="workspace-grid workspace-grid--metrics">
            {stats.metrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                hint={metric.hint}
                accent={metric.accent}
              />
            ))}
          </div>

          <div className="workspace-grid workspace-grid--main">
            <GlassCard>
              <CardHeader
                title="Fluxo de conversas"
                description="Volume novo versus resolvido nos ultimos 7 dias."
                action={<StatusPill tone="default">{stats.workspaceName}</StatusPill>}
              />
              <div style={{ height: 310, padding: '18px 8px 18px 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.dayBuckets} margin={{ top: 16, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="receivedGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="resolvedGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                    <XAxis dataKey="label" stroke="var(--txt4)" tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--txt4)" tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,.08)',
                        background: 'rgba(16,14,26,.94)',
                        backdropFilter: 'blur(12px)',
                      }}
                    />
                    <Area type="monotone" dataKey="volume" stroke="#8B5CF6" fill="url(#receivedGradient)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="resolved" stroke="#10B981" fill="url(#resolvedGradient)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard>
              <CardHeader
                title="Canais com mais demanda"
                description="Prioridade de atendimento concentrada por origem."
                action={<StatusPill tone="success">{stats.totals.connectedChannels} ativos</StatusPill>}
              />
              <div style={{ padding: 22, display: 'grid', gap: 12 }}>
                {stats.channelVolume.length ? stats.channelVolume.map((channel) => (
                  <div
                    key={channel.id}
                    style={{
                      padding: 14,
                      borderRadius: 18,
                      border: '1px solid rgba(255,255,255,.06)',
                      background: 'rgba(255,255,255,.03)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{channel.name}</div>
                        <div style={{ color: 'var(--txt3)', fontSize: 13 }}>{channel.type}</div>
                      </div>
                      <StatusPill tone="info">{channel.count} conversas</StatusPill>
                    </div>
                    <div style={{ height: 8, marginTop: 12, borderRadius: 999, background: 'rgba(255,255,255,.05)' }}>
                      <div
                        style={{
                          width: `${Math.max((channel.count / Math.max(stats.channelVolume[0]?.count || 1, 1)) * 100, 8)}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: channel.color,
                          boxShadow: `0 0 24px ${channel.color}55`,
                        }}
                      />
                    </div>
                  </div>
                )) : (
                  <EmptyState
                    icon="~"
                    title="Nenhum canal conectado"
                    description="Assim que os canais forem ativados, a distribuicao operacional aparece aqui."
                  />
                )}
              </div>
            </GlassCard>
          </div>

          <div className="workspace-grid" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, .8fr)' }}>
            <GlassCard>
              <CardHeader
                title="Performance por agente"
                description="Quem mais resolveu e quem esta online agora."
                action={<StatusPill tone="warning">{stats.totals.automationRate}% IA</StatusPill>}
              />
              <div style={{ padding: 22, display: 'grid', gap: 12 }}>
                {stats.agentPerformance.length ? stats.agentPerformance.map((agent) => (
                  <div
                    key={agent.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) 90px 90px',
                      gap: 12,
                      alignItems: 'center',
                      padding: 14,
                      borderRadius: 18,
                      background: 'rgba(255,255,255,.03)',
                      border: '1px solid rgba(255,255,255,.06)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 14,
                            background: agent.online ? 'rgba(16,185,129,.16)' : 'rgba(255,255,255,.06)',
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 800,
                          }}
                        >
                          {agent.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{agent.name}</div>
                          <div style={{ fontSize: 13, color: 'var(--txt3)' }}>{agent.role}</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{agent.resolved}</div>
                      <div style={{ color: 'var(--txt3)', fontSize: 12 }}>resolvidas</div>
                    </div>
                    <div style={{ justifySelf: 'end' }}>
                      <StatusPill tone={agent.online ? 'success' : 'default'}>{agent.online ? 'Online' : 'Offline'}</StatusPill>
                    </div>
                  </div>
                )) : (
                  <EmptyState
                    title="Sem equipe cadastrada"
                    description="Adicione membros ao workspace para acompanhar produtividade."
                  />
                )}
              </div>
            </GlassCard>

            <GlassCard>
              <CardHeader
                title="Pulso do atendimento"
                description="Mensagens recebidas por hora no dia atual."
                action={<Activity size={16} color="var(--txt2)" />}
              />
              <div style={{ height: 320, padding: '18px 14px 18px 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.timeline} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="var(--txt4)" tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--txt4)" tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,.08)',
                        background: 'rgba(16,14,26,.94)',
                        backdropFilter: 'blur(12px)',
                      }}
                    />
                    <Bar dataKey="received" radius={[12, 12, 4, 4]}>
                      {stats.timeline.map((entry) => (
                        <Cell key={entry.label} fill={entry.received > 0 ? '#8B5CF6' : 'rgba(255,255,255,.12)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ padding: '0 22px 22px', display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <RadioTower size={16} color="var(--info)" />
                    <span style={{ color: 'var(--txt2)' }}>Mensagens recebidas</span>
                  </div>
                  <strong>{stats.timeline.reduce((sum, item) => sum + item.received, 0)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Bot size={16} color="var(--pri-l)" />
                    <span style={{ color: 'var(--txt2)' }}>Toques automatizados</span>
                  </div>
                  <strong>{stats.totals.automationRate}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Users2 size={16} color="var(--success)" />
                    <span style={{ color: 'var(--txt2)' }}>Time em plantao</span>
                  </div>
                  <strong>{`${stats.totals.onlineAgents}/${stats.totals.teamSize}`}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MessageSquare size={16} color="var(--info)" />
                    <span style={{ color: 'var(--txt2)' }}>Fila triagem</span>
                  </div>
                  <strong>{stats.totals.triageQueue}</strong>
                </div>
                {canViewOpsMetrics ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MessageSquare size={16} color="var(--warn)" />
                        <span style={{ color: 'var(--txt2)' }}>Sem dono</span>
                      </div>
                      <strong>{stats.totals.unassignedConversations}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MessageSquare size={16} color="var(--error)" />
                        <span style={{ color: 'var(--txt2)' }}>Escalonadas</span>
                      </div>
                      <strong>{stats.totals.escalatedConversations}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Bot size={16} color="var(--warn)" />
                        <span style={{ color: 'var(--txt2)' }}>IA pausada</span>
                      </div>
                      <strong>{stats.totals.aiPausedConversations}</strong>
                    </div>
                    <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                      <div style={{ color: 'var(--txt3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
                        Backlog por fila
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {stats.totals.queueBacklog.length ? stats.totals.queueBacklog.map(([queue, count]) => (
                          <StatusPill key={queue} tone="default">{queue}: {count}</StatusPill>
                        )) : <StatusPill tone="success">sem backlog</StatusPill>}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </PageShell>
  )
}
