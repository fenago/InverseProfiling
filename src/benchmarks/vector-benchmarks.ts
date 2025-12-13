/**
 * Vector Database Performance Benchmarks
 * Measures TinkerBird and embedding operations
 */

import type { BenchmarkResult, BenchmarkConfig } from './types'
import { DEFAULT_BENCHMARK_CONFIG } from './types'
import {
  runBenchmark,
  calculateStats,
  getDeviceInfo,
  getMemoryUsage,
  generateTestMessages,
} from './utils'
import {
  initVectorDB,
  generateEmbedding,
  storeMessageEmbedding,
  searchSimilarMessages,
  getVectorStats,
  isEmbeddingAvailable,
} from '../lib/vectordb'

/**
 * Benchmark embedding model initialization
 */
export async function benchmarkEmbeddingInit(): Promise<BenchmarkResult> {
  const deviceInfo = await getDeviceInfo()

  const start = performance.now()
  let error: string | undefined

  try {
    await initVectorDB()
    // Warm up the embedding model
    await generateEmbedding('test')
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }

  const end = performance.now()
  const initTimeMs = end - start
  const memoryUsed = await getMemoryUsage()

  return {
    name: 'Embedding Model Initialization',
    category: 'vector',
    metrics: {
      avgLatencyMs: initTimeMs,
      minLatencyMs: initTimeMs,
      maxLatencyMs: initTimeMs,
      p50LatencyMs: initTimeMs,
      p95LatencyMs: initTimeMs,
      p99LatencyMs: initTimeMs,
      memoryUsedMB: memoryUsed,
    },
    iterations: 1,
    timestamp: new Date(),
    deviceInfo,
    status: error ? 'failed' : 'success',
    error,
  }
}

/**
 * Benchmark single embedding generation
 */
export async function benchmarkEmbeddingGeneration(
  config: BenchmarkConfig = DEFAULT_BENCHMARK_CONFIG,
  onProgress?: (iteration: number, total: number) => void
): Promise<BenchmarkResult> {
  const deviceInfo = await getDeviceInfo()

  if (!isEmbeddingAvailable()) {
    return {
      name: 'Embedding Generation',
      category: 'vector',
      metrics: {
        avgLatencyMs: 0,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
      },
      iterations: 0,
      timestamp: new Date(),
      deviceInfo,
      status: 'failed',
      error: 'Embedding model not available',
    }
  }

  const testMessages = generateTestMessages(config.testIterations + config.warmupIterations)
  let messageIndex = 0

  const { latencies, errors } = await runBenchmark(
    'Embedding Generation',
    async () => {
      const message = testMessages[messageIndex % testMessages.length]
      messageIndex++
      return await generateEmbedding(message)
    },
    config,
    onProgress
  )

  const stats = calculateStats(latencies)
  const memoryUsed = await getMemoryUsage()

  return {
    name: 'Single Embedding Generation',
    category: 'vector',
    metrics: {
      avgLatencyMs: stats.avg,
      minLatencyMs: stats.min,
      maxLatencyMs: stats.max,
      p50LatencyMs: stats.p50,
      p95LatencyMs: stats.p95,
      p99LatencyMs: stats.p99,
      throughput: 1000 / stats.avg, // embeddings per second
      memoryUsedMB: memoryUsed,
    },
    iterations: config.testIterations,
    timestamp: new Date(),
    deviceInfo,
    status: errors.length === 0 ? 'success' : errors.length < config.testIterations ? 'partial' : 'failed',
    error: errors.length > 0 ? errors[0].message : undefined,
  }
}

/**
 * Benchmark vector storage operation
 */
export async function benchmarkVectorStorage(
  config: BenchmarkConfig = DEFAULT_BENCHMARK_CONFIG,
  onProgress?: (iteration: number, total: number) => void
): Promise<BenchmarkResult> {
  const deviceInfo = await getDeviceInfo()

  if (!isEmbeddingAvailable()) {
    return {
      name: 'Vector Storage',
      category: 'vector',
      metrics: {
        avgLatencyMs: 0,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
      },
      iterations: 0,
      timestamp: new Date(),
      deviceInfo,
      status: 'failed',
      error: 'Embedding model not available',
    }
  }

  await initVectorDB()
  const testMessages = generateTestMessages(config.testIterations + config.warmupIterations)
  let messageId = Date.now()

  const { latencies, errors } = await runBenchmark(
    'Vector Storage',
    async () => {
      const message = testMessages[messageId % testMessages.length]
      await storeMessageEmbedding(messageId++, message, {
        sessionId: 'benchmark',
        role: 'user',
        timestamp: new Date(),
      })
    },
    config,
    onProgress
  )

  const stats = calculateStats(latencies)
  const memoryUsed = await getMemoryUsage()

  return {
    name: 'Vector Storage (embed + store + index)',
    category: 'vector',
    metrics: {
      avgLatencyMs: stats.avg,
      minLatencyMs: stats.min,
      maxLatencyMs: stats.max,
      p50LatencyMs: stats.p50,
      p95LatencyMs: stats.p95,
      p99LatencyMs: stats.p99,
      throughput: 1000 / stats.avg, // operations per second
      memoryUsedMB: memoryUsed,
    },
    iterations: config.testIterations,
    timestamp: new Date(),
    deviceInfo,
    status: errors.length === 0 ? 'success' : errors.length < config.testIterations ? 'partial' : 'failed',
    error: errors.length > 0 ? errors[0].message : undefined,
  }
}

/**
 * Benchmark vector similarity search
 */
export async function benchmarkVectorSearch(
  config: BenchmarkConfig = DEFAULT_BENCHMARK_CONFIG,
  onProgress?: (iteration: number, total: number) => void
): Promise<BenchmarkResult> {
  const deviceInfo = await getDeviceInfo()

  if (!isEmbeddingAvailable()) {
    return {
      name: 'Vector Search',
      category: 'vector',
      metrics: {
        avgLatencyMs: 0,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
      },
      iterations: 0,
      timestamp: new Date(),
      deviceInfo,
      status: 'failed',
      error: 'Embedding model not available',
    }
  }

  // Ensure we have some data to search
  const stats = await getVectorStats()
  if (stats.messageCount < 10) {
    // Add some test data
    const testMessages = generateTestMessages(20)
    for (let i = 0; i < 20; i++) {
      await storeMessageEmbedding(Date.now() + i, testMessages[i], {
        sessionId: 'benchmark-seed',
        role: 'user',
      })
    }
  }

  const searchQueries = [
    'technology and daily life',
    'problem solving approaches',
    'creative activities and relaxation',
    'learning new skills',
    'understanding perspectives',
  ]

  const { latencies, errors } = await runBenchmark(
    'Vector Search',
    async () => {
      const query = searchQueries[Math.floor(Math.random() * searchQueries.length)]
      return await searchSimilarMessages(query, 10)
    },
    config,
    onProgress
  )

  const statsResult = calculateStats(latencies)
  const memoryUsed = await getMemoryUsage()

  return {
    name: 'Vector Similarity Search (top 10)',
    category: 'vector',
    metrics: {
      avgLatencyMs: statsResult.avg,
      minLatencyMs: statsResult.min,
      maxLatencyMs: statsResult.max,
      p50LatencyMs: statsResult.p50,
      p95LatencyMs: statsResult.p95,
      p99LatencyMs: statsResult.p99,
      throughput: 1000 / statsResult.avg, // queries per second
      memoryUsedMB: memoryUsed,
    },
    iterations: config.testIterations,
    timestamp: new Date(),
    deviceInfo,
    status: errors.length === 0 ? 'success' : errors.length < config.testIterations ? 'partial' : 'failed',
    error: errors.length > 0 ? errors[0].message : undefined,
  }
}

/**
 * Benchmark vector search at scale (with many vectors)
 */
export async function benchmarkVectorSearchAtScale(
  vectorCount: number = 100,
  config: BenchmarkConfig = { ...DEFAULT_BENCHMARK_CONFIG, testIterations: 5 },
  onProgress?: (phase: string, progress: number) => void
): Promise<BenchmarkResult> {
  const deviceInfo = await getDeviceInfo()

  if (!isEmbeddingAvailable()) {
    return {
      name: `Vector Search at Scale (${vectorCount} vectors)`,
      category: 'vector',
      metrics: {
        avgLatencyMs: 0,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
      },
      iterations: 0,
      timestamp: new Date(),
      deviceInfo,
      status: 'failed',
      error: 'Embedding model not available',
    }
  }

  await initVectorDB()

  // Check current count
  const currentStats = await getVectorStats()
  const neededCount = vectorCount - currentStats.messageCount

  // Seed with more data if needed
  if (neededCount > 0) {
    onProgress?.('Seeding vectors', 0)
    const testMessages = generateTestMessages(neededCount)
    for (let i = 0; i < neededCount; i++) {
      await storeMessageEmbedding(Date.now() + i, testMessages[i % testMessages.length], {
        sessionId: 'benchmark-scale',
        role: 'user',
      })
      if (i % 10 === 0) {
        onProgress?.('Seeding vectors', (i / neededCount) * 100)
      }
    }
  }

  onProgress?.('Running search benchmark', 0)

  const searchQueries = [
    'technology impacts',
    'learning challenges',
    'emotional processing',
    'decision making',
    'relationship building',
  ]

  const { latencies, errors } = await runBenchmark(
    'Vector Search at Scale',
    async () => {
      const query = searchQueries[Math.floor(Math.random() * searchQueries.length)]
      return await searchSimilarMessages(query, 10)
    },
    config,
    (i, t) => onProgress?.('Running search benchmark', (i / t) * 100)
  )

  const stats = calculateStats(latencies)
  const memoryUsed = await getMemoryUsage()

  return {
    name: `Vector Search at Scale (${vectorCount} vectors)`,
    category: 'vector',
    metrics: {
      avgLatencyMs: stats.avg,
      minLatencyMs: stats.min,
      maxLatencyMs: stats.max,
      p50LatencyMs: stats.p50,
      p95LatencyMs: stats.p95,
      p99LatencyMs: stats.p99,
      throughput: 1000 / stats.avg,
      memoryUsedMB: memoryUsed,
    },
    iterations: config.testIterations,
    timestamp: new Date(),
    deviceInfo,
    status: errors.length === 0 ? 'success' : errors.length < config.testIterations ? 'partial' : 'failed',
    error: errors.length > 0 ? errors[0].message : undefined,
  }
}

/**
 * Run all vector benchmarks
 */
export async function runAllVectorBenchmarks(
  config: BenchmarkConfig = { ...DEFAULT_BENCHMARK_CONFIG, testIterations: 5 },
  onProgress?: (benchmarkName: string, iteration: number, total: number) => void
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = []

  // Initialization benchmark
  onProgress?.('Embedding Init', 0, 1)
  const initResult = await benchmarkEmbeddingInit()
  results.push(initResult)

  if (!isEmbeddingAvailable()) {
    // Can't continue without embeddings
    return results
  }

  // Embedding generation benchmark
  onProgress?.('Embedding Generation', 0, config.testIterations)
  results.push(
    await benchmarkEmbeddingGeneration(config, (i, t) =>
      onProgress?.('Embedding Generation', i, t)
    )
  )

  // Vector storage benchmark
  onProgress?.('Vector Storage', 0, config.testIterations)
  results.push(
    await benchmarkVectorStorage(config, (i, t) =>
      onProgress?.('Vector Storage', i, t)
    )
  )

  // Vector search benchmark
  onProgress?.('Vector Search', 0, config.testIterations)
  results.push(
    await benchmarkVectorSearch(config, (i, t) =>
      onProgress?.('Vector Search', i, t)
    )
  )

  return results
}
