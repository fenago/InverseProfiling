/**
 * Layout.tsx - Refined Apple-style Navigation Layout
 *
 * Clean, minimal design with thoughtful spacing,
 * subtle animations, and cohesive typography.
 */

import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  UserCircle2,
  BarChart3,
  Settings2,
  Sparkles,
  Timer,
  Lock,
  Activity,
  Info
} from 'lucide-react'
import { cn } from '../lib/theme'
import { ParticlesBackground } from './ui/ParticlesBackground'
import { WavyBackground } from './ui/WavyBackground'
import { ThemeToggle } from './ui/ThemeToggle'

const navItems = [
  {
    to: '/',
    icon: MessageCircle,
    label: 'Chat',
    badge: null
  },
  {
    to: '/profile',
    icon: UserCircle2,
    label: 'Profile',
    badge: null
  },
  {
    to: '/activity',
    icon: Timer,
    label: 'Activity',
    badge: null
  },
  {
    to: '/benchmarks',
    icon: BarChart3,
    label: 'Benchmarks',
    badge: null
  },
  {
    to: '/status',
    icon: Activity,
    label: 'Status',
    badge: null
  },
  {
    to: '/about',
    icon: Info,
    label: 'About',
    badge: null
  },
  {
    to: '/settings',
    icon: Settings2,
    label: 'Settings',
    badge: null
  },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Background Effects - Subtle and layered */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <WavyBackground
          speed="slow"
          intensity="subtle"
          className="opacity-40 dark:opacity-20"
        />
        <ParticlesBackground
          particleCount={35}
          interactive={true}
          className="opacity-60 dark:opacity-40"
        />
      </div>

      {/* Sidebar */}
      <aside className="relative z-10 w-64 flex flex-col">
        {/* Frosted glass background */}
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-r border-gray-200/50 dark:border-gray-800/50" />

        {/* Sidebar content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo Section */}
          <motion.div
            className="px-5 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              </motion.div>
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white text-base tracking-tight">
                  QMU.io
                </h1>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">
                  On-Device AI
                </p>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2">
            <ul className="space-y-0.5">
              {navItems.map(({ to, icon: Icon, label, badge }, index) => (
                <motion.li
                  key={to}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150',
                        isActive
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute inset-0 bg-gray-100 dark:bg-gray-800/80 rounded-lg"
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 35
                            }}
                          />
                        )}

                        {/* Icon */}
                        <span className="relative z-10">
                          <Icon
                            className={cn(
                              'w-[18px] h-[18px] transition-colors duration-150',
                              isActive
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                            )}
                            strokeWidth={isActive ? 2.25 : 1.75}
                          />
                        </span>

                        {/* Label */}
                        <span className="relative z-10 flex-1">{label}</span>

                        {/* Optional badge */}
                        {badge && (
                          <span className="relative z-10 px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded">
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </motion.li>
              ))}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="px-3 pb-4 space-y-3">
            {/* Theme Toggle */}
            <motion.div
              className="px-3 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-2">
                Appearance
              </p>
              <ThemeToggle variant="compact" />
            </motion.div>

            {/* Privacy indicator */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mx-1 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/60 dark:border-emerald-800/40"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide uppercase">
                    Private by Design
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="mt-2 text-[11px] text-emerald-600/80 dark:text-emerald-400/70 leading-relaxed">
                All processing happens locally on your device.
              </p>
            </motion.div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="h-full overflow-auto"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
