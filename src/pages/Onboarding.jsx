import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogoFull } from '../components/ui/Logo'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../lib/api'

const STEPS = [
  { id:1, title:'Bem-vindo à ALO AI 👋',       sub:'Vamos configurar seu workspace em 4 passos rápidos' },
  { id:2, title:'Sobre sua empresa',            sub:'Estas informações personalizam sua experiência' },
  { id:3, title:'Conecte seu primeiro canal',   sub:'Você pode adicionar mais canais depois' },
  { id:4, title:'Monte sua equipe',             sub:'Adicione os atendentes — nós criamos os acessos' },
  { id:5, title:'Tudo pronto! 🚀',              sub:'Sua equipe vai receber os dados de acesso' },
]

const channels = [
  { id:'whatsapp',  icon:'💬', name:'WhatsApp',  color:'#1DA06A' },
  { id:'instagram', icon:'📷', name:'Instagram', color:'#AA5EDE' },
  { id:'email',     icon:'📧', name:'E-mail',    color:'#E8780A' },
  { id:'webchat',   icon:'💻', name:'Web Chat',  color:'#5EB8FF' },
]

/* Gera e-mail e senha padrão baseado no nome da empresa */
function generateCredentials(companyName, memberName) {
  const cleanCompany = companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
  const cleanName    = memberName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
  return {
    email:    `${cleanName}.${cleanCompany}@${cleanCompany}.aloai`,
    password: `${cleanCompany}123`,
  }
}

export default function Onboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, ws, wsRole, isOwner } = useAuth()
  const planFromLanding = location.state?.plan || 'growth'
  const withAI          = location.state?.withAI || false

  const [step,         setStep]         = useState(1)
  const [companyName,  setCompanyName]  = useState('')
  const [ownerName,    setOwnerName]    = useState('')
  const [selectedCh,   setSelectedCh]  = useState(null)
  const [aiEnabled,    setAiEnabled]   = useState(withAI)
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupError,  setSetupError]  = useState('')
  const [setupSuccess, setSetupSuccess] = useState(null)
  const [teamMembers,  setTeamMembers] = useState([{ name:'', role:'admin' }])

  const current = STEPS.find(s => s.id === step)

  const addMember    = () => setTeamMembers(m => [...m, { name:'', role:'agent' }])
  const lockFirstAdmin = true
  const removeMember = (i) => setTeamMembers(m => m.filter((_,idx)=>idx!==i))
  const updateMember = (i, field, value) => setTeamMembers(m => m.map((x,idx)=>idx===i?{...x,[field]:value}:x))

  /* J tem workspace → redireciona para inbox */
  if (user && ws && wsRole) {
    navigate('/app/inbox', { replace: true })
    return null
  }

  if (user && !isOwner) {
    navigate('/app/inbox', { replace: true })
    return null
  }

  /* Gera o "PDF" como texto tabelado para simular exportação */
  const exportCredentials = () => {
    if (!companyName) return
    const rows = teamMembers.filter(m=>m.name.trim()).map(m => {
      const cred = generateCredentials(companyName, m.name)
      return `${m.name.padEnd(22)}${m.role==='admin'?'Administrador':'Agente'.padEnd(14)}${cred.email.padEnd(40)}${cred.password}`
    })
    const header = `${'NOME'.padEnd(22)}${'FUNÇÃO'.padEnd(14)}${'E-MAIL DE ACESSO'.padEnd(40)}SENHA`
    const divider = '─'.repeat(100)
    const content = [
      `ALO AI — Credenciais de acesso`,
      `Empresa: ${companyName}`,
      `Plano: ${planFromLanding.toUpperCase()}${aiEnabled?' + Agente IA':''}`,
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
      divider, header, divider,
      ...rows, divider,
      ``,`Acesso: https://app.aloai.com.br`,
      `Suporte: suporte@aloai.com.br`,
    ].join('\n')

    const blob = new Blob([content], { type:'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `ALO-AI-${companyName.replace(/\s/g,'-')}-credenciais.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const canNext = () => {
    if (step===2) return companyName.trim().length > 1 && ownerName.trim().length > 1
    if (step===3) return !!selectedCh
    if (step===4) return teamMembers.some(m=>m.name.trim())
    return true
  }

  /* Chama a API para criar o workspace completo */
  const handleFinalize = async () => {
    if (!canNext()) return
    setSetupLoading(true)
    setSetupError('')
    try {
      const res = await apiFetch('/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          companyName: companyName.trim(),
          ownerName: ownerName.trim(),
          channel: selectedCh,
          plan: planFromLanding,
          aiEnabled,
          teamMembers: teamMembers.filter(m => m.name.trim()),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao configurar workspace')
      setSetupSuccess(data)
      setStep(5)
    } catch (err) {
      setSetupError(err.message)
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:'var(--font)' }}>

      {/* Logo + voltar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', maxWidth:520, marginBottom:28 }}>
        <LogoFull size={32}/>
        <button
          onClick={()=>navigate('/')}
          style={{ background:'none', border:'1px solid var(--border)', color:'var(--txt3)', fontSize:12, cursor:'pointer', fontFamily:'var(--font)', borderRadius:'var(--r8)', padding:'6px 12px' }}>
          ← Voltar ao site
        </button>
      </div>

      <div style={{ background:'var(--bg-page)', border:'1px solid var(--border2)', borderRadius:'var(--r16)', padding:'36px 40px', width:'100%', maxWidth:520, boxShadow:'var(--shadow)' }}>

        {/* Progress dots */}
        <div style={{ display:'flex', gap:6, marginBottom:28 }}>
          {STEPS.map(s=>(
            <div key={s.id} style={{ flex:1, height:3, borderRadius:2, transition:'background .3s', background:s.id<step?'var(--success)':s.id===step?'var(--pri)':'var(--bg-s3)' }}/>
          ))}
        </div>

        <div style={{ fontSize:11, color:'var(--pri-l)', fontWeight:600, letterSpacing:'.1em', marginBottom:8 }}>PASSO {step} DE {STEPS.length}</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:'var(--txt1)', marginBottom:6 }}>{current.title}</h2>
        <p style={{ fontSize:13, color:'var(--txt3)', marginBottom:24 }}>{current.sub}</p>

        {/* STEP CONTENT */}
        {step===1 && <StepWelcome plan={planFromLanding} withAI={withAI}/>}
        {step===2 && (
          <StepCompany
            companyName={companyName} setCompanyName={setCompanyName}
            ownerName={ownerName}     setOwnerName={setOwnerName}
            aiEnabled={aiEnabled}     setAiEnabled={setAiEnabled}
          />
        )}
        {step===3 && <StepChannel selected={selectedCh} onSelect={setSelectedCh}/>}
        {step===4 && (
          <StepTeam
            companyName={companyName}
            members={teamMembers}
            onAdd={addMember}
            onRemove={removeMember}
            onUpdate={updateMember}
          />
        )}
        {step===5 && (
          <StepDone
            companyName={companyName}
            members={teamMembers}
            onExport={exportCredentials}
            setupError={setupError}
            setupLoading={setupLoading}
          />
        )}

        {/* Navigation */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:28 }}>
          {step > 1 && step < 5
            ? <BtnNav ghost onClick={()=>setStep(s=>s-1)}>← Voltar</BtnNav>
            : <div/>
          }
          {step < 4
            ? (
              <BtnNav primary disabled={!canNext()} onClick={()=>{ if(canNext()) setStep(s=>s+1) }}>
                {step===4 ? 'Finalizar configuração 🚀' : 'Continuar →'}
              </BtnNav>
            )
            : step === 4
              ? (
                <BtnNav primary disabled={!canNext()} onClick={handleFinalize}>
                  Finalizar configuração 🚀
                </BtnNav>
              )
              : setupSuccess
                ? (
                  <BtnNav primary onClick={()=>navigate('/app/inbox')}>
                    Entrar no ALO AI →
                  </BtnNav>
                )
                : (
                  <BtnNav primary disabled={!canNext()} onClick={handleFinalize}>
                    Finalizar configuração 🚀
                  </BtnNav>
                )
          }
        </div>

        {step < 4 && (
          <div style={{ textAlign:'center', marginTop:14 }}>
            <button onClick={()=>navigate('/app')} style={{ background:'none', border:'none', color:'var(--txt4)', fontSize:12, cursor:'pointer', fontFamily:'var(--font)' }}>
              Pular e ver a demo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Step components ─── */

function StepWelcome({ plan, withAI }) {
  const labels = { starter:'Starter', growth:'Growth', business:'Business' }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'var(--pri-dim)', border:'1px solid var(--bg-s3)', borderRadius:'var(--r12)', padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>📋</span>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--txt1)' }}>Plano selecionado: {labels[plan] || 'Growth'}</div>
          {withAI && <div style={{ fontSize:11, color:'var(--pri-l)' }}>+ Agente IA incluído</div>}
        </div>
      </div>
      {[
        { icon:'💬', title:'Multicanal unificado',    desc:'Todos os seus canais em um só lugar' },
        { icon:'🤖', title:'IA que realmente ajuda',  desc:'Responde e classifica automaticamente' },
        { icon:'📊', title:'Dados em tempo real',     desc:'Performance da equipe ao vivo' },
      ].map(f=>(
        <div key={f.title} style={{ display:'flex', gap:14, padding:'12px 14px', borderRadius:'var(--r12)', background:'var(--bg-s1)', border:'1px solid var(--border)' }}>
          <span style={{ fontSize:22, flexShrink:0 }}>{f.icon}</span>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--txt1)', marginBottom:2 }}>{f.title}</div>
            <div style={{ fontSize:12, color:'var(--txt3)' }}>{f.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StepCompany({ companyName, setCompanyName, ownerName, setOwnerName, aiEnabled, setAiEnabled }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <Field label="Nome da empresa" placeholder="Ex: Minha Empresa LTDA" value={companyName} onChange={setCompanyName}/>
      <Field label="Seu nome (responsável)" placeholder="Ex: João Silva" value={ownerName} onChange={setOwnerName}/>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:'var(--txt3)', display:'block', marginBottom:6 }}>Tamanho da equipe de atendimento</label>
        <div style={{ display:'flex', gap:8 }}>
          {['1-3','4-10','11-30','30+'].map(s=>(
            <button key={s} style={{ flex:1, padding:'8px 4px', borderRadius:'var(--r8)', border:'1px solid var(--border2)', background:'var(--bg-s1)', color:'var(--txt2)', fontSize:12, cursor:'pointer', fontFamily:'var(--font)', fontWeight:500 }}>{s}</button>
          ))}
        </div>
      </div>
      <div style={{ background:'var(--pri-dim)', border:'1px solid var(--bg-s3)', borderRadius:'var(--r12)', padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={()=>setAiEnabled(!aiEnabled)}>
        <div style={{ width:40, height:22, borderRadius:11, background:aiEnabled?'var(--pri)':'var(--bg-s3)', position:'relative', flexShrink:0, transition:'background .2s' }}>
          <div style={{ position:'absolute', top:3, left:aiEnabled?21:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--txt1)' }}>Ativar Agente IA (+R$149/mês)</div>
          <div style={{ fontSize:11, color:'var(--txt3)' }}>Responde automaticamente e passa para humano quando necessário</div>
        </div>
      </div>
    </div>
  )
}

function StepChannel({ selected, onSelect }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {channels.map(ch=>(
        <div key={ch.id} onClick={()=>onSelect(ch.id)} style={{
          display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:'var(--r12)',
          cursor:'pointer', transition:'all .15s',
          border:`1px solid ${selected===ch.id?'var(--pri)':'var(--border)'}`,
          background:selected===ch.id?'var(--pri-dim)':'var(--bg-s1)',
        }}>
          <span style={{ fontSize:22 }}>{ch.icon}</span>
          <span style={{ fontSize:14, fontWeight:600, color:'var(--txt1)', flex:1 }}>{ch.name}</span>
          {selected===ch.id&&<span style={{ color:'var(--pri-l)', fontSize:16 }}>✓</span>}
        </div>
      ))}
      <p style={{ fontSize:11, color:'var(--txt4)', textAlign:'center' }}>Você pode conectar múltiplos canais depois em Configurações</p>
    </div>
  )
}

function StepTeam({ companyName, members, onAdd, onRemove, onUpdate }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      <div style={{ background:'rgba(124,58,237,.08)', borderRadius:'var(--r12)', padding:'12px 14px', border:'1px solid rgba(124,58,237,.2)', display:'flex', gap:10, alignItems:'flex-start' }}>
        <span style={{ fontSize:16, flexShrink:0 }}>👑</span>
        <div style={{ fontSize:12, color:'var(--txt3)', lineHeight:1.6 }}>
          O <strong style={{ color:'var(--txt1)' }}>primeiro membro</strong> é automaticamente o <strong style={{ color:'var(--pri-l)' }}>responsável (admin)</strong> da conta.<br/>
          Os demais membros são criados como agentes — você pode ajustar depois em Configurações.
        </div>
      </div>

      {members.map((m,i)=>(
        <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <div style={{ flex:2 }}>
            <Field label={i===0?'Responsável (admin)':undefined} placeholder="Ex: Ana Souza" value={m.name} onChange={v=>onUpdate(i,'name',v)}/>
          </div>
          <div style={{ flex:1 }}>
            {i===0&&<label style={{ fontSize:12, fontWeight:600, color:'var(--txt3)', display:'block', marginBottom:6 }}>Função</label>}
            {i===0 ? (
              <div style={{
                width:'100%', background:'rgba(124,58,237,.1)', border:'1px solid rgba(124,58,237,.2)',
                borderRadius:'var(--r8)', padding:'9px 10px', color:'#a78bfa',
                fontFamily:'var(--font)', fontSize:13, fontWeight:600, textAlign:'center',
              }}>
                Admin
              </div>
            ) : (
              <select value={m.role} onChange={e=>onUpdate(i,'role',e.target.value)} style={{
                width:'100%', background:'var(--bg-s1)', border:'1px solid var(--border2)',
                borderRadius:'var(--r8)', padding:'9px 10px', color:'var(--txt2)',
                fontFamily:'var(--font)', fontSize:13, outline:'none',
              }}>
                <option value="agent">Agente</option>
                <option value="admin">Admin</option>
              </select>
            )}
          </div>
          {members.length>1&&(
            <button onClick={()=>onRemove(i)} style={{ padding:'9px 10px', background:'var(--err-bg)', border:'1px solid rgba(217,64,64,.3)', borderRadius:'var(--r8)', color:'var(--err)', cursor:'pointer', fontSize:14, flexShrink:0 }}>✕</button>
          )}
        </div>
      ))}

      <button onClick={onAdd} style={{ padding:'9px', background:'transparent', border:'1px dashed var(--border2)', borderRadius:'var(--r8)', color:'var(--txt3)', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, width:'100%' }}>
        + Adicionar outro atendente
      </button>
    </div>
  )
}

function StepDone({ companyName, members, onExport, setupError, setupLoading }) {
  const validMembers = members.filter(m=>m.name.trim())
  if (setupLoading) {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:16, alignItems:'center', padding:'40px 0', textAlign:'center' }}>
        <div style={{
          width:36, height:36, borderRadius:'50%',
          border:'3px solid var(--border)', borderTopColor:'var(--pri)',
          animation:'spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize:14, fontWeight:600, color:'var(--txt1)' }}>Criando seu workspace...</div>
        <div style={{ fontSize:12, color:'var(--txt3)' }}>Isso leva alguns segundos</div>
      </div>
    )
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {setupError && (
        <div style={{ padding:'12px 16px', borderRadius:'var(--r12)', border:'1px solid var(--err)', background:'var(--err-bg)', color:'var(--err)', fontSize:13, textAlign:'center' }}>
          {setupError}
        </div>
      )}
      <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--txt1)', marginBottom:6 }}>Configuração concluída!</div>
        <div style={{ fontSize:13, color:'var(--txt3)' }}>Seus acessos foram criados com sucesso.</div>
      </div>

      {/* Credentials preview */}
      {validMembers.length > 0 && (
        <div style={{ background:'var(--bg-s1)', border:'1px solid var(--border2)', borderRadius:'var(--r12)', overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:600, color:'var(--txt4)', letterSpacing:'.1em', textTransform:'uppercase' }}>
            Credenciais que serão criadas
          </div>
          <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
            {validMembers.map((m,i)=>{
              const cred = generateCredentials(companyName, m.name)
              return (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:6 }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--txt1)' }}>{m.name}</div>
                    <div style={{ fontSize:10, color:'var(--txt4)' }}>{m.role==='admin'?'Administrador':'Agente'}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <code style={{ fontSize:10, color:'var(--pri-l)' }}>{cred.email}</code><br/>
                    <code style={{ fontSize:10, color:'var(--txt3)' }}>Senha: {cred.password}</code>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Export */}
      <button onClick={onExport} style={{
        width:'100%', padding:'11px', borderRadius:'var(--r8)',
        background:'var(--bg-s2)', border:'1px solid var(--border2)',
        color:'var(--txt2)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      }}>
        ⬇ Baixar planilha de credenciais (.txt)
      </button>

      {/* Checklist */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:4 }}>
        {[
          { ok:true,  text:'Workspace criado' },
          { ok:true,  text:'Canal selecionado' },
          { ok:true,  text:`${validMembers.length} atendente(s) cadastrado(s)` },
          { ok:false, text:'Implantação pela equipe ALO AI (em até 24h)' },
        ].map(item=>(
          <div key={item.text} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 12px', background:'var(--bg-s1)', borderRadius:'var(--r8)', border:'1px solid var(--border)' }}>
            <span style={{ color:item.ok?'var(--success)':'var(--txt4)', fontSize:14 }}>{item.ok?'✓':'○'}</span>
            <span style={{ fontSize:13, color:item.ok?'var(--txt1)':'var(--txt4)' }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Shared sub ─── */
function Field({ label, placeholder, value, onChange, type='text' }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label&&<label style={{ fontSize:12, fontWeight:600, color:'var(--txt3)' }}>{label}</label>}
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e=>onChange(e.target.value)}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{
          background:'var(--bg-s1)', border:`1px solid ${focused?'var(--pri)':'var(--border2)'}`,
          borderRadius:'var(--r8)', padding:'9px 12px', color:'var(--txt1)',
          fontFamily:'var(--font)', fontSize:13, outline:'none', transition:'border-color .15s', width:'100%',
        }}
      />
    </div>
  )
}

function BtnNav({ children, primary, ghost, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:'10px 22px', borderRadius:'var(--r8)', fontFamily:'var(--font)',
      fontSize:13, fontWeight:600, cursor:disabled?'not-allowed':'pointer',
      border:ghost?'1px solid var(--border2)':'none',
      background:primary?'var(--pri)':ghost?'transparent':'var(--bg-s1)',
      color:primary?'#fff':'var(--txt2)', opacity:disabled?.45:1, transition:'all .15s',
    }}>{children}</button>
  )
}
