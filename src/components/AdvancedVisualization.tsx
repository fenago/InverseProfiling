/**
 * Advanced Visualization Component
 * Phase 5: Rich visualization dashboard for psychological profile data
 *
 * Features:
 * - Historical trend charts for trait evolution
 * - Signal contribution breakdown (LIWC/Embedding/LLM)
 * - Context variation heatmap
 * - Confidence intervals with uncertainty visualization
 */

import { useState, useEffect, useMemo } from 'react'
import {
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Layers,
  Grid3X3,
  Target,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
} from 'lucide-react'
import {
  getAllDomainTrends,
  getAllSignalContributions,
  getAllContextVariations,
  getAllConfidenceIntervals,
  getVisualizationSummary,
  formatSignalDataForChart,
  VISUALIZATION_COLORS,
  getConfidenceColor,
  getTrendColor,
  type DomainTrendData,
  type SignalContribution,
  type ContextVariation,
  type ConfidenceInterval,
  type VisualizationSummary,
} from '../lib/advanced-visualization'
import { DOMAIN_CATEGORIES } from '../lib/analysis-config'

// ============================================================================
// Sub-Components
// ============================================================================

interface TrendChartProps {
  trendData: DomainTrendData[]
  selectedDomain: string | null
  onSelectDomain: (domain: string | null) => void
}

function TrendChart({ trendData, selectedDomain, onSelectDomain }: TrendChartProps) {
  const chartData = useMemo(() => {
    if (!selectedDomain) return []
    const domain = trendData.find(t => t.domainId === selectedDomain)
    return domain?.dataPoints || []
  }, [trendData, selectedDomain])

  const selectedTrend = trendData.find(t => t.domainId === selectedDomain)

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Historical Trends
        </h3>
        <select
          value={selectedDomain || ''}
          onChange={e => onSelectDomain(e.target.value || null)}
          className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
        >
          <option value="">Select a trait...</option>
          {Object.entries(DOMAIN_CATEGORIES).map(([category, domains]) => (
            <optgroup key={category} label={category}>
              {domains.map(domain => {
                const data = trendData.find(t => t.domainId === domain)
                if (!data) return null
                return (
                  <option key={domain} value={domain}>
                    {data.domainName} ({data.dataPoints.length} pts)
                  </option>
                )
              })}
            </optgroup>
          ))}
        </select>
      </div>

      {selectedTrend ? (
        <>
          <div className="flex items-center gap-4 mb-3 text-sm">
            <span className="flex items-center gap-1">
              {selectedTrend.trend === 'increasing' && <TrendingUp className="w-4 h-4 text-green-400" />}
              {selectedTrend.trend === 'decreasing' && <TrendingDown className="w-4 h-4 text-red-400" />}
              {selectedTrend.trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
              {selectedTrend.trend === 'fluctuating' && <Activity className="w-4 h-4 text-amber-400" />}
              <span className="text-gray-300 capitalize">{selectedTrend.trend}</span>
            </span>
            <span className="text-gray-400">
              Current: <span className="text-white">{(selectedTrend.currentScore * 100).toFixed(0)}%</span>
            </span>
            <span className="text-gray-400">
              Change:{' '}
              <span className={selectedTrend.changeFromStart >= 0 ? 'text-green-400' : 'text-red-400'}>
                {selectedTrend.changeFromStart >= 0 ? '+' : ''}
                {(selectedTrend.changeFromStart * 100).toFixed(1)}%
              </span>
            </span>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="formattedDate" stroke="#9ca3af" fontSize={12} />
              <YAxis
                domain={[0, 1]}
                tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Score']}
              />
              <ReferenceLine y={0.5} stroke="#6b7280" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorScore)"
              />
              <Line
                type="monotone"
                dataKey="confidence"
                stroke="#82ca9d"
                strokeDasharray="5 5"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#8884d8' }}></span>
              Score
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-green-400"></span>
              Confidence
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[250px] text-gray-400">
          Select a trait to view historical trends
        </div>
      )}
    </div>
  )
}

interface SignalBreakdownProps {
  contributions: SignalContribution[]
}

function SignalBreakdown({ contributions }: SignalBreakdownProps) {
  const [viewMode, setViewMode] = useState<'bar' | 'pie'>('bar')
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)

  const chartData = formatSignalDataForChart(contributions)

  const pieData = useMemo(() => {
    if (!selectedDomain) {
      // Aggregate across all domains
      const totals = contributions.reduce(
        (acc, c) => ({
          liwc: acc.liwc + c.liwcScore * c.liwcWeight,
          embedding: acc.embedding + c.embeddingScore * c.embeddingWeight,
          llm: acc.llm + c.llmScore * c.llmWeight,
        }),
        { liwc: 0, embedding: 0, llm: 0 }
      )
      return [
        { name: 'LIWC', value: totals.liwc, color: VISUALIZATION_COLORS.liwc },
        { name: 'Embedding', value: totals.embedding, color: VISUALIZATION_COLORS.embedding },
        { name: 'LLM', value: totals.llm, color: VISUALIZATION_COLORS.llm },
      ]
    }
    const domain = contributions.find(c => c.domainId === selectedDomain)
    if (!domain) return []
    return [
      { name: 'LIWC', value: domain.liwcScore * domain.liwcWeight, color: VISUALIZATION_COLORS.liwc },
      { name: 'Embedding', value: domain.embeddingScore * domain.embeddingWeight, color: VISUALIZATION_COLORS.embedding },
      { name: 'LLM', value: domain.llmScore * domain.llmWeight, color: VISUALIZATION_COLORS.llm },
    ]
  }, [contributions, selectedDomain])

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Signal Contributions
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('bar')}
            className={`px-2 py-1 rounded text-xs ${viewMode === 'bar' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Bar
          </button>
          <button
            onClick={() => setViewMode('pie')}
            className={`px-2 py-1 rounded text-xs ${viewMode === 'pie' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Pie
          </button>
        </div>
      </div>

      {viewMode === 'bar' ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData.slice(0, 10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9ca3af" fontSize={12} />
            <YAxis dataKey="domain" type="category" stroke="#9ca3af" fontSize={10} width={100} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Bar dataKey="liwc" stackId="a" fill={VISUALIZATION_COLORS.liwc} name="LIWC" />
            <Bar dataKey="embedding" stackId="a" fill={VISUALIZATION_COLORS.embedding} name="Embedding" />
            <Bar dataKey="llm" stackId="a" fill={VISUALIZATION_COLORS.llm} name="LLM" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="60%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-2">Select domain:</p>
            <select
              value={selectedDomain || ''}
              onChange={e => setSelectedDomain(e.target.value || null)}
              className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm mb-3"
            >
              <option value="">All domains (aggregate)</option>
              {contributions.map(c => (
                <option key={c.domainId} value={c.domainId}>
                  {c.domainName}
                </option>
              ))}
            </select>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: VISUALIZATION_COLORS.liwc }}></span>
                <span className="text-gray-300">LIWC - Word matching (fast)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: VISUALIZATION_COLORS.embedding }}></span>
                <span className="text-gray-300">Embedding - Semantic similarity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: VISUALIZATION_COLORS.llm }}></span>
                <span className="text-gray-300">LLM - Deep analysis</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ContextHeatmapProps {
  variations: ContextVariation[]
}

function ContextHeatmap({ variations }: ContextHeatmapProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)

  const variation = selectedDomain
    ? variations.find(v => v.domainId === selectedDomain)
    : null

  const heatmapCells = useMemo(() => {
    if (!variation) return []
    return variation.variations.map(v => ({
      context: v.contextName,
      effect: v.effect,
      magnitude: v.magnitude,
      observations: v.observations,
      color:
        v.effect === 'amplifies'
          ? `rgba(34, 197, 94, ${Math.min(v.magnitude, 1)})`
          : v.effect === 'suppresses'
          ? `rgba(239, 68, 68, ${Math.min(v.magnitude, 1)})`
          : 'rgba(107, 114, 128, 0.3)',
    }))
  }, [variation])

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Grid3X3 className="w-5 h-5" />
          Context Variation
        </h3>
        <select
          value={selectedDomain || ''}
          onChange={e => setSelectedDomain(e.target.value || null)}
          className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
        >
          <option value="">Select a trait...</option>
          {variations.map(v => (
            <option key={v.domainId} value={v.domainId}>
              {v.domainName}
            </option>
          ))}
        </select>
      </div>

      {variation ? (
        <>
          <p className="text-sm text-gray-400 mb-3">
            How <span className="text-white font-medium">{variation.domainName}</span> varies across contexts:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            {heatmapCells.map(cell => (
              <div
                key={cell.context}
                className="p-2 rounded text-center"
                style={{ backgroundColor: cell.color }}
              >
                <p className="text-xs text-white font-medium truncate">{cell.context}</p>
                <p className="text-lg font-bold text-white">
                  {cell.effect === 'amplifies' ? '+' : cell.effect === 'suppresses' ? '-' : '~'}
                  {(cell.magnitude * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-300">{cell.observations} obs</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500"></span>
              Amplifies
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500"></span>
              Suppresses
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-500"></span>
              Neutral
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[200px] text-gray-400">
          {variations.length > 0
            ? 'Select a trait to view context variations'
            : 'No context variation data available yet'}
        </div>
      )}
    </div>
  )
}

interface ConfidenceDisplayProps {
  intervals: ConfidenceInterval[]
}

function ConfidenceDisplay({ intervals }: ConfidenceDisplayProps) {
  const [expanded, setExpanded] = useState(false)
  const displayCount = expanded ? intervals.length : 8

  const sortedIntervals = useMemo(
    () => [...intervals].sort((a, b) => b.confidence - a.confidence),
    [intervals]
  )

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target className="w-5 h-5" />
          Confidence Intervals
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Info className="w-4 h-4" />
          Shows uncertainty range
        </div>
      </div>

      <div className="space-y-2">
        {sortedIntervals.slice(0, displayCount).map(interval => {
          const width = `${(interval.upperBound - interval.lowerBound) * 100}%`
          const left = `${interval.lowerBound * 100}%`
          const scorePosition = `${interval.score * 100}%`

          return (
            <div key={interval.domainId} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-300 truncate">
                {interval.domainId
                  .replace(/_/g, ' ')
                  .replace(/^./, s => s.toUpperCase())
                  .split(' ')
                  .slice(-1)[0]}
              </div>
              <div className="flex-1 relative h-6 bg-gray-700 rounded">
                {/* Confidence interval band */}
                <div
                  className="absolute h-full rounded opacity-40"
                  style={{
                    left,
                    width,
                    backgroundColor: getConfidenceColor(interval.confidence),
                  }}
                />
                {/* Score marker */}
                <div
                  className="absolute h-full w-1 bg-white rounded"
                  style={{ left: scorePosition }}
                />
                {/* Value label */}
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white">
                  {(interval.score * 100).toFixed(0)}%
                </div>
              </div>
              <div className="w-16 text-right">
                <span
                  className="text-xs font-medium"
                  style={{ color: getConfidenceColor(interval.confidence) }}
                >
                  {(interval.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {intervals.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-white"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" /> Show {intervals.length - 8} more
            </>
          )}
        </button>
      )}

      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: VISUALIZATION_COLORS.high }}></span>
          High confidence
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: VISUALIZATION_COLORS.medium }}></span>
          Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: VISUALIZATION_COLORS.low }}></span>
          Low
        </span>
      </div>
    </div>
  )
}

interface SummaryCardProps {
  summary: VisualizationSummary | null
}

function SummaryCard({ summary }: SummaryCardProps) {
  if (!summary) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-center h-24 text-gray-400">
          Loading summary...
        </div>
      </div>
    )
  }

  const coverage = summary.signalCoverage
  const avgCoverage = (coverage.liwcCoverage + coverage.embeddingCoverage + coverage.llmCoverage) / 3

  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30">
      <h3 className="text-lg font-semibold text-white mb-3">Profile Summary</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-400">Domains Analyzed</p>
          <p className="text-2xl font-bold text-white">
            {summary.domainsWithData}
            <span className="text-sm font-normal text-gray-400">/{summary.totalDomains}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Avg Confidence</p>
          <p className="text-2xl font-bold" style={{ color: getConfidenceColor(summary.averageConfidence) }}>
            {(summary.averageConfidence * 100).toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Signal Coverage</p>
          <p className="text-2xl font-bold text-white">{(avgCoverage * 100).toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">LLM Analysis</p>
          <p className="text-2xl font-bold text-amber-400">
            {(coverage.llmCoverage * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {summary.topEvolvingTraits.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-2">Top Evolving Traits:</p>
          <div className="flex flex-wrap gap-2">
            {summary.topEvolvingTraits.map(trait => (
              <span
                key={trait.domain}
                className="px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: `${getTrendColor(trait.trend)}20`,
                  color: getTrendColor(trait.trend),
                }}
              >
                {trait.domain.replace(/_/g, ' ')} ({trait.trend})
              </span>
            ))}
          </div>
        </div>
      )}

      {summary.domainsWithData < 5 && (
        <div className="mt-4 flex items-center gap-2 text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Continue chatting to build a more complete profile</span>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

interface AdvancedVisualizationProps {
  userId?: string
}

export function AdvancedVisualization({ userId = 'default' }: AdvancedVisualizationProps) {
  const [trendData, setTrendData] = useState<DomainTrendData[]>([])
  const [contributions, setContributions] = useState<SignalContribution[]>([])
  const [contextVariations, setContextVariations] = useState<ContextVariation[]>([])
  const [confidenceIntervals, setConfidenceIntervals] = useState<ConfidenceInterval[]>([])
  const [summary, setSummary] = useState<VisualizationSummary | null>(null)
  const [selectedTrendDomain, setSelectedTrendDomain] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const [trends, signals, contexts, intervals, sum] = await Promise.all([
          getAllDomainTrends(30),
          getAllSignalContributions(),
          getAllContextVariations(userId),
          getAllConfidenceIntervals(),
          getVisualizationSummary(userId),
        ])

        setTrendData(trends)
        setContributions(signals)
        setContextVariations(contexts)
        setConfidenceIntervals(intervals)
        setSummary(sum)

        // Auto-select first domain with trend data
        if (trends.length > 0 && !selectedTrendDomain) {
          setSelectedTrendDomain(trends[0].domainId)
        }
      } catch (err) {
        console.error('Error loading visualization data:', err)
        setError('Failed to load visualization data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-pulse mx-auto mb-2" />
          <p>Loading visualizations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-400">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const hasData = contributions.length > 0 || trendData.length > 0

  if (!hasData) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Data Yet</h3>
        <p className="text-gray-400">
          Start chatting to build your psychological profile. Advanced visualizations will appear here as data accumulates.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <SummaryCard summary={summary} />

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Trends */}
        <TrendChart
          trendData={trendData}
          selectedDomain={selectedTrendDomain}
          onSelectDomain={setSelectedTrendDomain}
        />

        {/* Signal Contributions */}
        <SignalBreakdown contributions={contributions} />

        {/* Context Variation */}
        <ContextHeatmap variations={contextVariations} />

        {/* Confidence Intervals */}
        <ConfidenceDisplay intervals={confidenceIntervals} />
      </div>
    </div>
  )
}

export default AdvancedVisualization
