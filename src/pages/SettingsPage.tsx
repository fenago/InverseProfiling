import { useState } from 'react'
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
} from 'lucide-react'
import { exportAllData, deleteAllData } from '../lib/db'
import { MODELS, type ModelId, llmEngine } from '../lib/llm'
import {
  useStore,
  ALL_SUPPORTED_LANGUAGES,
  RESPONSE_SIZE_CONFIG,
  CONTEXT_WINDOW_OPTIONS,
  SYSTEM_PROMPT_PRESETS,
  type LanguageCode,
  type ResponseSize,
  type ContextWindowSize,
} from '../lib/store'
import clsx from 'clsx'

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

  const {
    llm,
    settings,
    setLanguage,
    setResponseSize,
    setContextWindowSize,
    setSystemPromptPreset,
    setCustomSystemPrompt,
    setConversationMemoryEnabled,
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

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your data and privacy preferences</p>
      </div>

      {/* Privacy Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Privacy & Data
              </h2>
              <p className="text-sm text-gray-500">
                All your data is stored locally on this device
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Storage Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Local Storage Used</p>
                <p className="text-sm text-gray-500">{storageUsed}</p>
              </div>
            </div>
            <Database className="w-5 h-5 text-gray-400" />
          </div>

          {/* Export Data */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Export All Data</p>
              <p className="text-sm text-gray-500">
                Download a JSON file containing all your data
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                exportSuccess
                  ? 'bg-green-100 text-green-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              )}
            >
              {exportSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Exported
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </>
              )}
            </button>
          </div>

          {/* Delete Data */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Delete All Data</p>
              <p className="text-sm text-gray-500">
                Permanently remove all stored data from this device
              </p>
            </div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            )}
          </div>

          {deleteSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
              <Check className="w-4 h-4" />
              All data has been deleted. Reloading...
            </div>
          )}
        </div>
      </div>

      {/* AI Model Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Model</h2>
              <p className="text-sm text-gray-500">
                Choose which local AI model to use
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {Object.entries(MODELS).map(([id, model]) => (
            <button
              key={id}
              onClick={() => handleLoadModel(id as ModelId)}
              disabled={llm.isLoading}
              className={clsx(
                'w-full p-4 rounded-lg border text-left transition-colors',
                selectedModel === id && llm.isReady
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{model.name}</p>
                    {model.recommended && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Size: {model.size}
                  </p>
                </div>
                {selectedModel === id && llm.isReady && (
                  <Check className="w-5 h-5 text-primary-600" />
                )}
                {selectedModel === id && llm.isLoading && (
                  <span className="text-sm text-primary-600">
                    {llm.progress}%
                  </span>
                )}
              </div>
            </button>
          ))}

          <div className="mt-4 p-4 bg-amber-50 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">WebGPU Required</p>
              <p className="mt-1">
                AI models run locally using WebGPU. Make sure your browser
                supports WebGPU for the best experience. Chrome and Edge have
                the best support.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Language Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Language</h2>
              <p className="text-sm text-gray-500">
                Choose your preferred language for AI responses
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Response Language</p>
              <p className="text-sm text-gray-500">
                The AI will respond in your selected language
              </p>
            </div>
            <select
              value={settings.language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 max-h-60"
            >
              {Object.entries(ALL_SUPPORTED_LANGUAGES)
                .sort((a, b) => a[1].localeCompare(b[1])) // Sort alphabetically by language name
                .map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Response Size Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Response Length</h2>
              <p className="text-sm text-gray-500">
                Control how detailed AI responses should be
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {(Object.entries(RESPONSE_SIZE_CONFIG) as [ResponseSize, typeof RESPONSE_SIZE_CONFIG[ResponseSize]][]).map(
            ([size, config]) => (
              <button
                key={size}
                onClick={() => setResponseSize(size)}
                className={clsx(
                  'w-full p-4 rounded-lg border text-left transition-colors',
                  settings.responseSize === size
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{config.label}</p>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {config.description}
                    </span>
                  </div>
                  {settings.responseSize === size && (
                    <Check className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Pros:</p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {config.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-green-500">+</span> {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-700 mb-1">Cons:</p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {config.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-red-500">-</span> {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            )
          )}
        </div>
      </div>

      {/* Context Window Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Context Window</h2>
              <p className="text-sm text-gray-500">
                How much conversation history the AI can remember
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="mb-4 p-3 bg-amber-50 rounded-lg flex items-start gap-2">
            <RefreshCw className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Changing this setting requires reloading the AI model
            </p>
          </div>

          {CONTEXT_WINDOW_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleContextWindowChange(option.value)}
              className={clsx(
                'w-full p-4 rounded-lg border text-left transition-colors',
                settings.contextWindowSize === option.value
                  ? 'border-orange-500 bg-orange-50'
                  : pendingContextSize === option.value
                  ? 'border-orange-300 bg-orange-25'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{option.label}</p>
                  {option.value === 8192 && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                {settings.contextWindowSize === option.value && (
                  <Check className="w-5 h-5 text-orange-600" />
                )}
              </div>
              <p className="text-sm text-gray-500 mb-2">{option.description}</p>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedContextInfo(expandedContextInfo === option.value ? false : option.value)
                }}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
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

              {expandedContextInfo === option.value && (
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Pros:</p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {option.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-green-500">+</span> {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-700 mb-1">Cons:</p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {option.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-red-500">-</span> {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </button>
          ))}

          {/* Confirmation dialog for context window change */}
          {pendingContextSize && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 mb-3">
                Change context window to{' '}
                <strong>
                  {CONTEXT_WINDOW_OPTIONS.find((o) => o.value === pendingContextSize)?.label}
                </strong>
                ? This will reload the page.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPendingContextSize(null)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmContextWindowChange}
                  className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Confirm & Reload
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conversation Memory Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <History className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Conversation Memory</h2>
              <p className="text-sm text-gray-500">
                Remember context from previous sessions
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Memory</p>
              <p className="text-sm text-gray-500">
                The AI will remember topics, facts, and preferences from your previous conversations
              </p>
            </div>
            <button
              onClick={() => setConversationMemoryEnabled(!settings.conversationMemoryEnabled)}
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                settings.conversationMemoryEnabled ? 'bg-teal-600' : 'bg-gray-300'
              )}
            >
              <span
                className={clsx(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  settings.conversationMemoryEnabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {settings.conversationMemoryEnabled && (
            <div className="mt-4 p-3 bg-teal-50 rounded-lg">
              <p className="text-sm text-teal-800">
                Memory is enabled. The AI will use context from your last 5 sessions to provide more personalized responses.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* System Prompt Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Personality</h2>
              <p className="text-sm text-gray-500">
                Choose how the AI behaves and responds
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Preset selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SYSTEM_PROMPT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSystemPromptPreset(preset.id)}
                className={clsx(
                  'p-3 rounded-lg border text-left transition-colors',
                  settings.systemPromptPreset === preset.id
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-900 text-sm">{preset.label}</p>
                  {settings.systemPromptPreset === preset.id && (
                    <Check className="w-4 h-4 text-pink-600" />
                  )}
                </div>
                <p className="text-xs text-gray-500">{preset.description}</p>
              </button>
            ))}
          </div>

          {/* View/Edit prompt button */}
          <button
            onClick={() => setShowPromptEditor(!showPromptEditor)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
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
          {showPromptEditor && (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">
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
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg text-sm font-mono resize-y focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              {settings.systemPromptPreset !== 'custom' && (
                <p className="text-xs text-gray-500">
                  Editing the text above will switch to "Custom Prompt" mode
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>QMU.io</strong> is a privacy-preserving AI assistant
            that learns and adapts to you over time.
          </p>
          <p>
            All data is processed and stored locally on your device. No data is
            ever sent to external servers.
          </p>
          <p className="text-gray-400 mt-4">Version 0.1.0 (MVP)</p>
        </div>
      </div>
    </div>
  )
}
