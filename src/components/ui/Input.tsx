/**
 * Input.tsx - Apple-style Input with Microinteractions
 *
 * Features focus glow, smooth label float, and validation states.
 */

import { forwardRef, type InputHTMLAttributes, useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/theme'
import { AlertCircle, CheckCircle } from 'lucide-react'

const inputVariants = cva(
  `w-full rounded-xl border bg-transparent px-4 py-3 text-sm
   transition-all duration-200 ease-out
   placeholder:text-gray-400 dark:placeholder:text-gray-500
   focus:outline-none focus:ring-2 focus:ring-offset-0
   disabled:cursor-not-allowed disabled:opacity-50`,
  {
    variants: {
      variant: {
        default: `
          border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900
          text-gray-900 dark:text-gray-100
          focus:border-primary-500 focus:ring-primary-500/20
          dark:focus:border-primary-400 dark:focus:ring-primary-400/20
        `,
        filled: `
          border-transparent
          bg-gray-100 dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          focus:bg-white dark:focus:bg-gray-900
          focus:border-primary-500 focus:ring-primary-500/20
        `,
        ghost: `
          border-transparent
          bg-transparent
          text-gray-900 dark:text-gray-100
          focus:bg-gray-50 dark:focus:bg-gray-800/50
          focus:border-gray-200 focus:ring-0
        `,
      },
      state: {
        default: '',
        error: `
          border-red-300 dark:border-red-500
          focus:border-red-500 focus:ring-red-500/20
        `,
        success: `
          border-green-300 dark:border-green-500
          focus:border-green-500 focus:ring-green-500/20
        `,
      },
      inputSize: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-11 px-4 text-sm',
        lg: 'h-13 px-5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      state: 'default',
      inputSize: 'md',
    },
  }
)

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  helperText?: string
  errorText?: string
  successText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      state,
      inputSize,
      label,
      helperText,
      errorText,
      successText,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const id = useId()

    const actualState = errorText ? 'error' : successText ? 'success' : state

    return (
      <div className="w-full">
        {label && (
          <motion.label
            htmlFor={id}
            className={cn(
              'block text-sm font-medium mb-1.5 transition-colors',
              isFocused
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-700 dark:text-gray-300'
            )}
            animate={{ x: isFocused ? 2 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          )}

          <input
            id={id}
            ref={ref}
            className={cn(
              inputVariants({ variant, state: actualState, inputSize }),
              leftIcon ? 'pl-10' : undefined,
              rightIcon ? 'pr-10' : undefined,
              className
            )}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          )}

          {actualState === 'error' && !rightIcon && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"
            >
              <AlertCircle className="h-5 w-5" />
            </motion.div>
          )}

          {actualState === 'success' && !rightIcon && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
            >
              <CheckCircle className="h-5 w-5" />
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {(helperText || errorText || successText) && (
            <motion.p
              key={errorText || successText || helperText}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'mt-1.5 text-xs',
                errorText
                  ? 'text-red-500'
                  : successText
                  ? 'text-green-500'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {errorText || successText || helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input, inputVariants }
