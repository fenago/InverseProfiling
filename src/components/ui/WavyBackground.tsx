/**
 * WavyBackground.tsx - Animated Wavy Gradient Background
 *
 * Apple-inspired flowing gradient waves with smooth animations.
 * Supports light and dark themes.
 */

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../lib/theme'

interface WavyBackgroundProps {
  className?: string
  intensity?: 'subtle' | 'medium' | 'strong'
  speed?: 'slow' | 'normal' | 'fast'
  colors?: string[]
}

export function WavyBackground({
  className = '',
  intensity = 'subtle',
  speed = 'slow',
}: WavyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let time = 0

    const speedMultiplier = speed === 'slow' ? 0.0005 : speed === 'normal' ? 0.001 : 0.002
    const amplitudeMultiplier = intensity === 'subtle' ? 0.3 : intensity === 'medium' ? 0.5 : 0.8

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    resize()
    window.addEventListener('resize', resize)

    const isDark = resolvedTheme === 'dark'

    // Soft multi-color waves - playful gradient feel
    const waveColors = isDark
      ? [
          { r: 129, g: 140, b: 248, a: 0.10 },  // Indigo
          { r: 192, g: 132, b: 252, a: 0.08 },  // Purple
          { r: 56, g: 189, b: 248, a: 0.06 },   // Sky blue
        ]
      : [
          { r: 99, g: 102, b: 241, a: 0.05 },   // Indigo
          { r: 168, g: 85, b: 247, a: 0.04 },   // Purple
          { r: 14, g: 165, b: 233, a: 0.03 },   // Sky blue
        ]

    const drawWave = (
      yOffset: number,
      amplitude: number,
      frequency: number,
      phase: number,
      color: typeof waveColors[0]
    ) => {
      const rect = canvas.getBoundingClientRect()
      ctx.beginPath()
      ctx.moveTo(0, rect.height)

      for (let x = 0; x <= rect.width; x += 2) {
        const y = yOffset +
          Math.sin(x * frequency * 0.01 + phase) * amplitude * amplitudeMultiplier +
          Math.sin(x * frequency * 0.005 + phase * 0.5) * amplitude * 0.5 * amplitudeMultiplier

        ctx.lineTo(x, y)
      }

      ctx.lineTo(rect.width, rect.height)
      ctx.closePath()

      const gradient = ctx.createLinearGradient(0, yOffset - amplitude, 0, rect.height)
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`)
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`)

      ctx.fillStyle = gradient
      ctx.fill()
    }

    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Draw multiple overlapping waves
      drawWave(rect.height * 0.6, 80, 1.2, time * 0.8, waveColors[0])
      drawWave(rect.height * 0.7, 60, 1.5, time * 1.1 + 1, waveColors[1])
      drawWave(rect.height * 0.8, 40, 1.8, time * 0.6 + 2, waveColors[2])

      time += speedMultiplier * 60 // Normalize for 60fps
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [intensity, speed, resolvedTheme])

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  )
}

export default WavyBackground
