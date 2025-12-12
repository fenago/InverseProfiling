# InverseProfiling (Digital Twin)

A privacy-first, browser-based psychometric profiling application that builds a psychological profile through natural conversation. All processing happens locally on your device using WebGPU-accelerated AI models.

## Overview

InverseProfiling implements **inverse profiling** - instead of using traditional psychometric questionnaires, it analyzes natural language from conversations to infer psychological traits across 39 research-backed domains. This creates a dynamic "digital twin" that adapts its understanding as you interact with it.

### Key Features

- **100% Local Processing**: All data stays on your device. No external API calls.
- **Hybrid Analysis System**: Three complementary signals for accurate profiling
- **39 Psychological Domains**: Comprehensive coverage from Big Five to cognitive styles
- **Real-time Adaptive Responses**: AI responses adapt based on your profile
- **Interactive Data Inspector**: Visualize all stored data including knowledge graphs

## Architecture

### Three-Signal Hybrid Analysis

The system uses three complementary analysis methods, each with different speed/accuracy tradeoffs:

```
User Message
    │
    ├──► [LIWC Analysis] ──────► Immediate Score (fast, limited)
    │         Weight: 0.2
    │
    ├──► [Embedding Similarity] ──► Real-time Signal (medium reliability)
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

| Signal | Speed | Reliability | Method |
|--------|-------|-------------|--------|
| **LIWC** | Instant | Low (0.2) | Word/phrase matching against psychological dictionaries |
| **Embeddings** | Fast | Medium (0.3) | Semantic similarity via BGE-small-en transformer |
| **LLM** | Batch (5 msgs) | High (0.5) | Deep semantic analysis via Gemma 3n |

### Database Architecture

Four specialized storage systems, all browser-based:

| Database | Technology | Purpose |
|----------|------------|---------|
| **Dexie** | IndexedDB | Messages, sessions, profiles, activity logs |
| **SQL.js** | SQLite (WASM) | Domain scores, feature counts, signal history |
| **LevelGraph** | LevelDB | Knowledge graph (subject-predicate-object triples) |
| **TinkerBird** | Vector DB | Semantic embeddings for similarity search |

## Psychological Domains

39 domains organized into 8 categories:

### Category A: Core Personality (Big Five)
- `big_five_openness` - Curiosity, creativity, intellectual interests
- `big_five_conscientiousness` - Organization, dependability, self-discipline
- `big_five_extraversion` - Sociability, assertiveness, positive emotions
- `big_five_agreeableness` - Cooperation, trust, empathy
- `big_five_neuroticism` - Emotional instability, anxiety, moodiness

### Category B: Dark Personality
- `dark_triad_narcissism` - Grandiosity, need for admiration
- `dark_triad_machiavellianism` - Manipulation, strategic thinking
- `dark_triad_psychopathy` - Impulsivity, callousness

### Category C: Emotional/Social Intelligence
- `emotional_empathy` - Empathy Quotient (EQ)
- `emotional_intelligence` - MSCEIT-based emotional skills
- `attachment_style` - ECR-R attachment patterns
- `love_languages` - 5 Love Languages preferences
- `communication_style` - DISC communication patterns

### Category D: Decision Making & Motivation
- `risk_tolerance` - DOSPERT risk assessment
- `decision_style` - Rational vs Intuitive
- `time_orientation` - ZTPI time perspectives
- `achievement_motivation` - Need for Achievement (nAch)
- `self_efficacy` - General Self-Efficacy (GSE)
- `locus_of_control` - Internal vs External (Rotter)
- `growth_mindset` - Fixed vs Growth (Dweck)

### Category E: Values & Wellbeing
- `personal_values` - Schwartz PVQ (10 value facets)
- `interests` - RIASEC/Holland career codes
- `life_satisfaction` - SWLS satisfaction scale
- `stress_coping` - COPE/Brief COPE strategies
- `social_support` - MSPSS support perception
- `authenticity` - Authenticity Scale

### Category F: Cognitive/Learning
- `cognitive_abilities` - Verbal, Numerical, Spatial
- `creativity` - CAQ/Divergent Thinking
- `learning_styles` - VARK preferences
- `information_processing` - Deep vs Shallow processing
- `metacognition` - MAI metacognitive awareness
- `executive_functions` - BRIEF/Miyake model

### Category G: Social/Cultural/Values
- `social_cognition` - Theory of Mind (RMET)
- `political_ideology` - MFQ/Political Compass
- `cultural_values` - Hofstede Dimensions
- `moral_reasoning` - DIT-2/MFQ moral foundations
- `work_career_style` - Career Anchors

### Category H: Sensory/Aesthetic
- `sensory_processing` - HSP Scale sensitivity
- `aesthetic_preferences` - Aesthetic Fluency

## Tech Stack

### Core
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tooling
- **Tailwind CSS** - Styling
- **Zustand** - State management

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

## Data Inspector

The Profile Dashboard includes a Data Inspector modal that visualizes all stored data:

- **Table View**: Human-readable tabular format for all data types
- **JSON View**: Raw JSON for debugging
- **Graph View**: Interactive SVG visualization for knowledge graph data

Hover over nodes/edges in the graph view to see relationship details.

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

- **Context Window Size**: 512 / 1024 / 2048 tokens
- **Response Size**: Concise / Balanced / Detailed
- **Language**: 16 supported languages
- **System Prompt Presets**: Friendly / Professional / Socratic / etc.

## Privacy & Data

- **All data is stored locally** in browser storage (IndexedDB, SQLite WASM)
- **No external API calls** - AI models run entirely in-browser via WebGPU
- **Export/Delete**: Full data export (JSON) and deletion available in Settings
- **No telemetry** - Zero tracking or analytics

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

## Research & Documentation

See the `/research` folder for detailed specifications:

- `Fine-Tuned-Psychometrics.md` - Complete 39-domain specification
- `PRD-Digital-Twin.md` - Product requirements document
- `Final-Architecture.md` - System architecture details
- `domain-markers.md` - Linguistic markers for each domain

## Limitations

- **WebGPU Required**: LLM inference requires WebGPU support (Chrome/Edge 113+)
- **Memory Usage**: ~4GB RAM recommended for smooth LLM operation
- **First Load**: Initial model download is ~500MB
- **Accuracy**: Inverse profiling is less accurate than validated questionnaires

## License

MIT License - See LICENSE file for details.

## Acknowledgments

- Psychological domain structure based on established research instruments (Big Five, MBTI, DISC, etc.)
- LIWC methodology inspired by Pennebaker's Linguistic Inquiry and Word Count
- Built with MediaPipe, Hugging Face Transformers.js, and the web AI ecosystem
