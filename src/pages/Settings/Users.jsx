import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'

/* ─── Permission groups ─── */
const PERM_GROUPS = [
  {
    group: 'Canais',
    icon: '📡',
    perms: [
      { key: 'perm_channels_view',    label: 'Visualizar canais' },
      { key: 'perm_channels_respond', label: 'Responder nos canais' },
    ],
  },
  {
    group: 'Conversas',
    icon: '💬',
    perms: [], // conv_scope tem select, não checkbox — tratado separado
    hasScope: true,
  },
  {
    group: 'Ações no atendimento',
    icon: '⚡',
    perms: [
      { key: 'perm_reply',      label: 'Responder mensagens' },
      { key: 'perm_transfer',   label: 'Transferir conversa' },
      { key: 'perm_close',      label: 'Encerrar atendimento' },
      { key: 'perm_kanban_move',label: 'Mover no Kanban' },
      { key: 'perm_tags',       label: 'Adicionar tags' },
      { key: 'perm_history',    label: 'Ver histórico completo' },
    ],
  },
  {
    group: 'Kanban',
    icon: '📋',
    perms: [
      { key: 'perm_kanban_view', label: 'Visualizar board' },
      { key: 'perm_kanban_edit', label: 'Editar etapas' },
    ],
  },
  {
    group: 'Relatórios',
    icon: '📊',
    perms: [
      { key: 'perm_reports_metrics', label: 'Ver métricas gerais' },
      { key: 'perm_reports_team',    label: 'Ver desempenho da equipe' },
    ],
  },
  {
    group: 'Agente IA',
    icon: '🤖',
    perms: [
      { key: 'perm_ai', label: 'Usar sugestões da IA' },
    ],
  },
  {
    group: 'Configurações',
    icon: '⚙️',
    perms: [
      { key: 'perm_manage_users',     label: 'Gerenciar usuários' },
      { key: 'perm_connect_channels', label: 'Conectar canais' },
      { key: 'perm_integrations',     label: 'Alterar integrações' },
    ],
  },
]

const ROLE_LABELS = { admin: 'Admin', supervisor: 'Supervisor', agent: 'Atendente' }
const ROLE_COLORS = {
  admin:      { bg: 'rgba(148,163,184,.15)', color: 'var(--txt2)' },
  supervisor: { bg: 'rgba(148,163,184,.10)', color: 'var(--txt2)' },
  agent:      { bg: 'rgba(148,163,184,.06)', color: 'var(--txt2)' },
}

/* ─── MAIN COMPONENT ─── */
export default function UsersPage() {
  const { user: currentUser, wsRole } = useAuth()
  const { can } = usePermissions()

  const [users, setUsers]           = useState([])
  const [selected, setSelected]     = useState(null) // user being edited
  const [perms, setPerms]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [savedMsg, setSavedMsg]     = useState(false)

  // Load users
  useEffect(() => {
    async function load() {
      const workspaceId = wsRole?.workspace_id
      if (!workspaceId) {
        setUsers([])
        setLoading(false)
        return
      }

      const { data: members } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)

      const ids = (members || []).map((item) => item.user_id)
      if (!ids.length) {
        setUsers([])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .in('id', ids)
        .order('created_at', { ascending: true })

      setUsers(data || [])
      setLoading(false)
    }
    load()
  }, [wsRole])

  // Load permissions when selecting a user
  useEffect(() => {
    if (!selected) { setPerms(null); return }
    async function loadPerms() {
      const { data } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', selected.id)
        .eq('workspace_id', wsRole?.workspace_id)
        .maybeSingle()
      setPerms(data || {})
    }
    loadPerms()
  }, [selected, wsRole])

  const handleRoleChange = async (userId, newRole) => {
    await supabase.from('users').update({ role: newRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? {...u, role: newRole} : u))
    if (selected?.id === userId) setSelected(prev => ({...prev, role: newRole}))
  }

  const handlePermChange = (key, value) => {
    setPerms(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!selected || !perms) return
    setSaving(true)
    await supabase
      .from('user_permissions')
      .upsert({ ...perms, user_id: selected.id, workspace_id: wsRole?.workspace_id }, { onConflict: 'user_id,workspace_id' })
    setSaving(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  if (!can('perm_manage_users')) {
    return (
      <div style={styles.empty}>
        <div style={{fontSize:'32px', marginBottom:'12px'}}>🔒</div>
        <div style={styles.emptyTitle}>Acesso restrito</div>
        <div style={styles.emptyDesc}>Você não tem permissão para gerenciar usuários.</div>
      </div>
    )
  }

  return (
    <div style={styles.root}>

      {/* LEFT — user list */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div>
            <div style={styles.sidebarTitle}>Usuários</div>
            <div style={styles.sidebarCount}>{users.length} cadastrado{users.length !== 1 ? 's' : ''}</div>
          </div>
          <button style={styles.inviteBtn} onClick={() => setShowInvite(true)}>
            + Convidar
          </button>
        </div>

        {loading
          ? <div style={styles.listLoading}>Carregando...</div>
          : users.map(u => (
            <div
              key={u.id}
              style={{
                ...styles.userItem,
                ...(selected?.id === u.id ? styles.userItemActive : {}),
              }}
              onClick={() => setSelected(u)}
            >
              <div style={{...styles.userAvatar, background: 'var(--bg-s2)'}}>
                <span style={{color: 'var(--txt2)', fontSize:'13px', fontWeight:600}}>
                  {u.name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() || '?'}
                </span>
              </div>
              <div style={styles.userInfo}>
                <div style={styles.userName}>
                  {u.name}
                  {u.id === currentUser?.id && (
                    <span style={styles.youBadge}>você</span>
                  )}
                </div>
                <div style={styles.userEmail}>{u.email}</div>
              </div>
              <span style={{...styles.roleBadge, ...ROLE_COLORS[u.role]}}>
                {ROLE_LABELS[u.role]}
              </span>
            </div>
          ))
        }
      </div>

      {/* RIGHT — permissions editor */}
      <div style={styles.editor}>
        {!selected ? (
          <div style={styles.empty}>
            <div style={{fontSize:'32px', marginBottom:'12px'}}>👈</div>
            <div style={styles.emptyTitle}>Selecione um usuário</div>
            <div style={styles.emptyDesc}>Clique em um usuário para configurar suas permissões.</div>
          </div>
        ) : (
          <>
            {/* Editor header */}
            <div style={styles.editorHeader}>
              <div style={styles.editorUserInfo}>
                <div style={{...styles.userAvatarLg, background: 'var(--bg-s2)'}}>
                  <span style={{color: 'var(--txt2)', fontSize:'16px', fontWeight:600}}>
                    {selected.name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <div style={styles.editorName}>{selected.name}</div>
                  <div style={styles.editorEmail}>{selected.email}</div>
                </div>
              </div>

              {/* Role selector */}
              <div style={styles.roleSection}>
                <div style={styles.roleLabel}>Perfil</div>
                <div style={styles.roleButtons}>
                  {['admin','supervisor','agent'].map(r => (
                    <button
                      key={r}
                      disabled={selected.id === currentUser?.id}
                      onClick={() => handleRoleChange(selected.id, r)}
                      style={{
                        ...styles.roleBtn,
                        ...(selected.role === r ? {
                          background: 'var(--bg-el)',
                          color: 'var(--txt1)',
                          borderColor: 'var(--border2)',
                        } : {}),
                      }}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
                {selected.id === currentUser?.id && (
                  <div style={styles.selfNote}>Não é possível alterar seu próprio perfil</div>
                )}
              </div>
            </div>

            {/* Admin shortcut */}
            {selected.role === 'admin' && (
              <div style={styles.adminNote}>
                <span style={{fontSize:'16px'}}>👑</span>
                <span>Admins têm acesso total automaticamente. As permissões abaixo não se aplicam.</span>
              </div>
            )}

            {/* Permission groups */}
            {perms && selected.role !== 'admin' && (
              <div style={styles.permGroups}>
                {PERM_GROUPS.map(group => (
                  <div key={group.group} style={styles.permGroup}>
                    <div style={styles.permGroupHeader}>
                      <span style={{fontSize:'15px'}}>{group.icon}</span>
                      <span style={styles.permGroupTitle}>{group.group}</span>
                    </div>

                    {/* Scope selector for Conversas */}
                    {group.hasScope && (
                      <div style={styles.scopeRow}>
                        <div style={styles.permLabel}>Conversas que pode ver</div>
                        <div style={styles.scopeBtns}>
                          {[
                            { val:'own',  label:'Só as próprias' },
                            { val:'team', label:'Da equipe' },
                            { val:'all',  label:'Todas' },
                          ].map(s => (
                            <button
                              key={s.val}
                              onClick={() => handlePermChange('perm_conv_scope', s.val)}
                              style={{
                                ...styles.scopeBtn,
                                ...(perms.perm_conv_scope === s.val ? styles.scopeBtnActive : {}),
                              }}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Checkboxes */}
                    {group.perms.map(perm => (
                      <label key={perm.key} style={styles.permRow}>
                        <div style={styles.permLabelArea}>
                          <span style={styles.permLabel}>{perm.label}</span>
                        </div>
                        <div
                          onClick={() => handlePermChange(perm.key, !perms[perm.key])}
                          style={{
                            ...styles.toggle,
                            ...(perms[perm.key] ? styles.toggleOn : {}),
                          }}
                        >
                          <div style={{
                            ...styles.toggleThumb,
                            ...(perms[perm.key] ? styles.toggleThumbOn : {}),
                          }} />
                        </div>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Save button */}
            {selected.role !== 'admin' && (
              <div style={styles.saveRow}>
                {savedMsg && (
                  <span style={styles.savedMsg}>✓ Permissões salvas</span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{...styles.saveBtn, opacity: saving ? .6 : 1}}
                >
                  {saving ? 'Salvando...' : 'Salvar permissões'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* INVITE MODAL */}
      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onCreated={(u) => {
          setUsers(prev => [...prev, u])
          setShowInvite(false)
        }} />
      )}
    </div>
  )
}

/* ─── INVITE MODAL ─── */
function InviteModal({ onClose, onCreated }) {
  const { wsRole } = useAuth()
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [role,  setRole]  = useState('agent')
  const [pass,  setPass]  = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !pass.trim()) {
      setErr('Preencha todos os campos obrigatórios.'); return
    }
    setSaving(true); setErr('')
    try {
      // Cria usuário no Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email, password: pass, email_confirm: true,
        user_metadata: { full_name: name },
      })
      if (authErr) throw authErr

      // Insere na tabela users
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .insert({ id: authData.user.id, name, email, role })
        .select()
        .single()
      if (userErr) throw userErr

      // Vincula ao workspace
      const workspaceId = wsRole?.workspace_id
      if (workspaceId) {
        const { error: memErr } = await supabase
          .from('workspace_members')
          .insert({ workspace_id: workspaceId, user_id: authData.user.id, role, display_name: name })
        if (memErr) {
          console.error('[InviteModal] Falha ao vincular ao workspace:', memErr)
        }
      }

      onCreated(userData)
    } catch(e) {
      setErr(e.message || 'Erro ao criar usuário.')
      setSaving(false)
    }
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>Adicionar usuário</div>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div style={styles.modalBody}>
          <Field label="Nome completo *" value={name} onChange={setName} placeholder="Ex: Ana Souza" />
          <Field label="E-mail *" value={email} onChange={setEmail} placeholder="ana@empresa.com" type="email" />
          <Field label="Senha inicial *" value={pass} onChange={setPass} placeholder="empresa123" type="password" />

          <div style={{marginTop:'8px'}}>
            <div style={styles.fieldLabel}>Perfil *</div>
            <div style={styles.roleButtons}>
              {['admin','supervisor','agent'].map(r => (
                <button key={r} onClick={() => setRole(r)} style={{
                  ...styles.roleBtn,
                  ...(role === r ? { background: 'var(--bg-el)', color: 'var(--txt1)', borderColor: 'var(--border2)' } : {}),
                }}>
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {err && <div style={styles.errorMsg}>{err}</div>}
        </div>

        <div style={styles.modalFooter}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button style={{...styles.saveBtn, opacity: saving ? .6 : 1}} onClick={handleCreate} disabled={saving}>
            {saving ? 'Criando...' : 'Criar usuário'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── FIELD ─── */
function Field({ label, value, onChange, placeholder, type = 'text' }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{marginBottom:'12px'}}>
      <div style={styles.fieldLabel}>{label}</div>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          ...styles.input,
          borderColor: focused ? 'var(--pri, #7c3aed)' : 'rgba(255,255,255,.1)',
        }}
      />
    </div>
  )
}

/* ─── STYLES ─── */
const styles = {
  root: {
    display: 'flex', height: '100%', overflow: 'hidden',
    background: 'var(--bg-page, #0c0b14)',
    fontFamily: 'var(--font, DM Sans, sans-serif)',
  },
  sidebar: {
    width: '280px', flexShrink: 0,
    background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)',
    backdropFilter: 'blur(16px)', WebKitBackdropFilter: 'blur(16px)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '18px 16px',
    background: 'color-mix(in srgb, var(--bg-page) 70%, transparent)',
    backdropFilter: 'blur(16px)', WebKitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  sidebarTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--txt1, #f5f3ff)' },
  sidebarCount:  { fontSize: '11px', color: 'var(--txt3, #5a5272)', marginTop: '2px' },
  inviteBtn: {
    fontSize: '12px', fontWeight: 600, padding: '6px 12px',
    background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.35)',
    color: '#a78bfa', borderRadius: '8px', cursor: 'pointer',
  },
  listLoading: { padding: '20px 16px', fontSize: '13px', color: 'var(--txt3, #5a5272)' },
  userItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', cursor: 'pointer', transition: 'background .15s',
    borderBottom: '1px solid rgba(255,255,255,.03)',
    borderLeft: '2px solid transparent',
  },
  userItemActive: {
    background: 'rgba(124,58,237,.1)', borderLeftColor: '#7c3aed',
  },
  userAvatar: {
    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  userAvatarLg: {
    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: {
    fontSize: '12.5px', fontWeight: 600, color: 'var(--txt1, #f5f3ff)',
    display: 'flex', alignItems: 'center', gap: '6px',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  youBadge: {
    fontSize: '9px', padding: '1px 6px', borderRadius: '10px',
    background: 'rgba(255,255,255,.08)', color: 'var(--txt3, #5a5272)',
  },
  userEmail: {
    fontSize: '11px', color: 'var(--txt3, #5a5272)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px',
  },
  roleBadge: {
    fontSize: '9.5px', fontWeight: 700, padding: '2px 8px',
    borderRadius: '20px', flexShrink: 0,
  },
  editor: {
    flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '24px',
  },
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '40px',
  },
  emptyTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--txt1, #f5f3ff)', marginBottom: '6px' },
  emptyDesc:  { fontSize: '13px', color: 'var(--txt3, #5a5272)', textAlign: 'center', lineHeight: '1.6' },
  editorHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '24px', marginBottom: '20px', flexWrap: 'wrap',
  },
  editorUserInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  editorName:  { fontSize: '16px', fontWeight: 600, color: 'var(--txt1, #f5f3ff)' },
  editorEmail: { fontSize: '12px', color: 'var(--txt3, #5a5272)', marginTop: '2px' },
  roleSection: { display: 'flex', flexDirection: 'column', gap: '6px' },
  roleLabel:   { fontSize: '11px', fontWeight: 600, color: 'var(--txt3, #5a5272)', letterSpacing: '.08em', textTransform: 'uppercase' },
  roleButtons: { display: 'flex', gap: '6px' },
  roleBtn: {
    padding: '6px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600,
    cursor: 'pointer', border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--txt3)', transition: 'all .15s', fontFamily: 'var(--font)',
  },
  selfNote: { fontSize: '11px', color: 'var(--txt4)', marginTop: '4px' },
  adminNote: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
    background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)', backdropFilter: 'blur(10px)',
    border: '1px solid var(--border)',
    fontSize: '13px', color: 'var(--txt2)',
  },
  permGroups: { display: 'flex', flexDirection: 'column', gap: '12px' },
  permGroup: {
    background: 'color-mix(in srgb, var(--bg-card) 55%, transparent)',
    backdropFilter: 'blur(8px)',
    border: '1px solid var(--border)',
    borderRadius: '12px', overflow: 'hidden',
  },
  permGroupHeader: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 16px', borderBottom: '1px solid var(--border)',
    background: 'color-mix(in srgb, var(--bg-page) 60%, transparent)',
  },
  permGroupTitle: { fontSize: '13px', fontWeight: 600, color: 'var(--txt1, #f5f3ff)' },
  permRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.04)',
    cursor: 'pointer',
  },
  permLabelArea: { flex: 1 },
  permLabel: { fontSize: '13px', color: 'var(--txt2, #a89fc4)' },
  scopeRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.04)',
  },
  scopeBtns: { display: 'flex', gap: '5px' },
  scopeBtn: {
    fontSize: '11.5px', padding: '4px 10px', borderRadius: '6px',
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--txt3)', cursor: 'pointer', transition: 'all .15s', fontFamily: 'var(--font)',
  },
  scopeBtnActive: {
    background: 'var(--bg-el)', borderColor: 'var(--border2)', color: 'var(--txt1)',
  },
  toggle: {
    width: '38px', height: '20px', borderRadius: '10px', background: 'var(--bg-s3)',
    position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0,
  },
  toggleOn: { background: 'var(--pri)' },
  toggleThumb: {
    position: 'absolute', top: '3px', left: '3px',
    width: '14px', height: '14px', borderRadius: '50%',
    background: 'var(--txt4)', transition: 'left .2s, background .2s',
  },
  toggleThumbOn: { left: '21px', background: '#fff' },
  saveRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    gap: '12px', marginTop: '20px', paddingTop: '16px',
    borderTop: '1px solid var(--border)',
  },
  savedMsg: { fontSize: '13px', color: 'var(--success)' },
  saveBtn: {
    padding: '10px 24px', borderRadius: '9px', background: 'var(--pri)',
    border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', transition: 'all .15s', fontFamily: 'var(--font)',
  },
  cancelBtn: {
    padding: '10px 20px', borderRadius: '9px', background: 'transparent',
    border: '1px solid var(--border)', color: 'var(--txt2)',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    background: 'color-mix(in srgb, var(--bg-card) 88%, transparent)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--border)',
    borderRadius: '16px', width: '440px', maxWidth: '95vw',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 20px', borderBottom: '1px solid var(--border)',
  },
  modalTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--txt1)' },
  modalClose: {
    background: 'none', border: 'none', color: 'var(--txt3)',
    fontSize: '16px', cursor: 'pointer', padding: '4px',
  },
  modalBody:   { padding: '20px' },
  modalFooter: {
    display: 'flex', gap: '10px', justifyContent: 'flex-end',
    padding: '16px 20px', borderTop: '1px solid var(--border)',
  },
  fieldLabel: {
    fontSize: '12px', fontWeight: 600, color: 'var(--txt3)', marginBottom: '6px',
  },
  input: {
    width: '100%', background: 'var(--bg-s1)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '9px 12px', color: 'var(--txt1)',
    fontSize: '13px', outline: 'none', transition: 'border-color .15s',
    fontFamily: 'var(--font)',
  },
  errorMsg: {
    marginTop: '10px', fontSize: '12.5px', color: '#ef4444',
    background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)',
    borderRadius: '8px', padding: '8px 12px',
  },
}
