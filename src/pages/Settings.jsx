import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Lock, Palette, Shield, UserRound } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { supabase } from '../lib/supabase'
import { GlassCard, PageHeader, PageShell, StatusPill } from '../components/app/WorkspaceUI'

export default function Settings() {
  const { user, ws, wsRole, isOwner, workspaces, switchWorkspace } = useAuth()
  const { can } = usePermissions()
  const outlet = useOutletContext() || {}
  const [colorPreset, setColorPreset] = useState(() => localStorage.getItem('alo-theme-accent') || 'padrao')
  const [profileName, setProfileName] = useState('')
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', slug: '', plan: 'starter', ai_enabled: false })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingWorkspace, setSavingWorkspace] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    localStorage.setItem('alo-theme-accent', colorPreset)
  }, [colorPreset])

  useEffect(() => {
    setProfileName(user?.user_metadata?.full_name || '')
  }, [user])

  useEffect(() => {
    setWorkspaceForm({
      name: ws?.name || '',
      slug: ws?.slug || '',
      plan: ws?.plan || 'starter',
      ai_enabled: Boolean(ws?.ai_enabled),
    })
  }, [ws])

  async function saveProfile() {
    if (!user) return
    setSavingProfile(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: profileName } })
      if (error) throw error

      if (wsRole?.workspace_id) {
        await supabase
          .from('workspace_members')
          .update({ display_name: profileName })
          .eq('workspace_id', wsRole.workspace_id)
          .eq('user_id', user.id)

        await supabase
          .from('workspace_users')
          .update({ full_name: profileName, display_name: profileName })
          .eq('workspace_id', wsRole.workspace_id)
          .eq('user_id', user.id)
      }

      await supabase.from('profiles').update({ full_name: profileName }).eq('id', user.id)
      await supabase.from('users').update({ name: profileName }).eq('id', user.id)

      setMessage('Perfil salvo com sucesso.')
    } catch (err) {
      setMessage(err.message || 'Nao foi possivel salvar o perfil.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveWorkspace() {
      if (!ws?.id || !(isOwner || can('perm_integrations'))) return
    setSavingWorkspace(true)
    setMessage('')
    try {
      const { error } = await supabase
        .from('workspaces')
        .update(workspaceForm)
        .eq('id', ws.id)

      if (error) throw error
      setMessage('Workspace salvo com sucesso.')
    } catch (err) {
      setMessage(err.message || 'Nao foi possivel salvar o workspace.')
    } finally {
      setSavingWorkspace(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Configuracoes"
        title="Preferencias pessoais e do workspace"
        description="Perfil, empresa, tema e seguranca sem quebrar a estrutura atual do produto."
        actions={<StatusPill tone="default">{outlet.theme === 'light' ? 'Light' : 'Dark'} mode</StatusPill>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <GlassCard style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
            <UserRound size={18} color="var(--pri-l)" />
            <strong>Perfil</strong>
          </div>
          <InfoRow label="Usuario" value={user?.email || 'Nao autenticado'} />
          <InfoRow label="Workspace" value={ws?.name || (isOwner ? 'Selecione um workspace' : 'Sem workspace')} />
          {isOwner && workspaces.length ? (
            <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
              <span style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>Workspace ativo</span>
              <select className="workspace-select" value={ws?.id || ''} onChange={(event) => switchWorkspace(event.target.value)}>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>Nome exibido</span>
            <input className="workspace-input" value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Seu nome" />
          </label>
          <button type="button" className="workspace-button workspace-button--secondary" style={{ display: 'inline-flex', marginTop: 14 }} onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </GlassCard>

        <GlassCard style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
            <Palette size={18} color="var(--warn)" />
            <strong>Tema</strong>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="workspace-button" onClick={outlet.toggleTheme}>
              Alternar para {outlet.theme === 'dark' ? 'light' : 'dark'}
            </button>
            {['padrao', 'violeta', 'azul'].map((preset) => (
              <button
                key={preset}
                type="button"
                className="workspace-button workspace-button--secondary"
                onClick={() => setColorPreset(preset)}
                style={{ borderColor: colorPreset === preset ? 'rgba(139,92,246,.35)' : undefined }}
              >
                {preset}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
            <Shield size={18} color="var(--success)" />
            <strong>Empresa</strong>
          </div>
          <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            <span style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>Nome do workspace</span>
            <input className="workspace-input" value={workspaceForm.name} onChange={(event) => setWorkspaceForm((current) => ({ ...current, name: event.target.value }))} disabled={!(isOwner || can('perm_integrations'))} />
          </label>
          <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            <span style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>Slug</span>
            <input className="workspace-input" value={workspaceForm.slug} onChange={(event) => setWorkspaceForm((current) => ({ ...current, slug: event.target.value }))} disabled={!(isOwner || can('perm_integrations'))} />
          </label>
          <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            <span style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>Plano</span>
            <select className="workspace-select" value={workspaceForm.plan} onChange={(event) => setWorkspaceForm((current) => ({ ...current, plan: event.target.value }))} disabled={!(isOwner || can('perm_integrations'))}>
              <option value="starter">starter</option>
              <option value="growth">growth</option>
              <option value="business">business</option>
            </select>
          </label>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--txt2)' }}>
            <input type="checkbox" checked={workspaceForm.ai_enabled} onChange={(event) => setWorkspaceForm((current) => ({ ...current, ai_enabled: event.target.checked }))} disabled={!(isOwner || can('perm_integrations'))} />
            IA habilitada
          </label>
          <button type="button" className="workspace-button workspace-button--secondary" style={{ display: 'inline-flex', marginTop: 14 }} onClick={saveWorkspace} disabled={(!(isOwner || can('perm_integrations'))) || savingWorkspace}>
            {savingWorkspace ? 'Salvando...' : 'Salvar workspace'}
          </button>
        </GlassCard>

        <GlassCard style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
            <Lock size={18} color="var(--err)" />
            <strong>Seguranca</strong>
          </div>
          <InfoRow label="Sessao" value="Protegida pelo Supabase Auth" />
          <InfoRow label="Acesso" value="Bearer token para API REST" />
          {isOwner || can('perm_manage_users') ? (
            <Link to="/app/settings/users" className="workspace-button workspace-button--secondary" style={{ display: 'inline-flex', marginTop: 14, textDecoration: 'none' }}>
              Gerenciar usuarios
            </Link>
          ) : null}
        </GlassCard>
      </div>

      {message ? <div style={{ color: 'var(--txt2)' }}>{message}</div> : null}
    </PageShell>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
      <span style={{ color: 'var(--txt4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span>
      <span style={{ color: 'var(--txt2)' }}>{value}</span>
    </div>
  )
}
