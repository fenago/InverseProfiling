import { db, logActivity, type PersonalityTrait } from './db'
import { getAggregateAnalysis, type AnalysisResult } from './analyzer'

// Big Five personality traits
export type TraitName =
  | 'openness'
  | 'conscientiousness'
  | 'extraversion'
  | 'agreeableness'
  | 'neuroticism'

export interface TraitIndicators {
  openness: {
    vocabularyRichness: number // Higher = more open
    cognitiveComplexity: number // Higher = more open
    insightWords: number // Higher = more open
  }
  conscientiousness: {
    avgWordsPerSentence: number // Balanced = more conscientious
    tentativeWords: number // Lower = more conscientious
    causationWords: number // Higher = more conscientious
  }
  extraversion: {
    wePronouns: number // Higher = more extraverted
    youPronouns: number // Higher = more extraverted
    socialReferences: number // Higher = more extraverted
    positiveEmotions: number // Higher = more extraverted
  }
  agreeableness: {
    positiveEmotions: number // Higher = more agreeable
    negativeEmotions: number // Lower = more agreeable
    youPronouns: number // Higher = more agreeable
    familyReferences: number // Higher = more agreeable
  }
  neuroticism: {
    negativeEmotions: number // Higher = more neurotic
    anxietyWords: number // Higher = more neurotic
    iPronouns: number // Higher = more neurotic
    tentativeWords: number // Higher = more neurotic
  }
}

// Calculate confidence based on sample size
function calculateConfidence(sampleSize: number): number {
  // Confidence increases with sample size, plateaus around 100 samples
  return Math.min(0.95, 0.3 + 0.65 * (1 - Math.exp(-sampleSize / 30)))
}

// Normalize a value to 0-100 scale
function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}

export function calculateTraitScores(
  analysis: AnalysisResult,
  sampleSize: number
): Record<TraitName, { score: number; confidence: number }> {
  const wordCount = Math.max(analysis.wordCount, 1)

  // Calculate normalized metrics
  const metrics = {
    vocabularyRichness: analysis.vocabularyRichness,
    cognitiveComplexity: analysis.cognitiveComplexity,
    avgWordsPerSentence: analysis.avgWordsPerSentence,
    emotionalTone: analysis.emotionalTone,

    // Per-word frequencies
    iFreq: analysis.categories.pronouns.i / wordCount,
    weFreq: analysis.categories.pronouns.we / wordCount,
    youFreq: analysis.categories.pronouns.you / wordCount,

    positiveFreq: analysis.categories.emotions.positive / wordCount,
    negativeFreq: analysis.categories.emotions.negative / wordCount,
    anxietyFreq: analysis.categories.emotions.anxiety / wordCount,

    insightFreq: analysis.categories.cognitive.insight / wordCount,
    causationFreq: analysis.categories.cognitive.causation / wordCount,
    tentativeFreq: analysis.categories.cognitive.tentative / wordCount,

    familyFreq: analysis.categories.social.family / wordCount,
    friendsFreq: analysis.categories.social.friends / wordCount,
    humansFreq: analysis.categories.social.humans / wordCount,
  }

  const socialFreq = metrics.familyFreq + metrics.friendsFreq + metrics.humansFreq

  const confidence = calculateConfidence(sampleSize)

  return {
    openness: {
      score: normalize(
        metrics.vocabularyRichness * 0.4 +
          metrics.cognitiveComplexity * 0.4 +
          metrics.insightFreq * 20 * 0.2,
        0,
        1
      ),
      confidence,
    },
    conscientiousness: {
      score: normalize(
        (1 - Math.abs(metrics.avgWordsPerSentence - 15) / 15) * 0.3 +
          (1 - metrics.tentativeFreq * 50) * 0.3 +
          metrics.causationFreq * 50 * 0.4,
        0,
        1
      ),
      confidence,
    },
    extraversion: {
      score: normalize(
        metrics.weFreq * 50 * 0.2 +
          metrics.youFreq * 50 * 0.2 +
          socialFreq * 30 * 0.3 +
          metrics.positiveFreq * 30 * 0.3,
        0,
        1
      ),
      confidence,
    },
    agreeableness: {
      score: normalize(
        metrics.positiveFreq * 30 * 0.3 +
          (1 - metrics.negativeFreq * 30) * 0.3 +
          metrics.youFreq * 50 * 0.2 +
          metrics.familyFreq * 100 * 0.2,
        0,
        1
      ),
      confidence,
    },
    neuroticism: {
      score: normalize(
        metrics.negativeFreq * 30 * 0.3 +
          metrics.anxietyFreq * 50 * 0.3 +
          metrics.iFreq * 20 * 0.2 +
          metrics.tentativeFreq * 50 * 0.2,
        0,
        1
      ),
      confidence,
    },
  }
}

export async function updatePersonalityProfile(): Promise<PersonalityTrait[]> {
  const analysis = await getAggregateAnalysis()

  if (!analysis) {
    return []
  }

  const messageCount = await db.messages.where('role').equals('user').count()
  const scores = calculateTraitScores(analysis, messageCount)

  const traits: PersonalityTrait[] = []

  for (const [traitName, data] of Object.entries(scores)) {
    const trait = traitName as TraitName
    const existing = await db.personalityTraits
      .where('trait')
      .equals(trait)
      .first()

    if (existing) {
      // Update existing trait
      const history = existing.history || []
      history.push({ score: data.score, timestamp: new Date() })

      // Keep last 100 history entries
      if (history.length > 100) {
        history.shift()
      }

      await db.personalityTraits.update(existing.id!, {
        score: data.score,
        confidence: data.confidence,
        sampleSize: messageCount,
        lastUpdated: new Date(),
        history,
      })

      traits.push({
        ...existing,
        score: data.score,
        confidence: data.confidence,
        sampleSize: messageCount,
        lastUpdated: new Date(),
        history,
      })
    } else {
      // Create new trait
      const newTrait: PersonalityTrait = {
        trait,
        score: data.score,
        confidence: data.confidence,
        sampleSize: messageCount,
        lastUpdated: new Date(),
        history: [{ score: data.score, timestamp: new Date() }],
      }

      const id = await db.personalityTraits.add(newTrait)
      traits.push({ ...newTrait, id })
    }
  }

  await logActivity('profile_update', 'Updated Big Five personality profile', {
    traits: traits.map((t) => ({
      name: t.trait,
      score: t.score.toFixed(1),
      confidence: (t.confidence * 100).toFixed(0) + '%',
    })),
  })

  return traits
}

export async function getPersonalityTraits(): Promise<PersonalityTrait[]> {
  return db.personalityTraits.toArray()
}

export function getTraitDescription(trait: TraitName, score: number): string {
  const descriptions: Record<TraitName, { low: string; high: string }> = {
    openness: {
      low: 'Practical, conventional, prefers routine',
      high: 'Creative, curious, open to new experiences',
    },
    conscientiousness: {
      low: 'Flexible, spontaneous, adaptable',
      high: 'Organized, disciplined, goal-oriented',
    },
    extraversion: {
      low: 'Reserved, introspective, prefers solitude',
      high: 'Outgoing, energetic, seeks social interaction',
    },
    agreeableness: {
      low: 'Direct, competitive, skeptical',
      high: 'Cooperative, trusting, helpful',
    },
    neuroticism: {
      low: 'Emotionally stable, calm, resilient',
      high: 'Emotionally sensitive, prone to stress',
    },
  }

  if (score < 40) return descriptions[trait].low
  if (score > 60) return descriptions[trait].high
  return 'Balanced between both tendencies'
}
