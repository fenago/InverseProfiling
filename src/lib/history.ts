/**
 * Historical Tracking and Trend Analysis Module
 * Phase 2: Track profile changes over time and detect trends
 *
 * Features:
 * - Domain score history snapshots
 * - Trend detection (improving, stable, declining)
 * - Session-based analytics
 * - Profile evolution tracking
 */

import {
  initSqlDatabase,
  recordDomainHistory,
  getDomainScores,
  getDb,
  saveDatabase,
} from './sqldb'
import { db } from './db'

// Types
export interface HistoricalSnapshot {
  timestamp: Date
  domainName: string
  score: number
  confidence: number
  dataPointsCount: number
  sessionId?: string
}

export interface TrendAnalysis {
  domain: string
  currentScore: number
  previousScore: number
  change: number
  changePercent: number
  trend: 'improving' | 'stable' | 'declining'
  dataPoints: number
  confidence: number
  history: Array<{ timestamp: Date; score: number }>
}

export interface SessionAnalytics {
  sessionId: string
  startTime: Date
  endTime?: Date
  messageCount: number
  totalWords: number
  avgResponseTime?: number
  dominantTopics: string[]
  emotionalTone: number
  engagementScore: number
}

export interface ProfileEvolution {
  timeRange: {
    start: Date
    end: Date
  }
  snapshots: number
  domains: Record<string, TrendAnalysis>
  significantChanges: Array<{
    domain: string
    change: number
    timestamp: Date
    direction: 'up' | 'down'
  }>
  overallStability: number // 0-1, how stable the profile is
}

// ==================== SNAPSHOT FUNCTIONS ====================

/**
 * Take a snapshot of all current domain scores
 */
export async function takeProfileSnapshot(sessionId?: string): Promise<void> {
  await initSqlDatabase()

  const domainScores = await getDomainScores()

  for (const score of domainScores) {
    // recordDomainHistory expects: (domainId, score, confidence, dataPointsCount, trigger)
    await recordDomainHistory(
      score.domainId,
      score.score,
      score.confidence,
      score.dataPointsCount,
      sessionId ? 'manual' : 'scheduled'
    )
  }

  saveDatabase()
}

/**
 * Get domain history from SQL database
 */
export async function getDomainHistory(
  domainName?: string,
  limit: number = 100
): Promise<HistoricalSnapshot[]> {
  const sqlDb = await getDb()
  if (!sqlDb) return []

  let query = 'SELECT * FROM domain_history'
  const params: (string | number)[] = []

  if (domainName) {
    query += ' WHERE domain_id = ?'
    params.push(domainName)
  }

  query += ' ORDER BY recorded_at DESC LIMIT ?'
  params.push(limit)

  try {
    const results = sqlDb.exec(query, params)
    if (!results || results.length === 0) return []

    const columns = results[0].columns
    return results[0].values.map((row) => {
      const obj: Record<string, unknown> = {}
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i]
      })
      return {
        timestamp: new Date(obj.recorded_at as string),
        domainName: obj.domain_id as string,
        score: obj.score as number,
        confidence: obj.confidence as number,
        dataPointsCount: obj.data_points_count as number,
        sessionId: obj.trigger as string | undefined, // trigger field used for context
      }
    })
  } catch (error) {
    console.error('Error getting domain history:', error)
    return []
  }
}

// ==================== TREND ANALYSIS ====================

/**
 * Analyze trends for a specific domain
 */
export async function analyzeDomainTrend(
  domainName: string,
  timeWindowDays: number = 7
): Promise<TrendAnalysis | null> {
  const history = await getDomainHistory(domainName, 100)

  if (history.length === 0) {
    return null
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays)

  // Filter to time window
  const recentHistory = history.filter((h) => h.timestamp >= cutoffDate)

  if (recentHistory.length < 2) {
    // Not enough data for trend
    const current = history[0]
    return {
      domain: domainName,
      currentScore: current.score,
      previousScore: current.score,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      dataPoints: current.dataPointsCount,
      confidence: current.confidence,
      history: history.map((h) => ({ timestamp: h.timestamp, score: h.score })),
    }
  }

  const currentScore = recentHistory[0].score
  const oldestInWindow = recentHistory[recentHistory.length - 1].score
  const change = currentScore - oldestInWindow
  const changePercent = oldestInWindow !== 0 ? (change / oldestInWindow) * 100 : 0

  // Determine trend based on change magnitude
  let trend: 'improving' | 'stable' | 'declining'
  if (Math.abs(change) < 0.05) {
    trend = 'stable'
  } else if (change > 0) {
    trend = 'improving'
  } else {
    trend = 'declining'
  }

  return {
    domain: domainName,
    currentScore,
    previousScore: oldestInWindow,
    change,
    changePercent: Math.round(changePercent * 10) / 10,
    trend,
    dataPoints: recentHistory[0].dataPointsCount,
    confidence: recentHistory[0].confidence,
    history: history.slice(0, 20).map((h) => ({
      timestamp: h.timestamp,
      score: h.score,
    })),
  }
}

/**
 * Analyze trends for all domains
 */
export async function analyzeAllTrends(
  timeWindowDays: number = 7
): Promise<Record<string, TrendAnalysis>> {
  const domains = [
    'big_five_openness',
    'big_five_conscientiousness',
    'big_five_extraversion',
    'big_five_agreeableness',
    'big_five_neuroticism',
    'cognitive_abilities',
    'emotional_intelligence',
    'values_motivations',
    'moral_reasoning',
    'decision_making',
    'creativity',
    'attachment_style',
    'learning_styles',
    'information_processing',
    'metacognition',
    'executive_functions',
    'communication_styles',
    'social_cognition',
    'resilience_coping',
    'mindset_growth_fixed',
    'political_ideology',
    'cultural_values',
    'work_career_style',
    'sensory_processing',
    'time_perspective',
    'aesthetic_preferences',
  ]

  const trends: Record<string, TrendAnalysis> = {}

  for (const domain of domains) {
    const trend = await analyzeDomainTrend(domain, timeWindowDays)
    if (trend) {
      trends[domain] = trend
    }
  }

  return trends
}

// ==================== SESSION ANALYTICS ====================

/**
 * Get analytics for a specific session
 */
export async function getSessionAnalytics(
  sessionId: string
): Promise<SessionAnalytics | null> {
  // Get messages from Dexie
  const messages = await db.messages
    .where('sessionId')
    .equals(sessionId)
    .toArray()

  if (messages.length === 0) {
    return null
  }

  const userMessages = messages.filter((m) => m.role === 'user')

  // Calculate basic stats
  const totalWords = userMessages.reduce((sum, m) => {
    return sum + m.content.split(/\s+/).filter((w) => w.length > 0).length
  }, 0)

  const timestamps = messages.map((m) => new Date(m.timestamp).getTime())
  const startTime = new Date(Math.min(...timestamps))
  const endTime = new Date(Math.max(...timestamps))

  // Simple topic extraction
  const allText = userMessages.map((m) => m.content.toLowerCase()).join(' ')
  const words = allText.split(/\s+/)
  const wordFreq: Record<string, number> = {}
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we',
    'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its',
    'our', 'their', 'this', 'that', 'these', 'those', 'and', 'or', 'but',
  ])

  for (const word of words) {
    if (word.length > 3 && !stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    }
  }

  const dominantTopics = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)

  // Calculate engagement score (based on message count and length)
  const engagementScore = Math.min(
    1,
    (userMessages.length * 0.1 + totalWords * 0.001)
  )

  return {
    sessionId,
    startTime,
    endTime,
    messageCount: messages.length,
    totalWords,
    dominantTopics,
    emotionalTone: 50, // Would be calculated from analysis
    engagementScore: Math.round(engagementScore * 100) / 100,
  }
}

/**
 * Get all session analytics
 */
export async function getAllSessionAnalytics(): Promise<SessionAnalytics[]> {
  const sessions = await db.sessions.toArray()
  const analytics: SessionAnalytics[] = []

  for (const session of sessions) {
    if (!session.id) continue
    const sessionAnalytics = await getSessionAnalytics(session.id)
    if (sessionAnalytics) {
      analytics.push(sessionAnalytics)
    }
  }

  return analytics.sort(
    (a, b) => b.startTime.getTime() - a.startTime.getTime()
  )
}

// ==================== PROFILE EVOLUTION ====================

/**
 * Analyze profile evolution over time
 */
export async function analyzeProfileEvolution(
  timeWindowDays: number = 30
): Promise<ProfileEvolution> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays)

  // Get all trends
  const trends = await analyzeAllTrends(timeWindowDays)

  // Get all history for significant changes
  const allHistory = await getDomainHistory(undefined, 500)
  const recentHistory = allHistory.filter((h) => h.timestamp >= cutoffDate)

  // Find significant changes (> 10% change)
  const significantChanges: Array<{
    domain: string
    change: number
    timestamp: Date
    direction: 'up' | 'down'
  }> = []

  for (const [domain, trend] of Object.entries(trends)) {
    if (Math.abs(trend.changePercent) > 10) {
      significantChanges.push({
        domain,
        change: trend.change,
        timestamp: new Date(),
        direction: trend.change > 0 ? 'up' : 'down',
      })
    }
  }

  // Calculate overall stability (inverse of average change)
  const avgChange =
    Object.values(trends).reduce(
      (sum, t) => sum + Math.abs(t.changePercent),
      0
    ) / Math.max(Object.keys(trends).length, 1)
  const overallStability = Math.max(0, 1 - avgChange / 100)

  return {
    timeRange: {
      start: cutoffDate,
      end: new Date(),
    },
    snapshots: recentHistory.length,
    domains: trends,
    significantChanges,
    overallStability: Math.round(overallStability * 100) / 100,
  }
}

// ==================== COMPARISON FUNCTIONS ====================

/**
 * Compare profile between two time periods
 */
export async function compareProfiles(
  period1End: Date,
  period2End: Date,
  windowDays: number = 7
): Promise<{
  period1: Record<string, number>
  period2: Record<string, number>
  changes: Record<string, { absolute: number; percent: number }>
}> {
  const history = await getDomainHistory(undefined, 1000)

  const period1Start = new Date(period1End)
  period1Start.setDate(period1Start.getDate() - windowDays)

  const period2Start = new Date(period2End)
  period2Start.setDate(period2Start.getDate() - windowDays)

  // Get average scores for each period
  const period1Scores: Record<string, number[]> = {}
  const period2Scores: Record<string, number[]> = {}

  for (const h of history) {
    if (h.timestamp >= period1Start && h.timestamp <= period1End) {
      if (!period1Scores[h.domainName]) period1Scores[h.domainName] = []
      period1Scores[h.domainName].push(h.score)
    }
    if (h.timestamp >= period2Start && h.timestamp <= period2End) {
      if (!period2Scores[h.domainName]) period2Scores[h.domainName] = []
      period2Scores[h.domainName].push(h.score)
    }
  }

  // Calculate averages
  const period1Avg: Record<string, number> = {}
  const period2Avg: Record<string, number> = {}
  const changes: Record<string, { absolute: number; percent: number }> = {}

  const allDomains = new Set([
    ...Object.keys(period1Scores),
    ...Object.keys(period2Scores),
  ])

  for (const domain of allDomains) {
    const p1Values = period1Scores[domain] || []
    const p2Values = period2Scores[domain] || []

    const p1Avg =
      p1Values.length > 0
        ? p1Values.reduce((a, b) => a + b, 0) / p1Values.length
        : 0
    const p2Avg =
      p2Values.length > 0
        ? p2Values.reduce((a, b) => a + b, 0) / p2Values.length
        : 0

    period1Avg[domain] = Math.round(p1Avg * 1000) / 1000
    period2Avg[domain] = Math.round(p2Avg * 1000) / 1000

    const absoluteChange = p2Avg - p1Avg
    const percentChange = p1Avg !== 0 ? (absoluteChange / p1Avg) * 100 : 0

    changes[domain] = {
      absolute: Math.round(absoluteChange * 1000) / 1000,
      percent: Math.round(percentChange * 10) / 10,
    }
  }

  return {
    period1: period1Avg,
    period2: period2Avg,
    changes,
  }
}

// ==================== SCHEDULED TASKS ====================

/**
 * Auto-snapshot that runs periodically
 * Should be called at session end or periodically
 */
export async function autoSnapshot(sessionId?: string): Promise<void> {
  // Check if enough time has passed since last snapshot
  const history = await getDomainHistory(undefined, 1)

  if (history.length > 0) {
    const lastSnapshot = history[0].timestamp
    const hoursSinceSnapshot =
      (Date.now() - lastSnapshot.getTime()) / (1000 * 60 * 60)

    // Only snapshot if > 1 hour since last one
    if (hoursSinceSnapshot < 1) {
      return
    }
  }

  await takeProfileSnapshot(sessionId)
}

/**
 * Get historical stats summary
 */
export async function getHistoricalStats(): Promise<{
  totalSnapshots: number
  oldestSnapshot: Date | null
  newestSnapshot: Date | null
  domainsTracked: number
  avgSnapshotsPerDay: number
}> {
  const history = await getDomainHistory(undefined, 10000)

  if (history.length === 0) {
    return {
      totalSnapshots: 0,
      oldestSnapshot: null,
      newestSnapshot: null,
      domainsTracked: 0,
      avgSnapshotsPerDay: 0,
    }
  }

  const uniqueDomains = new Set(history.map((h) => h.domainName))
  const timestamps = history.map((h) => h.timestamp.getTime())
  const oldestTimestamp = Math.min(...timestamps)
  const newestTimestamp = Math.max(...timestamps)

  const dayRange = (newestTimestamp - oldestTimestamp) / (1000 * 60 * 60 * 24)
  const avgPerDay = dayRange > 0 ? history.length / dayRange : history.length

  return {
    totalSnapshots: history.length,
    oldestSnapshot: new Date(oldestTimestamp),
    newestSnapshot: new Date(newestTimestamp),
    domainsTracked: uniqueDomains.size,
    avgSnapshotsPerDay: Math.round(avgPerDay * 10) / 10,
  }
}
