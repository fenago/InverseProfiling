/**
 * Trait Prototype Embeddings
 * Pre-computed prototype embeddings for semantic similarity scoring
 *
 * Each domain has multiple representative text samples that capture
 * the essence of that psychological trait. These are embedded and
 * compared against user messages for similarity scoring.
 */

import { generateEmbedding } from './vectordb'
import type { PsychologicalDomain } from './analysis-config'
import { PSYCHOLOGICAL_DOMAINS } from './analysis-config'

/**
 * Representative text samples for each psychological domain
 * Based on linguistic markers from Fine-Tuned-Psychometrics.md PRD
 * Multiple samples per domain to capture different expressions of the trait
 */
export const TRAIT_PROTOTYPE_TEXTS: Record<PsychologicalDomain, string[]> = {
  // Category A: Core Personality - Big Five (Domains 1-5)
  big_five_openness: [
    'I love exploring new ideas and creative possibilities',
    'Art and beauty deeply move me emotionally',
    'I enjoy thinking about abstract concepts and theories',
    'I am curious about many different things',
    'I have a vivid imagination and rich fantasy life',
  ],
  big_five_conscientiousness: [
    'I always follow through on my commitments and plans',
    'I like to keep things organized and orderly',
    'I pay attention to details and rarely make mistakes',
    'I set goals and work systematically toward them',
    'I am reliable and can always be counted on',
  ],
  big_five_extraversion: [
    'I feel energized when Im around other people',
    'I enjoy being the center of attention at parties',
    'I talk a lot and share my thoughts openly',
    'I make friends easily and enjoy meeting new people',
    'I am enthusiastic and full of positive energy',
  ],
  big_five_agreeableness: [
    'I genuinely care about other peoples well-being',
    'I try to help others whenever I can',
    'I believe most people are fundamentally good',
    'I prefer cooperation over competition',
    'I forgive easily and dont hold grudges',
  ],
  big_five_neuroticism: [
    'I often feel anxious and worry about things',
    'I get stressed easily in difficult situations',
    'My mood changes frequently throughout the day',
    'I often feel sad or down without a clear reason',
    'I am sensitive to criticism and take things personally',
  ],

  // Category B: Dark Personality (Domains 6-8)
  dark_triad_narcissism: [
    'I deserve special treatment and recognition',
    'I am exceptional and better than most people',
    'I expect others to admire and appreciate me',
    'My needs and desires should come first',
    'I am entitled to success and privileges',
  ],
  dark_triad_machiavellianism: [
    'The ends justify the means in achieving goals',
    'I know how to manipulate situations to my advantage',
    'Strategic thinking and cunning are valuable skills',
    'Trust must be earned and should not be given freely',
    'Playing the game is necessary to get ahead',
  ],
  dark_triad_psychopathy: [
    'I dont really care about others feelings',
    'I feel little guilt or remorse for my actions',
    'Rules are meant to be broken when convenient',
    'I am impulsive and seek immediate gratification',
    'Other peoples problems are not my concern',
  ],

  // Category C: Emotional/Social Intelligence (Domains 9-13)
  emotional_empathy: [
    'I can feel what others are going through emotionally',
    'I put myself in other peoples shoes easily',
    'Other peoples pain affects me deeply',
    'I understand emotions even when not expressed',
    'I respond compassionately to others struggles',
  ],
  emotional_intelligence: [
    'I can identify and name emotions accurately in myself and others',
    'I use my emotions to guide my thinking and decisions',
    'I understand how emotions influence behavior',
    'I manage my emotional reactions effectively',
    'I can help others work through their emotional states',
  ],
  attachment_style: [
    'I feel comfortable depending on others and having them depend on me',
    'I find it easy to get close to people',
    'I dont worry about being abandoned or unloved',
    'I trust that my close relationships will be there for me',
    'I feel secure in my romantic and close relationships',
  ],
  love_languages: [
    'Words of affirmation make me feel loved and appreciated',
    'Quality time together is most meaningful to me',
    'I show love through acts of service and helping',
    'Physical touch and affection are important to me',
    'Receiving thoughtful gifts makes me feel valued and cared for',
  ],
  communication_style: [
    'I communicate directly and take charge in conversations',
    'I am enthusiastic and expressive when I communicate',
    'I focus on being accurate and detailed in what I say',
    'I prefer harmonious and supportive communication',
    'I adapt my communication style to different situations',
  ],

  // Category D: Decision Making & Motivation (Domains 14-20)
  risk_tolerance: [
    'I enjoy taking calculated risks for potential rewards',
    'I prefer certainty and security over risky opportunities',
    'I weigh probabilities carefully before making risky decisions',
    'I am comfortable with uncertainty and ambiguity',
    'I consider the potential upside and downside before acting',
  ],
  decision_style: [
    'I analyze all options systematically before deciding',
    'I trust my gut feeling when making decisions',
    'I consider logical consequences of each choice',
    'My intuition guides me to the right answer',
    'I evaluate decisions based on data and evidence',
  ],
  time_orientation: [
    'I focus on the present moment and enjoy it fully',
    'I plan ahead and think about future consequences',
    'I often reflect on past experiences and lessons learned',
    'I balance short-term pleasures with long-term goals',
    'I believe in delayed gratification for better outcomes',
  ],
  achievement_motivation: [
    'I am driven to succeed and accomplish challenging goals',
    'I set high standards for myself and strive to excel',
    'I feel satisfied when I outperform expectations',
    'I take pride in my accomplishments and achievements',
    'I am motivated by mastery and personal growth',
  ],
  self_efficacy: [
    'I believe I can accomplish what I set out to do',
    'I am confident in my ability to handle challenges',
    'I can figure out solutions to most problems I face',
    'My skills and abilities are sufficient for my goals',
    'I trust in my capacity to succeed at new tasks',
  ],
  locus_of_control: [
    'I believe I am in control of my own destiny',
    'My success depends on my own efforts and choices',
    'I can change my circumstances through hard work',
    'External factors like luck determine many outcomes',
    'What happens to me is largely within my control',
  ],
  growth_mindset: [
    'I believe abilities can be developed through effort',
    'Challenges are opportunities to learn and grow',
    'I embrace failure as part of the learning process',
    'Intelligence and talent can be improved over time',
    'I persist in the face of setbacks and difficulties',
  ],

  // Category E: Values & Wellbeing (Domains 21-26)
  personal_values: [
    'Self-direction and independence are important to me',
    'I value achievement and success in what I do',
    'Security and stability matter greatly to me',
    'I care about benevolence and helping those close to me',
    'Universalism and caring for all people is important',
  ],
  interests: [
    'I enjoy realistic hands-on and practical activities',
    'I am drawn to investigative and analytical work',
    'I have artistic and creative interests',
    'I enjoy social activities involving helping others',
    'I am interested in enterprising and leadership roles',
  ],
  life_satisfaction: [
    'I am satisfied with my life overall',
    'My life is close to my ideal in most ways',
    'I have gotten the important things I want in life',
    'If I could live my life over I would change little',
    'The conditions of my life are excellent',
  ],
  stress_coping: [
    'I use problem-focused strategies to deal with stress',
    'I seek emotional support when facing difficulties',
    'I try to see positive aspects in stressful situations',
    'I take active steps to address sources of stress',
    'I use healthy coping mechanisms when under pressure',
  ],
  social_support: [
    'I have people I can count on when I need help',
    'I feel supported and cared for by others',
    'I can talk to friends about my problems',
    'I have a strong network of relationships',
    'People are there for me when things get tough',
  ],
  authenticity: [
    'I am true to myself and my values',
    'I dont pretend to be someone Im not',
    'I act in accordance with my real feelings',
    'I am genuine and honest in my interactions',
    'Being authentic is more important than fitting in',
  ],

  // Category F: Cognitive/Learning (Domains 27-32)
  cognitive_abilities: [
    'I am good at understanding and using language',
    'I can work with numbers and mathematical concepts well',
    'I have strong spatial reasoning and visualization skills',
    'I learn new concepts and information quickly',
    'I can analyze and solve complex problems effectively',
  ],
  creativity: [
    'I come up with original and innovative ideas',
    'I think outside the box and challenge conventions',
    'I enjoy brainstorming and creative problem-solving',
    'I see possibilities where others see obstacles',
    'Imagination is one of my greatest strengths',
  ],
  learning_styles: [
    'I learn best by seeing visual information and diagrams',
    'I prefer learning through listening and discussion',
    'I learn by reading and writing about topics',
    'I learn best through hands-on experience and practice',
    'I use multiple learning approaches depending on the topic',
  ],
  information_processing: [
    'I analyze information deeply and thoroughly',
    'I consider multiple perspectives before concluding',
    'I look for nuance and complexity in information',
    'I process information quickly and efficiently',
    'I think carefully about implications and connections',
  ],
  metacognition: [
    'I am aware of my own thinking processes',
    'I monitor my understanding as I learn',
    'I reflect on my reasoning and thought patterns',
    'I adjust my strategies when they arent working',
    'I know my cognitive strengths and weaknesses',
  ],
  executive_functions: [
    'I can plan and organize my activities effectively',
    'I inhibit impulses and think before acting',
    'I can shift between tasks and perspectives flexibly',
    'I keep information in mind while working on tasks',
    'I manage my time and resources efficiently',
  ],

  // Category G: Social/Cultural/Values (Domains 33-37)
  social_cognition: [
    'I understand what others are thinking and feeling',
    'I can read social situations and dynamics well',
    'I pick up on nonverbal cues and body language',
    'I understand why people behave the way they do',
    'I can take others perspectives easily',
  ],
  political_ideology: [
    'I value tradition and respect for authority',
    'I believe in social change and progress',
    'I care about fairness and equality for all',
    'I think loyalty to ones group is important',
    'I believe in both individual rights and social responsibility',
  ],
  cultural_values: [
    'I value individual achievement and independence',
    'I believe in the importance of group harmony',
    'I respect hierarchy and authority structures',
    'I value equality and egalitarian relationships',
    'I balance individual and collective concerns',
  ],
  moral_reasoning: [
    'I think about right and wrong in terms of principles',
    'I consider the consequences of actions for everyone',
    'I believe in universal ethical standards',
    'I reason about moral dilemmas carefully',
    'I try to act according to my moral values',
  ],
  work_career_style: [
    'I value expertise and technical competence in my work',
    'I aspire to leadership and management roles',
    'I prioritize work-life balance and flexibility',
    'I seek security and stability in my career',
    'I want my work to make a difference and help others',
  ],

  // Category H: Sensory/Aesthetic (Domains 38-39)
  sensory_processing: [
    'I am highly sensitive to sensory stimulation',
    'I notice subtle details in my environment',
    'Loud noises or bright lights can overwhelm me',
    'I have strong reactions to textures and physical sensations',
    'I process sensory information deeply and thoroughly',
  ],
  aesthetic_preferences: [
    'I appreciate beauty in art, music, and nature',
    'I have strong preferences for certain styles and designs',
    'I am moved by aesthetic experiences',
    'I notice and value visual harmony and composition',
    'I find meaning and pleasure in artistic expression',
  ],
}

// Cache for computed prototype embeddings
let prototypeEmbeddingsCache: Map<PsychologicalDomain, number[][]> | null = null
let averagePrototypeCache: Map<PsychologicalDomain, number[]> | null = null
let isGeneratingPrototypes = false

/**
 * Generate and cache embeddings for all trait prototypes
 * Call this during app initialization for best performance
 */
export async function generateTraitPrototypes(): Promise<Map<PsychologicalDomain, number[][]>> {
  if (prototypeEmbeddingsCache) {
    return prototypeEmbeddingsCache
  }

  if (isGeneratingPrototypes) {
    // Wait for ongoing generation
    while (isGeneratingPrototypes) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return prototypeEmbeddingsCache || new Map()
  }

  isGeneratingPrototypes = true
  console.log('Generating trait prototype embeddings...')

  const cache = new Map<PsychologicalDomain, number[][]>()
  const avgCache = new Map<PsychologicalDomain, number[]>()

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const texts = TRAIT_PROTOTYPE_TEXTS[domain]
    const embeddings: number[][] = []

    for (const text of texts) {
      const embedding = await generateEmbedding(text)
      if (embedding) {
        embeddings.push(embedding)
      }
    }

    if (embeddings.length > 0) {
      cache.set(domain, embeddings)

      // Compute average embedding for this domain
      const avgEmbedding = computeAverageEmbedding(embeddings)
      avgCache.set(domain, avgEmbedding)
    }
  }

  prototypeEmbeddingsCache = cache
  averagePrototypeCache = avgCache
  isGeneratingPrototypes = false

  console.log(`Generated prototype embeddings for ${cache.size} domains`)
  return cache
}

/**
 * Get average prototype embeddings (one per domain)
 * More efficient for similarity computation
 */
export async function getAveragePrototypes(): Promise<Map<PsychologicalDomain, number[]>> {
  if (averagePrototypeCache) {
    return averagePrototypeCache
  }

  await generateTraitPrototypes()
  return averagePrototypeCache || new Map()
}

/**
 * Compute average of multiple embeddings
 */
function computeAverageEmbedding(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return []
  if (embeddings.length === 1) return embeddings[0]

  const dim = embeddings[0].length
  const avg = new Array(dim).fill(0)

  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += emb[i]
    }
  }

  for (let i = 0; i < dim; i++) {
    avg[i] /= embeddings.length
  }

  // Normalize the average vector
  const norm = Math.sqrt(avg.reduce((sum, v) => sum + v * v, 0))
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      avg[i] /= norm
    }
  }

  return avg
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Compute similarity between text and a specific domain
 * Uses average prototype embedding for efficiency
 */
export async function computeTraitSimilarity(
  textEmbedding: number[],
  domain: PsychologicalDomain
): Promise<number> {
  const avgPrototypes = await getAveragePrototypes()
  const prototypeEmbedding = avgPrototypes.get(domain)

  if (!prototypeEmbedding) {
    return 0
  }

  return cosineSimilarity(textEmbedding, prototypeEmbedding)
}

/**
 * Compute similarity scores for text against all domains
 * Returns normalized scores (0-1) for each domain
 */
export async function computeAllTraitSimilarities(
  text: string
): Promise<Record<PsychologicalDomain, number>> {
  const embedding = await generateEmbedding(text)

  if (!embedding) {
    // Return zeros if embedding generation failed
    const result: Partial<Record<PsychologicalDomain, number>> = {}
    for (const domain of PSYCHOLOGICAL_DOMAINS) {
      result[domain] = 0
    }
    return result as Record<PsychologicalDomain, number>
  }

  return computeAllTraitSimilaritiesFromEmbedding(embedding)
}

/**
 * Compute similarity scores from a pre-computed embedding
 * More efficient when embedding is already available
 */
export async function computeAllTraitSimilaritiesFromEmbedding(
  textEmbedding: number[]
): Promise<Record<PsychologicalDomain, number>> {
  const avgPrototypes = await getAveragePrototypes()
  const result: Partial<Record<PsychologicalDomain, number>> = {}

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const prototypeEmbedding = avgPrototypes.get(domain)
    if (prototypeEmbedding) {
      // Cosine similarity returns -1 to 1, normalize to 0-1
      const similarity = cosineSimilarity(textEmbedding, prototypeEmbedding)
      result[domain] = (similarity + 1) / 2 // Normalize to 0-1
    } else {
      result[domain] = 0
    }
  }

  return result as Record<PsychologicalDomain, number>
}

/**
 * Get top N most similar domains for a text
 */
export async function getTopSimilarDomains(
  text: string,
  topN: number = 5
): Promise<Array<{ domain: PsychologicalDomain; similarity: number }>> {
  const similarities = await computeAllTraitSimilarities(text)

  const sorted = Object.entries(similarities)
    .map(([domain, similarity]) => ({
      domain: domain as PsychologicalDomain,
      similarity,
    }))
    .sort((a, b) => b.similarity - a.similarity)

  return sorted.slice(0, topN)
}

/**
 * Check if prototype cache is ready
 */
export function isPrototypeCacheReady(): boolean {
  return prototypeEmbeddingsCache !== null && averagePrototypeCache !== null
}

/**
 * Clear prototype cache (for testing or memory management)
 */
export function clearPrototypeCache(): void {
  prototypeEmbeddingsCache = null
  averagePrototypeCache = null
}
