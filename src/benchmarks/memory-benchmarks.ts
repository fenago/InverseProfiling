/**
 * Memory Usage Benchmarks
 * Tracks memory footprint over time and under load
 */

import type { BenchmarkResult, BenchmarkConfig } from './types'
import { DEFAULT_BENCHMARK_CONFIG } from './types'
import { getDeviceInfo, sleep } from './utils'

// Extended Performance interface for Chrome's memory API
interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

/**
 * Get current memory usage in MB
 */
export function getMemoryUsageMB(): number | undefined {
  const perf = performance as PerformanceWithMemory
  if (perf.memory) {
    return perf.memory.usedJSHeapSize / (1024 * 1024)
  }
  return undefined
}

/**
 * Get total heap size in MB
 */
export function getTotalHeapMB(): number | undefined {
  const perf = performance as PerformanceWithMemory
  if (perf.memory) {
    return perf.memory.totalJSHeapSize / (1024 * 1024)
  }
  return undefined
}

/**
 * Get heap limit in MB
 */
export function getHeapLimitMB(): number | undefined {
  const perf = performance as PerformanceWithMemory
  if (perf.memory) {
    return perf.memory.jsHeapSizeLimit / (1024 * 1024)
  }
  return undefined
}

/**
 * Check if memory API is available
 */
export function isMemoryApiAvailable(): boolean {
  const perf = performance as PerformanceWithMemory
  return perf.memory !== undefined
}

/**
 * Snapshot current memory state
 */
export interface MemorySnapshot {
  timestamp: Date
  usedHeapMB?: number
  totalHeapMB?: number
  heapLimitMB?: number
  heapUsagePercent?: number
}

export function takeMemorySnapshot(): MemorySnapshot {
  const used = getMemoryUsageMB()
  const total = getTotalHeapMB()
  const limit = getHeapLimitMB()

  return {
    timestamp: new Date(),
    usedHeapMB: used,
    totalHeapMB: total,
    heapLimitMB: limit,
    heapUsagePercent: used && limit ? (used / limit) * 100 : undefined,
  }
}

/**
 * Track memory usage over a period of time
 */
export async function trackMemoryOverTime(
  durationMs: number = 30000,
  intervalMs: number = 1000,
  onSnapshot?: (snapshot: MemorySnapshot) => void
): Promise<MemorySnapshot[]> {
  const snapshots: MemorySnapshot[] = []
  const startTime = Date.now()

  while (Date.now() - startTime < durationMs) {
    const snapshot = takeMemorySnapshot()
    snapshots.push(snapshot)
    onSnapshot?.(snapshot)
    await sleep(intervalMs)
  }

  return snapshots
}

/**
 * Benchmark baseline memory usage
 */
export async function benchmarkBaselineMemory(): Promise<BenchmarkResult> {
  const deviceInfo = await getDeviceInfo()

  if (!isMemoryApiAvailable()) {
    return {
      name: 'Baseline Memory',
      category: 'memory',
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
      error: 'Memory API not available (Chrome-only feature)',
    }
  }

  // Take a few snapshots to get stable baseline
  const snapshots: number[] = []
  for (let i = 0; i < 5; i++) {
    const mem = getMemoryUsageMB()
    if (mem) snapshots.push(mem)
    await sleep(100)
  }

  const avgMemory = snapshots.reduce((a, b) => a + b, 0) / snapshots.length

  return {
    name: 'Baseline Memory Usage',
    category: 'memory',
    metrics: {
      avgLatencyMs: 0, // Not applicable for memory
      minLatencyMs: 0,
      maxLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      memoryUsedMB: avgMemory,
    },
    iterations: snapshots.length,
    timestamp: new Date(),
    deviceInfo,
    status: 'success',
  }
}

/**
 * Benchmark memory growth during operations
 */
export async function benchmarkMemoryGrowth(
  operationFn: () => Promise<void>,
  operationCount: number = 10,
  _config: BenchmarkConfig = DEFAULT_BENCHMARK_CONFIG,
  onProgress?: (iteration: number, total: number) => void
): Promise<BenchmarkResult & { memoryGrowthMB: number }> {
  const deviceInfo = await getDeviceInfo()

  if (!isMemoryApiAvailable()) {
    return {
      name: 'Memory Growth',
      category: 'memory',
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
      error: 'Memory API not available',
      memoryGrowthMB: 0,
    }
  }

  // Record initial memory
  const initialMemory = getMemoryUsageMB() || 0
  const memoryReadings: number[] = [initialMemory]

  // Run operations and track memory
  for (let i = 0; i < operationCount; i++) {
    await operationFn()
    const currentMemory = getMemoryUsageMB()
    if (currentMemory) memoryReadings.push(currentMemory)
    onProgress?.(i + 1, operationCount)
    await sleep(50)
  }

  // Calculate growth
  const finalMemory = memoryReadings[memoryReadings.length - 1]
  const memoryGrowth = finalMemory - initialMemory
  const avgMemory = memoryReadings.reduce((a, b) => a + b, 0) / memoryReadings.length

  return {
    name: 'Memory Growth During Operations',
    category: 'memory',
    metrics: {
      avgLatencyMs: 0,
      minLatencyMs: 0,
      maxLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      memoryUsedMB: avgMemory,
    },
    iterations: operationCount,
    timestamp: new Date(),
    deviceInfo,
    status: 'success',
    memoryGrowthMB: memoryGrowth,
  }
}

/**
 * Benchmark memory after garbage collection hint
 */
export async function benchmarkMemoryAfterGC(): Promise<BenchmarkResult> {
  const deviceInfo = await getDeviceInfo()

  if (!isMemoryApiAvailable()) {
    return {
      name: 'Memory After GC',
      category: 'memory',
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
      error: 'Memory API not available',
    }
  }

  // Create some garbage to collect
  const garbage: string[] = []
  for (let i = 0; i < 10000; i++) {
    garbage.push('x'.repeat(1000))
  }
  garbage.length = 0 // Clear reference

  // Wait a bit for GC opportunity
  await sleep(1000)

  const afterGC = getMemoryUsageMB() || 0

  return {
    name: 'Memory After GC Hint',
    category: 'memory',
    metrics: {
      avgLatencyMs: 0,
      minLatencyMs: 0,
      maxLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      memoryUsedMB: afterGC,
    },
    iterations: 1,
    timestamp: new Date(),
    deviceInfo,
    status: 'success',
  }
}

/**
 * Get memory statistics summary
 */
export function getMemoryStats(): {
  available: boolean
  currentMB?: number
  totalMB?: number
  limitMB?: number
  usagePercent?: number
} {
  if (!isMemoryApiAvailable()) {
    return { available: false }
  }

  const current = getMemoryUsageMB()
  const total = getTotalHeapMB()
  const limit = getHeapLimitMB()

  return {
    available: true,
    currentMB: current,
    totalMB: total,
    limitMB: limit,
    usagePercent: current && limit ? (current / limit) * 100 : undefined,
  }
}

/**
 * Run all memory benchmarks
 */
export async function runAllMemoryBenchmarks(
  onProgress?: (benchmarkName: string, progress: number) => void
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = []

  onProgress?.('Baseline Memory', 0)
  results.push(await benchmarkBaselineMemory())
  onProgress?.('Baseline Memory', 100)

  onProgress?.('Memory After GC', 0)
  results.push(await benchmarkMemoryAfterGC())
  onProgress?.('Memory After GC', 100)

  return results
}
