/**
 * Hybrid Signal Aggregator
 * Combines LIWC, Embedding, and LLM signals with weighted scoring.
 *
 * Signal reliability hierarchy:
 * 1. LLM (highest) - Full semantic understanding, context-aware
 * 2. Embeddings (medium) - Semantic similarity, captures meaning
 * 3. LIWC (lowest) - Word matching only, fast but limited
 *
 * The LLM acts as a "judge" that can validate or override simpler signals.
 */

import {
  ANALYSIS_CONFIG,
  computeEffectiveWeights,
  PSYCHOLOGICAL_DOMAINS,
  type PsychologicalDomain,
  type AnalysisWeights,
} from './analysis-config'
import { computeAllTraitSimilarities, generateTraitPrototypes, isPrototypeCacheReady } from './trait-prototypes'
import {
  queueMessageForAnalysis,
  analyzeMessageBatch,
  shouldTriggerAnalysis,
  getQueueSize,
  isLLMBusy,
  type LLMAnalysisResult,
} from './llm-deep-analyzer'
import { saveHybridSignal } from './sqldb'

/**
 * Signal data for a single analysis
 */
export interface SignalData {
  scores: Record<PsychologicalDomain, number>
  confidence: number  // Overall confidence in this signal (0-1)
  timestamp: Date
}

/**
 * Aggregated result combining all signals
 */
export interface HybridAnalysisResult {
  // Final aggregated scores
  scores: Record<PsychologicalDomain, number>

  // Individual signal data (for debugging/inspection)
  signals: {
    liwc: SignalData | null
    embedding: SignalData | null
    llm: SignalData | null
  }

  // Weights used in this aggregation
  weightsUsed: AnalysisWeights

  // Metadata
  timestamp: Date
  messageId: number
  sessionId?: string
}

// Cache for latest LLM analysis result
let latestLLMResult: LLMAnalysisResult | null = null

/**
 * Initialize the hybrid analysis system
 * Call this during app startup to pre-cache embeddings
 */
export async function initHybridAnalyzer(): Promise<void> {
  console.log('Initializing hybrid analyzer...')

  // Pre-generate trait prototype embeddings if not already cached
  if (!isPrototypeCacheReady()) {
    await generateTraitPrototypes()
  }

  console.log('Hybrid analyzer initialized')
}

/**
 * Run hybrid analysis on a single message
 * Returns immediately with LIWC + Embedding signals
 * Queues message for LLM batch analysis
 */
export async function analyzeHybrid(
  messageId: number,
  content: string,
  liwcScores: Record<string, number>,
  sessionId?: string
): Promise<HybridAnalysisResult> {
  const timestamp = new Date()

  // 1. Convert LIWC scores to signal data
  const liwcSignal = createLIWCSignal(liwcScores)

  // 2. Compute embedding similarity scores
  const embeddingSignal = await createEmbeddingSignal(content)

  // 3. Queue for LLM analysis
  const shouldRunLLM = queueMessageForAnalysis(messageId, content)

  // 4. Get LLM signal if available (from previous batch analysis)
  const llmSignal = latestLLMResult ? createLLMSignal(latestLLMResult) : null

  // 5. Trigger LLM batch analysis if needed (non-blocking)
  if (shouldRunLLM) {
    // Fire and forget - don't await
    runLLMAnalysisInBackground()
  }

  // 6. Compute effective weights based on available signals
  const weightsUsed = computeEffectiveWeights(
    liwcSignal !== null,
    embeddingSignal !== null,
    llmSignal !== null
  )

  // 7. Aggregate signals into final scores
  const finalScores = aggregateSignals(liwcSignal, embeddingSignal, llmSignal, weightsUsed)

  // 8. Persist signals to database (fire and forget for performance)
  persistSignalsToDatabase(liwcSignal, embeddingSignal, llmSignal, weightsUsed).catch(err => {
    console.warn('Failed to persist hybrid signals:', err)
  })

  return {
    scores: finalScores,
    signals: {
      liwc: liwcSignal,
      embedding: embeddingSignal,
      llm: llmSignal,
    },
    weightsUsed,
    timestamp,
    messageId,
    sessionId,
  }
}

/**
 * Create LIWC signal from raw scores
 */
function createLIWCSignal(liwcScores: Record<string, number>): SignalData {
  const scores: Partial<Record<PsychologicalDomain, number>> = {}

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    // LIWC uses slightly different keys - normalize them
    const score = liwcScores[domain] ?? liwcScores[domain.replace(/_/g, '')] ?? 0.5
    scores[domain] = Math.max(0, Math.min(1, score))
  }

  // Calculate confidence based on variance from neutral
  // More deviation from 0.5 = more confident signal
  const values = Object.values(scores)
  const avgDeviation = values.reduce((sum, v) => sum + Math.abs(v - 0.5), 0) / values.length
  const confidence = Math.min(1, avgDeviation * 3) // Scale up deviation

  return {
    scores: scores as Record<PsychologicalDomain, number>,
    confidence: Math.max(0.1, confidence), // Minimum 10% confidence
    timestamp: new Date(),
  }
}

/**
 * Create embedding signal from text
 */
async function createEmbeddingSignal(content: string): Promise<SignalData | null> {
  if (!ANALYSIS_CONFIG.embeddingEnabled) {
    return null
  }

  try {
    const similarities = await computeAllTraitSimilarities(content)

    // Calculate confidence based on similarity variance
    const values = Object.values(similarities)
    const avgSimilarity = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avgSimilarity, 2), 0) / values.length
    const confidence = Math.min(1, Math.sqrt(variance) * 4) // Higher variance = more discriminating

    return {
      scores: similarities,
      confidence: Math.max(0.2, confidence), // Minimum 20% confidence
      timestamp: new Date(),
    }
  } catch (error) {
    console.warn('Failed to compute embedding signal:', error)
    return null
  }
}

/**
 * Create LLM signal from analysis result
 */
function createLLMSignal(result: LLMAnalysisResult): SignalData {
  const scores: Partial<Record<PsychologicalDomain, number>> = {}
  let totalConfidence = 0

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const domainResult = result.domains[domain]
    scores[domain] = domainResult?.score ?? 0.5
    totalConfidence += domainResult?.confidence ?? 0.1
  }

  const avgConfidence = totalConfidence / PSYCHOLOGICAL_DOMAINS.length

  return {
    scores: scores as Record<PsychologicalDomain, number>,
    confidence: avgConfidence,
    timestamp: result.timestamp,
  }
}

/**
 * Aggregate multiple signals into final scores using weighted combination
 */
function aggregateSignals(
  liwcSignal: SignalData | null,
  embeddingSignal: SignalData | null,
  llmSignal: SignalData | null,
  weights: AnalysisWeights
): Record<PsychologicalDomain, number> {
  const result: Partial<Record<PsychologicalDomain, number>> = {}

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    let weightedSum = 0
    let totalWeight = 0

    // Add LIWC contribution
    if (liwcSignal && weights.liwc > 0) {
      const score = liwcSignal.scores[domain]
      const adjustedWeight = weights.liwc * liwcSignal.confidence
      weightedSum += score * adjustedWeight
      totalWeight += adjustedWeight
    }

    // Add embedding contribution
    if (embeddingSignal && weights.embedding > 0) {
      const score = embeddingSignal.scores[domain]
      const adjustedWeight = weights.embedding * embeddingSignal.confidence
      weightedSum += score * adjustedWeight
      totalWeight += adjustedWeight
    }

    // Add LLM contribution (highest priority)
    if (llmSignal && weights.llm > 0) {
      const score = llmSignal.scores[domain]
      const adjustedWeight = weights.llm * llmSignal.confidence
      weightedSum += score * adjustedWeight
      totalWeight += adjustedWeight
    }

    // Calculate final score
    if (totalWeight > 0) {
      result[domain] = weightedSum / totalWeight
    } else {
      result[domain] = 0.5 // Neutral if no signals
    }
  }

  return result as Record<PsychologicalDomain, number>
}

// Track pending deferred analysis
let deferredAnalysisTimeout: ReturnType<typeof setTimeout> | null = null
const DEFERRED_ANALYSIS_DELAY_MS = 10000 // 10 seconds (LLM responses can take 20-30s)

/**
 * Run LLM batch analysis in background (non-blocking)
 * Will defer and retry if LLM is currently busy
 */
async function runLLMAnalysisInBackground(retryCount = 0): Promise<void> {
  const MAX_RETRIES = 6 // 6 retries × 10s = 60s max wait

  // If LLM is busy, schedule a deferred retry
  if (isLLMBusy()) {
    if (retryCount < MAX_RETRIES) {
      console.log(`LLM busy, deferring deep analysis (retry ${retryCount + 1}/${MAX_RETRIES})`)

      // Clear any existing deferred timeout
      if (deferredAnalysisTimeout) {
        clearTimeout(deferredAnalysisTimeout)
      }

      // Schedule retry after delay
      deferredAnalysisTimeout = setTimeout(() => {
        deferredAnalysisTimeout = null
        runLLMAnalysisInBackground(retryCount + 1)
      }, DEFERRED_ANALYSIS_DELAY_MS)
    } else {
      console.log('LLM busy, max retries reached. Analysis will run on next trigger.')
    }
    return
  }

  try {
    const result = await analyzeMessageBatch()
    if (result) {
      latestLLMResult = result
      console.log('LLM batch analysis complete, updated latest result')

      // IMMEDIATELY persist LLM signals to database so they appear in UI
      // Without this, LLM signals only appear after the NEXT message
      await persistLLMSignalsToDatabase(result)
      console.log('LLM signals persisted to database immediately')
    }
  } catch (error) {
    console.warn('Background LLM analysis failed:', error)
  }
}

/**
 * Force LLM analysis now (useful for testing or manual trigger)
 */
export async function forceLLMAnalysis(): Promise<LLMAnalysisResult | null> {
  if (getQueueSize() === 0) {
    console.log('No messages in queue for forced analysis')
    return null
  }

  const result = await analyzeMessageBatch()
  if (result) {
    latestLLMResult = result
  }
  return result
}

/**
 * Get the latest LLM analysis result
 */
export function getLatestLLMResult(): LLMAnalysisResult | null {
  return latestLLMResult
}

/**
 * Clear cached LLM result (for testing)
 */
export function clearLLMCache(): void {
  latestLLMResult = null
}

/**
 * Get current analysis status
 */
export function getAnalysisStatus(): {
  llmQueueSize: number
  llmEnabled: boolean
  embeddingEnabled: boolean
  hasLLMResult: boolean
  prototypesCached: boolean
} {
  return {
    llmQueueSize: getQueueSize(),
    llmEnabled: ANALYSIS_CONFIG.llmEnabled,
    embeddingEnabled: ANALYSIS_CONFIG.embeddingEnabled,
    hasLLMResult: latestLLMResult !== null,
    prototypesCached: isPrototypeCacheReady(),
  }
}

/**
 * Convenience function to run complete hybrid analysis
 * Combines all steps: LIWC + Embedding + LLM (if triggered)
 */
export async function runCompleteHybridAnalysis(
  messageId: number,
  content: string,
  liwcScores: Record<string, number>,
  sessionId?: string
): Promise<HybridAnalysisResult> {
  // First check if we should trigger LLM analysis before running
  if (shouldTriggerAnalysis()) {
    // Run LLM analysis first to include in this result
    await runLLMAnalysisInBackground()
  }

  // Then run the hybrid analysis
  return analyzeHybrid(messageId, content, liwcScores, sessionId)
}

/**
 * Merge multiple hybrid results (for historical aggregation)
 */
export function mergeHybridResults(
  results: HybridAnalysisResult[]
): Record<PsychologicalDomain, number> {
  if (results.length === 0) {
    const empty: Partial<Record<PsychologicalDomain, number>> = {}
    for (const domain of PSYCHOLOGICAL_DOMAINS) {
      empty[domain] = 0.5
    }
    return empty as Record<PsychologicalDomain, number>
  }

  const merged: Partial<Record<PsychologicalDomain, number>> = {}

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    // Use exponentially weighted average (recent results weighted more)
    let weightedSum = 0
    let totalWeight = 0
    const decayFactor = 0.9 // Each older result weighted 90% of the next

    for (let i = results.length - 1; i >= 0; i--) {
      const weight = Math.pow(decayFactor, results.length - 1 - i)
      weightedSum += results[i].scores[domain] * weight
      totalWeight += weight
    }

    merged[domain] = totalWeight > 0 ? weightedSum / totalWeight : 0.5
  }

  return merged as Record<PsychologicalDomain, number>
}

/**
 * Persist signal data to database for later retrieval
 * This stores the real LIWC, Embedding, and LLM signals for each domain
 */
async function persistSignalsToDatabase(
  liwcSignal: SignalData | null,
  embeddingSignal: SignalData | null,
  llmSignal: SignalData | null,
  weights: AnalysisWeights
): Promise<void> {
  // Persist LIWC signals
  if (liwcSignal) {
    for (const domain of PSYCHOLOGICAL_DOMAINS) {
      await saveHybridSignal(
        domain,
        'liwc',
        liwcSignal.scores[domain],
        liwcSignal.confidence,
        weights.liwc,
        undefined, // No evidence text for LIWC
        undefined, // Matched words would need to come from enhanced-analyzer
        undefined  // No prototype similarity for LIWC
      )
    }
  }

  // Persist Embedding signals
  if (embeddingSignal) {
    for (const domain of PSYCHOLOGICAL_DOMAINS) {
      await saveHybridSignal(
        domain,
        'embedding',
        embeddingSignal.scores[domain],
        embeddingSignal.confidence,
        weights.embedding,
        undefined,
        undefined,
        embeddingSignal.scores[domain] // The score IS the prototype similarity for embeddings
      )
    }
  }

  // Persist LLM signals (with evidence from the LLM result)
  if (llmSignal && latestLLMResult) {
    for (const domain of PSYCHOLOGICAL_DOMAINS) {
      const domainResult = latestLLMResult.domains[domain]
      await saveHybridSignal(
        domain,
        'llm',
        llmSignal.scores[domain],
        domainResult?.confidence ?? llmSignal.confidence,
        weights.llm,
        domainResult?.evidence, // Include the LLM's reasoning
        undefined,
        undefined
      )
    }
  }

  console.log('Hybrid signals persisted to database')
}

/**
 * Persist ONLY LLM signals to database (for immediate persistence after analysis)
 * This is separate from persistSignalsToDatabase because LLM runs asynchronously
 * and we want the results visible immediately without waiting for next message
 */
async function persistLLMSignalsToDatabase(result: LLMAnalysisResult): Promise<void> {
  const llmWeight = ANALYSIS_CONFIG.weights.llm

  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    const domainResult = result.domains[domain]
    await saveHybridSignal(
      domain,
      'llm',
      domainResult.score,
      domainResult.confidence,
      llmWeight,
      domainResult.evidence, // Include the LLM's reasoning
      undefined,
      undefined
    )
  }
}

/**
 * Check if analysis should run based on timeout
 * Call this periodically (e.g., every minute) from the main app
 */
export async function checkAndRunTimeoutAnalysis(): Promise<boolean> {
  if (shouldTriggerAnalysis()) {
    await runLLMAnalysisInBackground()
    return true
  }
  return false
}

/**
 * Debug function to inspect current LLM analysis results
 * Call from browser console: window.debugHybridAnalysis()
 */
export function debugHybridAnalysis(): {
  llmResult: LLMAnalysisResult | null
  notableScores: Array<{ domain: string; score: number; confidence: number; deviation: number }>
  status: ReturnType<typeof getAnalysisStatus>
} {
  const threshold = 0.15
  const notableScores: Array<{ domain: string; score: number; confidence: number; deviation: number }> = []

  if (latestLLMResult) {
    for (const domain of PSYCHOLOGICAL_DOMAINS) {
      const data = latestLLMResult.domains[domain]
      const deviation = data.score - 0.5

      if (Math.abs(deviation) >= threshold) {
        notableScores.push({
          domain,
          score: data.score,
          confidence: data.confidence,
          deviation,
        })
      }
    }
    notableScores.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
  }

  const result = {
    llmResult: latestLLMResult,
    notableScores,
    status: getAnalysisStatus(),
  }

  // Pretty print to console
  console.log('=== Hybrid Analysis Debug ===')
  console.log('Status:', result.status)

  if (latestLLMResult) {
    console.log(`\nLLM Analysis (${latestLLMResult.messageCount} messages analyzed):`)
    console.log(`  Timestamp: ${latestLLMResult.timestamp}`)
    console.log(`  Version: ${latestLLMResult.analysisVersion}`)

    if (notableScores.length > 0) {
      console.log('\nNotable Scores (deviation ≥ ±0.15):')
      for (const item of notableScores) {
        const direction = item.deviation > 0 ? '↑ HIGH' : '↓ LOW '
        console.log(`  ${direction} ${item.domain}: ${item.score.toFixed(3)} (conf: ${item.confidence.toFixed(2)}, dev: ${item.deviation > 0 ? '+' : ''}${item.deviation.toFixed(3)})`)
      }
    } else {
      console.log('\nNo notable deviations from neutral (all scores ~0.5)')
    }

    // Show all domain scores sorted by score value
    console.log('\nAll Domain Scores (sorted by value):')
    const allScores = PSYCHOLOGICAL_DOMAINS.map(d => ({
      domain: d,
      score: latestLLMResult!.domains[d].score,
      confidence: latestLLMResult!.domains[d].confidence,
    })).sort((a, b) => b.score - a.score)

    for (const item of allScores) {
      const bar = '█'.repeat(Math.round(item.score * 20)).padEnd(20, '░')
      console.log(`  ${item.domain.padEnd(30)} ${bar} ${item.score.toFixed(3)} (conf: ${item.confidence.toFixed(2)})`)
    }
  } else {
    console.log('\nNo LLM analysis result available yet')
  }

  return result
}

// Expose debug function globally for browser console access
if (typeof window !== 'undefined') {
  (window as unknown as { debugHybridAnalysis: typeof debugHybridAnalysis }).debugHybridAnalysis = debugHybridAnalysis
}
