import { useState, useCallback } from 'react'
import {
  Gauge,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Cpu,
  Database,
  HardDrive,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
} from 'lucide-react'
import clsx from 'clsx'
import {
  runFullBenchmarkSuite,
  runQuickBenchmarks,
  formatBenchmarkReport,
  classifyDeviceTier,
  type BenchmarkSuite,
  type BenchmarkResult,
} from '../benchmarks'

type RunState = 'idle' | 'running' | 'complete'

export default function BenchmarkPage() {
  const [runState, setRunState] = useState<RunState>('idle')
  const [suite, setSuite] = useState<BenchmarkSuite | null>(null)
  const [currentPhase, setCurrentPhase] = useState<string>('')
  const [currentBenchmark, setCurrentBenchmark] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)
  const [expandedResult, setExpandedResult] = useState<string | null>(null)

  const handleRunFullBenchmarks = useCallback(async () => {
    setRunState('running')
    setCurrentPhase('Starting...')
    setCurrentBenchmark('')
    setProgress(0)
    setSuite(null)

    try {
      const result = await runFullBenchmarkSuite(
        { testIterations: 5 },
        (phase, benchmark, iter, total) => {
          setCurrentPhase(phase)
          setCurrentBenchmark(benchmark)
          setProgress(total > 0 ? (iter / total) * 100 : 0)
        }
      )
      setSuite(result)
      setRunState('complete')
    } catch (error) {
      console.error('Benchmark failed:', error)
      setRunState('idle')
    }
  }, [])

  const handleRunQuickBenchmarks = useCallback(async () => {
    setRunState('running')
    setCurrentPhase('Quick Test')
    setCurrentBenchmark('')
    setProgress(0)
    setSuite(null)

    try {
      const result = await runQuickBenchmarks((benchmark, prog) => {
        setCurrentBenchmark(benchmark)
        setProgress(prog)
      })
      setSuite(result)
      setRunState('complete')
    } catch (error) {
      console.error('Quick benchmark failed:', error)
      setRunState('idle')
    }
  }, [])

  const handleExportReport = useCallback(() => {
    if (!suite) return

    const report = formatBenchmarkReport(suite)
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `benchmark-report-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [suite])

  const getStatusIcon = (status: BenchmarkResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getCategoryIcon = (category: BenchmarkResult['category']) => {
    switch (category) {
      case 'llm':
        return <Cpu className="w-4 h-4" />
      case 'vector':
        return <Database className="w-4 h-4" />
      case 'memory':
        return <HardDrive className="w-4 h-4" />
      default:
        return <Gauge className="w-4 h-4" />
    }
  }

  const deviceTier = suite ? classifyDeviceTier(suite.results) : null

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'high':
        return 'text-green-600 bg-green-100'
      case 'mid':
        return 'text-amber-600 bg-amber-100'
      case 'low':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance Benchmarks</h1>
        <p className="text-gray-500">
          Measure your device's performance for AI inference and vector operations
        </p>
      </div>

      {/* Run Benchmarks Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Run Benchmarks</h2>
              <p className="text-sm text-gray-500">
                Test your device's capabilities for QMU.io
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRunQuickBenchmarks}
              disabled={runState === 'running'}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                runState === 'running'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              )}
            >
              <Zap className="w-4 h-4" />
              Quick Test (~30s)
            </button>

            <button
              onClick={handleRunFullBenchmarks}
              disabled={runState === 'running'}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                runState === 'running'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              )}
            >
              <Play className="w-4 h-4" />
              Full Benchmark (~2-5 min)
            </button>

            {suite && (
              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            )}
          </div>

          {/* Progress indicator */}
          {runState === 'running' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {currentPhase} - {currentBenchmark}
                </span>
                <span className="text-gray-500">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running benchmarks...
              </div>
            </div>
          )}

          {/* Device tier result */}
          {suite && deviceTier && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Device Performance Tier</p>
                  <p className="text-sm text-gray-500">Based on benchmark results</p>
                </div>
                <span
                  className={clsx(
                    'px-3 py-1 rounded-full font-medium text-sm capitalize',
                    getTierColor(deviceTier)
                  )}
                >
                  {deviceTier}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {suite && (
        <>
          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
                  <p className="text-sm text-gray-500">
                    {suite.summary.passed} of {suite.summary.totalTests} tests passed
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {suite.summary.overallScore}
                </p>
                <p className="text-xs text-gray-500">Score (0-100)</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {suite.summary.passed}
                </p>
                <p className="text-xs text-gray-500">Passed</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {suite.summary.failed}
                </p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {(suite.summary.totalDurationMs / 1000).toFixed(1)}s
                </p>
                <p className="text-xs text-gray-500">Duration</p>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Detailed Results
                  </h2>
                  <p className="text-sm text-gray-500">
                    Click on a result to see more details
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {suite.results.map((result, index) => (
                <div key={index} className="p-4">
                  <button
                    onClick={() =>
                      setExpandedResult(
                        expandedResult === result.name ? null : result.name
                      )
                    }
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                          {getCategoryIcon(result.category)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{result.name}</p>
                          <p className="text-sm text-gray-500">
                            {result.metrics.avgLatencyMs.toFixed(1)}ms avg •{' '}
                            {result.iterations} iterations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        {expandedResult === result.name ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {expandedResult === result.name && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Avg Latency</p>
                          <p className="font-medium">
                            {result.metrics.avgLatencyMs.toFixed(2)}ms
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Min</p>
                          <p className="font-medium">
                            {result.metrics.minLatencyMs.toFixed(2)}ms
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Max</p>
                          <p className="font-medium">
                            {result.metrics.maxLatencyMs.toFixed(2)}ms
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">P50</p>
                          <p className="font-medium">
                            {result.metrics.p50LatencyMs.toFixed(2)}ms
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">P95</p>
                          <p className="font-medium">
                            {result.metrics.p95LatencyMs.toFixed(2)}ms
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">P99</p>
                          <p className="font-medium">
                            {result.metrics.p99LatencyMs.toFixed(2)}ms
                          </p>
                        </div>
                        {result.metrics.throughput && (
                          <div>
                            <p className="text-gray-500">Throughput</p>
                            <p className="font-medium">
                              {result.metrics.throughput.toFixed(2)} ops/s
                            </p>
                          </div>
                        )}
                        {result.metrics.memoryUsedMB && (
                          <div>
                            <p className="text-gray-500">Memory</p>
                            <p className="font-medium">
                              {result.metrics.memoryUsedMB.toFixed(1)} MB
                            </p>
                          </div>
                        )}
                      </div>
                      {result.error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
                          Error: {result.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {suite.summary.recommendations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Recommendations
                    </h2>
                    <p className="text-sm text-gray-500">
                      Suggestions to improve performance
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <ul className="space-y-2">
                  {suite.summary.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span className="text-amber-500 mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Device Info */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Device Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Hardware detected during benchmark
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Platform</p>
                <p className="font-medium text-gray-900">
                  {suite.deviceInfo.platform}
                </p>
              </div>
              <div>
                <p className="text-gray-500">CPU Cores</p>
                <p className="font-medium text-gray-900">
                  {suite.deviceInfo.hardwareConcurrency}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Memory</p>
                <p className="font-medium text-gray-900">
                  {suite.deviceInfo.deviceMemoryGB
                    ? `${suite.deviceInfo.deviceMemoryGB} GB`
                    : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">WebGPU</p>
                <p className="font-medium text-gray-900">
                  {suite.deviceInfo.webGPUSupported ? 'Supported' : 'Not Supported'}
                </p>
              </div>
              {suite.deviceInfo.webGPUAdapter && (
                <div className="col-span-2">
                  <p className="text-gray-500">GPU</p>
                  <p className="font-medium text-gray-900">
                    {suite.deviceInfo.webGPUAdapter}
                  </p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-gray-500">Screen</p>
                <p className="font-medium text-gray-900">
                  {suite.deviceInfo.screenResolution}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Info box when no results */}
      {runState === 'idle' && !suite && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Why run benchmarks?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              Verify your device can run Gemma 3n LLM inference efficiently
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              Measure vector search speed for semantic similarity features
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              Track memory usage to ensure stable long sessions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              Get personalized recommendations for optimal settings
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
