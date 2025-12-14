/**
 * Card.tsx - Apple-style Card with Microinteractions
 *
 * Features subtle hover lift, glass morphism, and smooth transitions.
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/theme'

const cardVariants = cva(
  // Base styles
  `rounded-2xl transition-all duration-300 ease-out`,
  {
    variants: {
      variant: {
        default: `
          bg-white border border-gray-200
          dark:bg-gray-900 dark:border-gray-800
          shadow-sm hover:shadow-md
        `,
        elevated: `
          bg-white border border-gray-100
          dark:bg-gray-900 dark:border-gray-800
          shadow-lg hover:shadow-xl
        `,
        glass: `
          bg-white/70 dark:bg-gray-900/70
          backdrop-blur-xl
          border border-white/20 dark:border-gray-700/30
          shadow-lg shadow-black/5
        `,
        gradient: `
          bg-gradient-to-br from-white to-gray-50
          dark:from-gray-900 dark:to-gray-800
          border border-gray-200 dark:border-gray-700
          shadow-lg hover:shadow-xl
        `,
        outline: `
          bg-transparent
          border-2 border-gray-200 dark:border-gray-700
          hover:border-gray-300 dark:hover:border-gray-600
        `,
        ghost: `
          bg-gray-50/50 dark:bg-gray-800/50
          hover:bg-gray-100/70 dark:hover:bg-gray-800/70
        `,
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      interactive: false,
    },
  }
)

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children?: ReactNode
  hoverEffect?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, children, hoverEffect = true, ...props }, ref) => {
    const motionProps: HTMLMotionProps<'div'> = hoverEffect
      ? {
          whileHover: { y: -2, scale: 1.005 },
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
          },
        }
      : {}

    return (
      <motion.div
        ref={ref}
        className={cn(cardVariants({ variant, padding, interactive, className }))}
        {...motionProps}
        {...(props as HTMLMotionProps<'div'>)}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

// Card Title
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100',
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

// Card Description
interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode
}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

// Card Content
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

// Card Footer
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants }
