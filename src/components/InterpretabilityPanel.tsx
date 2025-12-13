/**
 * Interpretability Panel Component
 * Shows "Why does the system think this?" for any domain score
 *
 * Phase 2.5 Expert Recommendation: Interpretability UI
 * Addresses the need to explain how the system arrives at psychological conclusions
 */

import { useState } from 'react'
import clsx from 'clsx'
import {
  X,
  FileText,
  Network,
  Zap,
  ChevronDown,
  ChevronRight,
  Info,
  MessageSquare,
  TrendingUp,
  HelpCircle,
  Lightbulb,
  BookOpen,
  Scale,
} from 'lucide-react'
import type { HybridSignalScore } from '../lib/sqldb'
import { DOMAIN_METADATA } from '../lib/domain-reference'
import type { PsychologicalDomain } from '../lib/analysis-config'

interface InterpretabilityPanelProps {
  isOpen: boolean
  onClose: () => void
  domainId: PsychologicalDomain
  finalScore: number
  finalConfidence: number
  signals: HybridSignalScore[]
  contributingMessages?: Array<{
    id: number
    content: string
    timestamp: Date
    contribution: number // How much this message contributed
  }>
}

// Signal weights from analysis config
const SIGNAL_WEIGHTS = {
  liwc: 0.20,
  embedding: 0.30,
  llm: 0.50,
}

export default function InterpretabilityPanel({
  isOpen,
  onClose,
  domainId,
  finalScore,
  finalConfidence,
  signals,
  contributingMessages = [],
}: InterpretabilityPanelProps) {
  const [activeSection, setActiveSection] = useState<'signals' | 'messages' | 'methodology' | 'prototypes'>('signals')
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null)

  const domainMeta = DOMAIN_METADATA[domainId]

  if (!isOpen || !domainMeta) return null

  const liwcSignal = signals.find(s => s.signalType === 'liwc')
  const embeddingSignal = signals.find(s => s.signalType === 'embedding')
  const llmSignal = signals.find(s => s.signalType === 'llm')

  // Calculate weighted contributions
  const calculateWeightedContribution = (signal: HybridSignalScore | undefined, weight: number) => {
    if (!signal) return 0
    return signal.score * weight * signal.confidence
  }

  const liwcContribution = calculateWeightedContribution(liwcSignal, SIGNAL_WEIGHTS.liwc)
  const embeddingContribution = calculateWeightedContribution(embeddingSignal, SIGNAL_WEIGHTS.embedding)
  const llmContribution = calculateWeightedContribution(llmSignal, SIGNAL_WEIGHTS.llm)
  const totalContribution = liwcContribution + embeddingContribution + llmContribution

  // Normalize for display
  const getContributionPercent = (contribution: number) => {
    if (totalContribution === 0) return 0
    return (contribution / totalContribution) * 100
  }

  const getScoreInterpretation = (score: number): { label: string; color: string; description: string } => {
    if (score >= 0.8) return { label: 'Very High', color: 'text-orange-600', description: 'Strongly expressed in your communication' }
    if (score >= 0.6) return { label: 'High', color: 'text-amber-600', description: 'Frequently expressed in your communication' }
    if (score >= 0.4) return { label: 'Moderate', color: 'text-gray-600', description: 'Sometimes expressed in your communication' }
    if (score >= 0.2) return { label: 'Low', color: 'text-blue-600', description: 'Rarely expressed in your communication' }
    return { label: 'Very Low', color: 'text-indigo-600', description: 'Seldom observed in your communication' }
  }

  const interpretation = getScoreInterpretation(finalScore)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 via-violet-50 to-blue-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Why This Score?
                <span className="text-sm font-normal text-gray-500">
                  {domainMeta.name}
                </span>
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Understanding how your profile score was calculated
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/60 rounded-xl transition-colors"
            aria-label="Close panel"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Score Summary Card */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Score Circle */}
              <div className="relative">
                <svg className="w-20 h-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="url(#scoreGradient)"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${finalScore * 220} 220`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">
                    {Math.round(finalScore * 100)}
                  </span>
                </div>
              </div>

              {/* Interpretation */}
              <div>
                <div className={clsx('text-lg font-semibold', interpretation.color)}>
                  {interpretation.label}
                </div>
                <p className="text-sm text-gray-600 max-w-xs">
                  {interpretation.description}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>Confidence: {Math.round(finalConfidence * 100)}%</span>
                  <span className="text-gray-300">|</span>
                  <span>{signals.length} signal(s) active</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm">
                <div className="text-xs text-gray-500 mb-1">LIWC</div>
                <div className="text-lg font-semibold text-amber-600">
                  {liwcSignal ? Math.round(liwcSignal.score * 100) : '-'}%
                </div>
              </div>
              <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Embedding</div>
                <div className="text-lg font-semibold text-purple-600">
                  {embeddingSignal ? Math.round(embeddingSignal.score * 100) : '-'}%
                </div>
              </div>
              <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm">
                <div className="text-xs text-gray-500 mb-1">LLM</div>
                <div className="text-lg font-semibold text-blue-600">
                  {llmSignal ? Math.round(llmSignal.score * 100) : '-'}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { id: 'signals', label: 'Analysis Signals', icon: Scale },
            { id: 'prototypes', label: 'Trait Markers', icon: BookOpen },
            { id: 'messages', label: 'Your Messages', icon: MessageSquare },
            { id: 'methodology', label: 'How It Works', icon: HelpCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeSection === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Signals Tab */}
          {activeSection === 'signals' && (
            <div className="space-y-6">
              {/* Contribution Visualization */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Signal Contributions to Final Score</h3>
                <div className="flex h-8 rounded-lg overflow-hidden shadow-inner">
                  {liwcContribution > 0 && (
                    <div
                      className="bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${getContributionPercent(liwcContribution)}%` }}
                    >
                      {getContributionPercent(liwcContribution) > 15 && 'LIWC'}
                    </div>
                  )}
                  {embeddingContribution > 0 && (
                    <div
                      className="bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${getContributionPercent(embeddingContribution)}%` }}
                    >
                      {getContributionPercent(embeddingContribution) > 15 && 'Embedding'}
                    </div>
                  )}
                  {llmContribution > 0 && (
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${getContributionPercent(llmContribution)}%` }}
                    >
                      {getContributionPercent(llmContribution) > 15 && 'LLM'}
                    </div>
                  )}
                  {totalContribution === 0 && (
                    <div className="w-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs">
                      No data yet - keep chatting!
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>LIWC: {Math.round(getContributionPercent(liwcContribution))}%</span>
                  <span>Embedding: {Math.round(getContributionPercent(embeddingContribution))}%</span>
                  <span>LLM: {Math.round(getContributionPercent(llmContribution))}%</span>
                </div>
              </div>

              {/* Individual Signal Cards */}
              <div className="grid gap-4">
                {/* LIWC Signal */}
                <SignalCard
                  icon={FileText}
                  title="LIWC Analysis"
                  subtitle="Dictionary-based word matching"
                  weight="20%"
                  signal={liwcSignal}
                  color="amber"
                  expanded={expandedSignal === 'liwc'}
                  onToggle={() => setExpandedSignal(expandedSignal === 'liwc' ? null : 'liwc')}
                >
                  {liwcSignal?.matchedWords && liwcSignal.matchedWords.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-amber-700 mb-2">Detected Keywords:</p>
                      <div className="flex flex-wrap gap-2">
                        {liwcSignal.matchedWords.map((word, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800 border border-amber-200"
                          >
                            "{word}"
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-amber-600 mt-3">
                        These words from your messages match patterns associated with {domainMeta.name.toLowerCase()}.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No specific keywords detected yet.</p>
                  )}
                </SignalCard>

                {/* Embedding Signal */}
                <SignalCard
                  icon={Network}
                  title="Semantic Embedding"
                  subtitle="AI-based meaning comparison"
                  weight="30%"
                  signal={embeddingSignal}
                  color="purple"
                  expanded={expandedSignal === 'embedding'}
                  onToggle={() => setExpandedSignal(expandedSignal === 'embedding' ? null : 'embedding')}
                >
                  {embeddingSignal?.prototypeSimilarity ? (
                    <div>
                      <p className="text-sm font-medium text-purple-700 mb-2">Semantic Similarity:</p>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-3xl font-bold text-purple-600">
                          {Math.round(embeddingSignal.prototypeSimilarity * 100)}%
                        </div>
                        <p className="text-sm text-purple-700">
                          match with typical {domainMeta.name.toLowerCase()} expressions
                        </p>
                      </div>
                      <p className="text-xs text-purple-600 mt-3">
                        Your writing style and word choices are semantically similar to prototype texts for this trait.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No embedding analysis available yet.</p>
                  )}
                </SignalCard>

                {/* LLM Signal */}
                <SignalCard
                  icon={Zap}
                  title="LLM Deep Analysis"
                  subtitle="AI reasoning about your messages"
                  weight="50%"
                  signal={llmSignal}
                  color="blue"
                  expanded={expandedSignal === 'llm'}
                  onToggle={() => setExpandedSignal(expandedSignal === 'llm' ? null : 'llm')}
                >
                  {llmSignal?.evidenceText ? (
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-2">AI Reasoning:</p>
                      <blockquote className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400 text-sm text-blue-800 italic">
                        "{llmSignal.evidenceText}"
                      </blockquote>
                      <p className="text-xs text-blue-600 mt-3">
                        This is the LLM's explanation for why it assigned this score based on your conversation.
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      <p>LLM analysis not yet available.</p>
                      <p className="text-xs mt-1">Runs after every 5 messages or 5 minutes of activity.</p>
                    </div>
                  )}
                </SignalCard>
              </div>
            </div>
          )}

          {/* Prototypes Tab */}
          {activeSection === 'prototypes' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800">What are trait markers?</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      These are linguistic patterns and expressions typically associated with {domainMeta.name.toLowerCase()}.
                      We compare your messages against these patterns to assess this trait.
                    </p>
                  </div>
                </div>
              </div>

              {/* Psychometric Source */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Research Foundation</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Source:</span> {domainMeta.psychometricSource}
                </p>
              </div>

              {/* Markers */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Key Markers We Look For</h3>
                <div className="grid grid-cols-2 gap-3">
                  {domainMeta.markers.map((marker, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                      <span className="text-sm text-gray-700">{marker}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prototype Texts */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Example Prototype Expressions</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Your messages are compared semantically against expressions like these:
                </p>
                <div className="space-y-2">
                  {domainMeta.prototypeTexts.slice(0, 5).map((text, i) => (
                    <div
                      key={i}
                      className="p-3 bg-gradient-to-r from-violet-50 to-blue-50 rounded-lg border border-violet-200"
                    >
                      <p className="text-sm text-gray-700 italic">"{text}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeSection === 'messages' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800">Your Contributing Messages</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      These are messages from your conversation that influenced this domain score.
                    </p>
                  </div>
                </div>
              </div>

              {contributingMessages.length > 0 ? (
                <div className="space-y-3">
                  {contributingMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{msg.content}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {msg.timestamp.toLocaleDateString()} at {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary-50 rounded-full">
                          <TrendingUp className="w-3 h-3 text-primary-500" />
                          <span className="text-xs font-medium text-primary-600">
                            +{Math.round(msg.contribution * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No specific messages tracked yet.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Keep chatting to see which messages influence this score.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Methodology Tab */}
          {activeSection === 'methodology' && (
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-primary-50 to-violet-50 rounded-xl border border-primary-200">
                <h3 className="font-semibold text-primary-800 mb-2">Three-Signal Hybrid Analysis</h3>
                <p className="text-sm text-primary-700">
                  We use three complementary methods to assess psychological traits, combining their results
                  for more reliable and robust scoring.
                </p>
              </div>

              {/* Formula */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Score Calculation Formula</h3>
                <div className="p-4 bg-white rounded-lg border border-gray-300 font-mono text-sm">
                  <p className="text-gray-700">
                    <span className="text-amber-600">LIWC</span> × 0.20 × conf +{' '}
                    <span className="text-purple-600">Embedding</span> × 0.30 × conf +{' '}
                    <span className="text-blue-600">LLM</span> × 0.50 × conf
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Each signal is weighted by its confidence score, giving more influence to higher-confidence measurements.
                </p>
              </div>

              {/* Method Explanations */}
              <div className="grid gap-4">
                <MethodExplanation
                  icon={FileText}
                  color="amber"
                  title="LIWC Analysis (20%)"
                  description="Linguistic Inquiry and Word Count analyzes your word choices using validated psychological dictionaries. It's fast and reliable for detecting specific vocabulary patterns."
                />
                <MethodExplanation
                  icon={Network}
                  color="purple"
                  title="Semantic Embedding (30%)"
                  description="Using BGE-small AI model, we convert your messages to mathematical vectors and compare them against prototype texts for each trait. This captures meaning beyond just word matching."
                />
                <MethodExplanation
                  icon={Zap}
                  color="blue"
                  title="LLM Deep Analysis (50%)"
                  description="Gemma 3n, running entirely on your device, reads your messages and reasons about psychological traits using its understanding of language and human behavior."
                />
              </div>

              {/* Privacy Note */}
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-green-800">100% Private & On-Device</h3>
                    <p className="text-sm text-green-700 mt-1">
                      All analysis happens locally on your device using WebGPU acceleration.
                      Your messages never leave your device - no cloud, no servers, complete privacy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            Domain: {domainMeta.category} • {domainMeta.psychometricSource}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

// Signal Card Component
interface SignalCardProps {
  icon: React.ElementType
  title: string
  subtitle: string
  weight: string
  signal: HybridSignalScore | undefined
  color: 'amber' | 'purple' | 'blue'
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function SignalCard({
  icon: Icon,
  title,
  subtitle,
  weight,
  signal,
  color,
  expanded,
  onToggle,
  children,
}: SignalCardProps) {
  const colorClasses = {
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-500',
      text: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700',
      barBg: 'bg-amber-200',
      barFill: 'bg-amber-500',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      iconBg: 'bg-purple-500',
      text: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-700',
      barBg: 'bg-purple-200',
      barFill: 'bg-purple-500',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-500',
      text: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700',
      barBg: 'bg-blue-200',
      barFill: 'bg-blue-500',
    },
  }

  const c = colorClasses[color]

  return (
    <div className={clsx('rounded-xl border-2 transition-all', signal ? `${c.bg} ${c.border}` : 'bg-gray-50 border-gray-200')}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', signal ? c.iconBg : 'bg-gray-300')}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {signal && (
            <div className="text-right">
              <p className={clsx('text-lg font-bold', c.text)}>
                {Math.round(signal.score * 100)}%
              </p>
              <p className="text-xs text-gray-500">
                conf: {Math.round(signal.confidence * 100)}%
              </p>
            </div>
          )}
          <span className={clsx('px-2 py-1 rounded text-xs font-medium', signal ? c.badge : 'bg-gray-100 text-gray-500')}>
            {weight}
          </span>
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="pt-3 border-t border-gray-200">
            {signal ? (
              <>
                {/* Score bar */}
                <div className="mb-4">
                  <div className={clsx('h-2 rounded-full overflow-hidden', c.barBg)}>
                    <div
                      className={clsx('h-full rounded-full transition-all', c.barFill)}
                      style={{ width: `${signal.score * 100}%` }}
                    />
                  </div>
                </div>
                {children}
              </>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No data available yet. Keep chatting to generate this signal!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Method Explanation Component
interface MethodExplanationProps {
  icon: React.ElementType
  color: 'amber' | 'purple' | 'blue'
  title: string
  description: string
}

function MethodExplanation({ icon: Icon, color, title, description }: MethodExplanationProps) {
  const colorClasses = {
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
  }

  return (
    <div className={clsx('p-4 rounded-xl border', colorClasses[color])}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5" />
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  )
}
