# QMU.io

**Quantified Mind Understanding** - A privacy-first, browser-based psychometric profiling application that builds a psychological profile through natural conversation. All processing happens locally on your device using WebGPU-accelerated AI models.

## Overview

QMU.io implements **inverse profiling** - instead of using traditional psychometric questionnaires, it analyzes natural language from conversations to infer psychological traits across 39 research-backed domains. This creates a dynamic psychological model that adapts its understanding as you interact with it.

The AI assistant learns your communication style, personality traits, and preferences over time, adapting how it responds to you based on your psychological profile.

---

## Key Features

### Privacy & Security
- **100% Local Processing**: All data stays on your device. Zero external API calls.
- **No Telemetry**: Zero tracking, analytics, or data collection.
- **Full Data Control**: Export all your data as JSON or delete everything with one click.
- **Browser-Based Storage**: Data stored in IndexedDB, SQLite WASM - never touches a server.

### AI & Analysis
- **Hybrid Analysis System**: Three complementary signals (LIWC, Embeddings, LLM) for accurate profiling.
- **39 Psychological Domains**: Comprehensive coverage from Big Five personality to cognitive styles.
- **Real-time Profile Building**: Your profile updates with every conversation.
- **Confidence Scoring**: Each trait shows confidence intervals based on data quality.

### Adaptive AI
- **Conversation Memory**: AI remembers context from previous sessions (topics, facts, preferences).
- **Adaptive Responses**: AI communication style adapts based on your psychological profile.
- **Profile-Based Personalization**: Response tone, complexity, and style adjust to match your preferences.
- **Multiple AI Personalities**: Choose from presets (Friendly, Professional, Socratic) or create custom.

### Adaptive Learning System (Phase 3)
- **Zone of Proximal Development (ZPD)**: Vygotsky-inspired assessment identifies optimal challenge levels for each domain.
- **Knowledge State Tracking**: Mastery levels (0-1 scale) tracked per domain with Bloom's taxonomy facets.
- **SM-2 Spaced Repetition**: Scientifically-validated algorithm schedules reviews based on performance quality (0-5 scale).
- **Knowledge Gap Detection**: Automatically identifies gaps and prerequisites from conversation analysis.
- **VARK Learning Styles**: Adapts content delivery based on visual, auditory, reading, or kinesthetic preferences.
- **Scaffolded Explanations**: Generates explanations with appropriate support level (none/hints/guided/full).
- **Progress Tracking**: Real-time statistics on mastery, reviews, and learning velocity.

### Strategic Questioning Engine (Phase 4)
- **Three-Phase Active Learning**: Diagnostic → Targeted → Validation progression across sessions.
- **50+ Strategic Questions**: Domain-specific questions optimized for profile discovery.
- **Question Effectiveness Tracking**: Measures which questions reveal the most about each domain.
- **Confidence-Based Targeting**: Automatically focuses on low-confidence domains.

### Context-Dependent Profiling (Phase 4)
- **10 Context Types**: Work, social, intimate, creative, stressful, leisure, intellectual, physical, spiritual, financial.
- **Automatic Context Detection**: Keywords and patterns identify conversation context.
- **Context-Specific Scores**: Track how traits vary across different life contexts.
- **Variation Analysis**: Discover which traits are stable vs. context-dependent.

### Audio/Multimodal Analysis (Phase 4)
- **Voice Recording**: Capture audio during chat for prosodic analysis.
- **Prosodic Feature Extraction**: Pitch, tempo, energy, jitter, shimmer, pause patterns.
- **Domain Mapping**: Map vocal characteristics to psychological domains.
- **Multimodal Fusion**: Combine text + audio signals with cross-modal validation.

### Advanced Knowledge Graph (Phase 4)
- **Temporal Evolution**: Track how traits change over time with snapshots.
- **Cross-Domain Inference**: Infer relationships based on psychological correlations.
- **Causal Reasoning Chains**: Model causation between traits (A→B→C).
- **Path-Based Queries**: Multi-hop relationship discovery across the graph.

### Advanced Visualization Dashboard (Phase 5)
- **Historical Trend Charts**: Interactive area charts showing trait evolution over time with trend detection (increasing/decreasing/stable/fluctuating) and volatility analysis.
- **Signal Contribution Breakdown**: Bar and pie charts showing how LIWC, Embedding, and LLM signals contribute to each domain score.
- **Context Variation Heatmap**: Visual grid showing how each trait varies across 10 context types (work, social, intimate, creative, etc.) with amplification/suppression indicators.
- **Confidence Intervals**: Uncertainty visualization showing score ranges based on signal agreement and data quality.
- **Profile Summary Card**: At-a-glance metrics including domains analyzed, average confidence, signal coverage, and top evolving traits.

### Real-time Emotion Detection (Phase 6)
- **Russell's Circumplex Model**: Maps emotions to 2D valence/arousal space for nuanced emotion understanding.
- **17 Discrete Emotion Labels**: Happy, Excited, Elated, Content, Calm, Relaxed, Serene, Sad, Depressed, Bored, Tired, Anxious, Stressed, Angry, Frustrated, Fearful, and Neutral.
- **Prosodic-to-Emotion Mapping**: Derives emotional state from voice features (pitch, energy, speech rate, jitter, shimmer).
- **Emotion Blending**: Smooth transitions between emotional states using 0.3 blend factor for natural feel.
- **Emotion Trend Analysis**: Tracks if emotions are improving, declining, stable, or fluctuating across the session.
- **EmotionIndicator UI**: Visual component showing current emotion with circumplex visualization, trend arrows, and history timeline.
- **SQL Emotion Timeline**: Persistent storage of emotional states for historical analysis and pattern discovery.

### Visualization & Insights
- **Profile Dashboard**: Interactive visualization of all 39 psychological domains.
- **Historical Trends**: Track how your profile evolves over time with trend charts.
- **Signal Source Indicators**: See which analysis method (LIWC/Embedding/LLM) contributed to each score.
- **Interpretability Panel**: "Why does it think this?" - see exactly which messages and signals influenced each score.
- **Data Inspector**: Explore all stored data including knowledge graphs.
- **Activity Timeline**: View your conversation and analysis history.
- **Performance Benchmarks**: Real-time benchmarking of LLM inference, embeddings, and memory usage.

### Offline & PWA Support
- **Progressive Web App**: Install as a standalone app on desktop or mobile.
- **Full Offline Functionality**: All features work without an internet connection.
- **Smart Caching**: AI models and assets cached via service worker.
- **Offline Indicator**: Visual confirmation when running offline to prove zero-cloud operation.

### Customization
- **16 Languages**: AI responds in your preferred language.
- **Response Length Control**: Concise, Balanced, or Detailed responses.
- **Context Window Options**: 1K, 2K, 4K, or 8K token context.
- **System Prompt Editor**: Full control over AI personality and behavior.
- **Multiple AI Models**: Choose between Gemma 3n E4B, E2B, or lightweight 270M.

---

## How It Works

### The Inverse Profiling Approach

Traditional psychometric assessment uses questionnaires with predetermined questions. QMU.io takes a different approach:

1. **Natural Conversation**: You chat naturally with the AI about anything.
2. **Linguistic Analysis**: Every message is analyzed for psychological markers.
3. **Profile Building**: Patterns emerge that map to psychological constructs.
4. **Adaptive Feedback**: The AI adapts its responses based on your emerging profile.

This creates a **dynamic, evolving understanding** of your psychology rather than a static snapshot.

### Three-Signal Hybrid Analysis

The system uses three complementary analysis methods for accuracy:

```
User Message
    │
    ├──► [LIWC Analysis] ──────► Immediate Score (fast, word-matching)
    │         Weight: 0.2
    │
    ├──► [Embedding Similarity] ──► Real-time Signal (semantic similarity)
    │         Weight: 0.3
    │
    └──► [Message Queue] ──► Every 5 messages ──► [LLM Deep Analysis]
              │                                        Weight: 0.5
              │
              └──────────────────────────────────────────────┐
                                                             ▼
                                              [Hybrid Aggregator]
                                                             │
                                                             ▼
                                              Final Domain Scores
```

| Signal | Speed | Weight | Method |
|--------|-------|--------|--------|
| **LIWC** | Instant | 20% | Word/phrase matching against psychological dictionaries |
| **Embeddings** | Fast | 30% | Semantic similarity via BGE-small-en transformer |
| **LLM** | Batch | 50% | Deep semantic analysis via Gemma 3n (every 5 messages) |

When all three signals agree, confidence is high. When they diverge, confidence is lower.

### Adaptive Learning System (Phase 3)

The learning engine applies Vygotsky's Zone of Proximal Development theory with SM-2 spaced repetition:

```
User Interaction
    │
    ├──► [Assess Current Mastery] ──► Knowledge State (0-1 scale per domain)
    │
    ├──► [Calculate ZPD] ──► Optimal Challenge Zone (mastery + 0.1 to + 0.3)
    │         │
    │         └──► [Content Difficulty Adaptation] ──► Match content to ZPD
    │
    ├──► [VARK Style Detection] ──► Visual / Auditory / Reading / Kinesthetic
    │         │
    │         └──► [Content Style Matching] ──► Format matches learning preference
    │
    └──► [Learning Activity] ──► Record quality (0-5) ──► [SM-2 Algorithm]
              │                                               │
              └──────────────────────────────────────────────┐│
                                                             ▼▼
                                              [Schedule Next Review]
                                                             │
                                                             ▼
                                              Updated Knowledge State
```

| Quality Score | Meaning | Interval Multiplier |
|---------------|---------|---------------------|
| 0 | Complete blackout | Reset to 1 day |
| 1 | Incorrect, remembered upon seeing answer | Reset to 1 day |
| 2 | Incorrect, easily recalled | 0.6x |
| 3 | Correct with serious difficulty | 1.0x |
| 4 | Correct with hesitation | 1.3x |
| 5 | Perfect response | 1.5x |

### Strategic Questioning System (Phase 4)

Three-phase active learning approach:

```
Session Count
    │
    ├──► [Phase 1: Diagnostic] (Sessions 0-10)
    │         │
    │         └──► Broad open-ended questions
    │               "Tell me about a time when..."
    │               Goal: Establish baseline profile
    │
    ├──► [Phase 2: Targeted] (Sessions 11-30)
    │         │
    │         ├──► [Identify Low-Confidence Domains]
    │         │
    │         └──► Domain-specific probing questions
    │               Goal: Fill gaps, increase confidence
    │
    └──► [Phase 3: Validation] (Sessions 31+)
              │
              └──► Hypothesis testing questions
                    "You mentioned X, does Y also apply?"
                    Goal: Validate and refine profile
```

### Context-Dependent Profiling (Phase 4)

Analyzes how traits vary across contexts:

```
Message Analysis
    │
    ├──► [Context Detection] ──► Keywords + Patterns
    │         │
    │         └──► 10 Context Types:
    │               work, social, intimate, creative,
    │               stressful, leisure, intellectual,
    │               physical, spiritual, financial
    │
    ├──► [Context-Specific Scoring]
    │         │
    │         └──► Same domain, different context
    │               big_five_extraversion@work: 0.7
    │               big_five_extraversion@intimate: 0.4
    │
    └──► [Variation Analysis]
              │
              └──► Identify stable vs. flexible traits
                    High variation = context-dependent
                    Low variation = core trait
```

### Audio/Multimodal Fusion (Phase 4)

Combines text and voice analysis:

```
User Input
    │
    ├──► [Text Analysis] ──► LIWC + Embeddings + LLM
    │         │
    │         └──► Text-based domain scores
    │
    ├──► [Audio Recording] ──► Web Audio API
    │         │
    │         └──► [Prosodic Analysis]
    │               Pitch (mean, std, range, contour)
    │               Tempo (speech rate, articulation rate)
    │               Energy (loudness, HNR)
    │               Voice Quality (jitter, shimmer)
    │               Pauses (ratio, average length)
    │
    └──► [Multimodal Fusion]
              │
              ├──► Cross-modal validation (agreement score)
              ├──► Context-aware weighting
              └──► Final fused domain scores
```

### Advanced Knowledge Graph (Phase 4)

Sophisticated relationship modeling:

```
Graph Operations
    │
    ├──► [Temporal Tracking]
    │         │
    │         └──► trait_snapshot relationships
    │               (domain, value, timestamp)
    │               Track personality evolution
    │
    ├──► [Cross-Domain Inference]
    │         │
    │         └──► Known psychological correlations
    │               openness ←→ creativity (r=0.7)
    │               neuroticism ←→ stress_coping (r=-0.5)
    │
    ├──► [Causal Chains]
    │         │
    │         └──► Multi-hop reasoning
    │               stress → anxiety → performance
    │
    └──► [Context Integration]
              │
              └──► Context-trait relationships
                    (domain)--[varies_by]-->(context)
```

### Advanced Visualization Dashboard (Phase 5)

Rich interactive visualizations for understanding your psychological profile:

```
Profile Data
    │
    ├──► [Trend Analysis]
    │         │
    │         ├──► getDomainHistory() ──► Historical data points
    │         │
    │         ├──► calculateTrendAndVolatility()
    │         │       Trend: increasing | decreasing | stable | fluctuating
    │         │       Volatility: 0-1 (how much scores change)
    │         │
    │         └──► [Area Chart] ──► Score evolution with confidence overlay
    │
    ├──► [Signal Breakdown]
    │         │
    │         ├──► getHybridSignalsForDomain()
    │         │       LIWC contribution (weight × score)
    │         │       Embedding contribution (weight × score)
    │         │       LLM contribution (weight × score)
    │         │
    │         └──► [Bar/Pie Charts] ──► Signal source visualization
    │
    ├──► [Context Variation]
    │         │
    │         ├──► getGraphInsights() ──► Context-trait relationships
    │         │
    │         └──► [Heatmap Grid]
    │               Green = amplifies trait
    │               Red = suppresses trait
    │               Gray = neutral
    │
    └──► [Confidence Intervals]
              │
              ├──► Signal agreement analysis
              │       High agreement = narrow bounds
              │       Low agreement = wide bounds
              │
              └──► [Interval Bars] ──► Uncertainty visualization
```

| Component | Data Source | Visualization |
|-----------|-------------|---------------|
| **Trend Chart** | `domain_history` SQL table | Area chart with confidence overlay |
| **Signal Breakdown** | `hybrid_signal_scores` SQL table | Stacked bar / donut pie chart |
| **Context Heatmap** | Knowledge graph context relations | Grid with color-coded effects |
| **Confidence Display** | Signal agreement calculation | Horizontal bar with uncertainty range |
| **Summary Card** | Aggregated statistics | Metrics dashboard |

### Real-time Emotion Detection (Phase 6)

Detects emotional states from voice using Russell's Circumplex Model:

```
Voice Recording
    │
    ├──► [Prosodic Analysis] ──► Audio features from audio-analyzer.ts
    │         │
    │         └──► Pitch, Energy, Speech Rate, Jitter, Shimmer
    │
    ├──► [Prosodic-to-Emotion Mapping]
    │         │
    │         ├──► Valence: (energy - 0.5) × 0.8 + (tempo - 1) × 0.2
    │         │
    │         └──► Arousal: pitch × 0.5 + energyVar × 0.3 + tempo × 0.2
    │
    ├──► [Emotion Label Assignment]
    │         │
    │         └──► Map (valence, arousal) to 17 discrete emotions:
    │               Q1 (+V, +A): Happy, Excited, Elated
    │               Q2 (-V, +A): Angry, Frustrated, Fearful, Anxious, Stressed
    │               Q3 (-V, -A): Sad, Depressed, Bored, Tired
    │               Q4 (+V, -A): Content, Calm, Relaxed, Serene
    │               Center: Neutral
    │
    ├──► [Emotion Blending]
    │         │
    │         └──► newEmotion = blend(previous, detected, 0.3)
    │               Smooth transitions for natural UX
    │
    └──► [Trend Calculation]
              │
              └──► Analyze history window (last 5 states)
                    Improving: valence increasing
                    Declining: valence decreasing
                    Stable: variance < 0.1
                    Fluctuating: high variance
```

| Component | Description |
|-----------|-------------|
| `emotion-detector.ts` | Core emotion detection with circumplex model |
| `EmotionIndicator.tsx` | UI components (compact/full modes) |
| `CircumplexVisualization` | SVG 2D emotion space visualization |
| `emotion_states` SQL table | Persistent emotion timeline storage |
| `emotion_sessions` SQL table | Aggregated session emotion stats |

**Emotion Quadrants:**
| Quadrant | Valence | Arousal | Emotions |
|----------|---------|---------|----------|
| Q1 | Positive | High | Happy, Excited, Elated |
| Q2 | Negative | High | Angry, Anxious, Stressed |
| Q3 | Negative | Low | Sad, Bored, Tired |
| Q4 | Positive | Low | Content, Calm, Relaxed |

### Conversation Memory System

QMU.io maintains memory across sessions:

```
Previous Sessions
    │
    ├──► [Topic Extraction] ──► TF-IDF-like scoring of discussed topics
    │
    ├──► [Fact Extraction] ──► "I am...", "My job...", "I live..."
    │
    └──► [Preference Extraction] ──► "I like...", "I prefer...", "I enjoy..."
              │
              └──► [Memory Context] ──► Injected into system prompt
                                              │
                                              ▼
                                   AI has context from past sessions
```

This allows the AI to:
- Remember what you've discussed before
- Recall personal facts you've shared
- Build on previous conversations
- Provide more personalized responses over time

### Adaptive Response System

Based on your psychological profile, the AI adapts:

**Communication Style:**
- Formality (casual/balanced/formal)
- Verbosity (concise/moderate/detailed)
- Emotional tone (warm/neutral/analytical)
- Questioning style (Socratic/direct/explorative)

**Explanation Approach:**
- Complexity level (simple/moderate/advanced)
- Use of analogies and examples
- Structure preference (narrative/bullet-points/hybrid)

**Emotional Engagement:**
- Validation level (high/moderate/minimal)
- Challenge level (gentle/moderate/direct)
- Encouragement frequency

**Cognitive Engagement:**
- Abstraction level (concrete/balanced/abstract)
- Novelty preference (familiar/balanced/novel)
- Depth preference (surface/moderate/deep)

---

## Database Architecture

Four specialized storage systems, all browser-based:

| Database | Technology | Purpose |
|----------|------------|---------|
| **Dexie** | IndexedDB | Messages, sessions, profiles, activity logs |
| **SQL.js** | SQLite (WASM) | Domain scores, feature counts, signal history, knowledge states, learning events |
| **LevelGraph** | LevelDB | Knowledge graph (subject-predicate-object triples) |
| **TinkerBird** | Vector DB | Semantic embeddings for similarity search |

All data is stored locally in browser storage and never leaves your device.

---

## Psychological Domains

39 domains organized into 8 categories:

### Category A: Core Personality (Big Five)
| Domain | Description | Based On |
|--------|-------------|----------|
| `big_five_openness` | Curiosity, creativity, intellectual interests | NEO-FFI |
| `big_five_conscientiousness` | Organization, dependability, self-discipline | NEO-FFI |
| `big_five_extraversion` | Sociability, assertiveness, positive emotions | NEO-FFI |
| `big_five_agreeableness` | Cooperation, trust, empathy | NEO-FFI |
| `big_five_neuroticism` | Emotional instability, anxiety, moodiness | NEO-FFI |

### Category B: Dark Personality
| Domain | Description | Based On |
|--------|-------------|----------|
| `dark_triad_narcissism` | Grandiosity, need for admiration | SD3 |
| `dark_triad_machiavellianism` | Manipulation, strategic thinking | SD3 |
| `dark_triad_psychopathy` | Impulsivity, callousness | SD3 |

### Category C: Emotional/Social Intelligence
| Domain | Description | Based On |
|--------|-------------|----------|
| `emotional_empathy` | Empathy Quotient | EQ Scale |
| `emotional_intelligence` | Emotional skills | MSCEIT |
| `attachment_style` | Attachment patterns | ECR-R |
| `love_languages` | Love language preferences | 5 Love Languages |
| `communication_style` | Communication patterns | DISC |

### Category D: Decision Making & Motivation
| Domain | Description | Based On |
|--------|-------------|----------|
| `risk_tolerance` | Risk assessment | DOSPERT |
| `decision_style` | Rational vs Intuitive | REI |
| `time_orientation` | Time perspectives | ZTPI |
| `achievement_motivation` | Need for Achievement | nAch |
| `self_efficacy` | Self-belief | GSE |
| `locus_of_control` | Internal vs External | Rotter |
| `growth_mindset` | Fixed vs Growth | Dweck |

### Category E: Values & Wellbeing
| Domain | Description | Based On |
|--------|-------------|----------|
| `personal_values` | Value facets | Schwartz PVQ |
| `interests` | Career interests | RIASEC/Holland |
| `life_satisfaction` | Satisfaction | SWLS |
| `stress_coping` | Coping strategies | Brief COPE |
| `social_support` | Support perception | MSPSS |
| `authenticity` | Authenticity | Authenticity Scale |

### Category F: Cognitive/Learning
| Domain | Description | Based On |
|--------|-------------|----------|
| `cognitive_abilities` | Verbal, Numerical, Spatial | Various |
| `creativity` | Divergent thinking | CAQ |
| `learning_styles` | Learning preferences | VARK |
| `information_processing` | Deep vs Shallow | Various |
| `metacognition` | Metacognitive awareness | MAI |
| `executive_functions` | Executive functioning | BRIEF/Miyake |

### Category G: Social/Cultural/Values
| Domain | Description | Based On |
|--------|-------------|----------|
| `social_cognition` | Theory of Mind | RMET |
| `political_ideology` | Political values | MFQ |
| `cultural_values` | Cultural dimensions | Hofstede |
| `moral_reasoning` | Moral foundations | DIT-2/MFQ |
| `work_career_style` | Career anchors | Schein |

### Category H: Sensory/Aesthetic
| Domain | Description | Based On |
|--------|-------------|----------|
| `sensory_processing` | Sensory sensitivity | HSP Scale |
| `aesthetic_preferences` | Aesthetic fluency | AFS |

---

## User Interface

### Chat Page
The main interface for conversation:
- Real-time streaming responses
- Message history with session management
- Typing indicators
- Auto-save to browser storage

### Profile Dashboard
Comprehensive profile visualization:

**Overview Tab:**
- Big Five personality radar chart
- Domain cards grouped by category
- Confidence indicators for each score
- Signal source attribution (LIWC/Embedding/LLM icons)

**Trends Tab:**
- Historical trend charts for each domain
- See how your profile evolves over time
- Time-based filtering

**Insights Tab:**
- AI-generated insights about your profile
- Pattern recognition across domains

**Data Inspector:**
- Table view of all stored data
- JSON view for debugging
- Interactive graph visualization for knowledge graph
- SQL data inspection

### Activity Dashboard
Activity and history tracking:
- Conversation history
- Analysis events
- Profile updates
- Export/delete actions

### Settings Page
Comprehensive configuration:

**Privacy & Data:**
- Local storage usage display
- Export all data (JSON)
- Delete all data

**AI Model:**
- Gemma 3n E4B (4B params, recommended)
- Gemma 3n E2B (2B params, faster)
- Gemma 3 270M (lightweight)
- Download progress tracking

**Language:**
- 16 supported languages
- AI responds in selected language

**Response Length:**
- Concise (brief, to-the-point)
- Balanced (moderate detail)
- Detailed (comprehensive)

**Context Window:**
- 1K tokens (512 + 512)
- 2K tokens (1024 + 1024)
- 4K tokens (2048 + 2048)
- 8K tokens (4096 + 4096, recommended)

**Conversation Memory:**
- Toggle on/off
- Remembers context from last 5 sessions
- Extracts topics, facts, and preferences

**AI Personality:**
- Friendly Companion
- Professional Assistant
- Socratic Guide
- Creative Collaborator
- Mindful Counselor
- Custom (full editor)

---

## Tech Stack

### Core
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tooling
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation

### AI/ML (All Local)
- **MediaPipe Genai** - Gemma 3n LLM inference (WebGPU)
- **Hugging Face Transformers.js** - BGE-small-en embeddings (ONNX)
- **TinkerBird** - Vector similarity search

### Storage
- **Dexie** - IndexedDB wrapper
- **SQL.js** - SQLite compiled to WASM
- **LevelGraph** - Graph database on LevelDB
- **level-js** - LevelDB for browsers

### Visualization
- **Recharts** - Charts and graphs
- **Lucide React** - Icons
- **Custom SVG** - Knowledge graph visualization

---

## Installation

### Prerequisites
- Node.js 18+
- Modern browser with WebGPU support (Chrome 113+, Edge 113+)
- ~4GB RAM for LLM inference

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/InverseProfiling.git
cd InverseProfiling

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
src/
├── main.tsx                    # App entry point
├── App.tsx                     # Router setup
├── components/
│   ├── Layout.tsx              # Main layout wrapper
│   ├── InterpretabilityPanel.tsx  # "Why does it think this?" explainer
│   ├── OfflineIndicator.tsx    # Offline mode status banner
│   ├── AdvancedVisualization.tsx  # Phase 5: Advanced visualization dashboard
│   └── EmotionIndicator.tsx    # Phase 6: Real-time emotion display component
├── pages/
│   ├── ChatPage.tsx            # Main chat interface
│   ├── ProfileDashboard.tsx    # Profile visualization & data inspector
│   ├── SettingsPage.tsx        # App settings
│   ├── ActivityDashboard.tsx   # Activity log viewer
│   └── BenchmarkPage.tsx       # Performance benchmarking suite
└── lib/
    ├── llm.ts                  # LLM engine (Gemma 3n)
    ├── llm-deep-analyzer.ts    # LLM batch analysis for profiling
    ├── enhanced-analyzer.ts    # LIWC-based text analysis
    ├── trait-prototypes.ts     # Embedding similarity prototypes
    ├── hybrid-aggregator.ts    # Three-signal combination
    ├── analysis-config.ts      # Domain definitions & weights
    ├── domain-reference.ts     # Domain metadata & descriptions
    ├── liwc-dictionaries.ts    # Word lists for LIWC analysis
    ├── db.ts                   # Dexie (IndexedDB) schema
    ├── sqldb.ts                # SQL.js database operations
    ├── graphdb.ts              # LevelGraph knowledge graph
    ├── vectordb.ts             # TinkerBird vector embeddings
    ├── store.ts                # Zustand state management
    ├── adaptive-response.ts    # Profile-based response adaptation
    ├── session-memory.ts       # Cross-session conversation memory
    ├── learning-engine.ts      # Phase 3: Adaptive learning system (ZPD, spaced repetition)
    ├── strategic-questions.ts  # Phase 4: Three-phase active learning questioning
    ├── profile-validation.ts   # Phase 4: Cross-signal validation
    ├── context-profiler.ts     # Phase 4: Context-dependent trait analysis
    ├── advanced-graph.ts       # Phase 4: Temporal evolution & cross-domain inference
    ├── audio-analyzer.ts       # Phase 4: Web Audio API prosodic analysis
    ├── multimodal-fusion.ts    # Phase 4: Text + audio signal combination
    ├── advanced-visualization.ts  # Phase 5: Visualization data utilities
    ├── emotion-detector.ts     # Phase 6: Russell's Circumplex emotion model
    ├── personality.ts          # Personality trait calculations
    ├── analyzer.ts             # Basic text analysis utilities
    ├── history.ts              # Conversation history management
    ├── format-message.tsx      # Message rendering utilities
    └── benchmarks/             # Performance benchmarking modules
        ├── index.ts            # Benchmark orchestration
        ├── llm-benchmark.ts    # LLM inference benchmarks
        ├── embedding-benchmark.ts  # Embedding generation benchmarks
        └── memory-benchmark.ts # Memory/storage benchmarks

research/                       # Documentation & specifications
├── Fine-Tuned-Psychometrics.md # 39-domain specification (PRD)
├── PRD-Digital-Twin.md         # Product requirements
├── Final-Architecture.md       # System architecture
├── domain-markers.md           # Linguistic markers per domain
├── technical-whitepaper.md     # Academic whitepaper on methodology
├── 39-domain-integration-methodology.md  # Domain integration guide
└── ...                         # Additional research docs
```

---

## Key Modules

### `hybrid-aggregator.ts`
Combines signals from LIWC, embeddings, and LLM:

```typescript
import { analyzeMessageHybrid, getAnalysisStatus } from './lib/hybrid-aggregator'

// Analyze a message (non-blocking, fire-and-forget)
await analyzeMessageHybrid(messageId, "I love exploring new ideas!")

// Check analysis status
const status = getAnalysisStatus()
// { queueSize: 3, llmEnabled: true, embeddingEnabled: true, lastLLMAnalysis: Date }
```

### `llm-deep-analyzer.ts`
Batch LLM analysis for psychological profiling:

```typescript
import { analyzeMessageBatch, forceLLMAnalysis } from './lib/llm-deep-analyzer'

// Force immediate analysis (useful for testing)
await forceLLMAnalysis()

// Debug current results (available in browser console)
window.debugHybridAnalysis()
```

### `enhanced-analyzer.ts`
LIWC-based linguistic analysis:

```typescript
import { analyzeTextEnhanced, computeLIWCDomainScores } from './lib/enhanced-analyzer'

// Get linguistic features
const analysis = analyzeTextEnhanced("Your text here")
// Returns: wordCount, sentenceCount, features (pronouns, emotions, etc.)

// Get raw domain scores (no DB storage)
const scores = computeLIWCDomainScores("Your text here")
// Returns: { big_five_openness: 0.65, ... }
```

### `trait-prototypes.ts`
Embedding-based semantic similarity:

```typescript
import { computeAllTraitSimilarities } from './lib/trait-prototypes'

// Compare text against all 39 domain prototypes
const similarities = await computeAllTraitSimilarities("I enjoy systematic planning")
// Returns: { big_five_conscientiousness: 0.78, ... }
```

### `session-memory.ts`
Cross-session conversation memory:

```typescript
import { getConversationMemory, formatMemoryContext } from './lib/session-memory'

// Get memory from previous sessions
const memory = await getConversationMemory(currentSessionId)
// Returns: { summaries, recentTopics, keyFacts, lastUpdated, totalSessions }

// Format for LLM injection
const context = formatMemoryContext(memory)
// Returns formatted string for system prompt
```

### `adaptive-response.ts`
Profile-based response adaptation:

```typescript
import { getAdaptationProfile, generateAdaptiveSystemPrompt } from './lib/adaptive-response'

// Get adaptation profile
const profile = await getAdaptationProfile()
// Returns: { communicationStyle, explanationStyle, emotionalSupport, cognitiveEngagement, confidence }

// Generate adaptive system prompt
const systemPrompt = generateAdaptiveSystemPrompt(profile)
// Returns tailored system prompt based on profile
```

### `learning-engine.ts`
Phase 3 Adaptive Learning System with ZPD, spaced repetition, and scaffolding:

```typescript
import {
  assessZPD,
  getSpacedRepetitionQueue,
  recordLearningActivity,
  generateScaffoldedExplanation,
  getProgressSummary,
  generateLearningRecommendations
} from './lib/learning-engine'

// Assess Zone of Proximal Development for a domain
const zpd = await assessZPD('big_five_openness')
// Returns: { domainId, currentMastery, zpdLower, zpdUpper, optimalDifficulty, readiness }

// Get concepts due for spaced repetition review
const queue = await getSpacedRepetitionQueue(5)
// Returns: Array of { domainId, masteryLevel, easeFactor, nextReviewDate }

// Record learning activity with SM-2 quality score (0-5)
await recordLearningActivity('big_five_conscientiousness', 4)
// Updates mastery, interval, and schedules next review

// Generate scaffolded explanation based on mastery level
const explanation = await generateScaffoldedExplanation(
  'big_five_openness',
  'People high in openness enjoy exploring new ideas.',
  0.3 // current mastery
)
// Returns: { originalContent, scaffoldedContent, scaffoldingLevel, addedSupports }

// Get overall learning progress
const progress = await getProgressSummary()
// Returns: { totalDomains, masteredDomains, inProgressDomains, averageMastery, ... }

// Get AI-generated learning recommendations
const recommendations = await generateLearningRecommendations()
// Returns: Array of prioritized learning targets with reasoning
```

**Key Concepts:**

| Concept | Description |
|---------|-------------|
| **ZPD** | Zone where learning is most effective (current mastery + 0.1 to + 0.3) |
| **SM-2** | SuperMemo 2 algorithm - schedules reviews based on quality (0-5 scale) |
| **VARK** | Learning style preferences (Visual, Auditory, Reading, Kinesthetic) |
| **Scaffolding** | Support levels: 0=none, 1=hints, 2=guided, 3=full support |

**SQL Tables (Phase 3):**

| Table | Purpose |
|-------|---------|
| `knowledge_states` | Domain mastery (0-1), ease factor, review intervals |
| `learning_events` | Activity log with quality scores and timestamps |
| `concept_prerequisites` | Prerequisite relationships between domains |
| `learning_preferences` | VARK style strengths per user |
| `knowledge_gaps` | Detected gaps with severity and status |

### `strategic-questions.ts`
Phase 4 Three-Phase Active Learning Framework:

```typescript
import {
  getNextStrategicQuestion,
  recordQuestionEffectiveness,
  getQuestioningPhase,
  getLowConfidenceDomains,
  getQuestionHistory
} from './lib/strategic-questions'

// Get the current questioning phase
const phase = await getQuestioningPhase()
// Returns: 'diagnostic' | 'targeted' | 'validation'

// Get the next strategic question for the AI to ask
const question = await getNextStrategicQuestion()
// Returns: { domain: 'big_five_openness', question: '...', phase: 'targeted' }

// Record how effective a question was
await recordQuestionEffectiveness('big_five_openness', 0.8)
// Tracks which questions reveal the most information

// Find domains needing more data
const lowConfidence = await getLowConfidenceDomains(0.5)
// Returns domains below threshold for targeted questioning
```

### `context-profiler.ts`
Phase 4 Context-Dependent Trait Analysis:

```typescript
import {
  detectContext,
  getContextSpecificScores,
  analyzeContextVariation,
  getContextInsights,
  CONTEXT_TYPES
} from './lib/context-profiler'

// Detect context from message
const context = detectContext("My boss called me into the meeting room")
// Returns: { primaryContext: 'work', confidence: 0.85, secondaryContexts: ['stressful'] }

// Get trait scores specific to a context
const workScores = await getContextSpecificScores('work')
// Returns: { big_five_extraversion: 0.7, ... } for work context only

// Analyze which traits vary across contexts
const variation = await analyzeContextVariation()
// Returns: { domain: 'big_five_extraversion', variation: 0.3, stable: false }

// Get human-readable insights
const insights = await getContextInsights('big_five_extraversion')
// Returns: "You tend to be more extraverted at work (0.7) than in intimate settings (0.4)"
```

**Context Types:**
| Context | Description |
|---------|-------------|
| `work` | Professional, career-related discussions |
| `social` | Casual interactions with friends |
| `intimate` | Close personal relationships |
| `creative` | Art, music, creative projects |
| `stressful` | High-pressure situations |
| `leisure` | Relaxation, hobbies |
| `intellectual` | Academic, learning discussions |
| `physical` | Health, fitness, body-related |
| `spiritual` | Meaning, purpose, existential |
| `financial` | Money, finances, economics |

### `audio-analyzer.ts`
Phase 4 Web Audio API Prosodic Analysis:

```typescript
import {
  isAudioAnalysisSupported,
  initializeAudioAnalyzer,
  startAudioRecording,
  stopAudioRecording,
  mapFeaturesToDomains,
  getProsodicSummary,
  type ProsodicFeatures
} from './lib/audio-analyzer'

// Check if browser supports audio analysis
const supported = isAudioAnalysisSupported()

// Initialize the analyzer (call once)
await initializeAudioAnalyzer()

// Start recording during chat
await startAudioRecording()

// Stop and get prosodic features
const features: ProsodicFeatures = await stopAudioRecording()
// Returns: {
//   pitchMean, pitchStd, pitchRange, pitchContour,
//   speechRate, articulationRate, pauseRatio, averagePauseLength,
//   energyMean, energyStd, energyRange, loudnessContour,
//   harmonicToNoiseRatio, jitter, shimmer,
//   speakingDuration, silenceDuration, turnTakingSpeed
// }

// Map prosodic features to psychological domains
const domainScores = mapFeaturesToDomains(features)
// Returns: { big_five_extraversion: 0.7, big_five_neuroticism: 0.3, ... }

// Get human-readable summary
const summary = getProsodicSummary(features)
// Returns: "Fast speech rate with high energy variation suggests..."
```

**Prosodic Features:**
| Feature | Description |
|---------|-------------|
| `pitchMean/Std/Range` | Fundamental frequency statistics |
| `speechRate` | Words per minute |
| `articulationRate` | Syllables per second (excluding pauses) |
| `pauseRatio` | Ratio of silence to speech |
| `energyMean/Std` | Loudness statistics |
| `jitter` | Pitch instability (emotional arousal) |
| `shimmer` | Amplitude instability (voice quality) |
| `harmonicToNoiseRatio` | Voice clarity |

### `multimodal-fusion.ts`
Phase 4 Text + Audio Signal Combination:

```typescript
import {
  quickFuse,
  analyzeMultimodal,
  getCrossModalAgreement,
  type FusionResult,
  type AudioAnalysisResult
} from './lib/multimodal-fusion'

// Quick fusion during chat
const fusionResult = quickFuse(
  hybridScores,           // From text analysis
  0.7,                    // Text confidence
  audioResult,            // From audio-analyzer
  'work'                  // Detected context
)
// Returns: FusionResult with combined scores

// Full multimodal analysis
const result = await analyzeMultimodal(messageId, text, audioResult)

// Check agreement between modalities
const agreement = getCrossModalAgreement(textScores, audioScores)
// Returns: { overall: 0.85, disagreements: ['neuroticism'] }
```

**FusionResult Properties:**
| Property | Description |
|----------|-------------|
| `scores` | Final fused domain scores |
| `confidences` | Confidence per domain |
| `agreement` | Cross-modal agreement metrics |
| `contributingSignals` | Which signals contributed |
| `insights` | Generated observations |

### `advanced-graph.ts`
Phase 4 Sophisticated Knowledge Graph:

```typescript
import {
  recordTraitSnapshot,
  getTraitEvolution,
  inferCrossDomainRelationships,
  buildCausalChain,
  queryPathsToTarget,
  integrateContextTraits
} from './lib/advanced-graph'

// Record a trait value at a point in time
await recordTraitSnapshot('big_five_openness', 0.75)

// Get historical evolution of a trait
const evolution = await getTraitEvolution('big_five_openness', 30) // last 30 days
// Returns: [{ timestamp, value }, ...]

// Infer relationships based on psychological correlations
await inferCrossDomainRelationships()
// Adds edges like: openness --correlates_with--> creativity

// Build causal reasoning chain
const chain = await buildCausalChain('stress', 'performance')
// Returns: ['stress', 'causes', 'anxiety', 'reduces', 'performance']

// Find all paths to a target concept
const paths = await queryPathsToTarget('creativity', 2) // max 2 hops
// Returns all graph paths leading to creativity

// Integrate context effects
await integrateContextTraits('work', domainScores)
// Records context-specific trait expressions
```

**SQL Tables (Phase 4):**

| Table | Purpose |
|-------|---------|
| `question_effectiveness` | Tracks how informative each question type is |
| `question_history` | Log of strategic questions asked |
| `context_domain_scores` | Trait scores per context type |
| `context_transitions` | How context affects trait expression |

### `advanced-visualization.ts`
Phase 5 Advanced Visualization Utilities:

```typescript
import {
  getDomainTrendData,
  getAllDomainTrends,
  getAllSignalContributions,
  getAllContextVariations,
  getAllConfidenceIntervals,
  getVisualizationSummary,
  VISUALIZATION_COLORS,
  getConfidenceColor,
  getTrendColor
} from './lib/advanced-visualization'

// Get historical trend data for a single domain
const trend = await getDomainTrendData('big_five_openness', 50)
// Returns: {
//   domainId, domainName, category, dataPoints[],
//   trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating',
//   volatility, currentScore, currentConfidence, changeFromStart
// }

// Get trends for all domains with data
const allTrends = await getAllDomainTrends(30)
// Returns: DomainTrendData[] sorted by domain

// Get signal contribution breakdown for all domains
const contributions = await getAllSignalContributions()
// Returns: SignalContribution[] with LIWC/Embedding/LLM weights and scores

// Get context variation data
const variations = await getAllContextVariations(userId)
// Returns: ContextVariation[] with amplification/suppression per context

// Get confidence intervals for all domains
const intervals = await getAllConfidenceIntervals()
// Returns: ConfidenceInterval[] with score, lowerBound, upperBound, signalAgreement

// Get overall visualization summary
const summary = await getVisualizationSummary(userId)
// Returns: {
//   totalDomains, domainsWithData, averageConfidence,
//   topEvolvingTraits, mostVariableByContext, signalCoverage
// }

// Color utilities
const color = getConfidenceColor(0.75) // Returns green for high confidence
const trendColor = getTrendColor('increasing') // Returns green
```

**Visualization Types:**

| Type | Description |
|------|-------------|
| `TrendDataPoint` | Single data point with date, score, confidence |
| `DomainTrendData` | Full trend analysis with volatility and direction |
| `SignalContribution` | LIWC/Embedding/LLM breakdown per domain |
| `ContextVariation` | How trait varies across 10 context types |
| `ConfidenceInterval` | Score with uncertainty bounds |
| `VisualizationSummary` | Aggregate statistics across all domains |

### `emotion-detector.ts`
Phase 6 Real-time Emotion Detection using Russell's Circumplex Model:

```typescript
import {
  detectEmotion,
  blendEmotions,
  createNeutralState,
  calculateEmotionTrend,
  getEmotionColor,
  getEmotionEmoji,
  type EmotionalState,
  type EmotionTrend,
  type EmotionLabel
} from './lib/emotion-detector'

// Detect emotion from prosodic features
const emotion = detectEmotion(prosodicFeatures)
// Returns: EmotionalState {
//   valence: 0.6,      // -1 to 1 (negative to positive)
//   arousal: 0.4,      // -1 to 1 (calm to excited)
//   primaryEmotion: 'happy',
//   secondaryEmotion: 'content',
//   confidence: 0.8,
//   intensity: 0.7,
//   quadrant: 1,       // 1=high-V/high-A, 2=low-V/high-A, etc.
//   timestamp: Date
// }

// Blend with previous emotion for smooth transitions
const blended = blendEmotions(previousEmotion, newEmotion, 0.3)
// Returns smoothly interpolated emotion state

// Create neutral starting state
const neutral = createNeutralState()
// Returns: { valence: 0, arousal: 0, primaryEmotion: 'neutral', ... }

// Calculate trend from history
const trend = calculateEmotionTrend(emotionHistory)
// Returns: 'improving' | 'declining' | 'stable' | 'fluctuating'

// Get emotion display properties
const color = getEmotionColor('happy')     // '#FFD700'
const emoji = getEmotionEmoji('anxious')   // '😰'
```

**EmotionalState Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `valence` | number | -1 to 1 (negative to positive affect) |
| `arousal` | number | -1 to 1 (calm to activated) |
| `primaryEmotion` | EmotionLabel | Main detected emotion |
| `secondaryEmotion` | EmotionLabel | Secondary emotion if close |
| `confidence` | number | 0-1 confidence in detection |
| `intensity` | number | 0-1 emotional intensity |
| `quadrant` | 1-4 | Circumplex quadrant |
| `timestamp` | Date | When detected |

**SQL Tables (Phase 6):**

| Table | Purpose |
|-------|---------|
| `emotion_states` | Individual emotion state records with valence, arousal, labels |
| `emotion_sessions` | Aggregated session statistics (avg valence, dominant emotion) |

---

## Configuration

### Analysis Weights (`analysis-config.ts`)

```typescript
export const ANALYSIS_CONFIG = {
  llmBatchSize: 5,              // Messages before LLM analysis
  llmBatchTimeout: 5 * 60000,   // 5 min max between analyses
  llmEnabled: true,
  embeddingEnabled: true,

  weights: {
    liwc: 0.2,
    embedding: 0.3,
    llm: 0.5,
  },

  fallbackWeights: {  // When LLM not yet available
    liwc: 0.4,
    embedding: 0.6,
  },
}
```

### LLM Settings (`store.ts`)

- **Context Window Size**: 1024 / 2048 / 4096 / 8192 tokens
- **Response Size**: Concise / Balanced / Detailed
- **Language**: 16 supported languages
- **System Prompt Presets**: Friendly / Professional / Socratic / Creative / Mindful / Custom
- **Conversation Memory**: Enable/disable cross-session memory

---

## Privacy & Data

### Data Storage
- **All data is stored locally** in browser storage (IndexedDB, SQLite WASM)
- **No external API calls** - AI models run entirely in-browser via WebGPU
- **No telemetry** - Zero tracking or analytics

### Data Control
- **Export**: Download all data as JSON file from Settings
- **Delete**: Permanently remove all data with one click
- **View**: Inspect all stored data in the Data Inspector

### What Data is Stored
- Conversation messages
- Session information
- Psychological domain scores
- Linguistic analysis features
- Knowledge graph triples
- Semantic embeddings
- Activity logs

---

## Development

### Debug Tools

```javascript
// In browser console:
window.debugHybridAnalysis()  // View current LLM analysis results
```

### Type Checking

```bash
npm run build  # Runs tsc -b before Vite build
```

### Linting

```bash
npm run lint
```

---

## Research & Documentation

See the `/research` folder for detailed specifications:

- `Fine-Tuned-Psychometrics.md` - Complete 39-domain specification
- `PRD-Digital-Twin.md` - Product requirements document
- `Final-Architecture.md` - System architecture details
- `domain-markers.md` - Linguistic markers for each domain
- `technical-whitepaper.md` - Academic whitepaper covering architecture, privacy guarantees, and methodology
- `39-domain-integration-methodology.md` - Guide for integrating new domains into the framework
- `expert.md` - Expert feedback synthesis (Elon Musk & Ilya Sutskever simulations)
- `phases.md` - Development phases and milestones

---

## Benefits

### For Personal Growth
- **Self-awareness**: Understand your psychological patterns
- **Track progress**: See how you evolve over time
- **Personalized AI**: Get responses tailored to your style

### For Privacy Advocates
- **No data leaves your device**: Everything runs locally
- **No accounts required**: Start using immediately
- **Full transparency**: View all stored data anytime

### For Researchers
- **Open source**: Modify and extend as needed
- **Detailed logging**: Track all analysis events
- **Export capabilities**: Extract data for analysis

---

## Limitations

- **WebGPU Required**: LLM inference requires WebGPU support (Chrome/Edge 113+)
- **Memory Usage**: ~4GB RAM recommended for smooth LLM operation
- **First Load**: Initial model download is ~2.5GB for recommended model
- **Accuracy**: Inverse profiling is less accurate than validated questionnaires
- **Browser-Dependent**: Performance varies by browser and hardware

---

## Roadmap

### Completed
- [x] Three-signal hybrid analysis system
- [x] 39 psychological domains
- [x] Four database systems (IndexedDB, SQLite, LevelGraph, VectorDB)
- [x] Adaptive AI responses based on profile
- [x] Conversation memory across sessions
- [x] Historical trend charts
- [x] Confidence intervals on scores
- [x] Signal source indicators
- [x] Multi-language support (16 languages)
- [x] Multiple AI model options
- [x] Custom system prompts
- [x] Data export/delete functionality
- [x] **Progressive Web App (PWA)** - Full offline support with service worker caching
- [x] **Interpretability Panel** - "Why does it think this?" explainer for all scores
- [x] **Performance Benchmarks** - Real-time benchmarking of LLM, embeddings, and memory
- [x] **Technical Whitepaper** - Academic documentation of methodology and architecture
- [x] **39-Domain Integration Methodology** - Comprehensive guide for domain integration
- [x] **Phase 3: Adaptive Learning System** - ZPD assessment, SM-2 spaced repetition, VARK learning styles, scaffolded explanations, knowledge gap detection
- [x] **Phase 4: Strategic Questioning Engine** - Three-phase active learning (diagnostic → targeted → validation), 50+ strategic questions, question effectiveness tracking
- [x] **Phase 4: Profile Validation System** - Cross-signal validation, temporal stability checks, internal consistency metrics
- [x] **Phase 4: Context-Dependent Profiling** - 10 context types, automatic detection, context-specific scores, variation analysis
- [x] **Phase 4: Advanced Knowledge Graph** - Temporal evolution tracking, cross-domain inference, causal reasoning chains, path-based queries
- [x] **Phase 4: Audio/Multimodal Analysis** - Voice recording, prosodic feature extraction (pitch, tempo, energy, jitter, shimmer), domain mapping
- [x] **Phase 4: Multimodal Fusion** - Text + audio signal combination, cross-modal validation, context-aware weighting
- [x] **Phase 5: Advanced Visualization Dashboard** - Historical trend charts with volatility analysis, signal contribution breakdown (LIWC/Embedding/LLM), context variation heatmap, confidence intervals with uncertainty visualization, profile summary card
- [x] **Phase 6: Real-time Emotion Detection** - Russell's Circumplex Model (valence/arousal 2D space), 17 discrete emotion labels, prosodic-to-emotion mapping, emotion blending for smooth transitions, trend analysis (improving/declining/stable/fluctuating), EmotionIndicator UI component, SQL emotion timeline storage

### Planned (Phase 7)
- [ ] Video analysis (facial expressions, gestures)
- [ ] Text-based emotion detection (sentiment analysis)
- [ ] Emotion-aware adaptive LLM responses
- [ ] Collaborative profiling (compare profiles between users)
- [ ] Export to clinical/research formats
- [ ] Data import from exported JSON
- [ ] Profile sharing/comparison (anonymized)
- [ ] Custom trait definitions
- [ ] Mobile-optimized UI
- [ ] Integration with wearable device data

---

## License

MIT License - See LICENSE file for details.

---

## Acknowledgments

- Psychological domain structure based on established research instruments (Big Five, DISC, LIWC, etc.)
- LIWC methodology inspired by Pennebaker's Linguistic Inquiry and Word Count
- Built with MediaPipe, Hugging Face Transformers.js, and the web AI ecosystem
- Gemma models by Google DeepMind
