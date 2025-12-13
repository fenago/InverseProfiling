/**
 * Strategic Questioning Engine
 *
 * Implements the three-phase Active Learning Framework for accelerated profiling:
 * - Phase 1 (Diagnostic Probing): Rapidly build a broad, low-confidence profile
 * - Phase 2 (Targeted Inquiry): Increase confidence in specific, uncertain dimensions
 * - Phase 3 (Validation & Refinement): Confirm inferences and map contextual nuances
 *
 * Based on research from "Building a Digital Twin Part 3: The Active Learning Framework"
 */

import { type PsychologicalDomain, PSYCHOLOGICAL_DOMAINS, DOMAIN_CATEGORIES } from './analysis-config'
import { getDomainScoresFromHybridSignals, type DomainScore } from './sqldb'

// Question phases based on session count
export type QuestionPhase = 'diagnostic' | 'targeted' | 'validation'

// Question effectiveness tracking
export interface QuestionEffectiveness {
  questionId: string
  domain: PsychologicalDomain
  phase: QuestionPhase
  timesAsked: number
  informationGain: number // Average confidence delta after asking this question
  responseWordCount: number[] // Track response lengths
  lastAsked: Date | null
}

// Strategic question definition
export interface StrategicQuestion {
  id: string
  domain: PsychologicalDomain
  secondaryDomains?: PsychologicalDomain[] // Additional domains this question can probe
  phase: QuestionPhase
  text: string
  context?: string // Optional context for when to ask this question
  weight: number // Priority weight (higher = more likely to be asked)
}

// Question selection result
export interface QuestionSelection {
  question: StrategicQuestion
  reason: string // Why this question was selected
  targetDomains: PsychologicalDomain[]
  expectedInfoGain: number
}

/**
 * Determine the current questioning phase based on session count
 */
export function getCurrentPhase(sessionCount: number): QuestionPhase {
  if (sessionCount <= 3) {
    return 'diagnostic'
  } else if (sessionCount <= 10) {
    return 'targeted'
  } else {
    return 'validation'
  }
}

/**
 * Question pool organized by domain and phase
 * These questions are designed to elicit high-value psychological signals
 */
export const QUESTION_POOL: StrategicQuestion[] = [
  // ============================================================================
  // PHASE 1: DIAGNOSTIC PROBING QUESTIONS (Open-ended, multi-domain)
  // ============================================================================

  // Big Five: Openness
  {
    id: 'diag_openness_1',
    domain: 'big_five_openness',
    secondaryDomains: ['creativity', 'aesthetic_preferences'],
    phase: 'diagnostic',
    text: "What's a new idea or perspective you've encountered recently that you found interesting?",
    weight: 1.0,
  },
  {
    id: 'diag_openness_2',
    domain: 'big_five_openness',
    secondaryDomains: ['learning_styles', 'interests'],
    phase: 'diagnostic',
    text: "If you could learn any new skill or subject in depth, what would it be and why?",
    weight: 0.9,
  },

  // Big Five: Conscientiousness
  {
    id: 'diag_conscient_1',
    domain: 'big_five_conscientiousness',
    secondaryDomains: ['executive_functions', 'time_orientation'],
    phase: 'diagnostic',
    text: "Tell me about a recent project you were proud of. What was your role and how did you approach it?",
    weight: 1.0,
  },
  {
    id: 'diag_conscient_2',
    domain: 'big_five_conscientiousness',
    secondaryDomains: ['decision_style', 'self_efficacy'],
    phase: 'diagnostic',
    text: "How do you typically organize your work or tasks when you have multiple priorities?",
    weight: 0.85,
  },

  // Big Five: Extraversion
  {
    id: 'diag_extraver_1',
    domain: 'big_five_extraversion',
    secondaryDomains: ['communication_style', 'social_support'],
    phase: 'diagnostic',
    text: "How do you prefer to recharge after a demanding day - alone or with others?",
    weight: 1.0,
  },
  {
    id: 'diag_extraver_2',
    domain: 'big_five_extraversion',
    secondaryDomains: ['social_cognition', 'love_languages'],
    phase: 'diagnostic',
    text: "What role do social interactions play in your daily happiness and energy levels?",
    weight: 0.8,
  },

  // Big Five: Agreeableness
  {
    id: 'diag_agreeable_1',
    domain: 'big_five_agreeableness',
    secondaryDomains: ['emotional_empathy', 'moral_reasoning'],
    phase: 'diagnostic',
    text: "How do you typically handle disagreements or conflicts with people close to you?",
    weight: 1.0,
  },
  {
    id: 'diag_agreeable_2',
    domain: 'big_five_agreeableness',
    secondaryDomains: ['communication_style', 'attachment_style'],
    phase: 'diagnostic',
    text: "What's more important to you in teamwork - maintaining harmony or getting the best result?",
    weight: 0.85,
  },

  // Big Five: Neuroticism
  {
    id: 'diag_neurotic_1',
    domain: 'big_five_neuroticism',
    secondaryDomains: ['stress_coping', 'emotional_intelligence'],
    phase: 'diagnostic',
    text: "Can you describe a stressful situation and how you navigated your feelings through it?",
    weight: 1.0,
  },
  {
    id: 'diag_neurotic_2',
    domain: 'big_five_neuroticism',
    secondaryDomains: ['life_satisfaction', 'authenticity'],
    phase: 'diagnostic',
    text: "What kinds of situations tend to make you feel most anxious or uncertain?",
    weight: 0.75,
  },

  // Cognitive Style
  {
    id: 'diag_cognitive_1',
    domain: 'cognitive_abilities',
    secondaryDomains: ['information_processing', 'metacognition'],
    phase: 'diagnostic',
    text: "If you had to explain a complex topic you know well to a complete beginner, how would you start?",
    weight: 1.0,
  },
  {
    id: 'diag_cognitive_2',
    domain: 'information_processing',
    secondaryDomains: ['cognitive_abilities', 'learning_styles'],
    phase: 'diagnostic',
    text: "When tackling a new problem, do you prefer to dive into details first or understand the big picture?",
    weight: 0.9,
  },

  // Values & Motivation
  {
    id: 'diag_values_1',
    domain: 'personal_values',
    secondaryDomains: ['achievement_motivation', 'interests'],
    phase: 'diagnostic',
    text: "What do you find most energizing in your work or studies?",
    weight: 1.0,
  },
  {
    id: 'diag_values_2',
    domain: 'personal_values',
    secondaryDomains: ['moral_reasoning', 'cultural_values'],
    phase: 'diagnostic',
    text: "What principles or values do you consider non-negotiable in how you live your life?",
    weight: 0.9,
  },

  // Decision Making
  {
    id: 'diag_decision_1',
    domain: 'decision_style',
    secondaryDomains: ['risk_tolerance', 'locus_of_control'],
    phase: 'diagnostic',
    text: "When you have multiple good options, what's your typical process for making a final choice?",
    weight: 1.0,
  },
  {
    id: 'diag_decision_2',
    domain: 'risk_tolerance',
    secondaryDomains: ['decision_style', 'growth_mindset'],
    phase: 'diagnostic',
    text: "How comfortable are you taking risks when the potential rewards are high?",
    weight: 0.85,
  },

  // ============================================================================
  // PHASE 2: TARGETED INQUIRY QUESTIONS (Domain-specific, confidence building)
  // ============================================================================

  // Big Five: Openness - Targeted
  {
    id: 'target_openness_1',
    domain: 'big_five_openness',
    phase: 'targeted',
    text: "How do you typically react when someone challenges your long-held beliefs with new evidence?",
    weight: 1.0,
  },
  {
    id: 'target_openness_2',
    domain: 'big_five_openness',
    phase: 'targeted',
    text: "Do you find yourself drawn to routine and predictability, or do you seek out novel experiences?",
    weight: 0.9,
  },

  // Big Five: Conscientiousness - Targeted
  {
    id: 'target_conscient_1',
    domain: 'big_five_conscientiousness',
    phase: 'targeted',
    text: "What happens to your productivity and mood when your environment is disorganized?",
    weight: 1.0,
  },
  {
    id: 'target_conscient_2',
    domain: 'big_five_conscientiousness',
    phase: 'targeted',
    text: "How do you balance the desire to do things perfectly with the need to meet deadlines?",
    weight: 0.9,
  },

  // Big Five: Extraversion - Targeted
  {
    id: 'target_extraver_1',
    domain: 'big_five_extraversion',
    phase: 'targeted',
    text: "In group settings, do you tend to speak up first or wait to hear others' perspectives?",
    weight: 1.0,
  },
  {
    id: 'target_extraver_2',
    domain: 'big_five_extraversion',
    phase: 'targeted',
    text: "How do you feel about being the center of attention in social situations?",
    weight: 0.85,
  },

  // Big Five: Agreeableness - Targeted
  {
    id: 'target_agreeable_1',
    domain: 'big_five_agreeableness',
    phase: 'targeted',
    text: "When someone asks for a favor that would inconvenience you, how do you typically respond?",
    weight: 1.0,
  },
  {
    id: 'target_agreeable_2',
    domain: 'big_five_agreeableness',
    phase: 'targeted',
    text: "Do you find it easy or difficult to say 'no' to people, even when you should?",
    weight: 0.9,
  },

  // Big Five: Neuroticism - Targeted
  {
    id: 'target_neurotic_1',
    domain: 'big_five_neuroticism',
    phase: 'targeted',
    text: "How long does it typically take you to recover emotionally from a setback or disappointment?",
    weight: 1.0,
  },
  {
    id: 'target_neurotic_2',
    domain: 'big_five_neuroticism',
    phase: 'targeted',
    text: "Do you tend to worry about things that might go wrong, or do you generally expect things to work out?",
    weight: 0.9,
  },

  // Dark Triad - Targeted (carefully worded)
  {
    id: 'target_narciss_1',
    domain: 'dark_triad_narcissism',
    phase: 'targeted',
    text: "How important is recognition and admiration from others to your sense of self-worth?",
    weight: 0.8,
  },
  {
    id: 'target_machiavellianism_1',
    domain: 'dark_triad_machiavellianism',
    phase: 'targeted',
    text: "In your view, is it sometimes necessary to bend the rules to achieve important goals?",
    weight: 0.7,
  },
  {
    id: 'target_psychopathy_1',
    domain: 'dark_triad_psychopathy',
    phase: 'targeted',
    text: "How do you feel when you see others experiencing emotional distress or hardship?",
    weight: 0.7,
  },

  // Emotional Intelligence - Targeted
  {
    id: 'target_empathy_1',
    domain: 'emotional_empathy',
    phase: 'targeted',
    text: "When a friend is upset, what's your natural first response - to offer solutions or to listen?",
    weight: 1.0,
  },
  {
    id: 'target_ei_1',
    domain: 'emotional_intelligence',
    phase: 'targeted',
    text: "How well do you feel you understand why you react emotionally the way you do?",
    weight: 0.9,
  },

  // Attachment Style - Targeted
  {
    id: 'target_attachment_1',
    domain: 'attachment_style',
    phase: 'targeted',
    text: "In close relationships, do you tend to need more closeness or more independence?",
    weight: 1.0,
  },
  {
    id: 'target_attachment_2',
    domain: 'attachment_style',
    phase: 'targeted',
    text: "How do you feel about depending on others for emotional support?",
    weight: 0.85,
  },

  // Communication Style - Targeted
  {
    id: 'target_comm_1',
    domain: 'communication_style',
    phase: 'targeted',
    text: "Do you prefer direct, straightforward communication or more diplomatic, indirect approaches?",
    weight: 1.0,
  },

  // Time Orientation - Targeted
  {
    id: 'target_time_1',
    domain: 'time_orientation',
    phase: 'targeted',
    text: "Do you spend more mental energy thinking about the past, the present, or the future?",
    weight: 1.0,
  },

  // Growth Mindset - Targeted
  {
    id: 'target_growth_1',
    domain: 'growth_mindset',
    phase: 'targeted',
    text: "Do you believe your core abilities and intelligence can significantly change, or are they mostly fixed?",
    weight: 1.0,
  },
  {
    id: 'target_growth_2',
    domain: 'growth_mindset',
    phase: 'targeted',
    text: "How do you view failure - as evidence of limitation or as an opportunity for growth?",
    weight: 0.9,
  },

  // Locus of Control - Targeted
  {
    id: 'target_locus_1',
    domain: 'locus_of_control',
    phase: 'targeted',
    text: "Do you feel your life outcomes are primarily determined by your own actions or by external circumstances?",
    weight: 1.0,
  },

  // Self-Efficacy - Targeted
  {
    id: 'target_efficacy_1',
    domain: 'self_efficacy',
    phase: 'targeted',
    text: "When facing a challenging task, how confident are you that you can figure it out?",
    weight: 1.0,
  },

  // Learning Styles - Targeted
  {
    id: 'target_learning_1',
    domain: 'learning_styles',
    phase: 'targeted',
    text: "How do you best learn new information - through reading, listening, watching, or hands-on practice?",
    weight: 1.0,
  },

  // Metacognition - Targeted
  {
    id: 'target_meta_1',
    domain: 'metacognition',
    phase: 'targeted',
    text: "How do you know when you've truly understood a concept versus just memorized it?",
    weight: 1.0,
  },
  {
    id: 'target_meta_2',
    domain: 'metacognition',
    phase: 'targeted',
    text: "What do you do when you get stuck on a problem and your initial approach isn't working?",
    weight: 0.9,
  },

  // Creativity - Targeted
  {
    id: 'target_creative_1',
    domain: 'creativity',
    phase: 'targeted',
    text: "When brainstorming, do you prefer to generate many ideas quickly or develop a few ideas deeply?",
    weight: 1.0,
  },

  // Moral Reasoning - Targeted
  {
    id: 'target_moral_1',
    domain: 'moral_reasoning',
    phase: 'targeted',
    text: "When making ethical decisions, do you focus more on the outcomes or on following principles?",
    weight: 0.9,
  },

  // Work Style - Targeted
  {
    id: 'target_work_1',
    domain: 'work_career_style',
    phase: 'targeted',
    text: "Do you prefer working independently or as part of a collaborative team?",
    weight: 1.0,
  },

  // Sensory Processing - Targeted
  {
    id: 'target_sensory_1',
    domain: 'sensory_processing',
    phase: 'targeted',
    text: "Are you particularly sensitive to environmental factors like noise, light, or temperature?",
    weight: 0.8,
  },

  // ============================================================================
  // PHASE 3: VALIDATION & REFINEMENT QUESTIONS (Confirmatory, contextual)
  // ============================================================================

  // These questions present inferences as hypotheses for user confirmation
  // The {inference} placeholder should be replaced with actual profile data

  {
    id: 'valid_openness_1',
    domain: 'big_five_openness',
    phase: 'validation',
    text: "I've noticed you seem drawn to exploring new ideas and perspectives. Does that resonate with you?",
    weight: 1.0,
  },
  {
    id: 'valid_conscient_1',
    domain: 'big_five_conscientiousness',
    phase: 'validation',
    text: "I've noticed you seem to prefer having a clear plan before starting a task. Does that sound right to you?",
    weight: 1.0,
  },
  {
    id: 'valid_extraver_1',
    domain: 'big_five_extraversion',
    phase: 'validation',
    text: "It seems like you draw energy from social interactions. Would you say that's accurate?",
    weight: 1.0,
  },
  {
    id: 'valid_agreeable_1',
    domain: 'big_five_agreeableness',
    phase: 'validation',
    text: "You seem to prioritize maintaining positive relationships with others. Is that how you see yourself?",
    weight: 1.0,
  },
  {
    id: 'valid_neurotic_1',
    domain: 'big_five_neuroticism',
    phase: 'validation',
    text: "You appear to be someone who stays relatively calm under pressure. Does that match your experience?",
    weight: 1.0,
  },

  // Contextual mapping questions
  {
    id: 'valid_context_1',
    domain: 'big_five_extraversion',
    phase: 'validation',
    text: "You mentioned being collaborative on creative projects. Does that change when you're working on more analytical tasks?",
    context: 'After user has demonstrated collaborative behavior',
    weight: 0.9,
  },
  {
    id: 'valid_context_2',
    domain: 'big_five_conscientiousness',
    phase: 'validation',
    text: "Your approach seems very structured for work projects. Is your personal life similarly organized?",
    context: 'After user has shown organized work style',
    weight: 0.85,
  },
  {
    id: 'valid_decision_1',
    domain: 'decision_style',
    phase: 'validation',
    text: "Would you say you're generally more of a big-picture thinker or more detail-oriented?",
    weight: 1.0,
  },
  {
    id: 'valid_learning_1',
    domain: 'learning_styles',
    phase: 'validation',
    text: "Based on our conversations, you seem to prefer visual explanations. Does that match how you see yourself?",
    context: 'After user has used visual language',
    weight: 0.9,
  },
  {
    id: 'valid_values_1',
    domain: 'personal_values',
    phase: 'validation',
    text: "Achievement and personal growth seem important to you. Would you say those are core values?",
    weight: 1.0,
  },
]

// In-memory cache for domain scores (refreshed periodically)
let domainScoresCache: DomainScore[] = []
let cacheLastUpdated: Date | null = null
const CACHE_TTL_MS = 30000 // 30 second cache

/**
 * Refresh the domain scores cache from the database
 */
async function refreshDomainScoresCache(): Promise<void> {
  domainScoresCache = await getDomainScoresFromHybridSignals()
  cacheLastUpdated = new Date()
}

/**
 * Get domain scores and confidence from current profile (async)
 * Returns a map of domain -> { score, confidence }
 */
export async function getDomainConfidenceMapAsync(): Promise<Map<PsychologicalDomain, { score: number; confidence: number }>> {
  // Refresh cache if stale
  if (!cacheLastUpdated || Date.now() - cacheLastUpdated.getTime() > CACHE_TTL_MS) {
    await refreshDomainScoresCache()
  }

  const confidenceMap = new Map<PsychologicalDomain, { score: number; confidence: number }>()

  // Build map from cached domain scores
  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const domainScore = domainScoresCache.find(d => d.domainId === domain)

    if (domainScore) {
      confidenceMap.set(domain, {
        score: domainScore.score,
        confidence: domainScore.confidence,
      })
    } else {
      // Default values for domains without data
      confidenceMap.set(domain, {
        score: 0.5,
        confidence: 0.0,
      })
    }
  }

  return confidenceMap
}

/**
 * Synchronous version that uses cached data (may be stale)
 * Use getDomainConfidenceMapAsync for accurate data
 */
export function getDomainConfidenceMap(): Map<PsychologicalDomain, { score: number; confidence: number }> {
  const confidenceMap = new Map<PsychologicalDomain, { score: number; confidence: number }>()

  // Build map from cached domain scores
  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const domainScore = domainScoresCache.find(d => d.domainId === domain)

    if (domainScore) {
      confidenceMap.set(domain, {
        score: domainScore.score,
        confidence: domainScore.confidence,
      })
    } else {
      // Default values for domains without data
      confidenceMap.set(domain, {
        score: 0.5,
        confidence: 0.0,
      })
    }
  }

  return confidenceMap
}

/**
 * Find domains with the lowest confidence scores
 * These are the dimensions that need more data
 */
export function getLowestConfidenceDomains(count: number = 5): PsychologicalDomain[] {
  const confidenceMap = getDomainConfidenceMap()

  const sorted = Array.from(confidenceMap.entries())
    .sort((a, b) => a[1].confidence - b[1].confidence)
    .slice(0, count)
    .map(([domain]) => domain)

  return sorted
}

/**
 * Get questions filtered by phase and optionally by domain
 */
export function getQuestionsForPhase(
  phase: QuestionPhase,
  domains?: PsychologicalDomain[]
): StrategicQuestion[] {
  let questions = QUESTION_POOL.filter(q => q.phase === phase)

  if (domains && domains.length > 0) {
    questions = questions.filter(q =>
      domains.includes(q.domain) ||
      q.secondaryDomains?.some(d => domains.includes(d))
    )
  }

  return questions
}

/**
 * Question effectiveness tracking store (in-memory for now)
 * In production, this should be persisted to the database
 */
const questionEffectivenessCache = new Map<string, QuestionEffectiveness>()

/**
 * Update question effectiveness after receiving a response
 */
export function updateQuestionEffectiveness(
  questionId: string,
  domain: PsychologicalDomain,
  phase: QuestionPhase,
  responseWordCount: number,
  confidenceDelta: number
): void {
  const existing = questionEffectivenessCache.get(questionId)

  if (existing) {
    // Update existing stats
    existing.timesAsked += 1
    existing.responseWordCount.push(responseWordCount)
    // Calculate running average of information gain
    existing.informationGain = (
      (existing.informationGain * (existing.timesAsked - 1)) + confidenceDelta
    ) / existing.timesAsked
    existing.lastAsked = new Date()
  } else {
    // Create new entry
    questionEffectivenessCache.set(questionId, {
      questionId,
      domain,
      phase,
      timesAsked: 1,
      informationGain: confidenceDelta,
      responseWordCount: [responseWordCount],
      lastAsked: new Date(),
    })
  }
}

/**
 * Get effectiveness stats for a question
 */
export function getQuestionEffectiveness(questionId: string): QuestionEffectiveness | undefined {
  return questionEffectivenessCache.get(questionId)
}

/**
 * Select the next strategic question to ask
 * Uses the current phase, profile confidence, and question effectiveness to choose
 */
export function selectNextQuestion(
  sessionCount: number,
  recentlyAskedIds: string[] = [],
  excludeDomains: PsychologicalDomain[] = []
): QuestionSelection | null {
  const phase = getCurrentPhase(sessionCount)

  // Get available questions for this phase
  let candidates: StrategicQuestion[]

  if (phase === 'diagnostic') {
    // In diagnostic phase, use broad questions
    candidates = getQuestionsForPhase('diagnostic')
  } else if (phase === 'targeted') {
    // In targeted phase, focus on low-confidence domains
    const lowConfDomains = getLowestConfidenceDomains(5)
      .filter(d => !excludeDomains.includes(d))
    candidates = getQuestionsForPhase('targeted', lowConfDomains)

    // Fall back to diagnostic if no targeted questions available
    if (candidates.length === 0) {
      candidates = getQuestionsForPhase('diagnostic', lowConfDomains)
    }
  } else {
    // In validation phase, use validation questions
    candidates = getQuestionsForPhase('validation')

    // Fall back to targeted if no validation questions
    if (candidates.length === 0) {
      const lowConfDomains = getLowestConfidenceDomains(5)
      candidates = getQuestionsForPhase('targeted', lowConfDomains)
    }
  }

  // Filter out recently asked questions
  candidates = candidates.filter(q => !recentlyAskedIds.includes(q.id))

  // Filter out excluded domains
  if (excludeDomains.length > 0) {
    candidates = candidates.filter(q => !excludeDomains.includes(q.domain))
  }

  if (candidates.length === 0) {
    return null
  }

  // Score candidates based on weight and effectiveness
  const scored = candidates.map(q => {
    const effectiveness = getQuestionEffectiveness(q.id)

    // Base score from weight
    let score = q.weight

    // Boost for questions with proven high information gain
    if (effectiveness && effectiveness.informationGain > 0.1) {
      score *= (1 + effectiveness.informationGain)
    }

    // Slight penalty for frequently asked questions
    if (effectiveness && effectiveness.timesAsked > 3) {
      score *= 0.8
    }

    // Boost for domains with very low confidence
    const confidenceMap = getDomainConfidenceMap()
    const domainConf = confidenceMap.get(q.domain)?.confidence ?? 0
    if (domainConf < 0.3) {
      score *= 1.5
    }

    return { question: q, score }
  })

  // Sort by score and select top candidate
  scored.sort((a, b) => b.score - a.score)

  const selected = scored[0]

  // Build target domains list
  const targetDomains = [selected.question.domain]
  if (selected.question.secondaryDomains) {
    targetDomains.push(...selected.question.secondaryDomains)
  }

  // Determine selection reason
  let reason: string
  if (phase === 'diagnostic') {
    reason = 'Building initial broad profile'
  } else if (phase === 'targeted') {
    const lowConfDomains = getLowestConfidenceDomains(3)
    if (lowConfDomains.includes(selected.question.domain)) {
      reason = `Targeting low-confidence domain: ${formatDomainName(selected.question.domain)}`
    } else {
      reason = `Probing related domain: ${formatDomainName(selected.question.domain)}`
    }
  } else {
    reason = `Validating inference about: ${formatDomainName(selected.question.domain)}`
  }

  return {
    question: selected.question,
    reason,
    targetDomains: targetDomains as PsychologicalDomain[],
    expectedInfoGain: selected.score,
  }
}

/**
 * Generate a dynamic validation question based on actual profile data
 */
export function generateDynamicValidationQuestion(
  domain: PsychologicalDomain,
  score: number,
  confidence: number
): string | null {
  // Only generate validation questions for domains with medium-high confidence
  if (confidence < 0.5) {
    return null
  }

  const domainName = formatDomainName(domain)
  const isHigh = score >= 0.6
  const isLow = score <= 0.4

  // Generate validation question based on score direction
  if (domain === 'big_five_openness') {
    if (isHigh) {
      return `Based on our conversations, you seem quite open to new experiences and ideas. Does that match how you see yourself?`
    } else if (isLow) {
      return `You seem to prefer familiar approaches and established methods. Is that an accurate description?`
    }
  }

  if (domain === 'big_five_conscientiousness') {
    if (isHigh) {
      return `You appear to be quite organized and detail-oriented. Would you say that's accurate?`
    } else if (isLow) {
      return `You seem to prefer flexibility over strict planning. Does that resonate with you?`
    }
  }

  if (domain === 'big_five_extraversion') {
    if (isHigh) {
      return `You come across as someone who enjoys social interaction and being around others. Is that right?`
    } else if (isLow) {
      return `You seem to prefer quieter, more solitary activities. Would you agree?`
    }
  }

  if (domain === 'big_five_agreeableness') {
    if (isHigh) {
      return `You seem to be someone who values harmony and cooperation with others. Does that describe you?`
    } else if (isLow) {
      return `You appear to be comfortable with confrontation when necessary. Is that accurate?`
    }
  }

  if (domain === 'big_five_neuroticism') {
    if (isHigh) {
      return `You seem to be someone who feels emotions quite deeply. Does that match your experience?`
    } else if (isLow) {
      return `You come across as emotionally stable and resilient. Would you say that's true?`
    }
  }

  if (domain === 'growth_mindset') {
    if (isHigh) {
      return `You seem to believe strongly in the ability to grow and improve through effort. Is that right?`
    } else if (isLow) {
      return `You seem to view abilities as relatively fixed traits. Does that match your view?`
    }
  }

  if (domain === 'locus_of_control') {
    if (isHigh) {
      return `You seem to believe you have strong control over your life outcomes. Would you agree?`
    } else if (isLow) {
      return `You seem to feel that external factors play a large role in your life outcomes. Is that accurate?`
    }
  }

  // Generic validation question for other domains
  const direction = isHigh ? 'high' : (isLow ? 'low' : 'moderate')
  return `Based on your responses, you appear to have ${direction} ${domainName}. Does that seem accurate to you?`
}

/**
 * Format a domain ID into a human-readable name
 */
export function formatDomainName(domain: PsychologicalDomain): string {
  return domain
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace('Big Five ', '')
    .replace('Dark Triad ', '')
}

/**
 * Get category for a domain
 */
export function getDomainCategory(domain: PsychologicalDomain): string | null {
  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if ((domains as readonly PsychologicalDomain[]).includes(domain)) {
      return category
    }
  }
  return null
}

/**
 * Generate a system prompt augmentation for strategic questioning
 * This can be added to the LLM system prompt to guide question asking
 */
export function getStrategicQuestioningPrompt(sessionCount: number): string {
  const phase = getCurrentPhase(sessionCount)
  const lowConfDomains = getLowestConfidenceDomains(3)
  const lowConfNames = lowConfDomains.map(formatDomainName).join(', ')

  if (phase === 'diagnostic') {
    return `
[QUESTIONING STRATEGY: DIAGNOSTIC PHASE]
You are in the early stages of building a psychological profile. Ask open-ended questions that encourage the user to share about their:
- How they approach projects and tasks
- Their preferences for social interaction
- What energizes and motivates them
- How they handle stress and challenges
- Their values and what matters most to them

Ask naturally within the conversation flow. Don't make it feel like an interview.
`
  } else if (phase === 'targeted') {
    return `
[QUESTIONING STRATEGY: TARGETED INQUIRY]
Focus on building confidence in these specific areas: ${lowConfNames}.
Ask questions that specifically probe these dimensions. For example:
- For decision style: "When you have multiple good options, how do you typically decide?"
- For emotional style: "How do you typically process strong emotions?"
- For social style: "Do you prefer working alone or with others?"

Integrate questions naturally into the conversation.
`
  } else {
    return `
[QUESTIONING STRATEGY: VALIDATION PHASE]
You have a developing profile. Occasionally verify your understanding by:
- Presenting observations as hypotheses: "You seem to prefer X - does that resonate?"
- Exploring contextual variations: "Is your approach different in personal vs work situations?"
- Confirming key traits: "Would you describe yourself as more X or Y?"

Be collaborative and open to correction.
`
  }
}

/**
 * Async version that ensures domain scores cache is fresh before generating the prompt
 * Use this in async contexts (like system prompt generation)
 */
export async function getStrategicQuestioningPromptAsync(sessionCount: number): Promise<string> {
  // Ensure cache is fresh
  await refreshDomainScoresCache()
  return getStrategicQuestioningPrompt(sessionCount)
}

/**
 * Get all questions for a specific domain (useful for debugging/admin)
 */
export function getQuestionsForDomain(domain: PsychologicalDomain): StrategicQuestion[] {
  return QUESTION_POOL.filter(q =>
    q.domain === domain ||
    q.secondaryDomains?.includes(domain)
  )
}

/**
 * Get statistics about the question pool
 */
export function getQuestionPoolStats(): {
  totalQuestions: number
  byPhase: Record<QuestionPhase, number>
  byDomain: Partial<Record<PsychologicalDomain, number>>
  coveragePercent: number
} {
  const byPhase: Record<QuestionPhase, number> = {
    diagnostic: 0,
    targeted: 0,
    validation: 0,
  }

  const byDomain: Partial<Record<PsychologicalDomain, number>> = {}

  for (const q of QUESTION_POOL) {
    byPhase[q.phase]++
    byDomain[q.domain] = (byDomain[q.domain] || 0) + 1
  }

  const coveredDomains = Object.keys(byDomain).length
  const coveragePercent = (coveredDomains / PSYCHOLOGICAL_DOMAINS.length) * 100

  return {
    totalQuestions: QUESTION_POOL.length,
    byPhase,
    byDomain,
    coveragePercent,
  }
}
