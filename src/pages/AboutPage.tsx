/**
 * AboutPage.tsx - Comprehensive System Overview
 *
 * A detailed explanation of how QMU.io works, including the automatic
 * learning pipeline, three-signal analysis, and 39 psychological domains.
 */

import { motion } from 'framer-motion'
import {
  Brain,
  Mic,
  MessageSquare,
  Database,
  GitBranch,
  Sparkles,
  ChevronRight,
  Zap,
  Target,
  Heart,
  Users,
  Lightbulb,
  TrendingUp,
  Lock,
  CheckCircle2
} from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Complete System Overview
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            How QMU.io Works
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Everything you need to understand how QMU.io builds your psychological profile automatically.
          </p>
        </motion.div>

        {/* What Is QMU.io */}
        <Section title="What Is QMU.io?" icon={Brain} delay={0.1}>
          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            QMU.io is a <strong>privacy-first psychological profiling system</strong> that runs entirely in your browser.
            Unlike traditional psychometric tests that use questionnaires, QMU.io uses <strong>inverse profiling</strong> -
            analyzing your natural conversations to build a comprehensive psychological profile across <strong>39 research-backed domains</strong>.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={Lock}
              title="100% Private"
              description="All data stays on your device. Zero server calls. Zero tracking."
            />
            <FeatureCard
              icon={Zap}
              title="Automatic Learning"
              description="Just chat naturally - the system learns about you continuously."
            />
            <FeatureCard
              icon={Target}
              title="Comprehensive"
              description="39 psychological domains from Big Five to cognitive styles."
            />
            <FeatureCard
              icon={Mic}
              title="Multimodal"
              description="Analyzes both text AND voice for richer insights."
            />
            <FeatureCard
              icon={Sparkles}
              title="Adaptive AI"
              description="The assistant adapts its style based on your profile."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Evolution Tracking"
              description="Watch how your profile changes over time."
            />
          </div>
        </Section>

        {/* The Automatic Learning Pipeline */}
        <Section title="The Automatic Learning Pipeline" icon={GitBranch} delay={0.2}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            How Does It Learn About Me?
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Every time you interact with QMU.io, multiple analysis systems work together automatically:
          </p>

          {/* Pipeline Diagram */}
          <div className="bg-gray-900 dark:bg-gray-800 rounded-xl p-6 mb-8 overflow-x-auto">
            <pre className="text-green-400 text-xs md:text-sm font-mono whitespace-pre leading-relaxed">
{`┌─────────────────────────────────────────────────────────────────┐
│                     USER INPUT                                   │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│  │   Text   │  │    Voice     │  │    Context Detection    │   │
│  │ Message  │  │  Recording   │  │ (work/social/intimate)  │   │
│  └────┬─────┘  └──────┬───────┘  └───────────┬─────────────┘   │
└───────┼───────────────┼──────────────────────┼──────────────────┘
        │               │                      │
        ▼               ▼                      ▼
┌───────────────────────────────────────────────────────────────────┐
│                    THREE-SIGNAL ANALYSIS                           │
│                                                                    │
│   ┌────────────────┐ ┌────────────────┐ ┌────────────────────┐   │
│   │  LIWC Signal   │ │ Embedding      │ │   LLM Signal       │   │
│   │    (20%)       │ │ Signal (30%)   │ │     (50%)          │   │
│   │  Word-matching │ │ Semantic       │ │  Deep semantic     │   │
│   │  against psych │ │ similarity to  │ │  analysis via      │   │
│   │  dictionaries  │ │ 39 prototypes  │ │  Gemma 3n          │   │
│   │  ⚡ INSTANT    │ │  🔄 FAST       │ │  🧠 EVERY 5 MSGS  │   │
│   └───────┬────────┘ └───────┬────────┘ └──────────┬─────────┘   │
│           └──────────────────┼─────────────────────┘              │
│                              ▼                                    │
│                   ┌────────────────────┐                          │
│                   │ HYBRID AGGREGATOR  │                          │
│                   │ Weighted Fusion    │                          │
│                   └─────────┬──────────┘                          │
└─────────────────────────────┼─────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE & ADAPTATION                          │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│   │  39 Domain   │  │  Knowledge   │  │  Adaptive Response   │ │
│   │    Scores    │  │    Graph     │  │      Generator       │ │
│   └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Step-by-Step: What Happens When You Send a Message
          </h3>

          <div className="space-y-4">
            <StepCard
              number={1}
              title="You type/speak a message"
              example='"I really enjoyed leading that project meeting yesterday. It was stressful but rewarding."'
            />
            <StepCard
              number={2}
              title="Context Detection"
              example="System recognizes: work context, stressful sub-context"
            />
            <StepCard
              number={3}
              title="Three signals fire simultaneously"
              description="LIWC scans keywords, Embeddings compute semantic similarity, LLM batches for deep analysis"
            />
            <StepCard
              number={4}
              title="Hybrid Aggregation"
              example="final_score = 0.2×LIWC + 0.3×Embedding + 0.5×LLM"
            />
            <StepCard
              number={5}
              title="Storage"
              description="Scores saved to SQL database, relationships added to knowledge graph"
            />
            <StepCard
              number={6}
              title="Adaptation"
              description="Next AI response is tailored to your emerging profile"
            />
          </div>
        </Section>

        {/* The Three Analysis Signals */}
        <Section title="The Three Analysis Signals" icon={Zap} delay={0.3}>
          <div className="space-y-8">
            {/* Signal 1: LIWC */}
            <SignalCard
              title="Signal 1: LIWC Analysis"
              weight="20%"
              speed="Instant"
              color="emerald"
              description="Linguistic Inquiry and Word Count - Fast pattern matching against psychological dictionaries."
              example={`Input: "I'm so excited about this new opportunity!"

"excited" → positive_emotion (+1)
"I'm" → first_person_singular (+1)
"new" → novelty (+1)
"opportunity" → achievement (+1)

Mapped Domains:
• big_five_extraversion: 0.7
• big_five_openness: 0.65
• achievement_motivation: 0.7`}
              catches="Emotional words, pronouns (I/we), certainty language, cognitive complexity markers."
            />

            {/* Signal 2: Embeddings */}
            <SignalCard
              title="Signal 2: Embedding Similarity"
              weight="30%"
              speed="~100ms"
              color="blue"
              description="Semantic similarity using BGE-small-en transformer model."
              example={`Input: "I prefer to plan everything meticulously"

1. Convert input → 384-dimensional vector

2. Compare to 39 prototype vectors:
   Prototype: "I am organized and thorough"
   Similarity: 0.89 → conscientiousness

   Prototype: "I embrace change"
   Similarity: 0.31 → openness

Output: { conscientiousness: 0.89, openness: 0.31 }`}
              catches="Semantic meaning, conceptual similarity, nuanced expressions that keyword matching would miss."
            />

            {/* Signal 3: LLM */}
            <SignalCard
              title="Signal 3: LLM Deep Analysis"
              weight="50%"
              speed="Batched (every 5 msgs)"
              color="purple"
              description="Gemma 3n (running locally via WebGPU) performs deep semantic analysis."
              example={`Input: Last 5 messages accumulated

LLM reasoning:
- User consistently uses structured language
- Shows preference for detailed explanations
- Expresses anxiety about ambiguity
- Values achievement and recognition

Output JSON:
{
  "big_five_conscientiousness": 0.82,
  "big_five_neuroticism": 0.45,
  "achievement_motivation": 0.78,
  "confidence": 0.85
}`}
              catches="Complex patterns, contradictions, implicit traits, reasoning styles, deeper motivations."
            />
          </div>
        </Section>

        {/* Voice Analysis */}
        <Section title="Voice Analysis (Multimodal)" icon={Mic} delay={0.4}>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            When you use voice input, additional prosodic features are extracted:
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Pitch Analysis</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Mean pitch (Hz) → baseline emotional arousal</li>
                <li>• Pitch variability → emotional expressiveness</li>
                <li>• Pitch contour → statement vs. question patterns</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Tempo Analysis</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Speech rate (words/min) → extraversion, anxiety</li>
                <li>• Pause ratio → cognitive load, uncertainty</li>
                <li>• Articulation rate → confidence level</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Energy Analysis</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Loudness mean → dominance, enthusiasm</li>
                <li>• Energy variation → emotional engagement</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Voice Quality</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Jitter (pitch instability) → stress, arousal</li>
                <li>• Shimmer (amplitude instability) → fatigue</li>
                <li>• Harmonic-to-noise ratio → voice clarity</li>
              </ul>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">Domain Mapping Examples</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-indigo-700 dark:text-indigo-400">High speech rate</div>
              <div className="text-gray-600 dark:text-gray-400">→ Extraversion, anxiety</div>
              <div className="text-indigo-700 dark:text-indigo-400">High pitch variability</div>
              <div className="text-gray-600 dark:text-gray-400">→ Emotional expressiveness</div>
              <div className="text-indigo-700 dark:text-indigo-400">Long pauses</div>
              <div className="text-gray-600 dark:text-gray-400">→ Thoughtfulness, uncertainty</div>
              <div className="text-indigo-700 dark:text-indigo-400">High jitter</div>
              <div className="text-gray-600 dark:text-gray-400">→ Stress, emotional arousal</div>
            </div>
          </div>
        </Section>

        {/* Strategic Questioning Engine */}
        <Section title="Strategic Questioning Engine" icon={MessageSquare} delay={0.5}>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            The system doesn't just passively analyze - it <strong>actively guides conversations</strong> to learn more efficiently.
          </p>

          <div className="space-y-6">
            <PhaseCard
              phase={1}
              title="DIAGNOSTIC"
              sessions="Sessions 0-10"
              goal="Establish baseline across all domains"
              questions={[
                "Tell me about a time when you faced a challenge...",
                "How do you typically spend your weekends?",
                "What matters most to you in relationships?"
              ]}
              strategy="Broad, open-ended questions to cast a wide net"
              color="emerald"
            />
            <PhaseCard
              phase={2}
              title="TARGETED"
              sessions="Sessions 11-30"
              goal="Fill gaps in low-confidence domains"
              questions={[
                "How do you handle unexpected changes to your plans?",
                "When you're stressed, what does that look like for you?",
                "How long does it take you to recover from setbacks?"
              ]}
              strategy="Probe specific domains needing more data"
              color="blue"
            />
            <PhaseCard
              phase={3}
              title="VALIDATION"
              sessions="Sessions 31+"
              goal="Verify and refine existing profile"
              questions={[
                "You mentioned enjoying leadership - does that extend to social situations?",
                "I noticed you value efficiency - how does that affect personal relationships?"
              ]}
              strategy="Cross-validate and find nuances/contradictions"
              color="purple"
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400 mt-6 text-sm italic">
            The AI naturally weaves these questions into conversation - you won't feel like you're taking a test.
          </p>
        </Section>

        {/* 39 Psychological Domains */}
        <Section title="39 Psychological Domains" icon={Brain} delay={0.6}>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Organized into 8 research-backed categories:
          </p>

          <div className="space-y-6">
            <DomainCategory
              category="A"
              title="Core Personality (Big Five)"
              source="NEO-FFI Based"
              domains={[
                { id: 'big_five_openness', name: 'Openness', desc: 'Curiosity, creativity, preference for novelty' },
                { id: 'big_five_conscientiousness', name: 'Conscientiousness', desc: 'Organization, dependability, self-discipline' },
                { id: 'big_five_extraversion', name: 'Extraversion', desc: 'Sociability, assertiveness, positive emotions' },
                { id: 'big_five_agreeableness', name: 'Agreeableness', desc: 'Cooperation, trust, empathy' },
                { id: 'big_five_neuroticism', name: 'Neuroticism', desc: 'Emotional instability, anxiety, moodiness' },
              ]}
            />
            <DomainCategory
              category="B"
              title="Dark Personality"
              source="SD3 Based"
              domains={[
                { id: 'dark_triad_narcissism', name: 'Narcissism', desc: 'Grandiosity, need for admiration' },
                { id: 'dark_triad_machiavellianism', name: 'Machiavellianism', desc: 'Strategic manipulation, cynicism' },
                { id: 'dark_triad_psychopathy', name: 'Psychopathy', desc: 'Impulsivity, callousness, thrill-seeking' },
              ]}
            />
            <DomainCategory
              category="C"
              title="Emotional Intelligence"
              source="EQ/MSCEIT Based"
              domains={[
                { id: 'emotional_empathy', name: 'Empathy', desc: 'Ability to understand others\' feelings' },
                { id: 'emotional_intelligence', name: 'EQ', desc: 'Emotional perception, regulation, use' },
                { id: 'attachment_style', name: 'Attachment', desc: 'Secure, anxious, avoidant patterns' },
                { id: 'love_languages', name: 'Love Languages', desc: 'How you give/receive love' },
                { id: 'communication_style', name: 'Communication', desc: 'DISC-based interaction patterns' },
              ]}
            />
            <DomainCategory
              category="D"
              title="Decision Making & Motivation"
              source="Various"
              domains={[
                { id: 'risk_tolerance', name: 'Risk Tolerance', desc: 'Comfort with uncertainty and risk' },
                { id: 'decision_style', name: 'Decision Style', desc: 'Rational vs. intuitive processing' },
                { id: 'time_orientation', name: 'Time Orientation', desc: 'Past, present, or future focus' },
                { id: 'achievement_motivation', name: 'Achievement', desc: 'Need for accomplishment' },
                { id: 'self_efficacy', name: 'Self-Efficacy', desc: 'Belief in your capabilities' },
                { id: 'locus_of_control', name: 'Locus of Control', desc: 'Internal vs. external attribution' },
                { id: 'growth_mindset', name: 'Growth Mindset', desc: 'Fixed vs. growth beliefs' },
              ]}
            />
            <DomainCategory
              category="E"
              title="Values & Wellbeing"
              source="Schwartz PVQ Based"
              domains={[
                { id: 'personal_values', name: 'Values', desc: 'Core value priorities' },
                { id: 'interests', name: 'Interests', desc: 'RIASEC career/interest types' },
                { id: 'life_satisfaction', name: 'Life Satisfaction', desc: 'Overall wellbeing assessment' },
                { id: 'stress_coping', name: 'Stress Coping', desc: 'Coping strategy preferences' },
                { id: 'social_support', name: 'Social Support', desc: 'Perceived support network' },
                { id: 'authenticity', name: 'Authenticity', desc: 'Alignment between true/presented self' },
              ]}
            />
            <DomainCategory
              category="F"
              title="Cognitive & Learning"
              source="Various"
              domains={[
                { id: 'cognitive_abilities', name: 'Cognitive Style', desc: 'Verbal, numerical, spatial preferences' },
                { id: 'creativity', name: 'Creativity', desc: 'Divergent thinking, originality' },
                { id: 'learning_styles', name: 'Learning Styles', desc: 'VARK preferences' },
                { id: 'information_processing', name: 'Info Processing', desc: 'Deep vs. shallow processing' },
                { id: 'metacognition', name: 'Metacognition', desc: 'Awareness of own thinking' },
                { id: 'executive_functions', name: 'Executive Functions', desc: 'Planning, inhibition, flexibility' },
              ]}
            />
            <DomainCategory
              category="G"
              title="Social & Cultural"
              source="Various"
              domains={[
                { id: 'social_cognition', name: 'Social Cognition', desc: 'Theory of mind, social perception' },
                { id: 'political_ideology', name: 'Political Values', desc: 'Political orientation' },
                { id: 'cultural_values', name: 'Cultural Values', desc: 'Hofstede cultural dimensions' },
                { id: 'moral_reasoning', name: 'Moral Reasoning', desc: 'Moral foundations preferences' },
                { id: 'work_career_style', name: 'Career Style', desc: 'Career anchors, work values' },
              ]}
            />
            <DomainCategory
              category="H"
              title="Sensory & Aesthetic"
              source="Various"
              domains={[
                { id: 'sensory_processing', name: 'Sensory Sensitivity', desc: 'HSP-based sensitivity' },
                { id: 'aesthetic_preferences', name: 'Aesthetic Preferences', desc: 'Art, beauty, design preferences' },
              ]}
            />
          </div>
        </Section>

        {/* Context-Aware Profiling */}
        <Section title="Context-Aware Profiling" icon={Users} delay={0.7}>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Your personality isn't static - you act differently in different contexts. QMU.io tracks this:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {['work', 'social', 'intimate', 'creative', 'stressful', 'leisure', 'intellectual', 'physical', 'spiritual', 'financial'].map((ctx) => (
              <div key={ctx} className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{ctx}</span>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Example Output</h4>
            <code className="text-sm text-amber-700 dark:text-amber-400 block mb-2">
              big_five_extraversion@work: 0.8<br />
              big_five_extraversion@intimate: 0.4
            </code>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              → "You're more outgoing at work than in intimate settings"
            </p>
          </div>
        </Section>

        {/* Emotion Detection */}
        <Section title="Real-Time Emotion Detection" icon={Heart} delay={0.8}>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Using Russell's Circumplex Model, QMU.io maps your emotional state in 2D space:
          </p>

          {/* Circumplex Diagram */}
          <div className="bg-gray-900 dark:bg-gray-800 rounded-xl p-6 mb-6 overflow-x-auto">
            <pre className="text-green-400 text-xs md:text-sm font-mono whitespace-pre text-center">
{`                    High Arousal
                         │
         STRESSED ───────┼─────── EXCITED
         ANXIOUS         │         HAPPY
         ANGRY           │         ELATED
                         │
 Negative ───────────────┼─────────────── Positive
 Valence                 │               Valence
                         │
         SAD ────────────┼─────── CONTENT
         DEPRESSED       │         CALM
         BORED           │         RELAXED
                         │
                    Low Arousal`}
            </pre>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <h5 className="font-semibold text-green-800 dark:text-green-300 mb-2">Q1: High Arousal + Positive</h5>
              <p className="text-sm text-green-700 dark:text-green-400">Happy, Excited, Elated</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <h5 className="font-semibold text-red-800 dark:text-red-300 mb-2">Q2: High Arousal + Negative</h5>
              <p className="text-sm text-red-700 dark:text-red-400">Angry, Anxious, Stressed, Frustrated, Fearful</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Q3: Low Arousal + Negative</h5>
              <p className="text-sm text-blue-700 dark:text-blue-400">Sad, Depressed, Bored, Tired</p>
            </div>
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
              <h5 className="font-semibold text-teal-800 dark:text-teal-300 mb-2">Q4: Low Arousal + Positive</h5>
              <p className="text-sm text-teal-700 dark:text-teal-400">Content, Calm, Relaxed, Serene</p>
            </div>
          </div>
        </Section>

        {/* Data Architecture */}
        <Section title="Data Architecture" icon={Database} delay={0.9}>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Four specialized databases, ALL running locally in your browser:
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <DatabaseCard
              name="IndexedDB (Dexie)"
              items={['Messages', 'Sessions', 'Activity logs', 'User prefs']}
              color="blue"
            />
            <DatabaseCard
              name="SQL.js (SQLite WASM)"
              items={['Domain scores', 'Feature counts', 'Signal history', 'Emotions']}
              color="emerald"
            />
            <DatabaseCard
              name="LevelGraph (Knowledge DB)"
              items={['Trait links', 'Causal chains', 'Context relations']}
              color="purple"
            />
            <DatabaseCard
              name="TinkerBird (Vector DB)"
              items={['Embeddings', 'Semantic search']}
              color="amber"
            />
          </div>

          <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-xl p-4 flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              ZERO DATA LEAVES YOUR DEVICE
            </span>
          </div>
        </Section>

        {/* Comparison Table */}
        <Section title="Why This Matters" icon={Lightbulb} delay={1.0}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Traditional Assessment vs. QMU.io
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Aspect</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Traditional Tests</th>
                  <th className="px-4 py-3 text-left font-semibold text-indigo-600 dark:text-indigo-400">QMU.io</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <ComparisonRow aspect="Data Collection" traditional="One-time questionnaire" qmuio="Continuous conversation" />
                <ComparisonRow aspect="Privacy" traditional="Data sent to servers" qmuio="100% local processing" />
                <ComparisonRow aspect="Domains" traditional="Usually 5-10 traits" qmuio="39 comprehensive domains" />
                <ComparisonRow aspect="Context" traditional="Static snapshot" qmuio="Context-aware (10 contexts)" />
                <ComparisonRow aspect="Adaptation" traditional="None" qmuio="AI adapts to your profile" />
                <ComparisonRow aspect="Multimodal" traditional="Text only" qmuio="Text + Voice analysis" />
                <ComparisonRow aspect="Cost" traditional="Often $50-200" qmuio="Free, open source" />
                <ComparisonRow aspect="Evolution" traditional="Point-in-time" qmuio="Tracks changes over time" />
              </tbody>
            </table>
          </div>
        </Section>

        {/* Quick Start */}
        <Section title="Quick Start" icon={Sparkles} delay={1.1}>
          <div className="grid md:grid-cols-2 gap-4">
            <QuickStartStep number={1} text="Visit the app → All processing is local, no sign-up required" />
            <QuickStartStep number={2} text="Start chatting → Just have natural conversations" />
            <QuickStartStep number={3} text="Watch your profile build → View the Profile Dashboard" />
            <QuickStartStep number={4} text="Optional: Enable voice → Get richer multimodal insights" />
          </div>
        </Section>

        {/* Technical Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-12 p-6 bg-gray-100 dark:bg-gray-800 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Technical Requirements</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">Browser: Chrome 113+ or Edge 113+ (WebGPU)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">RAM: ~4GB recommended for LLM</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">First Load: ~2.5GB model download (cached)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">Storage: ~50MB for your data</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Sub-components

function Section({ title, icon: Icon, children, delay = 0 }: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="mb-16"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </motion.section>
  )
}

function FeatureCard({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <Icon className="w-5 h-5 text-indigo-500 mb-2" />
      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{title}</h4>
      <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}

function StepCard({ number, title, example, description }: {
  number: number
  title: string
  example?: string
  description?: string
}) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{number}</span>
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h4>
        {example && (
          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 font-mono">
            {example}
          </p>
        )}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </div>
    </div>
  )
}

function SignalCard({ title, weight, speed, color, description, example, catches }: {
  title: string
  weight: string
  speed: string
  color: 'emerald' | 'blue' | 'purple'
  description: string
  example: string
  catches: string
}) {
  const colorClasses = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  }

  return (
    <div className={`rounded-xl p-6 border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
        <div className="flex gap-2">
          <span className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800 rounded">{weight}</span>
          <span className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800 rounded">{speed}</span>
        </div>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{description}</p>
      <pre className="text-xs bg-gray-900 dark:bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto mb-4">
        {example}
      </pre>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        <strong>What it catches:</strong> {catches}
      </p>
    </div>
  )
}

function PhaseCard({ phase, title, sessions, goal, questions, strategy, color }: {
  phase: number
  title: string
  sessions: string
  goal: string
  questions: string[]
  strategy: string
  color: 'emerald' | 'blue' | 'purple'
}) {
  const colorClasses = {
    emerald: 'border-l-emerald-500',
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl font-bold text-gray-300 dark:text-gray-600">Phase {phase}</span>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
          <p className="text-xs text-gray-500">{sessions}</p>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Goal: {goal}</p>
      <div className="space-y-2 mb-3">
        {questions.map((q, i) => (
          <div key={i} className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{q}"</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-500">
        <strong>Strategy:</strong> {strategy}
      </p>
    </div>
  )
}

function DomainCategory({ category, title, source, domains }: {
  category: string
  title: string
  source: string
  domains: { id: string; name: string; desc: string }[]
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-900 dark:text-white">
            Category {category}: {title}
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">{source}</span>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {domains.map((d) => (
          <div key={d.id} className="px-5 py-3 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{d.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{d.desc}</p>
            </div>
            <code className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded flex-shrink-0">
              {d.id}
            </code>
          </div>
        ))}
      </div>
    </div>
  )
}

function DatabaseCard({ name, items, color }: {
  name: string
  items: string[]
  color: 'blue' | 'emerald' | 'purple' | 'amber'
}) {
  const colorClasses = {
    blue: 'border-l-blue-500',
    emerald: 'border-l-emerald-500',
    purple: 'border-l-purple-500',
    amber: 'border-l-amber-500',
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 border-l-4 ${colorClasses[color]}`}>
      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{name}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <span className="w-1 h-1 bg-gray-400 rounded-full" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ComparisonRow({ aspect, traditional, qmuio }: {
  aspect: string
  traditional: string
  qmuio: string
}) {
  return (
    <tr>
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{aspect}</td>
      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{traditional}</td>
      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-medium">{qmuio}</td>
    </tr>
  )
}

function QuickStartStep({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{number}</span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">{text}</p>
    </div>
  )
}
