import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import {
  Activity,
  MessageSquare,
  Brain,
  Database,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { db, type ActivityLog, type Message, type LinguisticAnalysis } from '../lib/db'

const ACTIVITY_COLORS: Record<ActivityLog['type'], string> = {
  message: '#3b82f6',
  analysis: '#8b5cf6',
  profile_update: '#10b981',
  model_load: '#f59e0b',
  export: '#06b6d4',
  delete: '#ef4444',
}

const ACTIVITY_ICONS: Record<ActivityLog['type'], typeof Activity> = {
  message: MessageSquare,
  analysis: Brain,
  profile_update: TrendingUp,
  model_load: Database,
  export: Database,
  delete: Database,
}

type TimeFilter = 'all' | 'today' | 'week' | 'month'

export default function ActivityDashboard() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [analyses, setAnalyses] = useState<LinguisticAnalysis[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [typeFilter, setTypeFilter] = useState<ActivityLog['type'] | 'all'>('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [activitiesData, messagesData, analysesData] = await Promise.all([
      db.activityLogs.orderBy('timestamp').reverse().toArray(),
      db.messages.toArray(),
      db.linguisticAnalyses.toArray(),
    ])

    setActivities(activitiesData)
    setMessages(messagesData)
    setAnalyses(analysesData)
  }

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    const now = new Date()
    const activityDate = new Date(activity.timestamp)

    // Time filter
    if (timeFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      if (activityDate < today) return false
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      if (activityDate < weekAgo) return false
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      if (activityDate < monthAgo) return false
    }

    // Type filter
    if (typeFilter !== 'all' && activity.type !== typeFilter) return false

    return true
  })

  // Prepare activity type distribution
  const activityTypeData = Object.entries(
    filteredActivities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
    color: ACTIVITY_COLORS[name as ActivityLog['type']],
  }))

  // Prepare messages per day chart
  const messagesPerDay = messages.reduce((acc, msg) => {
    const date = new Date(msg.timestamp).toLocaleDateString()
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const messagesChartData = Object.entries(messagesPerDay)
    .slice(-14) // Last 14 days
    .map(([date, count]) => ({
      date: date.split('/').slice(0, 2).join('/'),
      messages: count,
    }))

  // Prepare emotional tone over time
  const toneOverTime = analyses
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-20)
    .map((analysis, index) => ({
      index: index + 1,
      tone: analysis.metrics.emotionalTone,
      complexity: analysis.metrics.cognitiveComplexity,
    }))

  // Stats
  const stats = {
    totalActivities: filteredActivities.length,
    totalMessages: messages.length,
    totalAnalyses: analyses.length,
    avgWordsPerMessage:
      messages.length > 0
        ? Math.round(
            messages.reduce(
              (sum, m) => sum + m.content.split(/\s+/).length,
              0
            ) / messages.length
          )
        : 0,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Dashboard</h1>
          <p className="text-gray-500">
            Monitor all system activity and data collection
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as ActivityLog['type'] | 'all')
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="message">Messages</option>
            <option value="analysis">Analysis</option>
            <option value="profile_update">Profile Updates</option>
            <option value="model_load">Model Loads</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalActivities}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Messages</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalMessages}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Analyses Run</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalAnalyses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Words/Message</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgWordsPerMessage}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Distribution */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Activity Distribution
          </h2>
          {activityTypeData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {activityTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No activity data yet
            </div>
          )}
        </div>

        {/* Messages Per Day */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Messages Over Time
          </h2>
          {messagesChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={messagesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="messages" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No message data yet
            </div>
          )}
        </div>
      </div>

      {/* Emotional Tone Over Time */}
      {toneOverTime.length > 1 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Emotional & Cognitive Trends
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={toneOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                <YAxis domain={[-1, 1]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="tone"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Emotional Tone"
                />
                <Line
                  type="monotone"
                  dataKey="complexity"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Cognitive Complexity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Activity Log
          </h2>
          <p className="text-sm text-gray-500">
            Detailed record of all system events
          </p>
        </div>
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {filteredActivities.length > 0 ? (
            filteredActivities.slice(0, 50).map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type]
              return (
                <div
                  key={activity.id}
                  className="p-4 hover:bg-gray-50 flex items-start gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${ACTIVITY_COLORS[activity.type]}20`,
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: ACTIVITY_COLORS[activity.type] }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${ACTIVITY_COLORS[activity.type]}20`,
                          color: ACTIVITY_COLORS[activity.type],
                        }}
                      >
                        {activity.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 truncate">
                      {activity.description}
                    </p>
                    {activity.metadata && (
                      <p className="text-xs text-gray-400 mt-1">
                        {JSON.stringify(activity.metadata)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No activities recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
