import { useState } from 'react'

export function Button({ children, variant = 'primary', size = 'md', onClick, disabled, fullWidth, icon }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, fontFamily: 'var(--font)', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', borderRadius: 'var(--r8)', transition: 'all .15s',
    width: fullWidth ? '100%' : 'auto', opacity: disabled ? .5 : 1,
    whiteSpace: 'nowrap',
  }
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 11 },
    md: { padding: '9px 18px', fontSize: 13 },
    lg: { padding: '12px 24px', fontSize: 14 },
  }
  const variants = {
    primary:   { background: 'var(--pri)',   color: '#fff', border: 'none' },
    secondary: { background: 'var(--bg-s2)', color: 'var(--txt2)', border: '1px solid var(--border2)' },
    ghost:     { background: 'transparent',  color: 'var(--txt3)', border: '1px solid var(--border)' },
    danger:    { background: 'var(--err-bg)',color: 'var(--err)',   border: '1px solid rgba(217,64,64,.3)' },
    success:   { background: 'var(--success)',color: '#fff',        border: 'none' },
  }
  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant] }} onClick={onClick} disabled={disabled}>
      {icon && <span style={{ display:'flex' }}>{icon}</span>}
      {children}
    </button>
  )
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default:  { background:'var(--bg-s2)',    color:'var(--txt3)',   border:'1px solid var(--border2)' },
    primary:  { background:'var(--pri-dim)',  color:'var(--pri-l)',  border:'1px solid var(--bg-s3)' },
    success:  { background:'var(--success-bg)',color:'var(--success)' },
    warning:  { background:'var(--warn-bg)',  color:'var(--warn)' },
    error:    { background:'var(--err-bg)',   color:'var(--err)' },
    info:     { background:'var(--info-bg)',  color:'var(--info)' },
    whatsapp: { background:'rgba(29,160,106,.15)', color:'#1DA06A' },
    instagram:{ background:'rgba(170,94,222,.15)', color:'var(--pri-l)' },
    email:    { background:'rgba(232,120,10,.15)',  color:'var(--warn)' },
    webchat:  { background:'rgba(94,184,255,.15)',  color:'var(--info)' },
  }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'2px 8px', borderRadius:20, fontSize:10.5, fontWeight:600,
      letterSpacing:'.04em', ...variants[variant]
    }}>{children}</span>
  )
}

export function Input({ label, placeholder, value, onChange, type='text', icon, hint }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'var(--txt3)', letterSpacing:'.04em' }}>{label}</label>}
      <div style={{
        display:'flex', alignItems:'center', gap:8,
        background:'var(--bg-s1)', border:`1px solid ${focused ? 'var(--pri)' : 'var(--border2)'}`,
        borderRadius:'var(--r8)', padding:'9px 12px', transition:'border-color .15s'
      }}>
        {icon && <span style={{ color:'var(--txt4)', display:'flex', flexShrink:0 }}>{icon}</span>}
        <input
          type={type} placeholder={placeholder} value={value} onChange={onChange}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{
            background:'none', border:'none', outline:'none', color:'var(--txt1)',
            fontFamily:'var(--font)', fontSize:13, width:'100%',
          }}
        />
      </div>
      {hint && <span style={{ fontSize:11, color:'var(--txt4)' }}>{hint}</span>}
    </div>
  )
}

export function Card({ children, style, onClick, hoverable }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={()=>hoverable && setHov(true)}
      onMouseLeave={()=>setHov(false)}
      onClick={onClick}
      style={{
        background:'var(--bg-card)', border:`1px solid ${hov ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius:'var(--r16)', padding:20, transition:'all .18s',
        cursor: hoverable ? 'pointer' : 'default',
        boxShadow: hov ? 'var(--shadow-sm)' : 'none', ...style
      }}
    >{children}</div>
  )
}

export function Avatar({ initials, color, size = 38, online }) {
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <div style={{
        width:size, height:size, borderRadius:'50%', background:color || 'var(--pri)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: size*0.34, fontWeight:700, color:'#fff', flexShrink:0
      }}>{initials}</div>
      {online !== undefined && (
        <div style={{
          position:'absolute', bottom:1, right:1,
          width:size*0.28, height:size*0.28, borderRadius:'50%',
          background: online ? 'var(--success)' : 'var(--txt4)',
          border:`2px solid var(--bg-page)`
        }}/>
      )}
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
      <div
        onClick={onChange}
        style={{
          width:40, height:22, borderRadius:11, position:'relative',
          background: checked ? 'var(--pri)' : 'var(--bg-s3)',
          transition:'background .2s', flexShrink:0
        }}
      >
        <div style={{
          position:'absolute', top:3, left: checked ? 21 : 3,
          width:16, height:16, borderRadius:'50%', background:'#fff',
          transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.3)'
        }}/>
      </div>
      {label && <span style={{ fontSize:13, color:'var(--txt2)' }}>{label}</span>}
    </label>
  )
}

export function StatCard({ label, value, delta, deltaPositive, icon, color }) {
  return (
    <Card>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <span style={{ fontSize:11.5, color:'var(--txt3)', fontWeight:500, letterSpacing:'.04em' }}>{label}</span>
        {icon && (
          <div style={{
            width:32, height:32, borderRadius:'var(--r8)',
            background: color ? `${color}22` : 'var(--pri-dim)',
            display:'flex', alignItems:'center', justifyContent:'center', color: color || 'var(--pri-l)'
          }}>{icon}</div>
        )}
      </div>
      <div style={{ fontSize:28, fontWeight:800, color:'var(--txt1)', marginBottom:6 }}>{value}</div>
      {delta && (
        <span style={{ fontSize:11, color: deltaPositive ? 'var(--success)' : 'var(--err)', fontWeight:500 }}>
          {deltaPositive ? '↑' : '↓'} {delta}
        </span>
      )}
    </Card>
  )
}
