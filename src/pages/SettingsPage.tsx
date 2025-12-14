/**
 * SettingsPage.tsx - Apple-style Settings Interface
 *
 * Features glass morphism cards, animated sections,
 * and comprehensive settings management.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Download,
  Trash2,
  Database,
  AlertTriangle,
  Check,
  HardDrive,
  Cpu,
  Globe,
  MessageSquare,
  Settings2,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Edit3,
  History,
  Wrench,
  Network,
  Camera,
  Sliders,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { exportAllData, deleteAllData } from '../lib/db'
import { takeProfileSnapshot, getHistoricalStats } from '../lib/history'
import { buildRelationshipsFromScores, getGraphStats } from '../lib/graphdb'
import { getDomainScores } from '../lib/sqldb'
import { MODELS, type ModelId, llmEngine } from '../lib/llm'
import {
  useStore,
  ALL_SUPPORTED_LANGUAGES,
  RESPONSE_SIZE_CONFIG,
  CONTEXT_WINDOW_OPTIONS,
  SYSTEM_PROMPT_PRESETS,
  DEFAULT_HYBRID_WEIGHTS,
  type LanguageCode,
  type ResponseSize,
  type ContextWindowSize,
  type HybridWeights,
} from '../lib/store'
import { cn, useTheme } from '../lib/theme'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function SettingsPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelId>('gemma-3n-E4B')
  const [storageUsed, setStorageUsed] = useState<string>('Calculating...')
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [expandedContextInfo, setExpandedContextInfo] = useState<false | number>(false)
  const [pendingContextSize, setPendingContextSize] = useState<ContextWindowSize | null>(null)

  // Developer tools state
  const [isSnapshotting, setIsSnapshotting] = useState(false)
  const [snapshotSuccess, setSnapshotSuccess] = useState(false)
  const [snapshotResult, setSnapshotResult] = useState<string | null>(null)
  const [isBuildingGraph, setIsBuildingGraph] = useState(false)
  const [graphBuildSuccess, setGraphBuildSuccess] = useState(false)
  const [graphBuildResult, setGraphBuildResult] = useState<string | null>(null)

  const { theme, setTheme } = useTheme()

  const {
    llm,
    settings,
    setLanguage,
    setResponseSize,
    setContextWindowSize,
    setSystemPromptPreset,
    setCustomSystemPrompt,
    setConversationMemoryEnabled,
    setHybridWeights,
    resetHybridWeights,
  } = useStore()

  // Calculate storage usage
  useState(() => {
    async function calculateStorage() {
      try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate()
          const used = estimate.usage || 0
          const quota = estimate.quota || 0
          setStorageUsed(
            `${(used / 1024 / 1024).toFixed(1)} MB / ${(quota / 1024 / 1024 / 1024).toFixed(1)} GB`
          )
        }
      } catch {
        setStorageUsed('Unable to calculate')
      }
    }
    calculateStorage()
  })

  async function handleExport() {
    setIsExporting(true)
    setExportSuccess(false)

    try {
      const data = await exportAllData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qmu-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setExportSuccess(true)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)

    try {
      await deleteAllData()
      setDeleteSuccess(true)
      setShowDeleteConfirm(false)

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Developer tools handlers
  async function handleForceSnapshot() {
    setIsSnapshotting(true)
    setSnapshotSuccess(false)
    setSnapshotResult(null)

    try {
      await takeProfileSnapshot('manual_test')
      const stats = await getHistoricalStats()
      setSnapshotSuccess(true)
      setSnapshotResult(`Snapshot created! Total: ${stats.totalSnapshots} snapshots, ${stats.domainsTracked} domains tracked`)
      setTimeout(() => {
        setSnapshotSuccess(false)
        setSnapshotResult(null)
      }, 5000)
    } catch (error) {
      console.error('Snapshot failed:', error)
      setSnapshotResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSnapshotting(false)
    }
  }

  async function handleBuildGraph() {
    setIsBuildingGraph(true)
    setGraphBuildSuccess(false)
    setGraphBuildResult(null)

    try {
      // Get current domain scores
      const domainScores = await getDomainScores()
      const scoreMap: Record<string, number> = {}
      for (const ds of domainScores) {
        scoreMap[ds.domainId] = ds.score
      }

      // Create some test topics if none exist
      const testTopics = ['testing', 'development', 'conversation', 'psychology', 'analysis']

      // Force build relationships (bypassing the score threshold by using higher test scores)
      const enhancedScoreMap = { ...scoreMap }
      // Boost some scores to exceed the 0.5 threshold for testing
      if (Object.keys(enhancedScoreMap).length > 0) {
        for (const key of Object.keys(enhancedScoreMap).slice(0, 5)) {
          enhancedScoreMap[key] = Math.max(enhancedScoreMap[key], 0.6)
        }
      }

      await buildRelationshipsFromScores('default_user', enhancedScoreMap, testTopics)

      const stats = await getGraphStats()
      setGraphBuildSuccess(true)
      setGraphBuildResult(`Graph built! ${stats.totalTriples} triples, ${stats.userTopicCount} user-topic links`)
      setTimeout(() => {
        setGraphBuildSuccess(false)
        setGraphBuildResult(null)
      }, 5000)
    } catch (error) {
      console.error('Graph build failed:', error)
      setGraphBuildResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsBuildingGraph(false)
    }
  }

  async function handleLoadModel(modelId: ModelId) {
    setSelectedModel(modelId)
    await llmEngine.initialize(modelId)
  }

  function handleContextWindowChange(size: ContextWindowSize) {
    if (size !== settings.contextWindowSize) {
      setPendingContextSize(size)
    }
  }

  function confirmContextWindowChange() {
    if (pendingContextSize) {
      setContextWindowSize(pendingContextSize)
      setPendingContextSize(null)
      // Reload to apply the new context window size
      setTimeout(() => window.location.reload(), 500)
    }
  }

  function getActivePrompt(): string {
    if (settings.systemPromptPreset === 'custom') {
      return settings.customSystemPrompt
    }
    const preset = SYSTEM_PROMPT_PRESETS.find(p => p.id === settings.systemPromptPreset)
    return preset?.prompt || ''
  }

  // Helper function to update a single weight while maintaining sum of 100
  function updateWeight(key: keyof HybridWeights, value: number) {
    const currentWeights = settings.hybridWeights
    const otherKeys = (['liwc', 'embedding', 'llm'] as const).filter(k => k !== key)
    const otherSum = otherKeys.reduce((sum, k) => sum + currentWeights[k], 0)

    // Ensure the value doesn't exceed 100 or go below 0
    const clampedValue = Math.max(0, Math.min(100, value))

    // If the other weights sum to 0, we can't redistribute
    if (otherSum === 0) {
      const newWeights = { ...currentWeights, [key]: 100 }
      setHybridWeights(newWeights)
      return
    }

    // Calculate remaining weight for others
    const remaining = 100 - clampedValue

    // Distribute remaining proportionally among other weights
    const scale = remaining / otherSum
    const newWeights: HybridWeights = {
      liwc: key === 'liwc' ? clampedValue : Math.round(currentWeights.liwc * scale),
      embedding: key === 'embedding' ? clampedValue : Math.round(currentWeights.embedding * scale),
      llm: key === 'llm' ? clampedValue : Math.round(currentWeights.llm * scale),
    }

    // Fix rounding errors to ensure sum is exactly 100
    const sum = newWeights.liwc + newWeights.embedding + newWeights.llm
    if (sum !== 100) {
      // Adjust the largest other weight to compensate
      const diff = 100 - sum
      const largestOther = otherKeys.reduce((a, b) =>
        newWeights[a] >= newWeights[b] ? a : b
      )
      newWeights[largestOther] += diff
    }

    setHybridWeights(newWeights)
  }

  const isDefaultWeights =
    settings.hybridWeights.liwc === DEFAULT_HYBRID_WEIGHTS.liwc &&
    settings.hybridWeights.embedding === DEFAULT_HYBRID_WEIGHTS.embedding &&
    settings.hybridWeights.llm === DEFAULT_HYBRID_WEIGHTS.llm

  return (
    <motion.div
      className="p-6 space-y-6 max-w-4xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your data and privacy preferences</p>
      </motion.div>

      {/* Theme Section */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" className="overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-white" />
                ) : theme === 'light' ? (
                  <Sun className="w-5 h-5 text-white" />
                ) : (
                  <Monitor className="w-5 h-5 text-white" />
                )}
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
                <p className="text-sm text-muted-foreground">Customize how QMU.io looks</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light' as const, icon: Sun, label: 'Light' },
                { id: 'dark' as const, icon: Moon, label: 'Dark' },
                { id: 'system' as const, icon: Monitor, label: 'System' },
              ].map(({ id, icon: Icon, label }) => (
                <motion.button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all duration-200',
                    theme === id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-border hover:border-primary-300 dark:hover:border-primary-700'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={cn(
                    'w-6 h-6 mx-auto mb-2',
                    theme === id ? 'text-primary-500' : 'text-muted-foreground'
                  )} />
                  <p className={cn(
                    'text-sm font-medium',
                    theme === id ? 'text-primary-600 dark:text-primary-400' : 'text-foreground'
                  )}>
                    {label}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Privacy Section */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" className="overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Shield className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Privacy & Data</h2>
                <p className="text-sm text-muted-foreground">All your data is stored locally on this device</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Storage Info */}
            <motion.div
              className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Local Storage Used</p>
                  <p className="text-sm text-muted-foreground">{storageUsed}</p>
                </div>
              </div>
              <Database className="w-5 h-5 text-muted-foreground" />
            </motion.div>

            {/* Export Data */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Export All Data</p>
                <p className="text-sm text-muted-foreground">Download a JSON file containing all your data</p>
              </div>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                variant={exportSuccess ? 'ghost' : 'default'}
                size="sm"
              >
                {exportSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Exported
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export'}
                  </>
                )}
              </Button>
            </div>

            {/* Delete Data */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Delete All Data</p>
                <p className="text-sm text-muted-foreground">Permanently remove all stored data from this device</p>
              </div>
              {!showDeleteConfirm ? (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="ghost"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    variant="destructive"
                    size="sm"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                </div>
              )}
            </div>

            <AnimatePresence>
              {deleteSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl"
                >
                  <Check className="w-4 h-4" />
                  All data has been deleted. Reloading...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* Developer Tools Section */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" className="overflow-hidden border-dashed border-orange-300 dark:border-orange-700">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Wrench className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Developer Tools</h2>
                <p className="text-sm text-muted-foreground">Testing utilities for database operations</p>
              </div>
              <Badge variant="warning" size="sm">Dev</Badge>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Force Snapshot */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Force SQL.js Snapshot</p>
                <p className="text-sm text-muted-foreground">Manually create a history snapshot (bypasses 1-hour threshold)</p>
              </div>
              <Button
                onClick={handleForceSnapshot}
                disabled={isSnapshotting}
                variant={snapshotSuccess ? 'ghost' : 'secondary'}
                size="sm"
                className={snapshotSuccess ? 'text-green-600' : ''}
              >
                {snapshotSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Done
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    {isSnapshotting ? 'Creating...' : 'Snapshot'}
                  </>
                )}
              </Button>
            </div>

            <AnimatePresence>
              {snapshotResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl text-sm',
                    snapshotSuccess
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  )}
                >
                  {snapshotSuccess ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {snapshotResult}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Force Graph Build */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Force LevelGraph Build</p>
                <p className="text-sm text-muted-foreground">Build knowledge graph with test topics (bypasses score thresholds)</p>
              </div>
              <Button
                onClick={handleBuildGraph}
                disabled={isBuildingGraph}
                variant={graphBuildSuccess ? 'ghost' : 'secondary'}
                size="sm"
                className={graphBuildSuccess ? 'text-green-600' : ''}
              >
                {graphBuildSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Done
                  </>
                ) : (
                  <>
                    <Network className="w-4 h-4 mr-2" />
                    {isBuildingGraph ? 'Building...' : 'Build Graph'}
                  </>
                )}
              </Button>
            </div>

            <AnimatePresence>
              {graphBuildResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl text-sm',
                    graphBuildSuccess
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  )}
                >
                  {graphBuildSuccess ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {graphBuildResult}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <p className="text-xs text-orange-700 dark:text-orange-300">
                These tools are for testing purposes. In normal usage, snapshots are created automatically
                every hour and the knowledge graph is built from actual conversation topics.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Analysis Weights Section */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" className="overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sliders className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Analysis Weights</h2>
                  <p className="text-sm text-muted-foreground">Customize how signals contribute to your psychological profile</p>
                </div>
              </div>
              {!isDefaultWeights && (
                <Button
                  onClick={resetHybridWeights}
                  variant="ghost"
                  size="sm"
                  className="text-violet-600 dark:text-violet-400"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Visual weight distribution bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Weight Distribution</span>
                <span>Total: 100%</span>
              </div>
              <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                <motion.div
                  className="bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${settings.hybridWeights.liwc}%` }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${settings.hybridWeights.embedding}%` }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="bg-violet-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${settings.hybridWeights.llm}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">LIWC</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Embedding</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <span className="text-muted-foreground">LLM</span>
                </div>
              </div>
            </div>

            {/* LIWC Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    LIWC (Word Matching)
                  </p>
                  <p className="text-xs text-muted-foreground">Fast but limited - matches psychological keywords</p>
                </div>
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400 w-14 text-right">
                  {settings.hybridWeights.liwc}%
                </span>
              </div>
              <div className="relative h-3 w-full">
                <div className="absolute inset-0 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-500"
                  style={{ width: `${settings.hybridWeights.liwc}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.hybridWeights.liwc}
                  onChange={(e) => updateWeight('liwc', parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-blue-500 shadow-lg pointer-events-none"
                  style={{ left: `calc(${settings.hybridWeights.liwc}% - 10px)` }}
                />
              </div>
            </div>

            {/* Embedding Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    Embedding (Semantic Similarity)
                  </p>
                  <p className="text-xs text-muted-foreground">Medium reliability - understands meaning and context</p>
                </div>
                <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 w-14 text-right">
                  {settings.hybridWeights.embedding}%
                </span>
              </div>
              <div className="relative h-3 w-full">
                <div className="absolute inset-0 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                  style={{ width: `${settings.hybridWeights.embedding}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.hybridWeights.embedding}
                  onChange={(e) => updateWeight('embedding', parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-emerald-500 shadow-lg pointer-events-none"
                  style={{ left: `calc(${settings.hybridWeights.embedding}% - 10px)` }}
                />
              </div>
            </div>

            {/* LLM Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-violet-500" />
                    LLM (Deep Analysis)
                  </p>
                  <p className="text-xs text-muted-foreground">Highest reliability - full semantic understanding</p>
                </div>
                <span className="text-lg font-semibold text-violet-600 dark:text-violet-400 w-14 text-right">
                  {settings.hybridWeights.llm}%
                </span>
              </div>
              <div className="relative h-3 w-full">
                <div className="absolute inset-0 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-400 to-violet-500"
                  style={{ width: `${settings.hybridWeights.llm}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.hybridWeights.llm}
                  onChange={(e) => updateWeight('llm', parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-violet-500 shadow-lg pointer-events-none"
                  style={{ left: `calc(${settings.hybridWeights.llm}% - 10px)` }}
                />
              </div>
            </div>

            {/* Info box */}
            <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
              <p className="text-sm text-violet-800 dark:text-violet-200">
                <strong>How it works:</strong> Your messages are analyzed using three different methods.
                The weights determine how much each method contributes to your final psychological profile.
                Higher LLM weight gives more accurate results but uses more resources.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* AI Model Section */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" className="overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Cpu className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">AI Model</h2>
                <p className="text-sm text-muted-foreground">Choose which local AI model to use</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {Object.entries(MODELS).map(([id, model]) => (
              <motion.button
                key={id}
                onClick={() => handleLoadModel(id as ModelId)}
                disabled={llm.isLoading}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                  selectedModel === id && llm.isReady
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-border hover:border-primary-300 dark:hover:border-primary-700'
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{model.name}</p>
                      {model.recommended && (
                        <Badge variant="success" size="sm">Recommended</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Size: {model.size}</p>
                  </div>
                  {selectedModel === id && llm.isReady && (
                    <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  )}
                  {selectedModel === id && llm.isLoading && (
                    <span className="text-sm text-primary-600 dark:text-primary-400">
                      {llm.progress}%
                    </span>
                  )}
                </div>
              </motion.button>
            ))}

            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">WebGPU Required</p>
                <p className="mt-1">
                  AI models run locally using WebGPU. Make sure your browser
                  supports WebGPU for the best experience. Chrome and Edge have
                  the best support.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Language Section */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" className="overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Globe className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Language</h2>
                <p className="text-sm text-muted-foreground">Choose your preferred language for AI responses</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Response Language</p>
                <p className="text-sm text-muted-foreground">The AI will respond in your selected language</p>
              </div>
              <select
                value={settings.language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="px-4 py-2 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500 max-h-60"
              >
                {Object.entries(ALL_SUPPORTED_LANGUAGES)
                  .sort((a, b) => a[1].localeCompare(b[1]))
                  .map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Response Size Section */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" className="overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageSquare className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Response Length</h2>
                <p className="text-sm text-muted-foreground">Control how detailed AI responses should be</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {(Object.entries(RESPONSE_SIZE_CONFIG) as [ResponseSize, typeof RESPONSE_SIZE_CONFIG[ResponseSize]][]).map(
              ([size, config]) => (
                <motion.button
                  key={size}
                  onClick={() => setResponseSize(size)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                    settings.responseSize === size
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-border hover:border-indigo-300 dark:hover:border-indigo-700'
                  )}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{config.label}</p>
                      <Badge variant="info" size="sm">{config.description}</Badge>
                    </div>
                    {settings.responseSize === size && (
                      <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Pros:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {config.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-green-500">+</span> {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Cons:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {config.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-red-500">-</span> {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.button>
              )
            )}
          </div>
        </Card>
      </motion.div>

      {/* Context Window Section */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" className="overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings2 className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Context Window</h2>
                <p className="text-sm text-muted-foreground">How much conversation history the AI can remember</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-2">
              <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Changing this setting requires reloading the AI model
              </p>
            </div>

            {CONTEXT_WINDOW_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => handleContextWindowChange(option.value)}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                  settings.contextWindowSize === option.value
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                    : pendingContextSize === option.value
                    ? 'border-orange-300 dark:border-orange-700 bg-orange-25 dark:bg-orange-900/10'
                    : 'border-border hover:border-orange-300 dark:hover:border-orange-700'
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{option.label}</p>
                    {option.value === 8192 && (
                      <Badge variant="success" size="sm">Recommended</Badge>
                    )}
                  </div>
                  {settings.contextWindowSize === option.value && (
                    <Check className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{option.description}</p>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedContextInfo(expandedContextInfo === option.value ? false : option.value)
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {expandedContextInfo === option.value ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> Hide details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> Show pros & cons
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {expandedContextInfo === option.value && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border"
                    >
                      <div>
                        <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Pros:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {option.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-green-500">+</span> {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Cons:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {option.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-red-500">-</span> {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}

            {/* Confirmation dialog for context window change */}
            <AnimatePresence>
              {pendingContextSize && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
                >
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                    Change context window to{' '}
                    <strong>
                      {CONTEXT_WINDOW_OPTIONS.find((o) => o.value === pendingContextSize)?.label}
                    </strong>
                    ? This will reload the page.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPendingContextSize(null)}
                      variant="ghost"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmContextWindowChange}
                      variant="default"
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Confirm & Reload
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* Conversation Memory Section */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" className="overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <History className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Conversation Memory</h2>
                <p className="text-sm text-muted-foreground">Remember context from previous sessions</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Enable Memory</p>
                <p className="text-sm text-muted-foreground">
                  The AI will remember topics, facts, and preferences from your previous conversations
                </p>
              </div>
              <motion.button
                onClick={() => setConversationMemoryEnabled(!settings.conversationMemoryEnabled)}
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  settings.conversationMemoryEnabled ? 'bg-teal-600' : 'bg-muted'
                )}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg"
                  animate={{
                    x: settings.conversationMemoryEnabled ? 24 : 4,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            <AnimatePresence>
              {settings.conversationMemoryEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800"
                >
                  <p className="text-sm text-teal-800 dark:text-teal-200">
                    Memory is enabled. The AI will use context from your last 5 sessions to provide more personalized responses.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* System Prompt Section */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" className="overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">AI Personality</h2>
                <p className="text-sm text-muted-foreground">Choose how the AI behaves and responds</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Preset selection */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SYSTEM_PROMPT_PRESETS.map((preset) => (
                <motion.button
                  key={preset.id}
                  onClick={() => setSystemPromptPreset(preset.id)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-left transition-all duration-200',
                    settings.systemPromptPreset === preset.id
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30'
                      : 'border-border hover:border-pink-300 dark:hover:border-pink-700'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground text-sm">{preset.label}</p>
                    {settings.systemPromptPreset === preset.id && (
                      <Check className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                </motion.button>
              ))}
            </div>

            {/* View/Edit prompt button */}
            <button
              onClick={() => setShowPromptEditor(!showPromptEditor)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              {showPromptEditor ? 'Hide system prompt' : 'View/Edit system prompt'}
              {showPromptEditor ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Prompt editor */}
            <AnimatePresence>
              {showPromptEditor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-2">
                      {settings.systemPromptPreset === 'custom'
                        ? 'Edit your custom system prompt below:'
                        : `Current preset: ${
                            SYSTEM_PROMPT_PRESETS.find((p) => p.id === settings.systemPromptPreset)
                              ?.label
                          }`}
                    </p>
                    <textarea
                      value={
                        settings.systemPromptPreset === 'custom'
                          ? settings.customSystemPrompt
                          : getActivePrompt()
                      }
                      onChange={(e) => {
                        if (settings.systemPromptPreset !== 'custom') {
                          setSystemPromptPreset('custom')
                        }
                        setCustomSystemPrompt(e.target.value)
                      }}
                      placeholder="Enter your custom system prompt..."
                      className="w-full h-48 p-3 border border-border rounded-xl text-sm font-mono resize-y bg-card text-foreground focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  {settings.systemPromptPreset !== 'custom' && (
                    <p className="text-xs text-muted-foreground">
                      Editing the text above will switch to "Custom Prompt" mode
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* About Section */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">About</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">QMU.io</strong> is a privacy-preserving AI assistant
              that learns and adapts to you over time.
            </p>
            <p>
              All data is processed and stored locally on your device. No data is
              ever sent to external servers.
            </p>
            <p className="text-muted-foreground/60 mt-4">Version 0.1.0 (MVP)</p>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
