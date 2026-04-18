import { useEffect, useState } from 'react'
import { Activity, UserCog } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { EmptyState, GlassCard, PageHeader, PageShell, SkeletonBlock, StatusPill } from '../components/app/WorkspaceUI'

export default function Team() {
  const { ws, loading: authLoading, workspaceReady } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [members, setMembers] = useState([])

  useEffect(() => {
    let active = true

    async function loadMembers() {
      if (authLoading || !workspaceReady) {
        setLoading(true)
        setError('')
        return
      }

      if (!ws) {
        setMembers([])
        setLoading(false)
        setError('')
        return
      }

      setLoading(true)
      setError('')
      try {
        const [membersRes, usersRes] = await Promise.all([
          supabase.from('workspace_members').select('id, user_id, display_name, role, is_online, created_at').eq('workspace_id', ws.id).order('created_at', { ascending: true }),
          supabase.from('users').select('id, name, email, role'),
        ])
        if (membersRes.error) throw membersRes.error
        if (usersRes.error) throw usersRes.error

        const usersById = new Map((usersRes.data || []).map((user) => [user.id, user]))
        const nextMembers = (membersRes.data || []).map((member) => ({
          ...member,
          name: member.display_name || usersById.get(member.user_id)?.name || 'Membro',
          email: usersById.get(member.user_id)?.email || 'Sem e-mail',
        }))

        if (active) setMembers(nextMembers)
      } catch (err) {
        if (active) setError(err.message || 'Nao foi possivel carregar a equipe.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMembers()

    const channel = supabase
      .channel('workspace-members-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members' }, () => loadMembers())
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [ws, authLoading, workspaceReady])

  if (!authLoading && workspaceReady && !ws) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Equipe"
          title="Time sincronizado com status em tempo real"
          description="Conecte um workspace para controlar acessos por cliente e equipe."
        />
        <EmptyState title="Workspace nao encontrado" description="Essa conta ainda nao foi vinculada ao workspace no Supabase." />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Equipe"
        title="Time sincronizado com status em tempo real"
        description="Ritmo da operacao por membro, funcao e disponibilidade para distribuicao de carga."
        actions={<StatusPill tone="success">{members.filter((member) => member.is_online).length} online</StatusPill>}
      />

      {loading ? (
        <div style={{ display: 'grid', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <GlassCard key={index} style={{ padding: 20 }}>
              <SkeletonBlock height={16} width="22%" />
              <SkeletonBlock height={14} width="46%" style={{ marginTop: 10 }} />
            </GlassCard>
          ))}
        </div>
      ) : error ? (
        <EmptyState icon="!" title="Falha ao carregar a equipe" description={error} />
      ) : !members.length ? (
        <EmptyState title="Nenhum membro encontrado" description="Associe usuarios ao workspace para acompanhar presenca e funcao." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {members.map((member) => (
            <GlassCard key={member.id} interactive style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 18,
                    background: member.is_online ? 'rgba(16,185,129,.16)' : 'rgba(255,255,255,.06)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                  }}
                >
                  {member.name.slice(0, 1).toUpperCase()}
                </div>
                <StatusPill tone={member.is_online ? 'success' : 'default'}>
                  {member.is_online ? 'Online' : 'Offline'}
                </StatusPill>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{member.name}</div>
                <div style={{ color: 'var(--txt3)', marginTop: 6 }}>{member.email}</div>
              </div>

              <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
                <Row icon={<UserCog size={14} color="var(--txt2)" />} label="Papel" value={member.role} />
                <Row icon={<Activity size={14} color="var(--success)" />} label="Realtime" value={member.is_online ? 'Disponivel para receber fila' : 'Fora da operacao'} />
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </PageShell>
  )
}

function Row({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 12, borderRadius: 16, background: 'rgba(255,255,255,.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--txt3)' }}>
        {icon}
        <span>{label}</span>
      </div>
      <strong style={{ textTransform: 'capitalize' }}>{value}</strong>
    </div>
  )
}
