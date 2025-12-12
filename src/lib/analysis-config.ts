/**
 * Hybrid Analysis Configuration
 * Configuration constants for the three-signal psychometric analysis system:
 * - LIWC (word matching) - fast baseline
 * - Embeddings (semantic similarity) - medium reliability
 * - LLM (deep analysis) - highest reliability
 */

export interface AnalysisWeights {
  liwc: number
  embedding: number
  llm: number
}

export interface AnalysisConfig {
  // LLM batch analysis settings
  llmBatchSize: number           // Number of messages before triggering LLM analysis
  llmBatchTimeout: number        // Max milliseconds between LLM analyses
  llmEnabled: boolean            // Toggle LLM analysis (for development/testing)

  // Embedding settings
  embeddingThreshold: number     // Minimum similarity score to count as match (0-1)
  embeddingEnabled: boolean      // Toggle embedding analysis

  // Signal weights (should sum to 1.0 when all signals available)
  weights: AnalysisWeights

  // Fallback weights when LLM not available
  fallbackWeights: {
    liwc: number
    embedding: number
  }

  // Confidence thresholds
  minConfidenceThreshold: number // Minimum confidence to include signal
  highConfidenceThreshold: number // Threshold for high-confidence signals
}

export const ANALYSIS_CONFIG: AnalysisConfig = {
  // LLM batch analysis - run every 5 messages or 5 minutes
  llmBatchSize: 5,
  llmBatchTimeout: 5 * 60 * 1000, // 5 minutes in milliseconds
  llmEnabled: true,

  // Embedding similarity settings
  embeddingThreshold: 0.55, // Cosine similarity threshold
  embeddingEnabled: true,

  // Default weights when all three signals available
  weights: {
    liwc: 0.2,      // Fast but limited (word matching only)
    embedding: 0.3,  // Medium reliability (semantic similarity)
    llm: 0.5,        // Highest reliability (full semantic understanding)
  },

  // Weights when LLM hasn't run yet (no LLM signal)
  fallbackWeights: {
    liwc: 0.4,
    embedding: 0.6,
  },

  // Confidence thresholds
  minConfidenceThreshold: 0.1,   // Ignore signals below this confidence
  highConfidenceThreshold: 0.7,  // Boost weight for high-confidence signals
}

/**
 * Dynamically compute weights based on available signals
 */
export function computeEffectiveWeights(
  hasLiwc: boolean,
  hasEmbedding: boolean,
  hasLlm: boolean,
  config: AnalysisConfig = ANALYSIS_CONFIG
): AnalysisWeights {
  const available: (keyof AnalysisWeights)[] = []

  if (hasLiwc) available.push('liwc')
  if (hasEmbedding) available.push('embedding')
  if (hasLlm) available.push('llm')

  if (available.length === 0) {
    return { liwc: 0, embedding: 0, llm: 0 }
  }

  // All three signals available - use configured weights
  if (available.length === 3) {
    return { ...config.weights }
  }

  // Only LIWC + Embedding (LLM not run yet)
  if (hasLiwc && hasEmbedding && !hasLlm) {
    return {
      liwc: config.fallbackWeights.liwc,
      embedding: config.fallbackWeights.embedding,
      llm: 0,
    }
  }

  // Single signal - use 100% of that signal
  if (available.length === 1) {
    return {
      liwc: hasLiwc ? 1 : 0,
      embedding: hasEmbedding ? 1 : 0,
      llm: hasLlm ? 1 : 0,
    }
  }

  // Two signals (not LIWC+Embedding case handled above)
  // Normalize remaining weights
  let totalWeight = 0
  const result: AnalysisWeights = { liwc: 0, embedding: 0, llm: 0 }

  for (const signal of available) {
    result[signal] = config.weights[signal]
    totalWeight += config.weights[signal]
  }

  // Normalize to sum to 1
  if (totalWeight > 0) {
    for (const signal of available) {
      result[signal] /= totalWeight
    }
  }

  return result
}

/**
 * List of all 39 psychological domains from Fine-Tuned-Psychometrics.md PRD
 * These match exactly the domain IDs defined in the research specification
 */
export const PSYCHOLOGICAL_DOMAINS = [
  // Category A: Core Personality (Domains 1-5) - Big Five
  'big_five_openness',           // Domain 1
  'big_five_conscientiousness',  // Domain 2
  'big_five_extraversion',       // Domain 3
  'big_five_agreeableness',      // Domain 4
  'big_five_neuroticism',        // Domain 5

  // Category B: Dark Personality (Domains 6-8)
  'dark_triad_narcissism',       // Domain 6
  'dark_triad_machiavellianism', // Domain 7
  'dark_triad_psychopathy',      // Domain 8

  // Category C: Emotional/Social Intelligence (Domains 9-13)
  'emotional_empathy',           // Domain 9 (Empathy Quotient)
  'emotional_intelligence',      // Domain 10 (MSCEIT)
  'attachment_style',            // Domain 11 (ECR-R)
  'love_languages',              // Domain 12 (5 Love Languages)
  'communication_style',         // Domain 13 (DISC)

  // Category D: Decision Making & Motivation (Domains 14-20)
  'risk_tolerance',              // Domain 14 (DOSPERT)
  'decision_style',              // Domain 15 (Rational vs Intuitive)
  'time_orientation',            // Domain 16 (ZTPI)
  'achievement_motivation',      // Domain 17 (nAch)
  'self_efficacy',               // Domain 18 (GSE)
  'locus_of_control',            // Domain 19 (Rotter)
  'growth_mindset',              // Domain 20 (Dweck)

  // Category E: Values & Wellbeing (Domains 21-26)
  'personal_values',             // Domain 21 (Schwartz PVQ - 10 values as facets)
  'interests',                   // Domain 22 (RIASEC/Holland Codes)
  'life_satisfaction',           // Domain 23 (SWLS)
  'stress_coping',               // Domain 24 (COPE/Brief COPE)
  'social_support',              // Domain 25 (MSPSS)
  'authenticity',                // Domain 26 (Authenticity Scale)

  // Category F: Cognitive/Learning (Domains 27-32)
  'cognitive_abilities',         // Domain 27 (Verbal, Numerical, Spatial)
  'creativity',                  // Domain 28 (CAQ/Divergent Thinking)
  'learning_styles',             // Domain 29 (VARK)
  'information_processing',      // Domain 30 (Deep vs Shallow)
  'metacognition',               // Domain 31 (MAI)
  'executive_functions',         // Domain 32 (BRIEF/Miyake Model)

  // Category G: Social/Cultural/Values (Domains 33-37)
  'social_cognition',            // Domain 33 (Theory of Mind/RMET)
  'political_ideology',          // Domain 34 (MFQ/Political Compass)
  'cultural_values',             // Domain 35 (Hofstede Dimensions)
  'moral_reasoning',             // Domain 36 (DIT-2/MFQ)
  'work_career_style',           // Domain 37 (Career Anchors)

  // Category H: Sensory/Aesthetic (Domains 38-39)
  'sensory_processing',          // Domain 38 (HSP Scale)
  'aesthetic_preferences',       // Domain 39 (Aesthetic Fluency)
] as const

export type PsychologicalDomain = typeof PSYCHOLOGICAL_DOMAINS[number]

/**
 * Domain categories for grouping (matches PRD categories)
 */
export const DOMAIN_CATEGORIES: Record<string, PsychologicalDomain[]> = {
  'Core Personality (Big Five)': [
    'big_five_openness',
    'big_five_conscientiousness',
    'big_five_extraversion',
    'big_five_agreeableness',
    'big_five_neuroticism',
  ],
  'Dark Personality': [
    'dark_triad_narcissism',
    'dark_triad_machiavellianism',
    'dark_triad_psychopathy',
  ],
  'Emotional/Social Intelligence': [
    'emotional_empathy',
    'emotional_intelligence',
    'attachment_style',
    'love_languages',
    'communication_style',
  ],
  'Decision Making & Motivation': [
    'risk_tolerance',
    'decision_style',
    'time_orientation',
    'achievement_motivation',
    'self_efficacy',
    'locus_of_control',
    'growth_mindset',
  ],
  'Values & Wellbeing': [
    'personal_values',
    'interests',
    'life_satisfaction',
    'stress_coping',
    'social_support',
    'authenticity',
  ],
  'Cognitive/Learning': [
    'cognitive_abilities',
    'creativity',
    'learning_styles',
    'information_processing',
    'metacognition',
    'executive_functions',
  ],
  'Social/Cultural/Values': [
    'social_cognition',
    'political_ideology',
    'cultural_values',
    'moral_reasoning',
    'work_career_style',
  ],
  'Sensory/Aesthetic': [
    'sensory_processing',
    'aesthetic_preferences',
  ],
}
