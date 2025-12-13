/**
 * Benchmark Utilities
 * Helper functions for running performance benchmarks
 */

import type { DeviceInfo, BenchmarkConfig } from './types'
import { DEFAULT_BENCHMARK_CONFIG } from './types'

// WebGPU types for browser compatibility
interface GPUAdapterInfo {
  vendor: string
  architecture?: string
}

interface GPUAdapter {
  requestAdapterInfo(): Promise<GPUAdapterInfo>
}

interface GPUInterface {
  requestAdapter(): Promise<GPUAdapter | null>
}

/**
 * Get comprehensive device information
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: {
      type?: string
      effectiveType?: string
    }
  }

  let webGPUAdapter: string | undefined
  let webGPUSupported = false

  // Check WebGPU support
  if ('gpu' in navigator) {
    try {
      const gpu = (navigator as Navigator & { gpu: GPUInterface }).gpu
      const adapter = await gpu.requestAdapter()
      if (adapter) {
        webGPUSupported = true
        const info = await adapter.requestAdapterInfo()
        webGPUAdapter = `${info.vendor} - ${info.architecture || 'unknown'}`
      }
    } catch {
      webGPUSupported = false
    }
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    deviceMemoryGB: nav.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency || 1,
    webGPUSupported,
    webGPUAdapter,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    connectionType: nav.connection?.type,
    effectiveType: nav.connection?.effectiveType,
  }
}

/**
 * Calculate percentiles from an array of numbers
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

/**
 * Calculate statistics from latency measurements
 */
export function calculateStats(latencies: number[]): {
  avg: number
  min: number
  max: number
  p50: number
  p95: number
  p99: number
} {
  if (latencies.length === 0) {
    return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 }
  }

  const sum = latencies.reduce((a, b) => a + b, 0)
  return {
    avg: sum / latencies.length,
    min: Math.min(...latencies),
    max: Math.max(...latencies),
    p50: calculatePercentile(latencies, 50),
    p95: calculatePercentile(latencies, 95),
    p99: calculatePercentile(latencies, 99),
  }
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Run a benchmark with warmup, iterations, and cooldown
 */
export async function runBenchmark<T>(
  _name: string,
  fn: () => Promise<T>,
  config: BenchmarkConfig = DEFAULT_BENCHMARK_CONFIG,
  onProgress?: (iteration: number, total: number) => void
): Promise<{ latencies: number[]; results: T[]; errors: Error[] }> {
  const latencies: number[] = []
  const results: T[] = []
  const errors: Error[] = []

  // Warmup iterations (not measured)
  for (let i = 0; i < config.warmupIterations; i++) {
    try {
      await fn()
    } catch (e) {
      console.warn(`Warmup ${i + 1} failed:`, e)
    }
    await sleep(config.cooldownMs)
  }

  // Measured iterations
  const totalIterations = config.testIterations
  for (let i = 0; i < totalIterations; i++) {
    onProgress?.(i + 1, totalIterations)

    const start = performance.now()
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Benchmark timeout')), config.timeoutMs)
        ),
      ])
      const end = performance.now()
      latencies.push(end - start)
      results.push(result)
    } catch (e) {
      const end = performance.now()
      latencies.push(end - start)
      errors.push(e instanceof Error ? e : new Error(String(e)))
    }

    await sleep(config.cooldownMs)
  }

  return { latencies, results, errors }
}

/**
 * Get memory usage if available (Chrome only)
 */
export async function getMemoryUsage(): Promise<number | undefined> {
  // @ts-expect-error - Performance.memory is Chrome-specific
  const memory = performance.memory

  if (memory) {
    return memory.usedJSHeapSize / (1024 * 1024) // Convert to MB
  }

  return undefined
}

/**
 * Format benchmark results as a readable string
 */
export function formatBenchmarkResult(
  name: string,
  stats: { avg: number; min: number; max: number; p50: number; p95: number; p99: number },
  iterations: number
): string {
  return `
${name}
${'='.repeat(name.length)}
Iterations: ${iterations}
Average:    ${stats.avg.toFixed(2)}ms
Min:        ${stats.min.toFixed(2)}ms
Max:        ${stats.max.toFixed(2)}ms
P50:        ${stats.p50.toFixed(2)}ms
P95:        ${stats.p95.toFixed(2)}ms
P99:        ${stats.p99.toFixed(2)}ms
`.trim()
}

/**
 * Estimate device tier based on hardware
 */
export function estimateDeviceTier(deviceInfo: DeviceInfo): 'high' | 'mid' | 'low' | 'unknown' {
  if (!deviceInfo.webGPUSupported) {
    return 'low'
  }

  const memory = deviceInfo.deviceMemoryGB || 4
  const cores = deviceInfo.hardwareConcurrency

  if (memory >= 16 && cores >= 8) {
    return 'high'
  } else if (memory >= 8 && cores >= 4) {
    return 'mid'
  } else if (memory >= 4 && cores >= 2) {
    return 'low'
  }

  return 'unknown'
}

/**
 * Generate test data for benchmarks
 */
export function generateTestMessages(count: number): string[] {
  const templates = [
    "I've been thinking about how technology shapes our daily lives and interactions.",
    "My approach to problem-solving usually involves breaking things down into smaller steps.",
    "I find that creative activities help me relax and process my thoughts better.",
    "Learning new skills is something I genuinely enjoy, even when it's challenging.",
    "I believe that understanding different perspectives makes us better communicators.",
    "Time management has always been something I work on improving.",
    "I tend to reflect on my experiences to understand patterns in my behavior.",
    "Building meaningful relationships requires both patience and genuine interest.",
    "I'm curious about how artificial intelligence will change education.",
    "My values guide most of my important decisions in life.",
  ]

  const messages: string[] = []
  for (let i = 0; i < count; i++) {
    messages.push(templates[i % templates.length])
  }
  return messages
}

/**
 * Generate random embeddings for testing vector operations
 */
export function generateRandomEmbedding(dimensions: number = 384): number[] {
  const embedding: number[] = []
  let magnitude = 0

  // Generate random values
  for (let i = 0; i < dimensions; i++) {
    const val = Math.random() * 2 - 1 // Range [-1, 1]
    embedding.push(val)
    magnitude += val * val
  }

  // Normalize
  magnitude = Math.sqrt(magnitude)
  for (let i = 0; i < dimensions; i++) {
    embedding[i] /= magnitude
  }

  return embedding
}
