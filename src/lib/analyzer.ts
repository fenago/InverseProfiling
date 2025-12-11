import { db, logActivity, type LinguisticAnalysis } from './db'

// LIWC-inspired word categories
const WORD_CATEGORIES = {
  // Pronouns
  pronouns: {
    i: ['i', 'me', 'my', 'mine', 'myself'],
    we: ['we', 'us', 'our', 'ours', 'ourselves'],
    you: ['you', 'your', 'yours', 'yourself', 'yourselves'],
  },
  // Emotions
  emotions: {
    positive: [
      'happy', 'joy', 'love', 'wonderful', 'great', 'amazing', 'excellent',
      'good', 'fantastic', 'beautiful', 'excited', 'grateful', 'thankful',
      'pleased', 'delighted', 'glad', 'cheerful', 'optimistic', 'hopeful',
    ],
    negative: [
      'sad', 'angry', 'hate', 'terrible', 'awful', 'bad', 'horrible',
      'upset', 'frustrated', 'annoyed', 'disappointed', 'worried', 'scared',
      'fear', 'anxious', 'stressed', 'depressed', 'lonely', 'hurt',
    ],
    anxiety: [
      'worried', 'nervous', 'anxious', 'stress', 'panic', 'fear', 'scared',
      'tense', 'uneasy', 'overwhelmed', 'dread', 'apprehensive',
    ],
  },
  // Cognitive processes
  cognitive: {
    insight: [
      'think', 'know', 'consider', 'understand', 'realize', 'believe',
      'feel', 'sense', 'thought', 'idea', 'concept', 'notion',
    ],
    causation: [
      'because', 'cause', 'effect', 'hence', 'therefore', 'thus',
      'consequently', 'result', 'reason', 'why', 'leads', 'creates',
    ],
    tentative: [
      'maybe', 'perhaps', 'might', 'possibly', 'probably', 'seems',
      'appears', 'guess', 'suppose', 'wonder', 'uncertain', 'unclear',
    ],
  },
  // Social references
  social: {
    family: [
      'mom', 'dad', 'mother', 'father', 'parent', 'parents', 'sister',
      'brother', 'family', 'son', 'daughter', 'child', 'children',
      'grandma', 'grandpa', 'grandmother', 'grandfather', 'aunt', 'uncle',
    ],
    friends: [
      'friend', 'friends', 'buddy', 'pal', 'companion', 'mate',
      'colleague', 'coworker', 'neighbor', 'acquaintance',
    ],
    humans: [
      'person', 'people', 'human', 'humans', 'someone', 'anyone',
      'everyone', 'nobody', 'somebody', 'individual', 'group', 'team',
    ],
  },
}

// Complexity indicators
const COMPLEX_WORDS = [
  'notwithstanding', 'nevertheless', 'consequently', 'furthermore',
  'subsequently', 'alternatively', 'approximately', 'simultaneously',
  'predominantly', 'fundamentally', 'comprehensive', 'sophisticated',
]

export interface AnalysisResult {
  wordCount: number
  sentenceCount: number
  avgWordsPerSentence: number
  vocabularyRichness: number
  emotionalTone: number // -1 to 1 scale
  cognitiveComplexity: number // 0 to 1 scale
  categories: {
    pronouns: { i: number; we: number; you: number }
    emotions: { positive: number; negative: number; anxiety: number }
    cognitive: { insight: number; causation: number; tentative: number }
    social: { family: number; friends: number; humans: number }
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0)
}

function countSentences(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  return Math.max(sentences.length, 1)
}

function countCategoryWords(words: string[], categoryWords: string[]): number {
  return words.filter((word) => categoryWords.includes(word)).length
}

export function analyzeText(text: string): AnalysisResult {
  const words = tokenize(text)
  const wordCount = words.length
  const sentenceCount = countSentences(text)
  const uniqueWords = new Set(words)

  // Calculate vocabulary richness (type-token ratio)
  const vocabularyRichness = wordCount > 0 ? uniqueWords.size / wordCount : 0

  // Count category occurrences
  const categories = {
    pronouns: {
      i: countCategoryWords(words, WORD_CATEGORIES.pronouns.i),
      we: countCategoryWords(words, WORD_CATEGORIES.pronouns.we),
      you: countCategoryWords(words, WORD_CATEGORIES.pronouns.you),
    },
    emotions: {
      positive: countCategoryWords(words, WORD_CATEGORIES.emotions.positive),
      negative: countCategoryWords(words, WORD_CATEGORIES.emotions.negative),
      anxiety: countCategoryWords(words, WORD_CATEGORIES.emotions.anxiety),
    },
    cognitive: {
      insight: countCategoryWords(words, WORD_CATEGORIES.cognitive.insight),
      causation: countCategoryWords(words, WORD_CATEGORIES.cognitive.causation),
      tentative: countCategoryWords(words, WORD_CATEGORIES.cognitive.tentative),
    },
    social: {
      family: countCategoryWords(words, WORD_CATEGORIES.social.family),
      friends: countCategoryWords(words, WORD_CATEGORIES.social.friends),
      humans: countCategoryWords(words, WORD_CATEGORIES.social.humans),
    },
  }

  // Calculate emotional tone (-1 to 1)
  const positiveCount = categories.emotions.positive
  const negativeCount = categories.emotions.negative
  const totalEmotional = positiveCount + negativeCount
  const emotionalTone =
    totalEmotional > 0
      ? (positiveCount - negativeCount) / totalEmotional
      : 0

  // Calculate cognitive complexity (0 to 1)
  const complexWordCount = words.filter((word) =>
    COMPLEX_WORDS.includes(word)
  ).length
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / Math.max(wordCount, 1)
  const cognitiveScore =
    (categories.cognitive.insight +
      categories.cognitive.causation +
      complexWordCount * 2) /
    Math.max(wordCount, 1)
  const cognitiveComplexity = Math.min(
    (cognitiveScore * 10 + avgWordLength / 10) / 2,
    1
  )

  return {
    wordCount,
    sentenceCount,
    avgWordsPerSentence: wordCount / sentenceCount,
    vocabularyRichness,
    emotionalTone,
    cognitiveComplexity,
    categories,
  }
}

export async function analyzeAndStore(
  messageId: number,
  text: string
): Promise<LinguisticAnalysis> {
  const analysis = analyzeText(text)

  const record: LinguisticAnalysis = {
    messageId,
    timestamp: new Date(),
    metrics: analysis,
  }

  const id = await db.linguisticAnalyses.add(record)

  await logActivity('analysis', `Linguistic analysis completed for message ${messageId}`, {
    wordCount: analysis.wordCount,
    emotionalTone: analysis.emotionalTone.toFixed(2),
    cognitiveComplexity: analysis.cognitiveComplexity.toFixed(2),
  })

  return { ...record, id }
}

export async function getAggregateAnalysis(): Promise<AnalysisResult | null> {
  const analyses = await db.linguisticAnalyses.toArray()

  if (analyses.length === 0) return null

  // Aggregate all analyses
  const aggregate: AnalysisResult = {
    wordCount: 0,
    sentenceCount: 0,
    avgWordsPerSentence: 0,
    vocabularyRichness: 0,
    emotionalTone: 0,
    cognitiveComplexity: 0,
    categories: {
      pronouns: { i: 0, we: 0, you: 0 },
      emotions: { positive: 0, negative: 0, anxiety: 0 },
      cognitive: { insight: 0, causation: 0, tentative: 0 },
      social: { family: 0, friends: 0, humans: 0 },
    },
  }

  for (const analysis of analyses) {
    const m = analysis.metrics
    aggregate.wordCount += m.wordCount
    aggregate.sentenceCount += m.sentenceCount
    aggregate.vocabularyRichness += m.vocabularyRichness
    aggregate.emotionalTone += m.emotionalTone
    aggregate.cognitiveComplexity += m.cognitiveComplexity

    aggregate.categories.pronouns.i += m.categories.pronouns.i
    aggregate.categories.pronouns.we += m.categories.pronouns.we
    aggregate.categories.pronouns.you += m.categories.pronouns.you

    aggregate.categories.emotions.positive += m.categories.emotions.positive
    aggregate.categories.emotions.negative += m.categories.emotions.negative
    aggregate.categories.emotions.anxiety += m.categories.emotions.anxiety

    aggregate.categories.cognitive.insight += m.categories.cognitive.insight
    aggregate.categories.cognitive.causation += m.categories.cognitive.causation
    aggregate.categories.cognitive.tentative += m.categories.cognitive.tentative

    aggregate.categories.social.family += m.categories.social.family
    aggregate.categories.social.friends += m.categories.social.friends
    aggregate.categories.social.humans += m.categories.social.humans
  }

  const count = analyses.length
  aggregate.avgWordsPerSentence = aggregate.wordCount / Math.max(aggregate.sentenceCount, 1)
  aggregate.vocabularyRichness /= count
  aggregate.emotionalTone /= count
  aggregate.cognitiveComplexity /= count

  return aggregate
}
