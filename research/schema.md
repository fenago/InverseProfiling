# Digital Twin Database Schema

## Overview

The Digital Twin system uses four complementary storage technologies:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STORAGE ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │    Dexie.js     │     │    wa-sqlite    │     │   TinkerBird    │       │
│  │   (IndexedDB)   │     │   (SQL in WASM) │     │   (Vector DB)   │       │
│  │                 │     │                 │     │                 │       │
│  │  Conversations  │────▶│    Profiles     │────▶│   Embeddings    │       │
│  │  Messages       │     │  Domain Scores  │     │   Similarity    │       │
│  │  Sessions       │     │  Features       │     │   Search        │       │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘       │
│           │                       │                       │                │
│           └───────────────────────┼───────────────────────┘                │
│                                   │                                        │
│                                   ▼                                        │
│                       ┌─────────────────────┐                              │
│                       │     LevelGraph      │                              │
│                       │    (Graph DB)       │                              │
│                       │                     │                              │
│                       │   Relationships     │                              │
│                       │   Knowledge Graph   │                              │
│                       └─────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Dexie.js Schema (IndexedDB)

### Purpose
Raw conversation storage with fast key-value access. Stores all user input before processing.

### Database Definition

```typescript
import Dexie, { Table } from 'dexie';

interface Conversation {
  id: string;                    // UUID
  startedAt: Date;
  endedAt?: Date;
  messageCount: number;
  metadata: {
    topics: string[];
    dominantMood?: string;
    processed: boolean;
  };
}

interface Message {
  id: string;                    // UUID
  conversationId: string;        // FK to conversations
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;

  // Processing metadata (populated after analysis)
  processingMetadata?: {
    wordCount: number;
    sentenceCount: number;
    responseLatencyMs?: number;  // Time since last assistant message
    embeddingId?: string;        // FK to TinkerBird
    liwcProcessed: boolean;
    extractedTopics: string[];
  };
}

interface Session {
  id: string;                    // UUID
  startedAt: Date;
  endedAt?: Date;
  durationMs: number;
  messageCount: number;
  conversationIds: string[];     // FKs to conversations

  // Behavioral metrics for this session
  metrics: {
    avgResponseLengthWords: number;
    avgResponseTimeMs: number;
    topicsDiscussed: string[];
    moodProgression: string[];
  };
}

class DigitalTwinDB extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<Message>;
  sessions!: Table<Session>;

  constructor() {
    super('DigitalTwinDB');
    this.version(1).stores({
      conversations: 'id, startedAt, endedAt',
      messages: 'id, conversationId, timestamp, role',
      sessions: 'id, startedAt, endedAt'
    });
  }
}
```

### Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| conversations | id (PK) | Primary lookup |
| conversations | startedAt | Chronological queries |
| messages | id (PK) | Primary lookup |
| messages | conversationId | Get all messages in conversation |
| messages | timestamp | Time-range queries |
| sessions | id (PK) | Primary lookup |
| sessions | startedAt | Session history |

---

## 2. wa-sqlite Schema (SQL)

### Purpose
Structured profile data, aggregated metrics, and historical tracking. The core analytical data store.

### Tables

#### 2.1 profiles

```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY DEFAULT 'default',  -- Single user, 'default' ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  schema_version INTEGER DEFAULT 1,

  -- Aggregated stats
  total_messages INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  first_interaction TIMESTAMP,

  -- Profile status
  profile_completeness REAL DEFAULT 0.0,  -- 0.0 to 1.0
  last_full_analysis TIMESTAMP
);
```

#### 2.2 domain_scores

```sql
CREATE TABLE domain_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id TEXT NOT NULL,              -- e.g., 'big_five_openness'
  domain_category TEXT NOT NULL,        -- e.g., 'personality'

  -- Score data
  score REAL NOT NULL,                  -- Normalized 0.0 to 1.0
  raw_score REAL,                       -- Pre-normalization value
  confidence REAL NOT NULL DEFAULT 0.0, -- 0.0 to 1.0

  -- Metadata
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_points_count INTEGER DEFAULT 0,

  UNIQUE(domain_id)
);

-- Pre-populate all 22+ domains
INSERT INTO domain_scores (domain_id, domain_category, score, confidence) VALUES
  -- Big Five Personality
  ('big_five_openness', 'personality', 0.5, 0.0),
  ('big_five_conscientiousness', 'personality', 0.5, 0.0),
  ('big_five_extraversion', 'personality', 0.5, 0.0),
  ('big_five_agreeableness', 'personality', 0.5, 0.0),
  ('big_five_neuroticism', 'personality', 0.5, 0.0),

  -- Cognitive
  ('cognitive_abilities', 'cognitive', 0.5, 0.0),
  ('information_processing', 'cognitive', 0.5, 0.0),
  ('metacognition', 'cognitive', 0.5, 0.0),
  ('executive_functions', 'cognitive', 0.5, 0.0),

  -- Emotional
  ('emotional_intelligence', 'emotional', 0.5, 0.0),
  ('resilience_coping', 'emotional', 0.5, 0.0),
  ('attachment_style', 'emotional', 0.5, 0.0),

  -- Values & Beliefs
  ('values_motivations', 'values', 0.5, 0.0),
  ('moral_reasoning', 'values', 0.5, 0.0),
  ('political_ideology', 'values', 0.5, 0.0),
  ('cultural_values', 'values', 0.5, 0.0),

  -- Behavioral Styles
  ('decision_making', 'behavioral', 0.5, 0.0),
  ('communication_style', 'behavioral', 0.5, 0.0),
  ('learning_style', 'behavioral', 0.5, 0.0),
  ('work_career_style', 'behavioral', 0.5, 0.0),

  -- Other
  ('creativity', 'cognitive', 0.5, 0.0),
  ('social_cognition', 'social', 0.5, 0.0),
  ('mindset_growth_fixed', 'mindset', 0.5, 0.0),
  ('time_perspective', 'temporal', 0.5, 0.0),
  ('sensory_processing', 'sensory', 0.5, 0.0),
  ('aesthetic_preferences', 'aesthetic', 0.5, 0.0),
  ('psychopathology_indicators', 'clinical', 0.5, 0.0);
```

#### 2.3 feature_counts

```sql
CREATE TABLE feature_counts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,           -- e.g., 'liwc', 'pronoun', 'cognitive'
  feature_name TEXT NOT NULL,       -- e.g., 'positive_emotion', 'first_person_singular'

  -- Counts
  count INTEGER DEFAULT 0,          -- Raw word/feature count
  total_words_analyzed INTEGER DEFAULT 0,
  percentage REAL DEFAULT 0.0,      -- count / total_words_analyzed * 100

  -- Metadata
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sample_size INTEGER DEFAULT 0,    -- Number of messages analyzed

  UNIQUE(category, feature_name)
);

-- LIWC Summary Variables
INSERT INTO feature_counts (category, feature_name) VALUES
  ('liwc_summary', 'analytical_thinking'),
  ('liwc_summary', 'clout'),
  ('liwc_summary', 'authenticity'),
  ('liwc_summary', 'emotional_tone');

-- Pronouns
INSERT INTO feature_counts (category, feature_name) VALUES
  ('pronoun', 'first_person_singular'),    -- I, me, my
  ('pronoun', 'first_person_plural'),      -- we, us, our
  ('pronoun', 'second_person'),            -- you, your
  ('pronoun', 'third_person_singular'),    -- he, she, it
  ('pronoun', 'third_person_plural');      -- they, them

-- Cognitive Processes
INSERT INTO feature_counts (category, feature_name) VALUES
  ('cognitive', 'insight'),                 -- think, know, consider
  ('cognitive', 'causation'),               -- because, effect, hence
  ('cognitive', 'discrepancy'),             -- should, would, could
  ('cognitive', 'tentative'),               -- maybe, perhaps, guess
  ('cognitive', 'certainty'),               -- always, never, definitely
  ('cognitive', 'differentiation');         -- but, except, without

-- Affect/Emotion
INSERT INTO feature_counts (category, feature_name) VALUES
  ('affect', 'positive_emotion'),
  ('affect', 'negative_emotion'),
  ('affect', 'anxiety'),
  ('affect', 'anger'),
  ('affect', 'sadness'),
  ('affect', 'joy'),
  ('affect', 'trust'),
  ('affect', 'fear'),
  ('affect', 'surprise'),
  ('affect', 'disgust');

-- Social Processes
INSERT INTO feature_counts (category, feature_name) VALUES
  ('social', 'family'),
  ('social', 'friends'),
  ('social', 'social_general'),
  ('social', 'affiliation'),
  ('social', 'achievement'),
  ('social', 'power');

-- Drives
INSERT INTO feature_counts (category, feature_name) VALUES
  ('drives', 'affiliation'),
  ('drives', 'achievement'),
  ('drives', 'power'),
  ('drives', 'reward'),
  ('drives', 'risk');

-- Time Orientation
INSERT INTO feature_counts (category, feature_name) VALUES
  ('time', 'past_focus'),
  ('time', 'present_focus'),
  ('time', 'future_focus');

-- Perceptual Processes
INSERT INTO feature_counts (category, feature_name) VALUES
  ('perceptual', 'see'),
  ('perceptual', 'hear'),
  ('perceptual', 'feel');

-- Personal Concerns
INSERT INTO feature_counts (category, feature_name) VALUES
  ('personal', 'work'),
  ('personal', 'leisure'),
  ('personal', 'home'),
  ('personal', 'money'),
  ('personal', 'religion'),
  ('personal', 'death');

-- Informal Language
INSERT INTO feature_counts (category, feature_name) VALUES
  ('informal', 'swear'),
  ('informal', 'netspeak'),
  ('informal', 'assent'),
  ('informal', 'nonfluencies'),
  ('informal', 'fillers');

-- Moral Foundations
INSERT INTO feature_counts (category, feature_name) VALUES
  ('moral', 'care_harm'),
  ('moral', 'fairness_cheating'),
  ('moral', 'loyalty_betrayal'),
  ('moral', 'authority_subversion'),
  ('moral', 'sanctity_degradation'),
  ('moral', 'liberty_oppression');

-- Mindset Indicators
INSERT INTO feature_counts (category, feature_name) VALUES
  ('mindset', 'growth_language'),
  ('mindset', 'fixed_language'),
  ('mindset', 'effort_attribution'),
  ('mindset', 'ability_attribution');

-- Metacognition
INSERT INTO feature_counts (category, feature_name) VALUES
  ('metacognition', 'planning'),
  ('metacognition', 'monitoring'),
  ('metacognition', 'evaluation'),
  ('metacognition', 'self_correction');

-- Creativity Indicators
INSERT INTO feature_counts (category, feature_name) VALUES
  ('creativity', 'novelty_words'),
  ('creativity', 'imagination_words'),
  ('creativity', 'innovation_words'),
  ('creativity', 'metaphor_count');

-- Attachment Language
INSERT INTO feature_counts (category, feature_name) VALUES
  ('attachment', 'trust_words'),
  ('attachment', 'intimacy_words'),
  ('attachment', 'independence_words'),
  ('attachment', 'anxiety_words');

-- Communication Style
INSERT INTO feature_counts (category, feature_name) VALUES
  ('communication', 'formal_language'),
  ('communication', 'informal_language'),
  ('communication', 'direct_language'),
  ('communication', 'indirect_language'),
  ('communication', 'assertive_language'),
  ('communication', 'hedging_language');

-- Executive Function
INSERT INTO feature_counts (category, feature_name) VALUES
  ('executive', 'inhibition_words'),
  ('executive', 'shifting_words'),
  ('executive', 'planning_words'),
  ('executive', 'organization_words');

-- Coping & Resilience
INSERT INTO feature_counts (category, feature_name) VALUES
  ('coping', 'problem_focused'),
  ('coping', 'emotion_focused'),
  ('coping', 'avoidant'),
  ('coping', 'support_seeking'),
  ('coping', 'optimism'),
  ('coping', 'self_efficacy');

-- Values (Schwartz)
INSERT INTO feature_counts (category, feature_name) VALUES
  ('values', 'self_direction'),
  ('values', 'stimulation'),
  ('values', 'hedonism'),
  ('values', 'achievement'),
  ('values', 'power'),
  ('values', 'security'),
  ('values', 'conformity'),
  ('values', 'tradition'),
  ('values', 'benevolence'),
  ('values', 'universalism');

-- Decision Making
INSERT INTO feature_counts (category, feature_name) VALUES
  ('decision', 'rational_language'),
  ('decision', 'intuitive_language'),
  ('decision', 'dependent_language'),
  ('decision', 'avoidant_language'),
  ('decision', 'spontaneous_language');

-- Political/Cultural
INSERT INTO feature_counts (category, feature_name) VALUES
  ('political', 'authority_language'),
  ('political', 'equality_language'),
  ('political', 'ingroup_language'),
  ('political', 'outgroup_language'),
  ('cultural', 'individualism'),
  ('cultural', 'collectivism');

-- Sensory
INSERT INTO feature_counts (category, feature_name) VALUES
  ('sensory', 'visual_words'),
  ('sensory', 'auditory_words'),
  ('sensory', 'kinesthetic_words'),
  ('sensory', 'olfactory_words'),
  ('sensory', 'gustatory_words');

-- Aesthetic
INSERT INTO feature_counts (category, feature_name) VALUES
  ('aesthetic', 'beauty_words'),
  ('aesthetic', 'complexity_preference'),
  ('aesthetic', 'novelty_preference');
```

#### 2.4 behavioral_metrics

```sql
CREATE TABLE behavioral_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL UNIQUE,

  -- Values
  current_value REAL DEFAULT 0.0,
  cumulative_value REAL DEFAULT 0.0,
  min_value REAL,
  max_value REAL,

  -- Statistics
  sample_size INTEGER DEFAULT 0,
  std_deviation REAL,

  -- Metadata
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unit TEXT                         -- e.g., 'ms', 'words', 'ratio'
);

INSERT INTO behavioral_metrics (metric_name, unit) VALUES
  -- Response patterns
  ('avg_response_length_words', 'words'),
  ('avg_response_length_chars', 'chars'),
  ('avg_sentence_length', 'words'),
  ('avg_sentences_per_message', 'count'),

  -- Timing
  ('avg_response_time_ms', 'ms'),
  ('median_response_time_ms', 'ms'),
  ('avg_session_duration_ms', 'ms'),
  ('avg_time_between_sessions_hours', 'hours'),

  -- Engagement
  ('avg_messages_per_session', 'count'),
  ('avg_messages_per_conversation', 'count'),
  ('session_frequency_per_week', 'count'),
  ('return_rate', 'ratio'),

  -- Content patterns
  ('question_ratio', 'ratio'),           -- Questions / Total messages
  ('vocabulary_diversity_ttr', 'ratio'), -- Type-token ratio
  ('avg_word_length', 'chars'),
  ('rare_word_ratio', 'ratio'),

  -- Complexity
  ('avg_clause_depth', 'count'),
  ('subordinate_clause_ratio', 'ratio'),
  ('lexical_density', 'ratio'),

  -- Interaction patterns
  ('topic_persistence_avg', 'messages'),
  ('topic_switching_rate', 'ratio'),
  ('follow_up_question_ratio', 'ratio');
```

#### 2.5 domain_history

```sql
CREATE TABLE domain_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id TEXT NOT NULL,            -- FK to domain_scores.domain_id

  -- Snapshot data
  score REAL NOT NULL,
  confidence REAL NOT NULL,
  data_points_count INTEGER,

  -- Metadata
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  trigger TEXT,                        -- 'scheduled', 'significant_change', 'manual'

  FOREIGN KEY (domain_id) REFERENCES domain_scores(domain_id)
);

CREATE INDEX idx_domain_history_domain ON domain_history(domain_id);
CREATE INDEX idx_domain_history_time ON domain_history(recorded_at);
```

#### 2.6 confidence_factors

```sql
CREATE TABLE confidence_factors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id TEXT NOT NULL,            -- FK to domain_scores.domain_id
  factor_name TEXT NOT NULL,

  -- Factor data
  value REAL NOT NULL,                -- 0.0 to 1.0
  weight REAL DEFAULT 1.0,            -- Importance weight

  -- Metadata
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(domain_id, factor_name),
  FOREIGN KEY (domain_id) REFERENCES domain_scores(domain_id)
);

-- Confidence factors for each domain
-- Populated dynamically, but example factors:
INSERT INTO confidence_factors (domain_id, factor_name, value, weight) VALUES
  ('big_five_openness', 'data_volume', 0.0, 0.3),
  ('big_five_openness', 'consistency', 0.0, 0.3),
  ('big_five_openness', 'temporal_stability', 0.0, 0.2),
  ('big_five_openness', 'cross_validation', 0.0, 0.2);
```

#### 2.7 liwc_word_lists (Reference)

```sql
CREATE TABLE liwc_word_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  word TEXT NOT NULL,
  weight REAL DEFAULT 1.0,

  UNIQUE(category, word)
);

CREATE INDEX idx_liwc_word ON liwc_word_lists(word);
CREATE INDEX idx_liwc_category ON liwc_word_lists(category);

-- Example entries (full list would have thousands)
INSERT INTO liwc_word_lists (category, word) VALUES
  ('positive_emotion', 'happy'),
  ('positive_emotion', 'love'),
  ('positive_emotion', 'great'),
  ('negative_emotion', 'sad'),
  ('negative_emotion', 'angry'),
  ('negative_emotion', 'hate'),
  ('insight', 'think'),
  ('insight', 'know'),
  ('insight', 'understand'),
  ('causation', 'because'),
  ('causation', 'therefore'),
  ('certainty', 'always'),
  ('certainty', 'never'),
  ('tentative', 'maybe'),
  ('tentative', 'perhaps');
```

#### 2.8 learning_progress (Phase 3)

```sql
CREATE TABLE knowledge_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  concept_id TEXT NOT NULL UNIQUE,
  concept_name TEXT NOT NULL,
  domain TEXT,                        -- Subject area

  -- Mastery
  mastery_level REAL DEFAULT 0.0,     -- 0.0 to 1.0
  confidence REAL DEFAULT 0.0,

  -- Spaced repetition
  last_reviewed TIMESTAMP,
  next_review TIMESTAMP,
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,

  -- Metadata
  first_encountered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  review_count INTEGER DEFAULT 0
);

CREATE TABLE learning_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  concept_id TEXT NOT NULL,
  event_type TEXT NOT NULL,           -- 'learned', 'reviewed', 'struggled', 'mastered'

  -- Performance
  performance_score REAL,             -- 0.0 to 1.0
  response_time_ms INTEGER,

  -- Context
  conversation_id TEXT,               -- FK to Dexie conversations
  message_id TEXT,                    -- FK to Dexie messages

  -- Metadata
  occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (concept_id) REFERENCES knowledge_states(concept_id)
);

CREATE TABLE knowledge_gaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  concept_id TEXT NOT NULL,
  gap_type TEXT NOT NULL,             -- 'missing_prerequisite', 'misconception', 'incomplete'

  -- Gap details
  description TEXT,
  severity REAL DEFAULT 0.5,          -- 0.0 to 1.0

  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,

  -- Metadata
  identified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (concept_id) REFERENCES knowledge_states(concept_id)
);
```

#### 2.9 strategic_questions (Phase 4)

```sql
CREATE TABLE strategic_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_domain_id TEXT NOT NULL,

  -- Question
  question_text TEXT NOT NULL,
  question_type TEXT,                 -- 'validation', 'exploration', 'clarification'

  -- Targeting
  expected_information_gain REAL,
  priority_score REAL,

  -- Results
  asked BOOLEAN DEFAULT FALSE,
  asked_at TIMESTAMP,
  response_message_id TEXT,           -- FK to Dexie messages
  information_gained REAL,            -- Actual vs expected

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (target_domain_id) REFERENCES domain_scores(domain_id)
);

CREATE TABLE validation_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_id TEXT NOT NULL,

  -- Validation
  validation_type TEXT,               -- 'user_confirmation', 'behavioral_consistency', 'cross_domain'
  inferred_value REAL,
  validated_value REAL,
  agreement_score REAL,               -- How close inferred was to validated

  -- Metadata
  validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (domain_id) REFERENCES domain_scores(domain_id)
);

CREATE TABLE audio_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT NOT NULL,           -- FK to Dexie messages

  -- Prosodic features
  avg_pitch_hz REAL,
  pitch_variability REAL,
  speaking_rate_wpm REAL,
  pause_frequency REAL,
  pause_avg_duration_ms REAL,

  -- Energy
  avg_energy REAL,
  energy_variability REAL,

  -- Voice quality
  jitter REAL,
  shimmer REAL,

  -- Metadata
  extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. TinkerBird Schema (Vector Database)

### Purpose
Semantic similarity search, topic clustering, and embedding storage.

### Collections

```typescript
interface VectorCollection {
  name: string;
  dimensions: number;
  distanceMetric: 'cosine' | 'euclidean' | 'dot';
}

const collections: VectorCollection[] = [
  {
    name: 'message_embeddings',
    dimensions: 384,  // all-MiniLM-L6-v2 default
    distanceMetric: 'cosine'
  },
  {
    name: 'topic_embeddings',
    dimensions: 384,
    distanceMetric: 'cosine'
  },
  {
    name: 'concept_embeddings',
    dimensions: 384,
    distanceMetric: 'cosine'
  },
  {
    name: 'user_interest_embeddings',
    dimensions: 384,
    distanceMetric: 'cosine'
  }
];
```

### 3.1 message_embeddings

```typescript
interface MessageEmbedding {
  id: string;                         // UUID, matches Dexie message ID
  vector: number[];                   // 384-dim embedding

  metadata: {
    conversationId: string;
    timestamp: Date;
    role: 'user' | 'assistant';
    wordCount: number;

    // For retrieval
    contentPreview: string;           // First 100 chars
    topics: string[];
  };
}
```

### 3.2 topic_embeddings

```typescript
interface TopicEmbedding {
  id: string;                         // Topic identifier
  vector: number[];                   // Centroid of topic cluster

  metadata: {
    topicName: string;
    messageCount: number;             // Messages in this topic
    lastUpdated: Date;

    // Topic characteristics
    dominantDomains: string[];        // e.g., ['creativity', 'work_career']
    sentiment: number;                // -1.0 to 1.0
  };
}
```

### 3.3 concept_embeddings

```typescript
interface ConceptEmbedding {
  id: string;                         // Concept identifier
  vector: number[];

  metadata: {
    conceptName: string;
    domain: string;                   // Subject area

    // Knowledge graph integration
    levelGraphNodeId: string;         // FK to LevelGraph

    // Learning integration (Phase 3)
    masteryLevel?: number;
    lastReviewed?: Date;
  };
}
```

### 3.4 user_interest_embeddings

```typescript
interface UserInterestEmbedding {
  id: string;                         // Interest area identifier
  vector: number[];                   // Aggregated from related messages

  metadata: {
    interestName: string;
    strength: number;                 // 0.0 to 1.0, based on frequency/engagement
    firstMentioned: Date;
    lastMentioned: Date;
    mentionCount: number;
  };
}
```

### TinkerBird Operations

```typescript
// Search similar messages
async function findSimilarMessages(queryVector: number[], limit: number = 10) {
  return await tinkerbird.search('message_embeddings', queryVector, limit);
}

// Find related topics
async function findRelatedTopics(messageVector: number[], limit: number = 5) {
  return await tinkerbird.search('topic_embeddings', messageVector, limit);
}

// Cluster messages into topics
async function clusterMessages(threshold: number = 0.8) {
  // Use hierarchical clustering on message_embeddings
  // Create/update topic_embeddings with cluster centroids
}

// Calculate semantic distance for creativity
async function calculateSemanticDistance(text: string): number {
  const embedding = await generateEmbedding(text);
  const neighbors = await tinkerbird.search('message_embeddings', embedding, 100);
  // Return average distance to neighbors (higher = more creative)
  return averageDistance(neighbors);
}
```

---

## 4. LevelGraph Schema (Graph Database)

### Purpose
Model relationships between entities: users, topics, domains, concepts, traits, and behaviors.

### Triple Format

LevelGraph stores data as Subject-Predicate-Object triples:

```typescript
interface Triple {
  subject: string;
  predicate: string;
  object: string;
}
```

### Relationship Types

#### 4.1 User-Topic Relationships

```typescript
// User interest in topics
{ subject: 'user:default', predicate: 'interested_in', object: 'topic:machine_learning' }
{ subject: 'user:default', predicate: 'interested_in', object: 'topic:philosophy' }

// Engagement strength (stored as property)
{ subject: 'user:default', predicate: 'engagement_strength', object: 'topic:machine_learning', strength: 0.85 }

// Topic recency
{ subject: 'user:default', predicate: 'last_discussed', object: 'topic:machine_learning', timestamp: '2024-12-09' }
```

#### 4.2 Topic-Domain Mappings

```typescript
// Topics indicate psychological domains
{ subject: 'topic:abstract_art', predicate: 'indicates', object: 'domain:big_five_openness' }
{ subject: 'topic:abstract_art', predicate: 'indicates', object: 'domain:creativity' }
{ subject: 'topic:abstract_art', predicate: 'indicates', object: 'domain:aesthetic_preferences' }

// Indication strength
{ subject: 'topic:abstract_art', predicate: 'indication_strength', object: 'domain:creativity', weight: 0.9 }
```

#### 4.3 Concept-Concept Relationships

```typescript
// Knowledge relationships
{ subject: 'concept:calculus', predicate: 'prerequisite_of', object: 'concept:differential_equations' }
{ subject: 'concept:variables', predicate: 'prerequisite_of', object: 'concept:functions' }

// Semantic relationships
{ subject: 'concept:democracy', predicate: 'related_to', object: 'concept:voting' }
{ subject: 'concept:neural_networks', predicate: 'type_of', object: 'concept:machine_learning' }

// Contrast relationships
{ subject: 'concept:growth_mindset', predicate: 'opposite_of', object: 'concept:fixed_mindset' }
```

#### 4.4 Trait-Behavior Mappings

```typescript
// How traits manifest as behaviors
{ subject: 'trait:high_openness', predicate: 'manifests_as', object: 'behavior:topic_diversity' }
{ subject: 'trait:high_openness', predicate: 'manifests_as', object: 'behavior:abstract_language' }
{ subject: 'trait:high_extraversion', predicate: 'manifests_as', object: 'behavior:long_messages' }
{ subject: 'trait:high_extraversion', predicate: 'manifests_as', object: 'behavior:social_words' }
```

#### 4.5 Domain-Marker Relationships

```typescript
// Which markers measure which domains
{ subject: 'domain:big_five_openness', predicate: 'measured_by', object: 'marker:vocabulary_diversity' }
{ subject: 'domain:big_five_openness', predicate: 'measured_by', object: 'marker:insight_words' }
{ subject: 'domain:big_five_openness', predicate: 'measured_by', object: 'marker:tentative_language' }

// Marker weights
{ subject: 'domain:big_five_openness', predicate: 'marker_weight', object: 'marker:vocabulary_diversity', weight: 0.3 }
```

#### 4.6 Marker-Feature Relationships

```typescript
// Which features compute which markers
{ subject: 'marker:vocabulary_diversity', predicate: 'computed_from', object: 'feature:type_token_ratio' }
{ subject: 'marker:positive_affect', predicate: 'computed_from', object: 'feature:positive_emotion_count' }
{ subject: 'marker:positive_affect', predicate: 'computed_from', object: 'feature:negative_emotion_count' }
```

#### 4.7 Context-Trait Relationships (Phase 4)

```typescript
// Context-dependent trait expression
{ subject: 'context:work_discussion', predicate: 'amplifies', object: 'trait:conscientiousness' }
{ subject: 'context:personal_discussion', predicate: 'amplifies', object: 'trait:agreeableness' }
{ subject: 'context:creative_task', predicate: 'amplifies', object: 'trait:openness' }
```

#### 4.8 Learning Relationships (Phase 3)

```typescript
// User mastery of concepts
{ subject: 'user:default', predicate: 'mastered', object: 'concept:basic_algebra' }
{ subject: 'user:default', predicate: 'struggling_with', object: 'concept:integration' }
{ subject: 'user:default', predicate: 'learning', object: 'concept:derivatives' }

// Topic difficulty
{ subject: 'concept:quantum_mechanics', predicate: 'difficulty_level', object: 'level:advanced' }
```

### LevelGraph Queries

```typescript
// Find all domains indicated by a topic
const domainsForTopic = await levelgraph.get({
  subject: 'topic:machine_learning',
  predicate: 'indicates'
});

// Find all markers for a domain
const markersForDomain = await levelgraph.get({
  subject: 'domain:creativity',
  predicate: 'measured_by'
});

// Find prerequisites for a concept
const prerequisites = await levelgraph.get({
  predicate: 'prerequisite_of',
  object: 'concept:calculus'
});

// Traverse: Find all features that contribute to openness
async function getFeaturesForDomain(domainId: string) {
  const markers = await levelgraph.get({ subject: domainId, predicate: 'measured_by' });
  const features = [];
  for (const marker of markers) {
    const markerFeatures = await levelgraph.get({
      subject: marker.object,
      predicate: 'computed_from'
    });
    features.push(...markerFeatures);
  }
  return features;
}
```

---

## 5. Cross-Database Relationships

### Entity ID Conventions

| Database | Entity Type | ID Format | Example |
|----------|-------------|-----------|---------|
| Dexie | Conversation | UUID | `conv_a1b2c3d4-...` |
| Dexie | Message | UUID | `msg_e5f6g7h8-...` |
| Dexie | Session | UUID | `sess_i9j0k1l2-...` |
| wa-sqlite | Domain | snake_case | `big_five_openness` |
| wa-sqlite | Feature | category:name | `liwc:positive_emotion` |
| wa-sqlite | Metric | snake_case | `avg_response_time_ms` |
| TinkerBird | Embedding | Matches source ID | `msg_e5f6g7h8-...` |
| LevelGraph | Node | type:name | `topic:machine_learning` |

### Foreign Key Mappings

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CROSS-DATABASE REFERENCES                            │
└─────────────────────────────────────────────────────────────────────────────┘

Dexie.messages.id ─────────────────────────────────▶ TinkerBird.message_embeddings.id
       │
       └──────────────────────────────────────────▶ wa-sqlite.audio_features.message_id

Dexie.messages.processingMetadata.embeddingId ────▶ TinkerBird.message_embeddings.id

Dexie.messages.processingMetadata.extractedTopics ─▶ LevelGraph (topic:* nodes)

Dexie.conversations.id ───────────────────────────▶ wa-sqlite.learning_events.conversation_id

wa-sqlite.domain_scores.domain_id ────────────────▶ LevelGraph (domain:* nodes)

wa-sqlite.feature_counts (category, feature_name) ─▶ LevelGraph (marker:* and feature:* nodes)

TinkerBird.concept_embeddings.metadata.levelGraphNodeId ─▶ LevelGraph (concept:* nodes)
```

### Data Flow: Message to Profile Update

```
1. User sends message
   │
   ▼
2. Store in Dexie.messages
   │
   ├────▶ 3a. Generate embedding → Store in TinkerBird.message_embeddings
   │
   ├────▶ 3b. Extract LIWC features → Update wa-sqlite.feature_counts
   │
   ├────▶ 3c. Calculate behavioral metrics → Update wa-sqlite.behavioral_metrics
   │
   └────▶ 3d. Extract topics → Create/update LevelGraph triples

4. Aggregate features to domain scores
   │
   ▼
5. Update wa-sqlite.domain_scores
   │
   ├────▶ 6a. Calculate confidence → Update wa-sqlite.confidence_factors
   │
   └────▶ 6b. Snapshot if significant → Insert wa-sqlite.domain_history

7. Update LevelGraph relationships
   │
   ├────▶ user-topic relationships
   │
   └────▶ topic-domain indications
```

---

## 6. Initialization Scripts

### 6.1 Initialize All Databases

```typescript
async function initializeAllDatabases() {
  // 1. Initialize Dexie
  const dexieDb = new DigitalTwinDB();
  await dexieDb.open();

  // 2. Initialize wa-sqlite
  const sqliteDb = await initSqlite();
  await sqliteDb.exec(CREATE_TABLES_SQL);
  await sqliteDb.exec(INSERT_INITIAL_DATA_SQL);

  // 3. Initialize TinkerBird
  const vectorDb = await TinkerBird.create({
    collections: [
      { name: 'message_embeddings', dimensions: 384 },
      { name: 'topic_embeddings', dimensions: 384 },
      { name: 'concept_embeddings', dimensions: 384 },
      { name: 'user_interest_embeddings', dimensions: 384 }
    ]
  });

  // 4. Initialize LevelGraph
  const graphDb = await LevelGraph(levelup(leveldown('graph-db')));
  await initializeGraphRelationships(graphDb);

  return { dexieDb, sqliteDb, vectorDb, graphDb };
}

async function initializeGraphRelationships(graphDb) {
  // Insert domain-marker relationships
  const domainMarkerTriples = [
    // Big Five Openness
    { subject: 'domain:big_five_openness', predicate: 'measured_by', object: 'marker:vocabulary_diversity' },
    { subject: 'domain:big_five_openness', predicate: 'measured_by', object: 'marker:insight_words' },
    { subject: 'domain:big_five_openness', predicate: 'measured_by', object: 'marker:tentative_language' },
    { subject: 'domain:big_five_openness', predicate: 'measured_by', object: 'marker:article_usage' },

    // Big Five Conscientiousness
    { subject: 'domain:big_five_conscientiousness', predicate: 'measured_by', object: 'marker:achievement_words' },
    { subject: 'domain:big_five_conscientiousness', predicate: 'measured_by', object: 'marker:work_words' },
    { subject: 'domain:big_five_conscientiousness', predicate: 'measured_by', object: 'marker:future_focus' },
    { subject: 'domain:big_five_conscientiousness', predicate: 'measured_by', object: 'marker:negation_words' },

    // Big Five Extraversion
    { subject: 'domain:big_five_extraversion', predicate: 'measured_by', object: 'marker:social_words' },
    { subject: 'domain:big_five_extraversion', predicate: 'measured_by', object: 'marker:positive_emotion' },
    { subject: 'domain:big_five_extraversion', predicate: 'measured_by', object: 'marker:word_count' },
    { subject: 'domain:big_five_extraversion', predicate: 'measured_by', object: 'marker:first_person_plural' },

    // Big Five Agreeableness
    { subject: 'domain:big_five_agreeableness', predicate: 'measured_by', object: 'marker:affiliation_words' },
    { subject: 'domain:big_five_agreeableness', predicate: 'measured_by', object: 'marker:positive_emotion' },
    { subject: 'domain:big_five_agreeableness', predicate: 'measured_by', object: 'marker:assent_words' },

    // Big Five Neuroticism
    { subject: 'domain:big_five_neuroticism', predicate: 'measured_by', object: 'marker:negative_emotion' },
    { subject: 'domain:big_five_neuroticism', predicate: 'measured_by', object: 'marker:anxiety_words' },
    { subject: 'domain:big_five_neuroticism', predicate: 'measured_by', object: 'marker:first_person_singular' },

    // ... continue for all 22 domains
  ];

  for (const triple of domainMarkerTriples) {
    await graphDb.put(triple);
  }

  // Insert marker-feature relationships
  const markerFeatureTriples = [
    { subject: 'marker:vocabulary_diversity', predicate: 'computed_from', object: 'feature:type_token_ratio' },
    { subject: 'marker:insight_words', predicate: 'computed_from', object: 'feature:cognitive_insight' },
    { subject: 'marker:positive_emotion', predicate: 'computed_from', object: 'feature:affect_positive_emotion' },
    { subject: 'marker:negative_emotion', predicate: 'computed_from', object: 'feature:affect_negative_emotion' },
    // ... continue for all markers
  ];

  for (const triple of markerFeatureTriples) {
    await graphDb.put(triple);
  }
}
```

---

## 7. Query Examples

### 7.1 Get Complete Profile

```typescript
async function getCompleteProfile() {
  // Get domain scores
  const domains = await sqliteDb.all(`
    SELECT domain_id, domain_category, score, confidence, last_updated
    FROM domain_scores
    ORDER BY domain_category, domain_id
  `);

  // Get behavioral metrics
  const metrics = await sqliteDb.all(`
    SELECT metric_name, current_value, sample_size
    FROM behavioral_metrics
  `);

  // Get top features
  const topFeatures = await sqliteDb.all(`
    SELECT category, feature_name, percentage
    FROM feature_counts
    WHERE percentage > 0
    ORDER BY percentage DESC
    LIMIT 20
  `);

  // Get user interests from graph
  const interests = await graphDb.get({
    subject: 'user:default',
    predicate: 'interested_in'
  });

  return { domains, metrics, topFeatures, interests };
}
```

### 7.2 Find Related Content

```typescript
async function findRelatedContent(messageId: string) {
  // Get message embedding
  const embedding = await vectorDb.get('message_embeddings', messageId);

  // Find similar messages
  const similarMessages = await vectorDb.search(
    'message_embeddings',
    embedding.vector,
    10
  );

  // Find related topics
  const relatedTopics = await vectorDb.search(
    'topic_embeddings',
    embedding.vector,
    5
  );

  // Get topic-domain relationships
  const domainIndicators = [];
  for (const topic of relatedTopics) {
    const domains = await graphDb.get({
      subject: topic.id,
      predicate: 'indicates'
    });
    domainIndicators.push(...domains);
  }

  return { similarMessages, relatedTopics, domainIndicators };
}
```

### 7.3 Update Profile from Message

```typescript
async function updateProfileFromMessage(message: Message) {
  // 1. Extract LIWC features
  const liwcFeatures = extractLIWCFeatures(message.content);

  // 2. Update feature counts
  for (const [category, features] of Object.entries(liwcFeatures)) {
    for (const [feature, count] of Object.entries(features)) {
      await sqliteDb.run(`
        UPDATE feature_counts
        SET count = count + ?,
            total_words_analyzed = total_words_analyzed + ?,
            percentage = (count + ?) * 100.0 / (total_words_analyzed + ?),
            sample_size = sample_size + 1,
            last_updated = CURRENT_TIMESTAMP
        WHERE category = ? AND feature_name = ?
      `, [count, message.wordCount, count, message.wordCount, category, feature]);
    }
  }

  // 3. Update behavioral metrics
  await updateBehavioralMetrics(message);

  // 4. Recalculate domain scores
  await recalculateDomainScores();

  // 5. Generate and store embedding
  const embedding = await generateEmbedding(message.content);
  await vectorDb.insert('message_embeddings', {
    id: message.id,
    vector: embedding,
    metadata: {
      conversationId: message.conversationId,
      timestamp: message.timestamp,
      role: message.role,
      wordCount: message.wordCount,
      contentPreview: message.content.slice(0, 100)
    }
  });

  // 6. Extract and store topics
  const topics = await extractTopics(message.content, embedding);
  for (const topic of topics) {
    await graphDb.put({
      subject: 'user:default',
      predicate: 'interested_in',
      object: `topic:${topic}`
    });
  }
}
```

---

## 8. Data Migration & Versioning

### Schema Version Tracking

```sql
CREATE TABLE schema_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  database_name TEXT NOT NULL,         -- 'sqlite', 'dexie', 'tinkerbird', 'levelgraph'
  version INTEGER NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  migration_script TEXT
);
```

### Migration Example

```typescript
const migrations = {
  sqlite: [
    {
      version: 1,
      up: `
        -- Initial schema creation
        CREATE TABLE profiles (...);
        CREATE TABLE domain_scores (...);
        -- etc.
      `
    },
    {
      version: 2,
      up: `
        -- Add new features for Phase 2
        ALTER TABLE feature_counts ADD COLUMN trend REAL;
        CREATE TABLE new_table (...);
      `
    }
  ]
};

async function runMigrations(db, migrations) {
  const currentVersion = await db.get('SELECT MAX(version) as v FROM schema_versions WHERE database_name = ?', ['sqlite']);

  for (const migration of migrations.sqlite) {
    if (migration.version > currentVersion.v) {
      await db.exec(migration.up);
      await db.run('INSERT INTO schema_versions (database_name, version, migration_script) VALUES (?, ?, ?)',
        ['sqlite', migration.version, migration.up]);
    }
  }
}
```

---

## 9. Storage Size Estimates

| Database | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|----------|---------|---------|---------|---------|
| Dexie.js | 10 MB | 50 MB | 100 MB | 200 MB |
| wa-sqlite | 5 MB | 20 MB | 40 MB | 50 MB |
| TinkerBird | 20 MB | 200 MB | 400 MB | 500 MB |
| LevelGraph | 1 MB | 10 MB | 50 MB | 100 MB |
| **Total** | **36 MB** | **280 MB** | **590 MB** | **850 MB** |

*Estimates based on:*
- 1,000 messages/month
- 384-dimensional embeddings
- 22 domains with history
- Progressive knowledge graph growth
