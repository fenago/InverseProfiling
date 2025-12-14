/**
 * GlowingBorder.tsx - Apple-style Glowing Border Effect
 *
 * Creates a subtle animated glow around elements.
 */

import { type ReactNode, type HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/theme'

interface GlowingBorderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  glowColor?: string
  borderRadius?: string
  intensity?: 'low' | 'medium' | 'high'
  animated?: boolean
}

export function GlowingBorder({
  children,
  glowColor = 'rgba(59, 130, 246, 0.5)',
  borderRadius = '1rem',
  intensity = 'medium',
  animated = true,
  className,
  ...props
}: GlowingBorderProps) {
  const glowIntensity = {
    low: '10px',
    medium: '20px',
    high: '30px',
  }

  return (
    <div
      className={cn('relative', className)}
      style={{ borderRadius }}
      {...props}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-[1px] rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
          filter: `blur(${glowIntensity[intensity]})`,
        }}
        animate={
          animated
            ? {
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }
            : undefined
        }
        transition={
          animated
            ? {
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }
            : undefined
        }
      />

      {/* Border */}
      <div
        className="absolute -inset-[1px] rounded-[inherit]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${glowColor} 50%, transparent 100%)`,
          backgroundSize: '200% 100%',
        }}
      />

      {/* Content container */}
      <div className="relative bg-white dark:bg-gray-900 rounded-[inherit]">
        {children}
      </div>
    </div>
  )
}

// Animated gradient border card
interface AnimatedBorderCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  gradientColors?: string[]
}

export function AnimatedBorderCard({
  children,
  gradientColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#3b82f6'],
  className,
  ...props
}: AnimatedBorderCardProps) {
  return (
    <div className={cn('relative group p-[1px] rounded-2xl', className)} {...props}>
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `conic-gradient(from 0deg, ${gradientColors.join(', ')})`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Inner glow on hover */}
      <div className="absolute inset-[1px] rounded-2xl bg-white dark:bg-gray-900 transition-all duration-300 group-hover:inset-[2px]" />

      {/* Content */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl">
        {children}
      </div>
    </div>
  )
}

export default GlowingBorder
