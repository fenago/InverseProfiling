/**
 * Profile Validation System
 * Phase 4: Advanced Features
 *
 * Validates psychological profiles by checking:
 * 1. Signal consistency (LIWC vs Embedding vs LLM agreement)
 * 2. Inter-domain consistency (related domains should correlate)
 * 3. Temporal consistency (profiles shouldn't change too rapidly)
 * 4. Statistical validation (scores should fall within expected distributions)
 * 5. Confidence assessment (overall profile reliability)
 */

import {
  getDomainScores,
  getDomainHistory,
  getAllHybridSignals,
  type DomainScore,
  type HybridSignalScore,
  type DomainHistoryEntry,
} from './sqldb'
import { PSYCHOLOGICAL_DOMAINS, type PsychologicalDomain } from './analysis-config'

// ==================== TYPES ====================

export interface ValidationIssue {
  type: 'signal_disagreement' | 'domain_inconsistency' | 'temporal_anomaly' | 'statistical_outlier' | 'insufficient_data'
  severity: 'low' | 'medium' | 'high'
  domain: PsychologicalDomain
  relatedDomains?: PsychologicalDomain[]
  message: string
  details: {
    signalValues?: Record<string, number>
    expectedRange?: { min: number; max: number }
    actualValue?: number
    threshold?: number
    correlation?: number
  }
  timestamp: Date
}

export interface ValidationResult {
  isValid: boolean
  overallConfidence: number
  issues: ValidationIssue[]
  domainValidation: Record<PsychologicalDomain, DomainValidationResult>
  summary: {
    totalDomains: number
    validDomains: number
    domainsWithIssues: number
    averageSignalAgreement: number
    temporalStability: number
    dataQualityScore: number
  }
  timestamp: Date
}

export interface DomainValidationResult {
  isValid: boolean
  confidence: number
  signalAgreement: number
  temporalStability: number
  issues: ValidationIssue[]
}

// ==================== CONSTANTS ====================

/**
 * Inter-domain relationships with expected correlations
 * Positive values = should correlate positively
 * Negative values = should correlate negatively
 */
const DOMAIN_RELATIONSHIPS: Array<{
  domain1: PsychologicalDomain
  domain2: PsychologicalDomain
  expectedCorrelation: number  // -1 to 1
  strength: number             // How strong this relationship should be (0-1)
}> = [
  // Big Five relationships
  { domain1: 'big_five_extraversion', domain2: 'social_cognition', expectedCorrelation: 0.6, strength: 0.7 },
  { domain1: 'big_five_extraversion', domain2: 'communication_style', expectedCorrelation: 0.5, strength: 0.6 },
  { domain1: 'big_five_agreeableness', domain2: 'emotional_empathy', expectedCorrelation: 0.7, strength: 0.8 },
  { domain1: 'big_five_agreeableness', domain2: 'dark_triad_psychopathy', expectedCorrelation: -0.6, strength: 0.7 },
  { domain1: 'big_five_conscientiousness', domain2: 'executive_functions', expectedCorrelation: 0.6, strength: 0.7 },
  { domain1: 'big_five_conscientiousness', domain2: 'achievement_motivation', expectedCorrelation: 0.5, strength: 0.6 },
  { domain1: 'big_five_neuroticism', domain2: 'life_satisfaction', expectedCorrelation: -0.5, strength: 0.6 },
  { domain1: 'big_five_neuroticism', domain2: 'stress_coping', expectedCorrelation: -0.4, strength: 0.5 },
  { domain1: 'big_five_openness', domain2: 'creativity', expectedCorrelation: 0.7, strength: 0.8 },
  { domain1: 'big_five_openness', domain2: 'aesthetic_preferences', expectedCorrelation: 0.5, strength: 0.6 },

  // Dark Triad relationships
  { domain1: 'dark_triad_narcissism', domain2: 'dark_triad_machiavellianism', expectedCorrelation: 0.4, strength: 0.5 },
  { domain1: 'dark_triad_machiavellianism', domain2: 'dark_triad_psychopathy', expectedCorrelation: 0.5, strength: 0.6 },
  { domain1: 'dark_triad_narcissism', domain2: 'emotional_empathy', expectedCorrelation: -0.4, strength: 0.5 },

  // Emotional/Social relationships
  { domain1: 'emotional_empathy', domain2: 'emotional_intelligence', expectedCorrelation: 0.6, strength: 0.7 },
  { domain1: 'emotional_intelligence', domain2: 'social_cognition', expectedCorrelation: 0.5, strength: 0.6 },
  { domain1: 'attachment_style', domain2: 'social_support', expectedCorrelation: 0.5, strength: 0.6 },

  // Motivation relationships
  { domain1: 'self_efficacy', domain2: 'locus_of_control', expectedCorrelation: 0.6, strength: 0.7 },
  { domain1: 'self_efficacy', domain2: 'growth_mindset', expectedCorrelation: 0.5, strength: 0.6 },
  { domain1: 'achievement_motivation', domain2: 'work_career_style', expectedCorrelation: 0.4, strength: 0.5 },

  // Cognitive relationships
  { domain1: 'cognitive_abilities', domain2: 'metacognition', expectedCorrelation: 0.4, strength: 0.5 },
  { domain1: 'learning_styles', domain2: 'information_processing', expectedCorrelation: 0.5, strength: 0.6 },

  // Values relationships
  { domain1: 'moral_reasoning', domain2: 'authenticity', expectedCorrelation: 0.4, strength: 0.5 },
  { domain1: 'personal_values', domain2: 'moral_reasoning', expectedCorrelation: 0.4, strength: 0.5 },

  // Decision making relationships
  { domain1: 'risk_tolerance', domain2: 'decision_style', expectedCorrelation: 0.3, strength: 0.4 },
]

// Thresholds for validation
const VALIDATION_THRESHOLDS = {
  signalDisagreementThreshold: 0.25,    // Max difference between signals before flagging
  temporalChangeThreshold: 0.3,          // Max change per day before flagging
  statisticalOutlierThreshold: 0.1,      // Min/max score threshold for outliers
  correlationDeviationThreshold: 0.4,    // Max deviation from expected correlation
  minimumDataPoints: 3,                  // Minimum data points for validation
  minimumConfidence: 0.2,                // Minimum confidence for valid domain
  highConfidenceThreshold: 0.6,          // Confidence threshold for high-quality data
}

// ==================== MAIN VALIDATION FUNCTION ====================

/**
 * Run complete profile validation
 * Returns a comprehensive validation result with issues and recommendations
 */
export async function validateProfile(): Promise<ValidationResult> {
  const timestamp = new Date()
  const issues: ValidationIssue[] = []
  const domainValidation: Record<string, DomainValidationResult> = {}

  // Get all data
  const domainScores = await getDomainScores()
  const allSignals = await getAllHybridSignals()

  let totalSignalAgreement = 0
  let totalTemporalStability = 0
  let domainsWithData = 0
  let validDomains = 0
  let domainsWithIssues = 0

  // Validate each domain
  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const domainScore = domainScores.find(d => d.domainId === domain)
    const signals = allSignals[domain] || []

    const domainResult = await validateDomain(domain, domainScore, signals)
    domainValidation[domain] = domainResult

    if (domainScore && domainScore.dataPointsCount > 0) {
      domainsWithData++
      totalSignalAgreement += domainResult.signalAgreement
      totalTemporalStability += domainResult.temporalStability
    }

    if (domainResult.isValid) {
      validDomains++
    }

    if (domainResult.issues.length > 0) {
      domainsWithIssues++
      issues.push(...domainResult.issues)
    }
  }

  // Validate inter-domain consistency
  const interDomainIssues = await validateInterDomainConsistency(domainScores)
  issues.push(...interDomainIssues)

  // Calculate summary statistics
  const averageSignalAgreement = domainsWithData > 0 ? totalSignalAgreement / domainsWithData : 0
  const temporalStability = domainsWithData > 0 ? totalTemporalStability / domainsWithData : 0
  const dataQualityScore = calculateDataQualityScore(domainScores, allSignals)

  // Calculate overall confidence
  const overallConfidence = calculateOverallConfidence(
    averageSignalAgreement,
    temporalStability,
    dataQualityScore,
    issues
  )

  const isValid = issues.filter(i => i.severity === 'high').length === 0 && overallConfidence >= 0.4

  return {
    isValid,
    overallConfidence,
    issues,
    domainValidation: domainValidation as Record<PsychologicalDomain, DomainValidationResult>,
    summary: {
      totalDomains: PSYCHOLOGICAL_DOMAINS.length,
      validDomains,
      domainsWithIssues,
      averageSignalAgreement,
      temporalStability,
      dataQualityScore,
    },
    timestamp,
  }
}

// ==================== DOMAIN VALIDATION ====================

/**
 * Validate a single domain
 */
async function validateDomain(
  domain: PsychologicalDomain,
  domainScore: DomainScore | undefined,
  signals: HybridSignalScore[]
): Promise<DomainValidationResult> {
  const issues: ValidationIssue[] = []

  // Check for insufficient data
  if (!domainScore || domainScore.dataPointsCount < VALIDATION_THRESHOLDS.minimumDataPoints) {
    issues.push({
      type: 'insufficient_data',
      severity: 'low',
      domain,
      message: `Domain ${formatDomainName(domain)} has insufficient data for reliable validation`,
      details: {
        actualValue: domainScore?.dataPointsCount || 0,
        threshold: VALIDATION_THRESHOLDS.minimumDataPoints,
      },
      timestamp: new Date(),
    })

    return {
      isValid: true, // Not invalid, just low confidence
      confidence: 0.1,
      signalAgreement: 0,
      temporalStability: 1,
      issues,
    }
  }

  // 1. Validate signal agreement
  const signalAgreement = calculateSignalAgreement(signals)
  const signalIssues = validateSignalAgreement(domain, signals)
  issues.push(...signalIssues)

  // 2. Validate temporal consistency
  const history = await getDomainHistory(domain, 50)
  const { stability: temporalStability, issues: temporalIssues } = validateTemporalConsistency(domain, history)
  issues.push(...temporalIssues)

  // 3. Validate statistical bounds
  const statisticalIssues = validateStatisticalBounds(domain, domainScore.score)
  issues.push(...statisticalIssues)

  // Calculate domain confidence
  const confidence = calculateDomainConfidence(domainScore, signals, signalAgreement, temporalStability)

  // Determine if domain is valid
  const hasHighSeverityIssues = issues.filter(i => i.severity === 'high').length > 0
  const isValid = !hasHighSeverityIssues && confidence >= VALIDATION_THRESHOLDS.minimumConfidence

  return {
    isValid,
    confidence,
    signalAgreement,
    temporalStability,
    issues,
  }
}

// ==================== SIGNAL AGREEMENT VALIDATION ====================

/**
 * Calculate how well the three signals agree on a domain score
 */
function calculateSignalAgreement(signals: HybridSignalScore[]): number {
  if (signals.length < 2) return 1 // Can't disagree with yourself

  const scores = signals.map(s => s.score)
  const maxDiff = Math.max(...scores) - Math.min(...scores)

  // Convert max difference to agreement (0 = completely disagree, 1 = perfect agreement)
  return Math.max(0, 1 - (maxDiff / 0.5)) // 0.5 difference = 0% agreement
}

/**
 * Validate signal agreement and return any issues
 */
function validateSignalAgreement(domain: PsychologicalDomain, signals: HybridSignalScore[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (signals.length < 2) return issues

  const liwc = signals.find(s => s.signalType === 'liwc')
  const embedding = signals.find(s => s.signalType === 'embedding')
  const llm = signals.find(s => s.signalType === 'llm')

  const signalValues: Record<string, number> = {}
  if (liwc) signalValues.liwc = liwc.score
  if (embedding) signalValues.embedding = embedding.score
  if (llm) signalValues.llm = llm.score

  const scoreValues = Object.values(signalValues)
  if (scoreValues.length < 2) return issues

  const maxDiff = Math.max(...scoreValues) - Math.min(...scoreValues)

  if (maxDiff > VALIDATION_THRESHOLDS.signalDisagreementThreshold) {
    // Determine severity based on difference magnitude
    const severity = maxDiff > 0.4 ? 'high' : maxDiff > 0.3 ? 'medium' : 'low'

    issues.push({
      type: 'signal_disagreement',
      severity,
      domain,
      message: `Signals disagree on ${formatDomainName(domain)}: ${Object.entries(signalValues)
        .map(([k, v]) => `${k}=${v.toFixed(2)}`)
        .join(', ')}`,
      details: {
        signalValues,
        threshold: VALIDATION_THRESHOLDS.signalDisagreementThreshold,
        actualValue: maxDiff,
      },
      timestamp: new Date(),
    })
  }

  return issues
}

// ==================== TEMPORAL CONSISTENCY VALIDATION ====================

/**
 * Validate temporal consistency and detect anomalous changes
 */
function validateTemporalConsistency(
  domain: PsychologicalDomain,
  history: DomainHistoryEntry[]
): { stability: number; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []

  if (history.length < 2) {
    return { stability: 1, issues }
  }

  // Calculate rate of change
  const changes: number[] = []
  for (let i = 1; i < history.length; i++) {
    const prev = history[i] // Older (DESC order)
    const curr = history[i - 1] // Newer

    const timeDiff = (new Date(curr.recordedAt).getTime() - new Date(prev.recordedAt).getTime()) / (1000 * 60 * 60 * 24) // Days
    const scoreDiff = Math.abs(curr.score - prev.score)

    if (timeDiff > 0) {
      const changeRate = scoreDiff / timeDiff // Change per day
      changes.push(changeRate)

      // Check for sudden large changes
      if (changeRate > VALIDATION_THRESHOLDS.temporalChangeThreshold) {
        issues.push({
          type: 'temporal_anomaly',
          severity: changeRate > 0.5 ? 'high' : 'medium',
          domain,
          message: `Rapid score change detected in ${formatDomainName(domain)}: ${prev.score.toFixed(2)} → ${curr.score.toFixed(2)} in ${timeDiff.toFixed(1)} days`,
          details: {
            actualValue: changeRate,
            threshold: VALIDATION_THRESHOLDS.temporalChangeThreshold,
          },
          timestamp: new Date(),
        })
      }
    }
  }

  // Calculate stability (inverse of average change rate)
  const avgChangeRate = changes.length > 0 ? changes.reduce((a, b) => a + b, 0) / changes.length : 0
  const stability = Math.max(0, 1 - avgChangeRate / 0.5) // 0.5 change/day = 0% stability

  return { stability, issues }
}

// ==================== STATISTICAL BOUNDS VALIDATION ====================

/**
 * Validate that scores fall within expected statistical bounds
 */
function validateStatisticalBounds(domain: PsychologicalDomain, score: number): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Check for extreme scores (near 0 or 1)
  if (score < VALIDATION_THRESHOLDS.statisticalOutlierThreshold) {
    issues.push({
      type: 'statistical_outlier',
      severity: score < 0.05 ? 'medium' : 'low',
      domain,
      message: `${formatDomainName(domain)} score is unusually low (${score.toFixed(2)})`,
      details: {
        actualValue: score,
        expectedRange: { min: 0.1, max: 0.9 },
      },
      timestamp: new Date(),
    })
  } else if (score > 1 - VALIDATION_THRESHOLDS.statisticalOutlierThreshold) {
    issues.push({
      type: 'statistical_outlier',
      severity: score > 0.95 ? 'medium' : 'low',
      domain,
      message: `${formatDomainName(domain)} score is unusually high (${score.toFixed(2)})`,
      details: {
        actualValue: score,
        expectedRange: { min: 0.1, max: 0.9 },
      },
      timestamp: new Date(),
    })
  }

  return issues
}

// ==================== INTER-DOMAIN CONSISTENCY VALIDATION ====================

/**
 * Validate consistency between related domains
 */
async function validateInterDomainConsistency(domainScores: DomainScore[]): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = []

  // Create lookup map for quick access
  const scoreMap = new Map<string, number>()
  const confidenceMap = new Map<string, number>()
  for (const ds of domainScores) {
    scoreMap.set(ds.domainId, ds.score)
    confidenceMap.set(ds.domainId, ds.confidence)
  }

  for (const relationship of DOMAIN_RELATIONSHIPS) {
    const score1 = scoreMap.get(relationship.domain1)
    const score2 = scoreMap.get(relationship.domain2)
    const conf1 = confidenceMap.get(relationship.domain1) || 0
    const conf2 = confidenceMap.get(relationship.domain2) || 0

    // Skip if either domain has low confidence
    if (!score1 || !score2 || conf1 < 0.3 || conf2 < 0.3) continue

    // Calculate observed correlation (simplified: direction of deviation from 0.5)
    const dev1 = score1 - 0.5
    const dev2 = score2 - 0.5

    // Check if relationship is consistent with expectation
    const observedDirection = (dev1 > 0 && dev2 > 0) || (dev1 < 0 && dev2 < 0) ? 1 : -1
    const expectedDirection = relationship.expectedCorrelation > 0 ? 1 : -1

    // Only flag significant deviations when both domains have meaningful deviation
    if (Math.abs(dev1) > 0.15 && Math.abs(dev2) > 0.15) {
      if (observedDirection !== expectedDirection) {
        const severity = relationship.strength > 0.7 ? 'medium' : 'low'

        issues.push({
          type: 'domain_inconsistency',
          severity,
          domain: relationship.domain1,
          relatedDomains: [relationship.domain2],
          message: `${formatDomainName(relationship.domain1)} (${score1.toFixed(2)}) and ${formatDomainName(relationship.domain2)} (${score2.toFixed(2)}) show unexpected relationship (expected ${relationship.expectedCorrelation > 0 ? 'positive' : 'negative'} correlation)`,
          details: {
            correlation: relationship.expectedCorrelation,
            signalValues: {
              [relationship.domain1]: score1,
              [relationship.domain2]: score2,
            },
          },
          timestamp: new Date(),
        })
      }
    }
  }

  return issues
}

// ==================== CONFIDENCE CALCULATIONS ====================

/**
 * Calculate confidence for a single domain
 */
function calculateDomainConfidence(
  domainScore: DomainScore,
  signals: HybridSignalScore[],
  signalAgreement: number,
  temporalStability: number
): number {
  // Base confidence from data points
  const dataPointsWeight = Math.min(1, domainScore.dataPointsCount / 10) // Max weight at 10+ data points

  // Signal diversity weight (more signals = higher confidence)
  const signalDiversity = signals.length / 3

  // Combine factors
  const confidence = (
    signalAgreement * 0.3 +           // 30% from signal agreement
    temporalStability * 0.2 +         // 20% from temporal stability
    dataPointsWeight * 0.3 +          // 30% from data volume
    signalDiversity * 0.2             // 20% from signal diversity
  )

  return Math.max(0, Math.min(1, confidence))
}

/**
 * Calculate overall profile confidence
 */
function calculateOverallConfidence(
  signalAgreement: number,
  temporalStability: number,
  dataQualityScore: number,
  issues: ValidationIssue[]
): number {
  // Penalize for issues
  const highIssues = issues.filter(i => i.severity === 'high').length
  const mediumIssues = issues.filter(i => i.severity === 'medium').length
  const lowIssues = issues.filter(i => i.severity === 'low').length

  const issuePenalty = (highIssues * 0.15) + (mediumIssues * 0.05) + (lowIssues * 0.02)

  const baseConfidence = (
    signalAgreement * 0.3 +
    temporalStability * 0.2 +
    dataQualityScore * 0.5
  )

  return Math.max(0, Math.min(1, baseConfidence - issuePenalty))
}

/**
 * Calculate data quality score based on available signals and data points
 */
function calculateDataQualityScore(
  domainScores: DomainScore[],
  allSignals: Record<string, HybridSignalScore[]>
): number {
  let totalQuality = 0
  let domainCount = 0

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const score = domainScores.find(d => d.domainId === domain)
    const signals = allSignals[domain] || []

    if (score) {
      domainCount++

      // Data volume factor
      const volumeFactor = Math.min(1, score.dataPointsCount / 10)

      // Signal coverage factor
      const hasLiwc = signals.some(s => s.signalType === 'liwc')
      const hasEmbedding = signals.some(s => s.signalType === 'embedding')
      const hasLlm = signals.some(s => s.signalType === 'llm')
      const coverageFactor = ((hasLiwc ? 1 : 0) + (hasEmbedding ? 1 : 0) + (hasLlm ? 1 : 0)) / 3

      // Confidence factor
      const confidenceFactor = score.confidence

      totalQuality += (volumeFactor * 0.3 + coverageFactor * 0.4 + confidenceFactor * 0.3)
    }
  }

  return domainCount > 0 ? totalQuality / domainCount : 0
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format domain name for display
 */
function formatDomainName(domain: string): string {
  return domain
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Get validation summary as a simple report
 */
export function getValidationSummary(result: ValidationResult): string {
  const lines: string[] = [
    '=== Profile Validation Summary ===',
    `Status: ${result.isValid ? '✓ Valid' : '✗ Issues Found'}`,
    `Overall Confidence: ${(result.overallConfidence * 100).toFixed(1)}%`,
    '',
    '--- Statistics ---',
    `Valid Domains: ${result.summary.validDomains}/${result.summary.totalDomains}`,
    `Domains with Issues: ${result.summary.domainsWithIssues}`,
    `Signal Agreement: ${(result.summary.averageSignalAgreement * 100).toFixed(1)}%`,
    `Temporal Stability: ${(result.summary.temporalStability * 100).toFixed(1)}%`,
    `Data Quality Score: ${(result.summary.dataQualityScore * 100).toFixed(1)}%`,
  ]

  if (result.issues.length > 0) {
    lines.push('', '--- Issues Found ---')
    const highIssues = result.issues.filter(i => i.severity === 'high')
    const mediumIssues = result.issues.filter(i => i.severity === 'medium')
    const lowIssues = result.issues.filter(i => i.severity === 'low')

    if (highIssues.length > 0) {
      lines.push(`High Severity (${highIssues.length}):`)
      for (const issue of highIssues.slice(0, 5)) {
        lines.push(`  • ${issue.message}`)
      }
    }

    if (mediumIssues.length > 0) {
      lines.push(`Medium Severity (${mediumIssues.length}):`)
      for (const issue of mediumIssues.slice(0, 5)) {
        lines.push(`  • ${issue.message}`)
      }
    }

    if (lowIssues.length > 0) {
      lines.push(`Low Severity (${lowIssues.length}):`)
      for (const issue of lowIssues.slice(0, 3)) {
        lines.push(`  • ${issue.message}`)
      }
    }
  }

  return lines.join('\n')
}

/**
 * Get domains that need more data for reliable profiling
 */
export async function getDomainsNeedingData(): Promise<PsychologicalDomain[]> {
  const domainScores = await getDomainScores()
  const needsData: PsychologicalDomain[] = []

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const score = domainScores.find(d => d.domainId === domain)
    if (!score || score.dataPointsCount < VALIDATION_THRESHOLDS.minimumDataPoints || score.confidence < 0.3) {
      needsData.push(domain)
    }
  }

  return needsData
}

/**
 * Get domains with validation issues
 */
export async function getDomainsWithIssues(): Promise<{ domain: PsychologicalDomain; issues: ValidationIssue[] }[]> {
  const result = await validateProfile()
  const domainsWithIssues: { domain: PsychologicalDomain; issues: ValidationIssue[] }[] = []

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const domainResult = result.domainValidation[domain]
    if (domainResult.issues.length > 0) {
      domainsWithIssues.push({ domain, issues: domainResult.issues })
    }
  }

  return domainsWithIssues
}

/**
 * Check if profile has enough data for meaningful analysis
 */
export async function isProfileReady(): Promise<boolean> {
  const domainScores = await getDomainScores()

  // Need at least 10 domains with meaningful data
  const domainsWithData = domainScores.filter(
    d => d.dataPointsCount >= VALIDATION_THRESHOLDS.minimumDataPoints
  ).length

  return domainsWithData >= 10
}

/**
 * Get profile reliability score (0-100)
 */
export async function getProfileReliabilityScore(): Promise<number> {
  const result = await validateProfile()
  return Math.round(result.overallConfidence * 100)
}

// ==================== DEBUG FUNCTION ====================

/**
 * Debug function to inspect profile validation
 * Call from browser console: window.debugProfileValidation()
 */
export async function debugProfileValidation(): Promise<ValidationResult> {
  const result = await validateProfile()

  console.log(getValidationSummary(result))

  // Log detailed domain info
  console.log('\n=== Domain Details ===')
  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const dv = result.domainValidation[domain]
    const status = dv.isValid ? '✓' : '✗'
    const issueCount = dv.issues.length
    console.log(`${status} ${formatDomainName(domain).padEnd(30)} conf=${(dv.confidence * 100).toFixed(0)}% agree=${(dv.signalAgreement * 100).toFixed(0)}% stable=${(dv.temporalStability * 100).toFixed(0)}% issues=${issueCount}`)
  }

  return result
}

// Expose debug function globally for browser console access
if (typeof window !== 'undefined') {
  (window as unknown as { debugProfileValidation: typeof debugProfileValidation }).debugProfileValidation = debugProfileValidation
}
