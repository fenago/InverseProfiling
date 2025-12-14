# CLAUDE.md - QMU.io Project Reference

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

QMU.io is an on-device psychological profiling application that analyzes user conversations using a **three-signal hybrid psychometric analysis system**:

- **LIWC Analysis (20%)** - Fast word-matching based on linguistic markers
- **Embedding Similarity (30%)** - Semantic similarity to trait prototypes via TinkerBird VectorDB
- **LLM Deep Analysis (50%)** - Full semantic understanding via Gemma 3n WebGPU

All processing happens **100% on-device** - no data leaves the user's browser.

## Architecture

### Four Database Systems
1. **Dexie/IndexedDB** (`db.ts`) - Messages, sessions, activity logs
2. **SQL.js/SQLite WASM** (`sqldb.ts`) - Domain scores, feature counts, hybrid signals, emotions
3. **LevelGraph** (`graphdb.ts`) - Knowledge graph with subject-predicate-object triples
4. **TinkerBird VectorDB** (`vectordb.ts`) - Embeddings for semantic search and similarity

### Key Files
```
src/
├── lib/
│   ├── analysis-config.ts     # 39 domains, weights, categories
│   ├── trait-prototypes.ts    # Embedding prototypes for each domain
│   ├── enhanced-analyzer.ts   # LIWC-based word matching
│   ├── hybrid-aggregator.ts   # Combines all three signals
│   ├── llm-deep-analyzer.ts   # LLM batch analysis
│   ├── emotion-detector.ts    # Real-time emotion detection (Russell's Circumplex)
│   ├── context-profiler.ts    # Context-aware trait analysis
│   ├── strategic-questions.ts # Active learning framework
│   └── store.ts               # Zustand state management
├── pages/
│   ├── ChatPage.tsx           # Main conversation interface
│   ├── ProfileDashboard.tsx   # Profile visualization + Data Inspector
│   ├── ActivityDashboard.tsx  # Activity logs
│   └── SettingsPage.tsx       # Model selection, export/import
└── components/
    ├── Layout.tsx             # Navigation sidebar
    └── EmotionIndicator.tsx   # Real-time emotion display
```

## Common Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Production build
npm run typecheck # TypeScript type checking
npm run lint     # ESLint
```

## 39 Psychological Domains

The system analyzes **39 psychological domains** organized in **8 categories**. Full reference in [research/domain-reference.md](research/domain-reference.md).

### Quick Domain Reference

| Category | Domains |
|----------|---------|
| **A. Core Personality (Big Five)** | Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism |
| **B. Dark Personality** | Narcissism, Machiavellianism, Psychopathy |
| **C. Emotional/Social** | Empathy, EQ, Attachment, Love Languages, Communication |
| **D. Decision/Motivation** | Risk Tolerance, Decision Style, Time Orientation, Achievement, Self-Efficacy, Locus of Control, Growth Mindset |
| **E. Values/Wellbeing** | Personal Values, Interests (RIASEC), Life Satisfaction, Stress Coping, Social Support, Authenticity |
| **F. Cognitive/Learning** | Cognitive Abilities, Creativity, Learning Styles, Information Processing, Metacognition, Executive Functions |
| **G. Social/Cultural** | Social Cognition, Political Ideology, Cultural Values, Moral Reasoning, Work/Career Style |
| **H. Sensory/Aesthetic** | Sensory Processing, Aesthetic Preferences |

### Domain IDs (for code references)

```typescript
// Big Five
'big_five_openness', 'big_five_conscientiousness', 'big_five_extraversion',
'big_five_agreeableness', 'big_five_neuroticism'

// Dark Triad
'dark_triad_narcissism', 'dark_triad_machiavellianism', 'dark_triad_psychopathy'

// Emotional
'emotional_empathy', 'emotional_intelligence', 'attachment_style',
'love_languages', 'communication_style'

// Decision/Motivation
'risk_tolerance', 'decision_style', 'time_orientation', 'achievement_motivation',
'self_efficacy', 'locus_of_control', 'growth_mindset'

// Values/Wellbeing
'personal_values', 'interests', 'life_satisfaction', 'stress_coping',
'social_support', 'authenticity'

// Cognitive
'cognitive_abilities', 'creativity', 'learning_styles', 'information_processing',
'metacognition', 'executive_functions'

// Social/Cultural
'social_cognition', 'political_ideology', 'cultural_values', 'moral_reasoning',
'work_career_style'

// Sensory/Aesthetic
'sensory_processing', 'aesthetic_preferences'
```

## Analysis Pipeline

```
User Message
    ↓
[LIWC Analysis] → Immediate linguistic feature extraction
    ↓
[Embedding Similarity] → Semantic similarity to trait prototypes
    ↓
[Message Queue] → Every 5 messages or 5 minutes
    ↓
[LLM Deep Analysis] → Batch semantic analysis
    ↓
[Hybrid Aggregator] → Weighted combination (configurable in Settings)
    ↓
[SQL Storage] → Persistent domain scores with confidence
```

## Emotion Detection

Real-time emotion detection using Russell's Circumplex Model:
- **Valence** (-1 to 1): Negative to Positive
- **Arousal** (-1 to 1): Calm to Activated

17 discrete emotions mapped across 4 quadrants + neutral.

## Key Interfaces

```typescript
// Domain score structure
interface DomainScore {
  domain: string
  score: number          // 0-1 normalized
  confidence: number     // 0-1
  dataPointsCount: number
  lastUpdated: string
}

// Hybrid signal structure
interface HybridSignal {
  domain: string
  liwcScore: number
  embeddingScore: number
  llmScore: number | null
  finalScore: number
  weights: { liwc: number, embedding: number, llm: number }
}

// Emotion state
interface EmotionState {
  valence: number        // -1 to 1
  arousal: number        // -1 to 1
  primaryEmotion: string
  confidence: number
  intensity: number
}
```

## Important Notes

1. **Privacy First**: All data stays on-device. No external API calls for analysis.
2. **WebGPU Required**: LLM features require WebGPU support (Chrome 113+)
3. **Hybrid Weights**: Configurable in Settings → Analysis Weights
4. **Export**: All data can be exported as JSON from Settings

## Testing Changes

After making changes:
1. `npm run typecheck` - Ensure no TypeScript errors
2. `npm run build` - Verify production build works
3. Test at `http://localhost:5173` with dev server
