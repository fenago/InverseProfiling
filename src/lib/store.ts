import { create } from 'zustand'
import type { Message, PersonalityTrait } from './db'

interface LLMState {
  isLoading: boolean
  isReady: boolean
  progress: number
  modelName: string | null
  error: string | null
}

interface ChatState {
  messages: Message[]
  isGenerating: boolean
  currentSessionId: string
}

interface ProfileState {
  traits: PersonalityTrait[]
  lastAnalysis: Date | null
  analysisCount: number
}

// Common languages for quick selection in chat box (12 languages)
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  ru: 'Russian',
} as const

// Full list of 140 languages supported by Gemma 3n (for Settings page)
export const ALL_SUPPORTED_LANGUAGES = {
  en: 'English',
  af: 'Afrikaans',
  sq: 'Albanian',
  am: 'Amharic',
  ar: 'Arabic',
  hy: 'Armenian',
  az: 'Azerbaijani',
  eu: 'Basque',
  be: 'Belarusian',
  bn: 'Bengali',
  bs: 'Bosnian',
  bg: 'Bulgarian',
  my: 'Burmese',
  ca: 'Catalan',
  ceb: 'Cebuano',
  ny: 'Chichewa',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  zh: 'Chinese',
  co: 'Corsican',
  hr: 'Croatian',
  cs: 'Czech',
  da: 'Danish',
  nl: 'Dutch',
  eo: 'Esperanto',
  et: 'Estonian',
  tl: 'Filipino',
  fi: 'Finnish',
  fr: 'French',
  fy: 'Frisian',
  gl: 'Galician',
  ka: 'Georgian',
  de: 'German',
  el: 'Greek',
  gu: 'Gujarati',
  ht: 'Haitian Creole',
  ha: 'Hausa',
  haw: 'Hawaiian',
  he: 'Hebrew',
  hi: 'Hindi',
  hmn: 'Hmong',
  hu: 'Hungarian',
  is: 'Icelandic',
  ig: 'Igbo',
  id: 'Indonesian',
  ga: 'Irish',
  it: 'Italian',
  ja: 'Japanese',
  jv: 'Javanese',
  kn: 'Kannada',
  kk: 'Kazakh',
  km: 'Khmer',
  rw: 'Kinyarwanda',
  ko: 'Korean',
  ku: 'Kurdish',
  ky: 'Kyrgyz',
  lo: 'Lao',
  la: 'Latin',
  lv: 'Latvian',
  lt: 'Lithuanian',
  lb: 'Luxembourgish',
  mk: 'Macedonian',
  mg: 'Malagasy',
  ms: 'Malay',
  ml: 'Malayalam',
  mt: 'Maltese',
  mi: 'Maori',
  mr: 'Marathi',
  mn: 'Mongolian',
  ne: 'Nepali',
  no: 'Norwegian',
  or: 'Odia',
  ps: 'Pashto',
  fa: 'Persian',
  pl: 'Polish',
  pt: 'Portuguese',
  'pt-BR': 'Portuguese (Brazilian)',
  pa: 'Punjabi',
  ro: 'Romanian',
  ru: 'Russian',
  sm: 'Samoan',
  gd: 'Scottish Gaelic',
  sr: 'Serbian',
  st: 'Sesotho',
  sn: 'Shona',
  sd: 'Sindhi',
  si: 'Sinhala',
  sk: 'Slovak',
  sl: 'Slovenian',
  so: 'Somali',
  es: 'Spanish',
  'es-419': 'Spanish (Latin America)',
  su: 'Sundanese',
  sw: 'Swahili',
  sv: 'Swedish',
  tg: 'Tajik',
  ta: 'Tamil',
  tt: 'Tatar',
  te: 'Telugu',
  th: 'Thai',
  tr: 'Turkish',
  tk: 'Turkmen',
  uk: 'Ukrainian',
  ur: 'Urdu',
  ug: 'Uyghur',
  uz: 'Uzbek',
  vi: 'Vietnamese',
  cy: 'Welsh',
  xh: 'Xhosa',
  yi: 'Yiddish',
  yo: 'Yoruba',
  zu: 'Zulu',
  // Additional regional variants and less common languages
  as: 'Assamese',
  bho: 'Bhojpuri',
  doi: 'Dogri',
  gom: 'Konkani',
  kok: 'Konkani',
  mai: 'Maithili',
  mni: 'Meiteilon (Manipuri)',
  lus: 'Mizo',
  sat: 'Santali',
  nso: 'Sepedi',
  ts: 'Tsonga',
  ak: 'Akan',
  ee: 'Ewe',
  gn: 'Guarani',
  iw: 'Hebrew (Legacy)',
  kri: 'Krio',
  ln: 'Lingala',
  lg: 'Luganda',
  om: 'Oromo',
  qu: 'Quechua',
  ti: 'Tigrinya',
  tn: 'Tswana',
  tw: 'Twi',
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES | keyof typeof ALL_SUPPORTED_LANGUAGES

// Response size options for controlling LLM output length
export type ResponseSize = 'small' | 'medium' | 'large'

// With 8K token context (Gemma 3n supports 32K natively), we can be generous with history
// ~1 token ≈ 4 characters, so 8K tokens ≈ 32K chars available
export const RESPONSE_SIZE_CONFIG = {
  small: {
    label: 'Brief',
    description: '1-2 sentences',
    maxHistoryChars: 16000,  // ~4K tokens for history, leaves room for short response
    promptInstruction: 'Keep your response very brief - 1-2 sentences maximum. Be concise and direct.',
    pros: ['Faster responses', 'More conversation history retained', 'Good for quick Q&A'],
    cons: ['Less detailed answers', 'May miss nuance'],
  },
  medium: {
    label: 'Standard',
    description: '2-4 sentences',
    maxHistoryChars: 12000,  // ~3K tokens for history
    promptInstruction: 'Keep your response moderate length - 2-4 sentences. Be helpful but concise.',
    pros: ['Balanced detail and speed', 'Good conversation memory', 'Recommended for most users'],
    cons: ['Not ideal for complex topics'],
  },
  large: {
    label: 'Detailed',
    description: 'Full explanations',
    maxHistoryChars: 8000,   // ~2K tokens for history, more room for detailed responses
    promptInstruction: 'You may provide detailed, thorough responses when appropriate.',
    pros: ['Thorough explanations', 'Better for complex topics', 'More thoughtful responses'],
    cons: ['Slower responses', 'Less conversation history', 'Uses more memory'],
  },
} as const

// System prompt presets - robust templates for different use cases
export type SystemPromptPreset = 'balanced' | 'analytical' | 'creative' | 'concise' | 'empathetic' | 'custom'

export interface SystemPromptConfig {
  id: SystemPromptPreset
  label: string
  description: string
  prompt: string
}

export const SYSTEM_PROMPT_PRESETS: SystemPromptConfig[] = [
  {
    id: 'balanced',
    label: 'Balanced Assistant',
    description: 'Well-rounded responses with good balance of detail and brevity',
    prompt: `You are a thoughtful and helpful AI assistant. Your responses should be:
- Clear and well-organized
- Appropriately detailed based on the question complexity
- Honest about limitations and uncertainties
- Respectful and professional

When you don't know something, say so directly. Avoid speculation unless asked. Provide practical, actionable information when relevant.`,
  },
  {
    id: 'analytical',
    label: 'Analytical Expert',
    description: 'Structured, logical responses with detailed reasoning',
    prompt: `You are an analytical AI assistant focused on providing rigorous, well-reasoned responses. Your approach should be:
- Systematic: Break down complex topics into clear components
- Evidence-based: Support claims with reasoning and examples
- Precise: Use exact terminology and avoid ambiguity
- Critical: Consider multiple perspectives and potential counterarguments
- Structured: Use numbered lists, sections, or frameworks when helpful

When analyzing problems, explicitly state your assumptions and reasoning process. Acknowledge uncertainty and limitations in available information.`,
  },
  {
    id: 'creative',
    label: 'Creative Partner',
    description: 'Imaginative, exploratory responses that encourage new ideas',
    prompt: `You are a creative AI assistant designed to inspire and explore possibilities. Your responses should:
- Think divergently: Offer multiple perspectives and unconventional ideas
- Be generative: Build on concepts and suggest variations
- Use analogies: Connect ideas across different domains
- Embrace ambiguity: Explore open-ended questions without rushing to conclusions
- Be playful: Engage with imaginative scenarios and "what if" thinking

Encourage exploration over judgment. When brainstorming, quantity and variety matter more than perfection. Help users see their problems from fresh angles.`,
  },
  {
    id: 'concise',
    label: 'Concise Responder',
    description: 'Direct, efficient answers without unnecessary elaboration',
    prompt: `You are a concise AI assistant focused on efficiency. Your responses should be:
- Direct: Answer the question immediately, then add context if needed
- Minimal: Use the fewest words that convey the full meaning
- Scannable: Use bullet points for multiple items
- Action-oriented: Focus on what to do, not background

Avoid: pleasantries, restating the question, unnecessary qualifiers, long introductions. Get to the point.`,
  },
  {
    id: 'empathetic',
    label: 'Supportive Guide',
    description: 'Warm, understanding responses that prioritize emotional awareness',
    prompt: `You are an empathetic AI assistant focused on supportive, person-centered communication. Your responses should:
- Acknowledge feelings: Recognize and validate emotional content in messages
- Listen actively: Reflect back what you understand before responding
- Be patient: Never rush or dismiss concerns
- Empower: Help users find their own insights rather than prescribing solutions
- Be warm: Use approachable language while maintaining respect

Focus on understanding the person, not just solving the problem. Ask clarifying questions when the emotional context matters.`,
  },
  {
    id: 'custom',
    label: 'Custom Prompt',
    description: 'Your own custom system prompt',
    prompt: '', // Will be filled with user's custom prompt
  },
]

// Context window size options - trades off memory for conversation history
// Gemma 3n supports up to 32K tokens natively
export type ContextWindowSize = 2048 | 4096 | 8192 | 16384 | 32768

export const CONTEXT_WINDOW_OPTIONS: {
  value: ContextWindowSize
  label: string
  description: string
  pros: string[]
  cons: string[]
  requiresReload: boolean
}[] = [
  {
    value: 2048,
    label: '2K tokens',
    description: 'Fast, minimal history (~5 messages)',
    pros: ['Fastest responses', 'Lowest memory usage', 'Best for low-end devices'],
    cons: ['Very short conversation memory', 'Loses context quickly'],
    requiresReload: true,
  },
  {
    value: 4096,
    label: '4K tokens',
    description: 'Balanced (~10 messages)',
    pros: ['Good performance', 'Moderate memory use', 'Decent context retention'],
    cons: ['May lose context in longer conversations'],
    requiresReload: true,
  },
  {
    value: 8192,
    label: '8K tokens (Recommended)',
    description: 'Extended history (~20 messages)',
    pros: ['Good balance of memory and performance', 'Remembers most conversation context'],
    cons: ['Slightly slower than smaller options'],
    requiresReload: true,
  },
  {
    value: 16384,
    label: '16K tokens',
    description: 'Long conversations (~40 messages)',
    pros: ['Extended conversation memory', 'Better for complex topics'],
    cons: ['Slower responses', 'Higher memory usage', 'May cause issues on older devices'],
    requiresReload: true,
  },
  {
    value: 32768,
    label: '32K tokens (Maximum)',
    description: 'Maximum memory capacity',
    pros: ['Full 32K context window', 'Remembers entire conversation', 'Best for research/analysis'],
    cons: ['Slowest responses', 'Highest memory usage', 'May crash on low-RAM devices', 'Requires powerful hardware'],
    requiresReload: true,
  },
]

interface SettingsState {
  language: LanguageCode
  responseSize: ResponseSize
  contextWindowSize: ContextWindowSize
  systemPromptPreset: SystemPromptPreset
  customSystemPrompt: string
}

interface AppStore {
  // LLM State
  llm: LLMState
  setLLMLoading: (loading: boolean) => void
  setLLMReady: (ready: boolean) => void
  setLLMProgress: (progress: number) => void
  setLLMModel: (name: string | null) => void
  setLLMError: (error: string | null) => void

  // Chat State
  chat: ChatState
  addMessage: (message: Message) => void
  setMessages: (messages: Message[]) => void
  setGenerating: (generating: boolean) => void
  setSessionId: (id: string) => void
  clearMessages: () => void

  // Profile State
  profile: ProfileState
  setTraits: (traits: PersonalityTrait[]) => void
  updateTrait: (trait: PersonalityTrait) => void
  setLastAnalysis: (date: Date) => void
  incrementAnalysisCount: () => void

  // Settings State
  settings: SettingsState
  setLanguage: (language: LanguageCode) => void
  setResponseSize: (size: ResponseSize) => void
  setContextWindowSize: (size: ContextWindowSize) => void
  setSystemPromptPreset: (preset: SystemPromptPreset) => void
  setCustomSystemPrompt: (prompt: string) => void
}

export const useStore = create<AppStore>((set) => ({
  // LLM State
  llm: {
    isLoading: false,
    isReady: false,
    progress: 0,
    modelName: null,
    error: null,
  },
  setLLMLoading: (loading) =>
    set((state) => ({ llm: { ...state.llm, isLoading: loading } })),
  setLLMReady: (ready) =>
    set((state) => ({ llm: { ...state.llm, isReady: ready } })),
  setLLMProgress: (progress) =>
    set((state) => ({ llm: { ...state.llm, progress } })),
  setLLMModel: (name) =>
    set((state) => ({ llm: { ...state.llm, modelName: name } })),
  setLLMError: (error) =>
    set((state) => ({ llm: { ...state.llm, error } })),

  // Chat State
  chat: {
    messages: [],
    isGenerating: false,
    currentSessionId: crypto.randomUUID(),
  },
  addMessage: (message) =>
    set((state) => ({
      chat: { ...state.chat, messages: [...state.chat.messages, message] },
    })),
  setMessages: (messages) =>
    set((state) => ({ chat: { ...state.chat, messages } })),
  setGenerating: (generating) =>
    set((state) => ({ chat: { ...state.chat, isGenerating: generating } })),
  setSessionId: (id) =>
    set((state) => ({ chat: { ...state.chat, currentSessionId: id } })),
  clearMessages: () =>
    set((state) => ({ chat: { ...state.chat, messages: [] } })),

  // Profile State
  profile: {
    traits: [],
    lastAnalysis: null,
    analysisCount: 0,
  },
  setTraits: (traits) =>
    set((state) => ({ profile: { ...state.profile, traits } })),
  updateTrait: (trait) =>
    set((state) => ({
      profile: {
        ...state.profile,
        traits: state.profile.traits.map((t) =>
          t.trait === trait.trait ? trait : t
        ),
      },
    })),
  setLastAnalysis: (date) =>
    set((state) => ({ profile: { ...state.profile, lastAnalysis: date } })),
  incrementAnalysisCount: () =>
    set((state) => ({
      profile: {
        ...state.profile,
        analysisCount: state.profile.analysisCount + 1,
      },
    })),

  // Settings State
  settings: {
    language: 'en',
    responseSize: 'medium',
    contextWindowSize: 8192, // Default to 8K - good balance of history and performance
    systemPromptPreset: 'balanced',
    customSystemPrompt: '',
  },
  setLanguage: (language) =>
    set((state) => ({ settings: { ...state.settings, language } })),
  setResponseSize: (responseSize) =>
    set((state) => ({ settings: { ...state.settings, responseSize } })),
  setContextWindowSize: (contextWindowSize) =>
    set((state) => ({ settings: { ...state.settings, contextWindowSize } })),
  setSystemPromptPreset: (systemPromptPreset) =>
    set((state) => ({ settings: { ...state.settings, systemPromptPreset } })),
  setCustomSystemPrompt: (customSystemPrompt) =>
    set((state) => ({ settings: { ...state.settings, customSystemPrompt } })),
}))
