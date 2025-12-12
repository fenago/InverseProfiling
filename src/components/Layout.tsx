import { Outlet, NavLink } from 'react-router-dom'
import { MessageSquare, User, Activity, Settings, Brain } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/', icon: MessageSquare, label: 'Chat' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/activity', icon: Activity, label: 'Activity' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">QMU.io</h1>
              <p className="text-xs text-gray-500">Privacy-First AI</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )
                  }
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Privacy Badge */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium">100% On-Device</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              All data stays on your device
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
