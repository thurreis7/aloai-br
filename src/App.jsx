import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { PermissionsProvider, usePermissions } from './hooks/usePermissions'
import Landing             from './pages/Landing'
import Login               from './pages/Login'
import Onboarding          from './pages/Onboarding'
import EmailConfirmation   from './pages/EmailConfirmation'
import ResetPassword       from './pages/ResetPassword'
import AppLayout  from './components/layout/AppLayout'
import Inbox      from './pages/Inbox'
import Dashboard  from './pages/Dashboard'
import Kanban     from './pages/Kanban'
import Channels   from './pages/Channels'
import Contacts   from './pages/Contacts'
import Automation from './pages/Automation'
import Knowledge  from './pages/Knowledge'
import Team       from './pages/Team'
import Settings   from './pages/Settings'
import Users      from './pages/Settings/Users'

/* ── Loading screen ── */
function LoadingScreen() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-base)',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '2px solid rgba(124,58,237,.2)',
        borderTopColor: 'var(--pri)',
        animation: 'spin 0.85s linear infinite',
      }} />
      <span style={{ fontSize: 14, color: 'var(--txt3)', fontFamily: 'var(--font)' }}>
        Carregando ALO AI...
      </span>
    </div>
  )
}

/* ── Private route ── */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" replace />
  return children
}

function ForbiddenScreen({ title = 'Acesso restrito', description = 'Voce nao tem permissao para acessar esta tela.' }) {
  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
      background: 'radial-gradient(circle at top, rgba(124,58,237,.18), transparent 40%), var(--bg-base)',
    }}>
      <div className="workspace-card" style={{ maxWidth: 420, textAlign: 'center', padding: 28 }}>
        <div style={{
          width: 52,
          height: 52,
          margin: '0 auto 16px',
          borderRadius: 18,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(239,68,68,.12)',
          color: 'var(--err)',
          fontSize: 24,
          fontWeight: 800,
        }}>
          !
        </div>
        <h1 style={{ fontSize: 22, marginBottom: 8, fontFamily: 'var(--font-display)' }}>{title}</h1>
        <p style={{ color: 'var(--txt3)', lineHeight: 1.6 }}>{description}</p>
      </div>
    </div>
  )
}

function PermissionRoute({ permission, children, title, description }) {
  const { loading, can } = usePermissions()
  if (loading) return <LoadingScreen />
  if (!can(permission)) {
    return <ForbiddenScreen title={title} description={description} />
  }
  return children
}

function OwnerRoute({ children }) {
  const { loading, isOwner } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isOwner) {
    return (
      <ForbiddenScreen
        title="Area exclusiva do owner"
        description="A administracao de clientes e workspaces e reservada ao owner global."
      />
    )
  }
  return children
}

/* ── App with theme + permissions ── */
function AppWithTheme() {
  const [theme, setTheme] = useState('dark')

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '')
  }

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/"           element={<Landing />} />
      <Route path="/login"      element={<Login />} />
      <Route path="/onboarding"          element={<Navigate to="/login" replace />} />
      <Route path="/formulario"         element={<Navigate to="/" replace />} />
      <Route path="/email-confirmed"    element={<EmailConfirmation />} />
      <Route path="/reset-password"     element={<ResetPassword />} />

      {/* Rotas protegidas — PermissionsProvider só carrega após login */}
      <Route path="/onboarding/internal" element={
        <PrivateRoute>
          <OwnerRoute>
            <Onboarding />
          </OwnerRoute>
        </PrivateRoute>
      } />

      <Route path="/app" element={
        <PrivateRoute>
          <PermissionsProvider>
            <AppLayout theme={theme} toggleTheme={toggleTheme} />
          </PermissionsProvider>
        </PrivateRoute>
      }>
        <Route index                  element={<Navigate to="/app/inbox" replace />} />
        <Route path="inbox"           element={<PermissionRoute permission="perm_channels_view" title="Inbox indisponivel" description="Seu perfil nao pode acessar as conversas agora."><Inbox /></PermissionRoute>} />
        <Route path="dashboard"       element={<PermissionRoute permission="perm_reports_metrics" title="Metricas restritas" description="Seu perfil nao tem acesso aos indicadores operacionais."><Dashboard /></PermissionRoute>} />
        <Route path="kanban"          element={<PermissionRoute permission="perm_kanban_view" title="Kanban restrito" description="Seu perfil nao pode visualizar o pipeline."><Kanban /></PermissionRoute>} />
        <Route path="channels"        element={<PermissionRoute permission="perm_channels_view" title="Canais restritos" description="Seu perfil nao pode visualizar os canais conectados."><Channels /></PermissionRoute>} />
        <Route path="contacts"        element={<PermissionRoute permission="perm_channels_view" title="CRM restrito" description="Seu perfil nao pode visualizar a base de contatos."><Contacts /></PermissionRoute>} />
        <Route path="automation"      element={<PermissionRoute permission="perm_ai" title="Automacao restrita" description="Seu perfil nao pode configurar o agente de IA."><Automation /></PermissionRoute>} />
        <Route path="knowledge"       element={<PermissionRoute permission="perm_ai" title="Base IA restrita" description="Seu perfil nao pode acessar a base de conhecimento."><Knowledge /></PermissionRoute>} />
        <Route path="team"            element={<PermissionRoute permission="perm_reports_team" title="Equipe restrita" description="Seu perfil nao pode visualizar a operacao da equipe."><Team /></PermissionRoute>} />
        <Route path="settings"        element={<Settings />} />
        <Route path="settings/users"  element={<Users />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/* ── Root ── */
export default function App() {
  return (
    <AuthProvider>
      <AppWithTheme />
    </AuthProvider>
  )
}
