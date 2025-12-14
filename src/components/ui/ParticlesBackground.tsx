/**
 * ParticlesBackground.tsx - Elegant Colored Particles
 *
 * Curated color palette with soft glows.
 * Refined and intentional - not random.
 */

import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../lib/theme'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  colorIndex: number
}

interface ParticlesBackgroundProps {
  particleCount?: number
  className?: string
  interactive?: boolean
}

// Vibrant multi-color palette - saturated and crisp
const LIGHT_COLORS = [
  { r: 79, g: 70, b: 229 },    // Indigo (more saturated)
  { r: 147, g: 51, b: 234 },   // Purple (more saturated)
  { r: 219, g: 39, b: 119 },   // Pink (more saturated)
  { r: 6, g: 182, b: 212 },    // Cyan (brighter)
  { r: 16, g: 185, b: 129 },   // Emerald (brighter)
  { r: 245, g: 101, b: 36 },   // Orange (more vibrant)
]

const DARK_COLORS = [
  { r: 99, g: 102, b: 241 },   // Indigo
  { r: 168, g: 85, b: 247 },   // Purple
  { r: 244, g: 63, b: 94 },    // Rose
  { r: 34, g: 211, b: 238 },   // Cyan bright
  { r: 52, g: 211, b: 153 },   // Emerald bright
  { r: 251, g: 146, b: 60 },   // Orange bright
]

export function ParticlesBackground({
  particleCount = 40,
  className = '',
  interactive = true,
}: ParticlesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number | undefined>(undefined)
  const { resolvedTheme } = useTheme()

  const initParticles = useCallback((width: number, height: number) => {
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2.5,
      vy: (Math.random() - 0.5) * 2.5,
      size: Math.random() * 3 + 2,
      opacity: Math.random() * 0.5 + 0.4,
      colorIndex: Math.floor(Math.random() * 6),
    }))
  }, [particleCount])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      initParticles(rect.width, rect.height)
    }

    resize()
    window.addEventListener('resize', resize)

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove)
    }

    const isDark = resolvedTheme === 'dark'
    const colors = isDark ? DARK_COLORS : LIGHT_COLORS

    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      particlesRef.current.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap around
        if (particle.x < 0) particle.x = rect.width
        if (particle.x > rect.width) particle.x = 0
        if (particle.y < 0) particle.y = rect.height
        if (particle.y > rect.height) particle.y = 0

        // Gentle mouse interaction
        if (interactive) {
          const dx = mouseRef.current.x - particle.x
          const dy = mouseRef.current.y - particle.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const force = (120 - dist) / 120 * 0.01
            particle.vx -= dx * force * 0.05
            particle.vy -= dy * force * 0.05
          }
        }

        // Gentle friction
        particle.vx *= 0.995
        particle.vy *= 0.995

        const color = colors[particle.colorIndex]

        // Crisp solid circle - no blur
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${particle.opacity})`
        ctx.fill()

        // Connections between close particles of same color
        particlesRef.current.slice(i + 1).forEach(other => {
          if (other.colorIndex !== particle.colorIndex) return
          const dx = particle.x - other.x
          const dy = particle.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 100) {
            const opacity = (1 - dist / 100) * 0.25
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(other.x, other.y)
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [interactive, initParticles, resolvedTheme])

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  )
}

export default ParticlesBackground
