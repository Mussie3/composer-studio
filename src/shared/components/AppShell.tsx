import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Mail, Settings, BarChart3, History, FileText, Plus, ExternalLink } from 'lucide-react'
import { cx } from '@shared/utils/cx'
import BrandLogo from './BrandLogo'

const nav = [
  { to: '/mail', label: 'Emails', icon: Mail, end: true },
  { to: '/mail/templates', label: 'Templates', icon: FileText },
  { to: '/mail/history', label: 'History', icon: History },
  { to: '/mail/usage', label: 'Usage', icon: BarChart3 },
]

const meta = [{ to: '/mail/settings', label: 'Settings', icon: Settings }]

export default function AppShell() {
  const navigate = useNavigate()
  return (
    <div className="flex h-full">
      <aside className="w-60 shrink-0 border-r border-ink-100 bg-surface-panel/70 backdrop-blur flex flex-col">
        <div className="px-5 py-5">
          <BrandLogo size={28} withText />
        </div>

        <div className="px-3 mb-4">
          <button
            onClick={() => navigate('/mail/new')}
            className="btn-primary w-full justify-center"
          >
            <Plus size={14} /> New email
          </button>
        </div>

        <nav className="px-3 flex-1 space-y-0.5">
          {nav.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          <div className="my-3 h-px bg-ink-100" />
          {meta.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="mx-3 mb-4 panel-flat p-3 bg-brand-50/60 border-brand-100">
          <div className="text-[11px] font-semibold text-brand-700 mb-1 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500" /> Demo mode
          </div>
          <div className="text-[11px] text-ink-600 leading-relaxed">
            All data is mocked and persisted to <code className="text-[10px] bg-white/60 px-1 rounded">localStorage</code>.
          </div>
          <a
            href="https://github.com/Mussie3/composer-studio"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-brand-700 hover:text-brand-800"
          >
            View on GitHub <ExternalLink size={11} />
          </a>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
          isActive
            ? 'bg-brand-500 text-white shadow-soft'
            : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
        )
      }
    >
      <Icon size={15} />
      {label}
    </NavLink>
  )
}
