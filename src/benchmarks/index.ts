/**
 * Performance Benchmark Suite
 * Phase 2.5: Expert Validation & Benchmarks
 *
 * Comprehensive benchmarks for:
 * - Gemma 3n LLM inference latency
 * - TinkerBird vector search speed
 * - Memory footprint tracking
 * - Cross-device performance profiling
 *
 * Based on expert feedback from:
 * - Elon Musk simulation: "Does it work?" → Live performance proof
 * - Ilya Sutskever simulation: "Does the math work at scale?" → Rigorous benchmarks
 */

import type {
  BenchmarkResult,
  BenchmarkSuite,
  BenchmarkSummary,
  BenchmarkConfig,
  DeviceTier,
} from './types'
import { DEFAULT_BENCHMARK_CONFIG, DEVICE_TIER_THRESHOLDS } from './types'
import { getDeviceInfo, estimateDeviceTier } from './utils'
import {
  runAllLLMBenchmarks,
  benchmarkModelLoad,
  benchmarkShortPromptInference,
  benchmarkMediumPromptInference,
  benchmarkConversationInference,
} from './llm-benchmarks'
import {
  runAllVectorBenchmarks,
  benchmarkEmbeddingInit,
  benchmarkEmbeddingGeneration,
  benchmarkVectorStorage,
  benchmarkVectorSearch,
  benchmarkVectorSearchAtScale,
} from './vector-benchmarks'
import {
  runAllMemoryBenchmarks,
  benchmarkBaselineMemory,
  getMemoryStats,
  takeMemorySnapshot,
  type MemorySnapshot,
} from './memory-benchmarks'

export * from './types'
export {
  // LLM benchmarks
  runAllLLMBenchmarks,
  benchmarkModelLoad,
  benchmarkShortPromptInference,
  benchmarkMediumPromptInference,
  benchmarkConversationInference,
  // Vector benchmarks
  runAllVectorBenchmarks,
  benchmarkEmbeddingInit,
  benchmarkEmbeddingGeneration,
  benchmarkVectorStorage,
  benchmarkVectorSearch,
  benchmarkVectorSearchAtScale,
  // Memory benchmarks
  runAllMemoryBenchmarks,
  benchmarkBaselineMemory,
  getMemoryStats,
  takeMemorySnapshot,
  type MemorySnapshot,
  // Utilities
  getDeviceInfo,
  estimateDeviceTier,
}

/**
 * Determine device tier based on benchmark results
 */
export function classifyDeviceTier(results: BenchmarkResult[]): DeviceTier {
  const llmResult = results.find(r => r.name.includes('Short Prompt'))
  const vectorResult = results.find(r => r.name.includes('Vector Similarity Search'))
  const embeddingResult = results.find(r => r.name.includes('Single Embedding'))

  // Check for unsupported
  const failedAll = results.every(r => r.status === 'failed')
  if (failedAll) return 'unsupported'

  // Check LLM tier
  let llmTier: DeviceTier = 'mid'
  if (llmResult && llmResult.status !== 'failed') {
    const latency = llmResult.metrics.avgLatencyMs
    if (latency < DEVICE_TIER_THRESHOLDS.llmInferenceMs.high) {
      llmTier = 'high'
    } else if (latency > DEVICE_TIER_THRESHOLDS.llmInferenceMs.mid) {
      llmTier = 'low'
    }
  }

  // Check vector tier
  let vectorTier: DeviceTier = 'mid'
  if (vectorResult && vectorResult.status !== 'failed') {
    const latency = vectorResult.metrics.avgLatencyMs
    if (latency < DEVICE_TIER_THRESHOLDS.vectorSearchMs.high) {
      vectorTier = 'high'
    } else if (latency > DEVICE_TIER_THRESHOLDS.vectorSearchMs.mid) {
      vectorTier = 'low'
    }
  }

  // Check embedding tier
  let embeddingTier: DeviceTier = 'mid'
  if (embeddingResult && embeddingResult.status !== 'failed') {
    const latency = embeddingResult.metrics.avgLatencyMs
    if (latency < DEVICE_TIER_THRESHOLDS.embeddingGenerationMs.high) {
      embeddingTier = 'high'
    } else if (latency > DEVICE_TIER_THRESHOLDS.embeddingGenerationMs.mid) {
      embeddingTier = 'low'
    }
  }

  // Overall tier is the worst of the three
  const tiers = [llmTier, vectorTier, embeddingTier]
  if (tiers.includes('low')) return 'low'
  if (tiers.includes('mid')) return 'mid'
  return 'high'
}

/**
 * Generate recommendations based on benchmark results
 */
export function generateRecommendations(
  results: BenchmarkResult[],
  deviceTier: DeviceTier
): string[] {
  const recommendations: string[] = []

  // Device tier recommendations
  if (deviceTier === 'unsupported') {
    recommendations.push('Your device does not meet minimum requirements. WebGPU support is required.')
    recommendations.push('Try using Chrome 113+ or Edge 113+ with WebGPU enabled.')
    return recommendations
  }

  if (deviceTier === 'low') {
    recommendations.push('Consider using the smaller Gemma 3 270M model for faster responses.')
    recommendations.push('Reduce conversation history length in settings for better performance.')
  }

  // LLM-specific recommendations
  const llmResults = results.filter(r => r.category === 'llm')
  const slowLLM = llmResults.find(r => r.metrics.avgLatencyMs > 5000)
  if (slowLLM) {
    recommendations.push('LLM inference is slower than optimal. Try closing other browser tabs.')
  }

  // Vector-specific recommendations
  const vectorResults = results.filter(r => r.category === 'vector')
  const failedVector = vectorResults.find(r => r.status === 'failed')
  if (failedVector) {
    recommendations.push('Vector embeddings are disabled. Semantic search features will be limited.')
  }

  // Memory recommendations
  const memoryResults = results.filter(r => r.category === 'memory')
  const highMemory = memoryResults.find(r => r.metrics.memoryUsedMB && r.metrics.memoryUsedMB > 2000)
  if (highMemory) {
    recommendations.push('High memory usage detected. Consider clearing conversation history periodically.')
  }

  // Success recommendations
  if (deviceTier === 'high' && recommendations.length === 0) {
    recommendations.push('Your device is well-suited for all features including the full Gemma 3n E4B model.')
  }

  return recommendations
}

/**
 * Generate benchmark summary
 */
export function generateSummary(
  results: BenchmarkResult[],
  totalDurationMs: number
): BenchmarkSummary {
  const passed = results.filter(r => r.status === 'success').length
  const failed = results.filter(r => r.status === 'failed').length
  const deviceTier = classifyDeviceTier(results)
  const recommendations = generateRecommendations(results, deviceTier)

  // Calculate overall score (0-100)
  let score = 100
  score -= failed * 15 // -15 points per failed test
  score -= results.filter(r => r.status === 'partial').length * 5 // -5 for partial

  // Adjust for performance
  const llmResult = results.find(r => r.name.includes('Short Prompt'))
  if (llmResult && llmResult.metrics.avgLatencyMs > 5000) {
    score -= 10
  }

  // Ensure score is in valid range
  score = Math.max(0, Math.min(100, score))

  return {
    totalTests: results.length,
    passed,
    failed,
    totalDurationMs,
    overallScore: score,
    recommendations,
  }
}

/**
 * Run the complete benchmark suite
 */
export async function runFullBenchmarkSuite(
  config: Partial<BenchmarkConfig> = {},
  onProgress?: (
    phase: string,
    benchmarkName: string,
    progress: number,
    total: number
  ) => void
): Promise<BenchmarkSuite> {
  const startTime = Date.now()
  const fullConfig: BenchmarkConfig = { ...DEFAULT_BENCHMARK_CONFIG, ...config }
  const deviceInfo = await getDeviceInfo()
  const results: BenchmarkResult[] = []

  // Phase 1: Memory baseline
  onProgress?.('Memory', 'Baseline', 0, 2)
  const memoryResults = await runAllMemoryBenchmarks((name, progress) => {
    onProgress?.('Memory', name, progress, 100)
  })
  results.push(...memoryResults)

  // Phase 2: Vector benchmarks
  onProgress?.('Vector', 'Initialization', 0, 4)
  const vectorResults = await runAllVectorBenchmarks(fullConfig, (name, i, t) => {
    onProgress?.('Vector', name, i, t)
  })
  results.push(...vectorResults)

  // Phase 3: LLM benchmarks (if model is loaded or we want to include load time)
  onProgress?.('LLM', 'Starting', 0, 4)
  const llmResults = await runAllLLMBenchmarks(
    'gemma-3n-E4B',
    { ...fullConfig, testIterations: 3 }, // Fewer iterations for LLM
    (name, i, t) => {
      onProgress?.('LLM', name, i, t)
    }
  )
  results.push(...llmResults)

  const totalDurationMs = Date.now() - startTime
  const summary = generateSummary(results, totalDurationMs)

  return {
    name: 'QMU.io Performance Benchmark Suite',
    version: '1.0.0',
    runDate: new Date(),
    deviceInfo,
    results,
    summary,
  }
}

/**
 * Run quick benchmarks (minimal iterations, skip heavy tests)
 */
export async function runQuickBenchmarks(
  onProgress?: (benchmarkName: string, progress: number) => void
): Promise<BenchmarkSuite> {
  const startTime = Date.now()
  const deviceInfo = await getDeviceInfo()
  const results: BenchmarkResult[] = []

  // Quick memory check
  onProgress?.('Memory Check', 0)
  results.push(await benchmarkBaselineMemory())
  onProgress?.('Memory Check', 100)

  // Quick embedding check
  onProgress?.('Embedding Check', 0)
  results.push(await benchmarkEmbeddingInit())
  onProgress?.('Embedding Check', 100)

  // Quick vector search
  onProgress?.('Vector Search', 0)
  results.push(await benchmarkVectorSearch({ ...DEFAULT_BENCHMARK_CONFIG, testIterations: 2 }))
  onProgress?.('Vector Search', 100)

  // Quick LLM check (if loaded)
  onProgress?.('LLM Check', 0)
  const { llmEngine } = await import('../lib/llm')
  if (llmEngine.isReady()) {
    results.push(await benchmarkShortPromptInference({ ...DEFAULT_BENCHMARK_CONFIG, testIterations: 2 }))
  }
  onProgress?.('LLM Check', 100)

  const totalDurationMs = Date.now() - startTime
  const summary = generateSummary(results, totalDurationMs)

  return {
    name: 'QMU.io Quick Benchmark',
    version: '1.0.0',
    runDate: new Date(),
    deviceInfo,
    results,
    summary,
  }
}

/**
 * Format benchmark suite as markdown report
 */
export function formatBenchmarkReport(suite: BenchmarkSuite): string {
  const lines: string[] = []

  lines.push(`# ${suite.name}`)
  lines.push('')
  lines.push(`**Version:** ${suite.version}`)
  lines.push(`**Date:** ${suite.runDate.toISOString()}`)
  lines.push('')

  // Device info
  lines.push('## Device Information')
  lines.push('')
  lines.push(`- **Platform:** ${suite.deviceInfo.platform}`)
  lines.push(`- **Cores:** ${suite.deviceInfo.hardwareConcurrency}`)
  lines.push(`- **Memory:** ${suite.deviceInfo.deviceMemoryGB || 'Unknown'} GB`)
  lines.push(`- **WebGPU:** ${suite.deviceInfo.webGPUSupported ? 'Supported' : 'Not Supported'}`)
  if (suite.deviceInfo.webGPUAdapter) {
    lines.push(`- **GPU:** ${suite.deviceInfo.webGPUAdapter}`)
  }
  lines.push('')

  // Summary
  lines.push('## Summary')
  lines.push('')
  lines.push(`- **Total Tests:** ${suite.summary.totalTests}`)
  lines.push(`- **Passed:** ${suite.summary.passed}`)
  lines.push(`- **Failed:** ${suite.summary.failed}`)
  lines.push(`- **Duration:** ${(suite.summary.totalDurationMs / 1000).toFixed(2)}s`)
  lines.push(`- **Score:** ${suite.summary.overallScore}/100`)
  lines.push('')

  // Results table
  lines.push('## Results')
  lines.push('')
  lines.push('| Benchmark | Avg (ms) | P50 (ms) | P95 (ms) | Status |')
  lines.push('|-----------|----------|----------|----------|--------|')

  for (const result of suite.results) {
    const status = result.status === 'success' ? '✅' : result.status === 'partial' ? '⚠️' : '❌'
    lines.push(
      `| ${result.name} | ${result.metrics.avgLatencyMs.toFixed(1)} | ${result.metrics.p50LatencyMs.toFixed(1)} | ${result.metrics.p95LatencyMs.toFixed(1)} | ${status} |`
    )
  }
  lines.push('')

  // Recommendations
  if (suite.summary.recommendations.length > 0) {
    lines.push('## Recommendations')
    lines.push('')
    for (const rec of suite.summary.recommendations) {
      lines.push(`- ${rec}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
