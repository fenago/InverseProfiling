/**
 * LLM Deep Analyzer
 * Uses Gemma 3n for semantic deep analysis of user messages in batches.
 * This is the "Primary" signal in the hybrid approach - highest reliability.
 *
 * Features:
 * - Batch processing (every N messages or on timeout)
 * - Structured JSON output for domain scores
 * - Confidence scoring for each domain
 * - Message queue management
 */

import { llmEngine } from './llm'
import { useStore } from './store'
import { ANALYSIS_CONFIG, PSYCHOLOGICAL_DOMAINS, type PsychologicalDomain } from './analysis-config'

/**
 * Result from LLM deep analysis for a single domain
 */
export interface DomainAnalysisResult {
  score: number       // 0-1 score for this domain
  confidence: number  // 0-1 confidence in the score
  evidence?: string   // Optional brief explanation
}

/**
 * Complete result from LLM deep analysis
 */
export interface LLMAnalysisResult {
  domains: Record<PsychologicalDomain, DomainAnalysisResult>
  timestamp: Date
  messageCount: number
  analysisVersion: string
}

/**
 * Message in the queue pending deep analysis
 */
interface QueuedMessage {
  id: number
  content: string
  timestamp: Date
}

// Message queue for batch processing
let messageQueue: QueuedMessage[] = []
let lastAnalysisTime = 0
let analysisInProgress = false

/**
 * Prompt template for deep psychological analysis
 * Instructs the LLM to analyze text for personality signals
 *
 * Based on the 39 domains from Fine-Tuned-Psychometrics.md PRD
 */
const DEEP_ANALYSIS_PROMPT = `Analyze these messages for psychological traits. Score each trait 0.0-1.0:
- 0.0-0.3 = LOW (absent/weak indicators)
- 0.4-0.6 = NEUTRAL (unclear/mixed)
- 0.7-1.0 = HIGH (strong indicators)

LOOK FOR:
- Curiosity/questions = high openness
- Planning/organization = high conscientiousness
- Social engagement = high extraversion
- Empathy/kindness = high agreeableness
- Worry/anxiety = high neuroticism
- Follow-up questions = high information_processing
- "Interesting/fascinating" = high openness + interests
- Systematic inquiry = high cognitive_abilities

Messages:
{MESSAGES}

CRITICAL: Vary scores based on evidence! Do NOT use 0.5 for everything.
If someone asks curious questions, openness should be 0.7+
If no evidence for a trait, use 0.5 with LOW confidence (0.2-0.3)

Output JSON only (no other text):
{"big_five_openness":{"score":X,"confidence":X},"big_five_conscientiousness":{"score":X,"confidence":X},"big_five_extraversion":{"score":X,"confidence":X},"big_five_agreeableness":{"score":X,"confidence":X},"big_five_neuroticism":{"score":X,"confidence":X},"dark_triad_narcissism":{"score":X,"confidence":X},"dark_triad_machiavellianism":{"score":X,"confidence":X},"dark_triad_psychopathy":{"score":X,"confidence":X},"emotional_empathy":{"score":X,"confidence":X},"emotional_intelligence":{"score":X,"confidence":X},"attachment_style":{"score":X,"confidence":X},"love_languages":{"score":X,"confidence":X},"communication_style":{"score":X,"confidence":X},"risk_tolerance":{"score":X,"confidence":X},"decision_style":{"score":X,"confidence":X},"time_orientation":{"score":X,"confidence":X},"achievement_motivation":{"score":X,"confidence":X},"self_efficacy":{"score":X,"confidence":X},"locus_of_control":{"score":X,"confidence":X},"growth_mindset":{"score":X,"confidence":X},"personal_values":{"score":X,"confidence":X},"interests":{"score":X,"confidence":X},"life_satisfaction":{"score":X,"confidence":X},"stress_coping":{"score":X,"confidence":X},"social_support":{"score":X,"confidence":X},"authenticity":{"score":X,"confidence":X},"cognitive_abilities":{"score":X,"confidence":X},"creativity":{"score":X,"confidence":X},"learning_styles":{"score":X,"confidence":X},"information_processing":{"score":X,"confidence":X},"metacognition":{"score":X,"confidence":X},"executive_functions":{"score":X,"confidence":X},"social_cognition":{"score":X,"confidence":X},"political_ideology":{"score":X,"confidence":X},"cultural_values":{"score":X,"confidence":X},"moral_reasoning":{"score":X,"confidence":X},"work_career_style":{"score":X,"confidence":X},"sensory_processing":{"score":X,"confidence":X},"aesthetic_preferences":{"score":X,"confidence":X}}`

/**
 * Add a message to the queue for deep analysis
 * Returns true if batch analysis should be triggered
 */
export function queueMessageForAnalysis(
  messageId: number,
  content: string
): boolean {
  if (!ANALYSIS_CONFIG.llmEnabled) {
    return false
  }

  messageQueue.push({
    id: messageId,
    content,
    timestamp: new Date(),
  })

  // Check if we should trigger analysis
  const shouldTrigger =
    messageQueue.length >= ANALYSIS_CONFIG.llmBatchSize ||
    (lastAnalysisTime > 0 && Date.now() - lastAnalysisTime >= ANALYSIS_CONFIG.llmBatchTimeout)

  return shouldTrigger
}

/**
 * Check if analysis should be triggered (for timeout-based triggering)
 */
export function shouldTriggerAnalysis(): boolean {
  if (!ANALYSIS_CONFIG.llmEnabled || messageQueue.length === 0) {
    return false
  }

  return (
    messageQueue.length >= ANALYSIS_CONFIG.llmBatchSize ||
    (lastAnalysisTime > 0 && Date.now() - lastAnalysisTime >= ANALYSIS_CONFIG.llmBatchTimeout)
  )
}

/**
 * Get current queue size
 */
export function getQueueSize(): number {
  return messageQueue.length
}

/**
 * Clear the message queue
 */
export function clearMessageQueue(): void {
  messageQueue = []
}

/**
 * Check if the LLM is currently busy (generating a response or loading)
 */
export function isLLMBusy(): boolean {
  const store = useStore.getState()
  return store.chat.isGenerating || store.llm.isLoading
}

/**
 * Analyze a batch of messages using the LLM
 * Returns null if LLM is not available or analysis fails
 */
export async function analyzeMessageBatch(): Promise<LLMAnalysisResult | null> {
  if (!ANALYSIS_CONFIG.llmEnabled) {
    console.log('LLM analysis disabled in config')
    return null
  }

  if (!llmEngine.isReady()) {
    console.log('LLM not ready for deep analysis')
    return null
  }

  // Check if LLM is currently generating a user response
  if (isLLMBusy()) {
    console.log('LLM is busy (generating response or loading), deferring deep analysis')
    return null
  }

  if (messageQueue.length === 0) {
    console.log('No messages in queue for analysis')
    return null
  }

  if (analysisInProgress) {
    console.log('Analysis already in progress')
    return null
  }

  analysisInProgress = true

  try {
    // Get messages from queue
    const messagesToAnalyze = [...messageQueue]
    const messageCount = messagesToAnalyze.length

    console.log(`Starting LLM deep analysis of ${messageCount} messages`)

    // Concatenate messages for analysis
    const messagesText = messagesToAnalyze
      .map((m, i) => `Message ${i + 1}: "${m.content}"`)
      .join('\n\n')

    // Build the prompt
    const prompt = DEEP_ANALYSIS_PROMPT.replace('{MESSAGES}', messagesText)

    // Generate response from LLM
    const response = await llmEngine.generate(prompt)

    // Parse the response
    const result = parseLLMAnalysisResponse(response, messageCount)

    if (result) {
      // Clear analyzed messages from queue
      messageQueue = []
      lastAnalysisTime = Date.now()
      console.log('LLM deep analysis complete')
    }

    return result
  } catch (error) {
    console.error('LLM deep analysis failed:', error)
    return null
  } finally {
    analysisInProgress = false
  }
}

/**
 * Parse LLM response into structured analysis result
 */
export function parseLLMAnalysisResponse(
  response: string,
  messageCount: number
): LLMAnalysisResult | null {
  try {
    // Extract JSON from response (LLM might include extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('No JSON found in LLM response')
      return createDefaultResult(messageCount)
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate and normalize the response
    const domains: Record<string, DomainAnalysisResult> = {}

    for (const domain of PSYCHOLOGICAL_DOMAINS) {
      if (parsed[domain]) {
        const domainData = parsed[domain]
        domains[domain] = {
          score: clampScore(domainData.score),
          confidence: clampScore(domainData.confidence),
          evidence: domainData.evidence || undefined,
        }
      } else {
        // Use default values for missing domains
        domains[domain] = {
          score: 0.5,
          confidence: 0.2, // Low confidence for missing data
        }
      }
    }

    const result = {
      domains: domains as Record<PsychologicalDomain, DomainAnalysisResult>,
      timestamp: new Date(),
      messageCount,
      analysisVersion: '1.0',
    }

    // Log notable scores (those deviating significantly from neutral 0.5)
    logNotableScores(result)

    return result
  } catch (error) {
    console.warn('Failed to parse LLM analysis response:', error)
    return createDefaultResult(messageCount)
  }
}

/**
 * Log scores that deviate notably from neutral (0.5)
 * This helps debug and verify the LLM is detecting actual signals
 */
function logNotableScores(result: LLMAnalysisResult): void {
  const threshold = 0.15 // Show scores that deviate ±0.15 from neutral
  const notable: Array<{ domain: string; score: number; confidence: number; direction: string }> = []

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const data = result.domains[domain]
    const deviation = data.score - 0.5

    if (Math.abs(deviation) >= threshold) {
      notable.push({
        domain,
        score: data.score,
        confidence: data.confidence,
        direction: deviation > 0 ? 'HIGH' : 'LOW',
      })
    }
  }

  // Always show the score legend first
  console.log('=== LLM Analysis Results ===')
  console.log('  Score Legend: 0.0-0.3 = LOW | 0.4-0.6 = NEUTRAL | 0.7-1.0 = HIGH')
  console.log('  Confidence: How certain the analysis is (0.0 = guess, 1.0 = certain)')
  console.log('')

  if (notable.length > 0) {
    console.log(`  Notable Scores (deviation ≥ ±0.15 from neutral 0.5):`)
    notable.sort((a, b) => Math.abs(b.score - 0.5) - Math.abs(a.score - 0.5)) // Sort by deviation
    for (const item of notable) {
      console.log(`    ${item.direction.padEnd(4)} ${item.domain}: ${item.score.toFixed(2)} (confidence: ${item.confidence.toFixed(2)})`)
    }
    console.log(`  Total notable signals: ${notable.length}/${PSYCHOLOGICAL_DOMAINS.length}`)
  } else {
    console.log('  No notable deviations from neutral (all scores ~0.5)')
  }

  // Also log average confidence across all domains
  const avgConfidence = PSYCHOLOGICAL_DOMAINS.reduce((sum, d) => sum + result.domains[d].confidence, 0) / PSYCHOLOGICAL_DOMAINS.length
  console.log(`  Average confidence: ${avgConfidence.toFixed(2)}`)
  console.log('=== End LLM Analysis ===')
}

/**
 * Clamp score to valid range
 */
function clampScore(value: unknown): number {
  if (typeof value !== 'number') return 0.5
  return Math.max(0, Math.min(1, value))
}

/**
 * Create default result with neutral scores
 */
function createDefaultResult(messageCount: number): LLMAnalysisResult {
  const domains: Record<string, DomainAnalysisResult> = {}

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    domains[domain] = {
      score: 0.5,
      confidence: 0.1, // Very low confidence for default values
    }
  }

  return {
    domains: domains as Record<PsychologicalDomain, DomainAnalysisResult>,
    timestamp: new Date(),
    messageCount,
    analysisVersion: '1.0-default',
  }
}

/**
 * Analyze specific messages on demand (not from queue)
 * Useful for immediate analysis of important messages
 */
export async function analyzeMessagesOnDemand(
  messages: string[]
): Promise<LLMAnalysisResult | null> {
  if (!ANALYSIS_CONFIG.llmEnabled) {
    return null
  }

  if (!llmEngine.isReady()) {
    console.log('LLM not ready for on-demand analysis')
    return null
  }

  if (messages.length === 0) {
    return null
  }

  try {
    console.log(`Starting on-demand LLM analysis of ${messages.length} messages`)

    // Concatenate messages for analysis
    const messagesText = messages
      .map((m, i) => `Message ${i + 1}: "${m}"`)
      .join('\n\n')

    // Build the prompt
    const prompt = DEEP_ANALYSIS_PROMPT.replace('{MESSAGES}', messagesText)

    // Generate response from LLM
    const response = await llmEngine.generate(prompt)

    // Parse the response
    return parseLLMAnalysisResponse(response, messages.length)
  } catch (error) {
    console.error('On-demand LLM analysis failed:', error)
    return null
  }
}

/**
 * Get the last analysis timestamp
 */
export function getLastAnalysisTime(): number {
  return lastAnalysisTime
}

/**
 * Check if an analysis is currently in progress
 */
export function isAnalysisInProgress(): boolean {
  return analysisInProgress
}

/**
 * Get queued message IDs (for tracking)
 */
export function getQueuedMessageIds(): number[] {
  return messageQueue.map(m => m.id)
}

/**
 * Extract domain scores from LLM result (convenience function)
 */
export function extractDomainScores(
  result: LLMAnalysisResult
): Record<PsychologicalDomain, number> {
  const scores: Partial<Record<PsychologicalDomain, number>> = {}

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    scores[domain] = result.domains[domain]?.score ?? 0.5
  }

  return scores as Record<PsychologicalDomain, number>
}

/**
 * Extract domain confidences from LLM result (convenience function)
 */
export function extractDomainConfidences(
  result: LLMAnalysisResult
): Record<PsychologicalDomain, number> {
  const confidences: Partial<Record<PsychologicalDomain, number>> = {}

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    confidences[domain] = result.domains[domain]?.confidence ?? 0.1
  }

  return confidences as Record<PsychologicalDomain, number>
}
