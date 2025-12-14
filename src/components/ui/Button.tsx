/**
 * Button.tsx - Apple-style Button with Microinteractions
 *
 * Features magnetic hover, scale press, and smooth transitions.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/theme'

const buttonVariants = cva(
  // Base styles
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl
   text-sm font-medium transition-all duration-200 ease-out
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
   disabled:pointer-events-none disabled:opacity-50
   select-none cursor-pointer`,
  {
    variants: {
      variant: {
        default: `
          bg-primary-600 text-white
          hover:bg-primary-700
          dark:bg-primary-500 dark:hover:bg-primary-600
          focus-visible:ring-primary-500
          shadow-lg shadow-primary-500/25
          hover:shadow-xl hover:shadow-primary-500/30
        `,
        secondary: `
          bg-gray-100 text-gray-900
          hover:bg-gray-200
          dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700
          focus-visible:ring-gray-500
        `,
        outline: `
          border-2 border-gray-200 bg-transparent text-gray-700
          hover:bg-gray-50 hover:border-gray-300
          dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-600
          focus-visible:ring-gray-500
        `,
        ghost: `
          bg-transparent text-gray-600
          hover:bg-gray-100 hover:text-gray-900
          dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100
          focus-visible:ring-gray-500
        `,
        destructive: `
          bg-red-500 text-white
          hover:bg-red-600
          dark:bg-red-600 dark:hover:bg-red-700
          focus-visible:ring-red-500
          shadow-lg shadow-red-500/25
        `,
        success: `
          bg-green-500 text-white
          hover:bg-green-600
          dark:bg-green-600 dark:hover:bg-green-700
          focus-visible:ring-green-500
          shadow-lg shadow-green-500/25
        `,
        glass: `
          bg-white/10 text-white backdrop-blur-md
          border border-white/20
          hover:bg-white/20
          dark:bg-white/5 dark:hover:bg-white/10
          focus-visible:ring-white/50
        `,
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, isLoading, leftIcon, rightIcon, disabled, ...props }, ref) => {
    // Motion props with microinteractions
    const motionProps: HTMLMotionProps<'button'> = {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 17,
      },
    }

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...motionProps}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {isLoading ? (
          <motion.div
            className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
