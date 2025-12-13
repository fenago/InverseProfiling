/**
 * LLM Performance Benchmarks
 * Measures Gemma 3n inference latency across different scenarios
 */

import type { BenchmarkResult, BenchmarkConfig } from './types'
import { DEFAULT_BENCHMARK_CONFIG } from './types'
import {
  runBenchmark,
  calculateStats,
  getDeviceInfo,
  getMemoryUsage,
  sleep,
} from './utils'
import { llmEngine, MODELS, type ModelId } from '../lib/llm'

/**
 * Benchmark LLM cold start (model loading)
 */
export async function benchmarkModelLoad(
  modelId: ModelId = 'gemma-3n-E4B',
  onProgress?: (msg: string) => void
): Promise<BenchmarkResult> {
  const deviceInfo = await getDeviceInfo()
  const model = MODELS[modelId]

  onProgress?.(`Starting model load benchmark for ${model.name}...`)

  const start = performance.now()
  let error: string | undefined

  try {
    // Unload if already loaded
    if (llmEngine.isReady()) {
      await llmEngine.unload()
      await sleep(1000) // Allow cleanup
    }

    await llmEngine.initialize(modelId)
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }

  const end = performance.now()
  const loadTimeMs = end - start
  const memoryUsed = await getMemoryUsage()

  return {
    name: `Model Load: ${model.name}`,
    category: 'llm',
    metrics: {
      avgLatencyMs: loadTimeMs,
      minLatencyMs: loadTimeMs,
      maxLatencyMs: loadTimeMs,
      p50LatencyMs: loadTimeMs,
      p95LatencyMs: loadTimeMs,
      p99LatencyMs: loadTimeMs,
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
 * Benchmark LLM inference with short prompts
 */
export async function benchmarkShortPromptInference(
  config: BenchmarkConfig = DEFAULT_BENCHMARK_CONFIG,
  onProgress?: (iteration: number, total: number) => void
): Promise<BenchmarkResult> {
  const deviceInfo = await getDeviceInfo()

  if (!llmEngine.isReady()) {
    return {
      name: 'Short Prompt Inference',
      category: 'llm',
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
      error: 'Model not loaded',
    }
  }

  const shortPrompts = [
    'Hello, how are you?',
    'What is 2 + 2?',
    'Name a color.',
    'Say yes or no.',
    'Count to 3.',
  ]

  const { latencies, errors } = await runBenchmark(
    'Short Prompt Inference',
    async () => {
      const prompt = shortPrompts[Math.floor(Math.random() * shortPrompts.length)]
      return await llmEngine.generate(prompt)
    },
    config,
    onProgress
  )

  const stats = calculateStats(latencies)
  const memoryUsed = await getMemoryUsage()

  return {
    name: 'Short Prompt Inference (< 20 tokens)',
    category: 'llm',
    metrics: {
      avgLatencyMs: stats.avg,
      minLatencyMs: stats.min,
      maxLatencyMs: stats.max,
      p50LatencyMs: stats.p50,
      p95LatencyMs: stats.p95,
      p99LatencyMs: stats.p99,
      throughput: 1000 / stats.avg, // prompts per second
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
 * Benchmark LLM inference with medium prompts
 */
export async function benchmarkMediumPromptInference(
  config: BenchmarkConfig = DEFAULT_BENCHMARK_CONFIG,
  onProgress?: (iteration: number, total: number) => void
): Promise<BenchmarkResult> {
  const deviceInfo = await getDeviceInfo()

  if (!llmEngine.isReady()) {
    return {
      name: 'Medium Prompt Inference',
      category: 'llm',
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
      error: 'Model not loaded',
    }
  }

  const mediumPrompts = [
    "Explain in one paragraph why exercise is important for mental health.",
    "Describe the basic process of photosynthesis in simple terms.",
    "What are three key factors to consider when making an important decision?",
    "Summarize the benefits of learning a second language.",
    "Explain what emotional intelligence means and why it matters.",
  ]

  const { latencies, errors } = await runBenchmark(
    'Medium Prompt Inference',
    async () => {
      const prompt = mediumPrompts[Math.floor(Math.random() * mediumPrompts.length)]
      return await llmEngine.generate(prompt)
    },
    config,
    onProgress
  )

  const stats = calculateStats(latencies)
  const memoryUsed = await getMemoryUsage()

  return {
    name: 'Medium Prompt Inference (50-100 tokens)',
    category: 'llm',
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
 * Benchmark LLM inference with conversation context
 */
export async function benchmarkConversationInference(
  config: BenchmarkConfig = DEFAULT_BENCHMARK_CONFIG,
  onProgress?: (iteration: number, total: number) => void
): Promise<BenchmarkResult> {
  const deviceInfo = await getDeviceInfo()

  if (!llmEngine.isReady()) {
    return {
      name: 'Conversation Inference',
      category: 'llm',
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
      error: 'Model not loaded',
    }
  }

  const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: "Hi, I'm interested in learning about psychology." },
    { role: 'assistant', content: "Psychology is fascinating! It's the scientific study of mind and behavior. Are you interested in any particular area - like cognitive psychology, social psychology, or clinical psychology?" },
    { role: 'user', content: "I think cognitive psychology sounds interesting. What does it cover?" },
    { role: 'assistant', content: "Cognitive psychology focuses on mental processes like perception, memory, thinking, and problem-solving. It explores how we acquire, process, and store information. Key topics include attention, language, decision-making, and learning." },
  ]

  const followUpQuestions = [
    "Can you give me an example of a cognitive bias?",
    "How does memory actually work?",
    "What's the difference between short-term and long-term memory?",
    "How do emotions affect our decision-making?",
    "What is confirmation bias?",
  ]

  const { latencies, errors } = await runBenchmark(
    'Conversation Inference',
    async () => {
      const prompt = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]
      return await llmEngine.generate(prompt, undefined, conversationHistory)
    },
    config,
    onProgress
  )

  const stats = calculateStats(latencies)
  const memoryUsed = await getMemoryUsage()

  return {
    name: 'Conversation Inference (with 4-turn context)',
    category: 'llm',
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
 * Run all LLM benchmarks
 */
export async function runAllLLMBenchmarks(
  modelId: ModelId = 'gemma-3n-E4B',
  config: BenchmarkConfig = { ...DEFAULT_BENCHMARK_CONFIG, testIterations: 3 },
  onProgress?: (benchmarkName: string, iteration: number, total: number) => void
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = []

  // Model load benchmark (only if not loaded)
  if (!llmEngine.isReady()) {
    onProgress?.('Model Load', 0, 1)
    const loadResult = await benchmarkModelLoad(modelId, (_msg) => {
      onProgress?.('Model Load', 0, 1)
    })
    results.push(loadResult)

    if (loadResult.status === 'failed') {
      return results // Can't continue without model
    }
  }

  // Short prompt benchmark
  onProgress?.('Short Prompt', 0, config.testIterations)
  results.push(
    await benchmarkShortPromptInference(config, (i, t) =>
      onProgress?.('Short Prompt', i, t)
    )
  )

  // Medium prompt benchmark
  onProgress?.('Medium Prompt', 0, config.testIterations)
  results.push(
    await benchmarkMediumPromptInference(config, (i, t) =>
      onProgress?.('Medium Prompt', i, t)
    )
  )

  // Conversation benchmark
  onProgress?.('Conversation', 0, config.testIterations)
  results.push(
    await benchmarkConversationInference(config, (i, t) =>
      onProgress?.('Conversation', i, t)
    )
  )

  return results
}
