import { NavLink, Outlet } from 'react-router-dom'
import { Mail, Settings, BarChart3, History, FileText } from 'lucide-react'
import { cx } from '@shared/utils/cx'

const nav = [
  { to: '/mail', label: 'Emails', icon: Mail, end: true },
  { to: '/mail/history', label: 'History', icon: History },
  { to: '/mail/usage', label: 'Usage', icon: BarChart3 },
  { to: '/mail/templates', label: 'Templates', icon: FileText },
  { to: '/mail/settings', label: 'Settings', icon: Settings },
]

export default function AppShell() {
  return (
    <div className="flex h-full">
      <aside className="w-56 border-r border-canvas-border bg-canvas-panel flex flex-col">
        <div className="px-4 py-5 border-b border-canvas-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-500 grid place-items-center text-white text-sm font-bold">
              C
            </div>
            <div className="font-semibold">Composer Studio</div>
          </div>
        </div>
        <nav className="p-2 flex-1 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-100',
                )
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 text-xs text-gray-400 border-t border-canvas-border">
          Mocked backend · localStorage
        </div>
      </aside>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
