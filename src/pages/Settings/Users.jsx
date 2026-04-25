import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { apiFetch } from '../../lib/api'

const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', supervisor: 'Supervisor', agent: 'Atendente' }
const ROLE_COLORS = {
  owner: { bg: 'rgba(245,158,11,.16)', color: '#fbbf24' },
  admin: { bg: 'rgba(148,163,184,.15)', color: 'var(--txt2)' },
  supervisor: { bg: 'rgba(148,163,184,.10)', color: 'var(--txt2)' },
  agent: { bg: 'rgba(148,163,184,.06)', color: 'var(--txt2)' },
}

const ROLE_DEFAULTS = {
  admin: {
    perm_channels_view: true, perm_channels_respond: true, perm_conv_scope: 'all',
    perm_reply: true, perm_transfer: true, perm_close: true, perm_kanban_move: true,
    perm_tags: true, perm_history: true, perm_kanban_view: true, perm_kanban_edit: true,
    perm_reports_metrics: true, perm_reports_team: true, perm_ai: true,
    perm_manage_users: true, perm_connect_channels: true, perm_integrations: true,
  },
  supervisor: {
    perm_channels_view: true, perm_channels_respond: true, perm_conv_scope: 'all',
    perm_reply: true, perm_transfer: true, perm_close: true, perm_kanban_move: true,
    perm_tags: true, perm_history: true, perm_kanban_view: true, perm_kanban_edit: true,
    perm_reports_metrics: true, perm_reports_team: true, perm_ai: true,
    perm_manage_users: false, perm_connect_channels: false, perm_integrations: false,
  },
  agent: {
    perm_channels_view: true, perm_channels_respond: true, perm_conv_scope: 'own',
    perm_reply: true, perm_transfer: false, perm_close: false, perm_kanban_move: false,
    perm_tags: true, perm_history: false, perm_kanban_view: true, perm_kanban_edit: false,
    perm_reports_metrics: false, perm_reports_team: false, perm_ai: true,
    perm_manage_users: false, perm_connect_channels: false, perm_integrations: false,
  },
}

const PERMISSION_FIELDS = [
  ['perm_channels_view', 'Visualizar canais'],
  ['perm_channels_respond', 'Responder nos canais'],
  ['perm_reply', 'Responder mensagens'],
  ['perm_transfer', 'Transferir conversa'],
  ['perm_close', 'Encerrar atendimento'],
  ['perm_kanban_move', 'Mover no Kanban'],
  ['perm_tags', 'Adicionar tags'],
  ['perm_history', 'Ver historico completo'],
  ['perm_kanban_view', 'Visualizar board'],
  ['perm_kanban_edit', 'Editar etapas'],
  ['perm_reports_metrics', 'Ver metricas gerais'],
  ['perm_reports_team', 'Ver desempenho da equipe'],
  ['perm_ai', 'Usar sugestoes da IA'],
  ['perm_manage_users', 'Gerenciar usuarios'],
  ['perm_connect_channels', 'Conectar canais'],
  ['perm_integrations', 'Alterar integracoes'],
]

async function loadCompanyUsers(companyId) {
  if (!companyId) return []

  const extendedRes = await supabase
    .from('users')
    .select('id, name, email, role, company_id, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })

  let users = extendedRes.data || []
  if (extendedRes.error) {
    const basicRes = await supabase
      .from('users')
      .select('id, name, email, role, company_id')
      .eq('company_id', companyId)

    if (basicRes.error) return []
    users = basicRes.data || []
  }

  return users.map((item) => ({
    id: item.id,
    name: item.name || 'Usuario',
    email: item.email,
    role: item.role || 'agent',
    company_id: item.company_id,
    created_at: item.created_at || null,
  }))
}

async function loadScopedPermissions(userId, scopedId) {
  if (!userId || !scopedId) return null

  const byCompany = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)
    .eq('company_id', scopedId)
    .maybeSingle()

  if (!byCompany.error) return byCompany.data

  const byWorkspace = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', scopedId)
    .maybeSingle()

  if (!byWorkspace.error) return byWorkspace.data

  const generic = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return generic.error ? null : generic.data
}

async function saveScopedPermissions(userId, scopedId, perms) {
  const payload = { ...perms, user_id: userId, company_id: scopedId }
  const byCompany = await supabase
    .from('user_permissions')
    .upsert(payload, { onConflict: 'user_id,company_id' })

  if (!byCompany.error) return true

  const byWorkspace = await supabase
    .from('user_permissions')
    .upsert({ ...perms, user_id: userId, workspace_id: scopedId }, { onConflict: 'user_id,workspace_id' })

  if (!byWorkspace.error) return true

  const generic = await supabase
    .from('user_permissions')
    .upsert({ ...perms, user_id: userId })

  return !generic.error
}

export default function UsersPage() {
  const { user: currentUser, wsRole, ws, isOwner } = useAuth()
  const { can } = usePermissions()
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(null)
  const [perms, setPerms] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  const scopedCompanyId = wsRole?.company_id || wsRole?.workspace_id || null

  useEffect(() => {
    async function load() {
      if (!scopedCompanyId) {
        setUsers([])
        setLoading(false)
        return
      }

      setLoading(true)
      const companyUsers = await loadCompanyUsers(scopedCompanyId)
      setUsers(companyUsers)
      setLoading(false)
    }

    load()
  }, [scopedCompanyId])

  useEffect(() => {
    if (!selected || !scopedCompanyId) {
      setPerms(null)
      return
    }

    async function loadPerms() {
      const data = await loadScopedPermissions(selected.id, scopedCompanyId)
      setPerms(data || ROLE_DEFAULTS[selected.role] || ROLE_DEFAULTS.agent)
    }

    loadPerms()
  }, [selected, scopedCompanyId])

  async function handleRoleChange(userId, newRole) {
    await supabase.from('users').update({ role: newRole }).eq('id', userId)

    setUsers((prev) => prev.map((item) => item.id === userId ? { ...item, role: newRole } : item))
    setSelected((prev) => prev?.id === userId ? { ...prev, role: newRole } : prev)
    setPerms(ROLE_DEFAULTS[newRole] || ROLE_DEFAULTS.agent)
  }

  async function handleSave() {
    if (!selected || !perms || !scopedCompanyId) return
    setSaving(true)
    const ok = await saveScopedPermissions(selected.id, scopedCompanyId, perms)
    setSaving(false)

    if (!ok) return
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  if (!(isOwner || can('perm_manage_users'))) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
        <div style={styles.emptyTitle}>Acesso restrito</div>
        <div style={styles.emptyDesc}>Voce nao tem permissao para gerenciar usuarios.</div>
      </div>
    )
  }

  if (!scopedCompanyId) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏢</div>
        <div style={styles.emptyTitle}>Cliente nao selecionado</div>
        <div style={styles.emptyDesc}>Selecione um cliente em Configuracoes para gerenciar usuarios.</div>
      </div>
    )
  }

  return (
    <div style={styles.root}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div>
            <div style={styles.sidebarTitle}>Usuarios</div>
            <div style={styles.sidebarCount}>{users.length} cadastrado{users.length !== 1 ? 's' : ''}</div>
          </div>
          {isOwner ? <button style={styles.inviteBtn} onClick={() => setShowInvite(true)}>+ Convidar</button> : null}
        </div>

        {loading ? (
          <div style={styles.listLoading}>Carregando...</div>
        ) : users.map((item) => (
          <button
            key={item.id}
            type="button"
            style={{ ...styles.userItem, ...(selected?.id === item.id ? styles.userItemActive : {}) }}
            onClick={() => setSelected(item)}
          >
            <div style={{ ...styles.userAvatar, background: 'var(--bg-s2)' }}>
              <span style={{ color: 'var(--txt2)', fontSize: '13px', fontWeight: 600 }}>
                {item.name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?'}
              </span>
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>
                {item.name}
                {item.id === currentUser?.id ? <span style={styles.youBadge}>voce</span> : null}
              </div>
              <div style={styles.userEmail}>{item.email}</div>
            </div>
            <span style={{ ...styles.roleBadge, ...(ROLE_COLORS[item.role] || ROLE_COLORS.agent) }}>
              {ROLE_LABELS[item.role] || item.role}
            </span>
          </button>
        ))}
      </div>

      <div style={styles.editor}>
        {!selected ? (
          <div style={styles.empty}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>👈</div>
            <div style={styles.emptyTitle}>Selecione um usuario</div>
            <div style={styles.emptyDesc}>Clique em um usuario para editar seu papel e permissoes.</div>
          </div>
        ) : (
          <>
            <div style={styles.editorHeader}>
              <div style={styles.editorUserInfo}>
                <div style={{ ...styles.userAvatarLg, background: 'var(--bg-s2)' }}>
                  <span style={{ color: 'var(--txt2)', fontSize: '16px', fontWeight: 600 }}>
                    {selected.name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <div style={styles.editorName}>{selected.name}</div>
                  <div style={styles.editorEmail}>{selected.email}</div>
                </div>
              </div>

              {selected.role !== 'owner' ? (
                <div style={styles.roleSection}>
                  <div style={styles.roleLabel}>Perfil</div>
                  <div style={styles.roleButtons}>
                    {['admin', 'supervisor', 'agent'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        disabled={selected.id === currentUser?.id}
                        onClick={() => handleRoleChange(selected.id, role)}
                        style={{
                          ...styles.roleBtn,
                          ...(selected.role === role ? styles.roleBtnActive : {}),
                        }}
                      >
                        {ROLE_LABELS[role]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={styles.adminNote}>Owner global com bypass total de tenant.</div>
              )}
            </div>

            {selected.role !== 'admin' && selected.role !== 'owner' && perms ? (
              <>
                <div style={styles.scopeRow}>
                  <div style={styles.permLabel}>Conversas que pode ver</div>
                  <div style={styles.scopeBtns}>
                    {['own', 'team', 'all'].map((scope) => (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => setPerms((current) => ({ ...current, perm_conv_scope: scope }))}
                        style={{ ...styles.scopeBtn, ...(perms.perm_conv_scope === scope ? styles.scopeBtnActive : {}) }}
                      >
                        {scope}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.permGroups}>
                  {PERMISSION_FIELDS.map(([key, label]) => (
                    <label key={key} style={styles.permRow}>
                      <span style={styles.permLabel}>{label}</span>
                      <div
                        onClick={() => setPerms((current) => ({ ...current, [key]: !current[key] }))}
                        style={{ ...styles.toggle, ...(perms[key] ? styles.toggleOn : {}) }}
                      >
                        <div style={{ ...styles.toggleThumb, ...(perms[key] ? styles.toggleThumbOn : {}) }} />
                      </div>
                    </label>
                  ))}
                </div>

                <div style={styles.saveRow}>
                  {savedMsg ? <span style={styles.savedMsg}>Permissoes salvas</span> : null}
                  <button type="button" onClick={handleSave} disabled={saving} style={{ ...styles.saveBtn, opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Salvando...' : 'Salvar permissoes'}
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.adminNote}>Este perfil ja possui acesso amplo dentro do cliente selecionado.</div>
            )}
          </>
        )}
      </div>

      {showInvite ? <InviteModal companyId={scopedCompanyId} onClose={() => setShowInvite(false)} onCreated={(user) => {
        setUsers((prev) => [...prev, user])
        setShowInvite(false)
      }} /> : null}
    </div>
  )
}

function InviteModal({ companyId, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('agent')
  const [pass, setPass] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleCreate() {
    if (!name.trim() || !email.trim() || !pass.trim()) {
      setErr('Preencha todos os campos obrigatorios.')
      return
    }

    setSaving(true)
    setErr('')

    try {
      const res = await apiFetch(`/workspaces/${companyId}/members`, {
        method: 'POST',
        body: JSON.stringify({
          fullName: name,
          email,
          password: pass,
          role,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar usuario.')

      onCreated({
        id: data.user.id,
        name: data.user.full_name,
        email: data.user.email,
        role: data.user.role,
        company_id: companyId,
      })
    } catch (error) {
      setErr(error.message || 'Erro ao criar usuario.')
      setSaving(false)
    }
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>Adicionar usuario</div>
          <button type="button" style={styles.modalClose} onClick={onClose}>×</button>
        </div>

        <div style={styles.modalBody}>
          <Field label="Nome completo *" value={name} onChange={setName} placeholder="Ex: Ana Souza" />
          <Field label="E-mail *" value={email} onChange={setEmail} placeholder="ana@empresa.com" type="email" />
          <Field label="Senha inicial *" value={pass} onChange={setPass} placeholder="empresa123" type="password" />

          <div style={{ marginTop: '8px' }}>
            <div style={styles.fieldLabel}>Perfil *</div>
            <div style={styles.roleButtons}>
              {['admin', 'supervisor', 'agent'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRole(item)}
                  style={{ ...styles.roleBtn, ...(role === item ? styles.roleBtnActive : {}) }}
                >
                  {ROLE_LABELS[item]}
                </button>
              ))}
            </div>
          </div>

          {err ? <div style={styles.errorMsg}>{err}</div> : null}
        </div>

        <div style={styles.modalFooter}>
          <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button type="button" style={{ ...styles.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={handleCreate} disabled={saving}>
            {saving ? 'Criando...' : 'Criar usuario'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={styles.fieldLabel}>{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...styles.input, borderColor: focused ? 'var(--pri, #7c3aed)' : 'rgba(255,255,255,.1)' }}
      />
    </div>
  )
}

const styles = {
  root: { display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-page, #0c0b14)', fontFamily: 'var(--font, DM Sans, sans-serif)' },
  sidebar: { width: '280px', flexShrink: 0, background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidebarHeader: { padding: '18px 16px', background: 'color-mix(in srgb, var(--bg-page) 70%, transparent)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sidebarTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--txt1, #f5f3ff)' },
  sidebarCount: { fontSize: '11px', color: 'var(--txt3, #5a5272)', marginTop: '2px' },
  inviteBtn: { fontSize: '12px', fontWeight: 600, padding: '6px 12px', background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.35)', color: '#a78bfa', borderRadius: '8px', cursor: 'pointer' },
  listLoading: { padding: '20px 16px', fontSize: '13px', color: 'var(--txt3, #5a5272)' },
  userItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', transition: 'background .15s', borderBottom: '1px solid rgba(255,255,255,.03)', borderLeft: '2px solid transparent', background: 'transparent', textAlign: 'left' },
  userItemActive: { background: 'rgba(124,58,237,.1)', borderLeftColor: '#7c3aed' },
  userAvatar: { width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  userAvatarLg: { width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: '12.5px', fontWeight: 600, color: 'var(--txt1, #f5f3ff)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  youBadge: { fontSize: '9px', padding: '1px 6px', borderRadius: '10px', background: 'rgba(255,255,255,.08)', color: 'var(--txt3, #5a5272)' },
  userEmail: { fontSize: '11px', color: 'var(--txt3, #5a5272)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' },
  roleBadge: { fontSize: '9.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', flexShrink: 0 },
  editor: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '24px' },
  empty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  emptyTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--txt1, #f5f3ff)', marginBottom: '6px' },
  emptyDesc: { fontSize: '13px', color: 'var(--txt3, #5a5272)', textAlign: 'center', lineHeight: '1.6' },
  editorHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' },
  editorUserInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  editorName: { fontSize: '16px', fontWeight: 600, color: 'var(--txt1, #f5f3ff)' },
  editorEmail: { fontSize: '12px', color: 'var(--txt3, #5a5272)', marginTop: '2px' },
  roleSection: { display: 'flex', flexDirection: 'column', gap: '6px' },
  roleLabel: { fontSize: '11px', fontWeight: 600, color: 'var(--txt3, #5a5272)', letterSpacing: '.08em', textTransform: 'uppercase' },
  roleButtons: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  roleBtn: { padding: '6px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--txt3)', transition: 'all .15s', fontFamily: 'var(--font)' },
  roleBtnActive: { background: 'var(--bg-el)', color: 'var(--txt1)', borderColor: 'var(--border2)' },
  adminNote: { padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--txt2)' },
  permGroups: { display: 'grid', gap: '8px' },
  permRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', border: '1px solid rgba(255,255,255,.04)', borderRadius: '12px', background: 'color-mix(in srgb, var(--bg-card) 55%, transparent)' },
  permLabel: { fontSize: '13px', color: 'var(--txt2, #a89fc4)' },
  scopeRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', marginBottom: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,.04)', background: 'color-mix(in srgb, var(--bg-card) 55%, transparent)' },
  scopeBtns: { display: 'flex', gap: '5px' },
  scopeBtn: { fontSize: '11.5px', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--txt3)', cursor: 'pointer', transition: 'all .15s', fontFamily: 'var(--font)' },
  scopeBtnActive: { background: 'var(--bg-el)', borderColor: 'var(--border2)', color: 'var(--txt1)' },
  toggle: { width: '38px', height: '20px', borderRadius: '10px', background: 'var(--bg-s3)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 },
  toggleOn: { background: 'var(--pri)' },
  toggleThumb: { position: 'absolute', top: '3px', left: '3px', width: '14px', height: '14px', borderRadius: '50%', background: 'var(--txt4)', transition: 'left .2s, background .2s' },
  toggleThumbOn: { left: '21px', background: '#fff' },
  saveRow: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' },
  savedMsg: { fontSize: '13px', color: 'var(--success)' },
  saveBtn: { padding: '10px 24px', borderRadius: '9px', background: 'var(--pri)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s', fontFamily: 'var(--font)' },
  cancelBtn: { padding: '10px 20px', borderRadius: '9px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--txt2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: 'color-mix(in srgb, var(--bg-card) 88%, transparent)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '16px', width: '440px', maxWidth: '95vw' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' },
  modalTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--txt1)' },
  modalClose: { background: 'none', border: 'none', color: 'var(--txt3)', fontSize: '16px', cursor: 'pointer', padding: '4px' },
  modalBody: { padding: '20px' },
  modalFooter: { display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid var(--border)' },
  fieldLabel: { fontSize: '12px', fontWeight: 600, color: 'var(--txt3)', marginBottom: '6px' },
  input: { width: '100%', background: 'var(--bg-s1)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 12px', color: 'var(--txt1)', fontSize: '13px', outline: 'none', transition: 'border-color .15s', fontFamily: 'var(--font)' },
  errorMsg: { marginTop: '10px', fontSize: '12.5px', color: '#ef4444', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '8px', padding: '8px 12px' },
}
