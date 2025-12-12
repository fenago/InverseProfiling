// SQL Database Layer using sql.js (SQLite in WebAssembly)
// Phase 2: Full schema for domain scores, feature counts, behavioral metrics, etc.

import initSqlJs, { Database } from 'sql.js'

let db: Database | null = null
let initPromise: Promise<Database> | null = null

// Debounced save state - prevents excessive saves to localStorage
let saveTimeout: ReturnType<typeof setTimeout> | null = null
let pendingSave = false
const SAVE_DEBOUNCE_MS = 1000 // Max save frequency: once per second

// Initialize SQL.js and create database
export async function initSqlDatabase(): Promise<Database> {
  if (db) return db
  if (initPromise) return initPromise

  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    })

    // Try to load existing database from localStorage
    const savedDb = localStorage.getItem('qmu_sql_db') || localStorage.getItem('digital_twin_sql_db') // Migration: check both keys
    if (savedDb) {
      const binaryArray = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0))
      db = new SQL.Database(binaryArray)
      // Run migrations to ensure all tables exist (handles schema updates)
      await runMigrations(db)
    } else {
      db = new SQL.Database()
      await createTables(db)
      await insertInitialData(db)
    }

    return db
  })()

  return initPromise
}

// Save database to localStorage (immediate)
export function saveDatabase(): void {
  if (!db) return
  const data = db.export()

  // Process in chunks to avoid stack overflow with large databases
  // The spread operator (...data) fails when the array is too large
  const CHUNK_SIZE = 8192
  let binary = ''
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.subarray(i, Math.min(i + CHUNK_SIZE, data.length))
    binary += String.fromCharCode.apply(null, chunk as unknown as number[])
  }
  const base64 = btoa(binary)
  localStorage.setItem('qmu_sql_db', base64)
  pendingSave = false
}

// Schedule a debounced save - coalesces multiple saves into one
// Use this for high-frequency operations to avoid excessive localStorage writes
export function scheduleSave(): void {
  pendingSave = true
  if (saveTimeout) return // Already scheduled

  saveTimeout = setTimeout(() => {
    saveTimeout = null
    if (pendingSave) {
      saveDatabase()
    }
  }, SAVE_DEBOUNCE_MS)
}

// Flush any pending saves immediately (call before page unload)
export function flushPendingSave(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }
  if (pendingSave) {
    saveDatabase()
  }
}

// Create all Phase 2 tables
async function createTables(database: Database): Promise<void> {
  // === PROFILES TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY DEFAULT 'default',
      created_at TEXT DEFAULT (datetime('now')),
      last_updated TEXT DEFAULT (datetime('now')),
      schema_version INTEGER DEFAULT 2,
      total_messages INTEGER DEFAULT 0,
      total_words INTEGER DEFAULT 0,
      total_sessions INTEGER DEFAULT 0,
      first_interaction TEXT,
      profile_completeness REAL DEFAULT 0.0,
      last_full_analysis TEXT
    )
  `)

  // === DOMAIN SCORES TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS domain_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id TEXT NOT NULL UNIQUE,
      domain_category TEXT NOT NULL,
      score REAL NOT NULL DEFAULT 0.5,
      raw_score REAL,
      confidence REAL NOT NULL DEFAULT 0.0,
      last_updated TEXT DEFAULT (datetime('now')),
      data_points_count INTEGER DEFAULT 0
    )
  `)

  // === FEATURE COUNTS TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS feature_counts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      feature_name TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      total_words_analyzed INTEGER DEFAULT 0,
      percentage REAL DEFAULT 0.0,
      last_updated TEXT DEFAULT (datetime('now')),
      sample_size INTEGER DEFAULT 0,
      UNIQUE(category, feature_name)
    )
  `)

  // === BEHAVIORAL METRICS TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS behavioral_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_name TEXT NOT NULL UNIQUE,
      current_value REAL DEFAULT 0.0,
      cumulative_value REAL DEFAULT 0.0,
      min_value REAL,
      max_value REAL,
      sample_size INTEGER DEFAULT 0,
      std_deviation REAL,
      last_updated TEXT DEFAULT (datetime('now')),
      unit TEXT
    )
  `)

  // === DOMAIN HISTORY TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS domain_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id TEXT NOT NULL,
      score REAL NOT NULL,
      confidence REAL NOT NULL,
      data_points_count INTEGER,
      recorded_at TEXT DEFAULT (datetime('now')),
      trigger TEXT
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_domain_history_domain ON domain_history(domain_id)')
  database.run('CREATE INDEX IF NOT EXISTS idx_domain_history_time ON domain_history(recorded_at)')

  // === CONFIDENCE FACTORS TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS confidence_factors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id TEXT NOT NULL,
      factor_name TEXT NOT NULL,
      value REAL NOT NULL DEFAULT 0.0,
      weight REAL DEFAULT 1.0,
      last_updated TEXT DEFAULT (datetime('now')),
      UNIQUE(domain_id, factor_name)
    )
  `)

  // === MATCHED WORDS TABLE (for showing detected word examples) ===
  database.run(`
    CREATE TABLE IF NOT EXISTS matched_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      feature_name TEXT NOT NULL,
      word TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      last_seen TEXT DEFAULT (datetime('now')),
      UNIQUE(category, feature_name, word)
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_matched_words_feature ON matched_words(category, feature_name)')

  // === SCHEMA VERSIONS TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS schema_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      database_name TEXT NOT NULL,
      version INTEGER NOT NULL,
      applied_at TEXT DEFAULT (datetime('now')),
      migration_script TEXT
    )
  `)

  // === HYBRID SIGNAL SCORES TABLE (stores LIWC/Embedding/LLM signals) ===
  database.run(`
    CREATE TABLE IF NOT EXISTS hybrid_signal_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id TEXT NOT NULL,
      signal_type TEXT NOT NULL,
      score REAL NOT NULL DEFAULT 0.5,
      confidence REAL NOT NULL DEFAULT 0.0,
      weight_used REAL NOT NULL DEFAULT 0.0,
      evidence_text TEXT,
      matched_words TEXT,
      prototype_similarity REAL,
      last_updated TEXT DEFAULT (datetime('now')),
      UNIQUE(domain_id, signal_type)
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_hybrid_signal_domain ON hybrid_signal_scores(domain_id)')
}

// Run migrations for existing databases to ensure all tables exist
// This handles schema updates for databases created before new tables were added
async function runMigrations(database: Database): Promise<void> {
  // === MATCHED WORDS TABLE (added in schema update) ===
  database.run(`
    CREATE TABLE IF NOT EXISTS matched_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      feature_name TEXT NOT NULL,
      word TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      last_seen TEXT DEFAULT (datetime('now')),
      UNIQUE(category, feature_name, word)
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_matched_words_feature ON matched_words(category, feature_name)')

  // === SCHEMA VERSIONS TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS schema_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      database_name TEXT NOT NULL,
      version INTEGER NOT NULL,
      applied_at TEXT DEFAULT (datetime('now')),
      migration_script TEXT
    )
  `)

  // === CONFIDENCE FACTORS TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS confidence_factors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id TEXT NOT NULL,
      factor_name TEXT NOT NULL,
      value REAL NOT NULL DEFAULT 0.0,
      weight REAL DEFAULT 1.0,
      last_updated TEXT DEFAULT (datetime('now')),
      UNIQUE(domain_id, factor_name)
    )
  `)

  // === HYBRID SIGNAL SCORES TABLE (stores LIWC/Embedding/LLM signals) ===
  database.run(`
    CREATE TABLE IF NOT EXISTS hybrid_signal_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id TEXT NOT NULL,
      signal_type TEXT NOT NULL,
      score REAL NOT NULL DEFAULT 0.5,
      confidence REAL NOT NULL DEFAULT 0.0,
      weight_used REAL NOT NULL DEFAULT 0.0,
      evidence_text TEXT,
      matched_words TEXT,
      prototype_similarity REAL,
      last_updated TEXT DEFAULT (datetime('now')),
      UNIQUE(domain_id, signal_type)
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_hybrid_signal_domain ON hybrid_signal_scores(domain_id)')

  // === ENSURE ALL 39 PRD DOMAINS EXIST (migration for existing databases) ===
  const allDomains = [
    // Category A: Core Personality (Big Five)
    { id: 'big_five_openness', category: 'Core Personality (Big Five)' },
    { id: 'big_five_conscientiousness', category: 'Core Personality (Big Five)' },
    { id: 'big_five_extraversion', category: 'Core Personality (Big Five)' },
    { id: 'big_five_agreeableness', category: 'Core Personality (Big Five)' },
    { id: 'big_five_neuroticism', category: 'Core Personality (Big Five)' },
    // Category B: Dark Personality
    { id: 'dark_triad_narcissism', category: 'Dark Personality' },
    { id: 'dark_triad_machiavellianism', category: 'Dark Personality' },
    { id: 'dark_triad_psychopathy', category: 'Dark Personality' },
    // Category C: Emotional/Social Intelligence
    { id: 'emotional_empathy', category: 'Emotional/Social Intelligence' },
    { id: 'emotional_intelligence', category: 'Emotional/Social Intelligence' },
    { id: 'attachment_style', category: 'Emotional/Social Intelligence' },
    { id: 'love_languages', category: 'Emotional/Social Intelligence' },
    { id: 'communication_style', category: 'Emotional/Social Intelligence' },
    // Category D: Decision Making & Motivation
    { id: 'risk_tolerance', category: 'Decision Making & Motivation' },
    { id: 'decision_style', category: 'Decision Making & Motivation' },
    { id: 'time_orientation', category: 'Decision Making & Motivation' },
    { id: 'achievement_motivation', category: 'Decision Making & Motivation' },
    { id: 'self_efficacy', category: 'Decision Making & Motivation' },
    { id: 'locus_of_control', category: 'Decision Making & Motivation' },
    { id: 'growth_mindset', category: 'Decision Making & Motivation' },
    // Category E: Values & Wellbeing
    { id: 'personal_values', category: 'Values & Wellbeing' },
    { id: 'interests', category: 'Values & Wellbeing' },
    { id: 'life_satisfaction', category: 'Values & Wellbeing' },
    { id: 'stress_coping', category: 'Values & Wellbeing' },
    { id: 'social_support', category: 'Values & Wellbeing' },
    { id: 'authenticity', category: 'Values & Wellbeing' },
    // Category F: Cognitive/Learning
    { id: 'cognitive_abilities', category: 'Cognitive/Learning' },
    { id: 'creativity', category: 'Cognitive/Learning' },
    { id: 'learning_styles', category: 'Cognitive/Learning' },
    { id: 'information_processing', category: 'Cognitive/Learning' },
    { id: 'metacognition', category: 'Cognitive/Learning' },
    { id: 'executive_functions', category: 'Cognitive/Learning' },
    // Category G: Social/Cultural/Values
    { id: 'social_cognition', category: 'Social/Cultural/Values' },
    { id: 'political_ideology', category: 'Social/Cultural/Values' },
    { id: 'cultural_values', category: 'Social/Cultural/Values' },
    { id: 'moral_reasoning', category: 'Social/Cultural/Values' },
    { id: 'work_career_style', category: 'Social/Cultural/Values' },
    // Category H: Sensory/Aesthetic
    { id: 'sensory_processing', category: 'Sensory/Aesthetic' },
    { id: 'aesthetic_preferences', category: 'Sensory/Aesthetic' },
  ]

  for (const domain of allDomains) {
    // Insert domain if it doesn't exist
    database.run(
      `INSERT OR IGNORE INTO domain_scores (domain_id, domain_category, score, confidence)
       VALUES (?, ?, 0.5, 0.0)`,
      [domain.id, domain.category]
    )
    // Insert confidence factors for each domain if they don't exist
    const factors = ['data_volume', 'consistency', 'temporal_stability', 'cross_validation']
    for (const factor of factors) {
      database.run(
        `INSERT OR IGNORE INTO confidence_factors (domain_id, factor_name, value, weight)
         VALUES (?, ?, 0.0, 0.25)`,
        [domain.id, factor]
      )
    }
  }

  console.log('Database migrations completed (39 PRD domains ensured)')
}

// Insert initial data for all domains, features, and metrics
async function insertInitialData(database: Database): Promise<void> {
  // Insert default profile
  database.run(`
    INSERT OR IGNORE INTO profiles (id, created_at, last_updated)
    VALUES ('default', datetime('now'), datetime('now'))
  `)

  // === INSERT ALL 39 DOMAINS (from Fine-Tuned-Psychometrics.md PRD) ===
  const domains = [
    // Category A: Core Personality (Domains 1-5) - Big Five
    { id: 'big_five_openness', category: 'Core Personality (Big Five)' },
    { id: 'big_five_conscientiousness', category: 'Core Personality (Big Five)' },
    { id: 'big_five_extraversion', category: 'Core Personality (Big Five)' },
    { id: 'big_five_agreeableness', category: 'Core Personality (Big Five)' },
    { id: 'big_five_neuroticism', category: 'Core Personality (Big Five)' },

    // Category B: Dark Personality (Domains 6-8)
    { id: 'dark_triad_narcissism', category: 'Dark Personality' },
    { id: 'dark_triad_machiavellianism', category: 'Dark Personality' },
    { id: 'dark_triad_psychopathy', category: 'Dark Personality' },

    // Category C: Emotional/Social Intelligence (Domains 9-13)
    { id: 'emotional_empathy', category: 'Emotional/Social Intelligence' },
    { id: 'emotional_intelligence', category: 'Emotional/Social Intelligence' },
    { id: 'attachment_style', category: 'Emotional/Social Intelligence' },
    { id: 'love_languages', category: 'Emotional/Social Intelligence' },
    { id: 'communication_style', category: 'Emotional/Social Intelligence' },

    // Category D: Decision Making & Motivation (Domains 14-20)
    { id: 'risk_tolerance', category: 'Decision Making & Motivation' },
    { id: 'decision_style', category: 'Decision Making & Motivation' },
    { id: 'time_orientation', category: 'Decision Making & Motivation' },
    { id: 'achievement_motivation', category: 'Decision Making & Motivation' },
    { id: 'self_efficacy', category: 'Decision Making & Motivation' },
    { id: 'locus_of_control', category: 'Decision Making & Motivation' },
    { id: 'growth_mindset', category: 'Decision Making & Motivation' },

    // Category E: Values & Wellbeing (Domains 21-26)
    { id: 'personal_values', category: 'Values & Wellbeing' },
    { id: 'interests', category: 'Values & Wellbeing' },
    { id: 'life_satisfaction', category: 'Values & Wellbeing' },
    { id: 'stress_coping', category: 'Values & Wellbeing' },
    { id: 'social_support', category: 'Values & Wellbeing' },
    { id: 'authenticity', category: 'Values & Wellbeing' },

    // Category F: Cognitive/Learning (Domains 27-32)
    { id: 'cognitive_abilities', category: 'Cognitive/Learning' },
    { id: 'creativity', category: 'Cognitive/Learning' },
    { id: 'learning_styles', category: 'Cognitive/Learning' },
    { id: 'information_processing', category: 'Cognitive/Learning' },
    { id: 'metacognition', category: 'Cognitive/Learning' },
    { id: 'executive_functions', category: 'Cognitive/Learning' },

    // Category G: Social/Cultural/Values (Domains 33-37)
    { id: 'social_cognition', category: 'Social/Cultural/Values' },
    { id: 'political_ideology', category: 'Social/Cultural/Values' },
    { id: 'cultural_values', category: 'Social/Cultural/Values' },
    { id: 'moral_reasoning', category: 'Social/Cultural/Values' },
    { id: 'work_career_style', category: 'Social/Cultural/Values' },

    // Category H: Sensory/Aesthetic (Domains 38-39)
    { id: 'sensory_processing', category: 'Sensory/Aesthetic' },
    { id: 'aesthetic_preferences', category: 'Sensory/Aesthetic' },
  ]

  for (const domain of domains) {
    database.run(
      `INSERT OR IGNORE INTO domain_scores (domain_id, domain_category, score, confidence)
       VALUES (?, ?, 0.5, 0.0)`,
      [domain.id, domain.category]
    )

    // Insert confidence factors for each domain
    const factors = ['data_volume', 'consistency', 'temporal_stability', 'cross_validation']
    for (const factor of factors) {
      database.run(
        `INSERT OR IGNORE INTO confidence_factors (domain_id, factor_name, value, weight)
         VALUES (?, ?, 0.0, 0.25)`,
        [domain.id, factor]
      )
    }
  }

  // === INSERT FEATURE COUNTS FOR ALL LIWC CATEGORIES ===
  const featureCategories = [
    // LIWC Summary Variables
    { category: 'liwc_summary', features: ['analytical_thinking', 'clout', 'authenticity', 'emotional_tone'] },
    // Pronouns
    { category: 'pronoun', features: ['first_person_singular', 'first_person_plural', 'second_person', 'third_person_singular', 'third_person_plural'] },
    // Cognitive Processes
    { category: 'cognitive', features: ['insight', 'causation', 'discrepancy', 'tentative', 'certainty', 'differentiation'] },
    // Affect/Emotion
    { category: 'affect', features: ['positive_emotion', 'negative_emotion', 'anxiety', 'anger', 'sadness', 'joy', 'trust', 'fear', 'surprise', 'disgust'] },
    // Social Processes
    { category: 'social', features: ['family', 'friends', 'social_general', 'affiliation', 'achievement', 'power'] },
    // Drives
    { category: 'drives', features: ['affiliation', 'achievement', 'power', 'reward', 'risk'] },
    // Time Orientation
    { category: 'time', features: ['past_focus', 'present_focus', 'future_focus'] },
    // Perceptual Processes
    { category: 'perceptual', features: ['see', 'hear', 'feel'] },
    // Personal Concerns
    { category: 'personal', features: ['work', 'leisure', 'home', 'money', 'religion', 'death'] },
    // Informal Language
    { category: 'informal', features: ['swear', 'netspeak', 'assent', 'nonfluencies', 'fillers'] },
    // Moral Foundations
    { category: 'moral', features: ['care_harm', 'fairness_cheating', 'loyalty_betrayal', 'authority_subversion', 'sanctity_degradation', 'liberty_oppression'] },
    // Mindset Indicators
    { category: 'mindset', features: ['growth_language', 'fixed_language', 'effort_attribution', 'ability_attribution'] },
    // Metacognition
    { category: 'metacognition', features: ['planning', 'monitoring', 'evaluation', 'self_correction'] },
    // Creativity Indicators
    { category: 'creativity', features: ['novelty_words', 'imagination_words', 'innovation_words'] },
    // Attachment Language
    { category: 'attachment', features: ['trust_words', 'intimacy_words', 'independence_words', 'anxiety_attachment'] },
    // Communication Style
    { category: 'communication', features: ['formal_language', 'informal_language', 'direct_language', 'indirect_language', 'assertive_language', 'hedging_language'] },
    // Executive Function
    { category: 'executive', features: ['inhibition_words', 'shifting_words', 'planning_words', 'organization_words'] },
    // Coping & Resilience
    { category: 'coping', features: ['problem_focused', 'emotion_focused', 'avoidant', 'support_seeking', 'optimism', 'self_efficacy'] },
    // Values (Schwartz)
    { category: 'values', features: ['self_direction', 'stimulation', 'hedonism', 'achievement', 'power_value', 'security', 'conformity', 'tradition', 'benevolence', 'universalism'] },
    // Decision Making
    { category: 'decision', features: ['rational_language', 'intuitive_language', 'dependent_language', 'avoidant_decision', 'spontaneous_language'] },
    // Political/Cultural
    { category: 'political', features: ['authority_language', 'equality_language', 'ingroup_language', 'outgroup_language'] },
    { category: 'cultural', features: ['individualism', 'collectivism'] },
    // Sensory
    { category: 'sensory', features: ['visual_words', 'auditory_words', 'kinesthetic_words', 'olfactory_words', 'gustatory_words'] },
    // Aesthetic
    { category: 'aesthetic', features: ['beauty_words', 'complexity_preference', 'novelty_aesthetic'] },
    // Function Words
    { category: 'function_words', features: ['articles', 'prepositions', 'conjunctions', 'auxiliary_verbs', 'adverbs', 'negations'] },
  ]

  for (const cat of featureCategories) {
    for (const feature of cat.features) {
      database.run(
        `INSERT OR IGNORE INTO feature_counts (category, feature_name, count, total_words_analyzed, percentage, sample_size)
         VALUES (?, ?, 0, 0, 0.0, 0)`,
        [cat.category, feature]
      )
    }
  }

  // === INSERT BEHAVIORAL METRICS ===
  const metrics = [
    // Response patterns
    { name: 'avg_response_length_words', unit: 'words' },
    { name: 'avg_response_length_chars', unit: 'chars' },
    { name: 'avg_sentence_length', unit: 'words' },
    { name: 'avg_sentences_per_message', unit: 'count' },
    // Timing
    { name: 'avg_response_time_ms', unit: 'ms' },
    { name: 'median_response_time_ms', unit: 'ms' },
    { name: 'avg_session_duration_ms', unit: 'ms' },
    { name: 'avg_time_between_sessions_hours', unit: 'hours' },
    // Engagement
    { name: 'avg_messages_per_session', unit: 'count' },
    { name: 'avg_messages_per_conversation', unit: 'count' },
    { name: 'session_frequency_per_week', unit: 'count' },
    { name: 'return_rate', unit: 'ratio' },
    // Content patterns
    { name: 'question_ratio', unit: 'ratio' },
    { name: 'vocabulary_diversity_ttr', unit: 'ratio' },
    { name: 'avg_word_length', unit: 'chars' },
    { name: 'rare_word_ratio', unit: 'ratio' },
    // Complexity
    { name: 'avg_clause_depth', unit: 'count' },
    { name: 'subordinate_clause_ratio', unit: 'ratio' },
    { name: 'lexical_density', unit: 'ratio' },
    // Interaction patterns
    { name: 'topic_persistence_avg', unit: 'messages' },
    { name: 'topic_switching_rate', unit: 'ratio' },
    { name: 'follow_up_question_ratio', unit: 'ratio' },
  ]

  for (const metric of metrics) {
    database.run(
      `INSERT OR IGNORE INTO behavioral_metrics (metric_name, unit, current_value, cumulative_value, sample_size)
       VALUES (?, ?, 0.0, 0.0, 0)`,
      [metric.name, metric.unit]
    )
  }

  // Record schema version
  database.run(
    `INSERT INTO schema_versions (database_name, version, migration_script)
     VALUES ('sqlite', 2, 'Initial Phase 2 schema')`,
    []
  )

  scheduleSave()
}

// ==================== QUERY FUNCTIONS ====================

export async function getDb(): Promise<Database> {
  return initSqlDatabase()
}

// Get all domain scores
export async function getDomainScores(): Promise<DomainScore[]> {
  const database = await getDb()
  const results = database.exec(`
    SELECT domain_id, domain_category, score, confidence, data_points_count, last_updated
    FROM domain_scores
    ORDER BY domain_category, domain_id
  `)
  if (!results.length) return []

  return results[0].values.map((row) => ({
    domainId: row[0] as string,
    category: row[1] as string,
    score: row[2] as number,
    confidence: row[3] as number,
    dataPointsCount: row[4] as number,
    lastUpdated: row[5] as string,
  }))
}

// Update a single domain score using weighted averaging and accumulated data points
export async function updateDomainScore(
  domainId: string,
  newScore: number,
  rawScore: number,
  newDataPoints: number
): Promise<void> {
  const database = await getDb()

  // Only update if we have actual data points to contribute
  if (newDataPoints <= 0) {
    return
  }

  // Get current values for weighted averaging
  const result = database.exec(
    `SELECT score, data_points_count FROM domain_scores WHERE domain_id = ?`,
    [domainId]
  )

  let finalScore = newScore
  let totalDataPoints = newDataPoints

  if (result.length && result[0].values.length) {
    const [currentScore, currentDataPoints] = result[0].values[0] as [number, number]

    if (currentDataPoints > 0) {
      // Use weighted average based on data points
      // New score is weighted by new data points, old score by existing data points
      const totalWeight = currentDataPoints + newDataPoints
      finalScore = (currentScore * currentDataPoints + newScore * newDataPoints) / totalWeight
      totalDataPoints = currentDataPoints + newDataPoints
    }
  }

  database.run(
    `UPDATE domain_scores
     SET score = ?, raw_score = ?, data_points_count = ?, last_updated = datetime('now')
     WHERE domain_id = ?`,
    [finalScore, rawScore, totalDataPoints, domainId]
  )
  scheduleSave()
}

// Update feature counts
export async function updateFeatureCount(
  category: string,
  featureName: string,
  additionalCount: number,
  additionalWords: number
): Promise<void> {
  const database = await getDb()
  database.run(
    `UPDATE feature_counts
     SET count = count + ?,
         total_words_analyzed = total_words_analyzed + ?,
         percentage = CASE WHEN (total_words_analyzed + ?) > 0
                          THEN (count + ?) * 100.0 / (total_words_analyzed + ?)
                          ELSE 0.0 END,
         sample_size = sample_size + 1,
         last_updated = datetime('now')
     WHERE category = ? AND feature_name = ?`,
    [additionalCount, additionalWords, additionalWords, additionalCount, additionalWords, category, featureName]
  )
  scheduleSave()
}

// Update matched words for a feature (store examples of detected words)
export async function updateMatchedWords(
  category: string,
  featureName: string,
  words: string[]
): Promise<void> {
  if (words.length === 0) return

  const database = await getDb()

  // Count occurrences of each word
  const wordCounts: Record<string, number> = {}
  for (const word of words) {
    const lowerWord = word.toLowerCase()
    wordCounts[lowerWord] = (wordCounts[lowerWord] || 0) + 1
  }

  // Insert or update each word
  for (const [word, count] of Object.entries(wordCounts)) {
    database.run(
      `INSERT INTO matched_words (category, feature_name, word, count, last_seen)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(category, feature_name, word)
       DO UPDATE SET count = count + ?, last_seen = datetime('now')`,
      [category, featureName, word, count, count]
    )
  }
  scheduleSave()
}

// Get matched words for a specific feature
export async function getMatchedWords(
  category: string,
  featureName: string,
  limit = 10
): Promise<MatchedWord[]> {
  const database = await getDb()
  const results = database.exec(
    `SELECT word, count, last_seen
     FROM matched_words
     WHERE category = ? AND feature_name = ?
     ORDER BY count DESC
     LIMIT ?`,
    [category, featureName, limit]
  )
  if (!results.length) return []

  return results[0].values.map((row) => ({
    word: row[0] as string,
    count: row[1] as number,
    lastSeen: row[2] as string,
  }))
}

// Get all matched words (for export or debugging)
export async function getAllMatchedWords(): Promise<Record<string, Record<string, MatchedWord[]>>> {
  const database = await getDb()
  const results = database.exec(`
    SELECT category, feature_name, word, count, last_seen
    FROM matched_words
    ORDER BY category, feature_name, count DESC
  `)
  if (!results.length) return {}

  const grouped: Record<string, Record<string, MatchedWord[]>> = {}
  for (const row of results[0].values) {
    const category = row[0] as string
    const featureName = row[1] as string
    const word = row[2] as string
    const count = row[3] as number
    const lastSeen = row[4] as string

    if (!grouped[category]) grouped[category] = {}
    if (!grouped[category][featureName]) grouped[category][featureName] = []
    grouped[category][featureName].push({ word, count, lastSeen })
  }

  return grouped
}

// Get all feature counts
export async function getFeatureCounts(): Promise<FeatureCount[]> {
  const database = await getDb()
  const results = database.exec(`
    SELECT category, feature_name, count, total_words_analyzed, percentage, sample_size
    FROM feature_counts
    WHERE count > 0
    ORDER BY percentage DESC
  `)
  if (!results.length) return []

  return results[0].values.map((row) => ({
    category: row[0] as string,
    featureName: row[1] as string,
    count: row[2] as number,
    totalWordsAnalyzed: row[3] as number,
    percentage: row[4] as number,
    sampleSize: row[5] as number,
  }))
}

// Update behavioral metric
export async function updateBehavioralMetric(
  metricName: string,
  newValue: number
): Promise<void> {
  const database = await getDb()

  // Get current values
  const result = database.exec(
    `SELECT current_value, cumulative_value, min_value, max_value, sample_size
     FROM behavioral_metrics WHERE metric_name = ?`,
    [metricName]
  )

  if (result.length && result[0].values.length) {
    const [_currentValue, cumulative, minVal, maxVal, sampleSize] = result[0].values[0] as [number, number, number | null, number | null, number]
    const newSampleSize = sampleSize + 1
    const newCumulative = cumulative + newValue
    const newAvg = newCumulative / newSampleSize
    const newMin = minVal === null ? newValue : Math.min(minVal, newValue)
    const newMax = maxVal === null ? newValue : Math.max(maxVal, newValue)

    database.run(
      `UPDATE behavioral_metrics
       SET current_value = ?,
           cumulative_value = ?,
           min_value = ?,
           max_value = ?,
           sample_size = ?,
           last_updated = datetime('now')
       WHERE metric_name = ?`,
      [newAvg, newCumulative, newMin, newMax, newSampleSize, metricName]
    )
    scheduleSave()
  }
}

// Get all behavioral metrics
export async function getBehavioralMetrics(): Promise<BehavioralMetric[]> {
  const database = await getDb()
  const results = database.exec(`
    SELECT metric_name, current_value, min_value, max_value, sample_size, unit
    FROM behavioral_metrics
    WHERE sample_size > 0
    ORDER BY metric_name
  `)
  if (!results.length) return []

  return results[0].values.map((row) => ({
    metricName: row[0] as string,
    currentValue: row[1] as number,
    minValue: row[2] as number | null,
    maxValue: row[3] as number | null,
    sampleSize: row[4] as number,
    unit: row[5] as string,
  }))
}

// Record domain history snapshot
export async function recordDomainHistory(
  domainId: string,
  score: number,
  confidence: number,
  dataPointsCount: number,
  trigger: 'scheduled' | 'significant_change' | 'manual'
): Promise<void> {
  const database = await getDb()
  database.run(
    `INSERT INTO domain_history (domain_id, score, confidence, data_points_count, trigger)
     VALUES (?, ?, ?, ?, ?)`,
    [domainId, score, confidence, dataPointsCount, trigger]
  )
  scheduleSave()
}

// Get domain history for trend analysis
export async function getDomainHistory(domainId: string, limit = 100): Promise<DomainHistoryEntry[]> {
  const database = await getDb()
  const results = database.exec(
    `SELECT domain_id, score, confidence, data_points_count, recorded_at, trigger
     FROM domain_history
     WHERE domain_id = ?
     ORDER BY recorded_at DESC
     LIMIT ?`,
    [domainId, limit]
  )
  if (!results.length) return []

  return results[0].values.map((row) => ({
    domainId: row[0] as string,
    score: row[1] as number,
    confidence: row[2] as number,
    dataPointsCount: row[3] as number,
    recordedAt: row[4] as string,
    trigger: row[5] as string,
  }))
}

// Update confidence factors
export async function updateConfidenceFactor(
  domainId: string,
  factorName: string,
  value: number
): Promise<void> {
  const database = await getDb()
  database.run(
    `UPDATE confidence_factors
     SET value = ?, last_updated = datetime('now')
     WHERE domain_id = ? AND factor_name = ?`,
    [value, domainId, factorName]
  )
  scheduleSave()
}

// Calculate and update domain confidence
export async function calculateDomainConfidence(domainId: string): Promise<number> {
  const database = await getDb()
  const results = database.exec(
    `SELECT SUM(value * weight) / SUM(weight) as weighted_avg
     FROM confidence_factors
     WHERE domain_id = ?`,
    [domainId]
  )

  if (!results.length || !results[0].values.length) return 0

  const confidence = (results[0].values[0][0] as number) || 0

  database.run(
    `UPDATE domain_scores SET confidence = ? WHERE domain_id = ?`,
    [confidence, domainId]
  )
  scheduleSave()

  return confidence
}

// Update profile stats
export async function updateSqlProfileStats(
  totalMessages: number,
  totalWords: number,
  totalSessions: number
): Promise<void> {
  const database = await getDb()
  database.run(
    `UPDATE profiles
     SET total_messages = ?,
         total_words = ?,
         total_sessions = ?,
         last_updated = datetime('now')
     WHERE id = 'default'`,
    [totalMessages, totalWords, totalSessions]
  )
  scheduleSave()
}

// Get profile completeness
export async function calculateProfileCompleteness(): Promise<number> {
  const database = await getDb()
  const results = database.exec(`
    SELECT AVG(confidence) as avg_confidence,
           COUNT(CASE WHEN confidence >= 0.4 THEN 1 END) as moderate_count,
           COUNT(*) as total
    FROM domain_scores
  `)

  if (!results.length || !results[0].values.length) return 0

  const [avgConfidence, moderateCount, total] = results[0].values[0] as [number, number, number]
  const completeness = ((avgConfidence || 0) * 0.5) + ((moderateCount / total) * 0.5)

  database.run(
    `UPDATE profiles SET profile_completeness = ? WHERE id = 'default'`,
    [completeness]
  )
  scheduleSave()

  return completeness
}

// Export all SQL data
export async function exportSqlData(): Promise<object> {
  const database = await getDb()

  return {
    domainScores: database.exec('SELECT * FROM domain_scores'),
    featureCounts: database.exec('SELECT * FROM feature_counts WHERE count > 0'),
    behavioralMetrics: database.exec('SELECT * FROM behavioral_metrics WHERE sample_size > 0'),
    domainHistory: database.exec('SELECT * FROM domain_history'),
    confidenceFactors: database.exec('SELECT * FROM confidence_factors'),
    profiles: database.exec('SELECT * FROM profiles'),
  }
}

// Clear all SQL data
export async function clearSqlData(): Promise<void> {
  const database = await getDb()

  database.run('DELETE FROM domain_history')
  database.run('DELETE FROM matched_words')
  database.run('UPDATE domain_scores SET score = 0.5, confidence = 0.0, data_points_count = 0')
  database.run('UPDATE feature_counts SET count = 0, total_words_analyzed = 0, percentage = 0.0, sample_size = 0')
  database.run('UPDATE behavioral_metrics SET current_value = 0.0, cumulative_value = 0.0, min_value = NULL, max_value = NULL, sample_size = 0')
  database.run('UPDATE confidence_factors SET value = 0.0')
  database.run('UPDATE profiles SET total_messages = 0, total_words = 0, total_sessions = 0, profile_completeness = 0.0')

  scheduleSave()
}

// ==================== HYBRID SIGNAL FUNCTIONS ====================

// Save or update a hybrid signal score for a domain
export async function saveHybridSignal(
  domainId: string,
  signalType: 'liwc' | 'embedding' | 'llm',
  score: number,
  confidence: number,
  weightUsed: number,
  evidenceText?: string,
  matchedWords?: string[],
  prototypeSimilarity?: number
): Promise<void> {
  const database = await getDb()

  const matchedWordsJson = matchedWords ? JSON.stringify(matchedWords) : null
  // Convert undefined to null for SQL.js compatibility
  const evidenceTextValue = evidenceText ?? null
  const prototypeSimilarityValue = prototypeSimilarity ?? null

  database.run(
    `INSERT INTO hybrid_signal_scores
     (domain_id, signal_type, score, confidence, weight_used, evidence_text, matched_words, prototype_similarity, last_updated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(domain_id, signal_type)
     DO UPDATE SET
       score = ?,
       confidence = ?,
       weight_used = ?,
       evidence_text = COALESCE(?, evidence_text),
       matched_words = COALESCE(?, matched_words),
       prototype_similarity = COALESCE(?, prototype_similarity),
       last_updated = datetime('now')`,
    [
      domainId, signalType, score, confidence, weightUsed, evidenceTextValue, matchedWordsJson, prototypeSimilarityValue,
      score, confidence, weightUsed, evidenceTextValue, matchedWordsJson, prototypeSimilarityValue
    ]
  )
  scheduleSave()
}

// Get all hybrid signals for a specific domain
export async function getHybridSignalsForDomain(domainId: string): Promise<HybridSignalScore[]> {
  const database = await getDb()
  const results = database.exec(
    `SELECT domain_id, signal_type, score, confidence, weight_used, evidence_text, matched_words, prototype_similarity, last_updated
     FROM hybrid_signal_scores
     WHERE domain_id = ?
     ORDER BY signal_type`,
    [domainId]
  )

  if (!results.length) return []

  return results[0].values.map((row) => ({
    domainId: row[0] as string,
    signalType: row[1] as 'liwc' | 'embedding' | 'llm',
    score: row[2] as number,
    confidence: row[3] as number,
    weightUsed: row[4] as number,
    evidenceText: row[5] as string | null,
    matchedWords: row[6] ? JSON.parse(row[6] as string) : null,
    prototypeSimilarity: row[7] as number | null,
    lastUpdated: row[8] as string,
  }))
}

// Get all hybrid signals grouped by domain
export async function getAllHybridSignals(): Promise<Record<string, HybridSignalScore[]>> {
  const database = await getDb()
  const results = database.exec(`
    SELECT domain_id, signal_type, score, confidence, weight_used, evidence_text, matched_words, prototype_similarity, last_updated
    FROM hybrid_signal_scores
    ORDER BY domain_id, signal_type
  `)

  if (!results.length) return {}

  const grouped: Record<string, HybridSignalScore[]> = {}

  for (const row of results[0].values) {
    const domainId = row[0] as string
    const signal: HybridSignalScore = {
      domainId,
      signalType: row[1] as 'liwc' | 'embedding' | 'llm',
      score: row[2] as number,
      confidence: row[3] as number,
      weightUsed: row[4] as number,
      evidenceText: row[5] as string | null,
      matchedWords: row[6] ? JSON.parse(row[6] as string) : null,
      prototypeSimilarity: row[7] as number | null,
      lastUpdated: row[8] as string,
    }

    if (!grouped[domainId]) grouped[domainId] = []
    grouped[domainId].push(signal)
  }

  return grouped
}

// Clear all hybrid signals (for testing)
export async function clearHybridSignals(): Promise<void> {
  const database = await getDb()
  database.run('DELETE FROM hybrid_signal_scores')
  scheduleSave()
}

// Domain category mapping for hybrid signals
const DOMAIN_CATEGORIES_MAP: Record<string, string> = {
  big_five_openness: 'Core Personality (Big Five)',
  big_five_conscientiousness: 'Core Personality (Big Five)',
  big_five_extraversion: 'Core Personality (Big Five)',
  big_five_agreeableness: 'Core Personality (Big Five)',
  big_five_neuroticism: 'Core Personality (Big Five)',
  dark_triad_narcissism: 'Dark Personality',
  dark_triad_machiavellianism: 'Dark Personality',
  dark_triad_psychopathy: 'Dark Personality',
  emotional_empathy: 'Emotional/Social Intelligence',
  emotional_intelligence: 'Emotional/Social Intelligence',
  attachment_style: 'Emotional/Social Intelligence',
  love_languages: 'Emotional/Social Intelligence',
  communication_style: 'Emotional/Social Intelligence',
  risk_tolerance: 'Decision Making & Motivation',
  decision_style: 'Decision Making & Motivation',
  time_orientation: 'Decision Making & Motivation',
  achievement_motivation: 'Decision Making & Motivation',
  self_efficacy: 'Decision Making & Motivation',
  locus_of_control: 'Decision Making & Motivation',
  growth_mindset: 'Decision Making & Motivation',
  personal_values: 'Values & Wellbeing',
  interests: 'Values & Wellbeing',
  life_satisfaction: 'Values & Wellbeing',
  stress_coping: 'Values & Wellbeing',
  social_support: 'Values & Wellbeing',
  authenticity: 'Values & Wellbeing',
  cognitive_abilities: 'Cognitive/Learning',
  creativity: 'Cognitive/Learning',
  learning_styles: 'Cognitive/Learning',
  information_processing: 'Cognitive/Learning',
  metacognition: 'Cognitive/Learning',
  executive_functions: 'Cognitive/Learning',
  social_cognition: 'Social/Cultural/Values',
  political_ideology: 'Social/Cultural/Values',
  cultural_values: 'Social/Cultural/Values',
  moral_reasoning: 'Social/Cultural/Values',
  work_career_style: 'Social/Cultural/Values',
  sensory_processing: 'Sensory/Aesthetic',
  aesthetic_preferences: 'Sensory/Aesthetic',
}

/**
 * Get domain scores computed from hybrid signals
 * This aggregates LIWC, Embedding, and LLM signals using weighted averaging
 * Formula: finalScore = Σ(score × weight × confidence) / Σ(weight × confidence)
 */
export async function getDomainScoresFromHybridSignals(): Promise<DomainScore[]> {
  const allSignals = await getAllHybridSignals()
  const domainScores: DomainScore[] = []

  for (const [domainId, signals] of Object.entries(allSignals)) {
    // Skip if no signals
    if (signals.length === 0) continue

    // Aggregate signals using weighted formula
    let weightedSum = 0
    let totalWeight = 0
    let totalConfidenceWeightedSum = 0
    let totalBaseWeight = 0
    let signalCount = 0
    let latestUpdate = ''

    for (const signal of signals) {
      if (signal.weightUsed > 0) {
        const adjustedWeight = signal.weightUsed * signal.confidence
        weightedSum += signal.score * adjustedWeight
        totalWeight += adjustedWeight
        totalConfidenceWeightedSum += signal.confidence * signal.weightUsed
        totalBaseWeight += signal.weightUsed
        signalCount++
        if (signal.lastUpdated > latestUpdate) {
          latestUpdate = signal.lastUpdated
        }
      }
    }

    // Calculate final aggregated score and confidence
    const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5
    const finalConfidence = totalBaseWeight > 0 ? totalConfidenceWeightedSum / totalBaseWeight : 0

    domainScores.push({
      domainId,
      category: DOMAIN_CATEGORIES_MAP[domainId] || 'Unknown',
      score: finalScore,
      confidence: finalConfidence,
      dataPointsCount: signalCount,
      lastUpdated: latestUpdate || new Date().toISOString(),
    })
  }

  // Sort by category then domainId
  domainScores.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.domainId.localeCompare(b.domainId)
  })

  return domainScores
}

// ==================== TYPES ====================

export interface HybridSignalScore {
  domainId: string
  signalType: 'liwc' | 'embedding' | 'llm'
  score: number
  confidence: number
  weightUsed: number
  evidenceText: string | null
  matchedWords: string[] | null
  prototypeSimilarity: number | null
  lastUpdated: string
}

export interface DomainScore {
  domainId: string
  category: string
  score: number
  confidence: number
  dataPointsCount: number
  lastUpdated: string
}

export interface FeatureCount {
  category: string
  featureName: string
  count: number
  totalWordsAnalyzed: number
  percentage: number
  sampleSize: number
}

export interface BehavioralMetric {
  metricName: string
  currentValue: number
  minValue: number | null
  maxValue: number | null
  sampleSize: number
  unit: string
}

export interface DomainHistoryEntry {
  domainId: string
  score: number
  confidence: number
  dataPointsCount: number
  recordedAt: string
  trigger: string
}

export interface MatchedWord {
  word: string
  count: number
  lastSeen: string
}
