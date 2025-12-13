/**
 * EmotionIndicator.tsx - Phase 6: Real-time Emotion Detection UI Component
 *
 * Displays the user's detected emotional state during chat.
 * Uses Russell's Circumplex Model visualization with valence/arousal axes.
 */

import { useMemo } from 'react'
import {
  type EmotionalState,
  type EmotionLabel,
  EMOTION_DISPLAYS,
  getEmotionDisplay,
  getEmotionSummary,
  type EmotionTrend,
} from '../lib/emotion-detector'

// ==================== COMPONENT PROPS ====================

interface EmotionIndicatorProps {
  /** Current emotional state from detection */
  emotionalState: EmotionalState | null
  /** Emotion trend data (optional) */
  trend?: EmotionTrend | null
  /** Show compact version (emoji + label only) */
  compact?: boolean
  /** Show the circumplex visualization */
  showCircumplex?: boolean
  /** Show confidence meter */
  showConfidence?: boolean
  /** Custom className for styling */
  className?: string
  /** Animation enabled */
  animated?: boolean
}

interface EmotionHistoryProps {
  /** Array of recent emotional states */
  history: EmotionalState[]
  /** Max items to show */
  maxItems?: number
  /** Custom className */
  className?: string
}

interface CircumplexProps {
  /** Current valence value (-1 to 1) */
  valence: number
  /** Current arousal value (-1 to 1) */
  arousal: number
  /** Size of the visualization in pixels */
  size?: number
  /** Show axis labels */
  showLabels?: boolean
  /** Show quadrant labels */
  showQuadrants?: boolean
}

// ==================== MAIN COMPONENT ====================

export function EmotionIndicator({
  emotionalState,
  trend,
  compact = false,
  showCircumplex = false,
  showConfidence = true,
  className = '',
  animated = true,
}: EmotionIndicatorProps) {
  // Default to neutral if no state
  const state = emotionalState ?? {
    valence: 0,
    arousal: 0,
    primaryEmotion: 'neutral' as EmotionLabel,
    secondaryEmotion: null,
    confidence: 0,
    intensity: 0,
    timestamp: Date.now(),
  }

  const display = getEmotionDisplay(state.primaryEmotion)
  const summary = getEmotionSummary(state)

  // Determine pulse animation based on arousal
  const pulseClass = animated && state.arousal > 0.3
    ? 'animate-pulse'
    : ''

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${className}`}
        style={{ backgroundColor: `${display.color}20` }}
        title={summary}
      >
        <span className={`text-lg ${pulseClass}`}>{display.emoji}</span>
        <span className="text-sm font-medium capitalize">{state.primaryEmotion}</span>
        {state.confidence > 0.5 && (
          <span className="text-xs opacity-60">
            {Math.round(state.confidence * 100)}%
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Emotional State
        </h3>
        {trend && (
          <TrendIndicator trend={trend} />
        )}
      </div>

      {/* Main emotion display */}
      <div className="flex items-center gap-4 mb-3">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${pulseClass}`}
          style={{ backgroundColor: `${display.color}30` }}
        >
          {display.emoji}
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold capitalize" style={{ color: display.color }}>
            {state.primaryEmotion}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {display.description}
          </div>
          {state.secondaryEmotion && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Also feeling: {state.secondaryEmotion}
            </div>
          )}
        </div>
      </div>

      {/* Valence/Arousal bars */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs w-16 text-gray-500">Valence</span>
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${((state.valence + 1) / 2) * 100}%`,
                backgroundColor: state.valence >= 0 ? '#10b981' : '#ef4444',
              }}
            />
          </div>
          <span className="text-xs w-8 text-right text-gray-500">
            {state.valence >= 0 ? '+' : ''}{state.valence.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-16 text-gray-500">Arousal</span>
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 bg-purple-500"
              style={{
                width: `${((state.arousal + 1) / 2) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs w-8 text-right text-gray-500">
            {state.arousal >= 0 ? '+' : ''}{state.arousal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Confidence meter */}
      {showConfidence && (
        <div className="flex items-center gap-2">
          <span className="text-xs w-16 text-gray-500">Confidence</span>
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 bg-blue-500"
              style={{ width: `${state.confidence * 100}%` }}
            />
          </div>
          <span className="text-xs w-8 text-right text-gray-500">
            {Math.round(state.confidence * 100)}%
          </span>
        </div>
      )}

      {/* Circumplex visualization */}
      {showCircumplex && (
        <div className="mt-4 flex justify-center">
          <CircumplexVisualization
            valence={state.valence}
            arousal={state.arousal}
            size={160}
            showLabels
            showQuadrants
          />
        </div>
      )}
    </div>
  )
}

// ==================== CIRCUMPLEX VISUALIZATION ====================

export function CircumplexVisualization({
  valence,
  arousal,
  size = 200,
  showLabels = true,
  showQuadrants = false,
}: CircumplexProps) {
  const center = size / 2
  const radius = (size / 2) - 20

  // Convert valence/arousal to x/y coordinates
  const x = center + (valence * radius)
  const y = center - (arousal * radius) // Invert Y for screen coordinates

  // Quadrant colors
  const quadrantColors = {
    q1: 'rgba(16, 185, 129, 0.1)',  // High arousal, positive valence (green)
    q2: 'rgba(239, 68, 68, 0.1)',   // High arousal, negative valence (red)
    q3: 'rgba(107, 114, 128, 0.1)', // Low arousal, negative valence (gray)
    q4: 'rgba(59, 130, 246, 0.1)',  // Low arousal, positive valence (blue)
  }

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="text-gray-300 dark:text-gray-600"
      />

      {/* Quadrant fills */}
      {showQuadrants && (
        <>
          {/* Q1: High arousal, Positive valence (top-right) */}
          <path
            d={`M ${center} ${center} L ${center} ${center - radius} A ${radius} ${radius} 0 0 1 ${center + radius} ${center} Z`}
            fill={quadrantColors.q1}
          />
          {/* Q2: High arousal, Negative valence (top-left) */}
          <path
            d={`M ${center} ${center} L ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center} ${center - radius} Z`}
            fill={quadrantColors.q2}
          />
          {/* Q3: Low arousal, Negative valence (bottom-left) */}
          <path
            d={`M ${center} ${center} L ${center} ${center + radius} A ${radius} ${radius} 0 0 1 ${center - radius} ${center} Z`}
            fill={quadrantColors.q3}
          />
          {/* Q4: Low arousal, Positive valence (bottom-right) */}
          <path
            d={`M ${center} ${center} L ${center + radius} ${center} A ${radius} ${radius} 0 0 1 ${center} ${center + radius} Z`}
            fill={quadrantColors.q4}
          />
        </>
      )}

      {/* Axes */}
      <line
        x1={center - radius}
        y1={center}
        x2={center + radius}
        y2={center}
        stroke="currentColor"
        strokeWidth="1"
        className="text-gray-400 dark:text-gray-500"
      />
      <line
        x1={center}
        y1={center - radius}
        x2={center}
        y2={center + radius}
        stroke="currentColor"
        strokeWidth="1"
        className="text-gray-400 dark:text-gray-500"
      />

      {/* Axis labels */}
      {showLabels && (
        <>
          <text
            x={center + radius + 5}
            y={center + 4}
            className="text-xs fill-gray-500 dark:fill-gray-400"
          >
            +
          </text>
          <text
            x={center - radius - 12}
            y={center + 4}
            className="text-xs fill-gray-500 dark:fill-gray-400"
          >
            −
          </text>
          <text
            x={center - 12}
            y={center - radius - 5}
            className="text-xs fill-gray-500 dark:fill-gray-400"
          >
            High
          </text>
          <text
            x={center - 10}
            y={center + radius + 15}
            className="text-xs fill-gray-500 dark:fill-gray-400"
          >
            Low
          </text>
        </>
      )}

      {/* Current position marker */}
      <circle
        cx={x}
        cy={y}
        r={8}
        fill="currentColor"
        className="text-purple-500"
        filter="url(#glow)"
      />
      <circle
        cx={x}
        cy={y}
        r={4}
        fill="white"
      />

      {/* Glow effect */}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}

// ==================== TREND INDICATOR ====================

function TrendIndicator({ trend }: { trend: EmotionTrend }) {
  const getTrendIcon = () => {
    if (trend === 'improving') return '↗️'
    if (trend === 'declining') return '↘️'
    if (trend === 'fluctuating') return '↕️'
    return '→'
  }

  const getTrendColor = () => {
    if (trend === 'improving') return 'text-green-500'
    if (trend === 'declining') return 'text-red-500'
    if (trend === 'fluctuating') return 'text-yellow-500'
    return 'text-gray-500'
  }

  return (
    <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
      <span>{getTrendIcon()}</span>
      <span className="capitalize">{trend}</span>
    </div>
  )
}

// ==================== EMOTION HISTORY TIMELINE ====================

export function EmotionHistory({
  history,
  maxItems = 10,
  className = '',
}: EmotionHistoryProps) {
  const displayHistory = useMemo(() => {
    return history.slice(0, maxItems)
  }, [history, maxItems])

  if (displayHistory.length === 0) {
    return (
      <div className={`text-sm text-gray-500 text-center py-4 ${className}`}>
        No emotion history yet
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
        Recent Emotions
      </h4>
      <div className="flex flex-wrap gap-1">
        {displayHistory.map((state, index) => {
          const display = getEmotionDisplay(state.primaryEmotion)
          return (
            <div
              key={`${state.timestamp}-${index}`}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{ backgroundColor: `${display.color}15` }}
              title={`${state.primaryEmotion} at ${new Date(state.timestamp).toLocaleTimeString()}`}
            >
              <span>{display.emoji}</span>
              <span className="opacity-70">{formatTimeAgo(state.timestamp)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ==================== EMOTION BADGE (INLINE) ====================

interface EmotionBadgeProps {
  emotion: EmotionLabel
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function EmotionBadge({
  emotion,
  size = 'md',
  showLabel = true,
  className = '',
}: EmotionBadgeProps) {
  const display = getEmotionDisplay(emotion)

  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-base px-3 py-1',
    lg: 'text-lg px-4 py-1.5',
  }

  const emojiSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: `${display.color}20`, color: display.color }}
    >
      <span className={emojiSizes[size]}>{display.emoji}</span>
      {showLabel && (
        <span className="font-medium capitalize">{emotion}</span>
      )}
    </span>
  )
}

// ==================== EMOTION DISTRIBUTION CHART ====================

interface EmotionDistributionProps {
  distribution: Record<string, number>
  className?: string
}

export function EmotionDistribution({
  distribution,
  className = '',
}: EmotionDistributionProps) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)

  if (total === 0) {
    return (
      <div className={`text-sm text-gray-500 text-center py-4 ${className}`}>
        No emotion data
      </div>
    )
  }

  const sortedEmotions = Object.entries(distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6) // Top 6 emotions

  return (
    <div className={`space-y-2 ${className}`}>
      {sortedEmotions.map(([emotion, count]) => {
        const display = EMOTION_DISPLAYS[emotion as EmotionLabel] || EMOTION_DISPLAYS.neutral
        const percentage = (count / total) * 100

        return (
          <div key={emotion} className="flex items-center gap-2">
            <span className="text-lg w-6">{display.emoji}</span>
            <span className="text-xs w-20 capitalize truncate">{emotion}</span>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: display.color,
                }}
              />
            </div>
            <span className="text-xs w-10 text-right text-gray-500">
              {Math.round(percentage)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ==================== HELPER FUNCTIONS ====================

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

// ==================== EXPORTS ====================

export default EmotionIndicator
