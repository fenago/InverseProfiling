import {
  useStore,
  ALL_SUPPORTED_LANGUAGES,
  RESPONSE_SIZE_CONFIG,
  SYSTEM_PROMPT_PRESETS,
  type LanguageCode,
  type ResponseSize,
} from './store'
import { db, logActivity } from './db'
import { FilesetResolver, LlmInference } from '@mediapipe/tasks-genai'
import {
  getAdaptationProfile,
  generateAdaptiveSystemPrompt,
} from './adaptive-response'
import { getCachedMemoryContext } from './session-memory'
import { getStrategicQuestioningPromptAsync } from './strategic-questions'

// Gemma 3n model configurations
// These are the official LiteRT-LM format models for browser inference
export const MODELS = {
  'gemma-3n-E4B': {
    name: 'Gemma 3n E4B (4B params)',
    url: 'https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma-3n-E4B-it-int4-Web.litertlm',
    size: '~2.5GB',
    sizeBytes: 2684354560, // 2.5GB in bytes
    recommended: true,
    supportsMultimodal: true, // Gemma 3n supports image and audio
  },
  'gemma-3n-E2B': {
    name: 'Gemma 3n E2B (2B params)',
    url: 'https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma-3n-E2B-it-int4-Web.litertlm',
    size: '~1.2GB',
    sizeBytes: 1288490189, // 1.2GB in bytes
    recommended: false,
    supportsMultimodal: true, // Gemma 3n supports image and audio
  },
  'gemma3-270m': {
    name: 'Gemma 3 270M (Lightweight)',
    url: 'https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma3-270m-it-q8-web.task',
    size: '~300MB',
    sizeBytes: 314572800, // 300MB in bytes
    recommended: false,
    supportsMultimodal: false, // Gemma 3 270M is text-only
  },
} as const

// Types for multimodal input
export interface ImageInput {
  imageSource: string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
}

export interface AudioInput {
  audioSource: string | AudioBuffer
}

export type MultimodalContent = string | ImageInput | AudioInput
export type MultimodalPrompt = MultimodalContent[]

// Tips to show during model loading
export const LOADING_TIPS = [
  { title: 'Privacy First', text: 'Your conversations stay on your device. No data is sent to external servers.' },
  { title: 'Learning Your Style', text: 'The AI analyzes 22 psychological domains from your conversations to build your profile.' },
  { title: 'Secure Storage', text: 'All data is stored locally using encrypted browser storage.' },
  { title: 'Personality Insights', text: 'We analyze Big Five traits: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.' },
  { title: 'Offline Capable', text: 'Once loaded, the model works completely offline.' },
  { title: 'WebGPU Powered', text: 'This uses cutting-edge WebGPU technology for fast, local AI inference.' },
  { title: 'Quantified Mind', text: 'Over time, I learn your communication style and preferences.' },
  { title: 'First Load', text: 'The first download may take a while, but subsequent loads will be much faster due to browser caching.' },
]

// Measure connection speed by downloading a small test file
export async function measureConnectionSpeed(): Promise<number> {
  try {
    // Use a small file to estimate speed (we'll use the Navigator API if available)
    const connection = (navigator as Navigator & { connection?: { downlink?: number } }).connection
    if (connection?.downlink) {
      // downlink is in Mbps, convert to bytes per second
      return connection.downlink * 1024 * 1024 / 8
    }

    // Fallback: download a small test payload and measure time
    const testUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm/genai_wasm_internal.js'
    const startTime = performance.now()
    const response = await fetch(testUrl, { cache: 'no-store' })
    const data = await response.arrayBuffer()
    const endTime = performance.now()

    const durationSec = (endTime - startTime) / 1000
    const bytesPerSecond = data.byteLength / durationSec

    return bytesPerSecond
  } catch (error) {
    console.warn('Could not measure connection speed:', error)
    // Return conservative estimate (1 Mbps = 125KB/s)
    return 125 * 1024
  }
}

// Estimate download time in seconds
export function estimateDownloadTime(modelSizeBytes: number, speedBytesPerSec: number): number {
  // Add 20% buffer for overhead
  return (modelSizeBytes / speedBytesPerSec) * 1.2
}

// Format seconds to human readable time
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return secs > 0 ? `${mins} min ${secs} sec` : `${mins} minutes`
  } else {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.round((seconds % 3600) / 60)
    return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hours`
  }
}

export type ModelId = keyof typeof MODELS

// MediaPipe WASM files CDN
const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm'

// Default system prompt for the QMU.io assistant (used as fallback)
const DEFAULT_SYSTEM_PROMPT = `You are a friendly, empathetic AI assistant designed to help users explore their thoughts and feelings. Your goal is to:
1. Engage in natural, supportive conversation
2. Ask thoughtful follow-up questions to understand the user better
3. Help users reflect on their experiences and perspectives
4. Be curious about their interests, values, and ways of thinking

Keep responses concise but meaningful. Be warm and genuine.`

// Cache for adaptive system prompt
let cachedAdaptivePrompt: string | null = null
let cachedLanguage: string | null = null // Composite key: "language-responseSize"
let lastAdaptivePromptUpdate = 0
const PROMPT_CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Get language instruction based on selected language
 */
function getLanguageInstruction(language: LanguageCode): string {
  if (language === 'en') {
    return '' // No instruction needed for English (default)
  }
  const languageName = ALL_SUPPORTED_LANGUAGES[language as keyof typeof ALL_SUPPORTED_LANGUAGES] || language
  return `\n\nIMPORTANT: Always respond in ${languageName}. Maintain your helpful and empathetic tone while communicating in ${languageName}.`
}

/**
 * Get the user's selected system prompt preset
 */
function getUserSystemPrompt(): string {
  const store = useStore.getState()
  const preset = store.settings.systemPromptPreset

  if (preset === 'custom') {
    // Return user's custom prompt, or default if empty
    return store.settings.customSystemPrompt || DEFAULT_SYSTEM_PROMPT
  }

  // Find the preset and return its prompt
  const presetConfig = SYSTEM_PROMPT_PRESETS.find(p => p.id === preset)
  return presetConfig?.prompt || DEFAULT_SYSTEM_PROMPT
}

/**
 * Get the system prompt - combines user preset with adaptive profile if available
 * Includes response size instruction based on user settings
 * Also includes conversation memory from previous sessions if enabled
 */
async function getSystemPrompt(language: LanguageCode = 'en', responseSize: ResponseSize = 'medium'): Promise<string> {
  const now = Date.now()
  const store = useStore.getState()
  const memoryEnabled = store.settings.conversationMemoryEnabled ?? true
  const currentSessionId = store.chat.currentSessionId
  const cacheKey = `${language}-${responseSize}-${store.settings.systemPromptPreset}-${memoryEnabled}`

  // Use cache if recent and settings haven't changed
  if (cachedAdaptivePrompt && cachedLanguage === cacheKey && (now - lastAdaptivePromptUpdate) < PROMPT_CACHE_DURATION_MS) {
    return cachedAdaptivePrompt
  }

  // Start with user's selected preset
  let basePrompt = getUserSystemPrompt()
  const languageInstruction = getLanguageInstruction(language)
  const responseSizeInstruction = `\n\n${RESPONSE_SIZE_CONFIG[responseSize].promptInstruction}`

  try {
    const profile = await getAdaptationProfile()

    // If we have meaningful profile data and user hasn't set a custom prompt,
    // blend adaptive insights with their chosen personality preset
    if (profile.dataPointsUsed >= 3 && profile.confidence > 0.1) {
      const adaptiveInsights = generateAdaptiveSystemPrompt(profile)
      // Append adaptive insights to the base prompt instead of replacing
      basePrompt = `${basePrompt}\n\n--- Personalization (based on your conversation history) ---\n${adaptiveInsights}`
      console.log(`Enhanced with adaptive insights (confidence: ${(profile.confidence * 100).toFixed(1)}%, ${profile.dataPointsUsed} data points)`)
    }
  } catch (error) {
    console.warn('Failed to generate adaptive prompt, using preset only:', error)
  }

  // Add conversation memory from previous sessions if enabled
  if (memoryEnabled) {
    try {
      const memoryContext = await getCachedMemoryContext(currentSessionId)
      if (memoryContext) {
        basePrompt = `${basePrompt}\n\n--- Memory from Previous Conversations ---\n${memoryContext}`
        console.log('Added conversation memory context to system prompt')
      }
    } catch (error) {
      console.warn('Failed to get conversation memory:', error)
    }
  }

  // Add strategic questioning guidance based on profile phase
  try {
    // Get session count to determine the questioning phase
    const sessionCount = await db.messages
      .where('sessionId')
      .equals(currentSessionId)
      .count()

    const strategicPrompt = await getStrategicQuestioningPromptAsync(sessionCount)
    if (strategicPrompt) {
      basePrompt = `${basePrompt}\n\n${strategicPrompt}`
      console.log('Added strategic questioning guidance to system prompt')
    }
  } catch (error) {
    console.warn('Failed to add strategic questioning:', error)
  }

  // Add language and response size instructions
  cachedAdaptivePrompt = basePrompt + responseSizeInstruction + languageInstruction
  cachedLanguage = cacheKey
  lastAdaptivePromptUpdate = now

  return cachedAdaptivePrompt
}

// LLM Engine - Real MediaPipe LLM Inference implementation
class LLMEngine {
  private isInitializing = false
  private currentModel: ModelId | null = null
  private llmInference: LlmInference | null = null
  private multimodalEnabled = false

  async initialize(modelId: ModelId = 'gemma-3n-E4B'): Promise<boolean> {
    if (this.isInitializing) return false
    if (this.llmInference && this.currentModel === modelId) return true

    const store = useStore.getState()
    this.isInitializing = true
    store.setLLMLoading(true)
    store.setLLMProgress(0)
    store.setLLMError(null)

    try {
      const model = MODELS[modelId]
      await logActivity('model_load', `Starting to load ${model.name}`)

      // Check WebGPU support first
      if (!('gpu' in navigator)) {
        throw new Error(
          'WebGPU is not supported in this browser. Please use Chrome 113+ or Edge 113+.'
        )
      }

      store.setLLMProgress(5)

      // Initialize MediaPipe GenAI runtime
      console.log('Initializing MediaPipe GenAI runtime...')
      const genai = await FilesetResolver.forGenAiTasks(WASM_PATH)
      store.setLLMProgress(10)

      // Create LLM Inference with the model
      console.log(`Loading model from: ${model.url}`)
      console.log('This may take several minutes for large models...')

      // Build options based on model capabilities
      const options: Record<string, unknown> = {
        baseOptions: {
          modelAssetPath: model.url,
        },
        maxTokens: store.settings.contextWindowSize || 8192, // Gemma 3n supports 32K natively
        topK: 40,
        temperature: 0.8,
        randomSeed: Math.floor(Math.random() * 10000),
      }

      // Enable multimodal for supported models (Gemma 3n)
      if (model.supportsMultimodal) {
        options.maxNumImages = 5 // Allow up to 5 images per prompt
        options.supportAudio = true // Enable audio input
        this.multimodalEnabled = true
        console.log('Multimodal support enabled (images + audio)')
      } else {
        this.multimodalEnabled = false
      }

      // Create the LLM inference engine
      // The model will be downloaded and cached by the browser
      console.log('Creating LLM inference engine...')
      this.llmInference = await LlmInference.createFromOptions(genai, options)

      // Verify the model loaded successfully
      if (!this.llmInference) {
        throw new Error('Model loaded but inference engine is null')
      }

      console.log('Model inference engine created, testing with a simple prompt...')

      // Test the model with a minimal prompt to verify it works
      try {
        const testResult = await this.llmInference.generateResponse('Hi')
        console.log('Model test response received:', testResult ? `"${testResult.substring(0, 50)}..."` : 'empty')
        if (!testResult) {
          console.warn('Model test returned empty response, but continuing...')
        }
      } catch (testError) {
        console.error('Model test failed:', testError)
        // Don't throw - some models might fail on minimal prompts but work on longer ones
        console.log('Continuing despite test failure...')
      }

      store.setLLMProgress(100)
      this.currentModel = modelId
      store.setLLMReady(true)
      store.setLLMModel(model.name)

      await logActivity('model_load', `Successfully loaded ${model.name}${model.supportsMultimodal ? ' (multimodal)' : ''}`)
      console.log('=== MODEL LOADED SUCCESSFULLY ===')
      console.log('Model:', model.name)
      console.log('llmInference exists:', this.llmInference !== null)
      console.log('Store state:', {
        isReady: useStore.getState().llm.isReady,
        isLoading: useStore.getState().llm.isLoading,
        modelName: useStore.getState().llm.modelName,
      })
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load model'
      store.setLLMError(errorMessage)
      await logActivity('model_load', `Failed to load model: ${errorMessage}`)
      console.error('LLM initialization error:', error)
      return false
    } finally {
      this.isInitializing = false
      store.setLLMLoading(false)
    }
  }

  isMultimodalEnabled(): boolean {
    return this.multimodalEnabled
  }

  async generate(
    userMessage: string,
    onToken?: (token: string) => void,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    console.log('=== LLMEngine.generate() called ===')
    console.log('userMessage:', userMessage.substring(0, 100))
    console.log('llmInference exists:', this.llmInference !== null)
    console.log('currentModel:', this.currentModel)
    console.log('isInitializing:', this.isInitializing)

    const store = useStore.getState()
    console.log('Store state in generate:', {
      isReady: store.llm.isReady,
      isLoading: store.llm.isLoading,
      modelName: store.llm.modelName,
    })

    if (!this.llmInference) {
      console.error('generate() called but llmInference is null!')
      console.error('This usually means:')
      console.error('1. Model was never loaded')
      console.error('2. Hot reload interrupted model loading')
      console.error('3. Model loading failed silently')
      throw new Error('Model not loaded. Please hard refresh (Cmd+Shift+R) and reload the model.')
    }

    store.setGenerating(true)

    try {
      // Get adaptive system prompt based on user's profile, language, and response size settings
      const responseSizeSetting = store.settings.responseSize || 'medium'
      const systemPrompt = await getSystemPrompt(store.settings.language, responseSizeSetting)

      // Build the prompt with system context and conversation history
      let prompt = `<start_of_turn>system
${systemPrompt}
<end_of_turn>
`

      // Add conversation history if provided (excluding the current message which we add separately)
      // Use response size setting to determine history limit
      if (conversationHistory && conversationHistory.length > 0) {
        const maxHistoryChars = RESPONSE_SIZE_CONFIG[responseSizeSetting].maxHistoryChars

        // Build history from most recent messages, stopping when we exceed limit
        const historyMessages: string[] = []
        let historyCharCount = 0

        // Process from newest to oldest
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
          const msg = conversationHistory[i]
          const turnRole = msg.role === 'user' ? 'user' : 'model'
          const formattedMsg = `<start_of_turn>${turnRole}\n${msg.content}\n<end_of_turn>\n`

          if (historyCharCount + formattedMsg.length > maxHistoryChars) {
            // Would exceed limit, stop adding history
            console.log(`Truncating conversation history at ${historyMessages.length} messages (${historyCharCount} chars, limit: ${maxHistoryChars})`)
            break
          }

          historyMessages.unshift(formattedMsg) // Add to front to maintain order
          historyCharCount += formattedMsg.length
        }

        // Add the truncated history to prompt
        for (const formattedMsg of historyMessages) {
          prompt += formattedMsg
        }
      }

      // Add the current user message
      prompt += `<start_of_turn>user
${userMessage}
<end_of_turn>
<start_of_turn>model
`

      let fullResponse = ''

      console.log('Starting generation with prompt length:', prompt.length)

      // Always use non-streaming first, then stream the result to the callback
      // MediaPipe's streaming callback seems unreliable in some cases
      console.log('Calling generateResponse (non-streaming)...')
      fullResponse = await this.llmInference.generateResponse(prompt)
      console.log('Response received, length:', fullResponse.length)

      // If we have a callback, send the full response as tokens
      if (onToken && fullResponse) {
        // Simulate streaming by chunking the response
        const words = fullResponse.split(' ')
        for (let i = 0; i < words.length; i++) {
          const word = i === 0 ? words[i] : ' ' + words[i]
          onToken(word)
          // Small delay for visual effect
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      if (fullResponse.length === 0) {
        console.warn('Warning: Model returned empty response')
        throw new Error('Model returned empty response. Please try again.')
      }

      return fullResponse
    } finally {
      store.setGenerating(false)
    }
  }

  /**
   * Generate a response with multimodal input (images and/or audio)
   * Only works with Gemma 3n models that support multimodal
   */
  async generateMultimodal(
    content: MultimodalPrompt,
    onToken?: (token: string) => void,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    const store = useStore.getState()

    if (!this.llmInference) {
      throw new Error('Model not loaded. Please load a model first.')
    }

    if (!this.multimodalEnabled) {
      throw new Error('Current model does not support multimodal input. Please use Gemma 3n E4B or E2B.')
    }

    store.setGenerating(true)

    try {
      // Get adaptive system prompt based on user's profile, language, and response size settings
      const responseSizeSetting = store.settings.responseSize || 'medium'
      const systemPrompt = await getSystemPrompt(store.settings.language, responseSizeSetting)

      // Build the multimodal prompt array
      const promptParts: MultimodalPrompt = [
        '<start_of_turn>system\n',
        systemPrompt,
        '\n<end_of_turn>\n',
      ]

      // Add conversation history if provided (with token-aware truncation)
      if (conversationHistory && conversationHistory.length > 0) {
        // Reserve tokens: ~300 for system prompt, ~100 for multimodal content overhead, ~400 for response
        // That leaves ~220 tokens for conversation history
        const MAX_HISTORY_CHARS = 900 // ~225 tokens * 4 chars/token

        // Build history from most recent messages, stopping when we exceed limit
        const historyParts: Array<{ parts: string[]; charCount: number }> = []
        let historyCharCount = 0

        // Process from newest to oldest
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
          const msg = conversationHistory[i]
          const turnRole = msg.role === 'user' ? 'user' : 'model'
          const charCount = msg.content.length + 30 // Overhead for turn markers

          if (historyCharCount + charCount > MAX_HISTORY_CHARS) {
            console.log(`Truncating multimodal history at ${historyParts.length} messages (${historyCharCount} chars)`)
            break
          }

          historyParts.unshift({
            parts: [`<start_of_turn>${turnRole}\n`, msg.content, '\n<end_of_turn>\n'],
            charCount,
          })
          historyCharCount += charCount
        }

        // Add the truncated history to prompt
        for (const { parts } of historyParts) {
          promptParts.push(...parts)
        }
      }

      // Add the current user's multimodal content
      promptParts.push('<start_of_turn>user\n')
      promptParts.push(...content)
      promptParts.push('\n<end_of_turn>\n<start_of_turn>model\n')

      let fullResponse = ''

      // Use streaming if callback provided
      if (onToken) {
        await this.llmInference.generateResponse(promptParts, (partialResult: string, done: boolean) => {
          if (partialResult) {
            fullResponse += partialResult
            onToken(partialResult)
          }
          if (done) {
            console.log('Multimodal generation complete')
          }
        })
      } else {
        // Non-streaming response
        fullResponse = await this.llmInference.generateResponse(promptParts)
      }

      return fullResponse
    } finally {
      store.setGenerating(false)
    }
  }

  async unload(): Promise<void> {
    if (this.llmInference) {
      this.llmInference.close()
      this.llmInference = null
    }
    this.currentModel = null

    const store = useStore.getState()
    store.setLLMReady(false)
    store.setLLMModel(null)
    store.setLLMProgress(0)

    await logActivity('model_load', 'Model unloaded')
  }

  isReady(): boolean {
    return this.llmInference !== null
  }

  getCurrentModel(): ModelId | null {
    return this.currentModel
  }
}

// Singleton instance
export const llmEngine = new LLMEngine()

// Hook for using the LLM in components
export function useLLM() {
  const store = useStore()

  return {
    isLoading: store.llm.isLoading,
    isReady: store.llm.isReady,
    progress: store.llm.progress,
    modelName: store.llm.modelName,
    error: store.llm.error,
    initialize: llmEngine.initialize.bind(llmEngine),
    generate: llmEngine.generate.bind(llmEngine),
    generateMultimodal: llmEngine.generateMultimodal.bind(llmEngine),
    unload: llmEngine.unload.bind(llmEngine),
    getCurrentModel: llmEngine.getCurrentModel.bind(llmEngine),
    isMultimodalEnabled: llmEngine.isMultimodalEnabled.bind(llmEngine),
  }
}

// Save message to database
export async function saveMessage(
  role: 'user' | 'assistant',
  content: string,
  sessionId: string,
  metadata?: { tokenCount?: number; responseTime?: number }
): Promise<number> {
  const id = await db.messages.add({
    role,
    content,
    timestamp: new Date(),
    sessionId,
    metadata,
  })

  await logActivity('message', `${role} message saved (${content.length} chars)`)
  return id as number
}
