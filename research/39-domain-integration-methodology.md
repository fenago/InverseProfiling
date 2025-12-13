# 39-Domain Integration Methodology

## Technical Documentation for Privacy-Preserving Digital Twin

**Version:** 1.0
**Last Updated:** December 2025
**Status:** Active

---

## Executive Summary

This document describes the methodology for integrating 39 psychological domains into a privacy-preserving digital twin system. The approach uses a hybrid three-signal analysis framework combining LIWC-style text analysis, semantic embeddings, and LLM reasoning to build a comprehensive psychological profile from natural conversation.

**Key Innovation:** Zero-cloud architecture where all analysis happens on-device using WebGPU-accelerated models.

---

## Table of Contents

1. [Domain Taxonomy](#1-domain-taxonomy)
2. [Three-Signal Analysis Framework](#2-three-signal-analysis-framework)
3. [Domain Detection Pipeline](#3-domain-detection-pipeline)
4. [Scoring Methodology](#4-scoring-methodology)
5. [Confidence Calibration](#5-confidence-calibration)
6. [Domain Aggregation](#6-domain-aggregation)
7. [Temporal Stability Analysis](#7-temporal-stability-analysis)
8. [Implementation Architecture](#8-implementation-architecture)
9. [Validation & Testing](#9-validation--testing)
10. [Known Limitations](#10-known-limitations)

---

## 1. Domain Taxonomy

### 1.1 Eight Category Organization

The 39 domains are organized into 8 hierarchical categories:

| Category | Code | Domains | Focus Area |
|----------|------|---------|------------|
| **A: Core Personality** | Big Five | 1-5 | Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism |
| **B: Dark Personality** | Dark Triad | 6-8 | Narcissism, Machiavellianism, Psychopathy |
| **C: Emotional/Social Intelligence** | EQ | 9-13 | Empathy, EI, Attachment, Love Languages, Communication |
| **D: Decision Making & Motivation** | DM | 14-20 | Risk, Decision Style, Time, Achievement, Efficacy, Locus, Growth |
| **E: Values & Wellbeing** | VW | 21-26 | Values, Interests, Life Satisfaction, Coping, Support, Authenticity |
| **F: Cognitive/Learning** | CL | 27-32 | Abilities, Creativity, Learning, Processing, Metacognition, Executive |
| **G: Social/Cultural/Values** | SC | 33-37 | Social Cognition, Political, Cultural, Moral, Work/Career |
| **H: Sensory/Aesthetic** | SA | 38-39 | Sensory Processing, Aesthetic Preferences |

### 1.2 Complete Domain List

```typescript
// All 39 Psychological Domains
type PsychologicalDomain =
  // Category A: Core Personality - Big Five (1-5)
  | 'big_five_openness'
  | 'big_five_conscientiousness'
  | 'big_five_extraversion'
  | 'big_five_agreeableness'
  | 'big_five_neuroticism'
  // Category B: Dark Personality (6-8)
  | 'dark_triad_narcissism'
  | 'dark_triad_machiavellianism'
  | 'dark_triad_psychopathy'
  // Category C: Emotional/Social Intelligence (9-13)
  | 'emotional_empathy'
  | 'emotional_intelligence'
  | 'attachment_style'
  | 'love_languages'
  | 'communication_style'
  // Category D: Decision Making & Motivation (14-20)
  | 'risk_tolerance'
  | 'decision_style'
  | 'time_orientation'
  | 'achievement_motivation'
  | 'self_efficacy'
  | 'locus_of_control'
  | 'growth_mindset'
  // Category E: Values & Wellbeing (21-26)
  | 'personal_values'
  | 'interests'
  | 'life_satisfaction'
  | 'stress_coping'
  | 'social_support'
  | 'authenticity'
  // Category F: Cognitive/Learning (27-32)
  | 'cognitive_abilities'
  | 'creativity'
  | 'learning_styles'
  | 'information_processing'
  | 'metacognition'
  | 'executive_functions'
  // Category G: Social/Cultural/Values (33-37)
  | 'social_cognition'
  | 'political_ideology'
  | 'cultural_values'
  | 'moral_reasoning'
  | 'work_career_style'
  // Category H: Sensory/Aesthetic (38-39)
  | 'sensory_processing'
  | 'aesthetic_preferences'
```

### 1.3 Psychometric Source Mapping

Each domain maps to established psychometric instruments:

| Domain | Psychometric Source | Construct Validity |
|--------|---------------------|-------------------|
| big_five_* | NEO-PI-R (Costa & McCrae, 1992) | High |
| dark_triad_* | Dark Triad Dirty Dozen / SD3 | Moderate-High |
| emotional_empathy | IRI (Davis, 1983) | High |
| emotional_intelligence | MSCEIT | Moderate |
| attachment_style | ECR-R | High |
| love_languages | 5LL Assessment (Chapman) | Moderate |
| communication_style | DISC Assessment | Moderate |
| risk_tolerance | DOSPERT Scale | High |
| decision_style | REI (Rational-Experiential) | Moderate-High |
| time_orientation | ZTPI (Zimbardo) | High |
| achievement_motivation | nAch / TAT | Moderate |
| self_efficacy | GSE Scale | High |
| locus_of_control | Rotter's LOC Scale | High |
| growth_mindset | ITIS (Dweck) | High |
| personal_values | PVQ (Schwartz) | High |
| interests | Holland Codes / RIASEC | High |
| life_satisfaction | SWLS | High |
| stress_coping | Brief COPE | Moderate-High |
| social_support | MSPSS | High |
| authenticity | Authenticity Scale | Moderate |
| cognitive_abilities | g-factor tests | High |
| creativity | CAQ / TTCT | Moderate |
| learning_styles | VARK | Low-Moderate |
| information_processing | Need for Cognition | Moderate-High |
| metacognition | MAI | Moderate |
| executive_functions | BRIEF | Moderate-High |
| social_cognition | RMET | Moderate |
| political_ideology | MFQ | High |
| cultural_values | Hofstede/WVS | High |
| moral_reasoning | DIT-2 | High |
| work_career_style | Career Anchors | Moderate |
| sensory_processing | HSP Scale | Moderate-High |
| aesthetic_preferences | AFS | Low-Moderate |

---

## 2. Three-Signal Analysis Framework

### 2.1 Overview

The system uses three complementary analysis signals that are aggregated using weighted fusion:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Message                                │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌───────┐   ┌─────────┐   ┌─────────┐
│ LIWC  │   │Embedding│   │   LLM   │
│Signal │   │ Signal  │   │ Signal  │
└───┬───┘   └────┬────┘   └────┬────┘
    │            │             │
    │ 0.3        │ 0.3         │ 0.4
    └────────────┼─────────────┘
                 ▼
         ┌───────────────┐
         │ Hybrid Score  │
         │ (Aggregated)  │
         └───────────────┘
```

### 2.2 Signal 1: LIWC-Style Text Analysis

**Weight:** 30% (configurable)

**Approach:** Dictionary-based word counting using psychologically validated word categories.

**Implementation:**
```typescript
interface LIWCAnalysisResult {
  // Summary Variables
  analyticalThinking: number   // 0-100 scale
  clout: number                // Social dominance
  authenticity: number         // Self-disclosure
  emotionalTone: number        // Positive vs negative

  // Category Counts (per 100 words)
  pronouns: {
    firstPersonSingular: number  // I, me, my
    firstPersonPlural: number    // we, us, our
    secondPerson: number         // you, your
    thirdPerson: number          // he, she, they
  }

  affect: {
    positive: number
    negative: number
    anxiety: number
    anger: number
    sadness: number
  }

  cognitive: {
    insight: number        // think, know, consider
    causation: number      // because, effect, hence
    discrepancy: number    // should, would, could
    tentative: number      // maybe, perhaps, guess
    certainty: number      // always, never, definitely
  }

  social: {
    family: number
    friends: number
    affiliation: number
  }

  temporal: {
    pastFocus: number
    presentFocus: number
    futureFocus: number
  }
}
```

**Domain Mapping Rules:**
```typescript
const LIWC_DOMAIN_WEIGHTS: Record<string, Partial<Record<PsychologicalDomain, number>>> = {
  'firstPersonSingular': {
    big_five_neuroticism: 0.3,
    emotional_empathy: -0.2,
    attachment_style: 0.2,
  },
  'positiveEmotion': {
    big_five_extraversion: 0.4,
    big_five_agreeableness: 0.3,
    life_satisfaction: 0.5,
  },
  'negativeEmotion': {
    big_five_neuroticism: 0.5,
    stress_coping: -0.3,
    life_satisfaction: -0.4,
  },
  'achievementWords': {
    big_five_conscientiousness: 0.4,
    achievement_motivation: 0.6,
    growth_mindset: 0.3,
  },
  // ... 200+ mapping rules
}
```

### 2.3 Signal 2: Semantic Embedding Analysis

**Weight:** 30% (configurable)

**Approach:** Compare user text embeddings against prototype texts for each domain using cosine similarity.

**Model:** BGE-small-en-v1.5 (384 dimensions)

**Implementation:**
```typescript
interface EmbeddingAnalysisResult {
  domainScores: Record<PsychologicalDomain, {
    similarity: number        // -1 to 1 cosine similarity
    normalizedScore: number   // 0 to 1 normalized
    prototypeMatched: string  // Best matching prototype
  }>
}

// Prototype text examples per domain
const TRAIT_PROTOTYPES = {
  big_five_openness: [
    "I love exploring new ideas and perspectives, even unconventional ones.",
    "Art, music, and creative expression are essential parts of my life.",
    "I'm always curious about how things work and why.",
    // 10+ prototypes per domain
  ],
  big_five_conscientiousness: [
    "I always make detailed plans and follow through on them.",
    "Being organized and prepared is very important to me.",
    // ...
  ],
  // ... all 39 domains
}
```

**Scoring Algorithm:**
```typescript
function computeEmbeddingSimilarity(
  userEmbedding: number[],
  domainPrototypes: string[]
): number {
  const similarities = domainPrototypes.map(proto => {
    const protoEmbedding = generateEmbedding(proto)
    return cosineSimilarity(userEmbedding, protoEmbedding)
  })

  // Use top-3 average for robustness
  const topN = similarities.sort((a, b) => b - a).slice(0, 3)
  return topN.reduce((a, b) => a + b, 0) / topN.length
}
```

### 2.4 Signal 3: LLM Reasoning Analysis

**Weight:** 40% (configurable)

**Approach:** Use Gemma 3n to perform structured psychological analysis with chain-of-thought reasoning.

**Model:** Gemma 3n E4B (4B parameters, optimized for on-device)

**Prompt Structure:**
```typescript
const LLM_ANALYSIS_PROMPT = `
<system>
You are a psychological analyst. Analyze the following message for psychological traits.
Focus on: ${domainList}
Output JSON only.
</system>

<message>
${userMessage}
</message>

<task>
For each domain, provide:
1. score (0-1): likelihood this trait is expressed
2. confidence (0-1): certainty in your assessment
3. evidence: specific text that supports this score
4. reasoning: brief explanation

Output format:
{
  "domains": {
    "domain_id": {
      "score": 0.0-1.0,
      "confidence": 0.0-1.0,
      "evidence": "quote",
      "reasoning": "explanation"
    }
  }
}
</task>
`
```

**Implementation:**
```typescript
interface LLMAnalysisResult {
  domains: Record<PsychologicalDomain, {
    score: number
    confidence: number
    evidence: string
    reasoning: string
  }>
  processingTimeMs: number
  tokensUsed: number
}
```

---

## 3. Domain Detection Pipeline

### 3.1 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DOMAIN DETECTION PIPELINE                       │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: Message Preprocessing
├── Tokenization (whitespace + punctuation)
├── Normalization (lowercase, contractions)
├── Length validation (min 10 words)
└── Language detection (English only v1.0)

Step 2: Parallel Analysis
├── LIWC Analysis (sync, <10ms)
├── Embedding Generation (async, ~50-100ms)
└── LLM Inference (async, ~2-5s)

Step 3: Score Normalization
├── LIWC: Z-score against population norms
├── Embeddings: Min-max to [0,1]
└── LLM: Already normalized

Step 4: Hybrid Aggregation
├── Weight-based fusion
├── Confidence calculation
└── Domain score output

Step 5: Profile Update
├── Temporal smoothing (EMA)
├── Confidence accumulation
└── Database persistence
```

### 3.2 Message Preprocessing

```typescript
interface PreprocessedMessage {
  original: string
  normalized: string
  tokens: string[]
  wordCount: number
  sentenceCount: number
  isValid: boolean
  language: 'en' | 'unknown'
}

function preprocessMessage(text: string): PreprocessedMessage {
  // 1. Basic cleaning
  const normalized = text
    .toLowerCase()
    .replace(/['']/g, "'")  // Normalize quotes
    .replace(/[""]/g, '"')

  // 2. Tokenize
  const tokens = normalized
    .split(/\s+/)
    .filter(t => t.length > 0)

  // 3. Count sentences
  const sentenceCount = (text.match(/[.!?]+/g) || []).length || 1

  // 4. Validate
  const isValid = tokens.length >= 10

  return {
    original: text,
    normalized,
    tokens,
    wordCount: tokens.length,
    sentenceCount,
    isValid,
    language: 'en'
  }
}
```

### 3.3 Parallel Execution Strategy

```typescript
async function analyzeMessage(message: string): Promise<AnalysisResult> {
  const preprocessed = preprocessMessage(message)

  if (!preprocessed.isValid) {
    return { status: 'insufficient_data', reason: 'Message too short' }
  }

  // Execute all three signals in parallel
  const [liwcResult, embeddingResult, llmResult] = await Promise.all([
    analyzeLIWC(preprocessed),
    analyzeEmbeddings(preprocessed),
    analyzeLLM(preprocessed)
  ])

  // Aggregate using hybrid fusion
  return aggregateSignals(liwcResult, embeddingResult, llmResult)
}
```

---

## 4. Scoring Methodology

### 4.1 Individual Signal Scoring

**LIWC Scoring:**
```typescript
function scoreLIWCForDomain(
  liwcResult: LIWCAnalysisResult,
  domain: PsychologicalDomain
): number {
  const weights = LIWC_DOMAIN_WEIGHTS[domain]
  let score = 0.5 // Neutral baseline

  for (const [category, weight] of Object.entries(weights)) {
    const rawValue = liwcResult[category]
    const zScore = (rawValue - POPULATION_MEANS[category]) / POPULATION_SDS[category]
    const contribution = sigmoid(zScore) * weight
    score += contribution
  }

  return clamp(score, 0, 1)
}
```

**Embedding Scoring:**
```typescript
function scoreEmbeddingsForDomain(
  userEmbedding: number[],
  domain: PsychologicalDomain
): number {
  const prototypes = TRAIT_PROTOTYPE_TEXTS[domain]
  const similarities: number[] = []

  for (const proto of prototypes) {
    const protoEmbedding = embeddingCache.get(proto) || generateEmbedding(proto)
    const sim = cosineSimilarity(userEmbedding, protoEmbedding)
    similarities.push(sim)
  }

  // Top-3 average with floor at 0
  const sorted = similarities.sort((a, b) => b - a).slice(0, 3)
  const avgSimilarity = sorted.reduce((a, b) => a + b, 0) / 3

  // Transform from [-1, 1] to [0, 1]
  return (avgSimilarity + 1) / 2
}
```

**LLM Scoring:**
```typescript
function scoreLLMForDomain(
  llmResult: LLMAnalysisResult,
  domain: PsychologicalDomain
): { score: number; confidence: number } {
  const domainResult = llmResult.domains[domain]

  if (!domainResult) {
    return { score: 0.5, confidence: 0 }
  }

  return {
    score: clamp(domainResult.score, 0, 1),
    confidence: clamp(domainResult.confidence, 0, 1)
  }
}
```

### 4.2 Hybrid Aggregation

```typescript
interface HybridScoreConfig {
  liwcWeight: number      // Default: 0.30
  embeddingWeight: number // Default: 0.30
  llmWeight: number       // Default: 0.40
}

function computeHybridScore(
  liwcScore: number,
  embeddingScore: number,
  llmScore: number,
  llmConfidence: number,
  config: HybridScoreConfig = DEFAULT_HYBRID_CONFIG
): number {
  // Adjust LLM weight by its confidence
  const adjustedLLMWeight = config.llmWeight * llmConfidence

  // Redistribute unallocated weight proportionally
  const totalWeight = config.liwcWeight + config.embeddingWeight + adjustedLLMWeight

  const normalizedWeights = {
    liwc: config.liwcWeight / totalWeight,
    embedding: config.embeddingWeight / totalWeight,
    llm: adjustedLLMWeight / totalWeight
  }

  return (
    liwcScore * normalizedWeights.liwc +
    embeddingScore * normalizedWeights.embedding +
    llmScore * normalizedWeights.llm
  )
}
```

### 4.3 Score Interpretation

| Score Range | Interpretation | Profile Display |
|-------------|----------------|-----------------|
| 0.00 - 0.20 | Very Low | Deep Blue |
| 0.20 - 0.40 | Low | Light Blue |
| 0.40 - 0.60 | Moderate | Neutral Gray |
| 0.60 - 0.80 | High | Light Orange |
| 0.80 - 1.00 | Very High | Deep Orange |

---

## 5. Confidence Calibration

### 5.1 Confidence Components

Overall confidence is computed from multiple factors:

```typescript
interface ConfidenceFactors {
  dataVolume: number        // Messages analyzed (0-1)
  signalAgreement: number   // Cross-signal consistency (0-1)
  temporalStability: number // Score stability over time (0-1)
  textQuality: number       // Message length/clarity (0-1)
  llmConfidence: number     // LLM self-reported confidence (0-1)
}

function computeOverallConfidence(factors: ConfidenceFactors): number {
  const weights = {
    dataVolume: 0.25,
    signalAgreement: 0.30,
    temporalStability: 0.20,
    textQuality: 0.10,
    llmConfidence: 0.15
  }

  return Object.entries(weights).reduce((sum, [key, weight]) => {
    return sum + factors[key] * weight
  }, 0)
}
```

### 5.2 Data Volume Thresholds

```typescript
function computeDataVolumeConfidence(messageCount: number): number {
  // Asymptotic curve approaching 1.0
  // 50% confidence at 10 messages
  // 80% confidence at 30 messages
  // 95% confidence at 100 messages
  const k = 0.05 // Growth rate
  return 1 - Math.exp(-k * messageCount)
}
```

| Messages | Confidence | Level |
|----------|------------|-------|
| < 5 | 0.00 - 0.22 | Very Low |
| 5 - 15 | 0.22 - 0.53 | Low |
| 15 - 30 | 0.53 - 0.78 | Moderate |
| 30 - 50 | 0.78 - 0.92 | High |
| > 50 | 0.92 - 1.00 | Very High |

### 5.3 Signal Agreement

```typescript
function computeSignalAgreement(
  liwcScore: number,
  embeddingScore: number,
  llmScore: number
): number {
  const scores = [liwcScore, embeddingScore, llmScore]
  const mean = scores.reduce((a, b) => a + b, 0) / 3

  // Compute variance
  const variance = scores.reduce((sum, s) => {
    return sum + Math.pow(s - mean, 2)
  }, 0) / 3

  // Convert to agreement (lower variance = higher agreement)
  // Max variance is ~0.33 when scores are [0, 0.5, 1]
  const maxVariance = 0.33
  return 1 - (variance / maxVariance)
}
```

---

## 6. Domain Aggregation

### 6.1 Category-Level Aggregation

```typescript
interface CategoryScore {
  category: string
  avgScore: number
  avgConfidence: number
  domainCount: number
  domains: Record<PsychologicalDomain, DomainScore>
}

function aggregateByCategory(
  domainScores: Record<PsychologicalDomain, DomainScore>
): Record<string, CategoryScore> {
  const categories: Record<string, CategoryScore> = {}

  for (const [domainId, score] of Object.entries(domainScores)) {
    const category = getDomainCategory(domainId as PsychologicalDomain)

    if (!categories[category]) {
      categories[category] = {
        category,
        avgScore: 0,
        avgConfidence: 0,
        domainCount: 0,
        domains: {}
      }
    }

    categories[category].domains[domainId] = score
    categories[category].domainCount++
    categories[category].avgScore += score.value
    categories[category].avgConfidence += score.confidence
  }

  // Compute averages
  for (const cat of Object.values(categories)) {
    cat.avgScore /= cat.domainCount
    cat.avgConfidence /= cat.domainCount
  }

  return categories
}
```

### 6.2 Domain Interaction Model

Certain domains have known correlations that should be considered:

```typescript
const DOMAIN_CORRELATIONS: Record<string, Record<string, number>> = {
  // Positive correlations
  'big_five_extraversion': {
    'emotional_empathy': 0.3,
    'social_support': 0.4,
  },
  'big_five_openness': {
    'creativity': 0.5,
    'growth_mindset': 0.3,
    'aesthetic_preferences': 0.4,
  },
  'big_five_conscientiousness': {
    'achievement_motivation': 0.5,
    'self_efficacy': 0.4,
    'executive_functions': 0.4,
  },
  // Negative correlations
  'big_five_neuroticism': {
    'life_satisfaction': -0.5,
    'stress_coping': -0.4,
    'self_efficacy': -0.3,
  },
  'dark_triad_narcissism': {
    'emotional_empathy': -0.4,
    'big_five_agreeableness': -0.5,
  },
}

// Apply correlation constraints for consistency
function applyCorrelationConstraints(
  scores: Record<PsychologicalDomain, number>
): Record<PsychologicalDomain, number> {
  const adjusted = { ...scores }

  for (const [domain1, correlations] of Object.entries(DOMAIN_CORRELATIONS)) {
    for (const [domain2, expectedCorr] of Object.entries(correlations)) {
      const score1 = scores[domain1]
      const score2 = scores[domain2]

      // Check if observed relationship violates expected correlation
      const observedDirection = (score1 - 0.5) * (score2 - 0.5)
      const expectedDirection = expectedCorr

      if (Math.sign(observedDirection) !== Math.sign(expectedDirection)) {
        // Apply soft constraint - move toward expected relationship
        const adjustment = 0.1 * Math.sign(expectedDirection)
        adjusted[domain2] = clamp(adjusted[domain2] + adjustment, 0, 1)
      }
    }
  }

  return adjusted
}
```

---

## 7. Temporal Stability Analysis

### 7.1 Exponential Moving Average

Domain scores are smoothed over time using EMA:

```typescript
interface TemporalScore {
  currentValue: number
  emaValue: number
  lastUpdated: Date
  updateCount: number
}

function updateTemporalScore(
  previous: TemporalScore,
  newValue: number,
  alpha: number = 0.3 // Smoothing factor
): TemporalScore {
  const emaValue = alpha * newValue + (1 - alpha) * previous.emaValue

  return {
    currentValue: newValue,
    emaValue,
    lastUpdated: new Date(),
    updateCount: previous.updateCount + 1
  }
}
```

### 7.2 Stability Metrics

```typescript
interface StabilityMetrics {
  variance: number          // Score variance over time
  coefficientOfVariation: number  // CV = SD / Mean
  trendDirection: 'increasing' | 'stable' | 'decreasing'
  isStable: boolean         // CV < 0.15 for at least 10 updates
}

function computeStability(
  scoreHistory: number[],
  windowSize: number = 10
): StabilityMetrics {
  const window = scoreHistory.slice(-windowSize)

  if (window.length < 3) {
    return { variance: 1, coefficientOfVariation: 1, trendDirection: 'stable', isStable: false }
  }

  const mean = window.reduce((a, b) => a + b, 0) / window.length
  const variance = window.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / window.length
  const sd = Math.sqrt(variance)
  const cv = sd / mean

  // Trend detection using simple linear regression
  const trend = computeLinearTrend(window)
  const trendDirection =
    trend > 0.05 ? 'increasing' :
    trend < -0.05 ? 'decreasing' :
    'stable'

  return {
    variance,
    coefficientOfVariation: cv,
    trendDirection,
    isStable: cv < 0.15 && window.length >= 10
  }
}
```

---

## 8. Implementation Architecture

### 8.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           UI Layer (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ ChatPage     │  │ ProfileDash  │  │ BenchmarkPage│              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼─────────────────┼─────────────────┼───────────────────────┘
          │                 │                 │
┌─────────┼─────────────────┼─────────────────┼───────────────────────┐
│         ▼                 ▼                 ▼   Analysis Layer      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Analysis Orchestrator                      │  │
│  │  (src/lib/analyzer.ts + llm-deep-analyzer.ts)                │  │
│  └──────┬───────────────────┬────────────────────┬──────────────┘  │
│         │                   │                    │                  │
│  ┌──────▼──────┐  ┌─────────▼────────┐  ┌───────▼───────┐         │
│  │ LIWC Engine │  │ Embedding Engine │  │  LLM Engine   │         │
│  │ (liwc.ts)   │  │ (vectordb.ts)    │  │  (llm.ts)     │         │
│  └─────────────┘  └──────────────────┘  └───────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
          │                   │                    │
┌─────────┼───────────────────┼────────────────────┼──────────────────┐
│         ▼                   ▼                    ▼  Storage Layer   │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              IndexedDB (Dexie.js)                              │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐            │ │
│  │  │Messages │ │Profiles │ │Domains  │ │VectorIdx │            │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────┘            │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Key File Locations

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Domain Reference | `src/lib/domain-reference.ts` | 39-domain metadata |
| Analysis Config | `src/lib/analysis-config.ts` | Domain categories, weights |
| LIWC Engine | `src/lib/liwc.ts` | Text analysis |
| Embedding Engine | `src/lib/vectordb.ts` | TinkerBird + BGE-small |
| LLM Engine | `src/lib/llm.ts` | Gemma 3n via MediaPipe |
| Deep Analyzer | `src/lib/llm-deep-analyzer.ts` | LLM domain analysis |
| Profile Storage | `src/lib/db.ts` | Dexie.js schemas |
| Trait Prototypes | `src/lib/trait-prototypes.ts` | Embedding anchors |

### 8.3 Data Flow

```typescript
// Complete analysis flow
async function processMessage(message: Message): Promise<void> {
  // 1. Store message
  await db.messages.add(message)

  // 2. Run three-signal analysis
  const liwcResult = analyzeLIWC(message.content)
  const embedding = await generateEmbedding(message.content)
  await storeMessageEmbedding(message.id, message.content)

  // 3. LLM analysis (if enabled and message is substantive)
  let llmResult = null
  if (message.content.split(' ').length > 20) {
    llmResult = await deepAnalyze(message.content)
  }

  // 4. Hybrid aggregation
  const domainScores = computeHybridScores(liwcResult, embedding, llmResult)

  // 5. Update profile with temporal smoothing
  await updateProfileScores(message.sessionId, domainScores)

  // 6. Recalculate confidence
  await updateConfidenceMetrics(message.sessionId)
}
```

---

## 9. Validation & Testing

### 9.1 Benchmark Suite

The system includes comprehensive benchmarks (Phase 2.5 deliverable):

| Benchmark | Target | Actual |
|-----------|--------|--------|
| Embedding Generation | <100ms | TBD |
| Vector Search (1K) | <50ms | TBD |
| LIWC Analysis | <10ms | TBD |
| LLM Inference | <5s | TBD |
| Full Pipeline | <6s | TBD |

### 9.2 Validation Approaches

1. **Convergent Validity:** Correlate system scores with established questionnaire responses
2. **Discriminant Validity:** Ensure distinct domains show distinct patterns
3. **Test-Retest Reliability:** Measure score stability across sessions
4. **Inter-Signal Agreement:** Track correlation between LIWC, embedding, and LLM signals

### 9.3 Known Ground Truth Testing

```typescript
const GROUND_TRUTH_SAMPLES = [
  {
    text: "I absolutely love trying new restaurants and exploring different cuisines from around the world. Yesterday I discovered this amazing Ethiopian place!",
    expectedDomains: {
      big_five_openness: { min: 0.7, max: 1.0 },
      aesthetic_preferences: { min: 0.6, max: 1.0 }
    }
  },
  {
    text: "I need everything planned out in advance. I make detailed schedules and feel anxious when things don't go according to plan.",
    expectedDomains: {
      big_five_conscientiousness: { min: 0.7, max: 1.0 },
      big_five_neuroticism: { min: 0.5, max: 0.8 }
    }
  },
  // ... more ground truth samples
]
```

---

## 10. Known Limitations

### 10.1 Technical Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| English only | Non-English text ignored | Planned: Multi-language v2.0 |
| Short messages | Low confidence | Require 10+ words |
| LLM latency | 2-5s per message | Async, non-blocking |
| WebGPU required | Old browsers unsupported | Fallback to CPU |

### 10.2 Methodological Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Self-presentation bias | Scores reflect presented, not true self | Note in interpretations |
| Context sensitivity | Scores vary by conversation topic | Temporal smoothing |
| Domain overlap | Some traits correlated | Correlation constraints |
| LIWC word lists | May miss nuanced expressions | Three-signal fusion |

### 10.3 Ethical Considerations

1. **Transparency:** Users see exactly what is being measured
2. **Control:** Users can delete data anytime
3. **No Diagnosis:** System explicitly does not diagnose conditions
4. **Privacy:** All data stays on-device
5. **Consent:** Clear explanation before profiling begins

---

## Appendix A: Domain Configuration Schema

```typescript
interface DomainConfig {
  id: PsychologicalDomain
  name: string
  category: string
  enabled: boolean
  weights: {
    liwc: number
    embedding: number
    llm: number
  }
  thresholds: {
    minConfidence: number
    minDataPoints: number
  }
  display: {
    color: string
    icon: string
    showInProfile: boolean
  }
}
```

## Appendix B: LIWC Category Mapping

See `src/lib/liwc.ts` for complete word lists and category mappings.

## Appendix C: Prototype Texts

See `src/lib/trait-prototypes.ts` for all 390+ prototype texts (10+ per domain).

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2025 | Initial documentation |

---

## References

1. Costa, P.T., & McCrae, R.R. (1992). NEO PI-R Professional Manual.
2. Pennebaker, J.W., et al. (2015). LIWC2015 Development Manual.
3. Schwartz, S.H. (1992). Universals in the content and structure of values.
4. Zimbardo, P.G., & Boyd, J.N. (1999). Putting time in perspective.
5. Dweck, C.S. (2006). Mindset: The new psychology of success.
6. Haidt, J., & Graham, J. (2007). The Moral Foundations Questionnaire.
