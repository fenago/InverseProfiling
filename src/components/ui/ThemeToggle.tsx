/**
 * ThemeToggle.tsx - Refined Theme Switcher
 *
 * Clean, minimal toggle between light, dark, and system themes.
 * Multiple variants for different contexts.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, cn, type Theme } from '../../lib/theme'
import { Button } from './Button'

interface ThemeToggleProps {
  variant?: 'icon' | 'switch' | 'dropdown' | 'compact'
  className?: string
}

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={cn('relative overflow-hidden', className)}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={resolvedTheme}
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </motion.div>
        </AnimatePresence>
      </Button>
    )
  }

  if (variant === 'switch') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Sun className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <button
          role="switch"
          aria-checked={resolvedTheme === 'dark'}
          onClick={toggleTheme}
          className={cn(
            'relative h-6 w-11 rounded-full transition-colors duration-200',
            resolvedTheme === 'dark'
              ? 'bg-indigo-600'
              : 'bg-gray-200 dark:bg-gray-700'
          )}
        >
          <motion.div
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md"
            animate={{ left: resolvedTheme === 'dark' ? '22px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
        <Moon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div>
    )
  }

  // Compact variant - smaller segmented control with labels
  if (variant === 'compact') {
    const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
      { value: 'light', icon: Sun, label: 'Light' },
      { value: 'dark', icon: Moon, label: 'Dark' },
      { value: 'system', icon: Monitor, label: 'Auto' },
    ]

    return (
      <div className={cn('flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg', className)}>
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'relative flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors text-[12px] font-medium',
              theme === value
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
            )}
            aria-label={`${value} theme`}
          >
            {theme === value && (
              <motion.div
                layoutId="theme-compact-indicator"
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative flex items-center gap-1">
              <Icon className="h-3 w-3" strokeWidth={2.5} />
              <span>{label}</span>
            </span>
          </button>
        ))}
      </div>
    )
  }

  // Dropdown variant - full labels
  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className={cn('flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl', className)}>
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'relative flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
            theme === value
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          {theme === value && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

export default ThemeToggle
