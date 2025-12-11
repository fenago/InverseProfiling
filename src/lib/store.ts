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

interface SettingsState {
  language: LanguageCode
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
  },
  setLanguage: (language) =>
    set((state) => ({ settings: { ...state.settings, language } })),
}))
