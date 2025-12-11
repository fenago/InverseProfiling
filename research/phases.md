# Digital Twin Development Phases

## Phase 1: MVP ✅ COMPLETE

**Goal:** Core conversational AI with basic profiling

**Build Order:**
1. [x] React 19 application scaffold
2. [x] IndexedDB storage setup (Dexie.js)
3. [x] wa-sqlite database initialization
4. [x] WebLLM integration with Gemma 3n (MediaPipe LLM Inference)
5. [x] Basic chat interface
6. [x] Conversation persistence layer
7. [x] Initial LIWC-style text analysis engine
8. [x] Big Five personality inference
9. [x] Basic profile display
10. [x] Privacy controls (delete/export)

**Completed Features:**
- MediaPipe LLM Inference with Gemma 3n models (E4B, E2B, 270M variants)
- Model selector dropdown
- Streaming chat responses
- Dexie.js with 6 tables (messages, linguisticAnalyses, personalityTraits, userProfile, activityLogs, sessions)
- Activity Dashboard with usage statistics
- Profile Dashboard with personality radar chart
- Data Inspector for raw data viewing
- Settings page with data management

**Data Storage (Phase 1):**
| Store | Tables/Collections | Purpose |
|-------|-------------------|---------|
| Dexie.js | conversations, messages | Raw conversation storage |
| wa-sqlite | profiles, domain_scores | Basic profile persistence |

**Exit Criteria:** User can chat with AI and see basic personality profile

---

## Phase 2: Enhanced Profiling ✅ COMPLETE

**Goal:** Full 22-domain profiling with confidence scoring

**Build Order:**
1. [x] Install Phase 2 dependencies (sql.js, @xenova/transformers, levelgraph, level, level-js, tinkerbird)
2. [x] Create comprehensive LIWC word dictionaries (`src/lib/liwc-dictionaries.ts`)
3. [x] Implement wa-sqlite database schema (`src/lib/sqldb.ts`)
   - profiles, domain_scores (26 domains), feature_counts (100+ features)
   - behavioral_metrics (22 metrics), domain_history, confidence_factors
4. [x] Complete 22-domain coverage implementation (`src/lib/enhanced-analyzer.ts`)
5. [x] LIWC feature extraction pipeline (connect dictionaries to analyzer)
6. [x] Feature counts persistence layer (wire up to SQL database)
7. [x] Behavioral metrics tracking
8. [x] Confidence scoring system
9. [x] TinkerBird vector database setup (`src/lib/vectordb.ts`)
10. [x] Embedding generation pipeline (Transformers.js)
11. [x] LevelGraph knowledge graph setup (`src/lib/graphdb.ts`)
12. [x] Cross-domain relationship modeling
13. [x] Historical tracking system (`src/lib/history.ts`)
14. [x] Profile dashboard with visualizations (`src/pages/ProfileDashboard.tsx`)
15. [x] Adaptive response generation (`src/lib/adaptive-response.ts`)

**Data Storage (Phase 2):**
| Store | Tables/Collections | Purpose |
|-------|-------------------|---------|
| Dexie.js | conversations, messages, sessions | Conversation + session tracking |
| wa-sqlite | profiles, domain_scores, feature_counts, behavioral_metrics, domain_history, confidence_factors | Full profile + intermediate data |
| TinkerBird | message_embeddings, topic_embeddings, concept_embeddings | Semantic search + similarity |
| LevelGraph | user-topic, topic-domain, concept-concept, trait-behavior | Relationship modeling |

**Data Capture Requirements:**
- All 22 psychological domains with markers
- LIWC category counts (running totals)
- Behavioral metrics (response time, session patterns)
- Confidence factors per domain
- Historical snapshots for trend analysis
- Semantic embeddings for all messages
- Knowledge graph relationships

**Exit Criteria:** Full psychological profile with confidence indicators, all data points captured and queryable

---

## Phase 3: Adaptive Learning

**Goal:** Educational personalization

**Build Order:**
1. [ ] Learning module interface
2. [ ] Knowledge state tracking tables
3. [ ] ZPD assessment engine
4. [ ] Knowledge gap identification
5. [ ] Content difficulty adaptation
6. [ ] Learning style matching
7. [ ] Scaffolded explanations generator
8. [ ] Progress tracking system
9. [ ] Spaced repetition integration

**Data Storage (Phase 3):**
| Store | Tables/Collections | Purpose |
|-------|-------------------|---------|
| wa-sqlite | knowledge_states, learning_progress, knowledge_gaps, learning_events | Learning tracking |
| TinkerBird | knowledge_embeddings | Concept similarity |
| LevelGraph | concept-prerequisite, user-mastery, topic-difficulty | Learning relationships |

**Exit Criteria:** Personalized learning experience based on profile

---

## Phase 4: Advanced Features

**Goal:** Strategic questioning and multimodal

**Build Order:**
1. [ ] Strategic questioning system
2. [ ] Question effectiveness tracking
3. [ ] Profile validation system
4. [ ] Context-dependent profiling
5. [ ] Advanced graph relationships
6. [ ] Audio analysis integration (MediaPipe)
7. [ ] Prosodic feature extraction
8. [ ] Optional video analysis
9. [ ] Multimodal fusion layer

**Data Storage (Phase 4):**
| Store | Tables/Collections | Purpose |
|-------|-------------------|---------|
| wa-sqlite | strategic_questions, validation_results, audio_features | Advanced profiling data |
| LevelGraph | context-trait, question-domain, validation-confidence | Complex relationships |

**Exit Criteria:** Full feature completion

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERACTION                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         RAW DATA CAPTURE                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   Text       │  │   Timing     │  │   Session    │                   │
│  │   Content    │  │   Metadata   │  │   Context    │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│      Dexie.js        │ │    wa-sqlite     │ │     TinkerBird       │
│  ┌────────────────┐  │ │ ┌──────────────┐ │ │ ┌────────────────┐   │
│  │ conversations  │  │ │ │   profiles   │ │ │ │msg_embeddings  │   │
│  │ messages       │  │ │ │domain_scores │ │ │ │topic_embeddings│   │
│  │ sessions       │  │ │ │feature_counts│ │ │ │concept_embeds  │   │
│  └────────────────┘  │ │ │behav_metrics │ │ │ └────────────────┘   │
│                      │ │ │domain_history│ │ │                      │
│                      │ │ │conf_factors  │ │ │                      │
│                      │ │ └──────────────┘ │ │                      │
└──────────────────────┘ └──────────────────┘ └──────────────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
                    ┌──────────────────────────────┐
                    │         LevelGraph           │
                    │  ┌────────────────────────┐  │
                    │  │ user-topic relations   │  │
                    │  │ topic-domain mappings  │  │
                    │  │ concept-concept links  │  │
                    │  │ trait-behavior maps    │  │
                    │  └────────────────────────┘  │
                    └──────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      PROFILE & ADAPTATION ENGINE                         │
│  22 Domain Scores + Confidence + Adaptive Response Generation           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Marker-to-Storage Mapping

### Linguistic Markers → Storage Path

| Marker Type | Extraction | Intermediate Storage | Final Storage |
|-------------|------------|---------------------|---------------|
| LIWC word counts | Text analysis | feature_counts (wa-sqlite) | domain_scores |
| Pronoun ratios | Text analysis | feature_counts | domain_scores |
| Sentence complexity | Text analysis | feature_counts | domain_scores |
| Emotion words | Text analysis | feature_counts | domain_scores |
| Topic references | NLP + embeddings | TinkerBird | LevelGraph |

### Behavioral Markers → Storage Path

| Marker Type | Extraction | Storage |
|-------------|------------|---------|
| Response latency | Message timestamps | behavioral_metrics |
| Message length | Text length | behavioral_metrics |
| Session duration | Session tracking | behavioral_metrics |
| Return frequency | Session analysis | behavioral_metrics |
| Topic persistence | Graph analysis | LevelGraph |

### Semantic Markers → Storage Path

| Marker Type | Extraction | Storage |
|-------------|------------|---------|
| Semantic similarity | Embedding distance | TinkerBird |
| Concept associations | Graph traversal | LevelGraph |
| Topic clustering | Vector clustering | TinkerBird |
| Metaphor detection | NLP + embeddings | feature_counts + TinkerBird |

---

## Session Logs

### Session: December 10, 2025

**Focus:** Bug fixes and stability improvements

**Completed:**

1. **Fixed Model Loading Time Estimation**
   - Previous issue: Showed 40 minutes estimated, actual load time 1-2 minutes
   - Root cause: Network speed measurement was returning unreasonably low values
   - Solution: Improved connection speed measurement and estimation algorithm

2. **Fixed Chat Without Model Behavior**
   - Previous issue: Chat allowed typing/sending without model loaded
   - Solution: Added proper prompts to guide user to load model first

3. **Fixed TypeScript Build Errors**
   - Resolved unused variable warnings (`setExpandedDomain`, `_startTime`, `_domainResults`)
   - All strict TypeScript checks now passing

4. **Fixed Chat Conversation Context**
   - Previous issue: LLM didn't remember previous messages in conversation
   - Solution: Modified `llm.ts` to accept conversation history parameter
   - Now passes last 20 messages to provide context for responses
   - Uses Gemma's `<start_of_turn>` format for multi-turn conversations

5. **TinkerBird Vector DB - Graceful Degradation**
   - Previous issue: Embedding model failures crashed the app
   - Solution: Added `embeddingLoadFailed` flag and null checks
   - App now continues working without vector embeddings if model fails
   - Added `isEmbeddingAvailable()` function for feature detection

6. **Verified LevelGraph Working**
   - Confirmed initialization succeeds with Level v10 + browser-level
   - Console shows "LevelGraph initialized successfully"

7. **Fixed Model Download Progress Stuck at 10%**
   - Previous issue: Progress bar stayed at 10% during entire download
   - Root cause: MediaPipe `LlmInference.createFromOptions()` doesn't provide progress callbacks
   - Solution: Implemented simulated progress based on estimated download time
   - Added loading phase messages: "Measuring...", "Initializing...", "Downloading...", "Finalizing..."
   - Progress now smoothly animates from 10% to 95% during download with easing function

**Files Modified:**
- `src/pages/ChatPage.tsx` - Progress UI, conversation history, simulated progress
- `src/pages/ProfileDashboard.tsx` - Fixed unused variable
- `src/lib/llm.ts` - Added conversation history to generate()
- `src/lib/enhanced-analyzer.ts` - Fixed unused variable
- `src/lib/vectordb.ts` - Added graceful error handling

**Pending Tasks:**
- All pending tasks completed (see Session 2 below)

---

### Session: December 10, 2025 (Part 2)

**Focus:** Multimodal support, language selection, and message formatting

**Completed:**

1. **Researched Gemma 3n Multimodal Capabilities**
   - Gemma 3n models (E4B and E2B) support image and audio input
   - MediaPipe LLM Inference supports `maxNumImages` and `supportAudio` options

2. **Updated LLM Engine for Multimodal Support**
   - Added `ImageInput` and `AudioInput` type definitions
   - Added `MultimodalPrompt` type for mixed content arrays
   - Added `generateMultimodal()` method to LLMEngine class
   - Added `isMultimodalEnabled()` method for feature detection
   - Models now initialize with multimodal options when supported

3. **Added Image Upload to Chat**
   - Hidden file input for image selection (max 5 images)
   - Image preview grid with remove buttons
   - FileReader API for converting to data URLs
   - Image button in chat input area with multimodal check

4. **Added Microphone/Voice Input Feature**
   - MediaRecorder API for browser audio recording
   - Recording indicator with animated pulse and timer
   - Audio preview with clear button
   - Supports audio/webm;codecs=opus format
   - Voice messages included in multimodal prompts

5. **Added Language Selection Feature**
   - Added `SUPPORTED_LANGUAGES` constant (12 languages)
   - Added `LanguageCode` type and settings state to Zustand store
   - Added language dropdown in Settings page with Globe icon
   - Updated LLM system prompt to include language instruction
   - Cache invalidation when language changes

6. **Improved Chat Message Formatting**
   - Created `FormattedMessage` component in `src/lib/format-message.tsx`
   - Supports **bold**, *italic*, `inline code`, and code blocks with language syntax
   - URL auto-linking with proper styling
   - Paragraph and line break handling
   - Different styling for user vs assistant messages

**Files Created:**
- `src/lib/format-message.tsx` - Message formatting utility

**Files Modified:**
- `src/lib/llm.ts` - Multimodal types and methods, language support
- `src/lib/store.ts` - Added settings state with language
- `src/pages/ChatPage.tsx` - Image upload, voice recording, formatted messages
- `src/pages/SettingsPage.tsx` - Language selector UI

**All Phase 2 Pending Tasks: COMPLETE**
