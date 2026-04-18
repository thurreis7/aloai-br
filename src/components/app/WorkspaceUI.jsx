export function PageShell({ children, contentStyle }) {
  return (
    <div className="workspace-page">
      <div className="workspace-backdrop" aria-hidden />
      <div className="workspace-content" style={contentStyle}>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="workspace-header">
      <div>
        {eyebrow ? <span className="workspace-eyebrow">{eyebrow}</span> : null}
        <h1 className="workspace-title">{title}</h1>
        {description ? <p className="workspace-description">{description}</p> : null}
      </div>
      {actions ? <div className="workspace-actions">{actions}</div> : null}
    </header>
  )
}

export function GlassCard({ children, className = '', style, interactive = false, ...props }) {
  return (
    <section
      className={['workspace-card', interactive ? 'workspace-card--interactive' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
      {...props}
    >
      {children}
    </section>
  )
}

export function CardHeader({ title, description, action }) {
  return (
    <div className="workspace-card-head">
      <div>
        <div className="workspace-card-title">{title}</div>
        {description ? <div className="workspace-card-description">{description}</div> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

export function MetricCard({ label, value, hint, accent = 'var(--pri)', meta }) {
  return (
    <GlassCard className="metric-card">
      <div className="metric-card__top">
        <span className="metric-card__label">{label}</span>
        <span className="metric-card__dot" style={{ background: accent }} aria-hidden />
      </div>
      <div className="metric-card__value">{value}</div>
      {hint ? <div className="metric-card__hint">{hint}</div> : null}
      {meta ? <div className="metric-card__meta">{meta}</div> : null}
    </GlassCard>
  )
}

export function StatusPill({ children, tone = 'default' }) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>
}

export function EmptyState({ title, description, action, icon = '○' }) {
  return (
    <GlassCard className="workspace-empty">
      <div className="workspace-empty__icon" aria-hidden>{icon}</div>
      <h2 className="workspace-empty__title">{title}</h2>
      <p className="workspace-empty__description">{description}</p>
      {action ? <div>{action}</div> : null}
    </GlassCard>
  )
}

export function SkeletonBlock({ height = 16, width = '100%', radius = 12, style }) {
  return (
    <div
      className="workspace-skeleton"
      style={{ height, width, borderRadius: radius, ...style }}
    />
  )
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="segmented-control">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'segmented-control__button segmented-control__button--active' : 'segmented-control__button'}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
