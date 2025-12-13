/**
 * Benchmark Types
 * Shared types for the performance benchmark suite
 */

export interface BenchmarkResult {
  name: string
  category: 'llm' | 'vector' | 'memory' | 'analysis' | 'storage'
  metrics: {
    avgLatencyMs: number
    minLatencyMs: number
    maxLatencyMs: number
    p50LatencyMs: number
    p95LatencyMs: number
    p99LatencyMs: number
    throughput?: number // operations per second
    memoryUsedMB?: number
  }
  iterations: number
  timestamp: Date
  deviceInfo: DeviceInfo
  status: 'success' | 'partial' | 'failed'
  error?: string
}

export interface DeviceInfo {
  userAgent: string
  platform: string
  deviceMemoryGB?: number
  hardwareConcurrency: number
  webGPUSupported: boolean
  webGPUAdapter?: string
  screenResolution: string
  connectionType?: string
  effectiveType?: string
}

export interface BenchmarkSuite {
  name: string
  version: string
  runDate: Date
  deviceInfo: DeviceInfo
  results: BenchmarkResult[]
  summary: BenchmarkSummary
}

export interface BenchmarkSummary {
  totalTests: number
  passed: number
  failed: number
  totalDurationMs: number
  overallScore: number // 0-100
  recommendations: string[]
}

export interface BenchmarkConfig {
  warmupIterations: number
  testIterations: number
  cooldownMs: number
  timeoutMs: number
}

export const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
  warmupIterations: 2,
  testIterations: 5,
  cooldownMs: 100,
  timeoutMs: 60000, // 1 minute timeout
}

// Device tier classification based on benchmarks
export type DeviceTier = 'high' | 'mid' | 'low' | 'unsupported'

export interface DeviceTierThresholds {
  llmInferenceMs: { high: number; mid: number } // Below high = high tier, below mid = mid tier
  vectorSearchMs: { high: number; mid: number }
  embeddingGenerationMs: { high: number; mid: number }
}

export const DEVICE_TIER_THRESHOLDS: DeviceTierThresholds = {
  llmInferenceMs: { high: 2000, mid: 5000 }, // <2s = high, <5s = mid, else = low
  vectorSearchMs: { high: 50, mid: 200 }, // <50ms = high, <200ms = mid
  embeddingGenerationMs: { high: 100, mid: 500 }, // <100ms = high, <500ms = mid
}
