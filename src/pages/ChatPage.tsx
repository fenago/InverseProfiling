import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Bot, User, AlertCircle, Download, ChevronDown, Sparkles, Clock, Image, Mic, MicOff, X, Globe } from 'lucide-react'
import { useStore, SUPPORTED_LANGUAGES, type LanguageCode } from '../lib/store'
import {
  llmEngine,
  saveMessage,
  MODELS,
  LOADING_TIPS,
  measureConnectionSpeed,
  estimateDownloadTime,
  formatDuration,
  type ModelId,
  type MultimodalPrompt,
  type ImageInput,
  type AudioInput
} from '../lib/llm'
import { analyzeAndStore } from '../lib/analyzer'
import { analyzeAndStoreEnhanced, computeLIWCDomainScores } from '../lib/enhanced-analyzer'
import {
  initHybridAnalyzer,
  analyzeHybrid,
  checkAndRunTimeoutAnalysis,
  getAnalysisStatus,
} from '../lib/hybrid-aggregator'
import { initializeLearningSystem } from '../lib/learning-engine'
import {
  initContextTables,
  processMessageWithContext,
} from '../lib/context-profiler'
import { buildAdvancedRelationships } from '../lib/advanced-graph'
import {
  isAudioAnalysisSupported,
  initializeAudioAnalyzer,
  startAudioRecording as startProsodicRecording,
  stopAudioRecording as stopProsodicRecording,
  mapFeaturesToDomains,
  getProsodicSummary,
  type ProsodicFeatures,
  type AudioAnalysisResult,
} from '../lib/audio-analyzer'
import {
  quickFuse,
  getFusionSummary,
} from '../lib/multimodal-fusion'
import {
  detectEmotion,
  blendEmotions,
  calculateEmotionTrend,
  type EmotionalState,
  type EmotionTrend,
} from '../lib/emotion-detector'
import { saveEmotionState } from '../lib/sqldb'
import { EmotionIndicator } from '../components/EmotionIndicator'
import type { PsychologicalDomain } from '../lib/analysis-config'
import { updatePersonalityProfile } from '../lib/personality'
import { db, updateProfileStats } from '../lib/db'
import { FormattedMessage } from '../lib/format-message'
import clsx from 'clsx'

// Loading phase descriptions
type LoadingPhase = 'measuring' | 'initializing' | 'downloading' | 'finalizing'

const LOADING_PHASE_MESSAGES: Record<LoadingPhase, string> = {
  measuring: 'Measuring connection speed...',
  initializing: 'Initializing AI runtime...',
  downloading: 'Downloading model (this may take a few minutes)...',
  finalizing: 'Finalizing model setup...',
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [estimatedTimeSec, setEstimatedTimeSec] = useState<number | null>(null)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [loadingModelId, setLoadingModelId] = useState<ModelId | null>(null)
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState<string>('')
  const [dynamicEstimate, setDynamicEstimate] = useState<string | null>(null)
  const [simulatedProgress, setSimulatedProgress] = useState<number>(0)
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('measuring')

  // Multimodal state
  const [attachedImages, setAttachedImages] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  // Prosodic analysis state
  const [isProsodicAnalysisEnabled, setIsProsodicAnalysisEnabled] = useState(false)
  const [prosodicFeatures, setProsodicFeatures] = useState<ProsodicFeatures | null>(null)
  const [_prosodicSummary, setProsodicSummary] = useState<string | null>(null)

  // Real-time emotion detection state (Phase 6)
  const [currentEmotion, setCurrentEmotion] = useState<EmotionalState | null>(null)
  const [_emotionHistory, setEmotionHistory] = useState<EmotionalState[]>([])
  const [emotionTrend, setEmotionTrend] = useState<EmotionTrend | null>(null)
  const [showEmotionPanel, setShowEmotionPanel] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<number | null>(null)

  const { llm, chat, addMessage, setMessages, settings, setLanguage } = useStore()
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)

  // Load messages from DB on mount
  useEffect(() => {
    async function loadMessages() {
      const messages = await db.messages
        .where('sessionId')
        .equals(chat.currentSessionId)
        .toArray()
      setMessages(messages)
    }
    loadMessages()
  }, [chat.currentSessionId, setMessages])

  // Initialize hybrid analyzer (pre-cache trait prototype embeddings)
  useEffect(() => {
    console.log('Initializing hybrid analyzer...')
    initHybridAnalyzer()
      .then(() => {
        const status = getAnalysisStatus()
        console.log('Hybrid analyzer status:', status)
      })
      .catch((error) => console.warn('Hybrid analyzer init failed (non-blocking):', error))
  }, [])

  // Initialize learning system (prerequisites, preferences, knowledge states)
  useEffect(() => {
    console.log('Initializing learning system...')
    initializeLearningSystem()
      .then(() => console.log('Learning system initialized'))
      .catch((error) => console.warn('Learning system init failed (non-blocking):', error))
  }, [])

  // Initialize context profiling tables
  useEffect(() => {
    console.log('Initializing context profiling...')
    initContextTables()
      .then(() => console.log('Context profiling tables initialized'))
      .catch((error) => console.warn('Context profiling init failed (non-blocking):', error))
  }, [])

  // Initialize prosodic/audio analyzer
  useEffect(() => {
    if (isAudioAnalysisSupported()) {
      console.log('Initializing prosodic audio analyzer...')
      initializeAudioAnalyzer()
        .then((success) => {
          if (success) {
            setIsProsodicAnalysisEnabled(true)
            console.log('Prosodic audio analyzer initialized successfully')
          } else {
            console.warn('Prosodic audio analyzer initialization failed')
          }
        })
        .catch((error) => console.warn('Prosodic analyzer init failed (non-blocking):', error))
    } else {
      console.log('Audio analysis not supported in this browser')
    }
  }, [])

  // Periodic check for timeout-based LLM batch analysis (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndRunTimeoutAnalysis()
        .then((ran) => {
          if (ran) console.log('Timeout-triggered LLM analysis completed')
        })
        .catch((error) => console.warn('Timeout LLM analysis failed:', error))
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages, streamingContent])

  // Rotate tips every 5 seconds during loading
  useEffect(() => {
    if (!llm.isLoading) return

    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % LOADING_TIPS.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [llm.isLoading])

  // Update elapsed time, dynamic estimate, and simulated progress during loading
  useEffect(() => {
    if (!llm.isLoading || !loadStartTime) {
      setElapsedTime('')
      setDynamicEstimate(null)
      setSimulatedProgress(0)
      return
    }

    const interval = setInterval(() => {
      const elapsedSec = (Date.now() - loadStartTime) / 1000
      setElapsedTime(formatDuration(elapsedSec))

      // If actual progress is 100%, use that
      if (llm.progress >= 100) {
        setSimulatedProgress(100)
        setLoadingPhase('finalizing')
        setDynamicEstimate(null)
        return
      }

      // Update loading phase based on actual progress
      if (llm.progress < 5) {
        setLoadingPhase('initializing')
      } else if (llm.progress < 100) {
        setLoadingPhase('downloading')
      }

      // Simulate progress based on estimated time
      // The actual progress stays at 10% during download, so we simulate
      // progress from 10% to 95% based on elapsed time vs estimated time
      if (estimatedTimeSec && llm.progress >= 10 && llm.progress < 100) {
        // Calculate simulated progress: 10% + (elapsed/estimated) * 85%
        // Cap at 95% until actual completion
        const downloadProgress = Math.min(elapsedSec / estimatedTimeSec, 1)
        // Use an easing function for more natural progress feel
        // Starts fast, slows down as it approaches completion
        const easedProgress = 1 - Math.pow(1 - downloadProgress, 2)
        const newSimulated = Math.min(10 + (easedProgress * 85), 95)
        setSimulatedProgress(newSimulated)

        // Calculate remaining time estimate
        const remainingPercent = 100 - newSimulated
        if (newSimulated > 10) {
          const progressMade = newSimulated - 10
          const timePerPercent = elapsedSec / progressMade
          const remainingSec = remainingPercent * timePerPercent
          setDynamicEstimate(formatDuration(Math.max(remainingSec, 5)))
        }
      } else {
        // Before hitting 10%, use actual progress
        setSimulatedProgress(llm.progress)
      }
    }, 500) // Update more frequently for smoother progress

    return () => clearInterval(interval)
  }, [llm.isLoading, loadStartTime, llm.progress, estimatedTimeSec])

  // Image upload handler
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // Check if multimodal is supported
    if (!llmEngine.isMultimodalEnabled()) {
      alert('Current model does not support image input. Please load Gemma 3n E4B or E2B.')
      return
    }

    // Limit to 5 images
    const remainingSlots = 5 - attachedImages.length
    if (remainingSlots <= 0) {
      alert('Maximum 5 images allowed per message.')
      return
    }

    Array.from(files).slice(0, remainingSlots).forEach(file => {
      if (!file.type.startsWith('image/')) return

      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedImages(prev => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [attachedImages.length])

  // Remove attached image
  const removeImage = useCallback((index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Start audio recording
  const startRecording = useCallback(async () => {
    if (!llmEngine.isMultimodalEnabled()) {
      alert('Current model does not support audio input. Please load Gemma 3n E4B or E2B.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        console.log('Recording saved:', audioBlob.size, 'bytes')

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      // Start recording
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)

      // Also start prosodic analysis if enabled
      if (isProsodicAnalysisEnabled) {
        console.log('Starting prosodic recording alongside audio...')
        startProsodicRecording().catch((err) => {
          console.warn('Prosodic recording failed to start:', err)
        })
      }

      // Update recording time
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      console.log('Recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Could not access microphone. Please ensure microphone permissions are granted.')
    }
  }, [isProsodicAnalysisEnabled])

  // Stop audio recording
  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Clear interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }

      // Stop prosodic recording and capture features
      if (isProsodicAnalysisEnabled) {
        try {
          const features = await stopProsodicRecording()
          if (features) {
            setProsodicFeatures(features)
            const summary = getProsodicSummary(features)
            setProsodicSummary(summary)
            console.log('Prosodic features captured:', {
              pitchMean: features.pitchMean.toFixed(1),
              speechRate: features.speechRate.toFixed(1),
              energyMean: features.energyMean.toFixed(3),
              summary
            })

            // Phase 6: Real-time emotion detection from prosodic features
            try {
              const detectedEmotion = detectEmotion(features)

              // Blend with previous emotion for smoother transitions
              const blendedEmotion = currentEmotion
                ? blendEmotions(detectedEmotion, currentEmotion, 0.3)
                : detectedEmotion

              setCurrentEmotion(blendedEmotion)

              // Add to history (keep last 20)
              setEmotionHistory(prev => {
                const newHistory = [blendedEmotion, ...prev].slice(0, 20)

                // Calculate trend from history
                if (newHistory.length >= 3) {
                  const trend = calculateEmotionTrend(newHistory.slice(0, 10))
                  setEmotionTrend(trend)
                }

                return newHistory
              })

              // Save to SQL database
              saveEmotionState(
                chat.currentSessionId,
                blendedEmotion.valence,
                blendedEmotion.arousal,
                blendedEmotion.primaryEmotion,
                blendedEmotion.confidence,
                blendedEmotion.intensity,
                'audio',
                undefined,
                blendedEmotion.secondaryEmotion ?? undefined
              ).then(() => {
                console.log('Emotion state saved to SQL:', {
                  emotion: blendedEmotion.primaryEmotion,
                  valence: blendedEmotion.valence.toFixed(2),
                  arousal: blendedEmotion.arousal.toFixed(2),
                  confidence: blendedEmotion.confidence.toFixed(2),
                })
              }).catch(err => {
                console.warn('Failed to save emotion state:', err)
              })
            } catch (emotionErr) {
              console.warn('Emotion detection failed:', emotionErr)
            }
          }
        } catch (err) {
          console.warn('Failed to capture prosodic features:', err)
        }
      }

      console.log('Recording stopped')
    }
  }, [isRecording, isProsodicAnalysisEnabled, currentEmotion, chat.currentSessionId])

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  // Clear recorded audio and prosodic features
  const clearAudio = useCallback(() => {
    setAudioBlob(null)
    setRecordingTime(0)
    setProsodicFeatures(null)
    setProsodicSummary(null)
  }, [])

  async function handleLoadModel(modelId: ModelId) {
    setShowModelSelector(false)
    setLoadingModelId(modelId)
    setLoadStartTime(Date.now())
    setCurrentTipIndex(0)
    setLoadingPhase('measuring')
    setSimulatedProgress(0)

    // Measure connection speed first
    console.log('Measuring connection speed...')
    const speed = await measureConnectionSpeed()

    const model = MODELS[modelId]
    const estimatedSec = estimateDownloadTime(model.sizeBytes, speed)
    setEstimatedTimeSec(estimatedSec)

    console.log(`Connection speed: ${(speed / 1024 / 1024).toFixed(2)} MB/s`)
    console.log(`Estimated download time: ${formatDuration(estimatedSec)}`)

    // Update phase to initializing
    setLoadingPhase('initializing')

    // Call the REAL LLM engine to load the actual Gemma model
    console.log(`Starting to load model: ${modelId}`)
    console.log(`Model URL: ${model.url}`)
    console.log('This will download the model - check Network tab in DevTools')

    const success = await llmEngine.initialize(modelId)

    if (!success) {
      console.error('Model loading failed')
    }

    // Clear loading state
    setLoadingModelId(null)
    setEstimatedTimeSec(null)
    setLoadStartTime(null)
    setLoadingPhase('measuring')
    setSimulatedProgress(0)
  }

  async function handleSend() {
    console.log('=== handleSend called ===')
    console.log('input:', input)
    console.log('chat.isGenerating:', chat.isGenerating)
    console.log('llm.isReady:', llm.isReady)
    console.log('llm.isLoading:', llm.isLoading)
    console.log('llmEngine.isReady():', llmEngine.isReady())

    if (!input.trim() || chat.isGenerating) {
      console.log('Early return - input empty or generating')
      return
    }

    const userMessage = input.trim()
    const imagesToSend = [...attachedImages]
    const audioToSend = audioBlob
    const prosodicToSend = prosodicFeatures // Capture prosodic features for multimodal fusion
    setInput('')
    setAttachedImages([])
    setAudioBlob(null)
    setProsodicFeatures(null)
    setProsodicSummary(null)

    // Create display content (text + indication of attachments)
    let displayContent = userMessage
    const attachments: string[] = []
    if (imagesToSend.length > 0) {
      attachments.push(`${imagesToSend.length} image${imagesToSend.length > 1 ? 's' : ''}`)
    }
    if (audioToSend) {
      attachments.push('voice message')
    }
    if (attachments.length > 0) {
      displayContent = `${userMessage}\n\n[${attachments.join(' + ')} attached]`
    }

    // Build conversation history BEFORE adding the new message (to avoid duplication)
    const conversationHistory = chat.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    // Add user message to state
    const userMsg = {
      role: 'user' as const,
      content: displayContent,
      timestamp: new Date(),
      sessionId: chat.currentSessionId,
    }
    addMessage(userMsg)

    // Save to DB (text content only for now)
    console.log('Saving message to DB...')
    const messageId = await saveMessage(
      'user',
      userMessage,
      chat.currentSessionId
    )
    console.log('Message saved with ID:', messageId)

    // Analyze user message with hybrid three-signal analysis pipeline
    // IMPORTANT: Fire-and-forget - don't await to prevent blocking response generation
    // The analysis runs in the background while the LLM generates a response
    //
    // Hybrid analysis combines three signals:
    // 1. LIWC (fast word matching) - immediate baseline
    // 2. Embeddings (semantic similarity) - real-time comparison to trait prototypes
    // 3. LLM (deep analysis) - batch processed every N messages for highest accuracy
    console.log('Starting background hybrid analysis...')
    Promise.all([
      // Legacy analyzers (for backwards compatibility)
      analyzeAndStore(messageId, userMessage),
      analyzeAndStoreEnhanced(messageId, userMessage, undefined, chat.currentSessionId),

      // New hybrid analysis pipeline
      (async () => {
        try {
          // Get LIWC scores for hybrid aggregation
          const liwcScores = computeLIWCDomainScores(userMessage)

          // Run hybrid analysis (LIWC + Embeddings + LLM if triggered)
          const hybridResult = await analyzeHybrid(
            messageId,
            userMessage,
            liwcScores,
            chat.currentSessionId
          )

          console.log('Hybrid analysis result:', {
            messageId,
            weightsUsed: hybridResult.weightsUsed,
            signalsAvailable: {
              liwc: hybridResult.signals.liwc !== null,
              embedding: hybridResult.signals.embedding !== null,
              llm: hybridResult.signals.llm !== null,
            },
            topScores: Object.entries(hybridResult.scores)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([domain, score]) => `${domain}: ${score.toFixed(2)}`)
          })

          // Process message with context-dependent profiling
          // Converts hybrid scores to domain score array format expected by context profiler
          const contextDomainScores = Object.entries(hybridResult.scores).map(([domain, score]) => ({
            domainId: domain as PsychologicalDomain,
            score,
            dataPoints: 1, // Each message is one data point
          }))

          const contextResult = await processMessageWithContext(
            String(messageId),
            chat.currentSessionId,
            userMessage,
            contextDomainScores
          )

          console.log('Context profiling result:', {
            context: contextResult.primaryContext,
            confidence: contextResult.confidence.toFixed(2),
            keywords: contextResult.detectedKeywords.slice(0, 3),
          })

          // Multimodal fusion: combine text + audio signals if prosodic features are available
          let fusedScores = hybridResult.scores
          if (prosodicToSend) {
            try {
              // Map prosodic features to psychological domains
              const audioDomainScores = mapFeaturesToDomains(prosodicToSend)

              // Create AudioAnalysisResult for quickFuse
              const totalDurationMs = prosodicToSend.speakingDuration + prosodicToSend.silenceDuration
              const audioResult: AudioAnalysisResult = {
                features: prosodicToSend,
                confidence: 0.7, // Default audio confidence
                domainScores: audioDomainScores,
                timestamp: Date.now(),
                durationMs: totalDurationMs,
              }

              // Quick fuse text and audio signals with context
              // Signature: quickFuse(hybridScores, hybridConfidence, audioResult?, context?)
              const fusionResult = quickFuse(
                hybridResult.scores,
                0.7, // Hybrid confidence (default)
                audioResult,
                contextResult.primaryContext
              )

              // Merge fused scores with hybrid scores (fused takes precedence)
              fusedScores = { ...hybridResult.scores, ...fusionResult.scores }

              console.log('Multimodal fusion result:', {
                textDomains: Object.keys(hybridResult.scores).length,
                audioDomains: Object.keys(audioDomainScores).length,
                fusedDomains: Object.keys(fusedScores).length,
                summary: getFusionSummary(fusionResult),
                agreement: fusionResult.agreement.overall.toFixed(2),
                insights: fusionResult.insights.length,
              })
            } catch (fusionError) {
              console.warn('Multimodal fusion failed, using text-only scores:', fusionError)
            }
          }

          // Build advanced graph relationships (temporal, cross-domain, context-trait)
          await buildAdvancedRelationships(
            chat.currentSessionId, // userId
            fusedScores, // Use fused scores if available, otherwise hybrid scores
            contextResult.primaryContext // detected context
          )

          console.log('Advanced graph relationships built for message:', messageId)

          return { ...hybridResult, scores: fusedScores }
        } catch (error) {
          console.warn('Hybrid analysis failed:', error)
          return null
        }
      })()
    ])
      .then(() => console.log('Background analysis complete'))
      .catch((analysisError) => console.warn('Background analysis failed (non-blocking):', analysisError))

    // Generate response
    setStreamingContent('')
    console.log('About to generate response, llm.isReady:', llm.isReady)

    try {
      let response = ''

      // Check both Zustand state AND engine state (in case of sync issues)
      const modelReady = llm.isReady || llmEngine.isReady()
      console.log('Model ready check - llm.isReady:', llm.isReady, 'llmEngine.isReady():', llmEngine.isReady(), 'combined:', modelReady)

      if (modelReady) {
        console.log('Model is ready - calling generate')
        // conversationHistory was already built above before adding the new message

        // Check if we have multimodal content
        const hasMultimodal = (imagesToSend.length > 0 || audioToSend) && llmEngine.isMultimodalEnabled()

        if (hasMultimodal) {
          // Build multimodal prompt
          const multimodalContent: MultimodalPrompt = [userMessage]

          // Add images to the prompt
          for (const imageDataUrl of imagesToSend) {
            multimodalContent.push({ imageSource: imageDataUrl } as ImageInput)
          }

          // Add audio to the prompt if present
          if (audioToSend) {
            // Convert blob to data URL for audio
            const audioDataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.readAsDataURL(audioToSend)
            })
            multimodalContent.push({ audioSource: audioDataUrl } as AudioInput)
          }

          // Use multimodal generation
          response = await llmEngine.generateMultimodal(multimodalContent, (token) => {
            setStreamingContent((prev) => prev + token)
          }, conversationHistory)
        } else {
          // Use text-only generation
          console.log('Calling llmEngine.generate() with message:', userMessage)
          response = await llmEngine.generate(userMessage, (token) => {
            setStreamingContent((prev) => prev + token)
          }, conversationHistory)
          console.log('generate() returned:', response)
        }
      } else {
        console.log('Model NOT ready - showing no model message')
        // No model loaded - prompt user to load one
        response = "⚠️ No AI model is loaded yet. Please click the **\"Load AI Model\"** button in the top right corner to download and activate the AI. Once loaded, I'll be able to have a real conversation with you!\n\nYour message has been saved and analyzed for your profile, but I need a model to generate meaningful responses."

        // Show the message immediately (no streaming for system messages)
        setStreamingContent(response)
        await new Promise((r) => setTimeout(r, 100))
      }

      // Add assistant message to state
      const assistantMsg = {
        role: 'assistant' as const,
        content: response,
        timestamp: new Date(),
        sessionId: chat.currentSessionId,
      }
      addMessage(assistantMsg)
      setStreamingContent('')

      // Save assistant message
      await saveMessage('assistant', response, chat.currentSessionId)

      // Update profile stats and personality
      await updateProfileStats()
      await updatePersonalityProfile()
    } catch (error) {
      console.error('Generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      // Show error to user
      const errorMsg = {
        role: 'assistant' as const,
        content: `⚠️ **Error generating response:** ${errorMessage}\n\nPlease try again or reload the model.`,
        timestamp: new Date(),
        sessionId: chat.currentSessionId,
      }
      addMessage(errorMsg)
      setStreamingContent('')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
              <p className="text-sm text-gray-500">
                Have a conversation - I learn from every interaction
              </p>
            </div>

            {/* Real-time Emotion Indicator (Phase 6) */}
            {isProsodicAnalysisEnabled && currentEmotion && (
              <div className="relative">
                <button
                  onClick={() => setShowEmotionPanel(!showEmotionPanel)}
                  className="focus:outline-none"
                  title="Toggle emotion details"
                >
                  <EmotionIndicator
                    emotionalState={currentEmotion}
                    trend={emotionTrend}
                    compact={true}
                    animated={true}
                  />
                </button>

                {/* Expanded emotion panel */}
                {showEmotionPanel && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-80">
                    <EmotionIndicator
                      emotionalState={currentEmotion}
                      trend={emotionTrend}
                      compact={false}
                      showCircumplex={true}
                      showConfidence={true}
                      animated={true}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          {llm.isReady ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              {llm.modelName}
            </div>
          ) : llm.isLoading ? (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading {llm.progress}%</span>
                {loadingModelId && (
                  <span className="text-xs text-primary-500">
                    ({MODELS[loadingModelId].size})
                  </span>
                )}
              </div>
              {(elapsedTime || dynamicEstimate) && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {elapsedTime && <span>{elapsedTime} elapsed</span>}
                  {dynamicEstimate && (
                    <>
                      <span className="mx-1">·</span>
                      <span>~{dynamicEstimate} left</span>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
              >
                <Download className="w-4 h-4" />
                Load AI Model
                <ChevronDown className="w-4 h-4" />
              </button>

              {showModelSelector && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Select a Model</p>
                    <p className="text-xs text-gray-500">Larger models are more capable but take longer to download</p>
                  </div>
                  <div className="p-2">
                    {Object.entries(MODELS).map(([id, model]) => {
                      // Estimate time based on typical connection speeds
                      const slowEstimate = formatDuration(model.sizeBytes / (1024 * 1024)) // ~1 MB/s (slow)
                      const fastEstimate = formatDuration(model.sizeBytes / (10 * 1024 * 1024)) // ~10 MB/s (fast)
                      return (
                        <button
                          key={id}
                          onClick={() => handleLoadModel(id as ModelId)}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 text-sm">{model.name}</span>
                            {model.recommended && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Size: {model.size} · Est. {fastEstimate} - {slowEstimate}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {llm.error && (
          <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {llm.error}
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Loading state with tips */}
        {llm.isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Preparing Your AI Companion
            </h2>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              {loadingModelId && MODELS[loadingModelId] && (
                <>Loading {MODELS[loadingModelId].name}</>
              )}
            </p>

            {/* Loading phase message */}
            <p className="text-sm text-primary-600 mb-3 font-medium">
              {LOADING_PHASE_MESSAGES[loadingPhase]}
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-md mb-6">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all",
                    simulatedProgress > 10 && simulatedProgress < 95 ? "duration-500" : "duration-300"
                  )}
                  style={{ width: `${Math.round(simulatedProgress)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{Math.round(simulatedProgress)}% complete{elapsedTime && ` · ${elapsedTime}`}</span>
                {dynamicEstimate ? (
                  <span>~{dynamicEstimate} remaining</span>
                ) : simulatedProgress < 10 ? (
                  <span>Calculating...</span>
                ) : null}
              </div>
            </div>

            {/* Rotating tips */}
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-6 max-w-md w-full border border-primary-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-h-[60px]">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {LOADING_TIPS[currentTipIndex].title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {LOADING_TIPS[currentTipIndex].text}
                  </p>
                </div>
              </div>

              {/* Tip indicators */}
              <div className="flex justify-center gap-1 mt-4">
                {LOADING_TIPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={clsx(
                      'w-2 h-2 rounded-full transition-colors',
                      idx === currentTipIndex ? 'bg-primary-500' : 'bg-gray-300'
                    )}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">
              This may take a few minutes on first load. The model will be cached for faster loading next time.
            </p>
          </div>
        )}

        {/* Empty state when not loading */}
        {!llm.isLoading && chat.messages.length === 0 && !streamingContent && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Start a Conversation
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              I'm your privacy-first AI companion. Everything we discuss stays
              on your device. Tell me about yourself, your interests, or
              anything on your mind.
            </p>
          </div>
        )}

        {chat.messages.map((message, index) => (
          <div
            key={index}
            className={clsx(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-primary-600" />
              </div>
            )}
            <div
              className={clsx(
                'max-w-[70%] rounded-2xl px-4 py-3',
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              )}
            >
              <FormattedMessage
                content={message.content}
                isUserMessage={message.role === 'user'}
              />
              <p
                className={clsx(
                  'text-xs mt-1',
                  message.role === 'user'
                    ? 'text-primary-200'
                    : 'text-gray-400'
                )}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming response */}
        {streamingContent && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-primary-600" />
            </div>
            <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-white border border-gray-200 text-gray-900">
              <FormattedMessage content={streamingContent} isUserMessage={false} />
              <span className="inline-block w-2 h-4 bg-primary-600 animate-pulse ml-1" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        {/* Image preview area */}
        {attachedImages.length > 0 && (
          <div className="max-w-4xl mx-auto mb-3">
            <div className="flex gap-2 flex-wrap">
              {attachedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Attached ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {attachedImages.length}/5 images attached
            </p>
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="max-w-4xl mx-auto mb-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 font-medium">Recording...</span>
              <span className="text-red-500 text-sm">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        {/* Audio preview */}
        {audioBlob && !isRecording && (
          <div className="max-w-4xl mx-auto mb-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <Mic className="w-5 h-5 text-primary-600" />
              <span className="text-gray-700 text-sm">Audio recording attached</span>
              <span className="text-gray-500 text-xs">
                ({Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')})
              </span>
              <button
                onClick={clearAudio}
                className="ml-auto p-1 text-gray-500 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={chat.isGenerating || attachedImages.length >= 5}
            className={clsx(
              "p-3 rounded-xl transition-colors",
              llmEngine.isMultimodalEnabled()
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                : "bg-gray-50 text-gray-400 cursor-not-allowed"
            )}
            title={
              llmEngine.isMultimodalEnabled()
                ? "Attach images"
                : "Load Gemma 3n model to enable image input"
            }
          >
            <Image className="w-5 h-5" />
          </button>

          {/* Microphone button */}
          <button
            onClick={toggleRecording}
            disabled={chat.isGenerating}
            className={clsx(
              "p-3 rounded-xl transition-colors",
              isRecording
                ? "bg-red-100 text-red-600 hover:bg-red-200"
                : llmEngine.isMultimodalEnabled()
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
            )}
            title={
              llmEngine.isMultimodalEnabled()
                ? isRecording ? "Stop recording" : "Start voice input"
                : "Load Gemma 3n model to enable voice input"
            }
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              className="p-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1"
              title="Change response language"
            >
              <Globe className="w-5 h-5" />
              <span className="text-xs font-medium uppercase">{settings.language}</span>
            </button>

            {showLanguageSelector && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-64 overflow-y-auto">
                <div className="p-2">
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLanguage(code as LanguageCode)
                        setShowLanguageSelector(false)
                      }}
                      className={clsx(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                        settings.language === code
                          ? "bg-primary-100 text-primary-700 font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachedImages.length > 0 ? "Describe your image(s)..." : "Type a message..."}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            style={{
              minHeight: '48px',
              maxHeight: '200px',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chat.isGenerating}
            className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {chat.isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          All messages are processed and stored locally on your device
          {llmEngine.isMultimodalEnabled() && " • Images supported"}
        </p>
      </div>
    </div>
  )
}
