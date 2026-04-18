import { Outlet } from 'react-router-dom'
import { DockTabs } from '../navigation/DockTabs'

export default function AppLayout({ theme, toggleTheme }) {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet context={{ theme, toggleTheme }} />
      </main>

      <DockTabs theme={theme} toggleTheme={toggleTheme} />
    </div>
  )
}
