/**
 * Real-time Emotion Detection System (Phase 6)
 *
 * Maps prosodic features to emotional states using Russell's Circumplex Model:
 * - Valence (pleasantness): Positive ↔ Negative (-1 to 1)
 * - Arousal (activation): High ↔ Low (-1 to 1)
 *
 * This creates 8 primary emotional quadrants:
 * - High valence + High arousal: Excited, Happy, Elated
 * - High valence + Low arousal: Calm, Relaxed, Serene
 * - Low valence + High arousal: Angry, Anxious, Stressed
 * - Low valence + Low arousal: Sad, Bored, Depressed
 *
 * References:
 * - Russell, J. A. (1980). A circumplex model of affect
 * - Scherer, K. R. (2003). Vocal communication of emotion
 * - Juslin, P. N., & Laukka, P. (2003). Communication of emotions in vocal expression
 */

import type { ProsodicFeatures } from './audio-analyzer'

// ============================================================================
// Types
// ============================================================================

/**
 * Core emotional state based on valence-arousal model
 */
export interface EmotionalState {
  // Primary dimensions (-1 to 1)
  valence: number         // Positive ↔ Negative
  arousal: number         // High ↔ Low

  // Derived emotion label
  primaryEmotion: EmotionLabel
  secondaryEmotion: EmotionLabel | null

  // Confidence in the detection (0-1)
  confidence: number

  // Intensity of the emotion (0-1)
  intensity: number

  // Timestamp
  timestamp: number
}

/**
 * Emotion labels based on circumplex quadrants
 */
export type EmotionLabel =
  // High arousal, high valence (Q1)
  | 'excited' | 'happy' | 'elated' | 'enthusiastic'
  // Low arousal, high valence (Q2)
  | 'calm' | 'relaxed' | 'serene' | 'content'
  // Low arousal, low valence (Q3)
  | 'sad' | 'bored' | 'tired' | 'depressed'
  // High arousal, low valence (Q4)
  | 'angry' | 'anxious' | 'stressed' | 'frustrated'
  // Neutral
  | 'neutral'

/**
 * Emotion with color and icon for UI display
 */
export interface EmotionDisplay {
  label: EmotionLabel
  color: string           // Hex color
  bgColor: string         // Background color (lighter)
  emoji: string           // Representative emoji
  description: string     // User-friendly description
  quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'center'
}

/**
 * Emotion timeline entry for storage
 */
export interface EmotionTimelineEntry {
  id?: number
  sessionId: string
  messageId?: string
  valence: number
  arousal: number
  primaryEmotion: EmotionLabel
  confidence: number
  intensity: number
  timestamp: number
  prosodicSnapshot?: string  // JSON of key prosodic features
}

/**
 * Real-time emotion stream data
 */
export interface EmotionStreamData {
  currentState: EmotionalState
  recentHistory: EmotionalState[]  // Last N states
  trend: EmotionTrend
  averageValence: number
  averageArousal: number
}

export type EmotionTrend = 'improving' | 'declining' | 'stable' | 'fluctuating'

// ============================================================================
// Constants
// ============================================================================

/**
 * Emotion display configuration for UI
 */
export const EMOTION_DISPLAYS: Record<EmotionLabel, EmotionDisplay> = {
  // Q1: High arousal, High valence
  excited: {
    label: 'excited',
    color: '#f59e0b',    // Amber
    bgColor: '#fef3c7',
    emoji: '🤩',
    description: 'Feeling energetic and positive',
    quadrant: 'Q1',
  },
  happy: {
    label: 'happy',
    color: '#22c55e',    // Green
    bgColor: '#dcfce7',
    emoji: '😊',
    description: 'Feeling good and upbeat',
    quadrant: 'Q1',
  },
  elated: {
    label: 'elated',
    color: '#f97316',    // Orange
    bgColor: '#ffedd5',
    emoji: '🥳',
    description: 'Feeling joyful and thrilled',
    quadrant: 'Q1',
  },
  enthusiastic: {
    label: 'enthusiastic',
    color: '#eab308',    // Yellow
    bgColor: '#fef9c3',
    emoji: '🔥',
    description: 'Feeling passionate and eager',
    quadrant: 'Q1',
  },

  // Q2: Low arousal, High valence
  calm: {
    label: 'calm',
    color: '#06b6d4',    // Cyan
    bgColor: '#cffafe',
    emoji: '😌',
    description: 'Feeling peaceful and at ease',
    quadrant: 'Q2',
  },
  relaxed: {
    label: 'relaxed',
    color: '#14b8a6',    // Teal
    bgColor: '#ccfbf1',
    emoji: '😊',
    description: 'Feeling comfortable and unwound',
    quadrant: 'Q2',
  },
  serene: {
    label: 'serene',
    color: '#0ea5e9',    // Sky blue
    bgColor: '#e0f2fe',
    emoji: '🧘',
    description: 'Feeling tranquil and centered',
    quadrant: 'Q2',
  },
  content: {
    label: 'content',
    color: '#10b981',    // Emerald
    bgColor: '#d1fae5',
    emoji: '☺️',
    description: 'Feeling satisfied and pleased',
    quadrant: 'Q2',
  },

  // Q3: Low arousal, Low valence
  sad: {
    label: 'sad',
    color: '#6366f1',    // Indigo
    bgColor: '#e0e7ff',
    emoji: '😢',
    description: 'Feeling down or unhappy',
    quadrant: 'Q3',
  },
  bored: {
    label: 'bored',
    color: '#9ca3af',    // Gray
    bgColor: '#f3f4f6',
    emoji: '😐',
    description: 'Feeling uninterested or weary',
    quadrant: 'Q3',
  },
  tired: {
    label: 'tired',
    color: '#a78bfa',    // Violet
    bgColor: '#ede9fe',
    emoji: '😴',
    description: 'Feeling fatigued or drained',
    quadrant: 'Q3',
  },
  depressed: {
    label: 'depressed',
    color: '#7c3aed',    // Purple
    bgColor: '#ddd6fe',
    emoji: '😞',
    description: 'Feeling very low or hopeless',
    quadrant: 'Q3',
  },

  // Q4: High arousal, Low valence
  angry: {
    label: 'angry',
    color: '#ef4444',    // Red
    bgColor: '#fee2e2',
    emoji: '😠',
    description: 'Feeling upset or irritated',
    quadrant: 'Q4',
  },
  anxious: {
    label: 'anxious',
    color: '#f97316',    // Orange
    bgColor: '#ffedd5',
    emoji: '😰',
    description: 'Feeling worried or nervous',
    quadrant: 'Q4',
  },
  stressed: {
    label: 'stressed',
    color: '#dc2626',    // Red-600
    bgColor: '#fecaca',
    emoji: '😫',
    description: 'Feeling overwhelmed or tense',
    quadrant: 'Q4',
  },
  frustrated: {
    label: 'frustrated',
    color: '#ea580c',    // Orange-600
    bgColor: '#fed7aa',
    emoji: '😤',
    description: 'Feeling annoyed or stuck',
    quadrant: 'Q4',
  },

  // Center: Neutral
  neutral: {
    label: 'neutral',
    color: '#6b7280',    // Gray-500
    bgColor: '#f9fafb',
    emoji: '😐',
    description: 'Feeling neither positive nor negative',
    quadrant: 'center',
  },
}

/**
 * Feature weights for valence calculation
 * Based on research: Scherer (2003), Juslin & Laukka (2003)
 */
const VALENCE_WEIGHTS = {
  // Positive valence indicators
  harmonicToNoiseRatio: 0.25,  // Clear voice = positive
  energyMean: 0.15,            // Higher energy can be positive
  pitchRange: 0.15,            // More expression = positive

  // Negative valence indicators (inverted)
  jitter: -0.25,               // Voice tremor = negative
  shimmer: -0.2,               // Amplitude instability = negative
  pauseRatio: -0.1,            // Too many pauses = negative
}

/**
 * Feature weights for arousal calculation
 */
const AROUSAL_WEIGHTS = {
  // High arousal indicators
  pitchMean: 0.2,              // Higher pitch = higher arousal
  pitchStd: 0.2,               // More pitch variation = higher arousal
  speechRate: 0.25,            // Faster speech = higher arousal
  energyMean: 0.2,             // Louder = higher arousal
  energyStd: 0.15,             // More dynamic = higher arousal

  // Low arousal indicators (inverted)
  pauseRatio: -0.15,           // More pauses = lower arousal
}

// ============================================================================
// Core Detection Functions
// ============================================================================

/**
 * Detect emotional state from prosodic features
 */
export function detectEmotion(features: ProsodicFeatures): EmotionalState {
  // Calculate valence and arousal
  const valence = calculateValence(features)
  const arousal = calculateArousal(features)

  // Determine primary and secondary emotions
  const { primary, secondary } = mapToEmotions(valence, arousal)

  // Calculate confidence based on feature quality
  const confidence = calculateConfidence(features)

  // Calculate intensity based on distance from center
  const intensity = Math.sqrt(valence * valence + arousal * arousal) / Math.sqrt(2)

  return {
    valence,
    arousal,
    primaryEmotion: primary,
    secondaryEmotion: secondary,
    confidence,
    intensity: Math.min(1, intensity),
    timestamp: Date.now(),
  }
}

/**
 * Calculate valence (positive ↔ negative) from prosodic features
 * Returns value from -1 (very negative) to 1 (very positive)
 */
function calculateValence(features: ProsodicFeatures): number {
  let score = 0
  let totalWeight = 0

  // Harmonic-to-noise ratio (0-1): Clear voice is positive
  const hnrNorm = features.harmonicToNoiseRatio
  score += hnrNorm * VALENCE_WEIGHTS.harmonicToNoiseRatio
  totalWeight += Math.abs(VALENCE_WEIGHTS.harmonicToNoiseRatio)

  // Energy mean: Moderate energy is positive, very low is negative
  // Normalize to 0-1 (typical range 0-0.2)
  const energyNorm = Math.min(1, features.energyMean / 0.15)
  score += energyNorm * VALENCE_WEIGHTS.energyMean
  totalWeight += Math.abs(VALENCE_WEIGHTS.energyMean)

  // Pitch range: More expression (higher range) tends to be positive
  // Normalize (typical range 0-200 Hz)
  const pitchRangeNorm = Math.min(1, features.pitchRange / 150)
  score += pitchRangeNorm * VALENCE_WEIGHTS.pitchRange
  totalWeight += Math.abs(VALENCE_WEIGHTS.pitchRange)

  // Jitter (voice tremor): High jitter is negative (anxiety, sadness)
  // Normalize (typical range 0-5%)
  const jitterNorm = Math.min(1, features.jitter / 4)
  score += jitterNorm * VALENCE_WEIGHTS.jitter
  totalWeight += Math.abs(VALENCE_WEIGHTS.jitter)

  // Shimmer (amplitude instability): High shimmer is negative
  // Normalize (typical range 0-10%)
  const shimmerNorm = Math.min(1, features.shimmer / 8)
  score += shimmerNorm * VALENCE_WEIGHTS.shimmer
  totalWeight += Math.abs(VALENCE_WEIGHTS.shimmer)

  // Pause ratio: Too many pauses suggests hesitation/negativity
  const pauseNorm = features.pauseRatio
  score += pauseNorm * VALENCE_WEIGHTS.pauseRatio
  totalWeight += Math.abs(VALENCE_WEIGHTS.pauseRatio)

  // Normalize to -1 to 1 range
  const normalizedScore = score / totalWeight

  // Apply sigmoid-like transformation for smoother distribution
  return Math.tanh(normalizedScore * 2)
}

/**
 * Calculate arousal (high ↔ low activation) from prosodic features
 * Returns value from -1 (very low arousal) to 1 (very high arousal)
 */
function calculateArousal(features: ProsodicFeatures): number {
  let score = 0
  let totalWeight = 0

  // Pitch mean: Higher pitch = higher arousal
  // Normalize (typical range 80-400 Hz, center around 180)
  const pitchNorm = (features.pitchMean - 180) / 150
  score += Math.max(-1, Math.min(1, pitchNorm)) * AROUSAL_WEIGHTS.pitchMean
  totalWeight += Math.abs(AROUSAL_WEIGHTS.pitchMean)

  // Pitch variability: More variation = higher arousal
  // Normalize (typical range 0-50 Hz)
  const pitchStdNorm = Math.min(1, features.pitchStd / 35)
  score += pitchStdNorm * AROUSAL_WEIGHTS.pitchStd
  totalWeight += Math.abs(AROUSAL_WEIGHTS.pitchStd)

  // Speech rate: Faster = higher arousal
  // Normalize (typical range 2-8 syllables/sec, center around 4.5)
  const speechRateNorm = (features.speechRate - 4.5) / 2.5
  score += Math.max(-1, Math.min(1, speechRateNorm)) * AROUSAL_WEIGHTS.speechRate
  totalWeight += Math.abs(AROUSAL_WEIGHTS.speechRate)

  // Energy mean: Louder = higher arousal
  // Normalize (typical range 0-0.2)
  const energyNorm = Math.min(1, features.energyMean / 0.12)
  score += (energyNorm * 2 - 1) * AROUSAL_WEIGHTS.energyMean  // Map to -1 to 1
  totalWeight += Math.abs(AROUSAL_WEIGHTS.energyMean)

  // Energy variability: More dynamic = higher arousal
  // Normalize (typical range 0-0.1)
  const energyStdNorm = Math.min(1, features.energyStd / 0.06)
  score += energyStdNorm * AROUSAL_WEIGHTS.energyStd
  totalWeight += Math.abs(AROUSAL_WEIGHTS.energyStd)

  // Pause ratio: More pauses = lower arousal
  score += features.pauseRatio * AROUSAL_WEIGHTS.pauseRatio
  totalWeight += Math.abs(AROUSAL_WEIGHTS.pauseRatio)

  // Pitch contour adjustments
  if (features.pitchContour === 'variable') {
    score += 0.15  // Variable pitch = higher arousal
  } else if (features.pitchContour === 'flat') {
    score -= 0.1   // Flat pitch = lower arousal
  }

  // Loudness contour adjustments
  if (features.loudnessContour === 'dynamic') {
    score += 0.1   // Dynamic loudness = higher arousal
  }

  // Normalize to -1 to 1 range
  const normalizedScore = score / totalWeight

  return Math.tanh(normalizedScore * 2)
}

/**
 * Map valence and arousal to discrete emotion labels
 */
function mapToEmotions(valence: number, arousal: number): {
  primary: EmotionLabel
  secondary: EmotionLabel | null
} {
  // Check if neutral (near center)
  const distance = Math.sqrt(valence * valence + arousal * arousal)
  if (distance < 0.2) {
    return { primary: 'neutral', secondary: null }
  }

  // Determine quadrant
  const isHighArousal = arousal > 0
  const isPositiveValence = valence > 0

  // Calculate angle for more precise emotion mapping
  const angle = Math.atan2(arousal, valence) * (180 / Math.PI)

  let primary: EmotionLabel
  let secondary: EmotionLabel | null = null

  if (isPositiveValence && isHighArousal) {
    // Q1: High arousal, High valence (0-90 degrees)
    if (angle < 30) {
      primary = 'happy'
      secondary = 'content'
    } else if (angle < 60) {
      primary = 'excited'
      secondary = 'enthusiastic'
    } else {
      primary = 'enthusiastic'
      secondary = 'excited'
    }
  } else if (isPositiveValence && !isHighArousal) {
    // Q2: Low arousal, High valence (-90 to 0 degrees)
    if (angle > -30) {
      primary = 'content'
      secondary = 'calm'
    } else if (angle > -60) {
      primary = 'relaxed'
      secondary = 'serene'
    } else {
      primary = 'calm'
      secondary = 'relaxed'
    }
  } else if (!isPositiveValence && !isHighArousal) {
    // Q3: Low arousal, Low valence (-180 to -90 degrees)
    if (angle > -120) {
      primary = 'bored'
      secondary = 'tired'
    } else if (angle > -150) {
      primary = 'sad'
      secondary = 'tired'
    } else {
      primary = 'depressed'
      secondary = 'sad'
    }
  } else {
    // Q4: High arousal, Low valence (90-180 degrees)
    if (angle < 120) {
      primary = 'frustrated'
      secondary = 'anxious'
    } else if (angle < 150) {
      primary = 'anxious'
      secondary = 'stressed'
    } else {
      primary = 'angry'
      secondary = 'frustrated'
    }
  }

  return { primary, secondary }
}

/**
 * Calculate detection confidence based on prosodic feature quality
 */
function calculateConfidence(features: ProsodicFeatures): number {
  let confidence = 0.5  // Base confidence

  // Boost if we have reasonable speaking time
  if (features.speakingDuration > 3000) confidence += 0.1
  if (features.speakingDuration > 8000) confidence += 0.1

  // Boost if pitch is in reasonable range
  if (features.pitchMean > 80 && features.pitchMean < 400) confidence += 0.1

  // Boost if we detected pitch variability
  if (features.pitchStd > 5) confidence += 0.05

  // Boost if energy levels are reasonable
  if (features.energyMean > 0.01 && features.energyMean < 0.3) confidence += 0.1

  // Penalize if mostly silence
  if (features.pauseRatio > 0.7) confidence -= 0.2

  // Penalize if too quiet
  if (features.energyMean < 0.005) confidence -= 0.15

  return Math.max(0.1, Math.min(1, confidence))
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get display information for an emotion
 */
export function getEmotionDisplay(emotion: EmotionLabel): EmotionDisplay {
  return EMOTION_DISPLAYS[emotion] || EMOTION_DISPLAYS.neutral
}

/**
 * Get a human-readable summary of the emotional state
 */
export function getEmotionSummary(state: EmotionalState): string {
  const display = getEmotionDisplay(state.primaryEmotion)
  const intensityDesc = state.intensity > 0.7 ? 'strongly' :
                        state.intensity > 0.4 ? 'moderately' : 'slightly'

  if (state.primaryEmotion === 'neutral') {
    return 'Feeling neutral and balanced'
  }

  let summary = `${display.emoji} ${intensityDesc} ${state.primaryEmotion}`

  if (state.secondaryEmotion && state.intensity > 0.3) {
    summary += ` with hints of ${state.secondaryEmotion}`
  }

  return summary
}

/**
 * Calculate emotion trend from history
 */
export function calculateEmotionTrend(history: EmotionalState[]): EmotionTrend {
  if (history.length < 3) return 'stable'

  // Look at valence changes over time
  const recentValences = history.slice(0, 5).map(s => s.valence)
  const oldValences = history.slice(Math.max(0, history.length - 5)).map(s => s.valence)

  const recentAvg = recentValences.reduce((a, b) => a + b, 0) / recentValences.length
  const oldAvg = oldValences.reduce((a, b) => a + b, 0) / oldValences.length
  const diff = recentAvg - oldAvg

  // Check for fluctuation
  const variance = calculateVariance(history.slice(0, 10).map(s => s.valence))
  if (variance > 0.15) return 'fluctuating'

  if (diff > 0.15) return 'improving'
  if (diff < -0.15) return 'declining'
  return 'stable'
}

function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squareDiffs = values.map(v => Math.pow(v - mean, 2))
  return squareDiffs.reduce((a, b) => a + b, 0) / values.length
}

/**
 * Blend two emotional states (for smooth transitions)
 */
export function blendEmotions(
  current: EmotionalState,
  previous: EmotionalState,
  blendFactor: number = 0.3
): EmotionalState {
  const blendedValence = previous.valence * blendFactor + current.valence * (1 - blendFactor)
  const blendedArousal = previous.arousal * blendFactor + current.arousal * (1 - blendFactor)

  const { primary, secondary } = mapToEmotions(blendedValence, blendedArousal)
  const blendedIntensity = Math.sqrt(blendedValence ** 2 + blendedArousal ** 2) / Math.sqrt(2)

  return {
    valence: blendedValence,
    arousal: blendedArousal,
    primaryEmotion: primary,
    secondaryEmotion: secondary,
    confidence: (current.confidence + previous.confidence) / 2,
    intensity: Math.min(1, blendedIntensity),
    timestamp: current.timestamp,
  }
}

/**
 * Create a neutral emotional state (for initialization)
 */
export function createNeutralState(): EmotionalState {
  return {
    valence: 0,
    arousal: 0,
    primaryEmotion: 'neutral',
    secondaryEmotion: null,
    confidence: 0.5,
    intensity: 0,
    timestamp: Date.now(),
  }
}

/**
 * Check if two emotions are similar (in same quadrant)
 */
export function areEmotionsSimilar(a: EmotionLabel, b: EmotionLabel): boolean {
  const displayA = EMOTION_DISPLAYS[a]
  const displayB = EMOTION_DISPLAYS[b]
  return displayA.quadrant === displayB.quadrant
}

/**
 * Get emotions by quadrant
 */
export function getEmotionsByQuadrant(quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'center'): EmotionLabel[] {
  return Object.entries(EMOTION_DISPLAYS)
    .filter(([_, display]) => display.quadrant === quadrant)
    .map(([label]) => label as EmotionLabel)
}

/**
 * Convert emotional state to coordinates for visualization (0-100 scale)
 */
export function emotionToCoordinates(state: EmotionalState): { x: number; y: number } {
  return {
    x: (state.valence + 1) * 50,   // 0-100, center at 50
    y: (1 - state.arousal) * 50,   // Invert so high arousal is at top, 0-100, center at 50
  }
}

/**
 * Get color gradient between two quadrants for visualization
 */
export function getQuadrantColor(valence: number, arousal: number): string {
  // Map to HSL color space
  // Hue: 0 (red/angry) -> 120 (green/happy) based on valence
  // Saturation based on intensity
  // Lightness: consistent for visibility

  const hue = ((valence + 1) / 2) * 120  // 0-120 (red to green)
  const saturation = Math.min(80, 40 + Math.abs(arousal) * 40)  // 40-80%
  const lightness = 50 + (arousal > 0 ? -5 : 5)  // Slightly darker for high arousal

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export default {
  detectEmotion,
  getEmotionDisplay,
  getEmotionSummary,
  calculateEmotionTrend,
  blendEmotions,
  createNeutralState,
  EMOTION_DISPLAYS,
}
