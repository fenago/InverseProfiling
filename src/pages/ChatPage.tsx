/**
 * ChatPage.tsx - Apple-style Chat Interface
 *
 * Features glass morphism design, smooth animations,
 * and modern microinteractions.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User, AlertCircle, Download, ChevronDown, Sparkles, Clock, Image, Mic, MicOff, X, Globe } from 'lucide-react'
import { cn } from '../lib/theme'
import { useStore, SUPPORTED_LANGUAGES, type LanguageCode } from '../lib/store'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
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

      if (llm.progress >= 100) {
        setSimulatedProgress(100)
        setLoadingPhase('finalizing')
        setDynamicEstimate(null)
        return
      }

      if (llm.progress < 5) {
        setLoadingPhase('initializing')
      } else if (llm.progress < 100) {
        setLoadingPhase('downloading')
      }

      if (estimatedTimeSec && llm.progress >= 10 && llm.progress < 100) {
        const downloadProgress = Math.min(elapsedSec / estimatedTimeSec, 1)
        const easedProgress = 1 - Math.pow(1 - downloadProgress, 2)
        const newSimulated = Math.min(10 + (easedProgress * 85), 95)
        setSimulatedProgress(newSimulated)

        const remainingPercent = 100 - newSimulated
        if (newSimulated > 10) {
          const progressMade = newSimulated - 10
          const timePerPercent = elapsedSec / progressMade
          const remainingSec = remainingPercent * timePerPercent
          setDynamicEstimate(formatDuration(Math.max(remainingSec, 5)))
        }
      } else {
        setSimulatedProgress(llm.progress)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [llm.isLoading, loadStartTime, llm.progress, estimatedTimeSec])

  // Image upload handler
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    if (!llmEngine.isMultimodalEnabled()) {
      alert('Current model does not support image input. Please load Gemma 3n E4B or E2B.')
      return
    }

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

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingTime(0)

      if (isProsodicAnalysisEnabled) {
        console.log('Starting prosodic recording alongside audio...')
        startProsodicRecording().catch((err) => {
          console.warn('Prosodic recording failed to start:', err)
        })
      }

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

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }

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

              const blendedEmotion = currentEmotion
                ? blendEmotions(detectedEmotion, currentEmotion, 0.3)
                : detectedEmotion

              setCurrentEmotion(blendedEmotion)

              setEmotionHistory(prev => {
                const newHistory = [blendedEmotion, ...prev].slice(0, 20)

                if (newHistory.length >= 3) {
                  const trend = calculateEmotionTrend(newHistory.slice(0, 10))
                  setEmotionTrend(trend)
                }

                return newHistory
              })

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

    console.log('Measuring connection speed...')
    const speed = await measureConnectionSpeed()

    const model = MODELS[modelId]
    const estimatedSec = estimateDownloadTime(model.sizeBytes, speed)
    setEstimatedTimeSec(estimatedSec)

    console.log(`Connection speed: ${(speed / 1024 / 1024).toFixed(2)} MB/s`)
    console.log(`Estimated download time: ${formatDuration(estimatedSec)}`)

    setLoadingPhase('initializing')

    console.log(`Starting to load model: ${modelId}`)
    console.log(`Model URL: ${model.url}`)
    console.log('This will download the model - check Network tab in DevTools')

    const success = await llmEngine.initialize(modelId)

    if (!success) {
      console.error('Model loading failed')
    }

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
    const prosodicToSend = prosodicFeatures
    setInput('')
    setAttachedImages([])
    setAudioBlob(null)
    setProsodicFeatures(null)
    setProsodicSummary(null)

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

    const conversationHistory = chat.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    const userMsg = {
      role: 'user' as const,
      content: displayContent,
      timestamp: new Date(),
      sessionId: chat.currentSessionId,
    }
    addMessage(userMsg)

    console.log('Saving message to DB...')
    const messageId = await saveMessage(
      'user',
      userMessage,
      chat.currentSessionId
    )
    console.log('Message saved with ID:', messageId)

    console.log('Starting background hybrid analysis...')
    Promise.all([
      analyzeAndStore(messageId, userMessage),
      analyzeAndStoreEnhanced(messageId, userMessage, undefined, chat.currentSessionId),

      (async () => {
        try {
          const liwcScores = computeLIWCDomainScores(userMessage)

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

          const contextDomainScores = Object.entries(hybridResult.scores).map(([domain, score]) => ({
            domainId: domain as PsychologicalDomain,
            score,
            dataPoints: 1,
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

          let fusedScores = hybridResult.scores
          if (prosodicToSend) {
            try {
              const audioDomainScores = mapFeaturesToDomains(prosodicToSend)

              const totalDurationMs = prosodicToSend.speakingDuration + prosodicToSend.silenceDuration
              const audioResult: AudioAnalysisResult = {
                features: prosodicToSend,
                confidence: 0.7,
                domainScores: audioDomainScores,
                timestamp: Date.now(),
                durationMs: totalDurationMs,
              }

              const fusionResult = quickFuse(
                hybridResult.scores,
                0.7,
                audioResult,
                contextResult.primaryContext
              )

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

          await buildAdvancedRelationships(
            chat.currentSessionId,
            fusedScores,
            contextResult.primaryContext
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

    setStreamingContent('')
    console.log('About to generate response, llm.isReady:', llm.isReady)

    try {
      let response = ''

      const modelReady = llm.isReady || llmEngine.isReady()
      console.log('Model ready check - llm.isReady:', llm.isReady, 'llmEngine.isReady():', llmEngine.isReady(), 'combined:', modelReady)

      if (modelReady) {
        console.log('Model is ready - calling generate')

        const hasMultimodal = (imagesToSend.length > 0 || audioToSend) && llmEngine.isMultimodalEnabled()

        if (hasMultimodal) {
          const multimodalContent: MultimodalPrompt = [userMessage]

          for (const imageDataUrl of imagesToSend) {
            multimodalContent.push({ imageSource: imageDataUrl } as ImageInput)
          }

          if (audioToSend) {
            const audioDataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.readAsDataURL(audioToSend)
            })
            multimodalContent.push({ audioSource: audioDataUrl } as AudioInput)
          }

          response = await llmEngine.generateMultimodal(multimodalContent, (token) => {
            setStreamingContent((prev) => prev + token)
          }, conversationHistory)
        } else {
          console.log('Calling llmEngine.generate() with message:', userMessage)
          response = await llmEngine.generate(userMessage, (token) => {
            setStreamingContent((prev) => prev + token)
          }, conversationHistory)
          console.log('generate() returned:', response)
        }
      } else {
        console.log('Model NOT ready - showing no model message')
        response = "No AI model is loaded yet. Please click the **\"Load AI Model\"** button in the top right corner to download and activate the AI. Once loaded, I'll be able to have a real conversation with you!\n\nYour message has been saved and analyzed for your profile, but I need a model to generate meaningful responses."

        setStreamingContent(response)
        await new Promise((r) => setTimeout(r, 100))
      }

      const assistantMsg = {
        role: 'assistant' as const,
        content: response,
        timestamp: new Date(),
        sessionId: chat.currentSessionId,
      }
      addMessage(assistantMsg)
      setStreamingContent('')

      await saveMessage('assistant', response, chat.currentSessionId)

      await updateProfileStats()
      await updatePersonalityProfile()
    } catch (error) {
      console.error('Generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      const errorMsg = {
        role: 'assistant' as const,
        content: `**Error generating response:** ${errorMessage}\n\nPlease try again or reload the model.`,
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
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 px-6 py-4"
      >
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">Chat</h1>
              <p className="text-[13px] text-gray-500 dark:text-gray-400">
                I learn from every conversation
              </p>
            </div>

            {/* Real-time Emotion Indicator (Phase 6) */}
            {isProsodicAnalysisEnabled && currentEmotion && (
              <div className="relative">
                <motion.button
                  onClick={() => setShowEmotionPanel(!showEmotionPanel)}
                  className="focus:outline-none"
                  title="Toggle emotion details"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <EmotionIndicator
                    emotionalState={currentEmotion}
                    trend={emotionTrend}
                    compact={true}
                    animated={true}
                  />
                </motion.button>

                <AnimatePresence>
                  {showEmotionPanel && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute left-0 top-full mt-2 z-50 w-80"
                    >
                      <EmotionIndicator
                        emotionalState={currentEmotion}
                        trend={emotionTrend}
                        compact={false}
                        showCircumplex={true}
                        showConfidence={true}
                        animated={true}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Model Status */}
          {llm.isReady ? (
            <Badge variant="success" dot pulse>
              {llm.modelName}
            </Badge>
          ) : llm.isLoading ? (
            <div className="flex flex-col items-end gap-1">
              <Badge variant="primary" className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading {Math.round(simulatedProgress)}%
                {loadingModelId && (
                  <span className="text-xs opacity-70">
                    ({MODELS[loadingModelId].size})
                  </span>
                )}
              </Badge>
              {(elapsedTime || dynamicEstimate) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
              <Button
                onClick={() => setShowModelSelector(!showModelSelector)}
                leftIcon={<Download className="w-4 h-4" />}
                rightIcon={<ChevronDown className="w-4 h-4" />}
              >
                Load AI Model
              </Button>

              <AnimatePresence>
                {showModelSelector && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-80 z-50"
                  >
                    <Card variant="elevated" className="overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <p className="text-sm font-medium text-foreground">Select a Model</p>
                        <p className="text-xs text-muted-foreground">Larger models are more capable but take longer to download</p>
                      </div>
                      <div className="p-2">
                        {Object.entries(MODELS).map(([id, model]) => {
                          const slowEstimate = formatDuration(model.sizeBytes / (1024 * 1024))
                          const fastEstimate = formatDuration(model.sizeBytes / (10 * 1024 * 1024))
                          return (
                            <motion.button
                              key={id}
                              onClick={() => handleLoadModel(id as ModelId)}
                              className="w-full text-left px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors"
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground text-sm">{model.name}</span>
                                {model.recommended && (
                                  <Badge variant="success" size="sm">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Size: {model.size} · Est. {fastEstimate} - {slowEstimate}
                              </p>
                            </motion.button>
                          )
                        })}
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        {llm.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-2 text-destructive text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            {llm.error}
          </motion.div>
        )}
      </motion.header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {/* Loading state with tips */}
        {llm.isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <motion.div
              className="relative mb-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-8 h-8 text-white" strokeWidth={1.75} />
              </div>
              <motion.div
                className="absolute -inset-1 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                style={{ borderTopColor: '#818cf8' }}
              />
            </motion.div>

            <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white tracking-tight mb-1">
              Preparing Your AI Companion
            </h2>
            <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6 text-center">
              {loadingModelId && MODELS[loadingModelId] && (
                <>Loading {MODELS[loadingModelId].name}</>
              )}
            </p>

            <p className="text-[13px] text-indigo-600 dark:text-indigo-400 font-medium mb-4">
              {LOADING_PHASE_MESSAGES[loadingPhase]}
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-sm mb-8">
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(simulatedProgress)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-[12px] text-gray-500 dark:text-gray-400 mt-2">
                <span>{Math.round(simulatedProgress)}% complete{elapsedTime && ` · ${elapsedTime}`}</span>
                {dynamicEstimate ? (
                  <span>~{dynamicEstimate} remaining</span>
                ) : simulatedProgress < 10 ? (
                  <span>Calculating...</span>
                ) : null}
              </div>
            </div>

            {/* Rotating tips */}
            <div className="max-w-sm w-full p-5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-start gap-3">
                <motion.div
                  className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
                </motion.div>
                <div className="flex-1 min-h-[50px]">
                  <h3 className="text-[14px] font-medium text-gray-900 dark:text-white mb-0.5">
                    {LOADING_TIPS[currentTipIndex].title}
                  </h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {LOADING_TIPS[currentTipIndex].text}
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-1.5 mt-4">
                {LOADING_TIPS.map((_, idx) => (
                  <motion.div
                    key={idx}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-colors',
                      idx === currentTipIndex ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                    animate={idx === currentTipIndex ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  />
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-5 text-center">
              This may take a few minutes on first load. The model will be cached for faster loading next time.
            </p>
          </motion.div>
        )}

        {/* Empty state when not loading */}
        {!llm.isLoading && chat.messages.length === 0 && !streamingContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center mx-auto mb-5 shadow-sm"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Bot className="w-7 h-7 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
            </motion.div>
            <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
              Start a Conversation
            </h2>
            <p className="text-[14px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
              I'm your privacy-first AI companion. Everything we discuss stays
              on your device. Tell me about yourself, your interests, or
              anything on your mind.
            </p>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {chat.messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex gap-2.5',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed',
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                )}
              >
                <FormattedMessage
                  content={message.content}
                  isUserMessage={message.role === 'user'}
                />
                <p
                  className={cn(
                    'text-[11px] mt-1.5',
                    message.role === 'user'
                      ? 'text-indigo-200'
                      : 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={2} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming response */}
        {streamingContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5 justify-start"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
            </div>
            <div className="max-w-[70%] rounded-2xl px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-[14px] leading-relaxed">
              <FormattedMessage content={streamingContent} isUserMessage={false} />
              <motion.span
                className="inline-block w-1.5 h-4 bg-indigo-500 rounded-sm ml-1"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-4"
      >
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-t border-gray-200/50 dark:border-gray-800/50" />
        <div className="relative">
          {/* Image preview area */}
          {attachedImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto mb-3"
            >
              <div className="flex gap-2 flex-wrap">
                {attachedImages.map((img, index) => (
                  <motion.div
                    key={index}
                    className="relative group"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <img
                      src={img}
                      alt={`Attached ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <motion.button
                      onClick={() => removeImage(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-3 h-3" strokeWidth={2.5} />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                {attachedImages.length}/5 images attached
              </p>
            </motion.div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto mb-3"
            >
              <div className="flex items-center gap-3 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
                <motion.div
                  className="w-2.5 h-2.5 bg-red-500 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-[13px] text-red-600 dark:text-red-400 font-medium">Recording...</span>
                <span className="text-[13px] text-red-500/70 dark:text-red-400/70">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </motion.div>
          )}

          {/* Audio preview */}
          {audioBlob && !isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto mb-3"
            >
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
                <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
                <span className="text-[13px] text-gray-700 dark:text-gray-300">Audio recording attached</span>
                <span className="text-[12px] text-gray-400 dark:text-gray-500">
                  ({Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')})
                </span>
                <motion.button
                  onClick={clearAudio}
                  className="ml-auto p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </motion.button>
              </div>
            </motion.div>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={chat.isGenerating || attachedImages.length >= 5 || !llmEngine.isMultimodalEnabled()}
              className={cn(
                !llmEngine.isMultimodalEnabled() && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Image className="w-5 h-5" />
            </Button>

            {/* Microphone button */}
            <Button
              variant={isRecording ? 'destructive' : 'ghost'}
              size="icon"
              onClick={toggleRecording}
              disabled={chat.isGenerating || !llmEngine.isMultimodalEnabled()}
              className={cn(
                !llmEngine.isMultimodalEnabled() && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isRecording ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>

            {/* Language selector */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                className="flex items-center gap-1"
              >
                <Globe className="w-5 h-5" />
                <span className="text-xs font-medium uppercase">{settings.language}</span>
              </Button>

              <AnimatePresence>
                {showLanguageSelector && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute bottom-full left-0 mb-2 w-48 z-50"
                  >
                    <Card variant="elevated" className="max-h-64 overflow-y-auto">
                      <div className="p-2">
                        {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                          <motion.button
                            key={code}
                            onClick={() => {
                              setLanguage(code as LanguageCode)
                              setShowLanguageSelector(false)
                            }}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                              settings.language === code
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'hover:bg-muted text-foreground'
                            )}
                            whileHover={{ x: 4 }}
                          >
                            {name}
                          </motion.button>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachedImages.length > 0 ? 'Describe your image(s)...' : 'Type a message...'}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-[14px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
              style={{
                minHeight: '48px',
                maxHeight: '200px',
              }}
            />

            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || chat.isGenerating}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                input.trim() && !chat.isGenerating
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
              )}
              whileHover={input.trim() && !chat.isGenerating ? { scale: 1.05 } : {}}
              whileTap={input.trim() && !chat.isGenerating ? { scale: 0.95 } : {}}
            >
              {chat.isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" strokeWidth={2} />
              )}
            </motion.button>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-2.5">
            All messages are processed and stored locally on your device
            {llmEngine.isMultimodalEnabled() && ' · Images supported'}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
