import * as React from 'react'
import { Settings, Plus, Edit2, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  getDate,
  getDaysInMonth,
  startOfMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const ScrollbarHide = () => (
  <style>{`
    .glass-cal-scrollbar::-webkit-scrollbar { display: none; }
    .glass-cal-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
)

export const GlassCalendar = React.forwardRef(function GlassCalendar(
  { className, selectedDate: propSelectedDate, onDateSelect, compact = false, ...props },
  ref
) {
  const [currentMonth, setCurrentMonth] = React.useState(propSelectedDate || new Date())
  const [selectedDate, setSelectedDate] = React.useState(propSelectedDate || new Date())
  const [view, setView] = React.useState('monthly')

  const monthDays = React.useMemo(() => {
    const start = startOfMonth(currentMonth)
    const totalDays = getDaysInMonth(currentMonth)
    const days = []
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(start.getFullYear(), start.getMonth(), i + 1)
      days.push({
        date,
        isToday: isToday(date),
        isSelected: isSameDay(date, selectedDate),
      })
    }
    return days
  }, [currentMonth, selectedDate])

  const handleDateClick = (date) => {
    setSelectedDate(date)
    onDateSelect?.(date)
  }

  return (
    <div
      ref={ref}
      className={clsx('glass-calendar', compact && 'glass-calendar--compact', className)}
      {...props}
    >
      <ScrollbarHide />
      <div className="glass-cal-header">
        <div className="glass-cal-tabs">
          <button
            type="button"
            className={clsx('glass-cal-tab', view === 'weekly' && 'glass-cal-tab--on')}
            onClick={() => setView('weekly')}
          >
            Semanal
          </button>
          <button
            type="button"
            className={clsx('glass-cal-tab', view === 'monthly' && 'glass-cal-tab--on')}
            onClick={() => setView('monthly')}
          >
            Mensal
          </button>
        </div>
        <button type="button" className="glass-cal-icon-btn" aria-label="Preferências do calendário">
          <Settings className="glass-cal-icon" />
        </button>
      </div>

      <div className="glass-cal-nav">
        <motion.p
          key={format(currentMonth, 'yyyy-MM')}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="glass-cal-month"
        >
          {format(currentMonth, 'MMMM', { locale: ptBR })}
          <span className="glass-cal-year">{format(currentMonth, 'yyyy')}</span>
        </motion.p>
        <div className="glass-cal-arrows">
          <button
            type="button"
            className="glass-cal-icon-btn"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="glass-cal-icon" />
          </button>
          <button
            type="button"
            className="glass-cal-icon-btn"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight className="glass-cal-icon" />
          </button>
        </div>
      </div>

      <div className="glass-cal-scroll glass-cal-scrollbar">
        <div className="glass-cal-days">
          {monthDays.map((day) => (
            <div key={format(day.date, 'yyyy-MM-dd')} className="glass-cal-daycol">
              <span className="glass-cal-dow">{format(day.date, 'EEE', { locale: ptBR }).charAt(0)}</span>
              <button
                type="button"
                onClick={() => handleDateClick(day.date)}
                className={clsx(
                  'glass-cal-day',
                  day.isSelected && 'glass-cal-day--selected',
                  day.isToday && !day.isSelected && 'glass-cal-day--today'
                )}
              >
                {getDate(day.date)}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-cal-divider" />

      <div className="glass-cal-footer">
        <button type="button" className="glass-cal-foot-link">
          <Edit2 className="glass-cal-icon-sm" />
          <span>Nota rápida...</span>
        </button>
        <button type="button" className="glass-cal-foot-primary">
          <Plus className="glass-cal-icon-sm" />
          <span>Novo evento</span>
        </button>
      </div>
    </div>
  )
})

GlassCalendar.displayName = 'GlassCalendar'
