/**
 * Adaptive Learning Engine
 * Phase 3: Implements Zone of Proximal Development (ZPD) assessment,
 * knowledge gap identification, content difficulty adaptation,
 * learning style matching, scaffolded explanations, and spaced repetition
 */

import {
  type KnowledgeState,
  type KnowledgeGap,
  type LearningPreference as _LearningPreference,
  type ConceptPrerequisite as _ConceptPrerequisite,
  getOrCreateKnowledgeState,
  getAllKnowledgeStates,
  getKnowledgeStatesByCategory,
  updateKnowledgeMastery,
  getConceptsDueForReview,
  recordLearningProgress,
  getConceptPerformanceStats,
  recordKnowledgeGap,
  getUnaddressedKnowledgeGaps,
  markKnowledgeGapAddressed,
  logLearningEvent,
  updateLearningPreference,
  getEffectiveLearningPreference,
  addConceptPrerequisite,
  getConceptPrerequisites,
  arePrerequisitesMet,
} from './sqldb'

import {
  PSYCHOLOGICAL_DOMAINS,
  DOMAIN_CATEGORIES,
  type PsychologicalDomain,
} from './analysis-config'

// =============================================================================
// Types
// =============================================================================

export interface ZPDAssessment {
  conceptId: string
  currentMastery: number
  zpdLower: number
  zpdUpper: number
  optimalDifficulty: number
  readinessScore: number
  recommendation: 'review' | 'practice' | 'advance' | 'consolidate'
}

export interface KnowledgeGapAnalysis {
  conceptId: string
  gapType: 'foundational' | 'connecting' | 'advanced' | 'misconception'
  severityLevel: 'low' | 'medium' | 'high' | 'critical'
  description: string
  suggestedRemediation: string[]
  prerequisitesNeeded: string[]
}

export interface AdaptedContent {
  conceptId: string
  difficulty: number
  scaffoldingLevel: number // 0=none, 1=hints, 2=guided, 3=full support
  learningStyleAdaptations: {
    visual?: string
    auditory?: string
    reading?: string
    kinesthetic?: string
  }
  contentVariant: 'simplified' | 'standard' | 'enriched'
  estimatedTimeMinutes: number
}

export interface ScaffoldedExplanation {
  conceptId: string
  concept: string
  levels: {
    simple: string
    detailed: string
    technical: string
  }
  analogies: string[]
  examples: string[]
  visualAids: string[]
  practiceQuestions: string[]
  commonMisconceptions: string[]
}

export interface LearningRecommendation {
  conceptId: string
  priority: number
  action: 'learn' | 'review' | 'practice' | 'deepen'
  reason: string
  estimatedBenefit: number
  prerequisites: string[]
  isDueForReview: boolean
  lastActivity?: Date
}

export interface LearningSession {
  sessionId: string
  startTime: Date
  concepts: string[]
  objectives: string[]
  preferredStyle: string
  targetDifficulty: number
}

// Helper to get domain name from domain ID
function getDomainName(domainId: string): string {
  return domainId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Helper to get domain category
function getDomainCategory(domainId: string): string {
  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.includes(domainId as PsychologicalDomain)) {
      return category
    }
  }
  return 'General'
}

// =============================================================================
// ZPD Assessment Engine
// =============================================================================

/**
 * Calculate Zone of Proximal Development for a domain
 * ZPD = range where learning is optimally challenging
 */
export async function assessZPD(domainId: string): Promise<ZPDAssessment> {
  const state = await getOrCreateKnowledgeState(
    domainId,
    getDomainName(domainId),
    getDomainCategory(domainId)
  )

  // ZPD formula: based on current mastery and performance history
  // Lower bound: slightly below mastery (comfort zone edge)
  // Upper bound: where assistance is needed but progress is possible
  const confidenceEstimate = state.timesPracticed > 0
    ? state.timesCorrect / state.timesPracticed
    : 0.5
  const zpdWidth = 0.15 + (confidenceEstimate * 0.1) // Higher confidence = wider ZPD
  const zpdLower = Math.max(0, state.masteryLevel - zpdWidth * 0.3)
  const zpdUpper = Math.min(1, state.masteryLevel + zpdWidth * 0.7)

  // Optimal difficulty: slightly above current mastery (Vygotsky's principle)
  const optimalDifficulty = state.masteryLevel + (zpdWidth * 0.4)

  // Readiness score: combination of prerequisites, confidence, and recent performance
  const prereqCheck = await arePrerequisitesMet(domainId)
  const performanceStats = await getConceptPerformanceStats(domainId)

  let readinessScore = prereqCheck.met ? 0.5 : 0.2
  readinessScore += confidenceEstimate * 0.3
  readinessScore += (performanceStats.avgScore || 0.5) * 0.2

  // Determine recommendation based on current state
  let recommendation: ZPDAssessment['recommendation']
  if (state.masteryLevel < 0.3) {
    recommendation = 'review' // Need foundational review
  } else if (state.masteryLevel < 0.6) {
    recommendation = 'practice' // Need more practice
  } else if (state.masteryLevel < 0.85) {
    recommendation = 'advance' // Ready to advance
  } else {
    recommendation = 'consolidate' // Maintain mastery
  }

  return {
    conceptId: domainId,
    currentMastery: state.masteryLevel,
    zpdLower,
    zpdUpper,
    optimalDifficulty,
    readinessScore,
    recommendation,
  }
}

/**
 * Assess ZPD for all domains in a category
 */
export async function assessCategoryZPD(category: string): Promise<ZPDAssessment[]> {
  const domains = DOMAIN_CATEGORIES[category] || []
  const assessments: ZPDAssessment[] = []

  for (const domain of domains) {
    assessments.push(await assessZPD(domain))
  }

  return assessments.sort((a, b) => b.readinessScore - a.readinessScore)
}

/**
 * Get optimal next learning target based on ZPD analysis
 */
export async function getOptimalLearningTarget(): Promise<ZPDAssessment | null> {
  const allAssessments: ZPDAssessment[] = []

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const assessment = await assessZPD(domain)
    allAssessments.push(assessment)
  }

  // Filter to domains in optimal learning zone
  const optimalTargets = allAssessments.filter(a =>
    a.readinessScore > 0.4 &&
    a.recommendation !== 'consolidate'
  )

  if (optimalTargets.length === 0) {
    // Return domain most needing review
    return allAssessments.sort((a, b) => a.currentMastery - b.currentMastery)[0] || null
  }

  // Prioritize by readiness and potential growth
  return optimalTargets.sort((a, b) => {
    const growthPotentialA = a.zpdUpper - a.currentMastery
    const growthPotentialB = b.zpdUpper - b.currentMastery
    return (b.readinessScore * growthPotentialB) - (a.readinessScore * growthPotentialA)
  })[0]
}

// =============================================================================
// Knowledge Gap Identification
// =============================================================================

/**
 * Analyze knowledge gaps for a domain
 */
export async function analyzeKnowledgeGaps(domainId: string): Promise<KnowledgeGapAnalysis[]> {
  const state = await getOrCreateKnowledgeState(
    domainId,
    getDomainName(domainId),
    getDomainCategory(domainId)
  )
  const prerequisites = await getConceptPrerequisites(domainId)
  const performanceStats = await getConceptPerformanceStats(domainId)
  const gaps: KnowledgeGapAnalysis[] = []

  // Check for foundational gaps (prerequisites not met)
  for (const prereq of prerequisites) {
    const prereqState = await getOrCreateKnowledgeState(
      prereq.prerequisiteId,
      getDomainName(prereq.prerequisiteId),
      getDomainCategory(prereq.prerequisiteId)
    )
    // Check if prerequisite mastery is below required strength
    if (prereqState.masteryLevel < prereq.strength) {
      const severityLevel = prereqState.masteryLevel < 0.3 ? 'critical' : 'high'
      const severityNum = severityLevel === 'critical' ? 0.9 : 0.7
      gaps.push({
        conceptId: domainId,
        gapType: 'foundational',
        severityLevel,
        description: `Missing prerequisite: ${getDomainName(prereq.prerequisiteId)}`,
        suggestedRemediation: [
          `Review ${getDomainName(prereq.prerequisiteId)} fundamentals`,
          `Complete practice exercises for ${getDomainName(prereq.prerequisiteId)}`,
        ],
        prerequisitesNeeded: [prereq.prerequisiteId],
      })

      // Record in database
      await recordKnowledgeGap(
        domainId,
        'prerequisite_missing',
        severityNum,
        prereq.prerequisiteId,
        undefined,
        `Prerequisite ${prereq.prerequisiteId} at ${Math.round(prereqState.masteryLevel * 100)}%`
      )
    }
  }

  // Check for connecting gaps (low transfer between related domains)
  const category = getDomainCategory(domainId)
  const categoryDomains = DOMAIN_CATEGORIES[category] || []
  const masteredSiblings: string[] = []
  const unmasteredSiblings: string[] = []

  for (const sibling of categoryDomains) {
    if (sibling === domainId) continue
    const siblingState = await getOrCreateKnowledgeState(
      sibling,
      getDomainName(sibling),
      category
    )
    if (siblingState.masteryLevel > 0.6) {
      masteredSiblings.push(sibling)
    } else if (siblingState.masteryLevel < 0.4) {
      unmasteredSiblings.push(sibling)
    }
  }

  // If related domains are mastered but this one isn't, it's a connecting gap
  if (masteredSiblings.length > 0 && state.masteryLevel < 0.5) {
    gaps.push({
      conceptId: domainId,
      gapType: 'connecting',
      severityLevel: 'medium',
      description: `Related concepts mastered but connection to ${getDomainName(domainId)} is weak`,
      suggestedRemediation: [
        `Explore relationships between ${getDomainName(domainId)} and ${getDomainName(masteredSiblings[0])}`,
        'Practice integrative exercises',
      ],
      prerequisitesNeeded: [],
    })

    await recordKnowledgeGap(
      domainId,
      'partial_understanding',
      0.5,
      undefined,
      undefined,
      `Weak connection despite mastering ${masteredSiblings.join(', ')}`
    )
  }

  // Check for misconception patterns (inconsistent performance)
  if (performanceStats.totalAttempts > 3) {
    const accuracy = performanceStats.avgScore
    // High scaffolding usage with low performance suggests misconceptions
    if (performanceStats.avgScaffolding > 1.5 && accuracy < 0.6) {
      gaps.push({
        conceptId: domainId,
        gapType: 'misconception',
        severityLevel: 'medium',
        description: 'Inconsistent performance suggests possible misconceptions',
        suggestedRemediation: [
          'Review common misconceptions in this domain',
          'Work through diagnostic exercises',
          'Identify and address specific confusion points',
        ],
        prerequisitesNeeded: [],
      })

      await recordKnowledgeGap(
        domainId,
        'misconception',
        0.6,
        undefined,
        'High scaffolding needs detected',
        `Avg scaffolding: ${performanceStats.avgScaffolding.toFixed(1)}, Accuracy: ${(accuracy * 100).toFixed(0)}%`
      )
    }
  }

  // Check for advanced gaps (plateau at intermediate level)
  const confidenceEstimate = state.timesPracticed > 0
    ? state.timesCorrect / state.timesPracticed
    : 0.5
  if (state.masteryLevel >= 0.5 && state.masteryLevel <= 0.7 && confidenceEstimate > 0.6) {
    gaps.push({
      conceptId: domainId,
      gapType: 'advanced',
      severityLevel: 'low',
      description: 'Intermediate plateau - ready for advanced content',
      suggestedRemediation: [
        'Explore advanced applications',
        'Challenge with complex scenarios',
        'Connect to real-world applications',
      ],
      prerequisitesNeeded: [],
    })
  }

  return gaps.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.severityLevel] - severityOrder[b.severityLevel]
  })
}

/**
 * Get all unaddressed knowledge gaps across domains
 */
export async function getAllKnowledgeGaps(): Promise<KnowledgeGap[]> {
  return await getUnaddressedKnowledgeGaps()
}

/**
 * Mark a knowledge gap as addressed
 */
export async function resolveKnowledgeGap(gapId: number): Promise<void> {
  await markKnowledgeGapAddressed(gapId)
}

// =============================================================================
// Content Difficulty Adaptation
// =============================================================================

/**
 * Adapt content difficulty based on learner's current state
 */
export async function adaptContentDifficulty(domainId: string): Promise<AdaptedContent> {
  const zpd = await assessZPD(domainId)
  const state = await getOrCreateKnowledgeState(
    domainId,
    getDomainName(domainId),
    getDomainCategory(domainId)
  )

  // Estimate confidence from performance
  const confidenceEstimate = state.timesPracticed > 0
    ? state.timesCorrect / state.timesPracticed
    : 0.5

  // Determine scaffolding level based on mastery and confidence
  let scaffoldingLevel: number
  if (state.masteryLevel < 0.3 || confidenceEstimate < 0.3) {
    scaffoldingLevel = 3 // Full support
  } else if (state.masteryLevel < 0.5 || confidenceEstimate < 0.5) {
    scaffoldingLevel = 2 // Guided
  } else if (state.masteryLevel < 0.75) {
    scaffoldingLevel = 1 // Hints only
  } else {
    scaffoldingLevel = 0 // No scaffolding
  }

  // Determine content variant
  let contentVariant: AdaptedContent['contentVariant']
  if (state.masteryLevel < 0.4) {
    contentVariant = 'simplified'
  } else if (state.masteryLevel > 0.7) {
    contentVariant = 'enriched'
  } else {
    contentVariant = 'standard'
  }

  // Gather learning style adaptations
  const learningStyleAdaptations: AdaptedContent['learningStyleAdaptations'] = {}

  // Check VARK learning style preference
  const varkStyle = await getEffectiveLearningPreference('learning_style_vark')
  if (varkStyle) {
    switch (varkStyle.toLowerCase()) {
      case 'visual':
        learningStyleAdaptations.visual = 'Include diagrams and visual representations'
        break
      case 'auditory':
        learningStyleAdaptations.auditory = 'Provide verbal explanations and discussions'
        break
      case 'reading':
        learningStyleAdaptations.reading = 'Provide detailed text explanations'
        break
      case 'kinesthetic':
        learningStyleAdaptations.kinesthetic = 'Include hands-on exercises and activities'
        break
    }
  }

  // Estimate time based on difficulty and scaffolding
  const baseTime = 10 // minutes
  const difficultyMultiplier = 1 + (zpd.optimalDifficulty * 0.5)
  const scaffoldingMultiplier = 1 + (scaffoldingLevel * 0.15)
  const estimatedTimeMinutes = Math.round(baseTime * difficultyMultiplier * scaffoldingMultiplier)

  return {
    conceptId: domainId,
    difficulty: zpd.optimalDifficulty,
    scaffoldingLevel,
    learningStyleAdaptations,
    contentVariant,
    estimatedTimeMinutes,
  }
}

/**
 * Get difficulty progression path for a domain
 */
export async function getDifficultyProgression(domainId: string): Promise<number[]> {
  const zpd = await assessZPD(domainId)

  // Generate 5-step progression from current level through ZPD
  const steps = 5
  const progression: number[] = []
  const stepSize = (zpd.zpdUpper - zpd.currentMastery) / steps

  for (let i = 0; i < steps; i++) {
    progression.push(Math.min(1, zpd.currentMastery + (stepSize * (i + 1))))
  }

  return progression
}

// =============================================================================
// Learning Style Matching
// =============================================================================

export type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic'

export interface LearningStyleProfile {
  visual: number
  auditory: number
  reading: number
  kinesthetic: number
  dominant: LearningStyle
  secondary?: LearningStyle
}

/**
 * Get or assess learning style profile
 */
export async function getLearningStyleProfile(): Promise<LearningStyleProfile> {
  const styles: LearningStyleProfile = {
    visual: 0.25,
    auditory: 0.25,
    reading: 0.25,
    kinesthetic: 0.25,
    dominant: 'visual',
  }

  // Get stored preference
  const varkPref = await getEffectiveLearningPreference('learning_style_vark')

  // Update based on stored preference
  if (varkPref) {
    // Reset to baseline
    styles.visual = 0.15
    styles.auditory = 0.15
    styles.reading = 0.15
    styles.kinesthetic = 0.15

    // Boost the detected style
    switch (varkPref.toLowerCase()) {
      case 'visual':
        styles.visual = 0.55
        break
      case 'auditory':
        styles.auditory = 0.55
        break
      case 'reading':
        styles.reading = 0.55
        break
      case 'kinesthetic':
        styles.kinesthetic = 0.55
        break
    }
  }

  // Normalize to sum to 1
  const total = styles.visual + styles.auditory + styles.reading + styles.kinesthetic
  if (total > 0) {
    styles.visual /= total
    styles.auditory /= total
    styles.reading /= total
    styles.kinesthetic /= total
  }

  // Determine dominant and secondary styles
  const styleValues: [LearningStyle, number][] = [
    ['visual', styles.visual],
    ['auditory', styles.auditory],
    ['reading', styles.reading],
    ['kinesthetic', styles.kinesthetic],
  ]

  styleValues.sort((a, b) => b[1] - a[1])
  styles.dominant = styleValues[0][0]

  if (styleValues[1][1] > 0.2) {
    styles.secondary = styleValues[1][0]
  }

  return styles
}

/**
 * Update learning style based on performance data
 */
export async function updateLearningStyleFromPerformance(
  style: LearningStyle,
  performanceScore: number, // 0-1
  engagementScore: number   // 0-1
): Promise<void> {
  // Weighted combination of performance and engagement
  const combinedScore = (performanceScore * 0.6) + (engagementScore * 0.4)

  // Determine confidence based on combined score
  const confidence = Math.min(0.9, combinedScore)

  // Update the detected preference
  await updateLearningPreference(
    'learning_style_vark',
    style,
    confidence,
    'performance_analysis'
  )

  // Log the learning event
  await logLearningEvent(
    'style_assessment',
    undefined,
    { style, performanceScore, engagementScore, combinedScore },
    style
  )
}

/**
 * Match content to learning style
 */
export async function matchContentToStyle(_domainId: string): Promise<{
  preferredFormats: string[]
  adaptations: string[]
  avoidFormats: string[]
}> {
  const profile = await getLearningStyleProfile()

  const formatsByStyle: Record<LearningStyle, string[]> = {
    visual: ['diagrams', 'charts', 'mind maps', 'infographics', 'videos'],
    auditory: ['podcasts', 'discussions', 'verbal explanations', 'lectures'],
    reading: ['articles', 'documentation', 'written guides', 'textbooks'],
    kinesthetic: ['exercises', 'simulations', 'hands-on activities', 'projects'],
  }

  const preferredFormats = [...formatsByStyle[profile.dominant]]
  const adaptations = [
    `Primary: ${profile.dominant} (${Math.round(profile[profile.dominant] * 100)}%)`,
  ]

  if (profile.secondary) {
    preferredFormats.push(...formatsByStyle[profile.secondary].slice(0, 2))
    adaptations.push(`Secondary: ${profile.secondary} (${Math.round(profile[profile.secondary] * 100)}%)`)
  }

  // Identify formats to avoid (lowest scoring style)
  const styleValues: [LearningStyle, number][] = [
    ['visual', profile.visual],
    ['auditory', profile.auditory],
    ['reading', profile.reading],
    ['kinesthetic', profile.kinesthetic],
  ]
  styleValues.sort((a, b) => a[1] - b[1])
  const weakestStyle = styleValues[0][0]
  const avoidFormats = formatsByStyle[weakestStyle].slice(0, 2)

  return {
    preferredFormats,
    adaptations,
    avoidFormats,
  }
}

// =============================================================================
// Scaffolded Explanations Generator
// =============================================================================

/**
 * Domain-specific explanation templates
 */
const DOMAIN_EXPLANATIONS: Record<string, Partial<ScaffoldedExplanation>> = {
  big_five_openness: {
    concept: 'Openness to Experience',
    levels: {
      simple: 'How curious and creative you are about new ideas and experiences.',
      detailed: 'Openness reflects your intellectual curiosity, imagination, and willingness to try new things. High openness means you enjoy abstract thinking, art, and novel experiences.',
      technical: 'Openness to Experience is a Big Five personality trait measuring cognitive flexibility, aesthetic sensitivity, need for variety, and unconventional values. It correlates with divergent thinking and creative achievement.',
    },
    analogies: [
      'Like having a door to your mind - some people keep it wide open to new ideas, others prefer it more closed.',
      'Similar to being an explorer vs. a settler - explorers seek new territories, settlers prefer familiar ground.',
    ],
    examples: [
      'Enjoying visiting art museums and discussing abstract concepts',
      'Preferring routine and familiar activities over novel experiences',
    ],
    visualAids: [
      'Spectrum diagram from conventional to curious',
      'Mind map of openness facets',
    ],
    practiceQuestions: [
      'How do you typically react when someone suggests trying something completely new?',
      'Do you find yourself drawn to abstract ideas or practical matters?',
    ],
    commonMisconceptions: [
      'Low openness means being closed-minded (actually means preferring the familiar)',
      'High openness always means being artistic (includes intellectual curiosity too)',
    ],
  },
  big_five_conscientiousness: {
    concept: 'Conscientiousness',
    levels: {
      simple: 'How organized, responsible, and goal-oriented you are.',
      detailed: 'Conscientiousness reflects your tendency to be organized, dependable, and achievement-oriented. High conscientiousness means you plan ahead, work diligently, and follow through on commitments.',
      technical: 'Conscientiousness encompasses facets of competence, order, dutifulness, achievement striving, self-discipline, and deliberation. It strongly predicts academic and occupational success.',
    },
    analogies: [
      'Like being the captain of a ship - some captains meticulously plan every voyage, others sail by intuition.',
      'Similar to an ant vs. grasshopper - the ant prepares for winter, the grasshopper lives in the moment.',
    ],
    examples: [
      'Maintaining detailed to-do lists and meeting all deadlines',
      'Preferring spontaneity and flexible schedules',
    ],
    visualAids: [
      'Organization spectrum from spontaneous to structured',
      'Pie chart of conscientiousness facets',
    ],
    practiceQuestions: [
      'How do you typically approach a large project with a distant deadline?',
      'What happens to your workspace when you are very busy?',
    ],
    commonMisconceptions: [
      'Low conscientiousness means being lazy (actually means preferring flexibility)',
      'High conscientiousness means being rigid (includes achievement motivation)',
    ],
  },
  // Additional domains would follow the same pattern...
}

/**
 * Generate scaffolded explanation for a domain
 */
export async function generateScaffoldedExplanation(
  domainId: string
): Promise<ScaffoldedExplanation> {
  const template = DOMAIN_EXPLANATIONS[domainId]
  const state = await getOrCreateKnowledgeState(
    domainId,
    getDomainName(domainId),
    getDomainCategory(domainId)
  )

  // Default explanation structure
  const explanation: ScaffoldedExplanation = {
    conceptId: domainId,
    concept: getDomainName(domainId),
    levels: {
      simple: `Understanding ${getDomainName(domainId)} at a basic level.`,
      detailed: `A comprehensive exploration of ${getDomainName(domainId)} and its components.`,
      technical: `Technical analysis of ${getDomainName(domainId)} including measurement approaches and research findings.`,
    },
    analogies: [
      'Think of this like a spectrum with different positions.',
    ],
    examples: [
      'Example of high expression in this domain',
      'Example of low expression in this domain',
    ],
    visualAids: [
      'Spectrum diagram',
      'Component breakdown chart',
    ],
    practiceQuestions: [
      'How do you typically express this trait?',
      'Can you recall a specific situation related to this domain?',
    ],
    commonMisconceptions: [
      'Common misunderstanding about this psychological domain',
    ],
  }

  // Merge with domain-specific template if available
  if (template) {
    Object.assign(explanation, template)
  }

  // Adapt based on current mastery level
  if (state.masteryLevel < 0.3) {
    // Emphasize simple explanations
    explanation.levels.detailed = explanation.levels.simple + ' ' + explanation.levels.detailed
  } else if (state.masteryLevel > 0.7) {
    // Emphasize technical depth
    explanation.levels.simple = explanation.levels.detailed
    explanation.levels.detailed = explanation.levels.technical
  }

  return explanation
}

/**
 * Get appropriate explanation level based on mastery
 */
export async function getAppropriateExplanationLevel(
  domainId: string
): Promise<'simple' | 'detailed' | 'technical'> {
  const state = await getOrCreateKnowledgeState(
    domainId,
    getDomainName(domainId),
    getDomainCategory(domainId)
  )

  if (state.masteryLevel < 0.35) return 'simple'
  if (state.masteryLevel < 0.7) return 'detailed'
  return 'technical'
}

// =============================================================================
// Progress Tracking System
// =============================================================================

export interface ProgressSummary {
  totalDomains: number
  masteredDomains: number
  inProgressDomains: number
  notStartedDomains: number
  averageMastery: number
  averageConfidence: number
  streakDays: number
  lastActivityDate?: Date
  topStrengths: string[]
  areasForImprovement: string[]
  weeklyProgress: number
}

/**
 * Get comprehensive progress summary
 */
export async function getProgressSummary(): Promise<ProgressSummary> {
  const states = await getAllKnowledgeStates()

  let masteredCount = 0
  let inProgressCount = 0
  let notStartedCount = 0
  let totalMastery = 0
  let totalConfidence = 0
  let lastActivity: Date | undefined
  const strengths: [string, number][] = []
  const weaknesses: [string, number][] = []

  for (const state of states) {
    totalMastery += state.masteryLevel

    // Estimate confidence from performance
    const confidenceEstimate = state.timesPracticed > 0
      ? state.timesCorrect / state.timesPracticed
      : 0
    totalConfidence += confidenceEstimate

    if (state.masteryLevel >= 0.75) {
      masteredCount++
      strengths.push([state.conceptId, state.masteryLevel])
    } else if (state.masteryLevel >= 0.1) {
      inProgressCount++
    } else {
      notStartedCount++
    }

    if (state.masteryLevel < 0.5 && state.timesPracticed > 0) {
      weaknesses.push([state.conceptId, state.masteryLevel])
    }

    if (state.lastPracticed) {
      const practiceDate = new Date(state.lastPracticed)
      if (!lastActivity || practiceDate > lastActivity) {
        lastActivity = practiceDate
      }
    }
  }

  // Sort strengths and weaknesses
  strengths.sort((a, b) => b[1] - a[1])
  weaknesses.sort((a, b) => a[1] - b[1])

  // Calculate streak (simplified - would need daily tracking table)
  const streakDays = lastActivity &&
    (Date.now() - lastActivity.getTime()) < 48 * 60 * 60 * 1000 ? 1 : 0

  return {
    totalDomains: PSYCHOLOGICAL_DOMAINS.length,
    masteredDomains: masteredCount,
    inProgressDomains: inProgressCount,
    notStartedDomains: Math.max(0, PSYCHOLOGICAL_DOMAINS.length - masteredCount - inProgressCount),
    averageMastery: states.length > 0 ? totalMastery / states.length : 0,
    averageConfidence: states.length > 0 ? totalConfidence / states.length : 0,
    streakDays,
    lastActivityDate: lastActivity,
    topStrengths: strengths.slice(0, 5).map(([d]) => d),
    areasForImprovement: weaknesses.slice(0, 5).map(([d]) => d),
    weeklyProgress: 0, // Would need historical tracking
  }
}

/**
 * Get progress for a specific category
 */
export async function getCategoryProgress(category: string): Promise<{
  category: string
  domains: string[]
  averageMastery: number
  completedCount: number
  totalCount: number
}> {
  const domains = DOMAIN_CATEGORIES[category] || []
  const states = await getKnowledgeStatesByCategory(category)

  let totalMastery = 0
  let completedCount = 0

  for (const state of states) {
    totalMastery += state.masteryLevel
    if (state.masteryLevel >= 0.75) {
      completedCount++
    }
  }

  return {
    category,
    domains,
    averageMastery: states.length > 0 ? totalMastery / states.length : 0,
    completedCount,
    totalCount: domains.length,
  }
}

/**
 * Record a learning activity
 */
export async function recordLearningActivity(
  domainId: string,
  sessionId: string,
  activityType: string,
  durationMs: number,
  score: number,
  completed: boolean
): Promise<void> {
  // Get current state for difficulty info
  const state = await getOrCreateKnowledgeState(
    domainId,
    getDomainName(domainId),
    getDomainCategory(domainId)
  )

  // Record in learning_progress table
  await recordLearningProgress(
    sessionId,
    domainId,
    activityType,
    state.difficultyRating,
    score,
    durationMs,
    0, // scaffoldingLevel
    0, // hintsUsed
    1  // attempts
  )

  // Determine if performance was correct
  const wasCorrect = score >= 0.6

  // Update mastery
  await updateKnowledgeMastery(domainId, score, wasCorrect)

  // Log the event
  await logLearningEvent(
    activityType,
    domainId,
    { sessionId, durationMs, score, completed },
    undefined,
    state.difficultyRating,
    score
  )
}

// =============================================================================
// Spaced Repetition Integration
// =============================================================================

/**
 * Get items due for review using spaced repetition
 */
export async function getSpacedRepetitionQueue(limit: number = 10): Promise<KnowledgeState[]> {
  return await getConceptsDueForReview(limit)
}

/**
 * Process a review response and update scheduling
 * Uses SM-2 algorithm for interval calculation
 */
export async function processReviewResponse(
  domainId: string,
  responseQuality: number // 0-5 scale (SM-2 standard)
): Promise<{
  nextReviewDate: Date
  newInterval: number
  newEasiness: number
}> {
  const state = await getOrCreateKnowledgeState(
    domainId,
    getDomainName(domainId),
    getDomainCategory(domainId)
  )

  // SM-2 Algorithm implementation
  // Quality: 0 = complete blackout, 5 = perfect response
  const wasCorrect = responseQuality >= 3

  // Convert quality to mastery score (0-1)
  const masteryScore = responseQuality / 5

  // Calculate new easiness factor
  let newEasiness = state.easinessFactor +
    (0.1 - (5 - responseQuality) * (0.08 + (5 - responseQuality) * 0.02))
  newEasiness = Math.max(1.3, newEasiness) // Minimum easiness of 1.3

  // Calculate new interval
  let newInterval: number
  if (!wasCorrect) {
    // Reset to beginning if failed
    newInterval = 1
  } else if (state.repetitionNumber === 0) {
    newInterval = 1
  } else if (state.repetitionNumber === 1) {
    newInterval = 6
  } else {
    newInterval = Math.round(state.intervalDays * newEasiness)
  }

  // Update the knowledge state
  await updateKnowledgeMastery(domainId, masteryScore, wasCorrect)

  // Calculate next review date
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)

  // Log the review event
  await logLearningEvent(
    'spaced_review',
    domainId,
    {
      responseQuality,
      wasCorrect,
      previousInterval: state.intervalDays,
      newInterval,
      previousEasiness: state.easinessFactor,
      newEasiness,
      nextReviewDate: nextReviewDate.toISOString(),
    }
  )

  return {
    nextReviewDate,
    newInterval,
    newEasiness,
  }
}

/**
 * Get optimal review schedule for all domains
 */
export async function getReviewSchedule(): Promise<{
  overdue: string[]
  dueToday: string[]
  dueThisWeek: string[]
  upcoming: string[]
}> {
  const states = await getAllKnowledgeStates()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekFromNow = new Date(today)
  weekFromNow.setDate(weekFromNow.getDate() + 7)

  const overdue: string[] = []
  const dueToday: string[] = []
  const dueThisWeek: string[] = []
  const upcoming: string[] = []

  for (const state of states) {
    if (!state.nextReviewDue) {
      upcoming.push(state.conceptId)
      continue
    }

    const nextReview = new Date(state.nextReviewDue)
    const reviewDate = new Date(nextReview.getFullYear(), nextReview.getMonth(), nextReview.getDate())

    if (reviewDate < today) {
      overdue.push(state.conceptId)
    } else if (reviewDate.getTime() === today.getTime()) {
      dueToday.push(state.conceptId)
    } else if (reviewDate < weekFromNow) {
      dueThisWeek.push(state.conceptId)
    } else {
      upcoming.push(state.conceptId)
    }
  }

  return { overdue, dueToday, dueThisWeek, upcoming }
}

// =============================================================================
// Learning Recommendations Engine
// =============================================================================

/**
 * Generate personalized learning recommendations
 */
export async function generateLearningRecommendations(
  limit: number = 5
): Promise<LearningRecommendation[]> {
  const recommendations: LearningRecommendation[] = []
  const reviewQueue = await getSpacedRepetitionQueue(20)
  const gaps = await getAllKnowledgeGaps()

  // Add review recommendations
  for (const state of reviewQueue.slice(0, Math.ceil(limit / 2))) {
    recommendations.push({
      conceptId: state.conceptId,
      priority: 0.9, // High priority for due reviews
      action: 'review',
      reason: 'Due for spaced repetition review',
      estimatedBenefit: 0.8,
      prerequisites: [],
      isDueForReview: true,
      lastActivity: state.lastPracticed ? new Date(state.lastPracticed) : undefined,
    })
  }

  // Add gap-based recommendations
  for (const gap of gaps.slice(0, Math.ceil(limit / 2))) {
    // Convert severity number to priority
    const priority = gap.severity >= 0.8 ? 1.0 :
                     gap.severity >= 0.6 ? 0.85 :
                     gap.severity >= 0.4 ? 0.7 : 0.5

    recommendations.push({
      conceptId: gap.conceptId,
      priority,
      action: gap.gapType === 'prerequisite_missing' ? 'learn' : 'practice',
      reason: gap.evidenceText || `${gap.gapType} gap detected`,
      estimatedBenefit: 0.7,
      prerequisites: gap.prerequisiteMissing ? [gap.prerequisiteMissing] : [],
      isDueForReview: false,
    })
  }

  // Add ZPD-based recommendations for domains not covered
  const coveredDomains = new Set(recommendations.map(r => r.conceptId))

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    if (coveredDomains.has(domain)) continue
    if (recommendations.length >= limit * 2) break

    const zpd = await assessZPD(domain)

    if (zpd.readinessScore > 0.5) {
      recommendations.push({
        conceptId: domain,
        priority: zpd.readinessScore * 0.6,
        action: zpd.recommendation === 'advance' ? 'deepen' :
                zpd.recommendation === 'review' ? 'learn' : 'practice',
        reason: `Optimal for growth (readiness: ${Math.round(zpd.readinessScore * 100)}%)`,
        estimatedBenefit: zpd.zpdUpper - zpd.currentMastery,
        prerequisites: [],
        isDueForReview: false,
      })
    }
  }

  // Sort by priority and return top recommendations
  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
}

// =============================================================================
// Initialization and Setup
// =============================================================================

/**
 * Initialize prerequisite relationships between domains
 */
export async function initializePrerequisites(): Promise<void> {
  // Define logical prerequisites between domains
  // Format: [concept, prerequisite, strength (min mastery needed)]
  const prerequisites: [string, string, number][] = [
    // Emotional intelligence builds on empathy
    ['emotional_intelligence', 'emotional_empathy', 0.4],

    // Social cognition relates to emotional understanding
    ['social_cognition', 'emotional_empathy', 0.3],
    ['social_cognition', 'emotional_intelligence', 0.3],

    // Metacognition builds on cognitive abilities
    ['metacognition', 'cognitive_abilities', 0.4],

    // Executive functions relate to metacognition
    ['executive_functions', 'metacognition', 0.3],

    // Decision style builds on risk tolerance awareness
    ['decision_style', 'risk_tolerance', 0.2],

    // Growth mindset relates to self-efficacy
    ['growth_mindset', 'self_efficacy', 0.3],

    // Life satisfaction builds on values awareness
    ['life_satisfaction', 'personal_values', 0.3],

    // Stress coping benefits from emotional intelligence
    ['stress_coping', 'emotional_intelligence', 0.4],

    // Communication style relates to extraversion
    ['communication_style', 'big_five_extraversion', 0.2],
  ]

  for (const [concept, prerequisite, strength] of prerequisites) {
    await addConceptPrerequisite(concept, prerequisite, strength)
  }

  await logLearningEvent(
    'prerequisites_initialized',
    undefined,
    { count: prerequisites.length }
  )
}

/**
 * Initialize learning preferences with defaults
 */
export async function initializeLearningPreferences(): Promise<void> {
  // Set balanced default learning style (no strong preference initially)
  await updateLearningPreference(
    'learning_style_vark',
    'balanced',
    0.5,
    'default_initialization',
    false
  )

  // Set default scaffolding preference
  await updateLearningPreference(
    'scaffolding_preference',
    'moderate',
    0.5,
    'default_initialization',
    false
  )

  // Set default challenge level
  await updateLearningPreference(
    'challenge_level',
    'slight_stretch',
    0.5,
    'default_initialization',
    false
  )

  await logLearningEvent(
    'preferences_initialized',
    undefined,
    { timestamp: new Date().toISOString() }
  )
}

/**
 * Full initialization for Phase 3 learning system
 */
export async function initializeLearningSystem(): Promise<void> {
  await initializePrerequisites()
  await initializeLearningPreferences()

  // Initialize knowledge states for all domains
  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    await getOrCreateKnowledgeState(
      domain,
      getDomainName(domain),
      getDomainCategory(domain)
    )
  }

  await logLearningEvent(
    'learning_system_initialized',
    undefined,
    {
      domainCount: PSYCHOLOGICAL_DOMAINS.length,
      timestamp: new Date().toISOString(),
    }
  )
}
