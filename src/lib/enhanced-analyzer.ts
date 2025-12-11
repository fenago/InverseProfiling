// Enhanced Phase 2 Analyzer - Full 22-Domain Profiling with LIWC Feature Extraction
// Integrates with LIWC dictionaries and SQL database for comprehensive psychological profiling

import {
  LIWC_DICTIONARIES as _LIWC_DICTIONARIES,
  PRONOUNS,
  COGNITIVE,
  AFFECT,
  SOCIAL,
  DRIVES,
  TIME,
  PERCEPTUAL,
  PERSONAL,
  INFORMAL,
  MORAL,
  MINDSET,
  METACOGNITION,
  CREATIVITY,
  ATTACHMENT,
  COMMUNICATION,
  EXECUTIVE,
  COPING,
  VALUES,
  DECISION,
  POLITICAL,
  CULTURAL,
  SENSORY,
  AESTHETIC,
  FUNCTION_WORDS,
} from './liwc-dictionaries'

import {
  initSqlDatabase,
  updateFeatureCount,
  updateMatchedWords,
  updateDomainScore,
  updateBehavioralMetric,
  updateConfidenceFactor,
  calculateDomainConfidence,
  recordDomainHistory as _recordDomainHistory,
  getDomainScores,
  getFeatureCounts,
  saveDatabase,
  getDb as _getDb,
} from './sqldb'

import { db as _db } from './db'

// Import vector and graph database modules
import {
  initVectorDB,
  storeMessageEmbedding,
  extractAndStoreTopics,
  extractAndStoreConcepts,
} from './vectordb'

import {
  initGraphDB,
  buildRelationshipsFromScores,
  recordUserTopic as _recordUserTopic,
  PREDICATES as _PREDICATES,
} from './graphdb'

import { autoSnapshot } from './history'

// ==================== TYPES ====================

export interface LIWCFeatureExtraction {
  category: string
  subcategory: string
  count: number
  words: string[]
}

export interface LIWCSummaryVariables {
  analyticalThinking: number // 0-100 scale
  clout: number // 0-100 scale
  authenticity: number // 0-100 scale
  emotionalTone: number // 0-100 scale
}

export interface EnhancedAnalysisResult {
  // Basic metrics
  wordCount: number
  sentenceCount: number
  avgWordsPerSentence: number
  avgWordLength: number
  vocabularyRichness: number // Type-token ratio

  // LIWC Summary Variables
  summaryVariables: LIWCSummaryVariables

  // All feature extractions
  features: Record<string, Record<string, number>>

  // Matched words for each feature (for showing examples)
  matchedWords: Record<string, Record<string, string[]>>

  // Behavioral metrics from this message
  behavioralMetrics: {
    responseLength: number
    sentenceCount: number
    questionCount: number
    exclamationCount: number
  }
}

// ==================== TOKENIZATION ====================

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0)
}

function countSentences(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  return Math.max(sentences.length, 1)
}

function countQuestions(text: string): number {
  return (text.match(/\?/g) || []).length
}

function countExclamations(text: string): number {
  return (text.match(/!/g) || []).length
}

// ==================== FEATURE EXTRACTION ====================

function countCategoryWords(words: string[], categoryWords: readonly string[]): { count: number; matchedWords: string[] } {
  const matchedWords: string[] = []
  const lowerCategoryWords = categoryWords.map(w => w.toLowerCase())

  for (const word of words) {
    if (lowerCategoryWords.includes(word)) {
      matchedWords.push(word)
    }
  }

  return { count: matchedWords.length, matchedWords }
}

interface FeaturesWithMatches {
  counts: Record<string, Record<string, number>>
  matchedWords: Record<string, Record<string, string[]>>
}

// Helper to extract features and track matched words
function extractCategoryFeatures(
  words: string[],
  categoryName: string,
  categoryDict: Record<string, readonly string[]>,
  counts: Record<string, Record<string, number>>,
  matched: Record<string, Record<string, string[]>>
): void {
  counts[categoryName] = {}
  matched[categoryName] = {}

  for (const [featureName, wordList] of Object.entries(categoryDict)) {
    const result = countCategoryWords(words, wordList)
    counts[categoryName][featureName] = result.count
    matched[categoryName][featureName] = result.matchedWords
  }
}

function extractAllFeatures(words: string[]): FeaturesWithMatches {
  const counts: Record<string, Record<string, number>> = {}
  const matchedWords: Record<string, Record<string, string[]>> = {}

  // Pronouns
  extractCategoryFeatures(words, 'pronouns', PRONOUNS, counts, matchedWords)

  // Cognitive
  extractCategoryFeatures(words, 'cognitive', COGNITIVE, counts, matchedWords)

  // Affect/Emotions
  extractCategoryFeatures(words, 'affect', AFFECT, counts, matchedWords)

  // Social
  extractCategoryFeatures(words, 'social', SOCIAL, counts, matchedWords)

  // Drives
  extractCategoryFeatures(words, 'drives', DRIVES, counts, matchedWords)

  // Time
  extractCategoryFeatures(words, 'time', TIME, counts, matchedWords)

  // Perceptual
  extractCategoryFeatures(words, 'perceptual', PERCEPTUAL, counts, matchedWords)

  // Personal
  extractCategoryFeatures(words, 'personal', PERSONAL, counts, matchedWords)

  // Informal
  extractCategoryFeatures(words, 'informal', INFORMAL, counts, matchedWords)

  // Moral
  extractCategoryFeatures(words, 'moral', MORAL, counts, matchedWords)

  // Mindset
  extractCategoryFeatures(words, 'mindset', MINDSET, counts, matchedWords)

  // Metacognition
  extractCategoryFeatures(words, 'metacognition', METACOGNITION, counts, matchedWords)

  // Creativity
  extractCategoryFeatures(words, 'creativity', CREATIVITY, counts, matchedWords)

  // Attachment
  extractCategoryFeatures(words, 'attachment', ATTACHMENT, counts, matchedWords)

  // Communication
  extractCategoryFeatures(words, 'communication', COMMUNICATION, counts, matchedWords)

  // Executive
  extractCategoryFeatures(words, 'executive', EXECUTIVE, counts, matchedWords)

  // Coping
  extractCategoryFeatures(words, 'coping', COPING, counts, matchedWords)

  // Values
  extractCategoryFeatures(words, 'values', VALUES, counts, matchedWords)

  // Decision
  extractCategoryFeatures(words, 'decision', DECISION, counts, matchedWords)

  // Political
  extractCategoryFeatures(words, 'political', POLITICAL, counts, matchedWords)

  // Cultural
  extractCategoryFeatures(words, 'cultural', CULTURAL, counts, matchedWords)

  // Sensory
  extractCategoryFeatures(words, 'sensory', SENSORY, counts, matchedWords)

  // Aesthetic
  extractCategoryFeatures(words, 'aesthetic', AESTHETIC, counts, matchedWords)

  // Function Words
  extractCategoryFeatures(words, 'function_words', FUNCTION_WORDS, counts, matchedWords)

  return { counts, matchedWords }
}

// ==================== LIWC SUMMARY VARIABLES ====================

function calculateSummaryVariables(
  features: Record<string, Record<string, number>>,
  wordCount: number
): LIWCSummaryVariables {
  if (wordCount === 0) {
    return { analyticalThinking: 50, clout: 50, authenticity: 50, emotionalTone: 50 }
  }

  // Analytical Thinking: High articles/prepositions, Low personal pronouns/auxiliary verbs/conjunctions
  const analyticalPositive =
    (features.function_words?.articles || 0) +
    (features.function_words?.prepositions || 0)
  const analyticalNegative =
    (features.pronouns?.first_person_singular || 0) +
    (features.function_words?.auxiliary_verbs || 0) +
    (features.function_words?.conjunctions || 0) +
    (features.function_words?.adverbs || 0) +
    (features.function_words?.negations || 0)

  const analyticalRaw = (analyticalPositive * 2 - analyticalNegative) / wordCount
  const analyticalThinking = Math.min(100, Math.max(0, 50 + analyticalRaw * 200))

  // Clout: High 1st person plural + 2nd person, Low 1st person singular + negations + hedging
  const cloutPositive =
    (features.pronouns?.first_person_plural || 0) +
    (features.pronouns?.second_person || 0)
  const cloutNegative =
    (features.pronouns?.first_person_singular || 0) +
    (features.function_words?.negations || 0) +
    (features.communication?.hedging_language || 0)

  const cloutRaw = (cloutPositive * 2 - cloutNegative) / wordCount
  const clout = Math.min(100, Math.max(0, 50 + cloutRaw * 200))

  // Authenticity: High 1st person singular + exclusive words, Low negative emotion + motion
  const authenticityPositive =
    (features.pronouns?.first_person_singular || 0) +
    (features.cognitive?.differentiation || 0)
  const authenticityNegative =
    (features.affect?.negative_emotion || 0) * 0.5

  const authenticityRaw = (authenticityPositive - authenticityNegative) / wordCount
  const authenticity = Math.min(100, Math.max(0, 50 + authenticityRaw * 200))

  // Emotional Tone: Ratio of positive to negative emotion words
  const positiveEmotion = features.affect?.positive_emotion || 0
  const negativeEmotion = features.affect?.negative_emotion || 0
  const totalEmotion = positiveEmotion + negativeEmotion

  let emotionalTone = 50
  if (totalEmotion > 0) {
    emotionalTone = (positiveEmotion / totalEmotion) * 100
  }

  return {
    analyticalThinking: Math.round(analyticalThinking * 10) / 10,
    clout: Math.round(clout * 10) / 10,
    authenticity: Math.round(authenticity * 10) / 10,
    emotionalTone: Math.round(emotionalTone * 10) / 10,
  }
}

// ==================== MAIN ANALYSIS FUNCTION ====================

export function analyzeTextEnhanced(text: string): EnhancedAnalysisResult {
  const words = tokenize(text)
  const wordCount = words.length
  const sentenceCount = countSentences(text)
  const uniqueWords = new Set(words)

  // Basic metrics
  const avgWordsPerSentence = wordCount / sentenceCount
  const avgWordLength = wordCount > 0
    ? words.reduce((sum, w) => sum + w.length, 0) / wordCount
    : 0
  const vocabularyRichness = wordCount > 0 ? uniqueWords.size / wordCount : 0

  // Extract all features (now includes matched words)
  const { counts: features, matchedWords } = extractAllFeatures(words)

  // Calculate LIWC summary variables
  const summaryVariables = calculateSummaryVariables(features, wordCount)

  // Behavioral metrics
  const behavioralMetrics = {
    responseLength: wordCount,
    sentenceCount,
    questionCount: countQuestions(text),
    exclamationCount: countExclamations(text),
  }

  return {
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
    avgWordLength,
    vocabularyRichness,
    summaryVariables,
    features,
    matchedWords,
    behavioralMetrics,
  }
}

// ==================== DOMAIN SCORE COMPUTATION ====================

interface DomainComputationResult {
  score: number
  rawScore: number
  dataPointsCount: number
  confidenceFactors: {
    dataVolume: number
    consistency: number
  }
}

function computeBigFiveOpenness(
  features: Record<string, Record<string, number>>,
  wordCount: number,
  vocabularyRichness: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // High Openness indicators
  const positiveMarkers =
    (features.function_words?.articles || 0) +
    (features.cognitive?.insight || 0) +
    (features.cognitive?.tentative || 0) +
    (features.cognitive?.differentiation || 0) +
    (features.creativity?.novelty_words || 0) +
    (features.creativity?.imagination_words || 0)

  // Low Openness indicators
  const negativeMarkers =
    (features.cognitive?.certainty || 0)

  const dataPoints = positiveMarkers + negativeMarkers
  const rawScore = (positiveMarkers - negativeMarkers * 0.5) / wordCount

  // Combine with vocabulary richness (key indicator of openness)
  const combinedScore = rawScore * 0.6 + vocabularyRichness * 0.4

  // Normalize to 0-1 scale
  const score = Math.min(1, Math.max(0, 0.5 + combinedScore * 2))

  return {
    score,
    rawScore,
    dataPointsCount: dataPoints,
    confidenceFactors: {
      dataVolume: Math.min(1, dataPoints / 10),
      consistency: 0.5, // Would need historical data
    },
  }
}

function computeBigFiveConscientiousness(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  const positiveMarkers =
    (features.drives?.achievement || 0) +
    (features.personal?.work || 0) +
    (features.time?.future_focus || 0) +
    (features.function_words?.negations || 0) +
    (features.cognitive?.discrepancy || 0) +
    (features.executive?.planning_words || 0) +
    (features.executive?.organization_words || 0)

  const negativeMarkers =
    (features.informal?.fillers || 0) +
    (features.informal?.nonfluencies || 0)

  const dataPoints = positiveMarkers + negativeMarkers
  const rawScore = (positiveMarkers - negativeMarkers) / wordCount
  const score = Math.min(1, Math.max(0, 0.5 + rawScore * 3))

  return {
    score,
    rawScore,
    dataPointsCount: dataPoints,
    confidenceFactors: {
      dataVolume: Math.min(1, dataPoints / 10),
      consistency: 0.5,
    },
  }
}

function computeBigFiveExtraversion(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  const positiveMarkers =
    (features.social?.social_general || 0) +
    (features.social?.friends || 0) +
    (features.affect?.positive_emotion || 0) +
    (features.pronouns?.first_person_plural || 0) +
    (features.drives?.affiliation || 0)

  const negativeMarkers =
    (features.pronouns?.first_person_singular || 0) * 0.3

  // Word count itself is an indicator
  const verbosityBonus = Math.min(0.2, wordCount / 500)

  const dataPoints = positiveMarkers + negativeMarkers
  const rawScore = (positiveMarkers - negativeMarkers) / wordCount + verbosityBonus
  const score = Math.min(1, Math.max(0, 0.5 + rawScore * 2))

  return {
    score,
    rawScore,
    dataPointsCount: dataPoints,
    confidenceFactors: {
      dataVolume: Math.min(1, dataPoints / 10),
      consistency: 0.5,
    },
  }
}

function computeBigFiveAgreeableness(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  const positiveMarkers =
    (features.affect?.positive_emotion || 0) +
    (features.social?.affiliation || 0) +
    (features.informal?.assent || 0) +
    (features.pronouns?.second_person || 0) +
    (features.values?.benevolence || 0) +
    (features.moral?.care_harm || 0)

  const negativeMarkers =
    (features.affect?.negative_emotion || 0) +
    (features.informal?.swear || 0) +
    (features.affect?.anger || 0)

  const dataPoints = positiveMarkers + negativeMarkers
  const rawScore = (positiveMarkers - negativeMarkers) / wordCount
  const score = Math.min(1, Math.max(0, 0.5 + rawScore * 3))

  return {
    score,
    rawScore,
    dataPointsCount: dataPoints,
    confidenceFactors: {
      dataVolume: Math.min(1, dataPoints / 10),
      consistency: 0.5,
    },
  }
}

function computeBigFiveNeuroticism(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  const positiveMarkers = // Higher = more neurotic
    (features.affect?.negative_emotion || 0) +
    (features.affect?.anxiety || 0) +
    (features.pronouns?.first_person_singular || 0) +
    (features.cognitive?.tentative || 0) +
    (features.personal?.health || 0)

  const negativeMarkers =
    (features.cognitive?.certainty || 0) +
    (features.affect?.positive_emotion || 0) * 0.3

  const dataPoints = positiveMarkers + negativeMarkers
  const rawScore = (positiveMarkers - negativeMarkers) / wordCount
  const score = Math.min(1, Math.max(0, 0.5 + rawScore * 3))

  return {
    score,
    rawScore,
    dataPointsCount: dataPoints,
    confidenceFactors: {
      dataVolume: Math.min(1, dataPoints / 10),
      consistency: 0.5,
    },
  }
}

// Additional domain computations
function computeEmotionalIntelligence(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Count variety of emotion words (granularity)
  const emotionCategories = [
    features.affect?.positive_emotion || 0,
    features.affect?.negative_emotion || 0,
    features.affect?.anxiety || 0,
    features.affect?.anger || 0,
    features.affect?.sadness || 0,
    features.affect?.joy || 0,
    features.affect?.trust || 0,
    features.affect?.fear || 0,
    features.affect?.surprise || 0,
    features.affect?.disgust || 0,
  ]

  const nonZeroCategories = emotionCategories.filter(c => c > 0).length
  const emotionDiversity = nonZeroCategories / 10

  const socialAwareness =
    (features.pronouns?.second_person || 0) +
    (features.social?.social_general || 0)

  const dataPoints = emotionCategories.reduce((a, b) => a + b, 0) + socialAwareness
  const rawScore = emotionDiversity * 0.5 + (socialAwareness / wordCount) * 0.5
  const score = Math.min(1, Math.max(0, rawScore))

  return {
    score,
    rawScore,
    dataPointsCount: dataPoints,
    confidenceFactors: {
      dataVolume: Math.min(1, dataPoints / 15),
      consistency: 0.5,
    },
  }
}

function computeGrowthMindset(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  const growthMarkers =
    (features.mindset?.growth_language || 0) +
    (features.mindset?.effort_attribution || 0)

  const fixedMarkers =
    (features.mindset?.fixed_language || 0) +
    (features.mindset?.ability_attribution || 0)

  const dataPoints = growthMarkers + fixedMarkers

  if (dataPoints === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  const rawScore = (growthMarkers - fixedMarkers) / (growthMarkers + fixedMarkers)
  const score = Math.min(1, Math.max(0, 0.5 + rawScore * 0.5))

  return {
    score,
    rawScore,
    dataPointsCount: dataPoints,
    confidenceFactors: {
      dataVolume: Math.min(1, dataPoints / 5),
      consistency: 0.5,
    },
  }
}

function computeTimePerspective(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  const past = features.time?.past_focus || 0
  const present = features.time?.present_focus || 0
  const future = features.time?.future_focus || 0
  const total = past + present + future

  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Score represents future-orientation (0 = past-focused, 1 = future-focused)
  const rawScore = (future - past) / total
  const score = Math.min(1, Math.max(0, 0.5 + rawScore * 0.5))

  return {
    score,
    rawScore,
    dataPointsCount: total,
    confidenceFactors: {
      dataVolume: Math.min(1, total / 10),
      consistency: 0.5,
    },
  }
}

// ==================== ADDITIONAL DOMAIN COMPUTATIONS ====================

function computeCognitiveAbilities(
  features: Record<string, Record<string, number>>,
  wordCount: number,
  vocabularyRichness: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Cognitive markers: analytic thinking, insight words, causation
  const insight = features.cognitive?.insight || 0
  const cause = features.cognitive?.causation || 0
  const certainty = features.cognitive?.certainty || 0
  const differentiation = features.cognitive?.differentiation || 0

  const total = insight + cause + certainty + differentiation

  // Only compute score if we have actual cognitive markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Base score from markers, with vocabulary richness as a modifier (not the main factor)
  const markerScore = (total / wordCount) * 100
  const rawScore = markerScore * (1 + vocabularyRichness * 0.5)

  return {
    score: Math.min(1, Math.max(0, rawScore / 8)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 10),
      consistency: 0.6,
    },
  }
}

function computeValuesMotivations(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Values indicators: achievement, power, affiliation (correct property names)
  const achievement = features.drives?.achievement || 0
  const power = features.drives?.power || 0
  const affiliation = features.drives?.affiliation || 0
  const reward = features.drives?.reward || 0
  const risk = features.drives?.risk || 0

  const total = achievement + power + affiliation + reward + risk

  // Only compute score if we have actual values markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  const rawScore = total / wordCount * 100

  return {
    score: Math.min(1, Math.max(0, rawScore / 5)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 10),
      consistency: 0.5,
    },
  }
}

function computeMoralReasoning(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Moral foundation markers
  const care = features.moral?.care_harm || 0
  const fairness = features.moral?.fairness_cheating || 0
  const loyalty = features.moral?.loyalty_betrayal || 0
  const authority = features.moral?.authority_subversion || 0
  const sanctity = features.moral?.sanctity_degradation || 0

  const total = care + fairness + loyalty + authority + sanctity
  const rawScore = total / wordCount * 100

  return {
    score: Math.min(1, Math.max(0, 0.3 + rawScore / 3)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 5),
      consistency: 0.5,
    },
  }
}

function computeDecisionMaking(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Decision markers: certainty, tentative, causation (correct property names)
  const certainty = features.cognitive?.certainty || 0
  const tentative = features.cognitive?.tentative || 0
  const cause = features.cognitive?.causation || 0
  const differentiation = features.cognitive?.differentiation || 0

  const total = certainty + tentative + cause + differentiation

  // Only compute score if we have actual decision markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Higher certainty = more decisive (rational), higher tentative = more intuitive
  const rawScore = (certainty - tentative * 0.5 + cause) / total

  return {
    score: Math.min(1, Math.max(0, 0.5 + rawScore * 0.3)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 8),
      consistency: 0.5,
    },
  }
}

function computeCreativity(
  features: Record<string, Record<string, number>>,
  wordCount: number,
  vocabularyRichness: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Creativity markers: creativity-specific words, perceptual processes, insight
  const novelty = features.creativity?.novelty_words || 0
  const imagination = features.creativity?.imagination_words || 0
  const innovation = features.creativity?.innovation_words || 0
  const insight = features.cognitive?.insight || 0

  const total = novelty + imagination + innovation + insight

  // Only compute score if we have actual creativity markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Base score from markers, with vocabulary richness as a modifier (not the main factor)
  const markerScore = (total / wordCount) * 100
  const rawScore = markerScore * (1 + vocabularyRichness * 0.5)

  return {
    score: Math.min(1, Math.max(0, rawScore / 6)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 8),
      consistency: 0.5,
    },
  }
}

function computeAttachmentStyle(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Attachment markers: social words, affiliation, anxiety (correct property names)
  const social = features.social?.social_general || 0
  const family = features.social?.family || 0
  const friends = features.social?.friends || 0
  const affiliation = features.drives?.affiliation || 0
  const anxWords = features.affect?.anxiety || 0

  const totalSocial = social + family + friends + affiliation
  const total = totalSocial + anxWords

  // Only compute score if we have actual attachment markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Secure attachment = high social, low anxiety
  const rawScore = totalSocial - anxWords * 0.5

  return {
    score: Math.min(1, Math.max(0, 0.5 + rawScore / total * 0.3)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 10),
      consistency: 0.4,
    },
  }
}

function computeLearningStyles(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // VARK indicators: visual, auditory, read/write, kinesthetic (correct property names)
  const visual = features.perceptual?.see || 0
  const auditory = features.perceptual?.hear || 0
  const kinesthetic = features.perceptual?.feel || 0
  const readWrite = features.cognitive?.insight || 0

  const total = visual + auditory + kinesthetic + readWrite

  // Only compute score if we have actual learning style markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Score represents multimodal tendency (higher = more multimodal)
  const modes = [visual, auditory, kinesthetic, readWrite].filter(v => v > 0).length
  const rawScore = modes / 4

  return {
    score: Math.min(1, Math.max(0, 0.3 + rawScore * 0.5)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 5),
      consistency: 0.5,
    },
  }
}

function computeInformationProcessing(
  features: Record<string, Record<string, number>>,
  wordCount: number,
  avgWordsPerSentence: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Processing depth indicators: causation, cognitive complexity (correct property names)
  const cause = features.cognitive?.causation || 0
  const insight = features.cognitive?.insight || 0
  const tentative = features.cognitive?.tentative || 0
  const differentiation = features.cognitive?.differentiation || 0

  const total = cause + insight + tentative + differentiation

  // Only compute score if we have actual processing markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Longer sentences + more cognitive words = deeper processing
  const rawScore = (total / wordCount) * 100 + avgWordsPerSentence / 3

  return {
    score: Math.min(1, Math.max(0, rawScore / 6)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 8),
      consistency: 0.5,
    },
  }
}

function computeMetacognition(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Metacognitive indicators: insight, certainty/tentative (correct property names)
  const insight = features.cognitive?.insight || 0
  const certain = features.cognitive?.certainty || 0
  const tentative = features.cognitive?.tentative || 0
  const differentiation = features.cognitive?.differentiation || 0

  const total = insight + certain + tentative + differentiation

  // Only compute score if we have actual metacognition markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  const rawScore = (total / wordCount) * 100

  return {
    score: Math.min(1, Math.max(0, rawScore / 4)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 6),
      consistency: 0.5,
    },
  }
}

function computeExecutiveFunctions(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Executive function markers: discrepancy (inhibition), cognitive flexibility (correct property names)
  const discrepancy = features.cognitive?.discrepancy || 0
  const differentiation = features.cognitive?.differentiation || 0
  const cause = features.cognitive?.causation || 0
  const tentative = features.cognitive?.tentative || 0

  // Also include executive-specific features
  const inhibition = features.executive?.inhibition_words || 0
  const shifting = features.executive?.shifting_words || 0
  const planning = features.executive?.planning_words || 0
  const organization = features.executive?.organization_words || 0

  const total = discrepancy + differentiation + cause + tentative + inhibition + shifting + planning + organization

  // Only compute score if we have actual executive function markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  const rawScore = (total / wordCount) * 100

  return {
    score: Math.min(1, Math.max(0, rawScore / 4)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 6),
      consistency: 0.5,
    },
  }
}

function computeCommunicationStyles(
  features: Record<string, Record<string, number>>,
  wordCount: number,
  avgWordsPerSentence: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Communication style markers (correct property names)
  const certain = features.cognitive?.certainty || 0  // Directness
  const tentative = features.cognitive?.tentative || 0      // Indirectness
  const social = features.social?.social_general || 0 // Expressiveness
  const affect = (features.affect?.positive_emotion || 0) + (features.affect?.negative_emotion || 0) // Emotionality

  // Communication-specific features
  const formal = features.communication?.formal_language || 0
  const informal = features.communication?.informal_language || 0
  const direct = features.communication?.direct_language || 0
  const indirect = features.communication?.indirect_language || 0
  const assertive = features.communication?.assertive_language || 0
  const hedging = features.communication?.hedging_language || 0

  const total = certain + tentative + social + affect + formal + informal + direct + indirect + assertive + hedging

  // Only compute score if we have actual communication markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Higher certainty, longer sentences = more direct formal style
  const rawScore = (certain - tentative * 0.5 + avgWordsPerSentence / 5) / Math.max(wordCount / 20, 1)

  return {
    score: Math.min(1, Math.max(0, 0.5 + rawScore * 0.2)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 8),
      consistency: 0.5,
    },
  }
}

function computeSocialCognition(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Social cognition markers (correct property names)
  const social = features.social?.social_general || 0
  const family = features.social?.family || 0
  const friends = features.social?.friends || 0
  const cogProc = features.cognitive?.insight || 0
  const affiliation = features.social?.affiliation || 0

  const total = social + family + friends + cogProc + affiliation

  // Only compute score if we have actual social cognition markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  const rawScore = (total / wordCount) * 100

  return {
    score: Math.min(1, Math.max(0, rawScore / 5)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 8),
      consistency: 0.5,
    },
  }
}

function computeResilienceCoping(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Resilience indicators (correct property names)
  const posemo = features.affect?.positive_emotion || 0
  const negemo = features.affect?.negative_emotion || 0
  const achievement = features.drives?.achievement || 0
  const anxiety = features.affect?.anxiety || 0

  // Coping-specific features
  const problemFocused = features.coping?.problem_focused || 0
  const emotionFocused = features.coping?.emotion_focused || 0
  const optimism = features.coping?.optimism || 0
  const selfEfficacy = features.coping?.self_efficacy || 0

  const total = posemo + negemo + achievement + anxiety + problemFocused + emotionFocused + optimism + selfEfficacy

  // Only compute score if we have actual resilience/coping markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Higher positive, achievement; lower anxiety = more resilient
  const rawScore = posemo + achievement + optimism + selfEfficacy - negemo * 0.3 - anxiety * 0.5

  return {
    score: Math.min(1, Math.max(0, 0.5 + rawScore / Math.max(total, 1) * 0.3)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 8),
      consistency: 0.4,
    },
  }
}

function computePoliticalIdeology(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Political orientation indicators (conservative vs liberal)
  const authority = features.moral?.authority_subversion || 0
  const loyalty = features.moral?.loyalty_betrayal || 0
  const sanctity = features.moral?.sanctity_degradation || 0
  const care = features.moral?.care_harm || 0
  const fairness = features.moral?.fairness_cheating || 0

  const conserv = authority + loyalty + sanctity
  const liberal = care + fairness
  const total = conserv + liberal

  // 0 = very conservative, 1 = very liberal
  const rawScore = total > 0 ? (liberal - conserv) / total : 0

  return {
    score: Math.min(1, Math.max(0, 0.5 + rawScore * 0.3)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 5),
      consistency: 0.4,
    },
  }
}

function computeCulturalValues(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Cultural values: individualism vs collectivism (correct property names)
  const i_pronoun = features.pronouns?.first_person_singular || 0  // Individualist
  const we_pronoun = features.pronouns?.first_person_plural || 0  // Collectivist
  const family = features.social?.family || 0
  const achievement = features.drives?.achievement || 0

  // Cultural-specific features
  const individualism = features.cultural?.individualism || 0
  const collectivism = features.cultural?.collectivism || 0

  const individ = i_pronoun + achievement + individualism
  const collect = we_pronoun + family + collectivism
  const total = individ + collect

  // Only compute score if we have actual cultural markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // 0 = collectivist, 1 = individualist
  const rawScore = (individ - collect) / total

  return {
    score: Math.min(1, Math.max(0, 0.5 + rawScore * 0.3)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 10),
      consistency: 0.4,
    },
  }
}

function computeWorkCareerStyle(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Work/career style indicators (correct property names)
  const achievement = features.drives?.achievement || 0
  const power = features.drives?.power || 0
  const work = features.personal?.work || 0
  const money = features.personal?.money || 0

  const total = achievement + power + work + money

  // Only compute score if we have actual work/career markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  const rawScore = (total / wordCount) * 100

  return {
    score: Math.min(1, Math.max(0, rawScore / 4)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 5),
      consistency: 0.5,
    },
  }
}

function computeSensoryProcessing(
  features: Record<string, Record<string, number>>,
  wordCount: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Sensory processing indicators (correct property names)
  const see = features.perceptual?.see || 0
  const hear = features.perceptual?.hear || 0
  const feel = features.perceptual?.feel || 0

  // Sensory-specific features
  const visual = features.sensory?.visual_words || 0
  const auditory = features.sensory?.auditory_words || 0
  const kinesthetic = features.sensory?.kinesthetic_words || 0
  const olfactory = features.sensory?.olfactory_words || 0
  const gustatory = features.sensory?.gustatory_words || 0

  const total = see + hear + feel + visual + auditory + kinesthetic + olfactory + gustatory

  // Only compute score if we have actual sensory markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  const rawScore = (total / wordCount) * 100

  return {
    score: Math.min(1, Math.max(0, rawScore / 4)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 5),
      consistency: 0.5,
    },
  }
}

function computeAestheticPreferences(
  features: Record<string, Record<string, number>>,
  wordCount: number,
  vocabularyRichness: number
): DomainComputationResult {
  if (wordCount === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Aesthetic indicators: aesthetic-specific words, perceptual words
  const beauty = features.aesthetic?.beauty_words || 0
  const complexity = features.aesthetic?.complexity_preference || 0
  const novelty = features.aesthetic?.novelty_aesthetic || 0
  const see = features.perceptual?.see || 0

  const total = beauty + complexity + novelty + see

  // Only compute score if we have actual aesthetic markers
  if (total === 0) {
    return { score: 0.5, rawScore: 0, dataPointsCount: 0, confidenceFactors: { dataVolume: 0, consistency: 0 } }
  }

  // Base score from markers, with vocabulary richness as a modifier
  const markerScore = (total / wordCount) * 100
  const rawScore = markerScore * (1 + vocabularyRichness * 0.3)

  return {
    score: Math.min(1, Math.max(0, rawScore / 5)),
    rawScore,
    dataPointsCount: Math.ceil(total),
    confidenceFactors: {
      dataVolume: Math.min(1, total / 5),
      consistency: 0.5,
    },
  }
}

// ==================== STORE ANALYSIS RESULTS ====================

export async function analyzeAndStoreEnhanced(
  messageId: number,
  text: string,
  responseTimeMs?: number,
  sessionId?: string
): Promise<EnhancedAnalysisResult> {
  // Initialize all databases
  await initSqlDatabase()
  await initVectorDB()
  await initGraphDB()

  // Perform enhanced analysis
  const analysis = analyzeTextEnhanced(text)

  // Store all feature counts and matched words in SQL database
  for (const [category, subcategories] of Object.entries(analysis.features)) {
    for (const [featureName, count] of Object.entries(subcategories)) {
      if (count > 0) {
        await updateFeatureCount(category, featureName, count, analysis.wordCount)
        // Store matched words for this feature (for showing examples)
        const words = analysis.matchedWords[category]?.[featureName] || []
        if (words.length > 0) {
          await updateMatchedWords(category, featureName, words)
        }
      }
    }
  }

  // Store LIWC summary variables
  await updateFeatureCount('liwc_summary', 'analytical_thinking', 1, 1)
  await updateFeatureCount('liwc_summary', 'clout', 1, 1)
  await updateFeatureCount('liwc_summary', 'authenticity', 1, 1)
  await updateFeatureCount('liwc_summary', 'emotional_tone', 1, 1)

  // Update behavioral metrics
  await updateBehavioralMetric('avg_response_length_words', analysis.wordCount)
  await updateBehavioralMetric('avg_response_length_chars', text.length)
  await updateBehavioralMetric('avg_sentence_length', analysis.avgWordsPerSentence)
  await updateBehavioralMetric('avg_sentences_per_message', analysis.sentenceCount)
  await updateBehavioralMetric('question_ratio', analysis.behavioralMetrics.questionCount / Math.max(analysis.sentenceCount, 1))
  await updateBehavioralMetric('vocabulary_diversity_ttr', analysis.vocabularyRichness)
  await updateBehavioralMetric('avg_word_length', analysis.avgWordLength)

  if (responseTimeMs !== undefined) {
    await updateBehavioralMetric('avg_response_time_ms', responseTimeMs)
  }

  // Compute and update domain scores
  await computeAndStoreDomainScores(analysis)

  // Store message embedding in vector database
  try {
    await storeMessageEmbedding(messageId, text, {
      sessionId,
      timestamp: new Date(),
      role: 'user',
    })

    // Extract and store topics from message
    const topics = await extractAndStoreTopics(messageId, text)

    // Get domain scores for concept extraction
    const domainScores = await getDomainScores()
    const domainScoreMap: Record<string, number> = {}
    for (const score of domainScores) {
      domainScoreMap[score.domainId] = score.score
    }

    // Store concepts based on high-scoring domains
    await extractAndStoreConcepts(messageId, text, domainScoreMap)

    // Build knowledge graph relationships
    const userId = 'default_user' // In production, get from session
    await buildRelationshipsFromScores(userId, domainScoreMap, topics)
  } catch (error) {
    // Log but don't fail - vector/graph operations are secondary
    console.warn('Vector/graph storage warning:', error)
  }

  // Auto-snapshot for historical tracking (will only save if enough time has passed)
  await autoSnapshot(sessionId)

  saveDatabase()

  return analysis
}

async function computeAndStoreDomainScores(
  analysis: EnhancedAnalysisResult
): Promise<void> {
  const { features, wordCount, vocabularyRichness, avgWordsPerSentence } = analysis

  // Big Five Personality
  const openness = computeBigFiveOpenness(features, wordCount, vocabularyRichness)
  await updateDomainScore('big_five_openness', openness.score, openness.rawScore, openness.dataPointsCount)
  await updateConfidenceFactor('big_five_openness', 'data_volume', openness.confidenceFactors.dataVolume)

  const conscientiousness = computeBigFiveConscientiousness(features, wordCount)
  await updateDomainScore('big_five_conscientiousness', conscientiousness.score, conscientiousness.rawScore, conscientiousness.dataPointsCount)
  await updateConfidenceFactor('big_five_conscientiousness', 'data_volume', conscientiousness.confidenceFactors.dataVolume)

  const extraversion = computeBigFiveExtraversion(features, wordCount)
  await updateDomainScore('big_five_extraversion', extraversion.score, extraversion.rawScore, extraversion.dataPointsCount)
  await updateConfidenceFactor('big_five_extraversion', 'data_volume', extraversion.confidenceFactors.dataVolume)

  const agreeableness = computeBigFiveAgreeableness(features, wordCount)
  await updateDomainScore('big_five_agreeableness', agreeableness.score, agreeableness.rawScore, agreeableness.dataPointsCount)
  await updateConfidenceFactor('big_five_agreeableness', 'data_volume', agreeableness.confidenceFactors.dataVolume)

  const neuroticism = computeBigFiveNeuroticism(features, wordCount)
  await updateDomainScore('big_five_neuroticism', neuroticism.score, neuroticism.rawScore, neuroticism.dataPointsCount)
  await updateConfidenceFactor('big_five_neuroticism', 'data_volume', neuroticism.confidenceFactors.dataVolume)

  // Emotional Intelligence
  const emotionalIntelligence = computeEmotionalIntelligence(features, wordCount)
  await updateDomainScore('emotional_intelligence', emotionalIntelligence.score, emotionalIntelligence.rawScore, emotionalIntelligence.dataPointsCount)
  await updateConfidenceFactor('emotional_intelligence', 'data_volume', emotionalIntelligence.confidenceFactors.dataVolume)

  // Growth vs Fixed Mindset
  const mindset = computeGrowthMindset(features, wordCount)
  await updateDomainScore('mindset_growth_fixed', mindset.score, mindset.rawScore, mindset.dataPointsCount)
  await updateConfidenceFactor('mindset_growth_fixed', 'data_volume', mindset.confidenceFactors.dataVolume)

  // Time Perspective
  const timePerspective = computeTimePerspective(features, wordCount)
  await updateDomainScore('time_perspective', timePerspective.score, timePerspective.rawScore, timePerspective.dataPointsCount)
  await updateConfidenceFactor('time_perspective', 'data_volume', timePerspective.confidenceFactors.dataVolume)

  // Cognitive Abilities
  const cognitiveAbilities = computeCognitiveAbilities(features, wordCount, vocabularyRichness)
  await updateDomainScore('cognitive_abilities', cognitiveAbilities.score, cognitiveAbilities.rawScore, cognitiveAbilities.dataPointsCount)
  await updateConfidenceFactor('cognitive_abilities', 'data_volume', cognitiveAbilities.confidenceFactors.dataVolume)

  // Values & Motivations
  const valuesMotivations = computeValuesMotivations(features, wordCount)
  await updateDomainScore('values_motivations', valuesMotivations.score, valuesMotivations.rawScore, valuesMotivations.dataPointsCount)
  await updateConfidenceFactor('values_motivations', 'data_volume', valuesMotivations.confidenceFactors.dataVolume)

  // Moral Reasoning
  const moralReasoning = computeMoralReasoning(features, wordCount)
  await updateDomainScore('moral_reasoning', moralReasoning.score, moralReasoning.rawScore, moralReasoning.dataPointsCount)
  await updateConfidenceFactor('moral_reasoning', 'data_volume', moralReasoning.confidenceFactors.dataVolume)

  // Decision Making
  const decisionMaking = computeDecisionMaking(features, wordCount)
  await updateDomainScore('decision_making', decisionMaking.score, decisionMaking.rawScore, decisionMaking.dataPointsCount)
  await updateConfidenceFactor('decision_making', 'data_volume', decisionMaking.confidenceFactors.dataVolume)

  // Creativity
  const creativity = computeCreativity(features, wordCount, vocabularyRichness)
  await updateDomainScore('creativity', creativity.score, creativity.rawScore, creativity.dataPointsCount)
  await updateConfidenceFactor('creativity', 'data_volume', creativity.confidenceFactors.dataVolume)

  // Attachment Style
  const attachmentStyle = computeAttachmentStyle(features, wordCount)
  await updateDomainScore('attachment_style', attachmentStyle.score, attachmentStyle.rawScore, attachmentStyle.dataPointsCount)
  await updateConfidenceFactor('attachment_style', 'data_volume', attachmentStyle.confidenceFactors.dataVolume)

  // Learning Styles
  const learningStyles = computeLearningStyles(features, wordCount)
  await updateDomainScore('learning_styles', learningStyles.score, learningStyles.rawScore, learningStyles.dataPointsCount)
  await updateConfidenceFactor('learning_styles', 'data_volume', learningStyles.confidenceFactors.dataVolume)

  // Information Processing
  const informationProcessing = computeInformationProcessing(features, wordCount, avgWordsPerSentence)
  await updateDomainScore('information_processing', informationProcessing.score, informationProcessing.rawScore, informationProcessing.dataPointsCount)
  await updateConfidenceFactor('information_processing', 'data_volume', informationProcessing.confidenceFactors.dataVolume)

  // Metacognition
  const metacognition = computeMetacognition(features, wordCount)
  await updateDomainScore('metacognition', metacognition.score, metacognition.rawScore, metacognition.dataPointsCount)
  await updateConfidenceFactor('metacognition', 'data_volume', metacognition.confidenceFactors.dataVolume)

  // Executive Functions
  const executiveFunctions = computeExecutiveFunctions(features, wordCount)
  await updateDomainScore('executive_functions', executiveFunctions.score, executiveFunctions.rawScore, executiveFunctions.dataPointsCount)
  await updateConfidenceFactor('executive_functions', 'data_volume', executiveFunctions.confidenceFactors.dataVolume)

  // Communication Styles
  const communicationStyles = computeCommunicationStyles(features, wordCount, avgWordsPerSentence)
  await updateDomainScore('communication_styles', communicationStyles.score, communicationStyles.rawScore, communicationStyles.dataPointsCount)
  await updateConfidenceFactor('communication_styles', 'data_volume', communicationStyles.confidenceFactors.dataVolume)

  // Social Cognition
  const socialCognition = computeSocialCognition(features, wordCount)
  await updateDomainScore('social_cognition', socialCognition.score, socialCognition.rawScore, socialCognition.dataPointsCount)
  await updateConfidenceFactor('social_cognition', 'data_volume', socialCognition.confidenceFactors.dataVolume)

  // Resilience & Coping
  const resilienceCoping = computeResilienceCoping(features, wordCount)
  await updateDomainScore('resilience_coping', resilienceCoping.score, resilienceCoping.rawScore, resilienceCoping.dataPointsCount)
  await updateConfidenceFactor('resilience_coping', 'data_volume', resilienceCoping.confidenceFactors.dataVolume)

  // Political Ideology
  const politicalIdeology = computePoliticalIdeology(features, wordCount)
  await updateDomainScore('political_ideology', politicalIdeology.score, politicalIdeology.rawScore, politicalIdeology.dataPointsCount)
  await updateConfidenceFactor('political_ideology', 'data_volume', politicalIdeology.confidenceFactors.dataVolume)

  // Cultural Values
  const culturalValues = computeCulturalValues(features, wordCount)
  await updateDomainScore('cultural_values', culturalValues.score, culturalValues.rawScore, culturalValues.dataPointsCount)
  await updateConfidenceFactor('cultural_values', 'data_volume', culturalValues.confidenceFactors.dataVolume)

  // Work & Career Style
  const workCareerStyle = computeWorkCareerStyle(features, wordCount)
  await updateDomainScore('work_career_style', workCareerStyle.score, workCareerStyle.rawScore, workCareerStyle.dataPointsCount)
  await updateConfidenceFactor('work_career_style', 'data_volume', workCareerStyle.confidenceFactors.dataVolume)

  // Sensory Processing
  const sensoryProcessing = computeSensoryProcessing(features, wordCount)
  await updateDomainScore('sensory_processing', sensoryProcessing.score, sensoryProcessing.rawScore, sensoryProcessing.dataPointsCount)
  await updateConfidenceFactor('sensory_processing', 'data_volume', sensoryProcessing.confidenceFactors.dataVolume)

  // Aesthetic Preferences
  const aestheticPreferences = computeAestheticPreferences(features, wordCount, vocabularyRichness)
  await updateDomainScore('aesthetic_preferences', aestheticPreferences.score, aestheticPreferences.rawScore, aestheticPreferences.dataPointsCount)
  await updateConfidenceFactor('aesthetic_preferences', 'data_volume', aestheticPreferences.confidenceFactors.dataVolume)

  // Calculate final confidence for each domain
  await calculateDomainConfidence('big_five_openness')
  await calculateDomainConfidence('big_five_conscientiousness')
  await calculateDomainConfidence('big_five_extraversion')
  await calculateDomainConfidence('big_five_agreeableness')
  await calculateDomainConfidence('big_five_neuroticism')
  await calculateDomainConfidence('emotional_intelligence')
  await calculateDomainConfidence('mindset_growth_fixed')
  await calculateDomainConfidence('time_perspective')
  await calculateDomainConfidence('cognitive_abilities')
  await calculateDomainConfidence('values_motivations')
  await calculateDomainConfidence('moral_reasoning')
  await calculateDomainConfidence('decision_making')
  await calculateDomainConfidence('creativity')
  await calculateDomainConfidence('attachment_style')
  await calculateDomainConfidence('learning_styles')
  await calculateDomainConfidence('information_processing')
  await calculateDomainConfidence('metacognition')
  await calculateDomainConfidence('executive_functions')
  await calculateDomainConfidence('communication_styles')
  await calculateDomainConfidence('social_cognition')
  await calculateDomainConfidence('resilience_coping')
  await calculateDomainConfidence('political_ideology')
  await calculateDomainConfidence('cultural_values')
  await calculateDomainConfidence('work_career_style')
  await calculateDomainConfidence('sensory_processing')
  await calculateDomainConfidence('aesthetic_preferences')
}

// ==================== AGGREGATE FUNCTIONS ====================

export async function getEnhancedProfileSummary(): Promise<{
  domainScores: Awaited<ReturnType<typeof getDomainScores>>
  topFeatures: Awaited<ReturnType<typeof getFeatureCounts>>
  summaryVariables: LIWCSummaryVariables | null
}> {
  const domainScores = await getDomainScores()
  const allFeatures = await getFeatureCounts()

  // Get top 20 features by percentage
  const topFeatures = allFeatures.slice(0, 20)

  // Calculate aggregate summary variables from recent analyses
  // This would need more sophisticated aggregation in production
  const summaryVariables: LIWCSummaryVariables | null = null

  return {
    domainScores,
    topFeatures,
    summaryVariables,
  }
}
