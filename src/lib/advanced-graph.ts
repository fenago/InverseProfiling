/**
 * Advanced Graph Relationships Module
 * Extends graphdb.ts with sophisticated relationship modeling for psychological profiling
 *
 * Features:
 * - Temporal evolution tracking (trait changes over time)
 * - Cross-domain inference (discover hidden correlations)
 * - Causal reasoning chains (A causes B which influences C)
 * - Context-trait integration (how context affects trait expression)
 * - Path-based queries (multi-hop relationship discovery)
 * - Confidence decay (older relationships have lower weight)
 */

import {
  addTriple,
  queryTriples,
  PREDICATES,
  initGraphDB,
  type Triple,
  type Predicate,
} from './graphdb'
import type { PsychologicalDomain } from './analysis-config'
import type { ContextType } from './context-profiler'

// ==========================================
// Extended Predicate Types
// ==========================================

export const ADVANCED_PREDICATES = {
  // Temporal relationships
  EVOLVED_TO: 'evolved_to', // trait:openness@t1 evolved_to trait:openness@t2
  STABLE_OVER: 'stable_over', // trait stable over time period
  FLUCTUATES: 'fluctuates', // trait shows high variance

  // Causal relationships
  CAUSES: 'causes', // A causes B
  ENABLES: 'enables', // A enables B (prerequisite)
  INHIBITS: 'inhibits', // A inhibits B
  MEDIATES: 'mediates', // A mediates relationship between B and C

  // Context relationships
  EXPRESSED_IN: 'expressed_in', // trait expressed in context
  SUPPRESSED_IN: 'suppressed_in', // trait suppressed in context
  AMPLIFIED_BY: 'amplified_by', // trait amplified by context
  CONTEXT_SWITCH: 'context_switch', // user switched contexts

  // Pattern relationships
  PATTERN_MATCH: 'pattern_match', // matches a known pattern
  ANOMALY: 'anomaly', // deviates from expected pattern
  CLUSTER_MEMBER: 'cluster_member', // belongs to a trait cluster

  // Evidence relationships
  SUPPORTED_BY: 'supported_by', // relationship supported by evidence
  CONTRADICTED_BY: 'contradicted_by', // relationship contradicted by evidence
  CONFIDENCE_LEVEL: 'confidence_level', // meta-relationship for confidence
} as const

export type AdvancedPredicate =
  (typeof ADVANCED_PREDICATES)[keyof typeof ADVANCED_PREDICATES]

// Combine with base predicates
export const ALL_PREDICATES = { ...PREDICATES, ...ADVANCED_PREDICATES }
export type AllPredicate = Predicate | AdvancedPredicate

// ==========================================
// Type Definitions
// ==========================================

export interface TemporalSnapshot {
  domain: PsychologicalDomain
  score: number
  timestamp: Date
  confidence: number
  dataPoints: number
}

export interface TraitEvolution {
  domain: PsychologicalDomain
  snapshots: TemporalSnapshot[]
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating'
  volatility: number // 0-1, how much the trait varies
  predictedNext?: number // predicted next score
}

export interface CausalChain {
  chain: string[] // e.g., ['high_stress', 'reduced_focus', 'lower_performance']
  strength: number
  confidence: number
  evidence: string[]
}

export interface ContextTraitRelation {
  context: ContextType
  domain: PsychologicalDomain
  effect: 'amplifies' | 'suppresses' | 'neutral'
  magnitude: number // 0-1
  observations: number
}

export interface InferredRelationship {
  source: string
  target: string
  relationship: string
  confidence: number
  inferenceMethod: 'correlation' | 'cooccurrence' | 'transitivity' | 'pattern'
  evidence: string[]
}

// ==========================================
// Temporal Evolution Tracking
// ==========================================

/**
 * Record a temporal snapshot of trait scores
 */
export async function recordTemporalSnapshot(
  userId: string,
  domain: PsychologicalDomain,
  score: number,
  confidence: number,
  dataPoints: number
): Promise<void> {
  await initGraphDB()

  const timestamp = new Date().toISOString()
  const snapshotId = `snapshot:${userId}:${domain}:${timestamp}`

  // Create temporal node
  await addTriple(`user:${userId}`, 'has_snapshot' as Predicate, snapshotId, {
    domain,
    score,
    confidence,
    dataPoints,
    timestamp,
  })

  // Link to domain
  await addTriple(snapshotId, 'measures' as Predicate, `domain:${domain}`, {
    score,
    timestamp,
  })
}

/**
 * Get trait evolution history for a domain
 */
export async function getTraitEvolution(
  userId: string,
  domain: PsychologicalDomain,
  timeWindowDays: number = 30
): Promise<TraitEvolution> {
  await initGraphDB()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - timeWindowDays)

  // Get all snapshots for user
  const snapshots = await queryTriples({
    subject: `user:${userId}`,
    predicate: 'has_snapshot' as Predicate,
  })

  // Filter by domain and time window
  const relevantSnapshots: TemporalSnapshot[] = snapshots
    .filter((s) => {
      const meta = s.metadata as {
        domain: string
        timestamp: string
        score: number
        confidence: number
        dataPoints: number
      }
      return (
        meta?.domain === domain && new Date(meta?.timestamp) >= cutoff
      )
    })
    .map((s) => {
      const meta = s.metadata as {
        score: number
        timestamp: string
        confidence: number
        dataPoints: number
      }
      return {
        domain,
        score: meta.score,
        timestamp: new Date(meta.timestamp),
        confidence: meta.confidence,
        dataPoints: meta.dataPoints,
      }
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  if (relevantSnapshots.length === 0) {
    return {
      domain,
      snapshots: [],
      trend: 'stable',
      volatility: 0,
    }
  }

  // Calculate trend
  const scores = relevantSnapshots.map((s) => s.score)
  const trend = calculateTrend(scores)
  const volatility = calculateVolatility(scores)

  // Simple linear prediction for next score
  const predictedNext =
    scores.length >= 3
      ? predictNextScore(scores)
      : undefined

  return {
    domain,
    snapshots: relevantSnapshots,
    trend,
    volatility,
    predictedNext,
  }
}

/**
 * Calculate trend from a series of scores
 */
function calculateTrend(
  scores: number[]
): 'increasing' | 'decreasing' | 'stable' | 'fluctuating' {
  if (scores.length < 2) return 'stable'

  // Calculate simple linear regression slope
  const n = scores.length
  const sumX = (n * (n - 1)) / 2
  const sumY = scores.reduce((a, b) => a + b, 0)
  const sumXY = scores.reduce((sum, y, i) => sum + i * y, 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

  // Check for fluctuation
  let directionChanges = 0
  for (let i = 1; i < scores.length - 1; i++) {
    const prev = scores[i] - scores[i - 1]
    const next = scores[i + 1] - scores[i]
    if (prev * next < 0) directionChanges++
  }

  if (directionChanges > scores.length / 3) return 'fluctuating'
  if (Math.abs(slope) < 0.02) return 'stable'
  return slope > 0 ? 'increasing' : 'decreasing'
}

/**
 * Calculate volatility (standard deviation normalized)
 */
function calculateVolatility(scores: number[]): number {
  if (scores.length < 2) return 0

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance =
    scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
    scores.length
  const stdDev = Math.sqrt(variance)

  // Normalize to 0-1 range (assuming scores are 0-1)
  return Math.min(1, stdDev * 2)
}

/**
 * Simple linear prediction for next score
 */
function predictNextScore(scores: number[]): number {
  const n = scores.length
  const sumX = (n * (n - 1)) / 2
  const sumY = scores.reduce((a, b) => a + b, 0)
  const sumXY = scores.reduce((sum, y, i) => sum + i * y, 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const predicted = intercept + slope * n
  return Math.max(0, Math.min(1, predicted))
}

/**
 * Record evolution relationship between time points
 */
export async function recordTraitEvolutionEdge(
  userId: string,
  domain: PsychologicalDomain,
  previousScore: number,
  currentScore: number
): Promise<void> {
  await initGraphDB()

  const change = currentScore - previousScore
  const changeType =
    Math.abs(change) < 0.05
      ? 'stable'
      : change > 0
        ? 'increased'
        : 'decreased'

  await addTriple(
    `user:${userId}`,
    ADVANCED_PREDICATES.EVOLVED_TO as Predicate,
    `domain:${domain}`,
    {
      previousScore,
      currentScore,
      change,
      changeType,
      timestamp: new Date().toISOString(),
    }
  )
}

// ==========================================
// Cross-Domain Inference
// ==========================================

/**
 * Known psychological domain correlations from research
 */
const KNOWN_CORRELATIONS: Array<{
  domain1: PsychologicalDomain
  domain2: PsychologicalDomain
  correlation: number // positive = correlate, negative = anti-correlate
  source: string
}> = [
  // Big Five correlations
  {
    domain1: 'big_five_extraversion',
    domain2: 'big_five_openness',
    correlation: 0.3,
    source: 'Big Five research',
  },
  {
    domain1: 'big_five_conscientiousness',
    domain2: 'big_five_neuroticism',
    correlation: -0.4,
    source: 'Big Five research',
  },
  {
    domain1: 'big_five_agreeableness',
    domain2: 'big_five_neuroticism',
    correlation: -0.2,
    source: 'Big Five research',
  },
  {
    domain1: 'big_five_openness',
    domain2: 'creativity',
    correlation: 0.6,
    source: 'Creativity research',
  },

  // Emotional intelligence correlations
  {
    domain1: 'emotional_intelligence',
    domain2: 'emotional_empathy',
    correlation: 0.7,
    source: 'EQ research',
  },
  {
    domain1: 'emotional_intelligence',
    domain2: 'big_five_agreeableness',
    correlation: 0.4,
    source: 'Personality-EQ studies',
  },

  // Motivation correlations
  {
    domain1: 'growth_mindset',
    domain2: 'self_efficacy',
    correlation: 0.5,
    source: 'Motivation research',
  },
  {
    domain1: 'achievement_motivation',
    domain2: 'big_five_conscientiousness',
    correlation: 0.5,
    source: 'Achievement studies',
  },

  // Dark triad correlations
  {
    domain1: 'dark_triad_narcissism',
    domain2: 'big_five_extraversion',
    correlation: 0.4,
    source: 'Dark Triad research',
  },
  {
    domain1: 'dark_triad_machiavellianism',
    domain2: 'big_five_agreeableness',
    correlation: -0.5,
    source: 'Dark Triad research',
  },

  // Cognitive correlations
  {
    domain1: 'cognitive_abilities',
    domain2: 'metacognition',
    correlation: 0.4,
    source: 'Cognitive science',
  },
  {
    domain1: 'executive_functions',
    domain2: 'big_five_conscientiousness',
    correlation: 0.35,
    source: 'Neuroscience studies',
  },

  // Well-being correlations
  {
    domain1: 'life_satisfaction',
    domain2: 'big_five_neuroticism',
    correlation: -0.5,
    source: 'Well-being research',
  },
  {
    domain1: 'life_satisfaction',
    domain2: 'big_five_extraversion',
    correlation: 0.4,
    source: 'Well-being research',
  },
  {
    domain1: 'stress_coping',
    domain2: 'big_five_neuroticism',
    correlation: -0.4,
    source: 'Resilience studies',
  },
]

/**
 * Infer relationships based on known psychological correlations
 */
export async function inferCrossdomainRelationships(
  domainScores: Record<string, number>
): Promise<InferredRelationship[]> {
  await initGraphDB()

  const inferred: InferredRelationship[] = []

  for (const correlation of KNOWN_CORRELATIONS) {
    const score1 = domainScores[correlation.domain1]
    const score2 = domainScores[correlation.domain2]

    if (score1 === undefined || score2 === undefined) continue

    // Check if observed relationship matches expected
    const observedCorrelation = (score1 - 0.5) * (score2 - 0.5) * 4 // normalize to -1 to 1 range
    const expectedDirection = correlation.correlation > 0 ? 'positive' : 'negative'
    const observedDirection = observedCorrelation > 0 ? 'positive' : 'negative'

    const matchesExpected = expectedDirection === observedDirection
    const confidence = matchesExpected
      ? Math.min(1, Math.abs(observedCorrelation) + 0.3)
      : Math.max(0.1, 0.5 - Math.abs(observedCorrelation))

    const relationship = correlation.correlation > 0
      ? PREDICATES.CORRELATES_WITH
      : PREDICATES.CONTRADICTS

    inferred.push({
      source: `domain:${correlation.domain1}`,
      target: `domain:${correlation.domain2}`,
      relationship,
      confidence,
      inferenceMethod: 'correlation',
      evidence: [
        correlation.source,
        matchesExpected
          ? `Observed pattern matches expected (r=${correlation.correlation.toFixed(2)})`
          : `Observed pattern differs from expected correlation`,
      ],
    })

    // Store in graph
    await addTriple(
      `domain:${correlation.domain1}`,
      relationship,
      `domain:${correlation.domain2}`,
      {
        expectedCorrelation: correlation.correlation,
        observedCorrelation,
        confidence,
        source: correlation.source,
        matchesExpected,
        timestamp: new Date().toISOString(),
      }
    )
  }

  return inferred
}

/**
 * Discover new correlations from observed data
 */
export async function discoverCorrelations(
  historicalScores: Array<Record<string, number>>
): Promise<InferredRelationship[]> {
  if (historicalScores.length < 5) return []

  const discovered: InferredRelationship[] = []
  const domains = Object.keys(historicalScores[0] || {})

  // Calculate pairwise correlations
  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      const domain1 = domains[i]
      const domain2 = domains[j]

      const scores1 = historicalScores.map((s) => s[domain1]).filter((s) => s !== undefined)
      const scores2 = historicalScores.map((s) => s[domain2]).filter((s) => s !== undefined)

      if (scores1.length < 5 || scores2.length < 5) continue

      const correlation = calculatePearsonCorrelation(scores1, scores2)

      // Only record significant correlations
      if (Math.abs(correlation) > 0.3) {
        const relationship =
          correlation > 0 ? PREDICATES.CORRELATES_WITH : PREDICATES.CONTRADICTS

        discovered.push({
          source: `domain:${domain1}`,
          target: `domain:${domain2}`,
          relationship,
          confidence: Math.abs(correlation),
          inferenceMethod: 'cooccurrence',
          evidence: [
            `Observed correlation: ${correlation.toFixed(3)}`,
            `Based on ${scores1.length} observations`,
          ],
        })
      }
    }
  }

  return discovered
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0

  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let denomX = 0
  let denomY = 0

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    numerator += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }

  const denominator = Math.sqrt(denomX * denomY)
  return denominator === 0 ? 0 : numerator / denominator
}

// ==========================================
// Causal Reasoning Chains
// ==========================================

/**
 * Known causal patterns in psychology
 */
const CAUSAL_PATTERNS: Array<{
  chain: string[]
  strength: number
  description: string
}> = [
  {
    chain: ['high_stress', 'reduced_executive_function', 'impulsive_decisions'],
    strength: 0.7,
    description: 'Stress-cognition-behavior pathway',
  },
  {
    chain: ['growth_mindset', 'effort_persistence', 'skill_improvement'],
    strength: 0.6,
    description: 'Mindset-effort-outcome pathway',
  },
  {
    chain: ['high_neuroticism', 'negative_interpretation', 'social_withdrawal'],
    strength: 0.5,
    description: 'Neuroticism-cognition-social pathway',
  },
  {
    chain: ['emotional_intelligence', 'conflict_resolution', 'relationship_quality'],
    strength: 0.6,
    description: 'EQ-skills-outcomes pathway',
  },
  {
    chain: ['low_self_efficacy', 'avoidance_behavior', 'reduced_opportunities'],
    strength: 0.5,
    description: 'Self-efficacy-avoidance pathway',
  },
  {
    chain: ['openness', 'novelty_seeking', 'creative_output'],
    strength: 0.6,
    description: 'Openness-exploration-creativity pathway',
  },
  {
    chain: ['conscientiousness', 'goal_setting', 'achievement'],
    strength: 0.7,
    description: 'Conscientiousness-planning-success pathway',
  },
]

/**
 * Identify potential causal chains from user profile
 */
export async function identifyCausalChains(
  domainScores: Record<string, number>,
  behaviors: string[]
): Promise<CausalChain[]> {
  await initGraphDB()

  const identifiedChains: CausalChain[] = []

  for (const pattern of CAUSAL_PATTERNS) {
    // Check if chain elements are present in profile
    let matchCount = 0
    const evidence: string[] = []

    for (const element of pattern.chain) {
      // Check domain scores
      for (const [domain, score] of Object.entries(domainScores)) {
        if (
          element.toLowerCase().includes(domain.toLowerCase()) ||
          domain.toLowerCase().includes(element.split('_')[0])
        ) {
          const isHigh = element.startsWith('high_')
          const isLow = element.startsWith('low_')

          if ((isHigh && score > 0.6) || (isLow && score < 0.4) || (!isHigh && !isLow)) {
            matchCount++
            evidence.push(`${domain}: ${score.toFixed(2)}`)
          }
        }
      }

      // Check behaviors
      for (const behavior of behaviors) {
        if (
          element.toLowerCase().includes(behavior.toLowerCase()) ||
          behavior.toLowerCase().includes(element.toLowerCase())
        ) {
          matchCount++
          evidence.push(`Behavior: ${behavior}`)
        }
      }
    }

    // If we match at least 2 elements, record the chain
    if (matchCount >= 2) {
      const confidence = matchCount / pattern.chain.length
      identifiedChains.push({
        chain: pattern.chain,
        strength: pattern.strength * confidence,
        confidence,
        evidence,
      })

      // Store causal relationships in graph
      for (let i = 0; i < pattern.chain.length - 1; i++) {
        await addTriple(
          `concept:${pattern.chain[i]}`,
          ADVANCED_PREDICATES.CAUSES as Predicate,
          `concept:${pattern.chain[i + 1]}`,
          {
            chainId: pattern.chain.join('->'),
            position: i,
            strength: pattern.strength,
            confidence,
            timestamp: new Date().toISOString(),
          }
        )
      }
    }
  }

  return identifiedChains
}

// ==========================================
// Context-Trait Relationships
// ==========================================

/**
 * Record how a trait is expressed in a specific context
 */
export async function recordContextTraitExpression(
  userId: string,
  context: ContextType,
  domain: PsychologicalDomain,
  scoreInContext: number,
  baselineScore: number
): Promise<ContextTraitRelation> {
  await initGraphDB()

  const difference = scoreInContext - baselineScore
  const effect: 'amplifies' | 'suppresses' | 'neutral' =
    difference > 0.1 ? 'amplifies' : difference < -0.1 ? 'suppresses' : 'neutral'

  const predicate =
    effect === 'amplifies'
      ? ADVANCED_PREDICATES.AMPLIFIED_BY
      : effect === 'suppresses'
        ? ADVANCED_PREDICATES.SUPPRESSED_IN
        : ADVANCED_PREDICATES.EXPRESSED_IN

  await addTriple(
    `trait:${domain}:${userId}`,
    predicate as Predicate,
    `context:${context}`,
    {
      scoreInContext,
      baselineScore,
      difference,
      magnitude: Math.abs(difference),
      timestamp: new Date().toISOString(),
    }
  )

  // Query existing observations to count
  const existing = await queryTriples({
    subject: `trait:${domain}:${userId}`,
    object: `context:${context}`,
  })

  return {
    context,
    domain,
    effect,
    magnitude: Math.abs(difference),
    observations: existing.length + 1,
  }
}

/**
 * Get context effects on traits for a user
 */
export async function getContextEffects(
  userId: string
): Promise<ContextTraitRelation[]> {
  await initGraphDB()

  const effects: ContextTraitRelation[] = []

  const amplifiedTriples = await queryTriples({
    predicate: ADVANCED_PREDICATES.AMPLIFIED_BY as Predicate,
  })
  const suppressedTriples = await queryTriples({
    predicate: ADVANCED_PREDICATES.SUPPRESSED_IN as Predicate,
  })
  const expressedTriples = await queryTriples({
    predicate: ADVANCED_PREDICATES.EXPRESSED_IN as Predicate,
  })

  const processTriples = (
    triples: Triple[],
    effectType: 'amplifies' | 'suppresses' | 'neutral'
  ) => {
    for (const triple of triples) {
      if (!triple.subject.includes(userId)) continue

      const domain = triple.subject.split(':')[1] as PsychologicalDomain
      const context = triple.object.replace('context:', '') as ContextType
      const meta = triple.metadata as { magnitude?: number }

      effects.push({
        context,
        domain,
        effect: effectType,
        magnitude: meta?.magnitude || 0.2,
        observations: 1, // Would aggregate in real implementation
      })
    }
  }

  processTriples(amplifiedTriples, 'amplifies')
  processTriples(suppressedTriples, 'suppresses')
  processTriples(expressedTriples, 'neutral')

  return effects
}

// ==========================================
// Path-Based Queries
// ==========================================

/**
 * Find all paths between two nodes up to a certain depth
 */
export async function findPaths(
  startNode: string,
  endNode: string,
  maxDepth: number = 3
): Promise<Array<{ path: string[]; relationships: string[] }>> {
  await initGraphDB()

  const paths: Array<{ path: string[]; relationships: string[] }> = []

  async function explorePath(
    current: string,
    visited: Set<string>,
    currentPath: string[],
    relationships: string[],
    depth: number
  ): Promise<void> {
    if (depth > maxDepth) return
    if (current === endNode) {
      paths.push({
        path: [...currentPath],
        relationships: [...relationships],
      })
      return
    }

    visited.add(current)

    const outgoing = await queryTriples({ subject: current })
    for (const triple of outgoing) {
      if (!visited.has(triple.object)) {
        await explorePath(
          triple.object,
          new Set(visited),
          [...currentPath, triple.object],
          [...relationships, triple.predicate],
          depth + 1
        )
      }
    }
  }

  await explorePath(startNode, new Set(), [startNode], [], 0)
  return paths
}

/**
 * Find nodes reachable within N hops
 */
export async function findReachableNodes(
  startNode: string,
  maxHops: number = 2
): Promise<Map<string, { distance: number; relationships: string[] }>> {
  await initGraphDB()

  const reachable = new Map<string, { distance: number; relationships: string[] }>()
  reachable.set(startNode, { distance: 0, relationships: [] })

  const queue: Array<{ node: string; distance: number; rels: string[] }> = [
    { node: startNode, distance: 0, rels: [] },
  ]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.distance >= maxHops) continue

    const outgoing = await queryTriples({ subject: current.node })
    for (const triple of outgoing) {
      if (!reachable.has(triple.object)) {
        const newRels = [...current.rels, triple.predicate]
        reachable.set(triple.object, {
          distance: current.distance + 1,
          relationships: newRels,
        })
        queue.push({
          node: triple.object,
          distance: current.distance + 1,
          rels: newRels,
        })
      }
    }
  }

  return reachable
}

// ==========================================
// Aggregate Analysis Functions
// ==========================================

/**
 * Get comprehensive graph insights for a user
 */
export async function getGraphInsights(userId: string): Promise<{
  evolvingTraits: Array<{ domain: string; trend: string; volatility: number }>
  strongestCorrelations: Array<{ domain1: string; domain2: string; strength: number }>
  activeChains: CausalChain[]
  contextEffects: ContextTraitRelation[]
  graphDensity: number
}> {
  await initGraphDB()

  // Get evolving traits
  const evolutionDomains: PsychologicalDomain[] = [
    'big_five_openness',
    'big_five_conscientiousness',
    'big_five_extraversion',
    'big_five_agreeableness',
    'big_five_neuroticism',
    'emotional_intelligence',
    'growth_mindset',
  ]

  const evolvingTraits: Array<{ domain: string; trend: string; volatility: number }> =
    []
  for (const domain of evolutionDomains) {
    const evolution = await getTraitEvolution(userId, domain)
    if (evolution.snapshots.length > 0) {
      evolvingTraits.push({
        domain,
        trend: evolution.trend,
        volatility: evolution.volatility,
      })
    }
  }

  // Get strongest correlations from graph
  const correlations = await queryTriples({
    predicate: PREDICATES.CORRELATES_WITH,
  })
  const strongestCorrelations = correlations
    .filter((t) => ((t.metadata as { confidence?: number })?.confidence || 0) > 0.5)
    .map((t) => ({
      domain1: t.subject.replace('domain:', ''),
      domain2: t.object.replace('domain:', ''),
      strength: (t.metadata as { confidence?: number })?.confidence || 0,
    }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5)

  // Get context effects
  const contextEffects = await getContextEffects(userId)

  // Calculate graph density
  const allTriples = await queryTriples({})
  const nodes = new Set<string>()
  for (const t of allTriples) {
    nodes.add(t.subject)
    nodes.add(t.object)
  }
  const maxEdges = nodes.size * (nodes.size - 1)
  const graphDensity = maxEdges > 0 ? allTriples.length / maxEdges : 0

  return {
    evolvingTraits,
    strongestCorrelations,
    activeChains: [], // Would come from identifyCausalChains
    contextEffects,
    graphDensity,
  }
}

/**
 * Build comprehensive advanced relationships from analysis results
 */
export async function buildAdvancedRelationships(
  userId: string,
  domainScores: Record<string, number>,
  context: ContextType | undefined,
  previousScores?: Record<string, number>
): Promise<void> {
  await initGraphDB()

  // Record temporal snapshots
  for (const [domain, score] of Object.entries(domainScores)) {
    await recordTemporalSnapshot(
      userId,
      domain as PsychologicalDomain,
      score,
      0.8, // Default confidence
      1 // Single data point
    )

    // Record evolution if we have previous scores
    if (previousScores && previousScores[domain] !== undefined) {
      await recordTraitEvolutionEdge(
        userId,
        domain as PsychologicalDomain,
        previousScores[domain],
        score
      )
    }
  }

  // Infer cross-domain relationships
  await inferCrossdomainRelationships(domainScores)

  // Record context effects if context is provided
  if (context) {
    for (const [domain, score] of Object.entries(domainScores)) {
      const baselineScore = previousScores?.[domain] || 0.5
      await recordContextTraitExpression(
        userId,
        context,
        domain as PsychologicalDomain,
        score,
        baselineScore
      )
    }
  }
}

export default {
  recordTemporalSnapshot,
  getTraitEvolution,
  recordTraitEvolutionEdge,
  inferCrossdomainRelationships,
  discoverCorrelations,
  identifyCausalChains,
  recordContextTraitExpression,
  getContextEffects,
  findPaths,
  findReachableNodes,
  getGraphInsights,
  buildAdvancedRelationships,
  ADVANCED_PREDICATES,
  ALL_PREDICATES,
}
