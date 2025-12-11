# Data Architecture: Privacy-Preserving Digital Twin

## Overview

This document provides comprehensive documentation of data flow, capture, and storage for the browser-based digital twin system. All data remains on-device with zero cloud transmission.

**Status:** Phase 1 Complete | Phase 2 In Planning

---

## 1. Data Flow Overview

```mermaid
flowchart TB
    subgraph INPUT["User Interaction Layer"]
        USER[("User")]
        TEXT["Text Message"]
        TIMING["Response Timing"]
        SESSION["Session Context"]
    end

    subgraph CAPTURE["Data Capture Layer"]
        DEXIE["Dexie.js<br/>(Raw Storage)"]
    end

    subgraph PROCESSING["Processing Layer"]
        LIWC["LIWC Analyzer"]
        EMBED["Embedding Generator<br/>(Transformers.js)"]
        BEHAV["Behavioral Tracker"]
        TOPIC["Topic Extractor"]
    end

    subgraph STORAGE["Intermediate Storage"]
        SQLITE["wa-sqlite<br/>(Features & Metrics)"]
        TINKER["TinkerBird<br/>(Vectors)"]
        GRAPH["LevelGraph<br/>(Relationships)"]
    end

    subgraph AGGREGATION["Aggregation Layer"]
        DOMAIN_CALC["Domain Score<br/>Calculator"]
        CONF_CALC["Confidence<br/>Calculator"]
    end

    subgraph OUTPUT["Profile Output"]
        PROFILE["Complete Profile<br/>(26 Domains)"]
        HISTORY["Historical<br/>Snapshots"]
    end

    USER --> TEXT
    USER --> TIMING
    USER --> SESSION

    TEXT --> DEXIE
    TIMING --> DEXIE
    SESSION --> DEXIE

    DEXIE --> LIWC
    DEXIE --> EMBED
    DEXIE --> BEHAV
    EMBED --> TOPIC

    LIWC --> SQLITE
    BEHAV --> SQLITE
    EMBED --> TINKER
    TOPIC --> GRAPH

    SQLITE --> DOMAIN_CALC
    TINKER --> DOMAIN_CALC
    GRAPH --> DOMAIN_CALC

    DOMAIN_CALC --> CONF_CALC
    CONF_CALC --> PROFILE
    DOMAIN_CALC --> HISTORY
```

---

## 2. Message Processing Pipeline

```mermaid
sequenceDiagram
    participant User
    participant UI as Chat UI
    participant Dexie as Dexie.js
    participant LIWC as LIWC Analyzer
    participant Embed as Transformers.js
    participant SQL as wa-sqlite
    participant Vector as TinkerBird
    participant Graph as LevelGraph

    User->>UI: Send message
    Note over UI: Capture timestamp

    UI->>Dexie: Store raw message
    Note over Dexie: {id, conversationId, role,<br/>content, timestamp}

    par Parallel Processing
        Dexie->>LIWC: Analyze text
        Note over LIWC: Word counts per category
        LIWC->>SQL: Update feature_counts
        LIWC->>SQL: Update behavioral_metrics
    and
        Dexie->>Embed: Generate embedding
        Note over Embed: all-MiniLM-L6-v2<br/>384 dimensions
        Embed->>Vector: Store message_embedding
    end

    Embed->>Graph: Extract topics
    Graph->>Graph: Update user-topic relations

    SQL->>SQL: Recalculate domain_scores
    SQL->>SQL: Update confidence_factors

    alt Significant Change Detected
        SQL->>SQL: Snapshot to domain_history
    end

    SQL->>UI: Return updated profile
    UI->>User: Display response + profile update
```

---

## 3. Four-Database Architecture

### 3.1 Database Responsibilities

```mermaid
flowchart LR
    subgraph DEXIE["Dexie.js (IndexedDB)"]
        direction TB
        D_PURPOSE["Purpose: Raw Data Capture"]
        D_TABLES["Tables: 3"]
        D1["conversations"]
        D2["messages"]
        D3["sessions"]
    end

    subgraph SQLITE["wa-sqlite (SQL)"]
        direction TB
        S_PURPOSE["Purpose: Structured Analytics"]
        S_TABLES["Tables: 7+"]
        S1["profiles"]
        S2["domain_scores (26)"]
        S3["feature_counts (110+)"]
        S4["behavioral_metrics (22)"]
        S5["domain_history"]
        S6["confidence_factors (104)"]
        S7["liwc_word_lists"]
    end

    subgraph TINKER["TinkerBird (Vector)"]
        direction TB
        T_PURPOSE["Purpose: Semantic Search"]
        T_COLLECTIONS["Collections: 4"]
        T1["message_embeddings"]
        T2["topic_embeddings"]
        T3["concept_embeddings"]
        T4["user_interest_embeddings"]
    end

    subgraph GRAPH["LevelGraph (Triples)"]
        direction TB
        G_PURPOSE["Purpose: Relationships"]
        G_TYPES["Relationship Types: 5"]
        G1["user → topic"]
        G2["topic → domain"]
        G3["domain → marker"]
        G4["marker → feature"]
        G5["concept → concept"]
    end
```

### 3.2 Data Flow Between Databases

```mermaid
flowchart TB
    subgraph CAPTURE["1. Capture"]
        MSG["New Message"]
    end

    subgraph RAW["2. Raw Storage"]
        DEXIE["Dexie.js"]
    end

    subgraph PARALLEL["3. Parallel Processing"]
        direction LR
        LIWC["LIWC Analysis"]
        EMBED["Embedding"]
        BEHAV["Behavioral"]
    end

    subgraph PERSIST["4. Persist Features"]
        SQL_FEAT["feature_counts"]
        SQL_BEHAV["behavioral_metrics"]
        VECTOR["message_embeddings"]
        TOPICS["topic extraction"]
    end

    subgraph AGGREGATE["5. Aggregate"]
        DOMAINS["domain_scores"]
        CONF["confidence_factors"]
    end

    subgraph RELATE["6. Relationships"]
        GRAPH["LevelGraph Triples"]
    end

    MSG --> DEXIE
    DEXIE --> LIWC
    DEXIE --> EMBED
    DEXIE --> BEHAV

    LIWC --> SQL_FEAT
    BEHAV --> SQL_BEHAV
    EMBED --> VECTOR
    EMBED --> TOPICS

    SQL_FEAT --> DOMAINS
    SQL_BEHAV --> DOMAINS
    VECTOR --> TOPICS
    TOPICS --> GRAPH
    DOMAINS --> CONF
    CONF --> GRAPH
```

---

## 4. Feature Extraction Pipeline

### 4.1 LIWC Analysis Flow

```mermaid
flowchart TB
    subgraph INPUT["Input"]
        TEXT["User Message Text"]
    end

    subgraph PREPROCESS["Preprocessing"]
        TOKENIZE["Tokenization"]
        LOWER["Lowercase"]
        LEMMA["Lemmatization"]
    end

    subgraph EXTRACT["Feature Extraction"]
        PRONOUN["Pronoun Counts<br/>(5 types)"]
        COGNITIVE["Cognitive Words<br/>(6 types)"]
        AFFECT["Affect Words<br/>(10 types)"]
        SOCIAL["Social Words<br/>(6 types)"]
        DRIVES["Drive Words<br/>(5 types)"]
        TIME["Time Words<br/>(3 types)"]
        MORE["...100+ more features"]
    end

    subgraph STORE["Storage"]
        FEATURE_COUNTS["feature_counts table<br/>(wa-sqlite)"]
    end

    TEXT --> TOKENIZE
    TOKENIZE --> LOWER
    LOWER --> LEMMA

    LEMMA --> PRONOUN
    LEMMA --> COGNITIVE
    LEMMA --> AFFECT
    LEMMA --> SOCIAL
    LEMMA --> DRIVES
    LEMMA --> TIME
    LEMMA --> MORE

    PRONOUN --> FEATURE_COUNTS
    COGNITIVE --> FEATURE_COUNTS
    AFFECT --> FEATURE_COUNTS
    SOCIAL --> FEATURE_COUNTS
    DRIVES --> FEATURE_COUNTS
    TIME --> FEATURE_COUNTS
    MORE --> FEATURE_COUNTS
```

### 4.2 Feature Categories (110+ Features)

| Category | Features | Count |
|----------|----------|-------|
| **LIWC Summary** | analytical_thinking, clout, authenticity, emotional_tone | 4 |
| **Pronouns** | 1st_singular, 1st_plural, 2nd_person, 3rd_singular, 3rd_plural | 5 |
| **Cognitive** | insight, causation, discrepancy, tentative, certainty, differentiation | 6 |
| **Affect** | positive_emotion, negative_emotion, anxiety, anger, sadness, joy, trust, fear, surprise, disgust | 10 |
| **Social** | family, friends, social_general, affiliation, achievement, power | 6 |
| **Drives** | affiliation, achievement, power, reward, risk | 5 |
| **Time** | past_focus, present_focus, future_focus | 3 |
| **Perceptual** | see, hear, feel | 3 |
| **Personal** | work, leisure, home, money, religion, death | 6 |
| **Informal** | swear, netspeak, assent, nonfluencies, fillers | 5 |
| **Moral** | care_harm, fairness_cheating, loyalty_betrayal, authority_subversion, sanctity_degradation, liberty_oppression | 6 |
| **Mindset** | growth_language, fixed_language, effort_attribution, ability_attribution | 4 |
| **Metacognition** | planning, monitoring, evaluation, self_correction | 4 |
| **Creativity** | novelty_words, imagination_words, innovation_words, metaphor_count | 4 |
| **Attachment** | trust_words, intimacy_words, independence_words, anxiety_words | 4 |
| **Communication** | formal_language, informal_language, direct_language, indirect_language, assertive_language, hedging_language | 6 |
| **Executive** | inhibition_words, shifting_words, planning_words, organization_words | 4 |
| **Coping** | problem_focused, emotion_focused, avoidant, support_seeking, optimism, self_efficacy | 6 |
| **Values** | self_direction, stimulation, hedonism, achievement, power, security, conformity, tradition, benevolence, universalism | 10 |
| **Decision** | rational_language, intuitive_language, dependent_language, avoidant_language, spontaneous_language | 5 |
| **Political** | authority_language, equality_language, ingroup_language, outgroup_language | 4 |
| **Cultural** | individualism, collectivism | 2 |
| **Sensory** | visual_words, auditory_words, kinesthetic_words, olfactory_words, gustatory_words | 5 |
| **Aesthetic** | beauty_words, complexity_preference, novelty_preference | 3 |
| **TOTAL** | | **110** |

---

## 5. Domain Score Calculation

### 5.1 Feature → Marker → Domain Hierarchy

```mermaid
flowchart TB
    subgraph FEATURES["Raw Features (wa-sqlite)"]
        F1["first_person_singular: 3.2%"]
        F2["insight_words: 2.1%"]
        F3["tentative_words: 1.8%"]
        F4["article_usage: 4.5%"]
        F5["vocabulary_diversity: 0.72"]
    end

    subgraph MARKERS["Derived Markers"]
        M1["Self-Focus Marker"]
        M2["Analytical Marker"]
        M3["Uncertainty Marker"]
        M4["Complexity Marker"]
    end

    subgraph DOMAINS["Domain Scores"]
        D1["big_five_openness: 0.68"]
        D2["cognitive_abilities: 0.72"]
    end

    F1 --> M1
    F2 --> M2
    F3 --> M3
    F4 --> M4
    F5 --> M4

    M1 --> D1
    M2 --> D1
    M2 --> D2
    M3 --> D1
    M4 --> D1
    M4 --> D2
```

### 5.2 Domain Score Update Algorithm

```mermaid
flowchart TB
    subgraph INPUT["Inputs"]
        NEW_FEAT["New Feature Counts"]
        EXISTING["Existing Domain Score"]
        WEIGHTS["Marker Weights<br/>(LevelGraph)"]
    end

    subgraph CALC["Calculation"]
        NORM["Normalize Features"]
        WEIGHT["Apply Marker Weights"]
        AGG["Weighted Aggregation"]
        SMOOTH["Exponential Smoothing<br/>(α = 0.3)"]
    end

    subgraph OUTPUT["Output"]
        NEW_SCORE["Updated Domain Score"]
        DELTA["Score Delta"]
    end

    NEW_FEAT --> NORM
    WEIGHTS --> WEIGHT
    NORM --> WEIGHT
    WEIGHT --> AGG
    EXISTING --> SMOOTH
    AGG --> SMOOTH
    SMOOTH --> NEW_SCORE
    NEW_SCORE --> DELTA
    EXISTING --> DELTA
```

### 5.3 26 Domain Scores

| Category | Domains | Count |
|----------|---------|-------|
| **Personality** | openness, conscientiousness, extraversion, agreeableness, neuroticism | 5 |
| **Cognitive** | cognitive_abilities, information_processing, metacognition, executive_functions, creativity | 5 |
| **Emotional** | emotional_intelligence, resilience_coping, attachment_style, psychopathology_indicators | 4 |
| **Values** | values_motivations, moral_reasoning, political_ideology, cultural_values, mindset_growth_fixed | 5 |
| **Behavioral** | decision_making, communication_style, learning_style, work_career_style | 4 |
| **Other** | social_cognition, time_perspective, sensory_processing, aesthetic_preferences | 3 (incl. in above) |
| **TOTAL** | | **26** |

---

## 6. Confidence Scoring System

### 6.1 Confidence Factor Calculation

```mermaid
flowchart TB
    subgraph FACTORS["Confidence Factors (per domain)"]
        VOL["Data Volume<br/>weight: 0.3"]
        CONS["Consistency<br/>weight: 0.3"]
        REC["Recency<br/>weight: 0.2"]
        CROSS["Cross-Validation<br/>weight: 0.2"]
    end

    subgraph FORMULAS["Factor Formulas"]
        VOL_F["log(wordCount/500) / log(10000/500)"]
        CONS_F["1 - stdDev(recentScores) / maxSD"]
        REC_F["exp(-daysSinceLastData / 30)"]
        CROSS_F["correlation with related domains"]
    end

    subgraph CALC["Final Calculation"]
        WEIGHTED["Weighted Sum"]
        DECAY["Temporal Decay<br/>exp(-days/90)"]
        CLAMP["Clamp 0.0-1.0"]
    end

    subgraph OUTPUT["Confidence Score"]
        SCORE["0.0 - 1.0"]
    end

    VOL --> VOL_F
    CONS --> CONS_F
    REC --> REC_F
    CROSS --> CROSS_F

    VOL_F --> WEIGHTED
    CONS_F --> WEIGHTED
    REC_F --> WEIGHTED
    CROSS_F --> WEIGHTED

    WEIGHTED --> DECAY
    DECAY --> CLAMP
    CLAMP --> SCORE
```

### 6.2 Confidence Levels

| Level | Range | Data Requirements | Action |
|-------|-------|-------------------|--------|
| **Very Low** | 0.0-0.2 | <5 data points | Flag as uncertain |
| **Low** | 0.2-0.4 | 5-15 data points | Include with warning |
| **Moderate** | 0.4-0.6 | 15-30 data points | Normal display |
| **High** | 0.6-0.8 | 30-50 data points | Highlight reliability |
| **Very High** | 0.8-1.0 | >50 + consistency | Full confidence |

---

## 7. Behavioral Metrics (22 Metrics)

### 7.1 Metric Categories

```mermaid
mindmap
    root((Behavioral<br/>Metrics))
        Response Patterns
            avg_response_length_words
            avg_response_length_chars
            avg_sentence_length
            avg_sentences_per_message
        Timing
            avg_response_time_ms
            median_response_time_ms
            avg_session_duration_ms
            avg_time_between_sessions_hours
        Engagement
            avg_messages_per_session
            avg_messages_per_conversation
            session_frequency_per_week
            return_rate
        Content
            question_ratio
            vocabulary_diversity_ttr
            avg_word_length
            rare_word_ratio
        Complexity
            avg_clause_depth
            subordinate_clause_ratio
            lexical_density
        Interaction
            topic_persistence_avg
            topic_switching_rate
            follow_up_question_ratio
```

### 7.2 Metric → Domain Mappings

| Metric | Primary Domains |
|--------|-----------------|
| avg_response_length | extraversion, elaboration |
| vocabulary_diversity | openness, cognitive_abilities |
| response_time | information_processing, deliberation |
| question_ratio | curiosity, learning_style |
| topic_persistence | conscientiousness, focus |
| session_duration | engagement, interest |

---

## 8. Vector Embeddings (TinkerBird)

### 8.1 Embedding Pipeline

```mermaid
flowchart LR
    subgraph INPUT["Input"]
        TEXT["Message Text"]
    end

    subgraph TRANSFORM["Transformers.js"]
        TOKEN["Tokenizer"]
        ENCODE["all-MiniLM-L6-v2"]
        POOL["Mean Pooling"]
        NORM["L2 Normalize"]
    end

    subgraph OUTPUT["Output"]
        VECTOR["384-dim Vector"]
    end

    subgraph STORE["TinkerBird"]
        MSG_EMB["message_embeddings"]
        TOPIC_EMB["topic_embeddings"]
    end

    TEXT --> TOKEN
    TOKEN --> ENCODE
    ENCODE --> POOL
    POOL --> NORM
    NORM --> VECTOR
    VECTOR --> MSG_EMB
    VECTOR --> TOPIC_EMB
```

### 8.2 Vector Collections

| Collection | Purpose | Metadata |
|------------|---------|----------|
| **message_embeddings** | Store all user message vectors | conversationId, timestamp, role, wordCount |
| **topic_embeddings** | Cluster centroids for topics | topicName, messageCount, dominantDomains |
| **concept_embeddings** | Knowledge concepts (Phase 3) | conceptName, domain, masteryLevel |
| **user_interest_embeddings** | Aggregated interest areas | interestName, strength, mentionCount |

### 8.3 Semantic Operations

| Operation | Purpose |
|-----------|---------|
| **Similarity Search** | Find related messages/topics |
| **Topic Clustering** | Group messages into topics |
| **Semantic Distance** | Measure creativity (unusual associations) |
| **Interest Detection** | Track recurring themes |

---

## 9. Knowledge Graph (LevelGraph)

### 9.1 Triple Structure

```
Subject → Predicate → Object
```

### 9.2 Relationship Types

```mermaid
graph TB
    subgraph USER_TOPIC["User-Topic Relations"]
        U1["user:default"] -->|interested_in| T1["topic:machine_learning"]
        U1 -->|interested_in| T2["topic:philosophy"]
        U1 -->|last_discussed| T1
    end

    subgraph TOPIC_DOMAIN["Topic-Domain Mappings"]
        T1 -->|indicates| D1["domain:big_five_openness"]
        T1 -->|indicates| D2["domain:cognitive_abilities"]
        T2 -->|indicates| D1
    end

    subgraph DOMAIN_MARKER["Domain-Marker Relations"]
        D1 -->|measured_by| M1["marker:vocabulary_diversity"]
        D1 -->|measured_by| M2["marker:insight_words"]
    end

    subgraph MARKER_FEATURE["Marker-Feature Relations"]
        M1 -->|computed_from| F1["feature:type_token_ratio"]
        M2 -->|computed_from| F2["feature:cognitive_insight"]
    end
```

### 9.3 Graph Queries

```typescript
// Find all domains indicated by a topic
levelgraph.get({ subject: 'topic:machine_learning', predicate: 'indicates' })

// Find all markers for a domain
levelgraph.get({ subject: 'domain:creativity', predicate: 'measured_by' })

// Find user's topics
levelgraph.get({ subject: 'user:default', predicate: 'interested_in' })

// Traverse: Features → Markers → Domains
async function getDomainFeatures(domainId: string) {
  const markers = await levelgraph.get({ subject: domainId, predicate: 'measured_by' });
  const features = [];
  for (const m of markers) {
    const f = await levelgraph.get({ subject: m.object, predicate: 'computed_from' });
    features.push(...f);
  }
  return features;
}
```

---

## 10. Historical Tracking

### 10.1 Domain History Snapshots

```mermaid
sequenceDiagram
    participant DomainCalc as Domain Calculator
    participant SQL as wa-sqlite
    participant History as domain_history

    DomainCalc->>SQL: Calculate new score
    SQL->>SQL: Compare with previous

    alt Score change > threshold (0.05)
        SQL->>History: Insert snapshot
        Note over History: {domain_id, score,<br/>confidence, recorded_at,<br/>trigger: 'significant_change'}
    else Scheduled snapshot
        SQL->>History: Insert snapshot
        Note over History: trigger: 'scheduled'
    end
```

### 10.2 Trend Analysis Data

| Field | Type | Purpose |
|-------|------|---------|
| domain_id | TEXT | Which domain |
| score | REAL | Score at snapshot |
| confidence | REAL | Confidence at snapshot |
| data_points_count | INT | Data volume |
| recorded_at | TIMESTAMP | When captured |
| trigger | TEXT | Why captured |

---

## 11. Phase Data Requirements

### 11.1 Phase 1 (MVP) - Complete

| Store | Tables | Purpose |
|-------|--------|---------|
| Dexie.js | conversations, messages | Raw conversation storage |
| wa-sqlite | profiles, domain_scores (5 Big Five) | Basic profile |

### 11.2 Phase 2 (Enhanced) - Current

| Store | Tables | Purpose |
|-------|--------|---------|
| Dexie.js | conversations, messages, sessions | + Session tracking |
| wa-sqlite | profiles, domain_scores (26), feature_counts (110+), behavioral_metrics (22), domain_history, confidence_factors | Full profiling |
| TinkerBird | message_embeddings, topic_embeddings | Semantic analysis |
| LevelGraph | user-topic, topic-domain, domain-marker, marker-feature | Relationship modeling |

### 11.3 Phase 3 (Learning)

| Store | Tables | Purpose |
|-------|--------|---------|
| wa-sqlite | knowledge_states, learning_events, knowledge_gaps | Learning tracking |
| TinkerBird | concept_embeddings | Concept similarity |
| LevelGraph | concept-prerequisite, user-mastery | Learning graph |

### 11.4 Phase 4 (Advanced)

| Store | Tables | Purpose |
|-------|--------|---------|
| wa-sqlite | strategic_questions, validation_results, audio_features | Advanced profiling |
| LevelGraph | context-trait, question-domain | Context modeling |

---

## 12. Data Counts Summary

| Category | Count |
|----------|-------|
| **Psychological Domains** | 26 |
| **LIWC Feature Categories** | 23 |
| **Individual Features** | 110+ |
| **Behavioral Metrics** | 22 |
| **Confidence Factors** | 104 (4 per domain) |
| **Vector Collections** | 4 |
| **Graph Relationship Types** | 5 |
| **Database Tables (Phase 2)** | 14+ |

---

## 13. Related Documents

- [Architecture-High-Level.md](Architecture-High-Level.md) - System overview
- [Architecture-Low-Level.md](Architecture-Low-Level.md) - Component specifications
- [schema.md](schema.md) - Complete database schemas
- [domain-markers.md](domain-markers.md) - All psychological domain markers
- [phases.md](phases.md) - Development roadmap
