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

### Visualization & Insights
- **Profile Dashboard**: Interactive visualization of all 39 psychological domains.
- **Historical Trends**: Track how your profile evolves over time with trend charts.
- **Signal Source Indicators**: See which analysis method (LIWC/Embedding/LLM) contributed to each score.
- **Data Inspector**: Explore all stored data including knowledge graphs.
- **Activity Timeline**: View your conversation and analysis history.

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
| **SQL.js** | SQLite (WASM) | Domain scores, feature counts, signal history |
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
│   └── Layout.tsx              # Main layout wrapper
├── pages/
│   ├── ChatPage.tsx            # Main chat interface
│   ├── ProfileDashboard.tsx    # Profile visualization & data inspector
│   ├── SettingsPage.tsx        # App settings
│   └── ActivityDashboard.tsx   # Activity log viewer
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
    ├── personality.ts          # Personality trait calculations
    ├── analyzer.ts             # Basic text analysis utilities
    ├── history.ts              # Conversation history management
    └── format-message.tsx      # Message rendering utilities

research/                       # Documentation & specifications
├── Fine-Tuned-Psychometrics.md # 39-domain specification (PRD)
├── PRD-Digital-Twin.md         # Product requirements
├── Final-Architecture.md       # System architecture
├── domain-markers.md           # Linguistic markers per domain
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

### Planned
- [ ] Data import from exported JSON
- [ ] Profile sharing/comparison (anonymized)
- [ ] Custom trait definitions
- [ ] Service worker for offline support
- [ ] Mobile-optimized UI
- [ ] Additional AI model support

---

## License

MIT License - See LICENSE file for details.

---

## Acknowledgments

- Psychological domain structure based on established research instruments (Big Five, DISC, LIWC, etc.)
- LIWC methodology inspired by Pennebaker's Linguistic Inquiry and Word Count
- Built with MediaPipe, Hugging Face Transformers.js, and the web AI ecosystem
- Gemma models by Google DeepMind
