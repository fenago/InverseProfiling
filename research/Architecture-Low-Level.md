# Low-Level Architecture: Privacy-Preserving Digital Twin

## Overview

This document provides detailed technical specifications for each component of the browser-based digital twin system, including data models, component interactions, and implementation details.

---

## 1. Frontend Application Architecture

```mermaid
flowchart TB
    subgraph REACT_APP["React 19 Application"]
        subgraph PAGES["Pages"]
            CHAT["Chat Interface"]
            PROFILE["Profile Dashboard"]
            LEARN["Learning Module"]
            SETTINGS["Settings"]
        end

        subgraph COMPONENTS["Core Components"]
            MSG_INPUT["Message Input"]
            MSG_DISPLAY["Message Display"]
            VOICE_REC["Voice Recorder"]
            VIDEO_CAP["Video Capture"]
            PROFILE_VIZ["Profile Visualizer"]
            CONFIDENCE_UI["Confidence Meters"]
        end

        subgraph HOOKS["Custom Hooks"]
            USE_TWIN["useTwin()"]
            USE_PROFILE["useProfile()"]
            USE_LLM["useLLM()"]
            USE_EMBED["useEmbeddings()"]
            USE_SPEECH["useSpeechAnalysis()"]
        end

        subgraph CONTEXT["React Context Providers"]
            TWIN_CTX["TwinContext"]
            PROFILE_CTX["ProfileContext"]
            STORAGE_CTX["StorageContext"]
            ML_CTX["MLContext"]
        end

        subgraph WORKERS["Web Workers"]
            LLM_WORKER["LLM Worker"]
            EMBED_WORKER["Embedding Worker"]
            ANALYSIS_WORKER["Analysis Worker"]
            STORAGE_WORKER["Storage Worker"]
        end
    end

    CHAT --> MSG_INPUT
    CHAT --> MSG_DISPLAY
    CHAT --> VOICE_REC
    PROFILE --> PROFILE_VIZ
    PROFILE --> CONFIDENCE_UI

    MSG_INPUT --> USE_LLM
    VOICE_REC --> USE_SPEECH
    USE_LLM --> TWIN_CTX
    USE_PROFILE --> PROFILE_CTX

    TWIN_CTX --> LLM_WORKER
    ML_CTX --> EMBED_WORKER
    PROFILE_CTX --> ANALYSIS_WORKER
    STORAGE_CTX --> STORAGE_WORKER
```

---

## 2. Storage Layer Architecture

### 2.1 Four-Database Architecture

```mermaid
flowchart TB
    subgraph STORAGE["Four-Database Storage Architecture"]
        subgraph DEXIE["Dexie.js (IndexedDB)"]
            D1["conversations"]
            D2["messages"]
            D3["sessions"]
        end

        subgraph SQLITE["wa-sqlite (SQL)"]
            S1["profiles"]
            S2["domain_scores (26)"]
            S3["feature_counts (100+)"]
            S4["behavioral_metrics (22)"]
            S5["domain_history"]
            S6["confidence_factors"]
            S7["liwc_word_lists"]
        end

        subgraph TINKER["TinkerBird (Vector)"]
            T1["message_embeddings"]
            T2["topic_embeddings"]
            T3["concept_embeddings"]
            T4["user_interest_embeddings"]
        end

        subgraph GRAPH["LevelGraph (Graph)"]
            G1["user-topic relations"]
            G2["topic-domain mappings"]
            G3["concept-concept links"]
            G4["domain-marker relations"]
            G5["marker-feature relations"]
        end
    end

    D2 --> |"embeddingId FK"| T1
    D2 --> |"extractedTopics"| G1
    S2 --> |"domain_id"| G4
    S3 --> |"feature FK"| G5
    T3 --> |"levelGraphNodeId"| G1
```

### 2.2 Database Schema Design

```mermaid
erDiagram
    PROFILES ||--o{ DOMAIN_SCORES : has
    PROFILES ||--o{ BEHAVIORAL_METRICS : tracks

    DOMAIN_SCORES ||--o{ FEATURE_COUNTS : computed_from
    DOMAIN_SCORES ||--o{ DOMAIN_HISTORY : snapshots
    DOMAIN_SCORES ||--o{ CONFIDENCE_FACTORS : measured_by

    CONVERSATIONS ||--o{ MESSAGES : contains
    CONVERSATIONS ||--o{ SESSIONS : belongs_to

    MESSAGES ||--o{ MESSAGE_EMBEDDINGS : has
    MESSAGES ||--o{ AUDIO_FEATURES : may_have

    DOMAIN_SCORES }o--|| GRAPH_DOMAIN_MARKER : mapped_by
    FEATURE_COUNTS }o--|| GRAPH_MARKER_FEATURE : computed_via

    PROFILES {
        string id PK
        timestamp created_at
        timestamp last_updated
        int schema_version
        int total_messages
        int total_words
        int total_sessions
        timestamp first_interaction
        float profile_completeness
    }

    DOMAIN_SCORES {
        int id PK
        string domain_id UK
        string domain_category
        float score
        float raw_score
        float confidence
        timestamp last_updated
        int data_points_count
    }

    FEATURE_COUNTS {
        int id PK
        string category
        string feature_name
        int count
        int total_words_analyzed
        float percentage
        timestamp last_updated
        int sample_size
    }

    BEHAVIORAL_METRICS {
        int id PK
        string metric_name UK
        float current_value
        float cumulative_value
        float min_value
        float max_value
        int sample_size
        float std_deviation
        string unit
    }

    DOMAIN_HISTORY {
        int id PK
        string domain_id FK
        float score
        float confidence
        int data_points_count
        timestamp recorded_at
        string trigger
    }

    CONFIDENCE_FACTORS {
        int id PK
        string domain_id FK
        string factor_name
        float value
        float weight
        timestamp last_updated
    }

    CONVERSATIONS {
        string id PK
        timestamp startedAt
        timestamp endedAt
        int messageCount
        json metadata
    }

    MESSAGES {
        string id PK
        string conversationId FK
        string role
        string content
        timestamp timestamp
        json processingMetadata
    }

    SESSIONS {
        string id PK
        timestamp startedAt
        timestamp endedAt
        int durationMs
        int messageCount
        json metrics
    }

    MESSAGE_EMBEDDINGS {
        string id PK
        float384 vector
        json metadata
    }

    AUDIO_FEATURES {
        int id PK
        string message_id FK
        float avg_pitch_hz
        float pitch_variability
        float speaking_rate_wpm
        float pause_frequency
        timestamp extracted_at
    }

    GRAPH_DOMAIN_MARKER {
        string subject
        string predicate
        string object
        float weight
    }

    GRAPH_MARKER_FEATURE {
        string subject
        string predicate
        string object
    }
```

### 2.3 Storage Technology Mapping

```mermaid
flowchart LR
    subgraph DATA_TYPES["Data Types"]
        RAW["Raw Interactions<br/>(Messages, Sessions)"]
        STRUCTURED["Structured Data<br/>(Profiles, Scores, Metrics)"]
        VECTORS["Vector Embeddings<br/>(384-dim Semantic)"]
        RELATIONSHIPS["Graph Relationships<br/>(SPO Triples)"]
    end

    subgraph STORAGE_TECH["Storage Technologies"]
        DEXIE["Dexie.js<br/>(IndexedDB Wrapper)"]
        WA_SQLITE["wa-sqlite<br/>(WebAssembly SQLite)"]
        TINKERBIRD["TinkerBird<br/>(Vector DB)"]
        LEVELGRAPH["LevelGraph<br/>(Triple Store)"]
    end

    RAW --> DEXIE
    STRUCTURED --> WA_SQLITE
    VECTORS --> TINKERBIRD
    RELATIONSHIPS --> LEVELGRAPH

    DEXIE --> |"conversations, messages<br/>sessions (3 tables)"| DB1[(IndexedDB)]
    WA_SQLITE --> |"profiles, domain_scores<br/>feature_counts, behavioral_metrics<br/>domain_history, confidence_factors<br/>(7 core tables)"| DB2[(SQLite WASM)]
    TINKERBIRD --> |"message_embeddings<br/>topic_embeddings<br/>concept_embeddings<br/>(4 collections)"| DB3[(Vector Index)]
    LEVELGRAPH --> |"user-topic, topic-domain<br/>domain-marker, marker-feature<br/>(5 relationship types)"| DB4[(LevelDB)]
```

### 2.4 Cross-Database Foreign Key Mapping

```mermaid
flowchart TB
    subgraph DEXIE["Dexie.js"]
        MSG["messages.id"]
        CONV["conversations.id"]
        SESS["sessions.id"]
    end

    subgraph SQLITE["wa-sqlite"]
        DOMAIN["domain_scores.domain_id"]
        FEAT["feature_counts (category, feature_name)"]
        LEARN["learning_events.conversation_id"]
        AUDIO["audio_features.message_id"]
    end

    subgraph TINKER["TinkerBird"]
        MSG_EMB["message_embeddings.id"]
        TOPIC_EMB["topic_embeddings.id"]
        CONCEPT_EMB["concept_embeddings.metadata.levelGraphNodeId"]
    end

    subgraph GRAPH["LevelGraph"]
        TOPIC_NODE["topic:* nodes"]
        DOMAIN_NODE["domain:* nodes"]
        MARKER_NODE["marker:* nodes"]
        FEATURE_NODE["feature:* nodes"]
    end

    MSG --> |"embeddingId"| MSG_EMB
    MSG --> |"extractedTopics"| TOPIC_NODE
    MSG --> |"FK"| AUDIO
    CONV --> |"FK"| LEARN
    DOMAIN --> |"maps to"| DOMAIN_NODE
    FEAT --> |"maps to"| MARKER_NODE
    FEAT --> |"maps to"| FEATURE_NODE
    CONCEPT_EMB --> |"FK"| TOPIC_NODE
```

### 2.5 Entity ID Conventions

| Database | Entity Type | ID Format | Example |
|----------|-------------|-----------|---------|
| Dexie | Conversation | UUID | `conv_a1b2c3d4-...` |
| Dexie | Message | UUID | `msg_e5f6g7h8-...` |
| Dexie | Session | UUID | `sess_i9j0k1l2-...` |
| wa-sqlite | Domain | snake_case | `big_five_openness` |
| wa-sqlite | Feature | category:name | `affect:positive_emotion` |
| wa-sqlite | Metric | snake_case | `avg_response_time_ms` |
| TinkerBird | Embedding | Matches source ID | `msg_e5f6g7h8-...` |
| LevelGraph | Node | type:name | `topic:machine_learning` |

---

## 3. AI/ML Pipeline Architecture

### 3.1 Model Loading & Inference Pipeline (MediaPipe LLM)

```mermaid
sequenceDiagram
    participant UI as React UI
    participant Worker as Web Worker
    participant MediaPipe as MediaPipe LLM Engine
    participant GPU as WebGPU
    participant Cache as Model Cache (IndexedDB)

    UI->>Worker: Initialize LLM
    Worker->>Cache: Check cached model (.litertlm)

    alt Model cached
        Cache-->>Worker: Return cached model
    else Model not cached
        Worker->>MediaPipe: Download model from CDN
        Note over MediaPipe: gemma-3n-E4B-it-int4-Web.litertlm<br/>or E2B/270M variants
        MediaPipe-->>Worker: Model file
        Worker->>Cache: Store in IndexedDB
    end

    Worker->>GPU: Load model to GPU memory
    GPU-->>Worker: Model ready

    loop Chat Interaction
        UI->>Worker: Send message + profile context
        Worker->>Worker: Build personalized prompt
        Worker->>MediaPipe: Generate response (streaming)
        MediaPipe->>GPU: Run inference (WebGPU)
        GPU-->>MediaPipe: Token logits
        MediaPipe-->>Worker: Streamed tokens
        Worker-->>UI: Display tokens progressively
        Worker->>Worker: Queue message for analysis
    end

    Note over Worker: Post-response analysis pipeline
    Worker->>Worker: LIWC feature extraction
    Worker->>Worker: Behavioral metrics update
    Worker->>Worker: Embedding generation
```

### 3.2 Embedding Pipeline

```mermaid
flowchart TB
    subgraph INPUT["Input Text"]
        USER_MSG["User Message"]
        AI_RESP["AI Response"]
        CONTEXT["Contextual Data"]
    end

    subgraph TRANSFORMERS["Transformers.js Pipeline"]
        TOKENIZER["Tokenizer<br/>(WASM)"]
        ENCODER["Encoder Model<br/>(all-MiniLM-L6-v2)"]
        POOLING["Mean Pooling"]
        NORMALIZE["L2 Normalization"]
    end

    subgraph OUTPUT["Output"]
        VECTOR["384-dim Vector"]
        TINKER["TinkerBird Store"]
    end

    USER_MSG --> TOKENIZER
    AI_RESP --> TOKENIZER
    CONTEXT --> TOKENIZER

    TOKENIZER --> ENCODER
    ENCODER --> POOLING
    POOLING --> NORMALIZE
    NORMALIZE --> VECTOR
    VECTOR --> TINKER
```

---

## 4. Inverse Profiling Engine

### 4.1 Linguistic Analysis Pipeline

```mermaid
flowchart TB
    subgraph INPUT["Text Input"]
        RAW_TEXT["Raw User Text"]
    end

    subgraph PREPROCESSING["Preprocessing"]
        TOKENIZE["Tokenization"]
        POS["POS Tagging"]
        LEMMA["Lemmatization"]
        ENTITY["Entity Recognition"]
    end

    subgraph LIWC_ANALYSIS["LIWC-Style Analysis"]
        PRONOUN["Pronoun Analysis<br/>(I, we, you, they)"]
        EMOTION["Emotion Words<br/>(positive, negative, anxiety)"]
        COGNITIVE["Cognitive Words<br/>(cause, insight, tentative)"]
        SOCIAL["Social Words<br/>(family, friends, humans)"]
        TEMPORAL["Temporal Focus<br/>(past, present, future)"]
        FORMAL["Formality Markers<br/>(articles, prepositions)"]
    end

    subgraph DERIVED_METRICS["Derived Metrics"]
        COMPLEXITY["Lexical Complexity"]
        DIVERSITY["Vocabulary Diversity"]
        SENTIMENT["Sentiment Polarity"]
        CERTAINTY["Certainty Score"]
    end

    subgraph TRAIT_INFERENCE["Trait Inference"]
        BIG5["Big Five Scores"]
        COGNITIVE_STYLE["Cognitive Style"]
        EMOTIONAL_STATE["Emotional State"]
        VALUES["Value Indicators"]
    end

    RAW_TEXT --> TOKENIZE
    TOKENIZE --> POS
    POS --> LEMMA
    LEMMA --> ENTITY

    LEMMA --> PRONOUN
    LEMMA --> EMOTION
    LEMMA --> COGNITIVE
    LEMMA --> SOCIAL
    LEMMA --> TEMPORAL
    POS --> FORMAL

    PRONOUN --> COMPLEXITY
    EMOTION --> SENTIMENT
    COGNITIVE --> CERTAINTY
    FORMAL --> DIVERSITY

    PRONOUN --> BIG5
    EMOTION --> EMOTIONAL_STATE
    COGNITIVE --> COGNITIVE_STYLE
    SOCIAL --> BIG5
    TEMPORAL --> VALUES

    COMPLEXITY --> COGNITIVE_STYLE
    DIVERSITY --> BIG5
```

### 4.2 Confidence Scoring Algorithm

```mermaid
flowchart TB
    subgraph INPUTS["Confidence Inputs"]
        DATA_VOL["Data Volume<br/>(word count, sessions)"]
        CONSISTENCY["Cross-Session<br/>Consistency"]
        RECENCY["Data Recency"]
        VALIDATION["Optional Validation<br/>Test Results"]
    end

    subgraph WEIGHTS["Domain-Specific Weights"]
        W1["Personality: 0.3"]
        W2["Cognitive: 0.25"]
        W3["Emotional: 0.25"]
        W4["Values: 0.2"]
    end

    subgraph CALCULATION["Confidence Calculation"]
        BASE["Base Confidence<br/>(0.0 - 1.0)"]
        DECAY["Temporal Decay<br/>Factor"]
        BOOST["Validation Boost"]
    end

    subgraph OUTPUT["Final Score"]
        CONF_SCORE["Domain Confidence<br/>(0.0 - 1.0)"]
        THRESHOLD["Actionable Threshold<br/>(>= 0.7)"]
    end

    DATA_VOL --> BASE
    CONSISTENCY --> BASE
    RECENCY --> DECAY
    VALIDATION --> BOOST

    BASE --> CONF_SCORE
    DECAY --> CONF_SCORE
    BOOST --> CONF_SCORE

    CONF_SCORE --> THRESHOLD
```

### 4.3 Confidence Score Formula

```
Confidence(domain) = min(1.0,
    (DataVolumeFactor × 0.4) +
    (ConsistencyFactor × 0.3) +
    (RecencyFactor × 0.2) +
    (ValidationBoost × 0.1)
) × TemporalDecay

Where:
- DataVolumeFactor = log(wordCount / 500) / log(10000 / 500), capped at 1.0
- ConsistencyFactor = 1 - StandardDeviation(recentScores) / MaxPossibleSD
- RecencyFactor = exp(-daysSinceLastData / 30)
- ValidationBoost = 0.3 if formal test completed, else 0
- TemporalDecay = exp(-daysSinceLastUpdate / 90)
```

---

## 5. Knowledge Graph Structure

### 5.1 Graph Schema

```mermaid
graph TB
    subgraph NODES["Node Types"]
        TRAIT["Trait Node<br/>(personality, cognitive, etc)"]
        CONTEXT["Context Node<br/>(work, family, stress)"]
        BEHAVIOR["Behavior Node<br/>(actions, patterns)"]
        TRIGGER["Trigger Node<br/>(events, stimuli)"]
    end

    subgraph EDGES["Relationship Types"]
        INFLUENCES["INFLUENCES<br/>(weight: 0-1)"]
        ACTIVATES["ACTIVATES_IN<br/>(context-dependent)"]
        CORRELATES["CORRELATES_WITH<br/>(statistical)"]
        CONTRADICTS["CONTRADICTS<br/>(negative correlation)"]
    end

    TRAIT -->|INFLUENCES| BEHAVIOR
    CONTEXT -->|ACTIVATES| TRAIT
    TRIGGER -->|ACTIVATES| BEHAVIOR
    TRAIT -->|CORRELATES| TRAIT
    BEHAVIOR -->|CONTRADICTS| BEHAVIOR
```

### 5.2 Example Graph Instance

```mermaid
graph LR
    subgraph PERSONALITY["Personality Cluster"]
        O["Openness: 0.78"]
        C["Conscientiousness: 0.65"]
        E["Extraversion: 0.42"]
        A["Agreeableness: 0.71"]
        N["Neuroticism: 0.38"]
    end

    subgraph CONTEXT["Context Cluster"]
        WORK["Work Context"]
        STRESS["Stress Context"]
        SOCIAL["Social Context"]
    end

    subgraph BEHAVIOR["Behavior Cluster"]
        ANALYTICAL["Analytical<br/>Decision Making"]
        CREATIVE["Creative<br/>Problem Solving"]
        COLLABORATIVE["Collaborative<br/>Communication"]
    end

    O -->|"influences: 0.8"| CREATIVE
    C -->|"influences: 0.7"| ANALYTICAL
    E -->|"influences: 0.6"| COLLABORATIVE

    STRESS -->|"activates"| N
    STRESS -->|"suppresses"| CREATIVE
    WORK -->|"activates"| ANALYTICAL
    SOCIAL -->|"activates"| E
```

---

## 6. Adaptive Learning Engine

### 6.1 Learning Path Generation

```mermaid
flowchart TB
    subgraph PROFILE_INPUT["Profile Input"]
        LEARNING_STYLE["Learning Style<br/>(Visual/Auditory/Kinesthetic)"]
        COGNITIVE_LEVEL["Cognitive Level<br/>(Bloom's Taxonomy)"]
        MOTIVATION["Motivation Type<br/>(Achievement/Affiliation)"]
        ZPD["Zone of Proximal<br/>Development"]
    end

    subgraph CONTENT_SELECTION["Content Selection"]
        DIFFICULTY["Difficulty Calibration"]
        FORMAT["Format Selection"]
        PACING["Pacing Strategy"]
        SCAFFOLDING["Scaffolding Level"]
    end

    subgraph OUTPUT_CONTENT["Personalized Content"]
        EXPLANATION["Tailored Explanation"]
        EXAMPLES["Relevant Examples"]
        EXERCISES["Calibrated Exercises"]
        FEEDBACK["Personalized Feedback"]
    end

    LEARNING_STYLE --> FORMAT
    COGNITIVE_LEVEL --> DIFFICULTY
    MOTIVATION --> PACING
    ZPD --> DIFFICULTY
    ZPD --> SCAFFOLDING

    DIFFICULTY --> EXPLANATION
    FORMAT --> EXPLANATION
    PACING --> EXERCISES
    SCAFFOLDING --> EXAMPLES

    EXPLANATION --> FEEDBACK
    EXERCISES --> FEEDBACK
```

### 6.2 Adaptive Response Generation

```mermaid
sequenceDiagram
    participant User
    participant LLM as Local LLM
    participant Profile as Profile Manager
    participant Graph as Knowledge Graph
    participant Adapt as Adaptive Engine

    User->>LLM: Send question/request
    LLM->>Profile: Get current profile
    Profile-->>LLM: Trait scores + confidence
    LLM->>Graph: Query relevant context
    Graph-->>LLM: Contextual relationships
    LLM->>Adapt: Get communication strategy
    Adapt-->>LLM: Style parameters

    Note over LLM: Build personalized prompt:<br/>- Adjust formality<br/>- Match cognitive style<br/>- Align with values<br/>- Use preferred examples

    LLM->>User: Personalized response
    User->>LLM: Reaction/follow-up
    LLM->>Profile: Update inference data
```

---

## 7. Strategic Questioning System

### 7.1 Question Selection Algorithm

```mermaid
flowchart TB
    subgraph UNCERTAINTY["Uncertainty Analysis"]
        LOW_CONF["Identify Low<br/>Confidence Domains"]
        STALE["Identify Stale<br/>Data"]
        GAPS["Identify Profile<br/>Gaps"]
    end

    subgraph QUESTION_BANK["Question Bank"]
        DIAGNOSTIC["Diagnostic Questions<br/>(Phase 1)"]
        TARGETED["Targeted Questions<br/>(Phase 2)"]
        VALIDATION["Validation Questions<br/>(Phase 3)"]
    end

    subgraph SELECTION["Selection Criteria"]
        INFO_GAIN["Expected<br/>Information Gain"]
        NATURAL["Naturalness in<br/>Conversation"]
        TIMING["Appropriate<br/>Timing"]
    end

    subgraph OUTPUT["Selected Question"]
        QUESTION["Context-Appropriate<br/>Strategic Question"]
    end

    LOW_CONF --> INFO_GAIN
    STALE --> INFO_GAIN
    GAPS --> INFO_GAIN

    DIAGNOSTIC --> NATURAL
    TARGETED --> NATURAL
    VALIDATION --> NATURAL

    INFO_GAIN --> QUESTION
    NATURAL --> QUESTION
    TIMING --> QUESTION
```

---

## 8. WebGPU Acceleration Architecture

```mermaid
flowchart TB
    subgraph CPU_TASKS["CPU-Bound Tasks"]
        TOKENIZATION["Tokenization"]
        PREPROCESSING["Text Preprocessing"]
        POSTPROCESSING["Response Postprocessing"]
        STORAGE_OPS["Storage Operations"]
    end

    subgraph GPU_TASKS["GPU-Accelerated Tasks"]
        LLM_INFERENCE["LLM Inference<br/>(WebLLM)"]
        EMBED_COMPUTE["Embedding Generation<br/>(Transformers.js)"]
        VECTOR_OPS["Vector Similarity<br/>Search"]
        TENSOR_OPS["TensorFlow.js<br/>Operations"]
    end

    subgraph MEMORY["Memory Management"]
        GPU_MEM["GPU Memory<br/>(Model Weights)"]
        SHARED_MEM["Shared ArrayBuffers"]
        CPU_MEM["CPU Memory<br/>(Intermediate)"]
    end

    TOKENIZATION --> |"Input IDs"| LLM_INFERENCE
    PREPROCESSING --> |"Clean Text"| EMBED_COMPUTE

    LLM_INFERENCE --> |"Logits"| POSTPROCESSING
    EMBED_COMPUTE --> |"Vectors"| VECTOR_OPS

    GPU_MEM --> LLM_INFERENCE
    GPU_MEM --> TENSOR_OPS
    SHARED_MEM --> EMBED_COMPUTE
```

---

## 9. Component Specifications

| Component | Technology | Memory Footprint | Initialization Time |
|-----------|------------|------------------|---------------------|
| **LLM (Gemma 3n E4B)** | MediaPipe + WebGPU | ~3-4 GB GPU | 10-30s (cached) |
| **LLM (Gemma 3n E2B)** | MediaPipe + WebGPU | ~1.5-2 GB GPU | 8-20s (cached) |
| **LLM (Gemma 270M)** | MediaPipe + WebGPU | ~500 MB GPU | 5-10s (cached) |
| **Embeddings** | Transformers.js (all-MiniLM-L6-v2) | ~100 MB | 2-5s |
| **Vector DB** | TinkerBird | ~50 MB base, grows to ~200MB | <1s |
| **Graph DB** | LevelGraph + level-js | ~20 MB base | <1s |
| **SQL DB** | wa-sqlite (WASM) | ~10 MB + data | <1s |
| **IndexedDB** | Dexie.js | ~10 MB base | <1s |
| **TensorFlow.js** | WebGL/WebGPU | Varies by model | 2-10s |

### 9.1 Storage Size Estimates

| Database | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|----------|---------|---------|---------|---------|
| Dexie.js | 10 MB | 50 MB | 100 MB | 200 MB |
| wa-sqlite | 5 MB | 20 MB | 40 MB | 50 MB |
| TinkerBird | 20 MB | 200 MB | 400 MB | 500 MB |
| LevelGraph | 1 MB | 10 MB | 50 MB | 100 MB |
| **Total** | **36 MB** | **280 MB** | **590 MB** | **850 MB** |

*Estimates based on: 1,000 messages/month, 384-dim embeddings, 22 domains with history*

### 9.2 Gemma 3n Model Options

| Model | Parameters | Format | GPU Memory | Download URL |
|-------|------------|--------|------------|--------------|
| **E4B (Recommended)** | ~4B | int4 | ~3-4 GB | [gemma-3n-E4B-it-int4-Web.litertlm](https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma-3n-E4B-it-int4-Web.litertlm) |
| **E2B (Balanced)** | ~2B | int4 | ~1.5-2 GB | [gemma-3n-E2B-it-int4-Web.litertlm](https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma-3n-E2B-it-int4-Web.litertlm) |
| **270M (Fallback)** | 270M | q8 | ~500 MB | [gemma3-270m-it-q8-web.task](https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma3-270m-it-q8-web.task) |

### 9.3 Data Volume Summary

| Database | Tables | Records (Phase 2) |
|----------|--------|-------------------|
| Dexie.js | 3 | conversations, messages, sessions |
| wa-sqlite | 7 | profiles (1), domain_scores (26), feature_counts (110+), behavioral_metrics (22), domain_history (∞), confidence_factors (104) |
| TinkerBird | 4 | message_embeddings (∞), topic_embeddings (~100), concept_embeddings (~500), user_interest_embeddings (~50) |
| LevelGraph | 5 types | ~1000+ triples (domain-marker, marker-feature, user-topic, topic-domain, concept-concept) |

```mermaid
flowchart TD
    subgraph MODEL_SELECTION["Dynamic Model Selection"]
        CHECK_GPU["Check GPU Memory"]
        CHECK_GPU -->|">= 4GB"| E4B["Load E4B<br/>(Best Quality)"]
        CHECK_GPU -->|"2-4GB"| E2B["Load E2B<br/>(Balanced)"]
        CHECK_GPU -->|"< 2GB"| TINY["Load 270M<br/>(Fallback)"]
    end

    subgraph FALLBACK["Runtime Fallback"]
        E4B -->|"OOM Error"| E2B
        E2B -->|"OOM Error"| TINY
    end
```

---

## 10. Error Handling & Recovery

```mermaid
flowchart TB
    subgraph ERRORS["Error Types"]
        MODEL_FAIL["Model Loading<br/>Failure"]
        GPU_FAIL["GPU Memory<br/>Exhaustion"]
        STORAGE_FAIL["Storage Quota<br/>Exceeded"]
        INFERENCE_FAIL["Inference<br/>Timeout"]
    end

    subgraph RECOVERY["Recovery Strategies"]
        FALLBACK_MODEL["Fallback to<br/>Smaller Model"]
        CLEAR_CACHE["Clear Model<br/>Cache"]
        COMPRESS_DATA["Compress Old<br/>Data"]
        RETRY_LOGIC["Exponential<br/>Backoff Retry"]
    end

    subgraph USER_FEEDBACK["User Feedback"]
        PROGRESS["Progress<br/>Indicators"]
        ERROR_MSG["Friendly Error<br/>Messages"]
        RECOVERY_UI["Recovery<br/>Options"]
    end

    MODEL_FAIL --> FALLBACK_MODEL
    GPU_FAIL --> CLEAR_CACHE
    STORAGE_FAIL --> COMPRESS_DATA
    INFERENCE_FAIL --> RETRY_LOGIC

    FALLBACK_MODEL --> PROGRESS
    CLEAR_CACHE --> ERROR_MSG
    COMPRESS_DATA --> RECOVERY_UI
    RETRY_LOGIC --> PROGRESS
```

---

## 11. Data Export/Import Schema

```json
{
  "exportVersion": "2.0.0",
  "exportDate": "ISO8601 timestamp",
  "profile": {
    "id": "default",
    "created": "ISO8601",
    "totalMessages": 0,
    "totalWords": 0,
    "totalSessions": 0,
    "profileCompleteness": 0.0
  },
  "domainScores": [
    {
      "domainId": "big_five_openness",
      "category": "personality",
      "score": 0.5,
      "confidence": 0.0,
      "dataPointsCount": 0,
      "lastUpdated": "ISO8601"
    }
  ],
  "featureCounts": [
    {
      "category": "affect",
      "featureName": "positive_emotion",
      "count": 0,
      "totalWordsAnalyzed": 0,
      "percentage": 0.0
    }
  ],
  "behavioralMetrics": [
    {
      "metricName": "avg_response_length_words",
      "currentValue": 0.0,
      "sampleSize": 0,
      "unit": "words"
    }
  ],
  "conversations": [
    {
      "id": "uuid",
      "startedAt": "ISO8601",
      "endedAt": "ISO8601",
      "messageCount": 0,
      "messages": [
        {
          "id": "uuid",
          "role": "user",
          "content": "string",
          "timestamp": "ISO8601"
        }
      ]
    }
  ],
  "sessions": [
    {
      "id": "uuid",
      "startedAt": "ISO8601",
      "durationMs": 0,
      "messageCount": 0
    }
  ],
  "domainHistory": [
    {
      "domainId": "big_five_openness",
      "score": 0.5,
      "confidence": 0.0,
      "recordedAt": "ISO8601"
    }
  ],
  "graphRelationships": {
    "userTopics": [],
    "topicDomains": [],
    "domainMarkers": [],
    "markerFeatures": []
  },
  "settings": {}
}
```

---

## 12. Related Documents

- [Architecture-High-Level.md](Architecture-High-Level.md) - System overview and architecture diagrams
- [Data-Architecture.md](Data-Architecture.md) - Comprehensive data flow documentation
- [schema.md](schema.md) - Complete database schemas
- [domain-markers.md](domain-markers.md) - All 22 psychological domain markers
- [phases.md](phases.md) - Development roadmap
