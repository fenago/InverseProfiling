/**
 * Session Memory Module
 * Provides conversation memory across sessions by extracting and summarizing
 * key information from previous conversations
 */

import { db } from './db'

// Types
export interface SessionSummary {
  sessionId: string
  date: Date
  messageCount: number
  topics: string[]
  keyFacts: string[]
  userPreferences: string[]
}

export interface ConversationMemory {
  summaries: SessionSummary[]
  recentTopics: string[]
  keyFacts: string[]
  lastUpdated: Date
  totalSessions: number
}

// Stop words for topic extraction
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we',
  'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its',
  'our', 'their', 'this', 'that', 'these', 'those', 'and', 'or', 'but',
  'if', 'then', 'else', 'when', 'where', 'why', 'how', 'what', 'which',
  'who', 'whom', 'so', 'because', 'as', 'until', 'while', 'of', 'at',
  'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'than', 'too', 'very', 'just', 'can', 'will',
  'don', 'should', 'now', 'also', 'like', 'really', 'think', 'know',
  'just', 'want', 'going', 'get', 'got', 'make', 'made', 'say', 'said',
  'see', 'look', 'come', 'came', 'take', 'took', 'give', 'gave', 'go',
  'went', 'tell', 'told', 'let', 'help', 'try', 'feel', 'felt', 'yeah',
  'yes', 'okay', 'ok', 'sure', 'thanks', 'thank', 'please', 'sorry',
])

// Preference indicator phrases
const PREFERENCE_INDICATORS = [
  'i like', 'i love', 'i prefer', 'i enjoy', 'i hate', 'i dislike',
  'my favorite', 'i always', 'i never', 'i usually', 'i tend to',
  'i\'m interested in', 'i\'m passionate about', 'i believe', 'i think',
  'for me', 'in my opinion', 'i feel that', 'i find',
]

// Fact indicator phrases (statements about self)
const FACT_INDICATORS = [
  'i am', 'i\'m', 'i work', 'i live', 'i have', 'i\'ve',
  'my job', 'my name', 'my age', 'i studied', 'i study',
  'i was born', 'i grew up', 'i come from', 'i moved',
]

/**
 * Extract key topics from text using TF-IDF-like scoring
 */
function extractTopics(text: string, maxTopics: number = 5): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w))

  // Count word frequencies
  const wordFreq: Record<string, number> = {}
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  }

  // Score words by frequency but penalize very common words
  const scored = Object.entries(wordFreq)
    .map(([word, count]) => ({
      word,
      score: count * (1 / Math.log(count + 2)), // Diminishing returns for frequency
    }))
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, maxTopics).map(s => s.word)
}

/**
 * Extract user preferences from messages
 */
function extractPreferences(messages: Array<{ content: string }>): string[] {
  const preferences: string[] = []

  for (const msg of messages) {
    const lowerContent = msg.content.toLowerCase()

    for (const indicator of PREFERENCE_INDICATORS) {
      const idx = lowerContent.indexOf(indicator)
      if (idx !== -1) {
        // Extract the sentence containing the preference
        const start = Math.max(0, lowerContent.lastIndexOf('.', idx) + 1)
        const end = lowerContent.indexOf('.', idx + indicator.length)
        const sentence = msg.content.slice(
          start,
          end !== -1 ? end + 1 : Math.min(idx + 100, msg.content.length)
        ).trim()

        if (sentence.length > 10 && sentence.length < 200) {
          preferences.push(sentence)
        }
      }
    }
  }

  // Deduplicate and limit
  return [...new Set(preferences)].slice(0, 10)
}

/**
 * Extract key facts about the user
 */
function extractFacts(messages: Array<{ content: string }>): string[] {
  const facts: string[] = []

  for (const msg of messages) {
    const lowerContent = msg.content.toLowerCase()

    for (const indicator of FACT_INDICATORS) {
      const idx = lowerContent.indexOf(indicator)
      if (idx !== -1) {
        // Extract the sentence containing the fact
        const start = Math.max(0, lowerContent.lastIndexOf('.', idx) + 1)
        const end = lowerContent.indexOf('.', idx + indicator.length)
        const sentence = msg.content.slice(
          start,
          end !== -1 ? end + 1 : Math.min(idx + 100, msg.content.length)
        ).trim()

        if (sentence.length > 10 && sentence.length < 200) {
          facts.push(sentence)
        }
      }
    }
  }

  // Deduplicate and limit
  return [...new Set(facts)].slice(0, 10)
}

/**
 * Summarize a single session
 */
async function summarizeSession(sessionId: string): Promise<SessionSummary | null> {
  const messages = await db.messages
    .where('sessionId')
    .equals(sessionId)
    .toArray()

  if (messages.length === 0) return null

  const userMessages = messages.filter(m => m.role === 'user')
  if (userMessages.length === 0) return null

  const allUserText = userMessages.map(m => m.content).join(' ')

  return {
    sessionId,
    date: messages[0].timestamp,
    messageCount: messages.length,
    topics: extractTopics(allUserText),
    keyFacts: extractFacts(userMessages),
    userPreferences: extractPreferences(userMessages),
  }
}

/**
 * Get conversation memory from previous sessions
 * @param excludeSessionId - Current session to exclude
 * @param maxSessions - Maximum number of sessions to include
 */
export async function getConversationMemory(
  excludeSessionId: string,
  maxSessions: number = 5
): Promise<ConversationMemory> {
  // Get all sessions ordered by recency
  const sessions = await db.sessions
    .orderBy('startedAt')
    .reverse()
    .limit(maxSessions + 1) // +1 to account for current session
    .toArray()

  // Filter out current session and get summaries
  const summaries: SessionSummary[] = []
  const allTopics: string[] = []
  const allFacts: string[] = []

  for (const session of sessions) {
    if (session.id === excludeSessionId) continue
    if (summaries.length >= maxSessions) break

    const summary = await summarizeSession(session.id!)
    if (summary && summary.messageCount > 2) {
      summaries.push(summary)
      allTopics.push(...summary.topics)
      allFacts.push(...summary.keyFacts)
    }
  }

  // Deduplicate and rank topics
  const topicCounts: Record<string, number> = {}
  for (const topic of allTopics) {
    topicCounts[topic] = (topicCounts[topic] || 0) + 1
  }
  const recentTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic]) => topic)

  return {
    summaries,
    recentTopics,
    keyFacts: [...new Set(allFacts)].slice(0, 15),
    lastUpdated: new Date(),
    totalSessions: sessions.length - 1, // Exclude current
  }
}

/**
 * Format conversation memory as context for the LLM
 */
export function formatMemoryContext(memory: ConversationMemory): string {
  if (memory.summaries.length === 0 && memory.keyFacts.length === 0) {
    return ''
  }

  const parts: string[] = []

  // Add key facts about the user
  if (memory.keyFacts.length > 0) {
    parts.push('Things I know about this user:')
    for (const fact of memory.keyFacts.slice(0, 8)) {
      parts.push(`- ${fact}`)
    }
  }

  // Add recent topics
  if (memory.recentTopics.length > 0) {
    parts.push('\nTopics from recent conversations: ' + memory.recentTopics.join(', '))
  }

  // Add brief session summaries
  if (memory.summaries.length > 0) {
    parts.push('\nRecent conversation history:')
    for (const summary of memory.summaries.slice(0, 3)) {
      const date = summary.date.toLocaleDateString()
      const topics = summary.topics.slice(0, 3).join(', ')
      parts.push(`- ${date}: Discussed ${topics} (${summary.messageCount} messages)`)
    }
  }

  return parts.join('\n')
}

/**
 * Get formatted memory context ready for LLM injection
 * This is the main function to call from the LLM module
 */
export async function getMemoryContextForLLM(
  currentSessionId: string
): Promise<string> {
  try {
    const memory = await getConversationMemory(currentSessionId)
    return formatMemoryContext(memory)
  } catch (error) {
    console.warn('Failed to get conversation memory:', error)
    return ''
  }
}

// Cache for memory context to avoid repeated DB queries
let cachedMemoryContext: string | null = null
let cachedSessionId: string | null = null
let cacheTimestamp = 0
const CACHE_DURATION_MS = 60 * 1000 // 1 minute

/**
 * Get cached memory context for better performance
 */
export async function getCachedMemoryContext(
  currentSessionId: string
): Promise<string> {
  const now = Date.now()

  // Return cache if valid
  if (
    cachedMemoryContext !== null &&
    cachedSessionId === currentSessionId &&
    (now - cacheTimestamp) < CACHE_DURATION_MS
  ) {
    return cachedMemoryContext
  }

  // Refresh cache
  cachedMemoryContext = await getMemoryContextForLLM(currentSessionId)
  cachedSessionId = currentSessionId
  cacheTimestamp = now

  return cachedMemoryContext
}

/**
 * Invalidate the memory cache (call when new messages are added)
 */
export function invalidateMemoryCache(): void {
  cachedMemoryContext = null
  cachedSessionId = null
  cacheTimestamp = 0
}
