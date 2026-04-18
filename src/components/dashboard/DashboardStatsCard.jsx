import { GlassCalendar } from '../calendar/GlassCalendar'
import { MessageSquare, CheckCircle2, Timer, Star, Bot, UserPlus, TrendingUp, PieChart, LayoutDashboard, Activity } from 'lucide-react'

export function DashboardStatsCard({ title, value, delta, icon, trend = 'up', color = 'var(--pri)' }) {
  return (
    <div style={glass({ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' })}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: `${color}08`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <icon size={18} strokeWidth={2} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--txt3)',
            margin: '0',
            letterSpacing: '-0.01em'
          }}>{title}</h3>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            marginTop: '4px'
          }}>
            <p style={{
              fontSize: '28px',
              fontWeight: '800',
              letterSpacing: '-0.02em',
              margin: '0',
              lineHeight: '1'
            }}>{value}</p>
            <span style={{
              fontSize: '12px',
              fontWeight: '500',
              color: trend === 'up' ? 'var(--success)' : 'var(--err)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {trend === 'up' ? '▲' : '▼'} {delta}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardChartCard({ title, subTitle, chartType, data }) {
  return (
    <div style={glass({ padding: '24px' })}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: 'var(--txt1)',
            margin: '0',
            letterSpacing: '-0.01em'
          }}>{title}</h3>
          {subTitle && (
            <p style={{
              fontSize: '13px',
              color: 'var(--txt3)',
              marginTop: '2px',
              lineHeight: '1.4'
            }}>{subTitle}</p>
          )}
        </div>
      </div>
      <div id={`chart-${chartType}`} style={{
        height: '200px',
        position: 'relative'
      }}></div>
    </div>
  )
}

export function DashboardInsightCard({ title, items, icon }) {
  return (
    <div style={glass({ padding: '20px' })}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--pri-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <icon size={16} color='var(--pri)' />
        </div>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--txt1)',
          margin: '0',
          letterSpacing: '-0.01em'
        }}>{title}</h3>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {items.map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: index < items.length - 1 ? '1px solid var(--border-dim)' : 'none'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column'
            }}>
              <p style={{
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--txt2)',
                margin: '0'
              }}>{item.label}</p>
              <p style={{
                fontSize: '11px',
                color: 'var(--txt4)',
                marginTop: '2px'
              }}>{item.value}</p>
            </div>
            <div style={{
              textAlign: 'right',
              minWidth: '80px'
            }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--txt1)',
                margin: '0'
              }}>{item.metric}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function QuickActionsGrid({ actions }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: '12px'
    }}>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          style={actionGlass()}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: `${action.color || 'var(--pri-dim')}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <action.icon size={18} color={action.color || 'var(--pri)'} />
            </div>
            <span style={{
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--txt2)',
              textAlign: 'center'
            }}>{action.label}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

// Helper functions
const glass = (extra = {}) => ({
  background: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  ...extra,
})

const actionGlass = () => ({
  background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '16px',
  cursor: 'pointer',
  transition: 'all .2s ease',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  '&:hover': {
    background: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  }
})