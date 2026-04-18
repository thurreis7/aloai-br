import { useState } from 'react'
import { LogoFull } from '../components/ui/Logo'

const CHANNELS = [
  { id:'whatsapp',  label:'WhatsApp',  icon:'💬' },
  { id:'instagram', label:'Instagram', icon:'📷' },
  { id:'facebook',  label:'Facebook',  icon:'👍' },
  { id:'email',     label:'E-mail',    icon:'📧' },
  { id:'webchat',   label:'Web Chat',  icon:'💻' },
]

const PLANS = [
  { id:'starter',  label:'Starter — R$199/mês'  },
  { id:'growth',   label:'Growth — R$349/mês'   },
  { id:'business', label:'Business — R$599/mês' },
]

const emptyAgent = () => ({ name:'', role:'agent', departments:[] })

export default function ClientForm() {
  const [step, setStep] = useState(1)
  const TOTAL = 4

  const [company,     setCompany]     = useState('')
  const [responsible, setResponsible] = useState('')
  const [phone,       setPhone]       = useState('')
  const [plan,        setPlan]        = useState('')
  const [aiAddon,     setAiAddon]     = useState(false)
  const [notes,       setNotes]       = useState('')

  const [channels, setChannels] = useState([])
  const toggleChannel = (id) =>
    setChannels(cs => cs.includes(id) ? cs.filter(c=>c!==id) : [...cs, id])

  const [depts,   setDepts]   = useState(['Vendas','Suporte','Financeiro'])
  const [newDept, setNewDept] = useState('')

  const addDept    = () => {
    const d = newDept.trim()
    if (d && !depts.includes(d)) { setDepts(ds=>[...ds, d]); setNewDept('') }
  }
  const removeDept = (d) => setDepts(ds => ds.filter(x => x !== d))

  const [agents, setAgents] = useState([emptyAgent()])

  const updateAgent = (i, field, value) =>
    setAgents(as => as.map((a,idx) => idx===i ? {...a,[field]:value} : a))

  const toggleDept = (i, dept) =>
    setAgents(as => as.map((a,idx) => {
      if (idx !== i) return a
      const has = a.departments.includes(dept)
      return { ...a, departments: has ? a.departments.filter(d=>d!==dept) : [...a.departments, dept] }
    }))

  const addAgent    = () => setAgents(as => [...as, emptyAgent()])
  const removeAgent = (i) => setAgents(as => as.filter((_,idx) => idx !== i))

  const [submitted, setSubmitted] = useState(false)

  const canNext = () => {
    if (step===1) return company.trim() && responsible.trim() && phone.trim() && plan
    if (step===2) return channels.length > 0
    if (step===3) return depts.length > 0
    if (step===4) return agents.some(a => a.name.trim())
    return true
  }

  const handleSubmit = () => {
    console.log({ company, responsible, phone, plan, aiAddon, channels, depts, agents, notes })
    setSubmitted(true)
  }

  const cleanCompany = (company || 'empresa').toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'')

if (submitted) {
  return (
    <Page>
      <div style={{ textAlign:'center', padding:'20px 0' }}>
        <div style={{ fontSize:56, marginBottom:18 }}>🎉</div>
        <h2 style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>
          Formulário enviado!
        </h2>
        <p style={{ fontSize:14, color:'var(--txt3)', lineHeight:1.7, marginBottom:24, maxWidth:380, margin:'0 auto 24px' }}>
          Recebemos todas as informações. Nossa equipe vai entrar em contato em até 24h para confirmar os dados e iniciar a implantação.
</p>
        <a
       href={`https://wa.me/5524974057429?text=Olá!%20Acabei%20de%20preencher%20o%20formulário%20de%20implantação%20da%20${encodeURIComponent(company)}.`}
          target="_blank"
          rel="noreferrer"
          style={{
            display:'inline-flex', alignItems:'center', gap:10,
            padding:'12px 24px', borderRadius:10,
            background:'#25D366', color:'#fff',
            fontSize:14, fontWeight:600, textDecoration:'none',
          }}
        >
          <WaIcon/> Confirmar pelo WhatsApp
        </a>
        </div>
      </Page>
    )
  }
  
  return (
    <Page>
      {/* Progress */}
      <div style={{ display:'flex', gap:6, marginBottom:28 }}>
        {Array.from({length:TOTAL},(_,i)=>(
          <div key={i} style={{ flex:1, height:3, borderRadius:2, transition:'background .3s', background:i<step?'var(--success)':i===step-1?'var(--pri)':'var(--bg-s3)' }}/>
        ))}
      </div>

      <div style={{ fontSize:11, color:'var(--pri-l)', fontWeight:600, letterSpacing:'.1em', marginBottom:8 }}>
        PASSO {step} DE {TOTAL}
      </div>

      {/* ── STEP 1 — Empresa ── */}
      {step===1 && (
        <>
          <h2 style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>Sobre sua empresa</h2>
          <p style={{ fontSize:13, color:'var(--txt3)', marginBottom:22 }}>Estas informações são usadas para configurar seu workspace.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Nome da empresa *"       value={company}     onChange={setCompany}     placeholder="Ex: Minha Empresa LTDA"/>
            <Field label="Nome do responsável *"   value={responsible} onChange={setResponsible} placeholder="Ex: João Silva"/>
            <Field label="WhatsApp para contato *" value={phone}       onChange={setPhone}       placeholder="Ex: (11) 99999-9999" type="tel"/>
            <div>
              <label style={labelStyle}>Plano escolhido *</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
                {PLANS.map(p=>(
                  <div key={p.id} onClick={()=>setPlan(p.id)} style={{
                    padding:'11px 14px', borderRadius:10, cursor:'pointer',
                    border:`1px solid ${plan===p.id?'var(--pri)':'var(--border2)'}`,
                    background:plan===p.id?'var(--pri-dim)':'var(--bg-s1)',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    transition:'all .15s',
                  }}>
                    <span style={{ fontSize:13, fontWeight:500 }}>{p.label}</span>
                    {plan===p.id && <span style={{ color:'var(--pri-l)', fontSize:16 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
            <div
              onClick={()=>setAiAddon(!aiAddon)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, cursor:'pointer', background:aiAddon?'var(--pri-dim)':'var(--bg-s1)', border:`1px solid ${aiAddon?'var(--pri)':'var(--border2)'}`, transition:'all .2s' }}>
              <Toggle checked={aiAddon}/>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>Adicionar Agente IA (+R$149/mês)</div>
                <div style={{ fontSize:11, color:'var(--txt3)' }}>Respostas automáticas 24/7 em todos os canais</div>
              </div>
            </div>
            <Field label="Observações" value={notes} onChange={setNotes} placeholder="Alguma necessidade específica ou dúvida?" multiline/>
          </div>
        </>
      )}

      {/* ── STEP 2 — Canais ── */}
      {step===2 && (
        <>
          <h2 style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>Canais de atendimento</h2>
          <p style={{ fontSize:13, color:'var(--txt3)', marginBottom:22 }}>Selecione os canais que sua empresa usa. Pode escolher mais de um.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {CHANNELS.map(ch=>(
              <div key={ch.id} onClick={()=>toggleChannel(ch.id)} style={{
                display:'flex', alignItems:'center', gap:14, padding:'13px 16px',
                borderRadius:12, cursor:'pointer', transition:'all .15s',
                border:`1px solid ${channels.includes(ch.id)?'var(--pri)':'var(--border)'}`,
                background:channels.includes(ch.id)?'var(--pri-dim)':'var(--bg-s1)',
              }}>
                <span style={{ fontSize:22 }}>{ch.icon}</span>
                <span style={{ fontSize:14, fontWeight:600, flex:1 }}>{ch.label}</span>
                {channels.includes(ch.id) && <span style={{ color:'var(--pri-l)', fontSize:16 }}>✓</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── STEP 3 — Departamentos ── */}
      {step===3 && (
        <>
          <h2 style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>Departamentos</h2>
          <p style={{ fontSize:13, color:'var(--txt3)', marginBottom:22 }}>
            Defina as áreas de atendimento. Cada atendente poderá ser vinculado a um ou mais departamentos.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16, minHeight:36 }}>
            {depts.map(d=>(
              <div key={d} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'var(--pri-dim)', border:'1px solid var(--bg-s3)' }}>
                <span style={{ fontSize:13, color:'var(--pri-l)', fontWeight:500 }}>{d}</span>
                <button onClick={()=>removeDept(d)} style={{ background:'none', border:'none', color:'var(--pri-l)', cursor:'pointer', fontSize:16, lineHeight:1, padding:0 }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input
              value={newDept}
              onChange={e=>setNewDept(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addDept()}
              placeholder="Novo departamento... (Enter para adicionar)"
              style={{ flex:1, background:'var(--bg-s1)', border:'1px solid var(--border2)', borderRadius:10, padding:'10px 14px', color:'var(--txt1)', fontFamily:'var(--font)', fontSize:13, outline:'none' }}
            />
            <button onClick={addDept} style={{ padding:'10px 18px', borderRadius:10, background:'var(--pri)', border:'none', color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              + Add
            </button>
          </div>
          <div style={{ marginTop:16, padding:'12px 14px', background:'var(--bg-s1)', borderRadius:10, border:'1px solid var(--border)', fontSize:12, color:'var(--txt4)', lineHeight:1.6 }}>
            💡 Exemplos: Vendas, Suporte, Financeiro, SAC, Técnico, Pós-venda
          </div>
        </>
      )}

      {/* ── STEP 4 — Agentes ── */}
      {step===4 && (
        <>
          <h2 style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>Equipe de atendimento</h2>
          <p style={{ fontSize:13, color:'var(--txt3)', marginBottom:20 }}>
            Cadastre os atendentes. Os acessos serão criados pela nossa equipe e enviados a você.
          </p>
          <div style={{ padding:'10px 14px', background:'var(--bg-s1)', borderRadius:10, border:'1px solid var(--border)', marginBottom:16, fontSize:12, color:'var(--txt3)', lineHeight:1.8 }}>
            <div>
              <strong style={{ color:'var(--txt2)' }}>E-mail padrão: </strong>
              <code style={{ color:'var(--pri-l)', fontSize:11 }}>{`nome.${cleanCompany}@${cleanCompany}.aloai`}</code>
            </div>
            <div>
              <strong style={{ color:'var(--txt2)' }}>Senha padrão: </strong>
              <code style={{ color:'var(--pri-l)', fontSize:11 }}>{`${cleanCompany}123`}</code>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {agents.map((agent, i) => (
              <div key={i} style={{ background:'var(--bg-s1)', borderRadius:14, padding:'14px', border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', gap:10, marginBottom:12, alignItems:'flex-end' }}>
                  <div style={{ flex:2 }}>
                    {i===0 && <label style={labelStyle}>Nome do atendente</label>}
                    <input
                      value={agent.name}
                      onChange={e=>updateAgent(i,'name',e.target.value)}
                      placeholder="Ex: Ana Souza"
                      style={{ width:'100%', background:'var(--bg-s2)', border:'1px solid var(--border2)', borderRadius:8, padding:'9px 12px', color:'var(--txt1)', fontFamily:'var(--font)', fontSize:13, outline:'none', marginTop:i===0?6:0 }}
                    />
                  </div>
                  <div style={{ flex:1 }}>
                    {i===0 && <label style={labelStyle}>Função</label>}
                    <select
                      value={agent.role}
                      onChange={e=>updateAgent(i,'role',e.target.value)}
                      style={{ width:'100%', background:'var(--bg-s2)', border:'1px solid var(--border2)', borderRadius:8, padding:'9px 10px', color:'var(--txt2)', fontFamily:'var(--font)', fontSize:13, outline:'none', marginTop:i===0?6:0 }}>
                      <option value="agent">Agente</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {agents.length > 1 && (
                    <button
                      onClick={()=>removeAgent(i)}
                      style={{ padding:'9px 10px', background:'var(--err-bg)', border:'1px solid rgba(239,68,68,.3)', borderRadius:8, color:'var(--err)', cursor:'pointer', fontSize:14, flexShrink:0, marginTop:i===0?22:0 }}>
                      ✕
                    </button>
                  )}
                </div>

                {/* Departamentos do agente */}
                <div>
                  <div style={{ fontSize:11, color:'var(--txt4)', fontWeight:600, letterSpacing:'.08em', marginBottom:8, textTransform:'uppercase' }}>Departamentos</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {depts.map(d => {
                      const sel = agent.departments.includes(d)
                      return (
                        <button key={d} onClick={()=>toggleDept(i,d)} style={{
                          padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:500,
                          cursor:'pointer', fontFamily:'var(--font)',
                          border:`1px solid ${sel?'var(--pri)':'var(--border2)'}`,
                          background:sel?'var(--pri-dim)':'transparent',
                          color:sel?'var(--pri-l)':'var(--txt4)',
                          transition:'all .15s',
                        }}>{d}</button>
                      )
                    })}
                    {depts.length === 0 && (
                      <span style={{ fontSize:12, color:'var(--txt4)' }}>Volte ao passo anterior e adicione departamentos.</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addAgent} style={{ width:'100%', marginTop:12, padding:'10px', borderRadius:10, background:'transparent', border:'1px dashed var(--border2)', color:'var(--txt3)', fontFamily:'var(--font)', fontSize:13, cursor:'pointer' }}>
            + Adicionar atendente
          </button>
        </>
      )}

      {/* Navigation */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:28 }}>
        {step > 1
          ? <BtnNav onClick={()=>setStep(s=>s-1)}>← Voltar</BtnNav>
          : <div/>
        }
        {step < TOTAL
          ? <BtnNav primary disabled={!canNext()} onClick={()=>{ if(canNext()) setStep(s=>s+1) }}>Continuar →</BtnNav>
          : <BtnNav primary disabled={!canNext()} onClick={handleSubmit}>Enviar formulário ✓</BtnNav>
        }
      </div>
    </Page>
  )
}

/* ── Layout wrapper ── */
function Page({ children }) {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:'var(--font)' }}>
      <div style={{ marginBottom:28 }}>
        <LogoFull size={34}/>
      </div>
      <div style={{ background:'var(--bg-page)', border:'1px solid var(--border2)', borderRadius:20, padding:'36px 40px', width:'100%', maxWidth:520, boxShadow:'var(--shadow)' }}>
        {children}
      </div>
      <p style={{ fontSize:12, color:'var(--txt4)', marginTop:20 }}>© 2025 ALO AI · Seus dados ficam protegidos</p>
    </div>
  )
}

/* ── Shared components ── */
const labelStyle = { fontSize:12, fontWeight:600, color:'var(--txt3)', display:'block' }

function Field({ label, value, onChange, placeholder, type='text', multiline }) {
  const [focused, setFocused] = useState(false)
  const shared = {
    value,
    onChange: e => onChange(e.target.value),
    placeholder,
    onFocus:  () => setFocused(true),
    onBlur:   () => setFocused(false),
    style: {
      width:'100%', background:'var(--bg-s1)',
      border:`1px solid ${focused?'var(--pri)':'var(--border2)'}`,
      borderRadius:10, padding:'10px 14px', color:'var(--txt1)',
      fontFamily:'var(--font)', fontSize:13, outline:'none',
      transition:'border-color .15s', resize:'none', marginTop:6,
    },
  }
  return (
    <div style={{ display:'flex', flexDirection:'column' }}>
      <label style={labelStyle}>{label}</label>
      {multiline ? <textarea {...shared} rows={3}/> : <input {...shared} type={type}/>}
    </div>
  )
}

function Toggle({ checked }) {
  return (
    <div style={{ width:38, height:22, borderRadius:11, background:checked?'var(--pri)':'var(--bg-s3)', position:'relative', flexShrink:0, transition:'background .2s' }}>
      <div style={{ position:'absolute', top:3, left:checked?19:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.3)' }}/>
    </div>
  )
}

function BtnNav({ children, primary, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:'10px 22px', borderRadius:10, fontFamily:'var(--font)',
      fontSize:13, fontWeight:600, cursor:disabled?'not-allowed':'pointer',
      border:'none',
      background:primary?'var(--pri)':'var(--bg-s2)',
      color:primary?'#fff':'var(--txt2)',
      opacity:disabled?.45:1, transition:'all .15s',
    }}>{children}</button>
  )
}

function WaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.885a.5.5 0 0 0 .622.606l6.188-1.62A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.652-.52-5.166-1.428l-.371-.22-3.844 1.007 1.025-3.733-.242-.386A9.937 9.937 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  )
}