import { useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  Inbox,
  LayoutGrid,
  Users,
  BarChart3,
  Radio,
  Bot,
  LibraryBig,
  UsersRound,
  Settings,
  Home,
  Sun,
  Moon,
} from 'lucide-react'

const dockNav = [
  { id: 'inbox', path: '/app/inbox', name: 'Inbox', icon: Inbox },
  { id: 'kanban', path: '/app/kanban', name: 'Kanban', icon: LayoutGrid },
  { id: 'contacts', path: '/app/contacts', name: 'Contatos', icon: Users },
  { id: 'dashboard', path: '/app/dashboard', name: 'Metricas', icon: BarChart3 },
  { id: 'channels', path: '/app/channels', name: 'Canais', icon: Radio },
  { id: 'automation', path: '/app/automation', name: 'IA', icon: Bot },
  { id: 'knowledge', path: '/app/knowledge', name: 'Base IA', icon: LibraryBig },
  { id: 'team', path: '/app/team', name: 'Equipe', icon: UsersRound },
  { id: 'settings', path: '/app/settings', name: 'Configuracoes', icon: Settings },
]

function DockIcon({ item, mouseX }) {
  const ref = useRef(null)
  const Icon = item.icon
  const location = useLocation()

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const sizeSync = useTransform(distance, [-100, 0, 100], [34, 46, 34])
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 260, damping: 20 })

  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  const active =
    location.pathname === item.path ||
    (item.path !== '/app/inbox' && location.pathname.startsWith(item.path))

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      whileTap={{ scale: 0.94 }}
    >
      <NavLink
        to={item.path}
        end={item.path === '/app/inbox'}
        aria-current={active ? 'page' : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          borderRadius: 12,
          border: 'none',
          background: active ? 'var(--pri)' : 'transparent',
          color: active ? '#fff' : 'var(--txt3)',
          transition: 'color .15s, background .15s',
          boxShadow: active ? '0 4px 16px rgba(124,58,237,.3)' : 'none',
        }}
      >
        <motion.span
          animate={{ y: pressed ? 1.5 : hovered ? -3 : 0, scale: hovered ? 1.04 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon size={16} strokeWidth={active ? 2 : 1.75} />
        </motion.span>
      </NavLink>

      {active && <span className="dock-active-dot" aria-hidden />}
    </motion.div>
  )
}

function DockAction({ mouseX, label, onClick, children }) {
  const ref = useRef(null)
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })
  const sizeSync = useTransform(distance, [-100, 0, 100], [34, 46, 34])
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 260, damping: 20 })
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      whileTap={{ scale: 0.94 }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          borderRadius: 12,
          border: 'none',
          background: 'transparent',
          color: 'var(--txt3)',
          cursor: 'pointer',
          transition: 'color .15s, background .15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.06)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <motion.span
          animate={{ y: pressed ? 1.5 : hovered ? -3 : 0, scale: hovered ? 1.04 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {children}
        </motion.span>
      </button>
    </motion.div>
  )
}

function DockHome({ mouseX }) {
  const ref = useRef(null)
  const location = useLocation()
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })
  const sizeSync = useTransform(distance, [-100, 0, 100], [34, 46, 34])
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 260, damping: 20 })
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const active = location.pathname === '/'

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      whileTap={{ scale: 0.94 }}
    >
      <NavLink
        to="/"
        aria-label="Site publico"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          borderRadius: 12,
          border: 'none',
          background: active ? 'var(--pri)' : 'transparent',
          color: active ? '#fff' : 'var(--txt3)',
          transition: 'color .15s, background .15s',
          boxShadow: active ? '0 4px 16px rgba(124,58,237,.3)' : 'none',
        }}
      >
        <motion.span
          animate={{ y: pressed ? 1.5 : hovered ? -3 : 0, scale: hovered ? 1.04 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Home size={16} strokeWidth={active ? 2 : 1.75} />
        </motion.span>
      </NavLink>
      {active && <span className="dock-active-dot" aria-hidden />}
    </motion.div>
  )
}

export function DockTabs({ theme, toggleTheme }) {
  const mouseX = useMotionValue(Infinity)

  return (
    <>
      <nav className="dock-mobile" aria-label="Navegacao principal">
        {dockNav.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/app/inbox'}
              className={({ isActive }) =>
                ['dock-mobile-link', isActive ? 'dock-mobile-link--active' : ''].filter(Boolean).join(' ')
              }
            >
              <Icon size={20} strokeWidth={1.75} />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
        <button
          type="button"
          className="dock-mobile-link"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>Tema</span>
        </button>
        <NavLink to="/" className="dock-mobile-link">
          <Home size={20} strokeWidth={1.75} />
          <span>Site</span>
        </NavLink>
      </nav>

      <div className="dock-bar-wrap">
        <motion.div
          className="dock-bar"
          onMouseMove={(e) => mouseX.set(e.pageX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          role="navigation"
          aria-label="Dock"
        >
          {dockNav.map((item) => (
            <DockIcon key={item.id} item={item} mouseX={mouseX} />
          ))}
          <span className="dock-sep" aria-hidden />
          <DockAction
            mouseX={mouseX}
            label={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
          </DockAction>
          <DockHome mouseX={mouseX} />
        </motion.div>
      </div>
    </>
  )
}
