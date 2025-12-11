/**
 * LevelGraph Knowledge Graph Module
 * Phase 2: Relationship modeling for psychological profiling
 *
 * Relationship Types:
 * - user-topic: What topics the user discusses
 * - topic-domain: Which psychological domains topics map to
 * - concept-concept: How concepts relate to each other
 * - trait-behavior: How traits manifest in behaviors
 * - domain-domain: Cross-domain correlations
 */

import { Level } from 'level'
import levelgraph from 'levelgraph'

// Types for graph triples
export interface Triple {
  subject: string
  predicate: string
  object: string
  metadata?: Record<string, unknown>
  [key: string]: unknown // Index signature for levelgraph compatibility
}

export interface RelationshipQuery {
  subject?: string
  predicate?: string
  object?: string
}

// Predicate types for type safety
export const PREDICATES = {
  // User relationships
  DISCUSSES: 'discusses',
  INTERESTED_IN: 'interested_in',
  VALUES: 'values',
  BELIEVES: 'believes',
  EXHIBITS: 'exhibits',

  // Topic relationships
  BELONGS_TO_DOMAIN: 'belongs_to_domain',
  RELATED_TO: 'related_to',
  SIMILAR_TO: 'similar_to',
  OPPOSITE_OF: 'opposite_of',

  // Trait relationships
  INDICATES: 'indicates',
  CORRELATES_WITH: 'correlates_with',
  CONTRADICTS: 'contradicts',
  REINFORCES: 'reinforces',

  // Domain relationships
  INFLUENCES: 'influences',
  PREDICTS: 'predicts',
  SHARES_MARKERS_WITH: 'shares_markers_with',

  // Temporal relationships
  PRECEDES: 'precedes',
  FOLLOWS: 'follows',
  CONCURRENT_WITH: 'concurrent_with',
} as const

export type Predicate = (typeof PREDICATES)[keyof typeof PREDICATES]

// Graph instance
let graphDb: ReturnType<typeof levelgraph> | null = null
let levelDb: Level | null = null
let isInitialized = false

/**
 * Initialize the LevelGraph database
 */
export async function initGraphDB(): Promise<boolean> {
  if (isInitialized && graphDb) return true

  try {
    console.log('Initializing LevelGraph knowledge graph...')

    // Create IndexedDB-backed Level instance for browser
    // Level v10 auto-detects browser and uses IndexedDB via browser-level
    levelDb = new Level('digital-twin-graph', {
      valueEncoding: 'json',
    })

    // Wait for the database to be open
    await levelDb.open()

    // Create levelgraph on top
    graphDb = levelgraph(levelDb)

    isInitialized = true
    console.log('LevelGraph initialized successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize LevelGraph:', error)
    return false
  }
}

/**
 * Add a triple to the graph
 */
export async function addTriple(
  subject: string,
  predicate: Predicate,
  object: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!graphDb) {
    await initGraphDB()
  }

  return new Promise((resolve, reject) => {
    const triple: Triple = {
      subject,
      predicate,
      object,
    }

    if (metadata) {
      triple.metadata = metadata
    }

    graphDb!.put(triple, (err: Error | null) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

/**
 * Remove a triple from the graph
 */
export async function removeTriple(
  subject: string,
  predicate: Predicate,
  object: string
): Promise<void> {
  if (!graphDb) {
    await initGraphDB()
  }

  return new Promise((resolve, reject) => {
    graphDb!.del({ subject, predicate, object }, (err: Error | null) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

/**
 * Query triples from the graph
 */
export async function queryTriples(query: RelationshipQuery): Promise<Triple[]> {
  if (!graphDb) {
    await initGraphDB()
  }

  return new Promise((resolve, reject) => {
    graphDb!.get(query, (err: Error | null, list: Triple[]) => {
      if (err) reject(err)
      else resolve(list || [])
    })
  })
}

/**
 * Get all relationships for a subject
 */
export async function getSubjectRelationships(subject: string): Promise<Triple[]> {
  return queryTriples({ subject })
}

/**
 * Get all relationships for an object
 */
export async function getObjectRelationships(object: string): Promise<Triple[]> {
  return queryTriples({ object })
}

/**
 * Get relationships between two nodes
 */
export async function getRelationshipsBetween(
  subject: string,
  object: string
): Promise<Triple[]> {
  return queryTriples({ subject, object })
}

// ==========================================
// User-Topic Relationships
// ==========================================

/**
 * Record that a user discusses a topic
 */
export async function recordUserTopic(
  userId: string,
  topic: string,
  metadata?: {
    frequency?: number
    sentiment?: number
    lastMentioned?: Date
  }
): Promise<void> {
  await addTriple(`user:${userId}`, PREDICATES.DISCUSSES, `topic:${topic}`, {
    ...metadata,
    lastMentioned: metadata?.lastMentioned?.toISOString() || new Date().toISOString(),
  })
}

/**
 * Get topics discussed by a user
 */
export async function getUserTopics(userId: string): Promise<string[]> {
  const triples = await queryTriples({
    subject: `user:${userId}`,
    predicate: PREDICATES.DISCUSSES,
  })
  return triples.map(t => t.object.replace('topic:', ''))
}

// ==========================================
// Topic-Domain Mappings
// ==========================================

/**
 * Map a topic to a psychological domain
 */
export async function mapTopicToDomain(
  topic: string,
  domain: string,
  confidence: number = 1.0
): Promise<void> {
  await addTriple(`topic:${topic}`, PREDICATES.BELONGS_TO_DOMAIN, `domain:${domain}`, {
    confidence,
  })
}

/**
 * Get domains associated with a topic
 */
export async function getTopicDomains(topic: string): Promise<string[]> {
  const triples = await queryTriples({
    subject: `topic:${topic}`,
    predicate: PREDICATES.BELONGS_TO_DOMAIN,
  })
  return triples.map(t => t.object.replace('domain:', ''))
}

/**
 * Get topics in a domain
 */
export async function getDomainTopics(domain: string): Promise<string[]> {
  const triples = await queryTriples({
    predicate: PREDICATES.BELONGS_TO_DOMAIN,
    object: `domain:${domain}`,
  })
  return triples.map(t => t.subject.replace('topic:', ''))
}

// ==========================================
// Concept Relationships
// ==========================================

/**
 * Record relationship between concepts
 */
export async function relateConceptsToConcepts(
  concept1: string,
  predicate: Predicate,
  concept2: string,
  strength: number = 1.0
): Promise<void> {
  await addTriple(`concept:${concept1}`, predicate, `concept:${concept2}`, {
    strength,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Get related concepts
 */
export async function getRelatedConcepts(concept: string): Promise<Array<{
  concept: string
  relationship: string
  strength: number
}>> {
  const triples = await queryTriples({
    subject: `concept:${concept}`,
  })

  return triples
    .filter(t => t.object.startsWith('concept:'))
    .map(t => ({
      concept: t.object.replace('concept:', ''),
      relationship: t.predicate,
      strength: (t.metadata?.strength as number) || 1.0,
    }))
}

// ==========================================
// Trait-Behavior Mappings
// ==========================================

/**
 * Record that a trait indicates a behavior
 */
export async function mapTraitToBehavior(
  trait: string,
  behavior: string,
  metadata?: {
    correlation?: number
    evidence_count?: number
  }
): Promise<void> {
  await addTriple(`trait:${trait}`, PREDICATES.INDICATES, `behavior:${behavior}`, {
    ...metadata,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Get behaviors associated with a trait
 */
export async function getTraitBehaviors(trait: string): Promise<string[]> {
  const triples = await queryTriples({
    subject: `trait:${trait}`,
    predicate: PREDICATES.INDICATES,
  })
  return triples.map(t => t.object.replace('behavior:', ''))
}

/**
 * Get traits that indicate a behavior
 */
export async function getBehaviorTraits(behavior: string): Promise<string[]> {
  const triples = await queryTriples({
    predicate: PREDICATES.INDICATES,
    object: `behavior:${behavior}`,
  })
  return triples.map(t => t.subject.replace('trait:', ''))
}

// ==========================================
// Domain Correlation Tracking
// ==========================================

/**
 * Record correlation between domains
 */
export async function recordDomainCorrelation(
  domain1: string,
  domain2: string,
  correlation: number
): Promise<void> {
  const predicate =
    correlation > 0 ? PREDICATES.CORRELATES_WITH : PREDICATES.CONTRADICTS

  await addTriple(`domain:${domain1}`, predicate, `domain:${domain2}`, {
    correlation: Math.abs(correlation),
    timestamp: new Date().toISOString(),
  })
}

/**
 * Get correlated domains
 */
export async function getCorrelatedDomains(domain: string): Promise<Array<{
  domain: string
  correlation: number
  type: 'positive' | 'negative'
}>> {
  const positiveTriples = await queryTriples({
    subject: `domain:${domain}`,
    predicate: PREDICATES.CORRELATES_WITH,
  })

  const negativeTriples = await queryTriples({
    subject: `domain:${domain}`,
    predicate: PREDICATES.CONTRADICTS,
  })

  return [
    ...positiveTriples.map(t => ({
      domain: t.object.replace('domain:', ''),
      correlation: (t.metadata?.correlation as number) || 1.0,
      type: 'positive' as const,
    })),
    ...negativeTriples.map(t => ({
      domain: t.object.replace('domain:', ''),
      correlation: (t.metadata?.correlation as number) || 1.0,
      type: 'negative' as const,
    })),
  ]
}

// ==========================================
// Cross-Domain Analysis
// ==========================================

/**
 * Build relationships from domain scores
 * This creates the knowledge graph structure based on analysis results
 */
export async function buildRelationshipsFromScores(
  userId: string,
  domainScores: Record<string, number>,
  topics: string[]
): Promise<void> {
  // Record user-topic relationships
  for (const topic of topics) {
    await recordUserTopic(userId, topic)
  }

  // Map topics to likely domains based on keywords
  const topicDomainMap: Record<string, string[]> = {
    // Big Five related
    adventure: ['openness', 'extraversion'],
    creativity: ['openness', 'creativity'],
    organization: ['conscientiousness'],
    social: ['extraversion', 'agreeableness'],
    conflict: ['agreeableness', 'neuroticism'],
    worry: ['neuroticism'],

    // Cognitive
    analysis: ['cognitive_abilities', 'analytical_thinking'],
    problem: ['cognitive_abilities', 'decision_making'],
    learn: ['learning_styles', 'growth_mindset'],

    // Emotional
    feeling: ['emotional_intelligence'],
    emotion: ['emotional_intelligence', 'emotional_tone'],
    stress: ['resilience_coping', 'neuroticism'],

    // Values
    ethics: ['moral_reasoning', 'values'],
    politics: ['political_ideology'],
    culture: ['cultural_values'],

    // Time
    future: ['time_perspective'],
    past: ['time_perspective'],
    present: ['time_perspective'],
  }

  for (const topic of topics) {
    const domains = topicDomainMap[topic.toLowerCase()] || []
    for (const domain of domains) {
      await mapTopicToDomain(topic, domain, 0.8)
    }
  }

  // Record domain correlations based on scores
  const domainPairs = Object.keys(domainScores)
  for (let i = 0; i < domainPairs.length; i++) {
    for (let j = i + 1; j < domainPairs.length; j++) {
      const domain1 = domainPairs[i]
      const domain2 = domainPairs[j]
      const score1 = domainScores[domain1]
      const score2 = domainScores[domain2]

      // If both scores are high, they correlate
      if (score1 > 0.6 && score2 > 0.6) {
        await recordDomainCorrelation(domain1, domain2, 0.7)
      }
      // If one high and one low, they may contradict
      else if ((score1 > 0.7 && score2 < 0.3) || (score2 > 0.7 && score1 < 0.3)) {
        await recordDomainCorrelation(domain1, domain2, -0.5)
      }
    }
  }

  // Record trait-behavior mappings for high-scoring domains
  const traitBehaviorMap: Record<string, string[]> = {
    openness: ['seeks_novelty', 'creative_expression', 'intellectual_curiosity'],
    conscientiousness: ['organized_behavior', 'goal_pursuit', 'detailed_planning'],
    extraversion: ['social_engagement', 'verbal_expression', 'group_activities'],
    agreeableness: ['cooperative_behavior', 'empathetic_response', 'conflict_avoidance'],
    neuroticism: ['worry_expression', 'emotional_reactivity', 'stress_sensitivity'],
    growth_mindset: ['challenge_seeking', 'effort_valuation', 'feedback_reception'],
    emotional_intelligence: ['emotion_recognition', 'emotion_regulation', 'social_awareness'],
  }

  for (const [trait, behaviors] of Object.entries(traitBehaviorMap)) {
    const score = domainScores[trait]
    if (score && score > 0.5) {
      for (const behavior of behaviors) {
        await mapTraitToBehavior(trait, behavior, {
          correlation: score,
          evidence_count: 1,
        })
      }
    }
  }
}

/**
 * Get user profile summary from graph
 */
export async function getUserGraphProfile(userId: string): Promise<{
  topics: string[]
  domains: string[]
  traits: Array<{ trait: string; behaviors: string[] }>
  correlations: Array<{ domain1: string; domain2: string; type: string }>
}> {
  // Get user topics
  const topics = await getUserTopics(userId)

  // Get unique domains from topics
  const domainsSet = new Set<string>()
  for (const topic of topics) {
    const domains = await getTopicDomains(topic)
    domains.forEach(d => domainsSet.add(d))
  }

  // Get trait-behavior mappings
  const traits: Array<{ trait: string; behaviors: string[] }> = []
  const traitNames = [
    'openness',
    'conscientiousness',
    'extraversion',
    'agreeableness',
    'neuroticism',
    'growth_mindset',
    'emotional_intelligence',
  ]

  for (const trait of traitNames) {
    const behaviors = await getTraitBehaviors(trait)
    if (behaviors.length > 0) {
      traits.push({ trait, behaviors })
    }
  }

  // Get domain correlations
  const correlations: Array<{ domain1: string; domain2: string; type: string }> = []
  const processedPairs = new Set<string>()

  for (const domain of domainsSet) {
    const correlated = await getCorrelatedDomains(domain)
    for (const c of correlated) {
      const pairKey = [domain, c.domain].sort().join(':')
      if (!processedPairs.has(pairKey)) {
        processedPairs.add(pairKey)
        correlations.push({
          domain1: domain,
          domain2: c.domain,
          type: c.type,
        })
      }
    }
  }

  return {
    topics,
    domains: Array.from(domainsSet),
    traits,
    correlations,
  }
}

/**
 * Get graph statistics
 */
export async function getGraphStats(): Promise<{
  totalTriples: number
  userTopicCount: number
  topicDomainCount: number
  traitBehaviorCount: number
  domainCorrelationCount: number
  isInitialized: boolean
}> {
  if (!graphDb || !isInitialized) {
    return {
      totalTriples: 0,
      userTopicCount: 0,
      topicDomainCount: 0,
      traitBehaviorCount: 0,
      domainCorrelationCount: 0,
      isInitialized: false,
    }
  }

  const allTriples = await queryTriples({})
  const userTopics = await queryTriples({ predicate: PREDICATES.DISCUSSES })
  const topicDomains = await queryTriples({ predicate: PREDICATES.BELONGS_TO_DOMAIN })
  const traitBehaviors = await queryTriples({ predicate: PREDICATES.INDICATES })
  const correlations = await queryTriples({ predicate: PREDICATES.CORRELATES_WITH })
  const contradictions = await queryTriples({ predicate: PREDICATES.CONTRADICTS })

  return {
    totalTriples: allTriples.length,
    userTopicCount: userTopics.length,
    topicDomainCount: topicDomains.length,
    traitBehaviorCount: traitBehaviors.length,
    domainCorrelationCount: correlations.length + contradictions.length,
    isInitialized,
  }
}

/**
 * Clear all graph data
 */
export async function clearGraph(): Promise<void> {
  if (!graphDb) return

  const allTriples = await queryTriples({})

  for (const triple of allTriples) {
    await new Promise<void>((resolve, reject) => {
      graphDb!.del(triple, (err: Error | null) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  console.log('Graph cleared')
}

/**
 * Get all triples for inspection and visualization
 */
export async function getAllTriples(): Promise<Triple[]> {
  if (!graphDb || !isInitialized) {
    return []
  }
  return queryTriples({})
}

/**
 * Get graph data formatted for visualization
 */
export async function getGraphVisualizationData(): Promise<{
  nodes: Array<{ id: string; type: string; label: string }>
  edges: Array<{ source: string; target: string; label: string; metadata?: Record<string, unknown> }>
}> {
  if (!graphDb || !isInitialized) {
    return { nodes: [], edges: [] }
  }

  const allTriples = await queryTriples({})
  const nodesMap = new Map<string, { id: string; type: string; label: string }>()
  const edges: Array<{ source: string; target: string; label: string; metadata?: Record<string, unknown> }> = []

  for (const triple of allTriples) {
    // Skip malformed triples
    if (!triple.subject || !triple.object || !triple.predicate) {
      continue
    }

    // Extract node type from prefix (e.g., "user:123" -> type: "user", label: "123")
    const subjectParts = String(triple.subject).split(':')
    const subjectType = subjectParts[0] || 'unknown'
    const subjectLabel = subjectParts.slice(1).join(':') || triple.subject

    const objectParts = String(triple.object).split(':')
    const objectType = objectParts[0] || 'unknown'
    const objectLabel = objectParts.slice(1).join(':') || triple.object

    // Add nodes
    if (!nodesMap.has(triple.subject)) {
      nodesMap.set(triple.subject, {
        id: triple.subject,
        type: subjectType,
        label: subjectLabel,
      })
    }

    if (!nodesMap.has(triple.object)) {
      nodesMap.set(triple.object, {
        id: triple.object,
        type: objectType,
        label: objectLabel,
      })
    }

    // Add edge
    edges.push({
      source: triple.subject,
      target: triple.object,
      label: triple.predicate,
      metadata: triple.metadata,
    })
  }

  return {
    nodes: Array.from(nodesMap.values()),
    edges,
  }
}

/**
 * Get triples grouped by predicate type for organized display
 */
export async function getTriplesByCategory(): Promise<Record<string, Triple[]>> {
  if (!graphDb || !isInitialized) {
    return {}
  }

  const allTriples = await queryTriples({})
  const categories: Record<string, Triple[]> = {}

  for (const triple of allTriples) {
    // Skip malformed triples
    if (!triple.predicate) {
      continue
    }
    if (!categories[triple.predicate]) {
      categories[triple.predicate] = []
    }
    categories[triple.predicate].push(triple)
  }

  return categories
}
