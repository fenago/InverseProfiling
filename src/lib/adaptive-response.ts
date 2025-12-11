/**
 * Adaptive Response Generation System
 *
 * Generates dynamic system prompts and adaptation guidelines based on the user's
 * psychological profile. This enables the AI to tailor its communication style,
 * explanation depth, emotional tone, and interaction patterns to match the user.
 */

import { getPersonalityTraits, type TraitName } from './personality'
import { getEnhancedProfileSummary } from './enhanced-analyzer'
import { getDomainScores, getBehavioralMetrics } from './sqldb'

// Types for adaptive response system
export interface AdaptationProfile {
  // Communication style adaptations
  communicationStyle: {
    formality: 'casual' | 'balanced' | 'formal'
    verbosity: 'concise' | 'moderate' | 'detailed'
    emotionalTone: 'warm' | 'neutral' | 'analytical'
    questioningStyle: 'socratic' | 'direct' | 'explorative'
  }

  // Explanation adaptations
  explanationStyle: {
    complexity: 'simple' | 'moderate' | 'advanced'
    useAnalogies: boolean
    useExamples: boolean
    structurePreference: 'narrative' | 'bullet-points' | 'hybrid'
  }

  // Emotional support adaptations
  emotionalSupport: {
    validationLevel: 'high' | 'moderate' | 'minimal'
    challengeLevel: 'gentle' | 'moderate' | 'direct'
    encouragementFrequency: 'frequent' | 'occasional' | 'minimal'
  }

  // Cognitive engagement
  cognitiveEngagement: {
    abstractionLevel: 'concrete' | 'balanced' | 'abstract'
    noveltyPreference: 'familiar' | 'balanced' | 'novel'
    depthPreference: 'surface' | 'moderate' | 'deep'
  }

  // Profile confidence
  confidence: number
  dataPointsUsed: number
}

// Default profile for new users with minimal data
const DEFAULT_ADAPTATION: AdaptationProfile = {
  communicationStyle: {
    formality: 'balanced',
    verbosity: 'moderate',
    emotionalTone: 'warm',
    questioningStyle: 'explorative',
  },
  explanationStyle: {
    complexity: 'moderate',
    useAnalogies: true,
    useExamples: true,
    structurePreference: 'hybrid',
  },
  emotionalSupport: {
    validationLevel: 'moderate',
    challengeLevel: 'gentle',
    encouragementFrequency: 'occasional',
  },
  cognitiveEngagement: {
    abstractionLevel: 'balanced',
    noveltyPreference: 'balanced',
    depthPreference: 'moderate',
  },
  confidence: 0,
  dataPointsUsed: 0,
}

/**
 * Generate an adaptation profile based on user's psychological data
 */
export async function generateAdaptationProfile(): Promise<AdaptationProfile> {
  try {
    // Fetch all available profile data
    const [traits, domainScores, behavioralMetrics, enhancedProfile] = await Promise.all([
      getPersonalityTraits(),
      getDomainScores(),
      getBehavioralMetrics(),
      getEnhancedProfileSummary().catch(() => null),
    ])

    // Check if we have enough data
    const totalDataPoints = traits.length + domainScores.length + (behavioralMetrics ? 1 : 0)
    if (totalDataPoints < 3) {
      return { ...DEFAULT_ADAPTATION, dataPointsUsed: totalDataPoints }
    }

    // Build trait map for easy access
    const traitMap = new Map<TraitName, number>()
    traits.forEach(t => traitMap.set(t.trait as TraitName, t.score))

    // Build domain score map
    const domainMap = new Map<string, number>()
    domainScores.forEach(d => domainMap.set(d.domainId, d.score))

    // Calculate adaptations based on profile
    const adaptation: AdaptationProfile = {
      communicationStyle: determineCommunicationStyle(traitMap, domainMap),
      explanationStyle: determineExplanationStyle(traitMap, domainMap),
      emotionalSupport: determineEmotionalSupport(traitMap, domainMap),
      cognitiveEngagement: determineCognitiveEngagement(traitMap, domainMap),
      confidence: calculateConfidence(traits, domainScores, enhancedProfile),
      dataPointsUsed: totalDataPoints,
    }

    return adaptation
  } catch (error) {
    console.warn('Error generating adaptation profile:', error)
    return DEFAULT_ADAPTATION
  }
}

function determineCommunicationStyle(
  traits: Map<TraitName, number>,
  domains: Map<string, number>
): AdaptationProfile['communicationStyle'] {
  const extraversion = traits.get('extraversion') ?? 0.5
  const openness = traits.get('openness') ?? 0.5
  const conscientiousness = traits.get('conscientiousness') ?? 0.5
  const agreeableness = traits.get('agreeableness') ?? 0.5

  const communicationStyleDomain = domains.get('communication_styles') ?? 0.5

  // Combine traits with domain data for richer adaptation
  const formalityScore = (conscientiousness + (1 - extraversion) + communicationStyleDomain) / 3

  return {
    // High conscientiousness + low extraversion = more formal, influenced by communication style domain
    formality: formalityScore > 0.6 ? 'formal'
             : formalityScore < 0.4 ? 'casual'
             : 'balanced',

    // High openness = more detailed, low = more concise
    verbosity: openness > 0.65 ? 'detailed'
             : openness < 0.4 ? 'concise'
             : 'moderate',

    // High agreeableness + high extraversion = warm
    emotionalTone: agreeableness > 0.6 && extraversion > 0.5 ? 'warm'
                 : conscientiousness > 0.6 && agreeableness < 0.4 ? 'analytical'
                 : 'neutral',

    // High openness = socratic, high conscientiousness = direct
    questioningStyle: openness > 0.6 ? 'socratic'
                    : conscientiousness > 0.6 ? 'direct'
                    : 'explorative',
  }
}

function determineExplanationStyle(
  traits: Map<TraitName, number>,
  domains: Map<string, number>
): AdaptationProfile['explanationStyle'] {
  const openness = traits.get('openness') ?? 0.5
  const conscientiousness = traits.get('conscientiousness') ?? 0.5

  const cognitiveAbilities = domains.get('cognitive_abilities') ?? 0.5
  const informationProcessing = domains.get('information_processing') ?? 0.5
  const learningStyles = domains.get('learning_styles') ?? 0.5

  // Combine cognitive indicators
  const cognitiveLevel = (cognitiveAbilities + informationProcessing + openness) / 3

  // Learning style influences structure preference (higher = more structured learning)
  const structureScore = (conscientiousness + learningStyles) / 2

  return {
    complexity: cognitiveLevel > 0.65 ? 'advanced'
              : cognitiveLevel < 0.4 ? 'simple'
              : 'moderate',

    // Creative/open people appreciate analogies
    useAnalogies: openness > 0.4,

    // Learning style preference influences example usage
    useExamples: learningStyles > 0.3,

    // Conscientious + high learning style score prefer structure, open prefer narrative
    structurePreference: structureScore > 0.6 ? 'bullet-points'
                       : openness > 0.6 ? 'narrative'
                       : 'hybrid',
  }
}

function determineEmotionalSupport(
  traits: Map<TraitName, number>,
  domains: Map<string, number>
): AdaptationProfile['emotionalSupport'] {
  const neuroticism = traits.get('neuroticism') ?? 0.5
  const agreeableness = traits.get('agreeableness') ?? 0.5
  const extraversion = traits.get('extraversion') ?? 0.5

  const emotionalIntelligence = domains.get('emotional_intelligence') ?? 0.5
  const resilience = domains.get('resilience_coping') ?? 0.5
  const attachmentStyle = domains.get('attachment_style') ?? 0.5

  // Attachment style influences need for validation (lower = more anxious attachment = more validation needed)
  // Emotional intelligence influences how direct we can be
  const validationNeed = (neuroticism + (1 - attachmentStyle) + (1 - resilience)) / 3
  const canHandleChallenge = (resilience + emotionalIntelligence + (1 - neuroticism)) / 3

  return {
    // High neuroticism, low resilience, or anxious attachment = need more validation
    validationLevel: validationNeed > 0.6 ? 'high'
                   : validationNeed < 0.4 ? 'minimal'
                   : 'moderate',

    // High resilience, emotional intelligence, and low neuroticism can handle challenge
    challengeLevel: canHandleChallenge > 0.6 && agreeableness < 0.5 ? 'direct'
                  : canHandleChallenge < 0.4 ? 'gentle'
                  : 'moderate',

    // High extraversion appreciates encouragement, attachment style also influences this
    encouragementFrequency: extraversion > 0.6 || attachmentStyle < 0.4 ? 'frequent'
                          : extraversion < 0.4 && attachmentStyle > 0.6 ? 'minimal'
                          : 'occasional',
  }
}

function determineCognitiveEngagement(
  traits: Map<TraitName, number>,
  domains: Map<string, number>
): AdaptationProfile['cognitiveEngagement'] {
  const openness = traits.get('openness') ?? 0.5

  const metacognition = domains.get('metacognition') ?? 0.5
  const creativity = domains.get('creativity') ?? 0.5
  const informationProcessing = domains.get('information_processing') ?? 0.5

  // Combine relevant factors for abstraction (creativity, openness, info processing)
  const abstractionScore = (openness + creativity + informationProcessing) / 3

  return {
    // High openness/creativity + good information processing = abstract thinking
    abstractionLevel: abstractionScore > 0.6 ? 'abstract'
                    : abstractionScore < 0.4 ? 'concrete'
                    : 'balanced',

    // High openness seeks novelty
    noveltyPreference: openness > 0.6 ? 'novel'
                     : openness < 0.4 ? 'familiar'
                     : 'balanced',

    // High metacognition + openness + info processing = deep exploration
    depthPreference: (metacognition + openness + informationProcessing) / 3 > 0.6 ? 'deep'
                   : (metacognition + openness + informationProcessing) / 3 < 0.4 ? 'surface'
                   : 'moderate',
  }
}

function calculateConfidence(
  traits: { confidence?: number }[],
  domainScores: { confidence?: number }[],
  enhancedProfile: { domainScores?: { confidence?: number }[] } | null
): number {
  const confidences: number[] = []

  traits.forEach(t => {
    if (t.confidence !== undefined) confidences.push(t.confidence)
  })

  domainScores.forEach(d => {
    if (d.confidence !== undefined) confidences.push(d.confidence)
  })

  if (enhancedProfile?.domainScores) {
    enhancedProfile.domainScores.forEach(d => {
      if (d.confidence !== undefined) confidences.push(d.confidence)
    })
  }

  if (confidences.length === 0) return 0.3 // Default low confidence
  return confidences.reduce((a, b) => a + b, 0) / confidences.length
}

/**
 * Generate a dynamic system prompt based on the adaptation profile
 */
export function generateAdaptiveSystemPrompt(profile: AdaptationProfile): string {
  const { communicationStyle, explanationStyle, emotionalSupport, cognitiveEngagement, confidence } = profile

  // Base instruction
  let prompt = `You are a thoughtful, empathetic AI companion focused on understanding and supporting the user. `

  // Confidence-based instruction
  if (confidence < 0.3) {
    prompt += `You are still learning about this user's preferences, so maintain a balanced, adaptable approach while observing their communication patterns. `
  } else if (confidence > 0.7) {
    prompt += `You have developed a good understanding of this user's communication preferences. Apply these insights consistently. `
  }

  // Communication style adaptations
  prompt += '\n\nCOMMUNICATION STYLE:\n'

  switch (communicationStyle.formality) {
    case 'casual':
      prompt += '- Use a relaxed, conversational tone. Contractions and informal language are welcome.\n'
      break
    case 'formal':
      prompt += '- Maintain a professional, polished tone. Be precise and measured in your language.\n'
      break
    default:
      prompt += '- Use a balanced tone that is friendly but professional.\n'
  }

  switch (communicationStyle.verbosity) {
    case 'concise':
      prompt += '- Keep responses brief and to the point. Avoid unnecessary elaboration.\n'
      break
    case 'detailed':
      prompt += '- Provide thorough, comprehensive responses. Explore topics in depth.\n'
      break
    default:
      prompt += '- Provide moderately detailed responses, balancing thoroughness with brevity.\n'
  }

  switch (communicationStyle.emotionalTone) {
    case 'warm':
      prompt += '- Be warm and personable. Show genuine interest and care.\n'
      break
    case 'analytical':
      prompt += '- Focus on logic and reasoning. Be objective and fact-oriented.\n'
      break
    default:
      prompt += '- Balance emotional warmth with analytical thinking.\n'
  }

  switch (communicationStyle.questioningStyle) {
    case 'socratic':
      prompt += '- Use thought-provoking questions to help the user explore ideas and reach their own insights.\n'
      break
    case 'direct':
      prompt += '- Ask direct, specific questions when clarification is needed.\n'
      break
    default:
      prompt += '- Use a mix of open-ended and specific questions to understand the user.\n'
  }

  // Explanation style adaptations
  prompt += '\nEXPLANATION APPROACH:\n'

  switch (explanationStyle.complexity) {
    case 'simple':
      prompt += '- Use straightforward language and simple explanations. Avoid jargon.\n'
      break
    case 'advanced':
      prompt += '- Feel free to use technical terms and explore nuanced concepts.\n'
      break
    default:
      prompt += '- Explain concepts clearly, introducing complexity gradually as appropriate.\n'
  }

  if (explanationStyle.useAnalogies) {
    prompt += '- Use analogies and metaphors to illuminate concepts.\n'
  }

  if (explanationStyle.useExamples) {
    prompt += '- Provide concrete examples to illustrate abstract ideas.\n'
  }

  switch (explanationStyle.structurePreference) {
    case 'bullet-points':
      prompt += '- Structure information with clear lists and bullet points when helpful.\n'
      break
    case 'narrative':
      prompt += '- Present information in flowing, narrative form.\n'
      break
    default:
      prompt += '- Mix structured lists with narrative explanations as appropriate.\n'
  }

  // Emotional support adaptations
  prompt += '\nEMOTIONAL ENGAGEMENT:\n'

  switch (emotionalSupport.validationLevel) {
    case 'high':
      prompt += '- Prioritize emotional validation. Acknowledge feelings before addressing practical matters.\n'
      break
    case 'minimal':
      prompt += '- Focus on practical support. The user appreciates direct problem-solving.\n'
      break
    default:
      prompt += '- Balance emotional acknowledgment with practical guidance.\n'
  }

  switch (emotionalSupport.challengeLevel) {
    case 'direct':
      prompt += '- Feel comfortable offering alternative perspectives and constructive challenges.\n'
      break
    case 'gentle':
      prompt += '- Be gentle when introducing different viewpoints. Frame challenges sensitively.\n'
      break
    default:
      prompt += '- Offer alternative perspectives thoughtfully, with appropriate sensitivity.\n'
  }

  switch (emotionalSupport.encouragementFrequency) {
    case 'frequent':
      prompt += '- Provide regular encouragement and positive reinforcement.\n'
      break
    case 'minimal':
      prompt += '- Reserve praise for significant achievements. The user values substance over praise.\n'
      break
    default:
      prompt += '- Offer encouragement when genuinely warranted.\n'
  }

  // Cognitive engagement adaptations
  prompt += '\nCOGNITIVE ENGAGEMENT:\n'

  switch (cognitiveEngagement.abstractionLevel) {
    case 'abstract':
      prompt += '- Feel free to explore theoretical concepts and abstract ideas.\n'
      break
    case 'concrete':
      prompt += '- Ground discussions in concrete, practical terms.\n'
      break
    default:
      prompt += '- Balance abstract concepts with concrete applications.\n'
  }

  switch (cognitiveEngagement.noveltyPreference) {
    case 'novel':
      prompt += '- Introduce fresh perspectives and unconventional ideas.\n'
      break
    case 'familiar':
      prompt += '- Build on established frameworks and familiar concepts.\n'
      break
    default:
      prompt += '- Mix familiar foundations with occasional novel insights.\n'
  }

  switch (cognitiveEngagement.depthPreference) {
    case 'deep':
      prompt += '- Explore topics thoroughly. The user appreciates in-depth analysis.\n'
      break
    case 'surface':
      prompt += '- Cover key points efficiently without excessive deep-dives.\n'
      break
    default:
      prompt += '- Go deeper when the user shows interest, otherwise stay focused.\n'
  }

  // Core purpose reminder
  prompt += '\nCORE PURPOSE:\n'
  prompt += '- Help the user explore their thoughts and feelings through supportive conversation.\n'
  prompt += '- Ask thoughtful follow-up questions to understand them better.\n'
  prompt += '- Maintain genuine curiosity about their experiences and perspectives.\n'
  prompt += '- Keep responses concise but meaningful.\n'

  return prompt
}

/**
 * Get or generate cached adaptation profile
 */
let cachedProfile: AdaptationProfile | null = null
let lastProfileUpdate = 0
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export async function getAdaptationProfile(): Promise<AdaptationProfile> {
  const now = Date.now()

  if (cachedProfile && (now - lastProfileUpdate) < CACHE_DURATION_MS) {
    return cachedProfile
  }

  cachedProfile = await generateAdaptationProfile()
  lastProfileUpdate = now

  return cachedProfile
}

/**
 * Force refresh the adaptation profile
 */
export async function refreshAdaptationProfile(): Promise<AdaptationProfile> {
  cachedProfile = await generateAdaptationProfile()
  lastProfileUpdate = Date.now()
  return cachedProfile
}

/**
 * Get a quick summary of the current adaptations for display
 */
export function getAdaptationSummary(profile: AdaptationProfile): string[] {
  const summary: string[] = []

  const { communicationStyle, explanationStyle, emotionalSupport, cognitiveEngagement } = profile

  // Communication style summary
  if (communicationStyle.formality !== 'balanced') {
    summary.push(`${communicationStyle.formality} tone`)
  }
  if (communicationStyle.verbosity !== 'moderate') {
    summary.push(`${communicationStyle.verbosity} responses`)
  }
  if (communicationStyle.emotionalTone !== 'neutral') {
    summary.push(`${communicationStyle.emotionalTone} approach`)
  }

  // Explanation style summary
  if (explanationStyle.complexity !== 'moderate') {
    summary.push(`${explanationStyle.complexity} complexity`)
  }
  if (explanationStyle.structurePreference === 'bullet-points') {
    summary.push('structured format')
  } else if (explanationStyle.structurePreference === 'narrative') {
    summary.push('narrative style')
  }

  // Support style summary
  if (emotionalSupport.validationLevel === 'high') {
    summary.push('high validation')
  }
  if (emotionalSupport.challengeLevel === 'direct') {
    summary.push('direct feedback')
  }

  // Cognitive engagement summary
  if (cognitiveEngagement.depthPreference === 'deep') {
    summary.push('in-depth exploration')
  }
  if (cognitiveEngagement.noveltyPreference === 'novel') {
    summary.push('novel perspectives')
  }

  return summary.length > 0 ? summary : ['balanced approach']
}
