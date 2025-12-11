import Dexie, { type EntityTable } from 'dexie'
import { clearSqlData } from './sqldb'

// Types for our database entities
export interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sessionId: string
  metadata?: {
    tokenCount?: number
    responseTime?: number
  }
}

export interface LinguisticAnalysis {
  id?: number
  messageId: number
  timestamp: Date
  metrics: {
    wordCount: number
    sentenceCount: number
    avgWordsPerSentence: number
    vocabularyRichness: number
    emotionalTone: number
    cognitiveComplexity: number
    categories: {
      pronouns: { i: number; we: number; you: number }
      emotions: { positive: number; negative: number; anxiety: number }
      cognitive: { insight: number; causation: number; tentative: number }
      social: { family: number; friends: number; humans: number }
    }
  }
}

export interface PersonalityTrait {
  id?: number
  trait: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism'
  score: number
  confidence: number
  sampleSize: number
  lastUpdated: Date
  history: Array<{
    score: number
    timestamp: Date
  }>
}

export interface UserProfile {
  id?: number
  createdAt: Date
  updatedAt: Date
  totalMessages: number
  totalWords: number
  averageSessionLength: number
  topTopics: string[]
  communicationStyle: string
  learningPreferences: string[]
}

export interface ActivityLog {
  id?: number
  type: 'message' | 'analysis' | 'profile_update' | 'model_load' | 'export' | 'delete'
  description: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface Session {
  id?: string
  startedAt: Date
  endedAt?: Date
  messageCount: number
  analysisComplete: boolean
}

// Database class
class DigitalTwinDB extends Dexie {
  messages!: EntityTable<Message, 'id'>
  linguisticAnalyses!: EntityTable<LinguisticAnalysis, 'id'>
  personalityTraits!: EntityTable<PersonalityTrait, 'id'>
  userProfile!: EntityTable<UserProfile, 'id'>
  activityLogs!: EntityTable<ActivityLog, 'id'>
  sessions!: EntityTable<Session, 'id'>

  constructor() {
    super('DigitalTwinDB')

    this.version(1).stores({
      messages: '++id, role, timestamp, sessionId',
      linguisticAnalyses: '++id, messageId, timestamp',
      personalityTraits: '++id, trait, lastUpdated',
      userProfile: '++id, updatedAt',
      activityLogs: '++id, type, timestamp',
      sessions: 'id, startedAt, endedAt',
    })
  }
}

export const db = new DigitalTwinDB()

// Helper functions
export async function logActivity(
  type: ActivityLog['type'],
  description: string,
  metadata?: Record<string, unknown>
) {
  await db.activityLogs.add({
    type,
    description,
    timestamp: new Date(),
    metadata,
  })
}

export async function getOrCreateProfile(): Promise<UserProfile> {
  const existing = await db.userProfile.toCollection().first()
  if (existing) return existing

  const newProfile: UserProfile = {
    createdAt: new Date(),
    updatedAt: new Date(),
    totalMessages: 0,
    totalWords: 0,
    averageSessionLength: 0,
    topTopics: [],
    communicationStyle: 'unknown',
    learningPreferences: [],
  }

  const id = await db.userProfile.add(newProfile)
  return { ...newProfile, id }
}

export async function updateProfileStats() {
  const profile = await getOrCreateProfile()
  const messages = await db.messages.where('role').equals('user').toArray()

  const totalWords = messages.reduce((sum, msg) => {
    return sum + msg.content.split(/\s+/).length
  }, 0)

  await db.userProfile.update(profile.id!, {
    totalMessages: messages.length,
    totalWords,
    updatedAt: new Date(),
  })

  await logActivity('profile_update', `Updated profile stats: ${messages.length} messages, ${totalWords} words`)
}

export async function exportAllData(): Promise<string> {
  const data = {
    messages: await db.messages.toArray(),
    linguisticAnalyses: await db.linguisticAnalyses.toArray(),
    personalityTraits: await db.personalityTraits.toArray(),
    userProfile: await db.userProfile.toArray(),
    activityLogs: await db.activityLogs.toArray(),
    sessions: await db.sessions.toArray(),
    exportedAt: new Date().toISOString(),
  }

  await logActivity('export', 'Exported all user data')
  return JSON.stringify(data, null, 2)
}

export async function deleteAllData(): Promise<void> {
  // Clear Dexie/IndexedDB tables
  await db.messages.clear()
  await db.linguisticAnalyses.clear()
  await db.personalityTraits.clear()
  await db.userProfile.clear()
  await db.sessions.clear()

  // Clear SQL database (domain_scores, feature_counts, etc.)
  await clearSqlData()

  // Keep activity log entry for deletion
  await logActivity('delete', 'All user data deleted')
}
