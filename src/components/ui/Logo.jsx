/**
 * Logo com texto em fundo claro (PNG): landing, headers, login/cadastro.
 * logo-full.png = variante para fundo escuro (quando precisar encaixar no preto).
 * Apenas ícone (fundo branco): favicon, avatares, espaços muito pequenos.
 */
export function LogoMark({ size = 40, className = '', title = 'ALO AI' }) {
  return (
    <img
      src="/brand/logo-icon.png"
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
      {...(title ? { title } : {})}
    />
  )
}

/** @param {{ size?: number, className?: string, variant?: 'light'|'dark' }} props — light: PNG fundo branco (padrão); dark: logo para fundo escuro */
export function LogoFull({ size = 32, className = '', variant = 'light' }) {
  const src = variant === 'dark' ? '/brand/logo-full.png' : '/brand/logo-full-wtbg.png'
  return (
    <img
      src={src}
      alt="ALO AI"
      className={className}
      style={{
        height: Math.max(28, size * 1.25),
        width: 'auto',
        maxWidth: 'min(280px, 100%)',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  )
}
