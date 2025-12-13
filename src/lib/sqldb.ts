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

  // ==================== PHASE 3: ADAPTIVE LEARNING TABLES ====================

  // === KNOWLEDGE STATES TABLE ===
  // Tracks user's knowledge level for different concepts/topics
  database.run(`
    CREATE TABLE IF NOT EXISTS knowledge_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept_id TEXT NOT NULL UNIQUE,
      concept_name TEXT NOT NULL,
      category TEXT NOT NULL,
      mastery_level REAL NOT NULL DEFAULT 0.0,
      zpd_lower REAL NOT NULL DEFAULT 0.0,
      zpd_upper REAL NOT NULL DEFAULT 0.3,
      difficulty_rating REAL NOT NULL DEFAULT 0.5,
      times_practiced INTEGER DEFAULT 0,
      times_correct INTEGER DEFAULT 0,
      times_incorrect INTEGER DEFAULT 0,
      last_practiced TEXT,
      next_review_due TEXT,
      easiness_factor REAL DEFAULT 2.5,
      interval_days REAL DEFAULT 1.0,
      repetition_number INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_knowledge_states_category ON knowledge_states(category)')
  database.run('CREATE INDEX IF NOT EXISTS idx_knowledge_states_mastery ON knowledge_states(mastery_level)')
  database.run('CREATE INDEX IF NOT EXISTS idx_knowledge_states_review ON knowledge_states(next_review_due)')

  // === LEARNING PROGRESS TABLE ===
  // Tracks progress through learning sessions and milestones
  database.run(`
    CREATE TABLE IF NOT EXISTS learning_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      concept_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      difficulty_attempted REAL NOT NULL,
      performance_score REAL NOT NULL,
      time_spent_ms INTEGER DEFAULT 0,
      scaffolding_level INTEGER DEFAULT 0,
      hints_used INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 1,
      completed INTEGER DEFAULT 0,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (concept_id) REFERENCES knowledge_states(concept_id)
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_learning_progress_session ON learning_progress(session_id)')
  database.run('CREATE INDEX IF NOT EXISTS idx_learning_progress_concept ON learning_progress(concept_id)')

  // === KNOWLEDGE GAPS TABLE ===
  // Identified gaps in user's knowledge
  database.run(`
    CREATE TABLE IF NOT EXISTS knowledge_gaps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept_id TEXT NOT NULL,
      gap_type TEXT NOT NULL,
      severity REAL NOT NULL DEFAULT 0.5,
      prerequisite_missing TEXT,
      misconception_detected TEXT,
      evidence_text TEXT,
      times_detected INTEGER DEFAULT 1,
      addressed INTEGER DEFAULT 0,
      detected_at TEXT DEFAULT (datetime('now')),
      last_seen TEXT DEFAULT (datetime('now')),
      addressed_at TEXT,
      FOREIGN KEY (concept_id) REFERENCES knowledge_states(concept_id)
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_concept ON knowledge_gaps(concept_id)')
  database.run('CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_severity ON knowledge_gaps(severity)')

  // === LEARNING EVENTS TABLE ===
  // Log of all learning interactions for analytics
  database.run(`
    CREATE TABLE IF NOT EXISTS learning_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      concept_id TEXT,
      event_data TEXT,
      learning_style_used TEXT,
      difficulty_level REAL,
      performance_result REAL,
      zpd_assessment TEXT,
      scaffolding_applied TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_learning_events_type ON learning_events(event_type)')
  database.run('CREATE INDEX IF NOT EXISTS idx_learning_events_concept ON learning_events(concept_id)')
  database.run('CREATE INDEX IF NOT EXISTS idx_learning_events_time ON learning_events(timestamp)')

  // === LEARNING PREFERENCES TABLE ===
  // Stores user's detected and preferred learning styles
  database.run(`
    CREATE TABLE IF NOT EXISTS learning_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preference_type TEXT NOT NULL UNIQUE,
      detected_value TEXT,
      confidence REAL DEFAULT 0.0,
      user_override TEXT,
      detection_method TEXT,
      sample_size INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now'))
    )
  `)

  // === CONCEPT_PREREQUISITES TABLE ===
  // Stores prerequisite relationships between concepts
  database.run(`
    CREATE TABLE IF NOT EXISTS concept_prerequisites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept_id TEXT NOT NULL,
      prerequisite_id TEXT NOT NULL,
      strength REAL NOT NULL DEFAULT 1.0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(concept_id, prerequisite_id),
      FOREIGN KEY (concept_id) REFERENCES knowledge_states(concept_id),
      FOREIGN KEY (prerequisite_id) REFERENCES knowledge_states(concept_id)
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_concept_prereqs_concept ON concept_prerequisites(concept_id)')
  database.run('CREATE INDEX IF NOT EXISTS idx_concept_prereqs_prereq ON concept_prerequisites(prerequisite_id)')
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

  // ==================== PHASE 3: ADAPTIVE LEARNING TABLES (MIGRATION) ====================

  // === KNOWLEDGE STATES TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS knowledge_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept_id TEXT NOT NULL UNIQUE,
      concept_name TEXT NOT NULL,
      category TEXT NOT NULL,
      mastery_level REAL NOT NULL DEFAULT 0.0,
      zpd_lower REAL NOT NULL DEFAULT 0.0,
      zpd_upper REAL NOT NULL DEFAULT 0.3,
      difficulty_rating REAL NOT NULL DEFAULT 0.5,
      times_practiced INTEGER DEFAULT 0,
      times_correct INTEGER DEFAULT 0,
      times_incorrect INTEGER DEFAULT 0,
      last_practiced TEXT,
      next_review_due TEXT,
      easiness_factor REAL DEFAULT 2.5,
      interval_days REAL DEFAULT 1.0,
      repetition_number INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_knowledge_states_category ON knowledge_states(category)')
  database.run('CREATE INDEX IF NOT EXISTS idx_knowledge_states_mastery ON knowledge_states(mastery_level)')
  database.run('CREATE INDEX IF NOT EXISTS idx_knowledge_states_review ON knowledge_states(next_review_due)')

  // === LEARNING PROGRESS TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS learning_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      concept_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      difficulty_attempted REAL NOT NULL,
      performance_score REAL NOT NULL,
      time_spent_ms INTEGER DEFAULT 0,
      scaffolding_level INTEGER DEFAULT 0,
      hints_used INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 1,
      completed INTEGER DEFAULT 0,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (concept_id) REFERENCES knowledge_states(concept_id)
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_learning_progress_session ON learning_progress(session_id)')
  database.run('CREATE INDEX IF NOT EXISTS idx_learning_progress_concept ON learning_progress(concept_id)')

  // === KNOWLEDGE GAPS TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS knowledge_gaps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept_id TEXT NOT NULL,
      gap_type TEXT NOT NULL,
      severity REAL NOT NULL DEFAULT 0.5,
      prerequisite_missing TEXT,
      misconception_detected TEXT,
      evidence_text TEXT,
      times_detected INTEGER DEFAULT 1,
      addressed INTEGER DEFAULT 0,
      detected_at TEXT DEFAULT (datetime('now')),
      last_seen TEXT DEFAULT (datetime('now')),
      addressed_at TEXT,
      FOREIGN KEY (concept_id) REFERENCES knowledge_states(concept_id)
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_concept ON knowledge_gaps(concept_id)')
  database.run('CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_severity ON knowledge_gaps(severity)')

  // === LEARNING EVENTS TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS learning_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      concept_id TEXT,
      event_data TEXT,
      learning_style_used TEXT,
      difficulty_level REAL,
      performance_result REAL,
      zpd_assessment TEXT,
      scaffolding_applied TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_learning_events_type ON learning_events(event_type)')
  database.run('CREATE INDEX IF NOT EXISTS idx_learning_events_concept ON learning_events(concept_id)')
  database.run('CREATE INDEX IF NOT EXISTS idx_learning_events_time ON learning_events(timestamp)')

  // === LEARNING PREFERENCES TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS learning_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preference_type TEXT NOT NULL UNIQUE,
      detected_value TEXT,
      confidence REAL DEFAULT 0.0,
      user_override TEXT,
      detection_method TEXT,
      sample_size INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now'))
    )
  `)

  // === CONCEPT_PREREQUISITES TABLE ===
  database.run(`
    CREATE TABLE IF NOT EXISTS concept_prerequisites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept_id TEXT NOT NULL,
      prerequisite_id TEXT NOT NULL,
      strength REAL NOT NULL DEFAULT 1.0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(concept_id, prerequisite_id),
      FOREIGN KEY (concept_id) REFERENCES knowledge_states(concept_id),
      FOREIGN KEY (prerequisite_id) REFERENCES knowledge_states(concept_id)
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_concept_prereqs_concept ON concept_prerequisites(concept_id)')
  database.run('CREATE INDEX IF NOT EXISTS idx_concept_prereqs_prereq ON concept_prerequisites(prerequisite_id)')

  // Initialize default learning preferences
  const defaultPreferences = [
    'learning_style_vark',          // visual, auditory, reading, kinesthetic
    'information_processing_depth', // shallow, moderate, deep
    'scaffolding_preference',       // minimal, moderate, extensive
    'feedback_timing',              // immediate, delayed, on_request
    'challenge_level',              // comfort_zone, slight_stretch, growth_zone
    'social_learning',              // solo, collaborative, mixed
    'time_preference',              // short_bursts, sustained_focus, varied
  ]
  for (const pref of defaultPreferences) {
    database.run(
      `INSERT OR IGNORE INTO learning_preferences (preference_type, detected_value, confidence)
       VALUES (?, NULL, 0.0)`,
      [pref]
    )
  }

  console.log('Phase 3 Adaptive Learning tables created/migrated')

  // ==================== PHASE 6: REAL-TIME EMOTION DETECTION TABLES ====================

  // === EMOTION STATES TABLE ===
  // Stores individual emotion detections during conversations
  database.run(`
    CREATE TABLE IF NOT EXISTS emotion_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      message_id TEXT,
      valence REAL NOT NULL,
      arousal REAL NOT NULL,
      primary_emotion TEXT NOT NULL,
      secondary_emotion TEXT,
      confidence REAL NOT NULL DEFAULT 0.0,
      intensity REAL NOT NULL DEFAULT 0.5,
      source TEXT NOT NULL DEFAULT 'audio',
      detected_at TEXT DEFAULT (datetime('now'))
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_emotion_states_session ON emotion_states(session_id)')
  database.run('CREATE INDEX IF NOT EXISTS idx_emotion_states_time ON emotion_states(detected_at)')
  database.run('CREATE INDEX IF NOT EXISTS idx_emotion_states_emotion ON emotion_states(primary_emotion)')

  // === EMOTION SESSIONS TABLE ===
  // Aggregated emotion statistics per session
  database.run(`
    CREATE TABLE IF NOT EXISTS emotion_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      avg_valence REAL DEFAULT 0.0,
      avg_arousal REAL DEFAULT 0.0,
      dominant_emotion TEXT,
      emotion_variability REAL DEFAULT 0.0,
      total_detections INTEGER DEFAULT 0,
      positive_ratio REAL DEFAULT 0.5,
      high_arousal_ratio REAL DEFAULT 0.5,
      emotion_distribution TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      last_updated TEXT DEFAULT (datetime('now'))
    )
  `)
  database.run('CREATE INDEX IF NOT EXISTS idx_emotion_sessions_session ON emotion_sessions(session_id)')

  console.log('Phase 6 Real-time Emotion Detection tables created/migrated')
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

// ==================== PHASE 3: ADAPTIVE LEARNING TYPES ====================

export interface KnowledgeState {
  id?: number
  conceptId: string
  conceptName: string
  category: string
  masteryLevel: number        // 0.0 to 1.0
  zpdLower: number            // Zone of Proximal Development lower bound
  zpdUpper: number            // Zone of Proximal Development upper bound
  difficultyRating: number    // Current difficulty of this concept for user
  timesPracticed: number
  timesCorrect: number
  timesIncorrect: number
  lastPracticed: string | null
  nextReviewDue: string | null
  // SM-2 Spaced Repetition fields
  easinessFactor: number      // Default 2.5
  intervalDays: number        // Days until next review
  repetitionNumber: number    // Number of successful reviews
  createdAt: string
  updatedAt: string
}

export interface LearningProgress {
  id?: number
  sessionId: string
  conceptId: string
  activityType: string        // 'explanation', 'quiz', 'practice', 'reflection'
  difficultyAttempted: number
  performanceScore: number    // 0.0 to 1.0
  timeSpentMs: number
  scaffoldingLevel: number    // 0 = none, 1 = hints, 2 = guided, 3 = full support
  hintsUsed: number
  attempts: number
  completed: boolean
  startedAt: string
  completedAt: string | null
}

export interface KnowledgeGap {
  id?: number
  conceptId: string
  gapType: string             // 'prerequisite_missing', 'misconception', 'partial_understanding'
  severity: number            // 0.0 to 1.0 (1.0 = severe)
  prerequisiteMissing: string | null
  misconceptionDetected: string | null
  evidenceText: string | null
  timesDetected: number
  addressed: boolean
  detectedAt: string
  lastSeen: string
  addressedAt: string | null
}

export interface LearningEvent {
  id?: number
  eventType: string           // 'concept_introduced', 'mastery_increased', 'gap_detected', 'review_scheduled'
  conceptId: string | null
  eventData: string | null    // JSON string with event details
  learningStyleUsed: string | null
  difficultyLevel: number | null
  performanceResult: number | null
  zpdAssessment: string | null
  scaffoldingApplied: string | null
  timestamp: string
}

export interface LearningPreference {
  id?: number
  preferenceType: string
  detectedValue: string | null
  confidence: number
  userOverride: string | null
  detectionMethod: string | null
  sampleSize: number
  lastUpdated: string
}

export interface ConceptPrerequisite {
  id?: number
  conceptId: string
  prerequisiteId: string
  strength: number            // 0.0 to 1.0 (how essential)
  createdAt: string
}

// ==================== PHASE 3: ADAPTIVE LEARNING FUNCTIONS ====================

// === KNOWLEDGE STATES ===

/**
 * Get or create a knowledge state for a concept
 */
export async function getOrCreateKnowledgeState(
  conceptId: string,
  conceptName: string,
  category: string
): Promise<KnowledgeState> {
  const database = await getDb()

  // Try to get existing
  const existing = database.exec(
    `SELECT * FROM knowledge_states WHERE concept_id = ?`,
    [conceptId]
  )

  if (existing.length && existing[0].values.length) {
    const row = existing[0].values[0]
    return {
      id: row[0] as number,
      conceptId: row[1] as string,
      conceptName: row[2] as string,
      category: row[3] as string,
      masteryLevel: row[4] as number,
      zpdLower: row[5] as number,
      zpdUpper: row[6] as number,
      difficultyRating: row[7] as number,
      timesPracticed: row[8] as number,
      timesCorrect: row[9] as number,
      timesIncorrect: row[10] as number,
      lastPracticed: row[11] as string | null,
      nextReviewDue: row[12] as string | null,
      easinessFactor: row[13] as number,
      intervalDays: row[14] as number,
      repetitionNumber: row[15] as number,
      createdAt: row[16] as string,
      updatedAt: row[17] as string,
    }
  }

  // Create new
  database.run(
    `INSERT INTO knowledge_states (concept_id, concept_name, category)
     VALUES (?, ?, ?)`,
    [conceptId, conceptName, category]
  )
  scheduleSave()

  // Return the created record
  return getOrCreateKnowledgeState(conceptId, conceptName, category)
}

/**
 * Get all knowledge states
 */
export async function getAllKnowledgeStates(): Promise<KnowledgeState[]> {
  const database = await getDb()
  const results = database.exec(`SELECT * FROM knowledge_states ORDER BY category, concept_name`)

  if (!results.length) return []

  return results[0].values.map(row => ({
    id: row[0] as number,
    conceptId: row[1] as string,
    conceptName: row[2] as string,
    category: row[3] as string,
    masteryLevel: row[4] as number,
    zpdLower: row[5] as number,
    zpdUpper: row[6] as number,
    difficultyRating: row[7] as number,
    timesPracticed: row[8] as number,
    timesCorrect: row[9] as number,
    timesIncorrect: row[10] as number,
    lastPracticed: row[11] as string | null,
    nextReviewDue: row[12] as string | null,
    easinessFactor: row[13] as number,
    intervalDays: row[14] as number,
    repetitionNumber: row[15] as number,
    createdAt: row[16] as string,
    updatedAt: row[17] as string,
  }))
}

/**
 * Get knowledge states by category
 */
export async function getKnowledgeStatesByCategory(category: string): Promise<KnowledgeState[]> {
  const database = await getDb()
  const results = database.exec(
    `SELECT * FROM knowledge_states WHERE category = ? ORDER BY concept_name`,
    [category]
  )

  if (!results.length) return []

  return results[0].values.map(row => ({
    id: row[0] as number,
    conceptId: row[1] as string,
    conceptName: row[2] as string,
    category: row[3] as string,
    masteryLevel: row[4] as number,
    zpdLower: row[5] as number,
    zpdUpper: row[6] as number,
    difficultyRating: row[7] as number,
    timesPracticed: row[8] as number,
    timesCorrect: row[9] as number,
    timesIncorrect: row[10] as number,
    lastPracticed: row[11] as string | null,
    nextReviewDue: row[12] as string | null,
    easinessFactor: row[13] as number,
    intervalDays: row[14] as number,
    repetitionNumber: row[15] as number,
    createdAt: row[16] as string,
    updatedAt: row[17] as string,
  }))
}

/**
 * Update mastery level and related metrics for a concept
 */
export async function updateKnowledgeMastery(
  conceptId: string,
  performanceScore: number,
  wasCorrect: boolean
): Promise<KnowledgeState | null> {
  const database = await getDb()

  // Get current state
  const current = database.exec(
    `SELECT mastery_level, times_practiced, times_correct, times_incorrect,
            easiness_factor, interval_days, repetition_number
     FROM knowledge_states WHERE concept_id = ?`,
    [conceptId]
  )

  if (!current.length || !current[0].values.length) return null

  const [mastery, practiced, correct, incorrect, ef, interval, repNum] = current[0].values[0] as number[]

  // Calculate new mastery using exponential moving average
  const alpha = 0.3 // Learning rate
  const newMastery = Math.min(1.0, Math.max(0.0, mastery * (1 - alpha) + performanceScore * alpha))

  // Update ZPD based on mastery
  const zpdLower = Math.max(0.0, newMastery - 0.15)
  const zpdUpper = Math.min(1.0, newMastery + 0.25)

  // SM-2 Spaced Repetition Algorithm
  let newEF = ef
  let newInterval = interval
  let newRepNum = repNum

  if (wasCorrect) {
    // Quality rating (0-5 scale based on performance)
    const quality = Math.round(performanceScore * 5)

    // Update easiness factor
    newEF = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

    // Update interval
    if (repNum === 0) {
      newInterval = 1
    } else if (repNum === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEF)
    }

    newRepNum = repNum + 1
  } else {
    // Reset on incorrect
    newRepNum = 0
    newInterval = 1
  }

  // Calculate next review date
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)

  database.run(
    `UPDATE knowledge_states
     SET mastery_level = ?,
         zpd_lower = ?,
         zpd_upper = ?,
         times_practiced = ?,
         times_correct = ?,
         times_incorrect = ?,
         last_practiced = datetime('now'),
         next_review_due = ?,
         easiness_factor = ?,
         interval_days = ?,
         repetition_number = ?,
         updated_at = datetime('now')
     WHERE concept_id = ?`,
    [
      newMastery, zpdLower, zpdUpper,
      practiced + 1,
      wasCorrect ? correct + 1 : correct,
      wasCorrect ? incorrect : incorrect + 1,
      nextReview.toISOString(),
      newEF, newInterval, newRepNum,
      conceptId
    ]
  )
  scheduleSave()

  // Return updated state
  const states = await getAllKnowledgeStates()
  return states.find(s => s.conceptId === conceptId) || null
}

/**
 * Get concepts due for review (spaced repetition)
 */
export async function getConceptsDueForReview(limit: number = 10): Promise<KnowledgeState[]> {
  const database = await getDb()
  const now = new Date().toISOString()

  const results = database.exec(
    `SELECT * FROM knowledge_states
     WHERE next_review_due IS NOT NULL AND next_review_due <= ?
     ORDER BY next_review_due ASC
     LIMIT ?`,
    [now, limit]
  )

  if (!results.length) return []

  return results[0].values.map(row => ({
    id: row[0] as number,
    conceptId: row[1] as string,
    conceptName: row[2] as string,
    category: row[3] as string,
    masteryLevel: row[4] as number,
    zpdLower: row[5] as number,
    zpdUpper: row[6] as number,
    difficultyRating: row[7] as number,
    timesPracticed: row[8] as number,
    timesCorrect: row[9] as number,
    timesIncorrect: row[10] as number,
    lastPracticed: row[11] as string | null,
    nextReviewDue: row[12] as string | null,
    easinessFactor: row[13] as number,
    intervalDays: row[14] as number,
    repetitionNumber: row[15] as number,
    createdAt: row[16] as string,
    updatedAt: row[17] as string,
  }))
}

// === LEARNING PROGRESS ===

/**
 * Record a learning activity
 */
export async function recordLearningProgress(
  sessionId: string,
  conceptId: string,
  activityType: string,
  difficultyAttempted: number,
  performanceScore: number,
  timeSpentMs: number,
  scaffoldingLevel: number = 0,
  hintsUsed: number = 0,
  attempts: number = 1
): Promise<number> {
  const database = await getDb()

  database.run(
    `INSERT INTO learning_progress
     (session_id, concept_id, activity_type, difficulty_attempted, performance_score,
      time_spent_ms, scaffolding_level, hints_used, attempts, completed, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
    [sessionId, conceptId, activityType, difficultyAttempted, performanceScore,
     timeSpentMs, scaffoldingLevel, hintsUsed, attempts]
  )
  scheduleSave()

  // Get the inserted ID
  const result = database.exec('SELECT last_insert_rowid()')
  return result[0]?.values[0]?.[0] as number || 0
}

/**
 * Get learning progress for a session
 */
export async function getLearningProgressForSession(sessionId: string): Promise<LearningProgress[]> {
  const database = await getDb()
  const results = database.exec(
    `SELECT * FROM learning_progress WHERE session_id = ? ORDER BY started_at DESC`,
    [sessionId]
  )

  if (!results.length) return []

  return results[0].values.map(row => ({
    id: row[0] as number,
    sessionId: row[1] as string,
    conceptId: row[2] as string,
    activityType: row[3] as string,
    difficultyAttempted: row[4] as number,
    performanceScore: row[5] as number,
    timeSpentMs: row[6] as number,
    scaffoldingLevel: row[7] as number,
    hintsUsed: row[8] as number,
    attempts: row[9] as number,
    completed: Boolean(row[10]),
    startedAt: row[11] as string,
    completedAt: row[12] as string | null,
  }))
}

/**
 * Get average performance for a concept
 */
export async function getConceptPerformanceStats(conceptId: string): Promise<{
  avgScore: number
  avgTime: number
  totalAttempts: number
  avgScaffolding: number
}> {
  const database = await getDb()
  const results = database.exec(
    `SELECT AVG(performance_score), AVG(time_spent_ms), COUNT(*), AVG(scaffolding_level)
     FROM learning_progress
     WHERE concept_id = ? AND completed = 1`,
    [conceptId]
  )

  if (!results.length || !results[0].values.length) {
    return { avgScore: 0, avgTime: 0, totalAttempts: 0, avgScaffolding: 0 }
  }

  const [avgScore, avgTime, total, avgScaff] = results[0].values[0] as number[]
  return {
    avgScore: avgScore || 0,
    avgTime: avgTime || 0,
    totalAttempts: total || 0,
    avgScaffolding: avgScaff || 0,
  }
}

// === KNOWLEDGE GAPS ===

/**
 * Record a detected knowledge gap
 */
export async function recordKnowledgeGap(
  conceptId: string,
  gapType: string,
  severity: number,
  prerequisiteMissing?: string,
  misconceptionDetected?: string,
  evidenceText?: string
): Promise<number> {
  const database = await getDb()

  // Check if gap already exists
  const existing = database.exec(
    `SELECT id, times_detected FROM knowledge_gaps
     WHERE concept_id = ? AND gap_type = ? AND addressed = 0`,
    [conceptId, gapType]
  )

  if (existing.length && existing[0].values.length) {
    const [id, timesDetected] = existing[0].values[0] as number[]
    database.run(
      `UPDATE knowledge_gaps
       SET times_detected = ?, severity = ?, last_seen = datetime('now'),
           evidence_text = COALESCE(?, evidence_text)
       WHERE id = ?`,
      [timesDetected + 1, severity, evidenceText ?? null, id]
    )
    scheduleSave()
    return id
  }

  // Create new gap
  database.run(
    `INSERT INTO knowledge_gaps
     (concept_id, gap_type, severity, prerequisite_missing, misconception_detected, evidence_text)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [conceptId, gapType, severity, prerequisiteMissing ?? null, misconceptionDetected ?? null, evidenceText ?? null]
  )
  scheduleSave()

  const result = database.exec('SELECT last_insert_rowid()')
  return result[0]?.values[0]?.[0] as number || 0
}

/**
 * Get unaddressed knowledge gaps
 */
export async function getUnaddressedKnowledgeGaps(): Promise<KnowledgeGap[]> {
  const database = await getDb()
  const results = database.exec(
    `SELECT * FROM knowledge_gaps WHERE addressed = 0 ORDER BY severity DESC, times_detected DESC`
  )

  if (!results.length) return []

  return results[0].values.map(row => ({
    id: row[0] as number,
    conceptId: row[1] as string,
    gapType: row[2] as string,
    severity: row[3] as number,
    prerequisiteMissing: row[4] as string | null,
    misconceptionDetected: row[5] as string | null,
    evidenceText: row[6] as string | null,
    timesDetected: row[7] as number,
    addressed: Boolean(row[8]),
    detectedAt: row[9] as string,
    lastSeen: row[10] as string,
    addressedAt: row[11] as string | null,
  }))
}

/**
 * Mark a knowledge gap as addressed
 */
export async function markKnowledgeGapAddressed(gapId: number): Promise<void> {
  const database = await getDb()
  database.run(
    `UPDATE knowledge_gaps SET addressed = 1, addressed_at = datetime('now') WHERE id = ?`,
    [gapId]
  )
  scheduleSave()
}

// === LEARNING EVENTS ===

/**
 * Log a learning event
 */
export async function logLearningEvent(
  eventType: string,
  conceptId?: string,
  eventData?: object,
  learningStyleUsed?: string,
  difficultyLevel?: number,
  performanceResult?: number,
  zpdAssessment?: string,
  scaffoldingApplied?: string
): Promise<void> {
  const database = await getDb()
  database.run(
    `INSERT INTO learning_events
     (event_type, concept_id, event_data, learning_style_used, difficulty_level,
      performance_result, zpd_assessment, scaffolding_applied)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      eventType,
      conceptId ?? null,
      eventData ? JSON.stringify(eventData) : null,
      learningStyleUsed ?? null,
      difficultyLevel ?? null,
      performanceResult ?? null,
      zpdAssessment ?? null,
      scaffoldingApplied ?? null
    ]
  )
  scheduleSave()
}

/**
 * Get recent learning events
 */
export async function getRecentLearningEvents(limit: number = 50): Promise<LearningEvent[]> {
  const database = await getDb()
  const results = database.exec(
    `SELECT * FROM learning_events ORDER BY timestamp DESC LIMIT ?`,
    [limit]
  )

  if (!results.length) return []

  return results[0].values.map(row => ({
    id: row[0] as number,
    eventType: row[1] as string,
    conceptId: row[2] as string | null,
    eventData: row[3] as string | null,
    learningStyleUsed: row[4] as string | null,
    difficultyLevel: row[5] as number | null,
    performanceResult: row[6] as number | null,
    zpdAssessment: row[7] as string | null,
    scaffoldingApplied: row[8] as string | null,
    timestamp: row[9] as string,
  }))
}

// === LEARNING PREFERENCES ===

/**
 * Update a learning preference
 */
export async function updateLearningPreference(
  preferenceType: string,
  detectedValue: string,
  confidence: number,
  detectionMethod?: string,
  incrementSampleSize: boolean = true
): Promise<void> {
  const database = await getDb()

  if (incrementSampleSize) {
    database.run(
      `UPDATE learning_preferences
       SET detected_value = ?, confidence = ?, detection_method = ?,
           sample_size = sample_size + 1, last_updated = datetime('now')
       WHERE preference_type = ?`,
      [detectedValue, confidence, detectionMethod ?? null, preferenceType]
    )
  } else {
    database.run(
      `UPDATE learning_preferences
       SET detected_value = ?, confidence = ?, detection_method = ?,
           last_updated = datetime('now')
       WHERE preference_type = ?`,
      [detectedValue, confidence, detectionMethod ?? null, preferenceType]
    )
  }
  scheduleSave()
}

/**
 * Set user override for a learning preference
 */
export async function setLearningPreferenceOverride(
  preferenceType: string,
  userOverride: string | null
): Promise<void> {
  const database = await getDb()
  database.run(
    `UPDATE learning_preferences SET user_override = ?, last_updated = datetime('now')
     WHERE preference_type = ?`,
    [userOverride, preferenceType]
  )
  scheduleSave()
}

/**
 * Get all learning preferences
 */
export async function getAllLearningPreferences(): Promise<LearningPreference[]> {
  const database = await getDb()
  const results = database.exec(`SELECT * FROM learning_preferences`)

  if (!results.length) return []

  return results[0].values.map(row => ({
    id: row[0] as number,
    preferenceType: row[1] as string,
    detectedValue: row[2] as string | null,
    confidence: row[3] as number,
    userOverride: row[4] as string | null,
    detectionMethod: row[5] as string | null,
    sampleSize: row[6] as number,
    lastUpdated: row[7] as string,
  }))
}

/**
 * Get effective learning preference (user override takes precedence)
 */
export async function getEffectiveLearningPreference(preferenceType: string): Promise<string | null> {
  const database = await getDb()
  const results = database.exec(
    `SELECT user_override, detected_value FROM learning_preferences WHERE preference_type = ?`,
    [preferenceType]
  )

  if (!results.length || !results[0].values.length) return null

  const [userOverride, detectedValue] = results[0].values[0] as (string | null)[]
  return userOverride ?? detectedValue
}

// === CONCEPT PREREQUISITES ===

/**
 * Add a concept prerequisite relationship
 */
export async function addConceptPrerequisite(
  conceptId: string,
  prerequisiteId: string,
  strength: number = 1.0
): Promise<void> {
  const database = await getDb()
  database.run(
    `INSERT OR REPLACE INTO concept_prerequisites (concept_id, prerequisite_id, strength)
     VALUES (?, ?, ?)`,
    [conceptId, prerequisiteId, strength]
  )
  scheduleSave()
}

/**
 * Get prerequisites for a concept
 */
export async function getConceptPrerequisites(conceptId: string): Promise<ConceptPrerequisite[]> {
  const database = await getDb()
  const results = database.exec(
    `SELECT * FROM concept_prerequisites WHERE concept_id = ? ORDER BY strength DESC`,
    [conceptId]
  )

  if (!results.length) return []

  return results[0].values.map(row => ({
    id: row[0] as number,
    conceptId: row[1] as string,
    prerequisiteId: row[2] as string,
    strength: row[3] as number,
    createdAt: row[4] as string,
  }))
}

/**
 * Check if all prerequisites are met for a concept
 */
export async function arePrerequisitesMet(
  conceptId: string,
  minMasteryLevel: number = 0.6
): Promise<{ met: boolean; missingPrereqs: string[] }> {
  const database = await getDb()

  const results = database.exec(
    `SELECT cp.prerequisite_id, ks.mastery_level, ks.concept_name
     FROM concept_prerequisites cp
     LEFT JOIN knowledge_states ks ON cp.prerequisite_id = ks.concept_id
     WHERE cp.concept_id = ?`,
    [conceptId]
  )

  if (!results.length || !results[0].values.length) {
    return { met: true, missingPrereqs: [] }
  }

  const missingPrereqs: string[] = []

  for (const row of results[0].values) {
    const prereqId = row[0] as string
    const mastery = (row[1] as number) ?? 0
    const name = row[2] as string | null

    if (mastery < minMasteryLevel) {
      missingPrereqs.push(name || prereqId)
    }
  }

  return { met: missingPrereqs.length === 0, missingPrereqs }
}

// === UTILITY FUNCTIONS ===

/**
 * Clear all Phase 3 learning data
 */
export async function clearLearningData(): Promise<void> {
  const database = await getDb()

  database.run('DELETE FROM learning_events')
  database.run('DELETE FROM learning_progress')
  database.run('DELETE FROM knowledge_gaps')
  database.run('DELETE FROM concept_prerequisites')
  database.run('DELETE FROM knowledge_states')
  database.run('UPDATE learning_preferences SET detected_value = NULL, confidence = 0.0, sample_size = 0, user_override = NULL')

  scheduleSave()
}

/**
 * Export Phase 3 learning data
 */
export async function exportLearningData(): Promise<object> {
  const database = await getDb()

  return {
    knowledgeStates: database.exec('SELECT * FROM knowledge_states'),
    learningProgress: database.exec('SELECT * FROM learning_progress'),
    knowledgeGaps: database.exec('SELECT * FROM knowledge_gaps'),
    learningEvents: database.exec('SELECT * FROM learning_events ORDER BY timestamp DESC LIMIT 1000'),
    learningPreferences: database.exec('SELECT * FROM learning_preferences'),
    conceptPrerequisites: database.exec('SELECT * FROM concept_prerequisites'),
  }
}

// ==================== PHASE 6: REAL-TIME EMOTION DETECTION TYPES ====================

export interface StoredEmotionState {
  id?: number
  sessionId: string
  messageId: string | null
  valence: number           // -1 to 1
  arousal: number           // -1 to 1
  primaryEmotion: string
  secondaryEmotion: string | null
  confidence: number        // 0-1
  intensity: number         // 0-1
  source: 'audio' | 'text' | 'multimodal'
  detectedAt: string
}

export interface EmotionSessionStats {
  id?: number
  sessionId: string
  avgValence: number
  avgArousal: number
  dominantEmotion: string | null
  emotionVariability: number  // Standard deviation of valence/arousal
  totalDetections: number
  positiveRatio: number       // Ratio of positive valence emotions
  highArousalRatio: number    // Ratio of high arousal emotions
  emotionDistribution: Record<string, number>  // Count per emotion
  startedAt: string
  lastUpdated: string
}

// ==================== PHASE 6: REAL-TIME EMOTION DETECTION FUNCTIONS ====================

/**
 * Save a detected emotion state
 */
export async function saveEmotionState(
  sessionId: string,
  valence: number,
  arousal: number,
  primaryEmotion: string,
  confidence: number,
  intensity: number,
  source: 'audio' | 'text' | 'multimodal' = 'audio',
  messageId?: string,
  secondaryEmotion?: string
): Promise<number> {
  const database = await getDb()

  database.run(
    `INSERT INTO emotion_states
     (session_id, message_id, valence, arousal, primary_emotion, secondary_emotion, confidence, intensity, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sessionId, messageId ?? null, valence, arousal, primaryEmotion, secondaryEmotion ?? null, confidence, intensity, source]
  )
  scheduleSave()

  // Update session aggregates
  await updateEmotionSessionStats(sessionId)

  const result = database.exec('SELECT last_insert_rowid()')
  return result[0]?.values[0]?.[0] as number || 0
}

/**
 * Get emotion states for a session
 */
export async function getEmotionStatesForSession(sessionId: string, limit: number = 100): Promise<StoredEmotionState[]> {
  const database = await getDb()
  const results = database.exec(
    `SELECT * FROM emotion_states WHERE session_id = ? ORDER BY detected_at DESC LIMIT ?`,
    [sessionId, limit]
  )

  if (!results.length) return []

  return results[0].values.map(row => ({
    id: row[0] as number,
    sessionId: row[1] as string,
    messageId: row[2] as string | null,
    valence: row[3] as number,
    arousal: row[4] as number,
    primaryEmotion: row[5] as string,
    secondaryEmotion: row[6] as string | null,
    confidence: row[7] as number,
    intensity: row[8] as number,
    source: row[9] as 'audio' | 'text' | 'multimodal',
    detectedAt: row[10] as string,
  }))
}

/**
 * Get recent emotion states across all sessions
 */
export async function getRecentEmotionStates(limit: number = 50): Promise<StoredEmotionState[]> {
  const database = await getDb()
  const results = database.exec(
    `SELECT * FROM emotion_states ORDER BY detected_at DESC LIMIT ?`,
    [limit]
  )

  if (!results.length) return []

  return results[0].values.map(row => ({
    id: row[0] as number,
    sessionId: row[1] as string,
    messageId: row[2] as string | null,
    valence: row[3] as number,
    arousal: row[4] as number,
    primaryEmotion: row[5] as string,
    secondaryEmotion: row[6] as string | null,
    confidence: row[7] as number,
    intensity: row[8] as number,
    source: row[9] as 'audio' | 'text' | 'multimodal',
    detectedAt: row[10] as string,
  }))
}

/**
 * Update aggregated emotion statistics for a session
 */
export async function updateEmotionSessionStats(sessionId: string): Promise<void> {
  const database = await getDb()

  // Calculate aggregates
  const stats = database.exec(
    `SELECT
       AVG(valence) as avg_valence,
       AVG(arousal) as avg_arousal,
       COUNT(*) as total,
       SUM(CASE WHEN valence > 0 THEN 1 ELSE 0 END) as positive_count,
       SUM(CASE WHEN arousal > 0 THEN 1 ELSE 0 END) as high_arousal_count,
       (
         SELECT primary_emotion
         FROM emotion_states
         WHERE session_id = ?
         GROUP BY primary_emotion
         ORDER BY COUNT(*) DESC
         LIMIT 1
       ) as dominant_emotion
     FROM emotion_states
     WHERE session_id = ?`,
    [sessionId, sessionId]
  )

  if (!stats.length || !stats[0].values.length) return

  const [avgValence, avgArousal, total, positiveCount, highArousalCount, dominantEmotion] = stats[0].values[0] as [number, number, number, number, number, string]

  // Calculate variability (standard deviation of valence)
  const variabilityResult = database.exec(
    `SELECT
       SQRT(AVG((valence - ?) * (valence - ?)) + AVG((arousal - ?) * (arousal - ?))) as variability
     FROM emotion_states
     WHERE session_id = ?`,
    [avgValence, avgValence, avgArousal, avgArousal, sessionId]
  )
  const variability = variabilityResult.length && variabilityResult[0].values.length
    ? (variabilityResult[0].values[0][0] as number) || 0
    : 0

  // Get emotion distribution
  const distributionResult = database.exec(
    `SELECT primary_emotion, COUNT(*) as count
     FROM emotion_states
     WHERE session_id = ?
     GROUP BY primary_emotion`,
    [sessionId]
  )
  const distribution: Record<string, number> = {}
  if (distributionResult.length && distributionResult[0].values.length) {
    for (const row of distributionResult[0].values) {
      distribution[row[0] as string] = row[1] as number
    }
  }

  // Upsert session stats
  database.run(
    `INSERT INTO emotion_sessions
     (session_id, avg_valence, avg_arousal, dominant_emotion, emotion_variability,
      total_detections, positive_ratio, high_arousal_ratio, emotion_distribution, last_updated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(session_id)
     DO UPDATE SET
       avg_valence = ?,
       avg_arousal = ?,
       dominant_emotion = ?,
       emotion_variability = ?,
       total_detections = ?,
       positive_ratio = ?,
       high_arousal_ratio = ?,
       emotion_distribution = ?,
       last_updated = datetime('now')`,
    [
      sessionId, avgValence, avgArousal, dominantEmotion, variability,
      total, total > 0 ? positiveCount / total : 0.5, total > 0 ? highArousalCount / total : 0.5,
      JSON.stringify(distribution),
      avgValence, avgArousal, dominantEmotion, variability,
      total, total > 0 ? positiveCount / total : 0.5, total > 0 ? highArousalCount / total : 0.5,
      JSON.stringify(distribution)
    ]
  )
  scheduleSave()
}

/**
 * Get emotion session statistics
 */
export async function getEmotionSessionStats(sessionId: string): Promise<EmotionSessionStats | null> {
  const database = await getDb()
  const results = database.exec(
    `SELECT * FROM emotion_sessions WHERE session_id = ?`,
    [sessionId]
  )

  if (!results.length || !results[0].values.length) return null

  const row = results[0].values[0]
  return {
    id: row[0] as number,
    sessionId: row[1] as string,
    avgValence: row[2] as number,
    avgArousal: row[3] as number,
    dominantEmotion: row[4] as string | null,
    emotionVariability: row[5] as number,
    totalDetections: row[6] as number,
    positiveRatio: row[7] as number,
    highArousalRatio: row[8] as number,
    emotionDistribution: row[9] ? JSON.parse(row[9] as string) : {},
    startedAt: row[10] as string,
    lastUpdated: row[11] as string,
  }
}

/**
 * Get all emotion session statistics
 */
export async function getAllEmotionSessionStats(): Promise<EmotionSessionStats[]> {
  const database = await getDb()
  const results = database.exec(
    `SELECT * FROM emotion_sessions ORDER BY last_updated DESC`
  )

  if (!results.length) return []

  return results[0].values.map(row => ({
    id: row[0] as number,
    sessionId: row[1] as string,
    avgValence: row[2] as number,
    avgArousal: row[3] as number,
    dominantEmotion: row[4] as string | null,
    emotionVariability: row[5] as number,
    totalDetections: row[6] as number,
    positiveRatio: row[7] as number,
    highArousalRatio: row[8] as number,
    emotionDistribution: row[9] ? JSON.parse(row[9] as string) : {},
    startedAt: row[10] as string,
    lastUpdated: row[11] as string,
  }))
}

/**
 * Get emotion timeline for a date range
 */
export async function getEmotionTimeline(
  startDate: string,
  endDate: string,
  sessionId?: string
): Promise<StoredEmotionState[]> {
  const database = await getDb()

  let query = `SELECT * FROM emotion_states WHERE detected_at BETWEEN ? AND ?`
  const params: (string | number)[] = [startDate, endDate]

  if (sessionId) {
    query += ' AND session_id = ?'
    params.push(sessionId)
  }

  query += ' ORDER BY detected_at ASC'

  const results = database.exec(query, params)

  if (!results.length) return []

  return results[0].values.map(row => ({
    id: row[0] as number,
    sessionId: row[1] as string,
    messageId: row[2] as string | null,
    valence: row[3] as number,
    arousal: row[4] as number,
    primaryEmotion: row[5] as string,
    secondaryEmotion: row[6] as string | null,
    confidence: row[7] as number,
    intensity: row[8] as number,
    source: row[9] as 'audio' | 'text' | 'multimodal',
    detectedAt: row[10] as string,
  }))
}

/**
 * Get emotion distribution across all time
 */
export async function getOverallEmotionDistribution(): Promise<Record<string, number>> {
  const database = await getDb()
  const results = database.exec(`
    SELECT primary_emotion, COUNT(*) as count
    FROM emotion_states
    GROUP BY primary_emotion
    ORDER BY count DESC
  `)

  if (!results.length) return {}

  const distribution: Record<string, number> = {}
  for (const row of results[0].values) {
    distribution[row[0] as string] = row[1] as number
  }
  return distribution
}

/**
 * Clear emotion data for a session
 */
export async function clearEmotionDataForSession(sessionId: string): Promise<void> {
  const database = await getDb()
  database.run('DELETE FROM emotion_states WHERE session_id = ?', [sessionId])
  database.run('DELETE FROM emotion_sessions WHERE session_id = ?', [sessionId])
  scheduleSave()
}

/**
 * Clear all emotion data
 */
export async function clearAllEmotionData(): Promise<void> {
  const database = await getDb()
  database.run('DELETE FROM emotion_states')
  database.run('DELETE FROM emotion_sessions')
  scheduleSave()
}

/**
 * Export emotion data
 */
export async function exportEmotionData(): Promise<object> {
  const database = await getDb()

  return {
    emotionStates: database.exec('SELECT * FROM emotion_states ORDER BY detected_at DESC'),
    emotionSessions: database.exec('SELECT * FROM emotion_sessions'),
  }
}
