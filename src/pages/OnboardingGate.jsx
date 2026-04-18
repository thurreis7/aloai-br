import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loader2, ExternalLink, MessageCircle } from 'lucide-react'

const WA_URL = 'https://wa.me/5511999999999?text=Ol%C3%A1%2C+quero+saber+mais+sobre+a+ALO+AI'

export default function OnboardingGate() {
  const { user, loading, wsRole } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-base)',
        flexDirection: 'column', gap: 16,
      }}>
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        <div style={{ fontSize: 14, color: 'var(--txt3)', fontFamily: 'var(--font)' }}>
          Verificando acesso...
        </div>
      </div>
    )
  }

  // JÁ LOGADO + já tem workspace → inbox
  if (user && wsRole) {
    navigate('/app/inbox', { replace: true })
    return null
  }

  // LOGADO mas sem workspace → onboarding interno
  if (user) {
    navigate('/onboarding/internal', { replace: true })
    return null
  }

  // NÃO LOGADO → opções
  return <OnboardingNotLoggedIn navigate={navigate} />
}

function OnboardingNotLoggedIn({ navigate }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--bg-base)',
        fontFamily: 'var(--font)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-page)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r16)',
          padding: '48px 36px',
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt1)', marginBottom: 8 }}>
          Quer conhecer a ALO AI?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--txt3)', lineHeight: 1.6, marginBottom: 32 }}>
          Para criar sua conta, fale com nossa equipe ou preencha o formulário abaixo.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => navigate('/formulario')}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 'var(--r8)',
              background: 'var(--pri)', border: 'none', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Preencher formulário
            <ExternalLink className="h-4 w-4" />
          </button>

          <a
            href={WA_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 'var(--r8)',
              background: 'transparent', border: '1px solid var(--border2)',
              color: 'var(--txt2)', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', fontFamily: 'var(--font)', textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Falar no WhatsApp
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>

        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none', border: 'none', color: 'var(--txt4)',
              fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)',
              textDecoration: 'underline',
            }}
          >
            Já tenho acesso →
          </button>
        </div>
      </div>
    </div>
  )
}
