/**
 * Multimodal Fusion Layer
 *
 * Combines signals from multiple modalities for enhanced personality profiling:
 * - Text signals (LIWC, Embedding, LLM)
 * - Audio signals (prosodic features)
 * - Context signals (situational context)
 *
 * Uses weighted fusion with confidence-based adaptation and cross-modal validation.
 */

import type { PsychologicalDomain } from './analysis-config'
import { PSYCHOLOGICAL_DOMAINS } from './analysis-config'
import type { ProsodicFeatures, AudioAnalysisResult } from './audio-analyzer'
import type { ContextType } from './context-profiler'

// Types for modality signals
export interface TextSignal {
  type: 'liwc' | 'embedding' | 'llm'
  scores: Partial<Record<PsychologicalDomain, number>>
  confidence: number
  timestamp: number
}

export interface AudioSignal {
  features: ProsodicFeatures
  scores: Partial<Record<PsychologicalDomain, number>>
  confidence: number
  timestamp: number
}

export interface ContextSignal {
  context: ContextType
  confidence: number
  timestamp: number
}

// Fusion configuration
export interface FusionConfig {
  // Modal weights (should sum to 1.0)
  weights: {
    text: number     // Combined text signal weight
    audio: number    // Audio/prosodic signal weight
  }

  // Sub-weights for text signals (should sum to 1.0)
  textSubWeights: {
    liwc: number
    embedding: number
    llm: number
  }

  // Confidence thresholds
  minConfidence: number       // Minimum to include a signal
  crossModalBoost: number     // Boost when modalities agree
  crossModalPenalty: number   // Penalty when modalities conflict

  // Temporal settings
  temporalDecay: number       // How much older signals decay (per second)
  maxSignalAge: number        // Maximum age of signals to consider (ms)
}

// Default fusion configuration
export const DEFAULT_FUSION_CONFIG: FusionConfig = {
  weights: {
    text: 0.7,    // Text is primary modality
    audio: 0.3,   // Audio supplements
  },

  textSubWeights: {
    liwc: 0.2,
    embedding: 0.3,
    llm: 0.5,
  },

  minConfidence: 0.15,
  crossModalBoost: 1.2,      // 20% boost when modalities agree
  crossModalPenalty: 0.8,    // 20% penalty when conflict detected

  temporalDecay: 0.01,       // 1% decay per second
  maxSignalAge: 3600000,     // 1 hour max
}

// Fusion result structure
export interface FusionResult {
  // Final fused scores for all domains
  scores: Partial<Record<PsychologicalDomain, number>>

  // Confidence for each domain (based on signal agreement)
  confidences: Partial<Record<PsychologicalDomain, number>>

  // Cross-modal agreement metrics
  agreement: {
    overall: number                // Overall agreement (0-1)
    byDomain: Partial<Record<PsychologicalDomain, number>>  // Per-domain agreement
  }

  // Contributing signals
  contributingSignals: {
    text: number      // Number of text signals used
    audio: number     // Number of audio signals used
  }

  // Insights from cross-modal analysis
  insights: string[]

  // Timestamp
  timestamp: number
}

// Cross-modal correlation patterns (which domains should align across modalities)
// Based on research: Scherer & Scherer (2011), Mairesse et al. (2007)
const CROSS_MODAL_CORRELATIONS: Partial<Record<PsychologicalDomain, {
  textAudioCorrelation: number  // Expected correlation (-1 to 1)
  description: string
}>> = {
  big_five_extraversion: {
    textAudioCorrelation: 0.8,
    description: 'Extraversion shows strong text-audio alignment (louder, faster speech matches social language)',
  },
  big_five_neuroticism: {
    textAudioCorrelation: 0.7,
    description: 'Neuroticism detectable in both anxious language and voice tremor/jitter',
  },
  big_five_conscientiousness: {
    textAudioCorrelation: 0.5,
    description: 'Conscientiousness shows moderate alignment (deliberate speech matches careful language)',
  },
  big_five_agreeableness: {
    textAudioCorrelation: 0.4,
    description: 'Agreeableness has weaker audio markers but some correlation with soft speech',
  },
  big_five_openness: {
    textAudioCorrelation: 0.3,
    description: 'Openness mainly expressed in text; audio shows pitch variability',
  },
  emotional_intelligence: {
    textAudioCorrelation: 0.75,
    description: 'EI clearly visible in both expressive language and dynamic vocal range',
  },
  emotional_empathy: {
    textAudioCorrelation: 0.6,
    description: 'Empathy reflected in warm language and softer, varied prosody',
  },
  stress_coping: {
    textAudioCorrelation: 0.65,
    description: 'Stress visible in both content and voice quality (jitter, HNR)',
  },
  dark_triad_narcissism: {
    textAudioCorrelation: 0.55,
    description: 'Narcissism shows in self-focused language and confident vocal energy',
  },
}

/**
 * Main fusion function - combines all modality signals
 */
export function fuseModalities(
  textSignals: TextSignal[],
  audioSignal: AudioSignal | null,
  contextSignal: ContextSignal | null,
  config: FusionConfig = DEFAULT_FUSION_CONFIG
): FusionResult {
  const now = Date.now()

  // Filter signals by age and confidence
  const validTextSignals = textSignals.filter(s =>
    (now - s.timestamp) < config.maxSignalAge &&
    s.confidence >= config.minConfidence
  )

  const validAudioSignal = audioSignal &&
    (now - audioSignal.timestamp) < config.maxSignalAge &&
    audioSignal.confidence >= config.minConfidence
      ? audioSignal
      : null

  // Initialize aggregation structures
  const domainAccumulators: Record<string, {
    textSum: number
    textWeight: number
    audioSum: number
    audioWeight: number
    textValues: number[]
    audioValue: number | null
  }> = {}

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    domainAccumulators[domain] = {
      textSum: 0,
      textWeight: 0,
      audioSum: 0,
      audioWeight: 0,
      textValues: [],
      audioValue: null,
    }
  }

  // Aggregate text signals with temporal decay
  for (const signal of validTextSignals) {
    const age = (now - signal.timestamp) / 1000 // Age in seconds
    const decay = Math.exp(-config.temporalDecay * age)
    const subWeight = config.textSubWeights[signal.type] * signal.confidence * decay

    for (const [domain, score] of Object.entries(signal.scores)) {
      if (score !== undefined && domainAccumulators[domain]) {
        domainAccumulators[domain].textSum += score * subWeight
        domainAccumulators[domain].textWeight += subWeight
        domainAccumulators[domain].textValues.push(score)
      }
    }
  }

  // Add audio signal
  if (validAudioSignal) {
    const age = (now - validAudioSignal.timestamp) / 1000
    const decay = Math.exp(-config.temporalDecay * age)
    const weight = validAudioSignal.confidence * decay

    for (const [domain, score] of Object.entries(validAudioSignal.scores)) {
      if (score !== undefined && domainAccumulators[domain]) {
        domainAccumulators[domain].audioSum = score * weight
        domainAccumulators[domain].audioWeight = weight
        domainAccumulators[domain].audioValue = score
      }
    }
  }

  // Calculate fused scores with cross-modal validation
  const scores: Partial<Record<PsychologicalDomain, number>> = {}
  const confidences: Partial<Record<PsychologicalDomain, number>> = {}
  const agreements: Partial<Record<PsychologicalDomain, number>> = {}
  const insights: string[] = []

  let totalAgreement = 0
  let agreementCount = 0

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const acc = domainAccumulators[domain]

    // Calculate text score (if available)
    const textScore = acc.textWeight > 0 ? acc.textSum / acc.textWeight : null

    // Calculate audio score (if available)
    const audioScore = acc.audioValue

    // Determine weights based on available signals
    let effectiveTextWeight = config.weights.text
    let effectiveAudioWeight = config.weights.audio

    if (textScore === null && audioScore !== null) {
      effectiveTextWeight = 0
      effectiveAudioWeight = 1
    } else if (textScore !== null && audioScore === null) {
      effectiveTextWeight = 1
      effectiveAudioWeight = 0
    } else if (textScore === null && audioScore === null) {
      continue // No data for this domain
    }

    // Check cross-modal agreement
    let agreement = 0.5 // Default neutral
    let crossModalMultiplier = 1.0

    if (textScore !== null && audioScore !== null) {
      const correlation = CROSS_MODAL_CORRELATIONS[domain]?.textAudioCorrelation || 0.5

      // Calculate agreement based on expected correlation
      const diff = Math.abs(textScore - audioScore)
      agreement = 1 - diff

      // If high correlation expected, boost when signals agree
      if (correlation > 0.5 && diff < 0.2) {
        crossModalMultiplier = config.crossModalBoost
        if (diff < 0.1 && correlation > 0.6) {
          insights.push(`Strong ${domain.replace(/_/g, ' ')} signal confirmed across modalities`)
        }
      }

      // Penalize when high-correlation domains diverge significantly
      if (correlation > 0.6 && diff > 0.35) {
        crossModalMultiplier = config.crossModalPenalty
      }

      totalAgreement += agreement
      agreementCount++
    }

    agreements[domain] = agreement

    // Calculate fused score
    let fusedScore = 0
    let totalWeight = 0

    if (textScore !== null) {
      fusedScore += textScore * effectiveTextWeight
      totalWeight += effectiveTextWeight
    }

    if (audioScore !== null) {
      fusedScore += audioScore * effectiveAudioWeight
      totalWeight += effectiveAudioWeight
    }

    if (totalWeight > 0) {
      fusedScore = fusedScore / totalWeight

      // Apply cross-modal adjustment
      fusedScore = adjustScoreWithMultiplier(fusedScore, crossModalMultiplier)

      // Apply context adjustment if available
      if (contextSignal && contextSignal.confidence > 0.5) {
        fusedScore = applyContextAdjustment(fusedScore, domain, contextSignal.context)
      }

      scores[domain] = Math.max(0, Math.min(1, fusedScore))

      // Calculate confidence based on signal availability and agreement
      const signalCount = (textScore !== null ? 1 : 0) + (audioScore !== null ? 1 : 0)
      const textConsistency = calculateTextConsistency(acc.textValues)
      confidences[domain] = Math.min(1, (signalCount * 0.3 + agreement * 0.4 + textConsistency * 0.3))
    }
  }

  // Generate additional insights
  if (validAudioSignal && validAudioSignal.confidence > 0.7) {
    insights.push('Voice analysis contributing to profile confidence')
  }

  if (agreementCount > 5 && totalAgreement / agreementCount > 0.7) {
    insights.push('High cross-modal consistency detected')
  } else if (agreementCount > 5 && totalAgreement / agreementCount < 0.4) {
    insights.push('Text and voice patterns show divergence - may indicate context-dependent expression')
  }

  return {
    scores,
    confidences,
    agreement: {
      overall: agreementCount > 0 ? totalAgreement / agreementCount : 0.5,
      byDomain: agreements,
    },
    contributingSignals: {
      text: validTextSignals.length,
      audio: validAudioSignal ? 1 : 0,
    },
    insights,
    timestamp: now,
  }
}

/**
 * Adjust score with multiplier while keeping in 0-1 range
 */
function adjustScoreWithMultiplier(score: number, multiplier: number): number {
  if (multiplier >= 1) {
    // Boost: move toward 1 for high scores, away from 0.5 for any score
    const deviation = Math.abs(score - 0.5)
    const direction = score > 0.5 ? 1 : -1
    return 0.5 + direction * deviation * multiplier
  } else {
    // Penalty: move toward 0.5
    return 0.5 + (score - 0.5) * multiplier
  }
}

/**
 * Apply context-based adjustments to domain scores
 */
function applyContextAdjustment(
  score: number,
  domain: PsychologicalDomain,
  context: ContextType
): number {
  // Context-domain adjustment factors
  const contextAdjustments: Record<ContextType, Partial<Record<PsychologicalDomain, number>>> = {
    work_professional: {
      big_five_conscientiousness: 1.1,
      big_five_extraversion: 0.95,
      achievement_motivation: 1.1,
    },
    social_casual: {
      big_five_extraversion: 1.15,
      big_five_agreeableness: 1.1,
      social_cognition: 1.1,
    },
    personal_intimate: {
      emotional_empathy: 1.15,
      attachment_style: 1.2,
      authenticity: 1.15,
    },
    creative_artistic: {
      big_five_openness: 1.2,
      creativity: 1.2,
      aesthetic_preferences: 1.15,
    },
    intellectual_academic: {
      growth_mindset: 1.15,
      metacognition: 1.1,
      learning_styles: 1.2,
      cognitive_abilities: 1.15,
    },
    stressful_challenging: {
      emotional_intelligence: 1.15,
      stress_coping: 1.2,
      big_five_neuroticism: 1.1,
    },
    leisure_recreation: {
      interests: 1.2,
      life_satisfaction: 1.1,
      big_five_extraversion: 1.05,
    },
    financial_economic: {
      decision_style: 1.2,
      risk_tolerance: 1.15,
      executive_functions: 1.1,
    },
    health_wellness: {
      self_efficacy: 1.15,
      stress_coping: 1.1,
      life_satisfaction: 1.1,
    },
    family_domestic: {
      emotional_empathy: 1.15,
      attachment_style: 1.15,
      social_support: 1.2,
    },
  }

  const adjustment = contextAdjustments[context]?.[domain] || 1.0

  // Apply adjustment centered around 0.5
  const adjusted = 0.5 + (score - 0.5) * adjustment
  return Math.max(0, Math.min(1, adjusted))
}

/**
 * Calculate consistency of text signals for a domain
 */
function calculateTextConsistency(values: number[]): number {
  if (values.length < 2) return 0.5

  // Calculate variance
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length

  // Convert variance to consistency (low variance = high consistency)
  // Variance of 0.25 (max for uniform 0-1) maps to 0 consistency
  return Math.max(0, 1 - variance * 4)
}

/**
 * Create a text signal from hybrid aggregator results
 */
export function createTextSignal(
  type: 'liwc' | 'embedding' | 'llm',
  scores: Partial<Record<PsychologicalDomain, number>>,
  confidence: number
): TextSignal {
  return {
    type,
    scores,
    confidence,
    timestamp: Date.now(),
  }
}

/**
 * Create an audio signal from audio analysis results
 */
export function createAudioSignal(analysisResult: AudioAnalysisResult): AudioSignal {
  return {
    features: analysisResult.features,
    scores: analysisResult.domainScores,
    confidence: analysisResult.confidence,
    timestamp: analysisResult.timestamp,
  }
}

/**
 * Create a context signal
 */
export function createContextSignal(context: ContextType, confidence: number): ContextSignal {
  return {
    context,
    confidence,
    timestamp: Date.now(),
  }
}

/**
 * Signal buffer for accumulating signals over time
 */
export class MultimodalBuffer {
  private textSignals: TextSignal[] = []
  private audioSignals: AudioSignal[] = []
  private latestContext: ContextSignal | null = null
  private config: FusionConfig

  constructor(config: FusionConfig = DEFAULT_FUSION_CONFIG) {
    this.config = config
  }

  addTextSignal(signal: TextSignal): void {
    this.textSignals.push(signal)
    this.cleanup()
  }

  addAudioSignal(signal: AudioSignal): void {
    this.audioSignals.push(signal)
    this.cleanup()
  }

  setContext(signal: ContextSignal): void {
    this.latestContext = signal
  }

  /**
   * Get fused result from all buffered signals
   */
  fuse(): FusionResult {
    // Use the most recent audio signal
    const latestAudio = this.audioSignals.length > 0
      ? this.audioSignals[this.audioSignals.length - 1]
      : null

    return fuseModalities(
      this.textSignals,
      latestAudio,
      this.latestContext,
      this.config
    )
  }

  /**
   * Clear old signals
   */
  private cleanup(): void {
    const now = Date.now()
    const maxAge = this.config.maxSignalAge

    this.textSignals = this.textSignals.filter(s => (now - s.timestamp) < maxAge)
    this.audioSignals = this.audioSignals.filter(s => (now - s.timestamp) < maxAge)
  }

  /**
   * Clear all signals
   */
  clear(): void {
    this.textSignals = []
    this.audioSignals = []
    this.latestContext = null
  }

  /**
   * Get signal counts
   */
  getStats(): { textCount: number; audioCount: number; hasContext: boolean } {
    return {
      textCount: this.textSignals.length,
      audioCount: this.audioSignals.length,
      hasContext: this.latestContext !== null,
    }
  }
}

/**
 * Singleton multimodal buffer for the application
 */
let globalBuffer: MultimodalBuffer | null = null

export function getMultimodalBuffer(): MultimodalBuffer {
  if (!globalBuffer) {
    globalBuffer = new MultimodalBuffer()
  }
  return globalBuffer
}

/**
 * Quick fusion helper - combines hybrid text scores with optional audio
 */
export function quickFuse(
  hybridScores: Partial<Record<PsychologicalDomain, number>>,
  hybridConfidence: number,
  audioResult?: AudioAnalysisResult | null,
  context?: ContextType
): FusionResult {
  const textSignal = createTextSignal('llm', hybridScores, hybridConfidence)
  const audioSignal = audioResult ? createAudioSignal(audioResult) : null
  const contextSignal = context ? createContextSignal(context, 0.7) : null

  return fuseModalities([textSignal], audioSignal, contextSignal)
}

/**
 * Get human-readable fusion summary
 */
export function getFusionSummary(result: FusionResult): string {
  const summaries: string[] = []

  // Overall summary
  if (result.contributingSignals.text > 0 && result.contributingSignals.audio > 0) {
    summaries.push(
      `Multimodal analysis: ${result.contributingSignals.text} text signal(s), ` +
      `1 audio signal, ${Math.round(result.agreement.overall * 100)}% cross-modal agreement`
    )
  } else if (result.contributingSignals.text > 0) {
    summaries.push(`Text-based analysis: ${result.contributingSignals.text} signal(s)`)
  } else if (result.contributingSignals.audio > 0) {
    summaries.push('Audio-only analysis')
  }

  // Add insights
  if (result.insights.length > 0) {
    summaries.push(...result.insights)
  }

  return summaries.join('. ') + '.'
}
