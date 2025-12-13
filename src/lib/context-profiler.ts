/**
 * Context-Dependent Profiling System
 *
 * Psychological traits can manifest differently depending on context.
 * For example:
 * - Someone might be extraverted at work but introverted in personal settings
 * - Risk tolerance might vary between financial and social domains
 * - Communication style might change between professional and casual contexts
 *
 * This module:
 * 1. Detects conversation context from message content
 * 2. Stores context-specific domain scores
 * 3. Identifies domains that vary significantly across contexts
 * 4. Provides context-aware profile views
 */

import { getDb, scheduleSave } from './sqldb'
import type { DomainScore } from './sqldb'
import { PSYCHOLOGICAL_DOMAINS } from './analysis-config'
import type { PsychologicalDomain } from './analysis-config'

// ==================== CONTEXT TYPES ====================

/**
 * Conversation context categories
 * Based on research showing personality expression varies by situational context
 */
export const CONTEXT_TYPES = [
  'work_professional',    // Career, business, formal workplace
  'social_casual',        // Friends, casual conversations
  'personal_intimate',    // Close relationships, emotional sharing
  'creative_artistic',    // Art, music, creative expression
  'intellectual_academic', // Learning, debates, technical discussion
  'stressful_challenging', // Problems, conflicts, difficult situations
  'leisure_recreation',   // Hobbies, entertainment, relaxation
  'financial_economic',   // Money, investments, purchases
  'health_wellness',      // Physical/mental health, fitness
  'family_domestic',      // Family relationships, home life
] as const

export type ContextType = typeof CONTEXT_TYPES[number]

/**
 * Keywords and patterns for detecting context types
 */
const CONTEXT_INDICATORS: Record<ContextType, {
  keywords: string[]
  patterns: RegExp[]
  weight: number
}> = {
  work_professional: {
    keywords: [
      'work', 'job', 'boss', 'colleague', 'meeting', 'project', 'deadline',
      'client', 'manager', 'office', 'career', 'promotion', 'salary', 'interview',
      'company', 'business', 'corporate', 'professional', 'team', 'coworker',
      'presentation', 'report', 'email', 'schedule', 'performance', 'review',
    ],
    patterns: [
      /\b(my|the)\s+boss\b/i,
      /\bat\s+work\b/i,
      /\b(job|work)\s+(interview|application)\b/i,
      /\bwork(-|\s)?(life|from\s+home)\b/i,
    ],
    weight: 1.0,
  },
  social_casual: {
    keywords: [
      'friend', 'friends', 'party', 'hangout', 'fun', 'bar', 'club', 'game',
      'weekend', 'chill', 'hang', 'buddy', 'bro', 'dude', 'mate', 'crew',
      'social', 'gathering', 'event', 'concert', 'festival', 'catch up',
    ],
    patterns: [
      /\bwith\s+(my\s+)?friends\b/i,
      /\blet'?s\s+(hang|chill|go\s+out)\b/i,
      /\b(party|parties)\b/i,
    ],
    weight: 1.0,
  },
  personal_intimate: {
    keywords: [
      'love', 'relationship', 'partner', 'boyfriend', 'girlfriend', 'spouse',
      'husband', 'wife', 'dating', 'romantic', 'feelings', 'emotion', 'heart',
      'vulnerable', 'trust', 'intimate', 'personal', 'private', 'deep',
      'secret', 'confide', 'soul', 'connection', 'bond',
    ],
    patterns: [
      /\b(my|the)\s+(partner|boyfriend|girlfriend|spouse|husband|wife)\b/i,
      /\bin\s+love\b/i,
      /\b(i|we)\s+feel\b/i,
      /\bopen\s+up\b/i,
    ],
    weight: 1.2, // Higher weight for intimate contexts
  },
  creative_artistic: {
    keywords: [
      'art', 'create', 'creative', 'design', 'music', 'paint', 'draw', 'write',
      'story', 'poem', 'song', 'compose', 'imagine', 'inspiration', 'artistic',
      'craft', 'style', 'expression', 'aesthetic', 'beauty', 'photography',
      'film', 'movie', 'theater', 'dance', 'sculpt',
    ],
    patterns: [
      /\b(creative|artistic)\s+(process|expression|work)\b/i,
      /\b(writing|painting|drawing|composing)\b/i,
      /\bwork(ing)?\s+on\s+(a|my)\s+(project|piece|art|song)\b/i,
    ],
    weight: 1.0,
  },
  intellectual_academic: {
    keywords: [
      'learn', 'study', 'research', 'theory', 'concept', 'analysis', 'logic',
      'science', 'philosophy', 'debate', 'argument', 'evidence', 'academic',
      'university', 'school', 'class', 'lecture', 'professor', 'education',
      'knowledge', 'intellectual', 'think', 'reason', 'understand', 'explain',
    ],
    patterns: [
      /\bI\s+(think|believe|argue)\s+that\b/i,
      /\b(research|study)\s+(shows?|suggests?)\b/i,
      /\b(learn|study)(ing)?\s+(about|how)\b/i,
      /\baccording\s+to\b/i,
    ],
    weight: 1.0,
  },
  stressful_challenging: {
    keywords: [
      'stress', 'anxious', 'worried', 'problem', 'difficult', 'challenge',
      'struggle', 'crisis', 'conflict', 'overwhelm', 'pressure', 'deadline',
      'emergency', 'urgent', 'frustrated', 'angry', 'upset', 'fear', 'scared',
      'panic', 'nervous', 'tense', 'stuck', 'help', 'cope',
    ],
    patterns: [
      /\b(so|really|very)\s+(stressed|worried|anxious)\b/i,
      /\bcan'?t\s+(handle|cope|deal)\b/i,
      /\b(help|need)\s+(me|advice)\b/i,
      /\bI'?m\s+(struggling|overwhelmed)\b/i,
    ],
    weight: 1.3, // Higher weight for stress detection
  },
  leisure_recreation: {
    keywords: [
      'hobby', 'fun', 'relax', 'vacation', 'travel', 'game', 'sport', 'play',
      'enjoy', 'entertainment', 'movie', 'book', 'read', 'watch', 'leisure',
      'weekend', 'holiday', 'trip', 'adventure', 'explore', 'beach', 'nature',
    ],
    patterns: [
      /\b(for|just\s+for)\s+fun\b/i,
      /\bfree\s+time\b/i,
      /\b(hobby|hobbies)\b/i,
      /\b(relax|relaxing|vacation)\b/i,
    ],
    weight: 0.9,
  },
  financial_economic: {
    keywords: [
      'money', 'finance', 'invest', 'stock', 'budget', 'save', 'spend', 'cost',
      'price', 'expensive', 'cheap', 'debt', 'loan', 'mortgage', 'bank',
      'income', 'salary', 'rich', 'poor', 'afford', 'economy', 'market',
      'crypto', 'bitcoin', 'retirement', 'savings',
    ],
    patterns: [
      /\$\d+/,
      /\b(save|spend|invest)\s+(money|time)\b/i,
      /\b(afford|cost|price)\b/i,
      /\bfinancial(ly)?\b/i,
    ],
    weight: 1.0,
  },
  health_wellness: {
    keywords: [
      'health', 'doctor', 'medical', 'exercise', 'diet', 'sleep', 'fitness',
      'mental', 'therapy', 'therapist', 'medication', 'sick', 'pain', 'tired',
      'energy', 'weight', 'gym', 'workout', 'nutrition', 'wellness', 'mindful',
      'meditation', 'yoga', 'stress', 'anxiety', 'depression',
    ],
    patterns: [
      /\b(feel|feeling)\s+(sick|tired|unwell)\b/i,
      /\b(mental|physical)\s+health\b/i,
      /\b(doctor|therapist)\s*(appointment|visit)?\b/i,
      /\b(work\s*out|exercise|gym)\b/i,
    ],
    weight: 1.1,
  },
  family_domestic: {
    keywords: [
      'family', 'parent', 'mother', 'father', 'mom', 'dad', 'child', 'kid',
      'son', 'daughter', 'sibling', 'brother', 'sister', 'home', 'house',
      'household', 'domestic', 'chore', 'cook', 'clean', 'pet', 'dog', 'cat',
      'relative', 'grandparent', 'aunt', 'uncle', 'cousin',
    ],
    patterns: [
      /\b(my|the)\s+(family|parents?|mom|dad|kids?|children)\b/i,
      /\bat\s+home\b/i,
      /\b(brother|sister|sibling)s?\b/i,
    ],
    weight: 1.0,
  },
}

// ==================== CONTEXT DETECTION ====================

export interface ContextDetectionResult {
  primaryContext: ContextType
  contextScores: Record<ContextType, number>
  confidence: number
  detectedKeywords: string[]
  detectedPatterns: string[]
}

/**
 * Detect the context of a message
 */
export function detectContext(text: string): ContextDetectionResult {
  const scores: Record<ContextType, number> = {} as Record<ContextType, number>
  const detectedKeywords: string[] = []
  const detectedPatterns: string[] = []

  const words = text.toLowerCase().split(/\s+/)

  // Initialize scores
  for (const context of CONTEXT_TYPES) {
    scores[context] = 0
  }

  // Score each context type
  for (const [contextType, indicators] of Object.entries(CONTEXT_INDICATORS)) {
    const context = contextType as ContextType

    // Check keywords
    for (const keyword of indicators.keywords) {
      if (words.includes(keyword.toLowerCase())) {
        scores[context] += 1 * indicators.weight
        detectedKeywords.push(keyword)
      }
    }

    // Check patterns
    for (const pattern of indicators.patterns) {
      if (pattern.test(text)) {
        scores[context] += 2 * indicators.weight // Patterns worth more
        detectedPatterns.push(pattern.toString())
      }
    }
  }

  // Find primary context
  let primaryContext: ContextType = 'social_casual' // Default
  let maxScore = 0
  let totalScore = 0

  for (const [context, score] of Object.entries(scores)) {
    totalScore += score
    if (score > maxScore) {
      maxScore = score
      primaryContext = context as ContextType
    }
  }

  // Calculate confidence
  const confidence = totalScore > 0 ? Math.min(1.0, maxScore / (totalScore * 0.5)) : 0.3

  return {
    primaryContext,
    contextScores: scores,
    confidence,
    detectedKeywords: [...new Set(detectedKeywords)],
    detectedPatterns: [...new Set(detectedPatterns)],
  }
}

/**
 * Detect context from multiple messages (more reliable)
 */
export function detectContextFromMessages(messages: string[]): ContextDetectionResult {
  // Aggregate scores from all messages
  const aggregatedScores: Record<ContextType, number> = {} as Record<ContextType, number>
  const allKeywords: string[] = []
  const allPatterns: string[] = []

  for (const context of CONTEXT_TYPES) {
    aggregatedScores[context] = 0
  }

  for (const message of messages) {
    const result = detectContext(message)
    for (const [context, score] of Object.entries(result.contextScores)) {
      aggregatedScores[context as ContextType] += score
    }
    allKeywords.push(...result.detectedKeywords)
    allPatterns.push(...result.detectedPatterns)
  }

  // Find primary context from aggregated scores
  let primaryContext: ContextType = 'social_casual'
  let maxScore = 0
  let totalScore = 0

  for (const [context, score] of Object.entries(aggregatedScores)) {
    totalScore += score
    if (score > maxScore) {
      maxScore = score
      primaryContext = context as ContextType
    }
  }

  const confidence = totalScore > 0 ? Math.min(1.0, maxScore / (totalScore * 0.4)) : 0.3

  return {
    primaryContext,
    contextScores: aggregatedScores,
    confidence,
    detectedKeywords: [...new Set(allKeywords)],
    detectedPatterns: [...new Set(allPatterns)],
  }
}

// ==================== DATABASE OPERATIONS ====================

export interface ContextDomainScore {
  domainId: PsychologicalDomain
  contextType: ContextType
  score: number
  confidence: number
  dataPointsCount: number
  lastUpdated: string
}

export interface ContextVariation {
  domainId: PsychologicalDomain
  domainName: string
  overallScore: number
  contextScores: Record<ContextType, number>
  variationScore: number // Standard deviation across contexts
  highestContext: ContextType
  lowestContext: ContextType
  significantVariation: boolean // True if variation is meaningful
}

/**
 * Initialize context-dependent profiling tables
 */
export async function initContextTables(): Promise<void> {
  const database = await getDb()

  // Context-specific domain scores
  database.run(`
    CREATE TABLE IF NOT EXISTS context_domain_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id TEXT NOT NULL,
      context_type TEXT NOT NULL,
      score REAL NOT NULL DEFAULT 0.5,
      confidence REAL NOT NULL DEFAULT 0.0,
      data_points_count INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now')),
      UNIQUE(domain_id, context_type)
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_context_domain_scores_domain ON context_domain_scores(domain_id)')
  database.run('CREATE INDEX IF NOT EXISTS idx_context_domain_scores_context ON context_domain_scores(context_type)')

  // Context detection history (for learning and debugging)
  database.run(`
    CREATE TABLE IF NOT EXISTS context_detection_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT,
      session_id TEXT,
      detected_context TEXT NOT NULL,
      confidence REAL NOT NULL,
      context_scores TEXT,
      detected_keywords TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_context_history_context ON context_detection_history(detected_context)')
  database.run('CREATE INDEX IF NOT EXISTS idx_context_history_time ON context_detection_history(timestamp)')

  // Initialize context scores for all domains and contexts
  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    for (const context of CONTEXT_TYPES) {
      database.run(
        `INSERT OR IGNORE INTO context_domain_scores (domain_id, context_type, score, confidence)
         VALUES (?, ?, 0.5, 0.0)`,
        [domain, context]
      )
    }
  }

  scheduleSave()
  console.log('Context-dependent profiling tables initialized')
}

/**
 * Save a context detection result
 */
export async function saveContextDetection(
  messageId: string | undefined,
  sessionId: string | undefined,
  result: ContextDetectionResult
): Promise<void> {
  const database = await getDb()

  database.run(
    `INSERT INTO context_detection_history
     (message_id, session_id, detected_context, confidence, context_scores, detected_keywords)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      messageId ?? null,
      sessionId ?? null,
      result.primaryContext,
      result.confidence,
      JSON.stringify(result.contextScores),
      JSON.stringify(result.detectedKeywords),
    ]
  )
  scheduleSave()
}

/**
 * Update domain score for a specific context
 */
export async function updateContextDomainScore(
  domainId: PsychologicalDomain,
  contextType: ContextType,
  newScore: number,
  newDataPoints: number
): Promise<void> {
  if (newDataPoints <= 0) return

  const database = await getDb()

  // Get current values
  const result = database.exec(
    `SELECT score, data_points_count FROM context_domain_scores
     WHERE domain_id = ? AND context_type = ?`,
    [domainId, contextType]
  )

  let finalScore = newScore
  let totalDataPoints = newDataPoints

  if (result.length && result[0].values.length) {
    const [currentScore, currentDataPoints] = result[0].values[0] as [number, number]

    if (currentDataPoints > 0) {
      // Weighted average
      const totalWeight = currentDataPoints + newDataPoints
      finalScore = (currentScore * currentDataPoints + newScore * newDataPoints) / totalWeight
      totalDataPoints = currentDataPoints + newDataPoints
    }
  }

  // Update confidence based on data points
  const confidence = Math.min(1.0, Math.log10(totalDataPoints + 1) / 2)

  database.run(
    `INSERT INTO context_domain_scores (domain_id, context_type, score, confidence, data_points_count, last_updated)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(domain_id, context_type)
     DO UPDATE SET score = ?, confidence = ?, data_points_count = ?, last_updated = datetime('now')`,
    [domainId, contextType, finalScore, confidence, totalDataPoints,
     finalScore, confidence, totalDataPoints]
  )
  scheduleSave()
}

/**
 * Get all domain scores for a specific context
 */
export async function getContextDomainScores(contextType: ContextType): Promise<ContextDomainScore[]> {
  const database = await getDb()

  const results = database.exec(
    `SELECT domain_id, context_type, score, confidence, data_points_count, last_updated
     FROM context_domain_scores
     WHERE context_type = ?
     ORDER BY domain_id`,
    [contextType]
  )

  if (!results.length) return []

  return results[0].values.map(row => ({
    domainId: row[0] as PsychologicalDomain,
    contextType: row[1] as ContextType,
    score: row[2] as number,
    confidence: row[3] as number,
    dataPointsCount: row[4] as number,
    lastUpdated: row[5] as string,
  }))
}

/**
 * Get domain scores across all contexts for a specific domain
 */
export async function getDomainAcrossContexts(domainId: PsychologicalDomain): Promise<ContextDomainScore[]> {
  const database = await getDb()

  const results = database.exec(
    `SELECT domain_id, context_type, score, confidence, data_points_count, last_updated
     FROM context_domain_scores
     WHERE domain_id = ?
     ORDER BY context_type`,
    [domainId]
  )

  if (!results.length) return []

  return results[0].values.map(row => ({
    domainId: row[0] as PsychologicalDomain,
    contextType: row[1] as ContextType,
    score: row[2] as number,
    confidence: row[3] as number,
    dataPointsCount: row[4] as number,
    lastUpdated: row[5] as string,
  }))
}

/**
 * Get all context-specific scores
 */
export async function getAllContextScores(): Promise<Record<ContextType, ContextDomainScore[]>> {
  const database = await getDb()

  const results = database.exec(`
    SELECT domain_id, context_type, score, confidence, data_points_count, last_updated
    FROM context_domain_scores
    WHERE data_points_count > 0
    ORDER BY context_type, domain_id
  `)

  const grouped: Record<ContextType, ContextDomainScore[]> = {} as Record<ContextType, ContextDomainScore[]>
  for (const context of CONTEXT_TYPES) {
    grouped[context] = []
  }

  if (results.length && results[0].values.length) {
    for (const row of results[0].values) {
      const score: ContextDomainScore = {
        domainId: row[0] as PsychologicalDomain,
        contextType: row[1] as ContextType,
        score: row[2] as number,
        confidence: row[3] as number,
        dataPointsCount: row[4] as number,
        lastUpdated: row[5] as string,
      }
      grouped[score.contextType].push(score)
    }
  }

  return grouped
}

// ==================== CONTEXT VARIATION ANALYSIS ====================

/**
 * Human-readable domain names
 */
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
  interests: 'Interests',
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

/**
 * Calculate context variation for all domains
 * Identifies which traits vary most across different contexts
 */
export async function analyzeContextVariations(): Promise<ContextVariation[]> {
  const database = await getDb()
  const variations: ContextVariation[] = []

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const results = database.exec(
      `SELECT context_type, score, confidence, data_points_count
       FROM context_domain_scores
       WHERE domain_id = ? AND data_points_count > 0`,
      [domain]
    )

    if (!results.length || results[0].values.length < 2) {
      // Need at least 2 contexts to calculate variation
      continue
    }

    const contextScores: Record<ContextType, number> = {} as Record<ContextType, number>
    const scores: number[] = []
    let weightedSum = 0
    let totalWeight = 0
    let highestScore = 0
    let lowestScore = 1
    let highestContext: ContextType = 'social_casual'
    let lowestContext: ContextType = 'social_casual'

    for (const row of results[0].values) {
      const context = row[0] as ContextType
      const score = row[1] as number
      const confidence = row[2] as number
      const dataPoints = row[3] as number

      contextScores[context] = score
      scores.push(score)

      // Weighted average for overall score
      const weight = confidence * dataPoints
      weightedSum += score * weight
      totalWeight += weight

      if (score > highestScore) {
        highestScore = score
        highestContext = context
      }
      if (score < lowestScore) {
        lowestScore = score
        lowestContext = context
      }
    }

    // Calculate overall score
    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5

    // Calculate standard deviation (variation score)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const squaredDiffs = scores.map(s => Math.pow(s - mean, 2))
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length
    const variationScore = Math.sqrt(variance)

    // Significant variation threshold: > 0.1 (10% standard deviation)
    const significantVariation = variationScore > 0.1

    variations.push({
      domainId: domain,
      domainName: DOMAIN_DISPLAY_NAMES[domain],
      overallScore,
      contextScores,
      variationScore,
      highestContext,
      lowestContext,
      significantVariation,
    })
  }

  // Sort by variation score (most variable first)
  variations.sort((a, b) => b.variationScore - a.variationScore)

  return variations
}

/**
 * Get domains with significant context-dependent variation
 */
export async function getContextDependentDomains(): Promise<ContextVariation[]> {
  const all = await analyzeContextVariations()
  return all.filter(v => v.significantVariation)
}

/**
 * Get a context-filtered profile (only domains relevant to that context)
 */
export async function getContextualProfile(contextType: ContextType): Promise<DomainScore[]> {
  const contextScores = await getContextDomainScores(contextType)

  return contextScores
    .filter(cs => cs.dataPointsCount > 0)
    .map(cs => ({
      domainId: cs.domainId,
      category: getDomainCategory(cs.domainId),
      score: cs.score,
      confidence: cs.confidence,
      dataPointsCount: cs.dataPointsCount,
      lastUpdated: cs.lastUpdated,
    }))
}

/**
 * Get domain category from domain ID
 */
function getDomainCategory(domainId: PsychologicalDomain): string {
  const categories: Record<string, PsychologicalDomain[]> = {
    'Core Personality (Big Five)': ['big_five_openness', 'big_five_conscientiousness', 'big_five_extraversion', 'big_five_agreeableness', 'big_five_neuroticism'],
    'Dark Personality': ['dark_triad_narcissism', 'dark_triad_machiavellianism', 'dark_triad_psychopathy'],
    'Emotional/Social Intelligence': ['emotional_empathy', 'emotional_intelligence', 'attachment_style', 'love_languages', 'communication_style'],
    'Decision Making & Motivation': ['risk_tolerance', 'decision_style', 'time_orientation', 'achievement_motivation', 'self_efficacy', 'locus_of_control', 'growth_mindset'],
    'Values & Wellbeing': ['personal_values', 'interests', 'life_satisfaction', 'stress_coping', 'social_support', 'authenticity'],
    'Cognitive/Learning': ['cognitive_abilities', 'creativity', 'learning_styles', 'information_processing', 'metacognition', 'executive_functions'],
    'Social/Cultural/Values': ['social_cognition', 'political_ideology', 'cultural_values', 'moral_reasoning', 'work_career_style'],
    'Sensory/Aesthetic': ['sensory_processing', 'aesthetic_preferences'],
  }

  for (const [category, domains] of Object.entries(categories)) {
    if (domains.includes(domainId)) {
      return category
    }
  }
  return 'Unknown'
}

// ==================== CONTEXT HISTORY & INSIGHTS ====================

export interface ContextInsight {
  domain: PsychologicalDomain
  domainName: string
  insight: string
  highContext: ContextType
  lowContext: ContextType
  difference: number
}

/**
 * Generate insights about context-dependent traits
 */
export async function generateContextInsights(): Promise<ContextInsight[]> {
  const variations = await getContextDependentDomains()
  const insights: ContextInsight[] = []

  for (const variation of variations) {
    const highScore = variation.contextScores[variation.highestContext] || 0.5
    const lowScore = variation.contextScores[variation.lowestContext] || 0.5
    const difference = highScore - lowScore

    let insight = ''

    // Generate contextual insight based on domain
    switch (variation.domainId) {
      case 'big_five_extraversion':
        insight = `You tend to be more extraverted in ${formatContextName(variation.highestContext)} situations (${(highScore * 100).toFixed(0)}%) compared to ${formatContextName(variation.lowestContext)} contexts (${(lowScore * 100).toFixed(0)}%).`
        break
      case 'risk_tolerance':
        insight = `Your risk tolerance varies significantly: higher in ${formatContextName(variation.highestContext)} (${(highScore * 100).toFixed(0)}%) and lower in ${formatContextName(variation.lowestContext)} (${(lowScore * 100).toFixed(0)}%).`
        break
      case 'communication_style':
        insight = `Your communication style adapts to context: more ${highScore > 0.5 ? 'direct' : 'indirect'} in ${formatContextName(variation.highestContext)} vs ${formatContextName(variation.lowestContext)} situations.`
        break
      default:
        insight = `Your ${variation.domainName.toLowerCase()} varies across contexts: ${(highScore * 100).toFixed(0)}% in ${formatContextName(variation.highestContext)} vs ${(lowScore * 100).toFixed(0)}% in ${formatContextName(variation.lowestContext)}.`
    }

    insights.push({
      domain: variation.domainId,
      domainName: variation.domainName,
      insight,
      highContext: variation.highestContext,
      lowContext: variation.lowestContext,
      difference,
    })
  }

  return insights
}

/**
 * Format context type for display
 */
export function formatContextName(context: ContextType): string {
  const names: Record<ContextType, string> = {
    work_professional: 'work/professional',
    social_casual: 'social/casual',
    personal_intimate: 'personal/intimate',
    creative_artistic: 'creative/artistic',
    intellectual_academic: 'intellectual/academic',
    stressful_challenging: 'stressful/challenging',
    leisure_recreation: 'leisure/recreational',
    financial_economic: 'financial/economic',
    health_wellness: 'health/wellness',
    family_domestic: 'family/domestic',
  }
  return names[context] || context
}

/**
 * Get context detection statistics
 */
export async function getContextStatistics(): Promise<{
  totalDetections: number
  contextDistribution: Record<ContextType, number>
  averageConfidence: number
  mostCommonContext: ContextType
}> {
  const database = await getDb()

  const results = database.exec(`
    SELECT detected_context, COUNT(*) as count, AVG(confidence) as avg_conf
    FROM context_detection_history
    GROUP BY detected_context
  `)

  const distribution: Record<ContextType, number> = {} as Record<ContextType, number>
  for (const context of CONTEXT_TYPES) {
    distribution[context] = 0
  }

  let totalDetections = 0
  let totalConfidence = 0
  let maxCount = 0
  let mostCommonContext: ContextType = 'social_casual'

  if (results.length && results[0].values.length) {
    for (const row of results[0].values) {
      const context = row[0] as ContextType
      const count = row[1] as number
      const avgConf = row[2] as number

      distribution[context] = count
      totalDetections += count
      totalConfidence += avgConf * count

      if (count > maxCount) {
        maxCount = count
        mostCommonContext = context
      }
    }
  }

  return {
    totalDetections,
    contextDistribution: distribution,
    averageConfidence: totalDetections > 0 ? totalConfidence / totalDetections : 0,
    mostCommonContext,
  }
}

// ==================== INTEGRATION HELPERS ====================

/**
 * Process a message with context-aware profiling
 * Call this from the chat analysis pipeline
 */
export async function processMessageWithContext(
  messageId: string | undefined,
  sessionId: string | undefined,
  messageText: string,
  domainScores: Array<{ domainId: PsychologicalDomain; score: number; dataPoints: number }>
): Promise<ContextDetectionResult> {
  // Ensure tables exist
  await initContextTables()

  // Detect context
  const contextResult = detectContext(messageText)

  // Save detection history
  await saveContextDetection(messageId, sessionId, contextResult)

  // Update context-specific domain scores
  if (contextResult.confidence > 0.3) {
    for (const { domainId, score, dataPoints } of domainScores) {
      await updateContextDomainScore(
        domainId,
        contextResult.primaryContext,
        score,
        dataPoints
      )
    }
  }

  return contextResult
}

/**
 * Debug function for browser console
 */
export async function debugContextProfiling(): Promise<{
  variations: ContextVariation[]
  insights: ContextInsight[]
  statistics: Awaited<ReturnType<typeof getContextStatistics>>
}> {
  const variations = await analyzeContextVariations()
  const insights = await generateContextInsights()
  const statistics = await getContextStatistics()

  console.log('=== Context-Dependent Profiling Debug ===')
  console.log('\nContext Variations (sorted by variance):')
  for (const v of variations.slice(0, 10)) {
    console.log(`  ${v.domainName}: σ=${v.variationScore.toFixed(3)} (${v.significantVariation ? 'SIGNIFICANT' : 'stable'})`)
    console.log(`    Highest: ${v.highestContext} (${(v.contextScores[v.highestContext] * 100).toFixed(0)}%)`)
    console.log(`    Lowest: ${v.lowestContext} (${(v.contextScores[v.lowestContext] * 100).toFixed(0)}%)`)
  }

  console.log('\nContext Insights:')
  for (const i of insights) {
    console.log(`  ${i.insight}`)
  }

  console.log('\nContext Statistics:')
  console.log(`  Total detections: ${statistics.totalDetections}`)
  console.log(`  Most common: ${statistics.mostCommonContext}`)
  console.log(`  Average confidence: ${(statistics.averageConfidence * 100).toFixed(1)}%`)

  return { variations, insights, statistics }
}

// Expose to browser console for debugging
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).debugContextProfiling = debugContextProfiling
}
