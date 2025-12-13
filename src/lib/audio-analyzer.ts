/**
 * Audio Analyzer for Prosodic Feature Extraction
 *
 * Extracts prosodic features from audio for personality inference:
 * - Pitch (F0) and pitch variability
 * - Speech rate and tempo
 * - Energy/loudness patterns
 * - Pause patterns and hesitation markers
 * - Voice quality metrics
 *
 * Maps these features to psychological domains for multimodal profiling.
 */

import type { PsychologicalDomain } from './analysis-config'
import { PSYCHOLOGICAL_DOMAINS } from './analysis-config'

// Prosodic features extracted from audio
export interface ProsodicFeatures {
  // Pitch features (in Hz)
  pitchMean: number           // Average fundamental frequency
  pitchStd: number            // Pitch variability (standard deviation)
  pitchRange: number          // Difference between max and min pitch
  pitchContour: 'rising' | 'falling' | 'flat' | 'variable'

  // Tempo/Rate features
  speechRate: number          // Syllables per second (estimated)
  articulationRate: number    // Speech rate excluding pauses
  pauseRatio: number          // Ratio of silence to speech (0-1)
  averagePauseLength: number  // Average pause duration in ms

  // Energy features
  energyMean: number          // Average RMS energy (0-1)
  energyStd: number           // Energy variability
  energyRange: number         // Dynamic range
  loudnessContour: 'crescendo' | 'decrescendo' | 'steady' | 'dynamic'

  // Voice quality
  harmonicToNoiseRatio: number // Voice clarity (higher = clearer)
  jitter: number              // Pitch perturbation (voice tremor)
  shimmer: number             // Amplitude perturbation

  // Temporal patterns
  speakingDuration: number    // Total speaking time in ms
  silenceDuration: number     // Total silence time in ms
  turnTakingSpeed: number     // Response latency (0-1 normalized)
}

// Audio analysis result with domain mappings
export interface AudioAnalysisResult {
  features: ProsodicFeatures
  confidence: number          // Overall analysis confidence (0-1)
  domainScores: Partial<Record<PsychologicalDomain, number>>
  timestamp: number
  durationMs: number
}

// Audio analyzer state
export interface AudioAnalyzerState {
  isRecording: boolean
  isSupported: boolean
  hasPermission: boolean
  error: string | null
}

// Feature to domain mapping weights based on research
// References: Scherer (2003), Banse & Scherer (1996), Juslin & Laukka (2003)
const FEATURE_DOMAIN_WEIGHTS: Record<keyof ProsodicFeatures, Partial<Record<PsychologicalDomain, { weight: number; positive: boolean }>>> = {
  pitchMean: {
    big_five_extraversion: { weight: 0.3, positive: true },
    emotional_intelligence: { weight: 0.2, positive: true },
    big_five_neuroticism: { weight: 0.2, positive: true },
  },
  pitchStd: {
    big_five_extraversion: { weight: 0.4, positive: true },
    emotional_empathy: { weight: 0.3, positive: true },
    big_five_neuroticism: { weight: 0.3, positive: true },
    creativity: { weight: 0.2, positive: true },
  },
  pitchRange: {
    big_five_extraversion: { weight: 0.35, positive: true },
    emotional_intelligence: { weight: 0.25, positive: true },
    communication_style: { weight: 0.2, positive: true },
  },
  pitchContour: {
    // Handled specially in mapping function
  },
  speechRate: {
    big_five_extraversion: { weight: 0.5, positive: true },
    big_five_conscientiousness: { weight: 0.2, positive: false },
    decision_style: { weight: 0.3, positive: true }, // Fast = intuitive
    time_orientation: { weight: 0.2, positive: true },
  },
  articulationRate: {
    big_five_extraversion: { weight: 0.4, positive: true },
    cognitive_abilities: { weight: 0.2, positive: true },
    executive_functions: { weight: 0.2, positive: true },
  },
  pauseRatio: {
    big_five_conscientiousness: { weight: 0.4, positive: true },
    metacognition: { weight: 0.3, positive: true },
    decision_style: { weight: 0.3, positive: false }, // More pauses = more deliberate
    big_five_extraversion: { weight: 0.3, positive: false },
  },
  averagePauseLength: {
    big_five_conscientiousness: { weight: 0.3, positive: true },
    metacognition: { weight: 0.25, positive: true },
    information_processing: { weight: 0.2, positive: true }, // Deep processing
    big_five_neuroticism: { weight: 0.2, positive: true }, // Hesitation
  },
  energyMean: {
    big_five_extraversion: { weight: 0.5, positive: true },
    achievement_motivation: { weight: 0.3, positive: true },
    self_efficacy: { weight: 0.25, positive: true },
    dark_triad_narcissism: { weight: 0.2, positive: true },
  },
  energyStd: {
    emotional_empathy: { weight: 0.3, positive: true },
    emotional_intelligence: { weight: 0.3, positive: true },
    big_five_neuroticism: { weight: 0.25, positive: true },
    creativity: { weight: 0.2, positive: true },
  },
  energyRange: {
    big_five_extraversion: { weight: 0.35, positive: true },
    emotional_intelligence: { weight: 0.25, positive: true },
    communication_style: { weight: 0.2, positive: true },
  },
  loudnessContour: {
    // Handled specially in mapping function
  },
  harmonicToNoiseRatio: {
    emotional_intelligence: { weight: 0.3, positive: true },
    stress_coping: { weight: 0.3, positive: true }, // Clearer voice = less stress
    authenticity: { weight: 0.25, positive: true },
    life_satisfaction: { weight: 0.2, positive: true },
  },
  jitter: {
    big_five_neuroticism: { weight: 0.4, positive: true }, // More jitter = more anxiety
    stress_coping: { weight: 0.3, positive: false },
    emotional_intelligence: { weight: 0.2, positive: false },
  },
  shimmer: {
    big_five_neuroticism: { weight: 0.35, positive: true },
    stress_coping: { weight: 0.25, positive: false },
    authenticity: { weight: 0.2, positive: false },
  },
  speakingDuration: {
    big_five_extraversion: { weight: 0.4, positive: true },
    dark_triad_narcissism: { weight: 0.2, positive: true },
    social_cognition: { weight: 0.2, positive: true },
  },
  silenceDuration: {
    big_five_conscientiousness: { weight: 0.3, positive: true },
    metacognition: { weight: 0.25, positive: true },
    big_five_agreeableness: { weight: 0.2, positive: true }, // Listening
  },
  turnTakingSpeed: {
    big_five_extraversion: { weight: 0.4, positive: true },
    decision_style: { weight: 0.3, positive: true },
    big_five_agreeableness: { weight: 0.2, positive: false }, // Fast response = less agreeable
  },
}

// Audio processor class for real-time analysis
class AudioProcessor {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private mediaStream: MediaStream | null = null
  private pitchBuffer: number[] = []
  private energyBuffer: number[] = []
  private isRecording = false
  private startTime = 0
  private silentFrames = 0
  private totalFrames = 0
  private pauseStartTime: number | null = null
  private pauseLengths: number[] = []

  // Constants for analysis
  private readonly SAMPLE_RATE = 44100
  private readonly FFT_SIZE = 2048
  private readonly MIN_PITCH = 75   // Hz - lowest expected human pitch
  private readonly MAX_PITCH = 500  // Hz - highest expected human pitch
  private readonly SILENCE_THRESHOLD = 0.01
  private readonly MIN_PAUSE_DURATION = 200 // ms

  async initialize(): Promise<boolean> {
    try {
      this.audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE })
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = this.FFT_SIZE
      this.analyser.smoothingTimeConstant = 0.3

      return true
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
      return false
    }
  }

  async startRecording(): Promise<boolean> {
    try {
      if (!this.audioContext || !this.analyser) {
        await this.initialize()
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.SAMPLE_RATE,
        }
      })

      const source = this.audioContext!.createMediaStreamSource(this.mediaStream)
      source.connect(this.analyser!)

      this.pitchBuffer = []
      this.energyBuffer = []
      this.pauseLengths = []
      this.silentFrames = 0
      this.totalFrames = 0
      this.pauseStartTime = null
      this.startTime = Date.now()
      this.isRecording = true

      // Start continuous analysis
      this.analyzeFrame()

      return true
    } catch (error) {
      console.error('Failed to start recording:', error)
      return false
    }
  }

  private analyzeFrame(): void {
    if (!this.isRecording || !this.analyser) return

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Float32Array(bufferLength)
    const timeData = new Float32Array(this.analyser.fftSize)

    this.analyser.getFloatFrequencyData(dataArray)
    this.analyser.getFloatTimeDomainData(timeData)

    // Calculate RMS energy
    let sumSquares = 0
    for (let i = 0; i < timeData.length; i++) {
      sumSquares += timeData[i] * timeData[i]
    }
    const rms = Math.sqrt(sumSquares / timeData.length)
    this.energyBuffer.push(rms)
    this.totalFrames++

    // Detect silence/pause
    if (rms < this.SILENCE_THRESHOLD) {
      this.silentFrames++
      if (this.pauseStartTime === null) {
        this.pauseStartTime = Date.now()
      }
    } else {
      // End of pause
      if (this.pauseStartTime !== null) {
        const pauseDuration = Date.now() - this.pauseStartTime
        if (pauseDuration >= this.MIN_PAUSE_DURATION) {
          this.pauseLengths.push(pauseDuration)
        }
        this.pauseStartTime = null
      }

      // Estimate pitch using autocorrelation
      const pitch = this.estimatePitch(timeData)
      if (pitch >= this.MIN_PITCH && pitch <= this.MAX_PITCH) {
        this.pitchBuffer.push(pitch)
      }
    }

    // Continue analysis at ~30fps
    requestAnimationFrame(() => this.analyzeFrame())
  }

  private estimatePitch(timeData: Float32Array): number {
    // Autocorrelation-based pitch detection
    const sampleRate = this.SAMPLE_RATE
    const minPeriod = Math.floor(sampleRate / this.MAX_PITCH)
    const maxPeriod = Math.floor(sampleRate / this.MIN_PITCH)

    let bestCorrelation = 0
    let bestPeriod = 0

    for (let period = minPeriod; period < maxPeriod && period < timeData.length / 2; period++) {
      let correlation = 0
      let normalizer = 0

      for (let i = 0; i < timeData.length - period; i++) {
        correlation += timeData[i] * timeData[i + period]
        normalizer += timeData[i] * timeData[i]
      }

      if (normalizer > 0) {
        correlation /= Math.sqrt(normalizer)

        if (correlation > bestCorrelation) {
          bestCorrelation = correlation
          bestPeriod = period
        }
      }
    }

    if (bestPeriod === 0 || bestCorrelation < 0.5) {
      return 0 // No clear pitch detected
    }

    return sampleRate / bestPeriod
  }

  stopRecording(): ProsodicFeatures {
    this.isRecording = false
    const endTime = Date.now()
    const totalDuration = endTime - this.startTime

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    // Calculate features from buffers
    return this.calculateFeatures(totalDuration)
  }

  private calculateFeatures(totalDuration: number): ProsodicFeatures {
    // Pitch statistics
    const pitchMean = this.mean(this.pitchBuffer) || 150
    const pitchStd = this.std(this.pitchBuffer) || 0
    const pitchMin = Math.min(...this.pitchBuffer) || pitchMean
    const pitchMax = Math.max(...this.pitchBuffer) || pitchMean
    const pitchRange = pitchMax - pitchMin

    // Determine pitch contour
    let pitchContour: 'rising' | 'falling' | 'flat' | 'variable' = 'flat'
    if (this.pitchBuffer.length > 10) {
      const firstThird = this.mean(this.pitchBuffer.slice(0, Math.floor(this.pitchBuffer.length / 3)))
      const lastThird = this.mean(this.pitchBuffer.slice(Math.floor(2 * this.pitchBuffer.length / 3)))
      const diff = lastThird - firstThird
      if (diff > pitchStd * 0.5) pitchContour = 'rising'
      else if (diff < -pitchStd * 0.5) pitchContour = 'falling'
      else if (pitchStd > pitchMean * 0.15) pitchContour = 'variable'
    }

    // Energy statistics
    const energyMean = this.mean(this.energyBuffer) || 0
    const energyStd = this.std(this.energyBuffer) || 0
    const energyMin = Math.min(...this.energyBuffer) || 0
    const energyMax = Math.max(...this.energyBuffer) || energyMean
    const energyRange = energyMax - energyMin

    // Determine loudness contour
    let loudnessContour: 'crescendo' | 'decrescendo' | 'steady' | 'dynamic' = 'steady'
    if (this.energyBuffer.length > 10) {
      const firstThird = this.mean(this.energyBuffer.slice(0, Math.floor(this.energyBuffer.length / 3)))
      const lastThird = this.mean(this.energyBuffer.slice(Math.floor(2 * this.energyBuffer.length / 3)))
      const diff = lastThird - firstThird
      if (diff > energyStd * 0.5) loudnessContour = 'crescendo'
      else if (diff < -energyStd * 0.5) loudnessContour = 'decrescendo'
      else if (energyStd > energyMean * 0.3) loudnessContour = 'dynamic'
    }

    // Pause analysis
    const pauseRatio = this.silentFrames / (this.totalFrames || 1)
    const averagePauseLength = this.pauseLengths.length > 0
      ? this.mean(this.pauseLengths)
      : 0

    // Timing
    const silenceDuration = totalDuration * pauseRatio
    const speakingDuration = totalDuration - silenceDuration

    // Estimate speech rate (rough approximation: assume 4 syllables/word, 150 wpm average)
    // Normalized by actual speaking time
    const estimatedSyllables = (speakingDuration / 1000) * 4.5 // Rough estimate
    const speechRate = speakingDuration > 0 ? (estimatedSyllables / (speakingDuration / 1000)) : 0
    const articulationRate = speechRate * 1.2 // Slightly higher excluding pauses

    // Voice quality metrics (simplified estimation)
    // In a full implementation, these would use more sophisticated signal processing
    const harmonicToNoiseRatio = 1 - (pitchStd / (pitchMean || 1)) * 0.5 // Simplified
    const jitter = pitchStd / (pitchMean || 1) * 100 // Percent variation
    const shimmer = energyStd / (energyMean || 0.01) * 100 // Percent variation

    return {
      pitchMean: Math.round(pitchMean),
      pitchStd: Math.round(pitchStd * 10) / 10,
      pitchRange: Math.round(pitchRange),
      pitchContour,
      speechRate: Math.round(speechRate * 10) / 10,
      articulationRate: Math.round(articulationRate * 10) / 10,
      pauseRatio: Math.round(pauseRatio * 100) / 100,
      averagePauseLength: Math.round(averagePauseLength),
      energyMean: Math.round(energyMean * 1000) / 1000,
      energyStd: Math.round(energyStd * 1000) / 1000,
      energyRange: Math.round(energyRange * 1000) / 1000,
      loudnessContour,
      harmonicToNoiseRatio: Math.max(0, Math.min(1, harmonicToNoiseRatio)),
      jitter: Math.round(jitter * 10) / 10,
      shimmer: Math.round(shimmer * 10) / 10,
      speakingDuration: Math.round(speakingDuration),
      silenceDuration: Math.round(silenceDuration),
      turnTakingSpeed: 0.5, // Placeholder - would need conversation context
    }
  }

  private mean(arr: number[]): number {
    if (arr.length === 0) return 0
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  private std(arr: number[]): number {
    if (arr.length < 2) return 0
    const avg = this.mean(arr)
    const squareDiffs = arr.map(value => Math.pow(value - avg, 2))
    return Math.sqrt(this.mean(squareDiffs))
  }

  cleanup(): void {
    this.isRecording = false
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

// Singleton audio processor instance
let audioProcessor: AudioProcessor | null = null

/**
 * Check if audio analysis is supported in this environment
 */
export function isAudioAnalysisSupported(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    window.AudioContext &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  )
}

/**
 * Request microphone permission
 */
export async function requestAudioPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // Immediately stop the stream - we just wanted to check permission
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('Microphone permission denied:', error)
    return false
  }
}

/**
 * Initialize the audio analyzer
 */
export async function initializeAudioAnalyzer(): Promise<boolean> {
  if (!isAudioAnalysisSupported()) {
    console.warn('Audio analysis not supported in this environment')
    return false
  }

  if (!audioProcessor) {
    audioProcessor = new AudioProcessor()
  }

  return audioProcessor.initialize()
}

/**
 * Start recording audio for analysis
 */
export async function startAudioRecording(): Promise<boolean> {
  if (!audioProcessor) {
    const initialized = await initializeAudioAnalyzer()
    if (!initialized) return false
  }

  return audioProcessor!.startRecording()
}

/**
 * Stop recording and get prosodic features
 */
export function stopAudioRecording(): ProsodicFeatures | null {
  if (!audioProcessor) return null
  return audioProcessor.stopRecording()
}

/**
 * Cleanup audio resources
 */
export function cleanupAudioAnalyzer(): void {
  if (audioProcessor) {
    audioProcessor.cleanup()
    audioProcessor = null
  }
}

/**
 * Map prosodic features to psychological domain scores
 * Uses research-based mappings between voice features and personality traits
 */
export function mapFeaturesToDomains(features: ProsodicFeatures): Partial<Record<PsychologicalDomain, number>> {
  const domainScores: Record<string, { sum: number; weight: number }> = {}

  // Initialize all domains
  for (const domain of PSYCHOLOGICAL_DOMAINS) {
    domainScores[domain] = { sum: 0, weight: 0 }
  }

  // Process each feature
  for (const [featureKey, value] of Object.entries(features)) {
    const mappings = FEATURE_DOMAIN_WEIGHTS[featureKey as keyof ProsodicFeatures]
    if (!mappings) continue

    // Normalize feature value to 0-1 scale
    const normalizedValue = normalizeFeatureValue(featureKey as keyof ProsodicFeatures, value as number)

    // Apply to each mapped domain
    for (const [domain, mapping] of Object.entries(mappings)) {
      const { weight, positive } = mapping
      const contribution = positive
        ? normalizedValue * weight
        : (1 - normalizedValue) * weight

      domainScores[domain].sum += contribution
      domainScores[domain].weight += weight
    }
  }

  // Handle special contour-based features
  applyContourMappings(features, domainScores)

  // Calculate final scores (weighted average)
  const result: Partial<Record<PsychologicalDomain, number>> = {}

  for (const [domain, data] of Object.entries(domainScores)) {
    if (data.weight > 0) {
      // Normalize to 0-1 and apply sigmoid for smoother distribution
      const raw = data.sum / data.weight
      result[domain as PsychologicalDomain] = sigmoidNormalize(raw)
    }
  }

  return result
}

/**
 * Normalize feature values to 0-1 scale based on expected ranges
 */
function normalizeFeatureValue(feature: keyof ProsodicFeatures, value: number): number {
  const ranges: Record<keyof ProsodicFeatures, { min: number; max: number }> = {
    pitchMean: { min: 80, max: 400 },         // Hz
    pitchStd: { min: 0, max: 50 },            // Hz
    pitchRange: { min: 0, max: 200 },         // Hz
    pitchContour: { min: 0, max: 1 },         // Categorical
    speechRate: { min: 2, max: 8 },           // Syllables/sec
    articulationRate: { min: 3, max: 10 },    // Syllables/sec
    pauseRatio: { min: 0, max: 0.5 },         // Ratio
    averagePauseLength: { min: 0, max: 1000 },// ms
    energyMean: { min: 0, max: 0.2 },         // RMS
    energyStd: { min: 0, max: 0.1 },          // RMS
    energyRange: { min: 0, max: 0.3 },        // RMS
    loudnessContour: { min: 0, max: 1 },      // Categorical
    harmonicToNoiseRatio: { min: 0, max: 1 }, // Ratio
    jitter: { min: 0, max: 5 },               // Percent
    shimmer: { min: 0, max: 10 },             // Percent
    speakingDuration: { min: 0, max: 60000 }, // ms
    silenceDuration: { min: 0, max: 30000 },  // ms
    turnTakingSpeed: { min: 0, max: 1 },      // Normalized
  }

  const range = ranges[feature]
  if (!range) return 0.5

  if (typeof value !== 'number') return 0.5

  return Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)))
}

/**
 * Apply special mappings for categorical contour features
 */
function applyContourMappings(
  features: ProsodicFeatures,
  domainScores: Record<string, { sum: number; weight: number }>
): void {
  // Pitch contour mappings
  const pitchContourMappings: Record<string, Partial<Record<PsychologicalDomain, { value: number; weight: number }>>> = {
    rising: {
      big_five_neuroticism: { value: 0.7, weight: 0.2 },      // Uncertainty
      big_five_agreeableness: { value: 0.6, weight: 0.15 },   // Seeking approval
    },
    falling: {
      big_five_conscientiousness: { value: 0.7, weight: 0.2 },// Assertive, decisive
      dark_triad_narcissism: { value: 0.6, weight: 0.15 },    // Confident
    },
    variable: {
      big_five_extraversion: { value: 0.8, weight: 0.25 },    // Expressive
      emotional_intelligence: { value: 0.7, weight: 0.2 },    // Emotionally varied
      creativity: { value: 0.65, weight: 0.15 },              // Creative expression
    },
    flat: {
      big_five_conscientiousness: { value: 0.6, weight: 0.15 },// Controlled
      stress_coping: { value: 0.4, weight: 0.15 },            // May indicate stress
    },
  }

  const pitchMapping = pitchContourMappings[features.pitchContour]
  if (pitchMapping) {
    for (const [domain, { value, weight }] of Object.entries(pitchMapping)) {
      domainScores[domain].sum += value * weight
      domainScores[domain].weight += weight
    }
  }

  // Loudness contour mappings
  const loudnessContourMappings: Record<string, Partial<Record<PsychologicalDomain, { value: number; weight: number }>>> = {
    crescendo: {
      big_five_extraversion: { value: 0.7, weight: 0.2 },
      achievement_motivation: { value: 0.65, weight: 0.15 },
    },
    decrescendo: {
      big_five_agreeableness: { value: 0.6, weight: 0.15 },
      big_five_conscientiousness: { value: 0.55, weight: 0.1 },
    },
    dynamic: {
      emotional_intelligence: { value: 0.75, weight: 0.2 },
      big_five_extraversion: { value: 0.7, weight: 0.2 },
      creativity: { value: 0.6, weight: 0.15 },
    },
    steady: {
      big_five_conscientiousness: { value: 0.65, weight: 0.15 },
      executive_functions: { value: 0.6, weight: 0.15 },
    },
  }

  const loudnessMapping = loudnessContourMappings[features.loudnessContour]
  if (loudnessMapping) {
    for (const [domain, { value, weight }] of Object.entries(loudnessMapping)) {
      domainScores[domain].sum += value * weight
      domainScores[domain].weight += weight
    }
  }
}

/**
 * Apply sigmoid normalization for smoother score distribution
 */
function sigmoidNormalize(x: number): number {
  // Center around 0.5 with reasonable spread
  const centered = (x - 0.5) * 4
  return 1 / (1 + Math.exp(-centered))
}

/**
 * Perform complete audio analysis and return domain scores
 */
export async function analyzeAudio(durationMs: number = 10000): Promise<AudioAnalysisResult | null> {
  try {
    const started = await startAudioRecording()
    if (!started) {
      console.error('Failed to start audio recording')
      return null
    }

    // Record for specified duration
    await new Promise(resolve => setTimeout(resolve, durationMs))

    // Stop and get features
    const features = stopAudioRecording()
    if (!features) {
      return null
    }

    // Map to domain scores
    const domainScores = mapFeaturesToDomains(features)

    // Calculate overall confidence based on data quality
    const dataQuality = calculateDataQuality(features)

    return {
      features,
      confidence: dataQuality,
      domainScores,
      timestamp: Date.now(),
      durationMs,
    }
  } catch (error) {
    console.error('Audio analysis failed:', error)
    return null
  }
}

/**
 * Calculate data quality/confidence based on extracted features
 */
function calculateDataQuality(features: ProsodicFeatures): number {
  let quality = 0.5 // Base quality

  // Boost quality if we have reasonable speaking time
  if (features.speakingDuration > 3000) quality += 0.1
  if (features.speakingDuration > 10000) quality += 0.1

  // Boost if we detected clear pitch
  if (features.pitchMean > 80 && features.pitchMean < 400) quality += 0.1
  if (features.pitchStd > 5) quality += 0.05 // Some variation detected

  // Boost if energy levels are reasonable
  if (features.energyMean > 0.01) quality += 0.1

  // Penalize if too quiet or too much silence
  if (features.pauseRatio > 0.7) quality -= 0.2
  if (features.energyMean < 0.005) quality -= 0.1

  return Math.max(0.1, Math.min(1, quality))
}

/**
 * Get a human-readable summary of prosodic features
 */
export function getProsodicSummary(features: ProsodicFeatures): string {
  const insights: string[] = []

  // Pitch analysis
  if (features.pitchMean > 200) {
    insights.push('Higher-pitched voice suggests expressiveness')
  } else if (features.pitchMean < 130) {
    insights.push('Lower-pitched voice may indicate calm or authority')
  }

  if (features.pitchStd > 30) {
    insights.push('High pitch variation indicates emotional expressiveness')
  }

  // Speech rate
  if (features.speechRate > 5) {
    insights.push('Fast speech rate suggests extraversion or urgency')
  } else if (features.speechRate < 3) {
    insights.push('Slower speech may indicate deliberate thinking')
  }

  // Pauses
  if (features.pauseRatio > 0.3) {
    insights.push('Frequent pauses suggest thoughtful, measured communication')
  } else if (features.pauseRatio < 0.1) {
    insights.push('Few pauses indicate fluent, confident speech')
  }

  // Energy
  if (features.energyStd / features.energyMean > 0.5) {
    insights.push('Dynamic volume suggests animated, expressive communication')
  }

  // Voice quality
  if (features.harmonicToNoiseRatio > 0.8) {
    insights.push('Clear voice quality indicates composure')
  }

  if (features.jitter > 2) {
    insights.push('Voice tremor detected, may indicate nervousness or emotion')
  }

  return insights.length > 0
    ? insights.join('. ') + '.'
    : 'Audio features within normal range.'
}

export { AudioProcessor }
