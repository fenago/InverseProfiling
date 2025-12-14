/**
 * Badge.tsx - Apple-style Badge with Microinteractions
 *
 * Features pulse animation, smooth color transitions.
 */

import { type HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/theme'

const badgeVariants = cva(
  `inline-flex items-center gap-1.5 rounded-full font-medium
   transition-all duration-200`,
  {
    variants: {
      variant: {
        default: `
          bg-gray-100 text-gray-700
          dark:bg-gray-800 dark:text-gray-300
        `,
        primary: `
          bg-primary-100 text-primary-700
          dark:bg-primary-900/50 dark:text-primary-300
        `,
        success: `
          bg-green-100 text-green-700
          dark:bg-green-900/50 dark:text-green-300
        `,
        warning: `
          bg-amber-100 text-amber-700
          dark:bg-amber-900/50 dark:text-amber-300
        `,
        error: `
          bg-red-100 text-red-700
          dark:bg-red-900/50 dark:text-red-300
        `,
        info: `
          bg-blue-100 text-blue-700
          dark:bg-blue-900/50 dark:text-blue-300
        `,
        outline: `
          bg-transparent border border-current
          text-gray-600 dark:text-gray-400
        `,
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean
  dot?: boolean
  dotColor?: string
}

export function Badge({
  className,
  variant,
  size,
  pulse = false,
  dot = false,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <motion.span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-75',
                dotColor || 'bg-current'
              )}
              animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          <span
            className={cn(
              'relative inline-flex h-2 w-2 rounded-full',
              dotColor || 'bg-current'
            )}
          />
        </span>
      )}
      {children}
    </motion.span>
  )
}

export { badgeVariants }
