/**
 * Advanced Visualization Utilities
 * Phase 5: Enhanced data processing for visualization components
 *
 * Provides:
 * - Historical trend data aggregation
 * - Signal contribution formatting
 * - Context variation statistics
 * - Confidence interval calculations
 */

import { getDomainHistory, getHybridSignalsForDomain, getAllHybridSignals } from './sqldb'
import { getGraphInsights } from './advanced-graph'
import { PSYCHOLOGICAL_DOMAINS, DOMAIN_CATEGORIES, type PsychologicalDomain } from './analysis-config'
import { type ContextType } from './context-profiler'

// ============================================================================
// Types for Visualization Data
// ============================================================================

export interface TrendDataPoint {
  date: string
  score: number
  confidence: number
  formattedDate: string
}

export interface DomainTrendData {
  domainId: PsychologicalDomain
  domainName: string
  category: string
  dataPoints: TrendDataPoint[]
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating'
  volatility: number
  currentScore: number
  currentConfidence: number
  changeFromStart: number
}

export interface SignalContribution {
  domainId: string
  domainName: string
  liwcScore: number
  liwcWeight: number
  liwcConfidence: number
  embeddingScore: number
  embeddingWeight: number
  embeddingConfidence: number
  llmScore: number
  llmWeight: number
  llmConfidence: number
  hasLLM: boolean
  dominantSignal: 'liwc' | 'embedding' | 'llm' | 'none'
}

export interface ContextVariation {
  domainId: PsychologicalDomain
  domainName: string
  variations: Array<{
    context: ContextType
    contextName: string
    effect: 'amplifies' | 'suppresses' | 'neutral'
    magnitude: number
    observations: number
  }>
  mostAmplifying: ContextType | null
  mostSuppressing: ContextType | null
  variationRange: number
}

export interface ConfidenceInterval {
  domainId: string
  score: number
  confidence: number
  lowerBound: number
  upperBound: number
  signalAgreement: number // 0-1, how much signals agree
}

export interface VisualizationSummary {
  totalDomains: number
  domainsWithData: number
  averageConfidence: number
  topEvolvingTraits: Array<{ domain: string; trend: string; volatility: number }>
  mostVariableByContext: string[]
  signalCoverage: {
    liwcCoverage: number
    embeddingCoverage: number
    llmCoverage: number
  }
}

// ============================================================================
// Domain Name Formatting
// ============================================================================

const DOMAIN_DISPLAY_NAMES: Record<PsychologicalDomain, string> = {
  big_five_openness: 'Openness',
  big_five_conscientiousness: 'Conscientiousness',
  big_five_extraversion: 'Extraversion',
  big_five_agreeableness: 'Agreeableness',
  big_five_neuroticism: 'Neuroticism',
  dark_triad_narcissism: 'Narcissism',
  dark_triad_machiavellianism: 'Machiavellianism',
  dark_triad_psychopathy: 'Psychopathy',
  emotional_empathy: 'Empathy',
  emotional_intelligence: 'Emotional Intelligence',
  attachment_style: 'Attachment Style',
  love_languages: 'Love Languages',
  communication_style: 'Communication Style',
  risk_tolerance: 'Risk Tolerance',
  decision_style: 'Decision Style',
  time_orientation: 'Time Orientation',
  achievement_motivation: 'Achievement Motivation',
  self_efficacy: 'Self-Efficacy',
  locus_of_control: 'Locus of Control',
  growth_mindset: 'Growth Mindset',
  personal_values: 'Personal Values',
  interests: 'Interests (RIASEC)',
  life_satisfaction: 'Life Satisfaction',
  stress_coping: 'Stress Coping',
  social_support: 'Social Support',
  authenticity: 'Authenticity',
  cognitive_abilities: 'Cognitive Abilities',
  creativity: 'Creativity',
  learning_styles: 'Learning Styles',
  information_processing: 'Information Processing',
  metacognition: 'Metacognition',
  executive_functions: 'Executive Functions',
  social_cognition: 'Social Cognition',
  political_ideology: 'Political Ideology',
  cultural_values: 'Cultural Values',
  moral_reasoning: 'Moral Reasoning',
  work_career_style: 'Work/Career Style',
  sensory_processing: 'Sensory Processing',
  aesthetic_preferences: 'Aesthetic Preferences',
}

const CONTEXT_DISPLAY_NAMES: Record<ContextType, string> = {
  work_professional: 'Work/Professional',
  social_casual: 'Social/Casual',
  personal_intimate: 'Personal/Intimate',
  creative_artistic: 'Creative/Artistic',
  intellectual_academic: 'Intellectual/Academic',
  stressful_challenging: 'Stressful/Challenging',
  leisure_recreation: 'Leisure/Recreation',
  financial_economic: 'Financial/Economic',
  health_wellness: 'Health/Wellness',
  family_domestic: 'Family/Domestic',
}

export function getDomainDisplayName(domainId: PsychologicalDomain): string {
  return DOMAIN_DISPLAY_NAMES[domainId] || domainId
}

export function getContextDisplayName(context: ContextType): string {
  return CONTEXT_DISPLAY_NAMES[context] || context
}

export function getDomainCategory(domainId: PsychologicalDomain): string {
  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.includes(domainId)) {
      return category
    }
  }
  return 'Other'
}

// ============================================================================
// Historical Trend Data
// ============================================================================

/**
 * Get historical trend data for a specific domain
 */
export async function getDomainTrendData(
  domainId: PsychologicalDomain,
  limit: number = 50
): Promise<DomainTrendData | null> {
  try {
    const history = await getDomainHistory(domainId, limit)

    if (history.length === 0) {
      return null
    }

    // Sort by date ascending
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    )

    const dataPoints: TrendDataPoint[] = sortedHistory.map(entry => ({
      date: entry.recordedAt,
      score: entry.score,
      confidence: entry.confidence,
      formattedDate: formatDate(entry.recordedAt),
    }))

    const currentScore = sortedHistory[sortedHistory.length - 1].score
    const currentConfidence = sortedHistory[sortedHistory.length - 1].confidence
    const startScore = sortedHistory[0].score
    const changeFromStart = currentScore - startScore

    // Calculate trend and volatility
    const { trend, volatility } = calculateTrendAndVolatility(sortedHistory.map(h => h.score))

    return {
      domainId,
      domainName: getDomainDisplayName(domainId),
      category: getDomainCategory(domainId),
      dataPoints,
      trend,
      volatility,
      currentScore,
      currentConfidence,
      changeFromStart,
    }
  } catch (error) {
    console.error(`Error getting trend data for ${domainId}:`, error)
    return null
  }
}

/**
 * Get trend data for all domains with history
 */
export async function getAllDomainTrends(limit: number = 30): Promise<DomainTrendData[]> {
  const trends: DomainTrendData[] = []

  for (const domainId of PSYCHOLOGICAL_DOMAINS) {
    const trend = await getDomainTrendData(domainId, limit)
    if (trend && trend.dataPoints.length > 0) {
      trends.push(trend)
    }
  }

  return trends
}

/**
 * Get trends grouped by category
 */
export async function getTrendsByCategory(limit: number = 30): Promise<Record<string, DomainTrendData[]>> {
  const trends = await getAllDomainTrends(limit)
  const grouped: Record<string, DomainTrendData[]> = {}

  for (const trend of trends) {
    if (!grouped[trend.category]) {
      grouped[trend.category] = []
    }
    grouped[trend.category].push(trend)
  }

  return grouped
}

// ============================================================================
// Signal Contribution Analysis
// ============================================================================

/**
 * Get signal contribution breakdown for a specific domain
 */
export async function getSignalContribution(domainId: string): Promise<SignalContribution | null> {
  try {
    const signals = await getHybridSignalsForDomain(domainId)

    if (signals.length === 0) {
      return null
    }

    const liwcSignal = signals.find(s => s.signalType === 'liwc')
    const embeddingSignal = signals.find(s => s.signalType === 'embedding')
    const llmSignal = signals.find(s => s.signalType === 'llm')

    const contribution: SignalContribution = {
      domainId,
      domainName: getDomainDisplayName(domainId as PsychologicalDomain),
      liwcScore: liwcSignal?.score ?? 0,
      liwcWeight: liwcSignal?.weightUsed ?? 0,
      liwcConfidence: liwcSignal?.confidence ?? 0,
      embeddingScore: embeddingSignal?.score ?? 0,
      embeddingWeight: embeddingSignal?.weightUsed ?? 0,
      embeddingConfidence: embeddingSignal?.confidence ?? 0,
      llmScore: llmSignal?.score ?? 0,
      llmWeight: llmSignal?.weightUsed ?? 0,
      llmConfidence: llmSignal?.confidence ?? 0,
      hasLLM: !!llmSignal,
      dominantSignal: 'none',
    }

    // Determine dominant signal (highest weighted contribution)
    const weightedContributions = [
      { signal: 'liwc' as const, value: contribution.liwcScore * contribution.liwcWeight },
      { signal: 'embedding' as const, value: contribution.embeddingScore * contribution.embeddingWeight },
      { signal: 'llm' as const, value: contribution.llmScore * contribution.llmWeight },
    ].filter(c => c.value > 0)

    if (weightedContributions.length > 0) {
      weightedContributions.sort((a, b) => b.value - a.value)
      contribution.dominantSignal = weightedContributions[0].signal
    }

    return contribution
  } catch (error) {
    console.error(`Error getting signal contribution for ${domainId}:`, error)
    return null
  }
}

/**
 * Get signal contributions for all domains
 */
export async function getAllSignalContributions(): Promise<SignalContribution[]> {
  const contributions: SignalContribution[] = []

  try {
    const allSignals = await getAllHybridSignals()

    for (const domainId of Object.keys(allSignals)) {
      const contribution = await getSignalContribution(domainId)
      if (contribution) {
        contributions.push(contribution)
      }
    }
  } catch (error) {
    console.error('Error getting all signal contributions:', error)
  }

  return contributions
}

/**
 * Format signal data for stacked bar chart
 */
export function formatSignalDataForChart(contributions: SignalContribution[]): Array<{
  domain: string
  liwc: number
  embedding: number
  llm: number
}> {
  return contributions.map(c => ({
    domain: c.domainName,
    liwc: Math.round(c.liwcScore * c.liwcWeight * 100),
    embedding: Math.round(c.embeddingScore * c.embeddingWeight * 100),
    llm: Math.round(c.llmScore * c.llmWeight * 100),
  }))
}

// ============================================================================
// Context Variation Analysis
// ============================================================================

/**
 * Get context variation data for a domain
 */
export async function getContextVariation(
  userId: string,
  domainId: PsychologicalDomain
): Promise<ContextVariation | null> {
  try {
    const insights = await getGraphInsights(userId)
    const contextEffects = insights.contextEffects.filter(ce => ce.domain === domainId)

    if (contextEffects.length === 0) {
      return null
    }

    const variations = contextEffects.map(ce => ({
      context: ce.context,
      contextName: getContextDisplayName(ce.context),
      effect: ce.effect,
      magnitude: ce.magnitude,
      observations: ce.observations,
    }))

    // Find most amplifying and suppressing contexts
    const amplifying = contextEffects
      .filter(ce => ce.effect === 'amplifies')
      .sort((a, b) => b.magnitude - a.magnitude)
    const suppressing = contextEffects
      .filter(ce => ce.effect === 'suppresses')
      .sort((a, b) => b.magnitude - a.magnitude)

    const magnitudes = contextEffects.map(ce =>
      ce.effect === 'suppresses' ? -ce.magnitude : ce.magnitude
    )
    const variationRange = Math.max(...magnitudes) - Math.min(...magnitudes)

    return {
      domainId,
      domainName: getDomainDisplayName(domainId),
      variations,
      mostAmplifying: amplifying[0]?.context ?? null,
      mostSuppressing: suppressing[0]?.context ?? null,
      variationRange,
    }
  } catch (error) {
    console.error(`Error getting context variation for ${domainId}:`, error)
    return null
  }
}

/**
 * Get context variations for all domains
 */
export async function getAllContextVariations(userId: string): Promise<ContextVariation[]> {
  const variations: ContextVariation[] = []

  for (const domainId of PSYCHOLOGICAL_DOMAINS) {
    const variation = await getContextVariation(userId, domainId)
    if (variation && variation.variations.length > 0) {
      variations.push(variation)
    }
  }

  return variations
}

/**
 * Format context data for heatmap visualization
 */
export function formatContextHeatmapData(
  variations: ContextVariation[]
): Array<{ domain: string; context: string; value: number; effect: string }> {
  const data: Array<{ domain: string; context: string; value: number; effect: string }> = []

  for (const variation of variations) {
    for (const v of variation.variations) {
      data.push({
        domain: variation.domainName,
        context: v.contextName,
        value: v.effect === 'suppresses' ? -v.magnitude : v.magnitude,
        effect: v.effect,
      })
    }
  }

  return data
}

// ============================================================================
// Confidence Interval Calculations
// ============================================================================

/**
 * Calculate confidence interval for a domain score
 */
export async function getConfidenceInterval(domainId: string): Promise<ConfidenceInterval | null> {
  const contribution = await getSignalContribution(domainId)

  if (!contribution) {
    return null
  }

  // Calculate weighted score
  const totalWeight = contribution.liwcWeight + contribution.embeddingWeight + contribution.llmWeight
  if (totalWeight === 0) {
    return null
  }

  const weightedScore = (
    contribution.liwcScore * contribution.liwcWeight +
    contribution.embeddingScore * contribution.embeddingWeight +
    contribution.llmScore * contribution.llmWeight
  ) / totalWeight

  // Calculate signal agreement (how similar the signals are)
  const scores = [
    contribution.liwcScore,
    contribution.embeddingScore,
    contribution.hasLLM ? contribution.llmScore : null,
  ].filter((s): s is number => s !== null)

  const scoreVariance = calculateVariance(scores)
  const signalAgreement = Math.max(0, 1 - scoreVariance * 4) // Scale variance to 0-1 agreement

  // Calculate confidence-weighted bounds
  const avgConfidence = (
    contribution.liwcConfidence * contribution.liwcWeight +
    contribution.embeddingConfidence * contribution.embeddingWeight +
    contribution.llmConfidence * contribution.llmWeight
  ) / totalWeight

  // Wider bounds when confidence is low or signals disagree
  const uncertainty = (1 - avgConfidence) * (1 - signalAgreement * 0.5)
  const margin = 0.1 + uncertainty * 0.3 // 10-40% margin based on uncertainty

  return {
    domainId,
    score: weightedScore,
    confidence: avgConfidence,
    lowerBound: Math.max(0, weightedScore - margin),
    upperBound: Math.min(1, weightedScore + margin),
    signalAgreement,
  }
}

/**
 * Get confidence intervals for all domains with data
 */
export async function getAllConfidenceIntervals(): Promise<ConfidenceInterval[]> {
  const intervals: ConfidenceInterval[] = []

  for (const domainId of PSYCHOLOGICAL_DOMAINS) {
    const interval = await getConfidenceInterval(domainId)
    if (interval) {
      intervals.push(interval)
    }
  }

  return intervals
}

// ============================================================================
// Summary Statistics
// ============================================================================

/**
 * Get overall visualization summary
 */
export async function getVisualizationSummary(userId: string): Promise<VisualizationSummary> {
  const contributions = await getAllSignalContributions()
  const insights = await getGraphInsights(userId)
  const contextVariations = await getAllContextVariations(userId)

  const confidences = contributions.map(c =>
    (c.liwcConfidence + c.embeddingConfidence + (c.hasLLM ? c.llmConfidence : 0)) /
    (c.hasLLM ? 3 : 2)
  )

  const avgConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0

  const liwcCount = contributions.filter(c => c.liwcWeight > 0).length
  const embeddingCount = contributions.filter(c => c.embeddingWeight > 0).length
  const llmCount = contributions.filter(c => c.hasLLM).length

  const mostVariable = contextVariations
    .sort((a, b) => b.variationRange - a.variationRange)
    .slice(0, 5)
    .map(v => v.domainName)

  return {
    totalDomains: PSYCHOLOGICAL_DOMAINS.length,
    domainsWithData: contributions.length,
    averageConfidence: avgConfidence,
    topEvolvingTraits: insights.evolvingTraits.slice(0, 5),
    mostVariableByContext: mostVariable,
    signalCoverage: {
      liwcCoverage: contributions.length > 0 ? liwcCount / contributions.length : 0,
      embeddingCoverage: contributions.length > 0 ? embeddingCount / contributions.length : 0,
      llmCoverage: contributions.length > 0 ? llmCount / contributions.length : 0,
    },
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function calculateTrendAndVolatility(scores: number[]): {
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating'
  volatility: number
} {
  if (scores.length < 2) {
    return { trend: 'stable', volatility: 0 }
  }

  // Calculate linear regression slope
  const n = scores.length
  const xMean = (n - 1) / 2
  const yMean = scores.reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (scores[i] - yMean)
    denominator += (i - xMean) ** 2
  }

  const slope = denominator !== 0 ? numerator / denominator : 0

  // Calculate volatility (standard deviation of changes)
  const changes: number[] = []
  for (let i = 1; i < scores.length; i++) {
    changes.push(Math.abs(scores[i] - scores[i - 1]))
  }
  const volatility = changes.length > 0
    ? Math.sqrt(changes.reduce((a, b) => a + b * b, 0) / changes.length)
    : 0

  // Determine trend based on slope and volatility
  const slopeThreshold = 0.02
  const volatilityThreshold = 0.1

  let trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating'

  if (volatility > volatilityThreshold) {
    trend = 'fluctuating'
  } else if (slope > slopeThreshold) {
    trend = 'increasing'
  } else if (slope < -slopeThreshold) {
    trend = 'decreasing'
  } else {
    trend = 'stable'
  }

  return { trend, volatility }
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(v => (v - mean) ** 2)
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length
}

// ============================================================================
// Chart Color Schemes
// ============================================================================

export const VISUALIZATION_COLORS = {
  // Signal colors
  liwc: '#8884d8',      // Purple
  embedding: '#82ca9d', // Green
  llm: '#ffc658',       // Gold

  // Trend colors
  increasing: '#22c55e', // Green
  decreasing: '#ef4444', // Red
  stable: '#6b7280',     // Gray
  fluctuating: '#f59e0b', // Amber

  // Context effect colors
  amplifies: '#22c55e',  // Green
  suppresses: '#ef4444', // Red
  neutral: '#6b7280',    // Gray

  // Confidence colors
  high: '#22c55e',       // Green (>0.7)
  medium: '#f59e0b',     // Amber (0.4-0.7)
  low: '#ef4444',        // Red (<0.4)

  // Category colors (for grouping)
  categories: [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c43',
    '#a855f7', '#06b6d4', '#ec4899', '#84cc16',
  ],
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.7) return VISUALIZATION_COLORS.high
  if (confidence >= 0.4) return VISUALIZATION_COLORS.medium
  return VISUALIZATION_COLORS.low
}

export function getTrendColor(trend: string): string {
  const trendColors: Record<string, string> = {
    increasing: VISUALIZATION_COLORS.increasing,
    decreasing: VISUALIZATION_COLORS.decreasing,
    stable: VISUALIZATION_COLORS.stable,
    fluctuating: VISUALIZATION_COLORS.fluctuating,
  }
  return trendColors[trend] || VISUALIZATION_COLORS.stable
}
