# High-Level Architecture: Privacy-Preserving Digital Twin

## Overview

This document describes the high-level architecture for a browser-based, privacy-preserving AI system that learns and adapts to users through inverse profiling. All processing occurs on-device with zero data leaving the browser.

**Status:** Phase 1 Complete | Phase 2 In Planning

---

## System Architecture Diagram

```mermaid
flowchart TB
    subgraph USER["User Layer"]
        UI[/"Web Interface"/]
        MIC["Microphone Input"]
        CAM["Camera Input"]
        TEXT["Text Input"]
    end

    subgraph BROWSER["Browser Runtime (All On-Device)"]
        subgraph INPUT_PROCESSING["Input Processing Layer"]
            AUDIO_PROC["Audio Processor<br/>(MediaPipe)"]
            VIDEO_PROC["Video Processor<br/>(MediaPipe)"]
            TEXT_PROC["Text Processor<br/>(Transformers.js)"]
        end

        subgraph AI_CORE["AI Core Layer"]
            LLM["Local LLM<br/>(MediaPipe + Gemma 3n)"]
            EMBED["Embedding Engine<br/>(Transformers.js)"]
            ML["ML Models<br/>(TensorFlow.js)"]
        end

        subgraph PROFILING_ENGINE["Inverse Profiling Engine"]
            LING["Linguistic Analyzer<br/>(LIWC-style)"]
            PROS["Prosodic Analyzer"]
            BEHAV["Behavioral Pattern<br/>Detector"]
            CONF["Confidence Scorer"]
        end

        subgraph DIGITAL_TWIN["Digital Twin Core"]
            PROFILE["Psychological<br/>Profile Manager"]
            CONTEXT["Context Engine"]
            ADAPT["Adaptive Learning<br/>Engine"]
            PERSONA["Persona Model"]
        end

        subgraph STORAGE["Persistent Storage Layer"]
            VECTOR["Vector Store<br/>(TinkerBird)"]
            GRAPH["Knowledge Graph<br/>(LevelGraph)"]
            SQL["Structured Data<br/>(wa-sqlite)"]
            KV["Key-Value Store<br/>(Dexie.js/IndexedDB)"]
        end

        subgraph ACCELERATION["Acceleration Layer"]
            WASM["WebAssembly Runtime"]
            GPU["WebGPU Compute"]
        end
    end

    subgraph OUTPUT["Output Layer"]
        RESPONSE["Personalized<br/>Response"]
        LEARN["Adaptive Learning<br/>Content"]
        INSIGHTS["User Insights<br/>Dashboard"]
    end

    %% User inputs
    UI --> TEXT
    MIC --> AUDIO_PROC
    CAM --> VIDEO_PROC
    TEXT --> TEXT_PROC

    %% Input processing to AI Core
    AUDIO_PROC --> EMBED
    VIDEO_PROC --> ML
    TEXT_PROC --> EMBED
    TEXT_PROC --> LLM

    %% AI Core to Profiling
    EMBED --> LING
    EMBED --> VECTOR
    ML --> PROS
    ML --> BEHAV
    LLM --> LING

    %% Profiling to Digital Twin
    LING --> PROFILE
    PROS --> PROFILE
    BEHAV --> PROFILE
    CONF --> PROFILE
    PROFILE --> PERSONA
    PROFILE --> ADAPT
    CONTEXT --> ADAPT

    %% Storage connections
    PROFILE --> GRAPH
    PROFILE --> SQL
    VECTOR --> CONTEXT
    GRAPH --> CONTEXT
    SQL --> CONF
    KV --> PROFILE

    %% Acceleration
    WASM --> SQL
    WASM --> EMBED
    GPU --> ML
    GPU --> LLM

    %% Output generation
    PERSONA --> LLM
    ADAPT --> LEARN
    LLM --> RESPONSE
    PROFILE --> INSIGHTS

    %% Output to UI
    RESPONSE --> UI
    LEARN --> UI
    INSIGHTS --> UI

    %% Styling
    classDef userLayer fill:#e1f5fe,stroke:#01579b
    classDef browserLayer fill:#f3e5f5,stroke:#4a148c
    classDef aiLayer fill:#e8f5e9,stroke:#1b5e20
    classDef storageLayer fill:#fff3e0,stroke:#e65100
    classDef outputLayer fill:#fce4ec,stroke:#880e4f

    class UI,MIC,CAM,TEXT userLayer
    class LLM,EMBED,ML aiLayer
    class VECTOR,GRAPH,SQL,KV storageLayer
    class RESPONSE,LEARN,INSIGHTS outputLayer
```

---

## Core Principles

### 1. Privacy by Architecture
```mermaid
flowchart LR
    subgraph DEVICE["User's Device"]
        DATA["User Data"]
        PROC["All Processing"]
        STORE["All Storage"]
        AI["AI Models"]
    end

    subgraph CLOUD["Cloud/Internet"]
        NOTHING["No Data Transmitted"]
    end

    DATA --> PROC
    PROC --> STORE
    STORE --> AI
    AI --> PROC

    DEVICE -.->|"Zero Data Flow"| CLOUD

    style NOTHING fill:#ffcdd2,stroke:#b71c1c
    style DEVICE fill:#c8e6c9,stroke:#1b5e20
```

### 2. Self-Learning Loop
```mermaid
flowchart TD
    INTERACT["User Interaction"] --> ANALYZE["Analyze Behavior"]
    ANALYZE --> INFER["Infer Traits"]
    INFER --> UPDATE["Update Profile"]
    UPDATE --> ADAPT["Adapt Responses"]
    ADAPT --> INTERACT

    UPDATE --> CONFIDENCE["Update Confidence<br/>Scores"]
    CONFIDENCE --> QUESTION["Strategic<br/>Questioning"]
    QUESTION --> INTERACT
```

---

## Data Flow Summary

| Layer | Purpose | Key Technologies |
|-------|---------|-----------------|
| **Input Processing** | Capture and preprocess multimodal user data | MediaPipe, Transformers.js |
| **AI Core** | Generate embeddings, run inference, power conversations | MediaPipe LLM, Gemma 3n, TensorFlow.js |
| **Profiling Engine** | Extract psychological markers, compute confidence | Custom LIWC-style analyzer |
| **Digital Twin** | Manage user profile, adapt behavior | LevelGraph relationships |
| **Storage** | Persist all data on-device | IndexedDB, wa-sqlite, TinkerBird, LevelGraph |
| **Acceleration** | Enable real-time performance | WebAssembly, WebGPU |

---

## Storage Architecture Overview

```mermaid
flowchart TB
    subgraph INPUT["User Interaction"]
        MSG["Message Text"]
        META["Timing & Metadata"]
        SESSION["Session Context"]
    end

    subgraph DEXIE["Dexie.js (IndexedDB)"]
        CONV["conversations"]
        MSGS["messages"]
        SESS["sessions"]
    end

    subgraph SQLITE["wa-sqlite"]
        PROF["profiles"]
        DOMAIN["domain_scores"]
        FEAT["feature_counts"]
        BEHAV["behavioral_metrics"]
        HIST["domain_history"]
        CONF_F["confidence_factors"]
    end

    subgraph TINKER["TinkerBird (Vectors)"]
        MSG_EMB["message_embeddings"]
        TOPIC_EMB["topic_embeddings"]
        CONCEPT_EMB["concept_embeddings"]
    end

    subgraph LEVEL["LevelGraph"]
        USER_TOPIC["user → topic"]
        TOPIC_DOMAIN["topic → domain"]
        DOMAIN_MARKER["domain → marker"]
        MARKER_FEAT["marker → feature"]
    end

    MSG --> MSGS
    META --> SESS
    SESSION --> CONV

    MSGS --> |"LIWC Analysis"| FEAT
    MSGS --> |"Embeddings"| MSG_EMB
    SESS --> |"Metrics"| BEHAV

    FEAT --> |"Aggregation"| DOMAIN
    BEHAV --> |"Aggregation"| DOMAIN
    DOMAIN --> |"Snapshot"| HIST
    DOMAIN --> |"Factors"| CONF_F

    MSG_EMB --> |"Clustering"| TOPIC_EMB
    TOPIC_EMB --> |"Relationships"| USER_TOPIC
    USER_TOPIC --> TOPIC_DOMAIN
```

---

## 22 Psychological Domains Tracked

```mermaid
mindmap
  root((Digital Twin<br/>Profile))
    Personality
      Big Five OCEAN
      Communication Style
    Cognition
      Cognitive Abilities
      Information Processing
      Metacognition
      Executive Functions
      Creativity
    Emotional
      Emotional Intelligence
      Resilience & Coping
      Attachment Style
      Psychopathology Indicators
    Values & Beliefs
      Values & Motivations
      Moral Reasoning
      Political Ideology
      Cultural Values
      Mindset Growth/Fixed
    Social & Behavioral
      Social Cognition
      Decision-Making Styles
      Work & Career Style
    Learning & Perception
      Learning Styles
      Sensory Processing
      Time Perspective
      Aesthetic Preferences
```

---

## Domain-to-Storage Mapping

```mermaid
flowchart LR
    subgraph DOMAINS["22 Psychological Domains"]
        D1["Big Five Personality"]
        D2["Emotional Intelligence"]
        D3["Creativity"]
        D4["Values & Motivations"]
        D5["...17 more domains"]
    end

    subgraph MARKERS["Linguistic Markers"]
        M1["LIWC Categories"]
        M2["Pronoun Ratios"]
        M3["Emotion Words"]
        M4["Cognitive Words"]
        M5["Behavioral Metrics"]
    end

    subgraph FEATURES["Raw Features"]
        F1["Word Counts"]
        F2["Response Times"]
        F3["Session Patterns"]
        F4["Semantic Distance"]
        F5["Topic Embeddings"]
    end

    subgraph STORAGE["Storage Layer"]
        S1["feature_counts<br/>(wa-sqlite)"]
        S2["behavioral_metrics<br/>(wa-sqlite)"]
        S3["TinkerBird<br/>(Vectors)"]
        S4["LevelGraph<br/>(Relationships)"]
    end

    F1 --> S1
    F2 --> S2
    F3 --> S2
    F4 --> S3
    F5 --> S3

    S1 --> M1
    S1 --> M2
    S1 --> M3
    S1 --> M4
    S2 --> M5

    M1 --> D1
    M2 --> D1
    M3 --> D2
    M4 --> D3
    M5 --> D4

    S4 --> |"domain→marker→feature"| D5
```

---

## Data Capture Pipeline

```mermaid
sequenceDiagram
    participant User
    participant UI as Chat UI
    participant Dexie as Dexie.js
    participant LIWC as LIWC Analyzer
    participant SQLite as wa-sqlite
    participant Vector as TinkerBird
    participant Graph as LevelGraph

    User->>UI: Send message
    UI->>Dexie: Store raw message

    par Parallel Processing
        Dexie->>LIWC: Analyze text
        Dexie->>Vector: Generate embedding
    end

    LIWC->>SQLite: Update feature_counts
    LIWC->>SQLite: Update behavioral_metrics
    Vector->>Vector: Store message_embedding

    SQLite->>SQLite: Recalculate domain_scores
    SQLite->>SQLite: Update confidence_factors

    Vector->>Graph: Extract topics
    Graph->>Graph: Update user-topic relations
    Graph->>Graph: Update topic-domain mappings

    SQLite->>UI: Return updated profile
```

---

## Confidence Scoring Architecture

```mermaid
flowchart TB
    subgraph INPUTS["Confidence Inputs"]
        VOL["Data Volume<br/>(message count, word count)"]
        CONS["Consistency<br/>(cross-session stability)"]
        REC["Recency<br/>(temporal decay)"]
        CROSS["Cross-Validation<br/>(domain correlation)"]
    end

    subgraph CALC["Calculation"]
        WEIGHT["Weighted Sum"]
        DECAY["Temporal Decay"]
        THRESH["Threshold Check"]
    end

    subgraph OUTPUT["Confidence Score"]
        VERY_LOW["0.0-0.2: Very Low"]
        LOW["0.2-0.4: Low"]
        MOD["0.4-0.6: Moderate"]
        HIGH["0.6-0.8: High"]
        VERY_HIGH["0.8-1.0: Very High"]
    end

    VOL --> |"weight: 0.3"| WEIGHT
    CONS --> |"weight: 0.3"| WEIGHT
    REC --> |"weight: 0.2"| WEIGHT
    CROSS --> |"weight: 0.2"| WEIGHT

    WEIGHT --> DECAY
    DECAY --> THRESH

    THRESH --> VERY_LOW
    THRESH --> LOW
    THRESH --> MOD
    THRESH --> HIGH
    THRESH --> VERY_HIGH
```

---

## Security & Privacy Model

| Principle | Implementation |
|-----------|---------------|
| **Zero Cloud Dependency** | All AI models run via MediaPipe/TensorFlow.js in browser |
| **Local Storage Only** | IndexedDB + wa-sqlite for all persistence |
| **No Network Requests** | Service worker blocks external data transmission |
| **User Data Ownership** | Export/delete functionality for all personal data |
| **Encryption at Rest** | Browser-native encryption for sensitive profile data |

---

## Phase Implementation Status

| Phase | Status | Key Deliverables |
|-------|--------|------------------|
| **Phase 1: MVP** | Complete | Chat, Basic Profiling, Data Inspector |
| **Phase 2: Enhanced** | Planning | 22 Domains, Full Schema, Confidence System |
| **Phase 3: Learning** | Planned | Adaptive Learning, Knowledge Tracking |
| **Phase 4: Advanced** | Planned | Strategic Questions, Multimodal |

---

## Related Documents

- [Architecture-Low-Level.md](Architecture-Low-Level.md) - Detailed component specifications
- [Data-Architecture.md](Data-Architecture.md) - Complete data flow and schema documentation
- [schema.md](schema.md) - Full database schemas
- [domain-markers.md](domain-markers.md) - Psychological domain markers
- [phases.md](phases.md) - Development roadmap
