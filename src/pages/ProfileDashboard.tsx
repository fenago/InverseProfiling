import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  BookOpen,
  RefreshCw,
  Database,
  X,
  ChevronDown,
  Sparkles,
  Gauge,
  Activity,
  Target,
  History,
  Eye,
  Layers,
  CircleDot,
  HardDrive,
  Network,
  FileText,
  Zap,
  Calculator,
  BarChart3,
  Heart,
} from 'lucide-react'
import { db, getOrCreateProfile, type UserProfile } from '../lib/db'
import {
  getPersonalityTraits,
  updatePersonalityProfile,
  getTraitDescription,
  type TraitName,
} from '../lib/personality'
import { getAggregateAnalysis, type AnalysisResult } from '../lib/analyzer'
import type { PersonalityTrait } from '../lib/db'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/theme'
import { AdvancedVisualization } from '../components/AdvancedVisualization'
import { DOMAIN_CATEGORIES, type PsychologicalDomain } from '../lib/analysis-config'

// Domain Reference Type
interface VoiceIndicator {
  feature: string
  high: string
  low: string
  weight: number
}

interface DomainReference {
  id: string
  name: string
  category: string
  description: string
  psychometricSource: string
  markers: string[]
  dataPoints: Array<{
    feature: string
    high?: string
    low?: string
    indicator?: string
    growth?: string
    fixed?: string
    conservative?: string
    liberal?: string
  }>
  voiceIndicators?: VoiceIndicator[]
}

// Phase 2 imports
import { getEnhancedProfileSummary } from '../lib/enhanced-analyzer'
import {
  analyzeAllTrends,
  analyzeProfileEvolution,
  getHistoricalStats,
  getDomainHistory,
  type TrendAnalysis,
  type ProfileEvolution,
} from '../lib/history'
import {
  getDomainScores,
  getFeatureCounts,
  getBehavioralMetrics,
  getAllMatchedWords,
  getHybridSignalsForDomain,
  getAllHybridSignals,
  type HybridSignalScore,
} from '../lib/sqldb'
import { getVectorStats, getAllEmbeddings } from '../lib/vectordb'
import {
  getGraphStats,
  getGraphVisualizationData,
  getTriplesByCategory,
  getAllTriples,
  type Triple,
  PREDICATES,
} from '../lib/graphdb'
import AnimatedGraphVisualization from '../components/AnimatedGraphVisualization'

// Domain Reference Data - All 39 psychological domains
// IDs match PSYCHOLOGICAL_DOMAINS from analysis-config.ts exactly
const DOMAIN_REFERENCE: DomainReference[] = [
  // === Category A: Core Personality - Big Five (Domains 1-5) ===
  {
    id: 'big_five_openness',
    name: 'Openness to Experience',
    category: 'personality',
    description: 'Reflects intellectual curiosity, creativity, and preference for novelty and variety. High scorers are imaginative, artistic, and open to new experiences.',
    psychometricSource: 'Big Five / NEO-PI-R (Costa & McCrae, 1992)',
    markers: ['Lexical diversity', 'Insight words', 'Abstract language', 'Perceptual words', 'Creative references'],
    dataPoints: [
      { feature: 'Word variety (TTR)', high: 'Higher type-token ratio', low: 'Lower type-token ratio' },
      { feature: 'Articles', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Insight words', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Tentative words', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Certainty words', high: 'Less frequent', low: 'More frequent' },
    ],
  },
  {
    id: 'big_five_conscientiousness',
    name: 'Conscientiousness',
    category: 'personality',
    description: 'Reflects self-discipline, organization, and goal-directed behavior. High scorers are reliable, hardworking, and achievement-oriented.',
    psychometricSource: 'Big Five / NEO-PI-R (Costa & McCrae, 1992)',
    markers: ['Achievement words', 'Work vocabulary', 'Future tense', 'Negations', 'Organizational language'],
    dataPoints: [
      { feature: 'Achievement words', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Work words', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Future focus', high: 'Higher', low: 'Lower' },
      { feature: 'Negations', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Fillers (um, uh)', high: 'Less frequent', low: 'More frequent' },
    ],
    voiceIndicators: [
      { feature: 'Pause Ratio', high: 'Higher (more deliberate)', low: 'Lower (rushed speech)', weight: 0.4 },
      { feature: 'Silence Duration', high: 'More listening time', low: 'Less listening time', weight: 0.3 },
      { feature: 'Speech Rate', high: 'Slower (measured)', low: 'Faster', weight: -0.2 },
    ],
  },
  {
    id: 'big_five_extraversion',
    name: 'Extraversion',
    category: 'personality',
    description: 'Reflects sociability, assertiveness, and positive emotionality. High scorers are outgoing, energetic, and seek stimulation from others.',
    psychometricSource: 'Big Five / NEO-PI-R (Costa & McCrae, 1992)',
    markers: ['Social process words', 'Positive emotions', '1st-person plural', 'Word count', 'Exclamations'],
    dataPoints: [
      { feature: 'Social words', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Positive emotion', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Word count', high: 'Higher', low: 'Lower' },
      { feature: '1st person plural', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Questions asked', high: 'More frequent', low: 'Less frequent' },
    ],
    voiceIndicators: [
      { feature: 'Pitch Mean', high: 'Higher fundamental frequency', low: 'Lower pitch', weight: 0.3 },
      { feature: 'Pitch Std Dev', high: 'More pitch variation', low: 'Monotone', weight: 0.4 },
      { feature: 'Pitch Range', high: 'Wider expressive range', low: 'Narrow range', weight: 0.35 },
      { feature: 'Speech Rate', high: 'Faster speaking pace', low: 'Slower', weight: 0.5 },
      { feature: 'Articulation Rate', high: 'Rapid articulation', low: 'Slower', weight: 0.4 },
      { feature: 'Energy Mean', high: 'Louder, more energetic', low: 'Quieter', weight: 0.5 },
      { feature: 'Energy Range', high: 'More dynamic range', low: 'Flat volume', weight: 0.35 },
      { feature: 'Speaking Duration', high: 'Longer speaking turns', low: 'Shorter', weight: 0.4 },
      { feature: 'Pause Ratio', high: 'Fewer pauses', low: 'More pauses', weight: -0.3 },
      { feature: 'Turn-Taking Speed', high: 'Quick responses', low: 'Slower', weight: 0.4 },
    ],
  },
  {
    id: 'big_five_agreeableness',
    name: 'Agreeableness',
    category: 'personality',
    description: 'Reflects cooperativeness, trust, and concern for social harmony. High scorers are warm, friendly, and considerate of others.',
    psychometricSource: 'Big Five / NEO-PI-R (Costa & McCrae, 1992)',
    markers: ['Affiliation words', 'Positive emotions', 'Assent words', 'Family/friend refs', 'Politeness'],
    dataPoints: [
      { feature: 'Positive emotion', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Negative emotion', high: 'Less frequent', low: 'More frequent' },
      { feature: 'Swear words', high: 'Less frequent', low: 'More frequent' },
      { feature: 'Affiliation words', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Anger words', high: 'Less frequent', low: 'More frequent' },
    ],
    voiceIndicators: [
      { feature: 'Silence Duration', high: 'More listening time', low: 'Less listening', weight: 0.2 },
      { feature: 'Turn-Taking Speed', high: 'Slower (patient)', low: 'Quick interruption', weight: -0.2 },
    ],
  },
  {
    id: 'big_five_neuroticism',
    name: 'Neuroticism',
    category: 'personality',
    description: 'Reflects emotional instability and tendency to experience negative emotions. High scorers are more prone to anxiety, depression, and stress.',
    psychometricSource: 'Big Five / NEO-PI-R (Costa & McCrae, 1992)',
    markers: ['Negative emotions', '1st-person singular', 'Certainty language', 'Health references', 'Death references'],
    dataPoints: [
      { feature: 'Negative emotion', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Anxiety words', high: 'More frequent', low: 'Less frequent' },
      { feature: '1st person singular', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Tentative words', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Health words', high: 'More frequent', low: 'Less frequent' },
    ],
    voiceIndicators: [
      { feature: 'Jitter', high: 'Higher (voice tremor)', low: 'Stable pitch', weight: 0.4 },
      { feature: 'Shimmer', high: 'Higher (amplitude variation)', low: 'Stable amplitude', weight: 0.35 },
      { feature: 'Pitch Std Dev', high: 'More pitch variation', low: 'Stable', weight: 0.3 },
      { feature: 'Energy Std Dev', high: 'Unstable energy', low: 'Stable energy', weight: 0.25 },
      { feature: 'Avg Pause Length', high: 'Longer hesitations', low: 'Shorter pauses', weight: 0.2 },
      { feature: 'Pitch Mean', high: 'Higher (tense voice)', low: 'Lower', weight: 0.2 },
    ],
  },

  // === Category B: Dark Personality (Domains 6-8) ===
  {
    id: 'dark_triad_narcissism',
    name: 'Narcissism',
    category: 'dark_personality',
    description: 'Reflects grandiosity, entitlement, and need for admiration. High scorers have inflated self-views and expect special treatment.',
    psychometricSource: 'NPI (Narcissistic Personality Inventory)',
    markers: ['Self-focus pronouns', 'Superiority language', 'Entitlement expressions', 'Status/prestige words'],
    dataPoints: [
      { feature: '1st person singular', high: 'More frequent', low: 'Less frequent' },
      { feature: 'Superiority words', indicator: 'Best, superior, exceptional, special' },
      { feature: 'Entitlement', indicator: 'Deserve, entitled, should have' },
      { feature: 'Status references', indicator: 'Success, achievement, recognition' },
    ],
    voiceIndicators: [
      { feature: 'Energy Mean', high: 'Louder, dominant', low: 'Quieter', weight: 0.2 },
      { feature: 'Speaking Duration', high: 'Longer turns (dominates)', low: 'Shorter', weight: 0.2 },
    ],
  },
  {
    id: 'dark_triad_machiavellianism',
    name: 'Machiavellianism',
    category: 'dark_personality',
    description: 'Reflects strategic manipulation and cynical worldview. High scorers prioritize self-interest and use calculated tactics.',
    psychometricSource: 'MACH-IV Scale',
    markers: ['Strategic language', 'Manipulation cues', 'Cynicism markers', 'Self-interest focus'],
    dataPoints: [
      { feature: 'Strategic thinking', indicator: 'Plan, strategy, tactics, leverage' },
      { feature: 'Manipulation', indicator: 'Persuade, influence, control, use' },
      { feature: 'Cynicism', indicator: 'Distrust, ulterior motives, skeptical' },
      { feature: 'Self-interest', indicator: 'Advantage, benefit me, my gain' },
    ],
  },
  {
    id: 'dark_triad_psychopathy',
    name: 'Psychopathy',
    category: 'dark_personality',
    description: 'Reflects callousness, impulsivity, and lack of remorse. High scorers show reduced empathy and emotional detachment.',
    psychometricSource: 'Levenson Self-Report Psychopathy Scale',
    markers: ['Emotional coldness', 'Impulsivity markers', 'Low empathy language', 'Rule-breaking references'],
    dataPoints: [
      { feature: 'Emotional detachment', indicator: 'Doesn\'t matter, who cares, indifferent' },
      { feature: 'Impulsivity', indicator: 'Now, immediately, can\'t wait, spontaneous' },
      { feature: 'Low empathy', indicator: 'Absence of concern for others\' feelings' },
      { feature: 'Rule violations', indicator: 'Rules are..., exceptions, don\'t apply' },
    ],
  },

  // === Category C: Emotional/Social Intelligence (Domains 9-13) ===
  {
    id: 'emotional_empathy',
    name: 'Empathy',
    category: 'emotional',
    description: 'Reflects ability to share and understand others\' emotional states. High scorers easily connect with others\' feelings.',
    psychometricSource: 'Empathy Quotient (EQ) - Baron-Cohen',
    markers: ['Perspective-taking', 'Emotional mirroring', 'Compassion language', 'Social sensitivity'],
    dataPoints: [
      { feature: 'Perspective words', indicator: 'Understand, feel for, imagine how' },
      { feature: 'Compassion', indicator: 'Sorry for, sympathize, heart goes out' },
      { feature: 'Emotional sharing', indicator: 'Feel the same, share your...' },
      { feature: 'Other-focus', indicator: 'You must feel, they probably...' },
    ],
    voiceIndicators: [
      { feature: 'Pitch Std Dev', high: 'More expressive variation', low: 'Flat', weight: 0.3 },
      { feature: 'Energy Std Dev', high: 'Dynamic energy (responsive)', low: 'Monotone', weight: 0.3 },
    ],
  },
  {
    id: 'emotional_intelligence',
    name: 'Emotional Intelligence',
    category: 'emotional',
    description: 'Reflects ability to perceive, understand, manage, and use emotions effectively. Includes self-awareness, empathy, and social skills.',
    psychometricSource: 'MSCEIT (Mayer-Salovey-Caruso)',
    markers: ['Emotion word diversity', 'Emotion specificity', 'Social awareness', 'Empathy expressions', 'Emotion regulation'],
    dataPoints: [
      { feature: 'Self-awareness', indicator: 'Emotion vocabulary diversity, insight words' },
      { feature: 'Self-regulation', indicator: 'Inhibition words, future-focused language' },
      { feature: 'Motivation', indicator: 'Achievement words, drive words' },
      { feature: 'Empathy', indicator: '2nd person pronouns, social process words' },
      { feature: 'Social skills', indicator: 'Affiliation words, positive emotion, politeness' },
    ],
    voiceIndicators: [
      { feature: 'Pitch Mean', high: 'Appropriate modulation', low: 'Tense/flat', weight: 0.2 },
      { feature: 'Pitch Range', high: 'Wider expressiveness', low: 'Narrow', weight: 0.25 },
      { feature: 'Energy Std Dev', high: 'Responsive variation', low: 'Monotone', weight: 0.3 },
      { feature: 'Energy Range', high: 'Dynamic range', low: 'Flat volume', weight: 0.25 },
      { feature: 'Harmonic-to-Noise Ratio', high: 'Clear voice quality', low: 'Strained', weight: 0.3 },
      { feature: 'Jitter', high: 'Lower (stable)', low: 'Higher (unstable)', weight: -0.2 },
    ],
  },
  {
    id: 'attachment_style',
    name: 'Attachment Style',
    category: 'emotional',
    description: 'Reflects patterns of relating to others based on early bonding experiences. Influences trust, intimacy, and relationship behaviors.',
    psychometricSource: 'ECR-R (Experiences in Close Relationships)',
    markers: ['Relationship vocabulary', 'Proximity-seeking', 'Trust/intimacy words', 'Social network refs'],
    dataPoints: [
      { feature: 'Secure', indicator: 'Balanced self/other, positive social, trust' },
      { feature: 'Anxious', indicator: 'High 1st person, relationship worry' },
      { feature: 'Avoidant', indicator: 'Low intimacy words, distancing' },
      { feature: 'Fearful', indicator: 'Inconsistent, approach-avoidance' },
    ],
  },
  {
    id: 'love_languages',
    name: 'Love Languages',
    category: 'emotional',
    description: 'Reflects preferred ways of expressing and receiving love. Based on five distinct love languages.',
    psychometricSource: '5 Love Languages (Chapman)',
    markers: ['Affirmation words', 'Time references', 'Service language', 'Touch words', 'Gift references'],
    dataPoints: [
      { feature: 'Words of Affirmation', indicator: 'Compliments, appreciation, verbal support' },
      { feature: 'Quality Time', indicator: 'Together, attention, focus, presence' },
      { feature: 'Acts of Service', indicator: 'Help, do for, take care of' },
      { feature: 'Physical Touch', indicator: 'Hug, hold, touch, physical closeness' },
      { feature: 'Receiving Gifts', indicator: 'Gift, present, surprise, thoughtful' },
    ],
  },
  {
    id: 'communication_style',
    name: 'Communication Style',
    category: 'behavioral',
    description: 'Reflects patterns of verbal and written expression. Includes directness, formality, assertiveness, and expressiveness.',
    psychometricSource: 'DISC Assessment',
    markers: ['Directness level', 'Formality markers', 'Assertiveness', 'Listening cues'],
    dataPoints: [
      { feature: 'Dominant (D)', indicator: 'Direct, results-oriented, decisive' },
      { feature: 'Influential (I)', indicator: 'Enthusiastic, collaborative, optimistic' },
      { feature: 'Steady (S)', indicator: 'Patient, reliable, team-oriented' },
      { feature: 'Conscientious (C)', indicator: 'Analytical, precise, systematic' },
    ],
    voiceIndicators: [
      { feature: 'Pitch Range', high: 'Wider expressiveness', low: 'Narrow', weight: 0.2 },
      { feature: 'Energy Range', high: 'More dynamic', low: 'Flat', weight: 0.2 },
    ],
  },

  // === Category D: Decision Making & Motivation (Domains 14-20) ===
  {
    id: 'risk_tolerance',
    name: 'Risk Tolerance',
    category: 'behavioral',
    description: 'Reflects willingness to accept uncertainty for potential gains. Varies across financial, physical, and social domains.',
    psychometricSource: 'DOSPERT (Domain-Specific Risk-Taking)',
    markers: ['Risk vocabulary', 'Uncertainty language', 'Caution vs boldness', 'Probability references'],
    dataPoints: [
      { feature: 'Risk-seeking', indicator: 'Chance, bet, gamble, opportunity' },
      { feature: 'Risk-averse', indicator: 'Safe, certain, guaranteed, secure' },
      { feature: 'Uncertainty tolerance', indicator: 'Maybe, could be, possible' },
      { feature: 'Domain specificity', indicator: 'Financial vs physical vs social' },
    ],
  },
  {
    id: 'decision_style',
    name: 'Decision Style',
    category: 'behavioral',
    description: 'Reflects how people approach choices and make decisions. Includes rational, intuitive, and social decision-making styles.',
    psychometricSource: 'General Decision Making Style (GDMS)',
    markers: ['Deliberation language', 'Intuition references', 'Risk vocabulary', 'Temporal orientation'],
    dataPoints: [
      { feature: 'Rational', indicator: 'Cause/effect, analytical, comparison' },
      { feature: 'Intuitive', indicator: 'Feeling words, gut references' },
      { feature: 'Dependent', indicator: 'Social reference, advice-seeking' },
      { feature: 'Avoidant', indicator: 'Delay words, uncertainty, hedging' },
      { feature: 'Spontaneous', indicator: 'Present focus, urgency' },
    ],
    voiceIndicators: [
      { feature: 'Speech Rate', high: 'Faster (impulsive)', low: 'Slower (deliberate)', weight: 0.3 },
      { feature: 'Pause Ratio', high: 'Fewer pauses', low: 'More pauses (thinking)', weight: -0.3 },
      { feature: 'Turn-Taking Speed', high: 'Quick responses', low: 'Slower (consideration)', weight: 0.3 },
    ],
  },
  {
    id: 'time_orientation',
    name: 'Time Orientation',
    category: 'temporal',
    description: 'Reflects how people mentally frame time and its influence on decisions. Includes past, present, and future orientations.',
    psychometricSource: 'Zimbardo Time Perspective Inventory (ZTPI)',
    markers: ['Temporal references', 'Verb tense usage', 'Planning vs spontaneity'],
    dataPoints: [
      { feature: 'Past-Negative', indicator: 'Regret, should have, if only' },
      { feature: 'Past-Positive', indicator: 'Nostalgia, good times, memories' },
      { feature: 'Present-Hedonistic', indicator: 'Now, enjoy, pleasure, YOLO' },
      { feature: 'Present-Fatalistic', indicator: 'Fate, destiny, no control' },
      { feature: 'Future', indicator: 'Will, plan, goal, going to' },
    ],
    voiceIndicators: [
      { feature: 'Speech Rate', high: 'Faster (urgency)', low: 'Slower', weight: 0.2 },
    ],
  },
  {
    id: 'achievement_motivation',
    name: 'Achievement Motivation',
    category: 'motivation',
    description: 'Reflects drive to accomplish challenging goals and excel. High scorers are ambitious and goal-oriented.',
    psychometricSource: 'nAch (Need for Achievement) - McClelland',
    markers: ['Achievement words', 'Goal language', 'Success references', 'Competition markers'],
    dataPoints: [
      { feature: 'Goal-setting', indicator: 'Goal, objective, target, aim' },
      { feature: 'Success drive', indicator: 'Achieve, accomplish, succeed, win' },
      { feature: 'Challenge-seeking', indicator: 'Challenge, difficult, ambitious' },
      { feature: 'Excellence focus', indicator: 'Best, excellent, outstanding, superior' },
    ],
    voiceIndicators: [
      { feature: 'Energy Mean', high: 'Louder, energetic', low: 'Quieter', weight: 0.3 },
    ],
  },
  {
    id: 'self_efficacy',
    name: 'Self-Efficacy',
    category: 'motivation',
    description: 'Reflects belief in one\'s ability to succeed in specific situations. High scorers are confident in their capabilities.',
    psychometricSource: 'General Self-Efficacy Scale (GSE)',
    markers: ['Confidence language', 'Capability words', 'Can-do statements', 'Control references'],
    dataPoints: [
      { feature: 'Confidence', indicator: 'I can, I\'m able, I\'ll manage' },
      { feature: 'Capability', indicator: 'Capable, competent, skilled, able' },
      { feature: 'Control', indicator: 'Handle, manage, overcome, deal with' },
      { feature: 'Persistence', indicator: 'Keep trying, won\'t give up, persist' },
    ],
    voiceIndicators: [
      { feature: 'Energy Mean', high: 'Confident, projecting', low: 'Quieter, uncertain', weight: 0.25 },
    ],
  },
  {
    id: 'locus_of_control',
    name: 'Locus of Control',
    category: 'motivation',
    description: 'Reflects beliefs about what controls outcomes in life. Internal = self, External = outside forces.',
    psychometricSource: 'Rotter Internal-External Scale',
    markers: ['Agency language', 'Control attributions', 'Fate/luck references', 'Responsibility markers'],
    dataPoints: [
      { feature: 'Internal', indicator: 'I control, my choice, I make it happen' },
      { feature: 'External', indicator: 'Luck, fate, depends on others, chance' },
      { feature: 'Agency', indicator: 'Decision, choose, determine, influence' },
      { feature: 'Helplessness', indicator: 'Can\'t change, out of my hands, powerless' },
    ],
  },
  {
    id: 'growth_mindset',
    name: 'Growth Mindset',
    category: 'mindset',
    description: 'Reflects beliefs about whether abilities are fixed or can be developed through effort. Influences learning and achievement.',
    psychometricSource: 'Implicit Theories of Intelligence Scale (Dweck)',
    markers: ['Effort attribution', 'Challenge response', 'Failure interpretation', 'Learning orientation'],
    dataPoints: [
      { feature: 'Growth', indicator: 'Effort, practice, learn, improve, yet' },
      { feature: 'Fixed', indicator: 'Talent, natural, born with, can\'t' },
      { feature: 'Failure talk', growth: 'Learning opportunity', fixed: 'Defining, permanent' },
      { feature: 'Challenge response', growth: 'Embrace, try', fixed: 'Avoid, defensive' },
    ],
  },

  // === Category E: Values & Wellbeing (Domains 21-26) ===
  {
    id: 'personal_values',
    name: 'Personal Values',
    category: 'values',
    description: 'Reflects core personal values and what drives behavior. Based on universal human values that guide decisions and priorities.',
    psychometricSource: 'Schwartz PVQ (Portrait Values Questionnaire)',
    markers: ['Value-laden vocabulary', 'Priority expressions', 'Goal-oriented language', 'Cultural references'],
    dataPoints: [
      { feature: 'Self-Direction', indicator: 'Autonomy, creative vocabulary, independence' },
      { feature: 'Achievement', indicator: 'Success words, competence, ambition' },
      { feature: 'Benevolence', indicator: 'Helping words, care, loyalty' },
      { feature: 'Universalism', indicator: 'Equality, justice, environment' },
      { feature: 'Security', indicator: 'Safety words, stability, order' },
    ],
  },
  {
    id: 'interests',
    name: 'Interests (RIASEC)',
    category: 'values',
    description: 'Reflects vocational interests and preferred activities. Based on six interest types that guide career choices.',
    psychometricSource: 'Holland RIASEC / Strong Interest Inventory',
    markers: ['Activity preferences', 'Career language', 'Domain vocabulary', 'Work environment refs'],
    dataPoints: [
      { feature: 'Realistic', indicator: 'Build, fix, hands-on, practical, tools' },
      { feature: 'Investigative', indicator: 'Research, analyze, study, discover' },
      { feature: 'Artistic', indicator: 'Create, design, express, imagine' },
      { feature: 'Social', indicator: 'Help, teach, counsel, support' },
      { feature: 'Enterprising', indicator: 'Lead, persuade, sell, manage' },
      { feature: 'Conventional', indicator: 'Organize, detail, accurate, systematic' },
    ],
  },
  {
    id: 'life_satisfaction',
    name: 'Life Satisfaction',
    category: 'wellbeing',
    description: 'Reflects overall evaluation of one\'s life. High scorers are generally content with their life circumstances.',
    psychometricSource: 'SWLS (Satisfaction with Life Scale)',
    markers: ['Satisfaction language', 'Life evaluation', 'Contentment words', 'Wellbeing references'],
    dataPoints: [
      { feature: 'Overall satisfaction', indicator: 'Happy, satisfied, content, fulfilled' },
      { feature: 'Life evaluation', indicator: 'Good life, ideal, close to perfect' },
      { feature: 'Achievement sense', indicator: 'Accomplished, achieved, got what I wanted' },
      { feature: 'Future outlook', indicator: 'Optimistic, hopeful, looking forward' },
    ],
    voiceIndicators: [
      { feature: 'Harmonic-to-Noise Ratio', high: 'Clear, resonant voice', low: 'Rough, breathy voice', weight: 0.2 },
    ],
  },
  {
    id: 'stress_coping',
    name: 'Stress Coping',
    category: 'wellbeing',
    description: 'Reflects strategies used to manage stress and adversity. Includes problem-focused and emotion-focused approaches.',
    psychometricSource: 'Brief COPE Inventory',
    markers: ['Coping strategy language', 'Stress response', 'Recovery language', 'Support-seeking'],
    dataPoints: [
      { feature: 'Problem-focused', indicator: 'Action words, plan, solve, fix' },
      { feature: 'Emotion-focused', indicator: 'Feel, process, accept, support' },
      { feature: 'Avoidant', indicator: 'Avoid, ignore, distract, deny' },
      { feature: 'Support-seeking', indicator: 'Help, talk to, reach out' },
    ],
    voiceIndicators: [
      { feature: 'Harmonic-to-Noise Ratio', high: 'Clear, calm voice', low: 'Strained, breathy', weight: 0.3 },
      { feature: 'Jitter', high: 'Lower (stable)', low: 'Higher (voice tremor)', weight: -0.3 },
      { feature: 'Shimmer', high: 'Lower (stable)', low: 'Higher (amplitude variation)', weight: -0.25 },
    ],
  },
  {
    id: 'social_support',
    name: 'Social Support',
    category: 'wellbeing',
    description: 'Reflects perceived availability of support from others. Includes family, friends, and significant others.',
    psychometricSource: 'MSPSS (Multidimensional Scale of Perceived Social Support)',
    markers: ['Support references', 'Network language', 'Help availability', 'Relationship mentions'],
    dataPoints: [
      { feature: 'Family support', indicator: 'Family helps, parents, siblings support' },
      { feature: 'Friend support', indicator: 'Friends there, can count on friends' },
      { feature: 'Significant other', indicator: 'Partner, spouse, relationship support' },
      { feature: 'General support', indicator: 'People care, someone to turn to' },
    ],
  },
  {
    id: 'authenticity',
    name: 'Authenticity',
    category: 'wellbeing',
    description: 'Reflects alignment between inner experience and outward expression. High scorers are genuine and true to themselves.',
    psychometricSource: 'Authenticity Scale (Wood et al.)',
    markers: ['Self-expression', 'Genuineness language', 'Congruence markers', 'Identity references'],
    dataPoints: [
      { feature: 'Self-alienation', low: 'Know myself, understand who I am', high: 'Don\'t know who I am' },
      { feature: 'Authentic living', indicator: 'True to self, genuine, real, honest' },
      { feature: 'External influence', low: 'Own decisions, my choice', high: 'Others expect, should be' },
      { feature: 'Congruence', indicator: 'Feel aligned, match, consistent' },
    ],
    voiceIndicators: [
      { feature: 'Harmonic-to-Noise Ratio', high: 'Clear, genuine voice', low: 'Strained (suppressed)', weight: 0.25 },
      { feature: 'Shimmer', high: 'Lower (stable)', low: 'Higher (variable)', weight: -0.2 },
    ],
  },

  // === Category F: Cognitive/Learning (Domains 27-32) ===
  {
    id: 'cognitive_abilities',
    name: 'Cognitive Abilities',
    category: 'cognitive',
    description: 'Reflects verbal intelligence, reasoning capacity, and cognitive complexity. Measures how people process and communicate complex information.',
    psychometricSource: 'LIWC Cognitive Processing + Verbal IQ correlates',
    markers: ['Lexical sophistication', 'Sentence complexity', 'Logical connectors', 'Abstract reasoning', 'Reference coherence'],
    dataPoints: [
      { feature: 'Average word length', indicator: 'General verbal intelligence' },
      { feature: 'Words per sentence', indicator: 'Cognitive complexity' },
      { feature: 'Subordinate clauses', indicator: 'Hierarchical thinking' },
      { feature: 'Causal words', indicator: 'Causal reasoning' },
      { feature: 'Exclusive words', indicator: 'Differentiation ability' },
    ],
    voiceIndicators: [
      { feature: 'Articulation Rate', high: 'Faster, fluid speech', low: 'Slower, choppy', weight: 0.2 },
    ],
  },
  {
    id: 'creativity',
    name: 'Creativity',
    category: 'cognitive',
    description: 'Reflects capacity for novel idea generation, divergent thinking, and making unusual connections. Includes fluency, flexibility, and originality.',
    psychometricSource: 'CAQ (Creative Achievement Questionnaire) / Divergent Thinking Tests',
    markers: ['Remote associations', 'Metaphor usage', 'Novelty language', 'Divergent thinking'],
    dataPoints: [
      { feature: 'Semantic distance', indicator: 'Conceptual distance between words' },
      { feature: 'Unusual combinations', indicator: 'Rare collocations' },
      { feature: 'Metaphor density', indicator: 'Figurative to literal ratio' },
      { feature: 'Question diversity', indicator: 'Variety in question types' },
      { feature: 'Idea fluency', indicator: 'Distinct concepts per response' },
    ],
    voiceIndicators: [
      { feature: 'Pitch Std Dev', high: 'More expressive variation', low: 'Flat, monotone', weight: 0.2 },
      { feature: 'Energy Std Dev', high: 'Dynamic energy shifts', low: 'Constant', weight: 0.2 },
    ],
  },
  {
    id: 'learning_styles',
    name: 'Learning Styles',
    category: 'cognitive',
    description: 'Reflects preferred modes of acquiring and processing new information. Includes visual, auditory, reading/writing, and kinesthetic preferences.',
    psychometricSource: 'VARK Learning Style Inventory',
    markers: ['Sensory preference', 'Information seeking', 'Processing style'],
    dataPoints: [
      { feature: 'Visual', indicator: 'See, look, picture, visualize' },
      { feature: 'Auditory', indicator: 'Hear, sound, tell, discuss' },
      { feature: 'Read/Write', indicator: 'Read, write, list, note' },
      { feature: 'Kinesthetic', indicator: 'Feel, touch, hands-on' },
    ],
  },
  {
    id: 'information_processing',
    name: 'Information Processing',
    category: 'cognitive',
    description: 'Reflects how information is encoded, stored, and retrieved. Includes processing depth, speed, and attention characteristics.',
    psychometricSource: 'Cognitive Processing Models (Craik & Lockhart)',
    markers: ['Processing depth', 'Attention patterns', 'Memory references'],
    dataPoints: [
      { feature: 'Processing depth', indicator: 'Elaboration, connections, abstract' },
      { feature: 'Processing speed', indicator: 'Response latency' },
      { feature: 'Attention span', indicator: 'Topic coherence, completion' },
      { feature: 'Selective attention', indicator: 'Focus maintenance' },
    ],
    voiceIndicators: [
      { feature: 'Average Pause Length', high: 'Longer pauses (deep processing)', low: 'Shorter (quick)', weight: 0.2 },
    ],
  },
  {
    id: 'metacognition',
    name: 'Metacognition',
    category: 'cognitive',
    description: 'Reflects awareness and control of own thinking processes. Includes planning, monitoring, and evaluating cognitive strategies.',
    psychometricSource: 'MAI (Metacognitive Awareness Inventory)',
    markers: ['Self-monitoring', 'Strategy awareness', 'Knowledge calibration', 'Reflection'],
    dataPoints: [
      { feature: 'Planning', indicator: 'Goal words, strategy, approach' },
      { feature: 'Monitoring', indicator: 'Check, verify, evaluate, track' },
      { feature: 'Evaluation', indicator: 'Assess, judge, review, reflect' },
      { feature: 'Debugging', indicator: 'Correct, fix, adjust, revise' },
    ],
    voiceIndicators: [
      { feature: 'Pause Ratio', high: 'More pauses (reflection)', low: 'Fewer pauses', weight: 0.3 },
      { feature: 'Average Pause Length', high: 'Longer pauses (thinking)', low: 'Shorter', weight: 0.25 },
    ],
  },
  {
    id: 'executive_functions',
    name: 'Executive Functions',
    category: 'cognitive',
    description: 'Reflects higher-order cognitive processes for goal-directed behavior. Includes inhibition, cognitive flexibility, and working memory.',
    psychometricSource: 'BRIEF (Behavior Rating Inventory of Executive Function) / Miyake Model',
    markers: ['Inhibition language', 'Cognitive flexibility', 'Working memory', 'Planning language'],
    dataPoints: [
      { feature: 'Inhibition', indicator: 'Stop, resist, control, restrain' },
      { feature: 'Shifting', indicator: 'Change, switch, adapt, flexible' },
      { feature: 'Updating', indicator: 'Remember, forget, recall' },
      { feature: 'Planning', indicator: 'Plan, organize, schedule, steps' },
    ],
    voiceIndicators: [
      { feature: 'Articulation Rate', high: 'Faster, fluid speech', low: 'Slower, choppy', weight: 0.2 },
    ],
  },

  // === Category G: Social/Cultural/Values (Domains 33-37) ===
  {
    id: 'social_cognition',
    name: 'Social Cognition',
    category: 'social',
    description: 'Reflects ability to understand and predict others\' mental states and behaviors. Includes theory of mind and perspective-taking.',
    psychometricSource: 'RMET (Reading the Mind in the Eyes Test) / Theory of Mind Tasks',
    markers: ['Theory of mind', 'Perspective-taking', 'Social inference', 'Attribution patterns'],
    dataPoints: [
      { feature: 'Theory of Mind', indicator: 'They think..., mental state verbs' },
      { feature: 'Perspective taking', indicator: 'From their view..., In their shoes...' },
      { feature: 'Social inference', indicator: 'They probably..., That suggests...' },
      { feature: 'Attribution', indicator: 'Cause explanations for behavior' },
    ],
    voiceIndicators: [
      { feature: 'Speaking Duration', high: 'Balanced turn-taking', low: 'Dominating or withdrawn', weight: 0.2 },
    ],
  },
  {
    id: 'political_ideology',
    name: 'Political Ideology',
    category: 'values',
    description: 'Reflects political orientation along liberal-conservative dimensions. Based on moral foundations and worldview differences.',
    psychometricSource: 'MFQ (Moral Foundations Questionnaire) / Political Compass',
    markers: ['Authority orientation', 'In-group/out-group', 'Equality framing', 'Moral foundation emphasis'],
    dataPoints: [
      { feature: 'Authority', conservative: 'Respect, tradition, order', liberal: 'Question, challenge, change' },
      { feature: 'Group focus', conservative: 'In-group loyalty', liberal: 'Universal, equality' },
      { feature: 'Certainty', conservative: 'Higher certainty words', liberal: 'More nuance' },
      { feature: 'Threat sensitivity', conservative: 'More threat words', liberal: 'Fewer threat words' },
    ],
  },
  {
    id: 'cultural_values',
    name: 'Cultural Values',
    category: 'values',
    description: 'Reflects cultural dimensions that influence behavior and worldview. Includes individualism, power distance, and time orientation.',
    psychometricSource: 'Hofstede Cultural Dimensions',
    markers: ['Individualism/collectivism', 'Power distance', 'Uncertainty avoidance', 'Long-term orientation'],
    dataPoints: [
      { feature: 'Individualism', high: 'I, personal, independence', low: 'We, group, harmony' },
      { feature: 'Power Distance', high: 'Hierarchy, respect, status', low: 'Equality, challenge authority' },
      { feature: 'Uncertainty Avoidance', high: 'Rules, structure, certainty', low: 'Ambiguity tolerance' },
      { feature: 'Long-term Orientation', high: 'Future, persistence', low: 'Present, tradition' },
    ],
  },
  {
    id: 'moral_reasoning',
    name: 'Moral Reasoning',
    category: 'values',
    description: 'Reflects how people think about ethical issues and make moral judgments. Based on evolutionary moral foundations.',
    psychometricSource: 'DIT-2 (Defining Issues Test) / MFQ',
    markers: ['Moral vocabulary', 'Justice vs care orientation', 'Principled reasoning', 'Moral foundations'],
    dataPoints: [
      { feature: 'Care/Harm', indicator: 'Suffering, kindness, compassion' },
      { feature: 'Fairness/Cheating', indicator: 'Justice, rights, equality' },
      { feature: 'Loyalty/Betrayal', indicator: 'Group words, patriotism' },
      { feature: 'Authority/Subversion', indicator: 'Respect, tradition, obedience' },
      { feature: 'Sanctity/Degradation', indicator: 'Purity, sacred, disgust' },
    ],
  },
  {
    id: 'work_career_style',
    name: 'Work & Career Style',
    category: 'behavioral',
    description: 'Reflects orientation toward work and career. Includes job vs career vs calling orientations and work values.',
    psychometricSource: 'Career Anchors (Schein)',
    markers: ['Work orientation', 'Career values', 'Professional communication', 'Achievement motivation'],
    dataPoints: [
      { feature: 'Technical/Functional', indicator: 'Expertise, mastery, specialized' },
      { feature: 'Managerial', indicator: 'Lead, manage, responsibility, authority' },
      { feature: 'Autonomy', indicator: 'Independence, freedom, my way' },
      { feature: 'Security/Stability', indicator: 'Stable, secure, predictable' },
      { feature: 'Service/Dedication', indicator: 'Help, contribute, make difference' },
    ],
  },

  // === Category H: Sensory/Aesthetic (Domains 38-39) ===
  {
    id: 'sensory_processing',
    name: 'Sensory Processing',
    category: 'sensory',
    description: 'Reflects how sensory information is processed and integrated. Includes sensory sensitivity and processing patterns.',
    psychometricSource: 'HSP Scale (Highly Sensitive Person Scale)',
    markers: ['Sensory vocabulary', 'Sensitivity indicators', 'Stimulation seeking/avoiding'],
    dataPoints: [
      { feature: 'Visual', indicator: 'See, look, bright, colorful, picture' },
      { feature: 'Auditory', indicator: 'Hear, sound, loud, quiet, tune' },
      { feature: 'Kinesthetic', indicator: 'Feel, touch, rough, smooth' },
      { feature: 'Sensitivity level', indicator: 'Intensity words, overwhelm, seeking' },
    ],
  },
  {
    id: 'aesthetic_preferences',
    name: 'Aesthetic Preferences',
    category: 'aesthetic',
    description: 'Reflects preferences for beauty, art, and design. Includes complexity, novelty, and emotional resonance in aesthetic judgments.',
    psychometricSource: 'Aesthetic Fluency Scale / AESTHEMOS',
    markers: ['Beauty vocabulary', 'Style preferences', 'Artistic references'],
    dataPoints: [
      { feature: 'Complexity preference', indicator: 'Simple vs intricate, minimal vs elaborate' },
      { feature: 'Novelty preference', indicator: 'Classic vs modern, avant-garde' },
      { feature: 'Emotional resonance', indicator: 'Feeling words in aesthetic discussion' },
      { feature: 'Sensory emphasis', indicator: 'Dominant sensory words' },
    ],
  },
]

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  personality: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  dark_personality: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  cognitive: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  emotional: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  values: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  behavioral: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  social: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  mindset: { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
  motivation: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  temporal: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  wellbeing: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  sensory: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  aesthetic: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
}

const TRAIT_COLORS: Record<TraitName, string> = {
  openness: '#8b5cf6',
  conscientiousness: '#3b82f6',
  extraversion: '#f59e0b',
  agreeableness: '#10b981',
  neuroticism: '#ef4444',
}

const TRAIT_LABELS: Record<TraitName, string> = {
  openness: 'Openness',
  conscientiousness: 'Conscientiousness',
  extraversion: 'Extraversion',
  agreeableness: 'Agreeableness',
  neuroticism: 'Neuroticism',
}

// Data store definitions for inspector - organized by database type
const DEXIE_STORES = [
  { key: 'messages', label: 'Messages', description: 'Chat messages between you and the AI', icon: 'MessageSquare' },
  { key: 'linguisticAnalyses', label: 'Linguistic Analyses', description: 'Text analysis results for each message', icon: 'FileText' },
  { key: 'personalityTraits', label: 'Personality Traits', description: 'Big Five personality scores and history', icon: 'Brain' },
  { key: 'userProfile', label: 'User Profile', description: 'Overall profile statistics', icon: 'User' },
  { key: 'activityLogs', label: 'Activity Logs', description: 'System activity and events', icon: 'Activity' },
  { key: 'sessions', label: 'Sessions', description: 'Chat session records', icon: 'Layers' },
] as const

const VECTOR_STORES = [
  { key: 'vectorEmbeddings', label: 'Message Embeddings', description: 'Semantic embeddings from TinkerBird vector DB', icon: 'CircleDot' },
  { key: 'vectorTopics', label: 'Topic Vectors', description: 'Topic clustering vectors', icon: 'Target' },
] as const

const GRAPH_STORES = [
  { key: 'graphTriples', label: 'Knowledge Graph', description: 'LevelGraph relationship triples', icon: 'Network' },
  { key: 'graphByCategory', label: 'Graph by Category', description: 'Triples organized by predicate type', icon: 'Layers' },
] as const

const SQL_STORES = [
  { key: 'sqlDomainScores', label: 'Domain Scores', description: 'SQL.js domain score calculations', icon: 'Gauge' },
  { key: 'sqlFeatureCounts', label: 'Feature Counts', description: 'Linguistic feature counts', icon: 'Activity' },
  { key: 'sqlHistory', label: 'Score History', description: 'Historical domain score snapshots', icon: 'History' },
  { key: 'sqlMetrics', label: 'Behavioral Metrics', description: 'Aggregated behavioral metrics', icon: 'TrendingUp' },
] as const

type DexieStoreKey = typeof DEXIE_STORES[number]['key']
type VectorStoreKey = typeof VECTOR_STORES[number]['key']
type GraphStoreKey = typeof GRAPH_STORES[number]['key']
type SqlStoreKey = typeof SQL_STORES[number]['key']
type DataStoreKey = DexieStoreKey | VectorStoreKey | GraphStoreKey | SqlStoreKey

// Domain display configuration - All 39 domains matching PSYCHOLOGICAL_DOMAINS
const DOMAIN_LABELS: Record<string, string> = {
  // Category A: Core Personality - Big Five (5)
  big_five_openness: 'Openness',
  big_five_conscientiousness: 'Conscientiousness',
  big_five_extraversion: 'Extraversion',
  big_five_agreeableness: 'Agreeableness',
  big_five_neuroticism: 'Neuroticism',
  // Category B: Dark Personality (3)
  dark_triad_narcissism: 'Narcissism',
  dark_triad_machiavellianism: 'Machiavellianism',
  dark_triad_psychopathy: 'Psychopathy',
  // Category C: Emotional/Social Intelligence (5)
  emotional_empathy: 'Empathy',
  emotional_intelligence: 'Emotional Intelligence',
  attachment_style: 'Attachment Style',
  love_languages: 'Love Languages',
  communication_style: 'Communication Style',
  // Category D: Decision Making & Motivation (7)
  risk_tolerance: 'Risk Tolerance',
  decision_style: 'Decision Style',
  time_orientation: 'Time Orientation',
  achievement_motivation: 'Achievement Motivation',
  self_efficacy: 'Self-Efficacy',
  locus_of_control: 'Locus of Control',
  growth_mindset: 'Growth Mindset',
  // Category E: Values & Wellbeing (6)
  personal_values: 'Personal Values',
  interests: 'Interests (RIASEC)',
  life_satisfaction: 'Life Satisfaction',
  stress_coping: 'Stress Coping',
  social_support: 'Social Support',
  authenticity: 'Authenticity',
  // Category F: Cognitive/Learning (6)
  cognitive_abilities: 'Cognitive Abilities',
  creativity: 'Creativity',
  learning_styles: 'Learning Styles',
  information_processing: 'Info Processing',
  metacognition: 'Metacognition',
  executive_functions: 'Executive Functions',
  // Category G: Social/Cultural/Values (5)
  social_cognition: 'Social Cognition',
  political_ideology: 'Political Ideology',
  cultural_values: 'Cultural Values',
  moral_reasoning: 'Moral Reasoning',
  work_career_style: 'Work & Career Style',
  // Category H: Sensory/Aesthetic (2)
  sensory_processing: 'Sensory Processing',
  aesthetic_preferences: 'Aesthetic Preferences',
}

const DOMAIN_COLORS: Record<string, string> = {
  big_five_openness: '#8b5cf6',
  big_five_conscientiousness: '#3b82f6',
  big_five_extraversion: '#f59e0b',
  big_five_agreeableness: '#10b981',
  big_five_neuroticism: '#ef4444',
  emotional_intelligence: '#06b6d4',
  mindset_growth_fixed: '#84cc16',
  time_perspective: '#f97316',
}

export default function ProfileDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [traits, setTraits] = useState<PersonalityTrait[]>([])
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTrait, setSelectedTrait] = useState<TraitName | null>(null)

  // Phase 2 state
  const [enhancedProfile, setEnhancedProfile] = useState<{
    domainScores: Array<{
      domainId: string
      score: number
      confidence: number
      dataPointsCount: number
    }>
    topFeatures: Array<{
      category: string
      featureName: string
      percentage: number
    }>
  } | null>(null)
  const [trends, setTrends] = useState<Record<string, TrendAnalysis>>({})
  const [evolution, setEvolution] = useState<ProfileEvolution | null>(null)
  const [dbStats, setDbStats] = useState<{
    vector: { messageCount: number; topicCount: number; conceptCount: number }
    graph: { totalTriples: number; userTopicCount: number }
    history: { totalSnapshots: number; domainsTracked: number }
  } | null>(null)
  const [graphVizData, setGraphVizData] = useState<{
    nodes: Array<{ id: string; type: string; label: string }>
    edges: Array<{ source: string; target: string; label: string; metadata?: Record<string, unknown> }>
    triplesByCategory: Record<string, Triple[]>
  } | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'trends' | 'advanced' | 'data' | 'reference' | 'input-mode' | 'deep-dive'>('overview')
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())

  // Input Mode state (A/B/C/D)
  const [inputMode, setInputMode] = useState<'auto' | 'manual' | 'hybrid' | 'assessments'>('auto')
  const [manualDomainInputs, setManualDomainInputs] = useState<Record<string, number>>({})
  const [_selectedAssessment, _setSelectedAssessment] = useState<string | null>(null)

  // Hybrid signals for all domains (for quick signal indicators)
  const [domainSignals, setDomainSignals] = useState<Record<string, HybridSignalScore[]>>({})

  // Data Inspector state
  const [showDataInspector, setShowDataInspector] = useState(true)
  const [inspectorModal, setInspectorModal] = useState<{
    isOpen: boolean
    title: string
    data: unknown[] | null
    loading: boolean
    storeKey: DataStoreKey | null
    viewMode: 'table' | 'json' | 'graph'
  }>({ isOpen: false, title: '', data: null, loading: false, storeKey: null, viewMode: 'table' })

  // Expanded domain state for viewing data point details
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null)
  const [dataPointModal, setDataPointModal] = useState<{
    isOpen: boolean
    domainId: string
    domainName: string
    domainDescription: string
    finalScore: number
    finalConfidence: number
    signals: HybridSignalScore[]
    // Legacy data points (kept for backward compatibility with old UI)
    dataPoints: Array<{
      feature: string
      indicator?: string
      high?: string
      low?: string
      source: string
      value: number | null
      detected: boolean
      matchedWords?: Array<{word: string, count: number}>
    }>
  } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [profileData, traitsData, analysisData] = await Promise.all([
      getOrCreateProfile(),
      getPersonalityTraits(),
      getAggregateAnalysis(),
    ])

    setProfile(profileData)
    setTraits(traitsData)
    setAnalysis(analysisData)

    // Load Phase 2 data
    try {
      const [enhanced, trendData, evolutionData, vectorStats, graphStats, historyStats, graphViz, triplesCat, hybridSignals] =
        await Promise.all([
          getEnhancedProfileSummary(),
          analyzeAllTrends(7),
          analyzeProfileEvolution(30),
          getVectorStats(),
          getGraphStats(),
          getHistoricalStats(),
          getGraphVisualizationData(),
          getTriplesByCategory(),
          getAllHybridSignals(),
        ])

      setEnhancedProfile(enhanced)
      setTrends(trendData)
      setEvolution(evolutionData)
      setDbStats({
        vector: vectorStats,
        graph: graphStats,
        history: historyStats,
      })
      setGraphVizData({
        nodes: graphViz.nodes,
        edges: graphViz.edges,
        triplesByCategory: triplesCat,
      })
      setDomainSignals(hybridSignals)
    } catch (error) {
      console.warn('Phase 2 data loading warning:', error)
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      const updatedTraits = await updatePersonalityProfile()
      setTraits(updatedTraits)
      await loadData()
    } finally {
      setIsRefreshing(false)
    }
  }

  async function openDataInspector(storeKey: DataStoreKey, label: string) {
    // Default to 'graph' view for graph stores, 'table' for others
    const defaultViewMode = (storeKey === 'graphTriples' || storeKey === 'graphByCategory') ? 'graph' : 'table'
    setInspectorModal({ isOpen: true, title: label, data: null, loading: true, storeKey, viewMode: defaultViewMode })

    try {
      let data: unknown[]
      switch (storeKey) {
        // Dexie (IndexedDB) stores
        case 'messages':
          data = await db.messages.toArray()
          break
        case 'linguisticAnalyses':
          data = await db.linguisticAnalyses.toArray()
          break
        case 'personalityTraits':
          data = await db.personalityTraits.toArray()
          break
        case 'userProfile':
          data = await db.userProfile.toArray()
          break
        case 'activityLogs':
          data = await db.activityLogs.toArray()
          break
        case 'sessions':
          data = await db.sessions.toArray()
          break

        // TinkerBird Vector DB stores
        case 'vectorEmbeddings':
          const allEmbeddings = await getAllEmbeddings()
          // Combine all embeddings with type indicators
          data = [
            ...allEmbeddings.messages.map(m => ({ ...m, type: 'message' })),
            ...allEmbeddings.topics.map(t => ({ ...t, type: 'topic' })),
            ...allEmbeddings.concepts.map(c => ({ ...c, type: 'concept' })),
          ]
          break
        case 'vectorTopics':
          // Get topics from the embeddings
          const embeddingsData = await getAllEmbeddings()
          data = embeddingsData.topics.map(t => ({ ...t, type: 'topic' }))
          break

        // LevelGraph stores
        case 'graphTriples':
          data = await getAllTriples()
          break
        case 'graphByCategory':
          // Show triples organized by predicate
          const allTriples = await getAllTriples()
          const byCategory: Record<string, Triple[]> = {}
          for (const predicate of Object.values(PREDICATES)) {
            const matchingTriples = allTriples.filter((t: Triple) => t.predicate === predicate)
            if (matchingTriples.length > 0) {
              byCategory[predicate] = matchingTriples
            }
          }
          data = Object.entries(byCategory).map(([predicate, triples]) => ({
            predicate,
            count: triples.length,
            triples: triples.slice(0, 10), // Show first 10 per category
          }))
          break

        // SQL.js stores
        case 'sqlDomainScores':
          data = await getDomainScores()
          break
        case 'sqlFeatureCounts':
          data = await getFeatureCounts()
          break
        case 'sqlHistory':
          data = await getDomainHistory(undefined, 100)
          break
        case 'sqlMetrics':
          data = await getBehavioralMetrics()
          break

        default:
          data = []
      }
      const viewMode = (storeKey === 'graphTriples' || storeKey === 'graphByCategory') ? 'graph' : 'table'
      setInspectorModal({ isOpen: true, title: label, data, loading: false, storeKey, viewMode })
    } catch (error) {
      console.error('Failed to load data:', error)
      setInspectorModal({ isOpen: true, title: label, data: [], loading: false, storeKey, viewMode: 'table' })
    }
  }

  // Helper function to render table view based on store type
  function renderDataTable(data: unknown[], storeKey: DataStoreKey | null) {
    if (!data || data.length === 0) return null

    // Define columns for each store type
    const getColumnsForStore = (key: DataStoreKey | null): { key: string; label: string; render?: (v: unknown, row: Record<string, unknown>) => React.ReactNode }[] => {
      switch (key) {
        case 'messages':
          return [
            { key: 'id', label: 'ID' },
            { key: 'role', label: 'Role', render: (v) => <span className={`px-2 py-0.5 rounded text-xs ${v === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{String(v)}</span> },
            { key: 'content', label: 'Content', render: (v) => <span className="truncate max-w-xs block">{String(v).slice(0, 100)}{String(v).length > 100 ? '...' : ''}</span> },
            { key: 'timestamp', label: 'Timestamp', render: (v) => new Date(v as string).toLocaleString() },
            { key: 'sessionId', label: 'Session' },
          ]
        case 'linguisticAnalyses':
          return [
            { key: 'id', label: 'ID' },
            { key: 'messageId', label: 'Msg ID' },
            { key: 'metrics', label: 'Word Count', render: (v) => String((v as Record<string, unknown>)?.wordCount ?? '-') },
            { key: 'metrics', label: 'Sentences', render: (v) => String((v as Record<string, unknown>)?.sentenceCount ?? '-') },
            { key: 'metrics', label: 'Vocab Richness', render: (v) => { const val = (v as Record<string, unknown>)?.vocabularyRichness as number; return val != null ? val.toFixed(2) : '-' } },
            { key: 'timestamp', label: 'Timestamp', render: (v) => new Date(v as string).toLocaleString() },
          ]
        case 'personalityTraits':
          return [
            { key: 'trait', label: 'Trait', render: (v) => <span className="font-medium capitalize">{String(v).replace(/_/g, ' ')}</span> },
            { key: 'score', label: 'Score', render: (v) => <span className="font-mono">{(v as number).toFixed(1)}</span> },
            { key: 'confidence', label: 'Confidence', render: (v) => `${((v as number) * 100).toFixed(0)}%` },
            { key: 'sampleSize', label: 'Samples' },
            { key: 'lastUpdated', label: 'Updated', render: (v) => new Date(v as string).toLocaleDateString() },
          ]
        case 'activityLogs':
          return [
            { key: 'type', label: 'Type', render: (v) => <span className={`px-2 py-0.5 rounded text-xs ${v === 'message' ? 'bg-blue-100 text-blue-700' : v === 'analysis' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>{String(v)}</span> },
            { key: 'description', label: 'Description' },
            { key: 'timestamp', label: 'Time', render: (v) => new Date(v as string).toLocaleString() },
          ]
        case 'sessions':
          return [
            { key: 'id', label: 'Session ID', render: (v) => <span className="font-mono text-xs">{String(v).slice(0, 12)}...</span> },
            { key: 'startedAt', label: 'Started', render: (v) => new Date(v as string).toLocaleString() },
            { key: 'endedAt', label: 'Ended', render: (v) => v ? new Date(v as string).toLocaleString() : <span className="text-green-600">Active</span> },
            { key: 'messageCount', label: 'Messages' },
            { key: 'analysisComplete', label: 'Analyzed', render: (v) => v ? <span className="text-green-600">Yes</span> : <span className="text-gray-400 dark:text-gray-500">No</span> },
          ]
        case 'userProfile':
          return [
            { key: 'id', label: 'ID' },
            { key: 'totalMessages', label: 'Messages' },
            { key: 'totalWords', label: 'Words' },
            { key: 'averageSessionLength', label: 'Avg Session' },
            { key: 'communicationStyle', label: 'Style' },
            { key: 'createdAt', label: 'Created', render: (v) => new Date(v as string).toLocaleDateString() },
            { key: 'updatedAt', label: 'Updated', render: (v) => new Date(v as string).toLocaleDateString() },
          ]
        case 'vectorEmbeddings':
        case 'vectorTopics':
          return [
            { key: 'id', label: 'ID', render: (v) => String(v).slice(0, 12) + '...' },
            { key: 'type', label: 'Type', render: (v) => <span className={`px-2 py-0.5 rounded text-xs ${v === 'message' ? 'bg-blue-100 text-blue-700' : v === 'topic' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{String(v)}</span> },
            { key: 'text', label: 'Text', render: (v) => <span className="truncate max-w-xs block">{String(v || '').slice(0, 80)}{(v && String(v).length > 80) ? '...' : ''}</span> },
            { key: 'embedding', label: 'Dimensions', render: (v) => `${(v as number[])?.length || 0}D` },
          ]
        case 'graphTriples':
          return [
            { key: 'subject', label: 'Subject', render: (v) => <span className="font-mono text-xs bg-blue-50 px-1 rounded">{String(v).slice(0, 20)}</span> },
            { key: 'predicate', label: 'Predicate', render: (v) => <span className="font-medium text-purple-700">{String(v).replace(/_/g, ' ')}</span> },
            { key: 'object', label: 'Object', render: (v) => <span className="font-mono text-xs bg-green-50 px-1 rounded">{String(v).slice(0, 20)}</span> },
            { key: 'metadata', label: 'Meta', render: (v) => v ? <span className="text-xs text-gray-500 dark:text-gray-400">{JSON.stringify(v).slice(0, 30)}</span> : '-' },
          ]
        case 'graphByCategory':
          return [
            { key: 'predicate', label: 'Predicate Type', render: (v) => <span className="font-medium text-purple-700">{String(v).replace(/_/g, ' ')}</span> },
            { key: 'count', label: 'Count', render: (v) => <span className="font-mono">{String(v)}</span> },
            { key: 'triples', label: 'Sample', render: (v) => <span className="text-xs text-gray-500 dark:text-gray-400">{(v as Triple[])?.length || 0} triples shown</span> },
          ]
        case 'sqlDomainScores':
          return [
            { key: 'domain_id', label: 'Domain', render: (v) => DOMAIN_LABELS[String(v)] || String(v) },
            { key: 'score', label: 'Score', render: (v) => <span className="font-mono">{(v as number).toFixed(2)}</span> },
            { key: 'confidence', label: 'Confidence', render: (v) => `${((v as number) * 100).toFixed(0)}%` },
            { key: 'sample_count', label: 'Samples' },
            { key: 'updated_at', label: 'Updated', render: (v) => new Date(v as string).toLocaleDateString() },
          ]
        case 'sqlFeatureCounts':
          return [
            { key: 'domain_id', label: 'Domain', render: (v) => DOMAIN_LABELS[String(v)] || String(v) },
            { key: 'feature_name', label: 'Feature' },
            { key: 'count', label: 'Count' },
            { key: 'last_seen', label: 'Last Seen', render: (v) => new Date(v as string).toLocaleDateString() },
          ]
        case 'sqlHistory':
          return [
            { key: 'domain_id', label: 'Domain', render: (v) => DOMAIN_LABELS[String(v)] || String(v) },
            { key: 'score', label: 'Score', render: (v) => <span className="font-mono">{(v as number).toFixed(2)}</span> },
            { key: 'confidence', label: 'Confidence', render: (v) => `${((v as number) * 100).toFixed(0)}%` },
            { key: 'recorded_at', label: 'Recorded', render: (v) => new Date(v as string).toLocaleString() },
          ]
        case 'sqlMetrics':
          return [
            { key: 'metric_name', label: 'Metric' },
            { key: 'value', label: 'Value', render: (v) => <span className="font-mono">{typeof v === 'number' ? v.toFixed(2) : String(v)}</span> },
            { key: 'updated_at', label: 'Updated', render: (v) => new Date(v as string).toLocaleString() },
          ]
        default:
          // Generic columns based on first item
          const firstItem = data[0] as Record<string, unknown>
          return Object.keys(firstItem).slice(0, 6).map(k => ({ key: k, label: k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ') }))
      }
    }

    const columns = getColumnsForStore(storeKey)

    return (
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.slice(0, 100).map((item, rowIdx) => {
            const row = item as Record<string, unknown>
            return (
              <tr key={rowIdx} className="hover:bg-gray-50 dark:bg-gray-800">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-200">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  // Prepare radar chart data
  const radarData = traits.map((t) => ({
    trait: TRAIT_LABELS[t.trait],
    score: t.score,
    fullMark: 100,
  }))

  // Prepare history chart data for selected trait
  const selectedTraitData = selectedTrait
    ? traits.find((t) => t.trait === selectedTrait)
    : null

  const historyData =
    selectedTraitData?.history.map((h, i) => ({
      index: i + 1,
      score: h.score,
      date: new Date(h.timestamp).toLocaleDateString(),
    })) || []

  // Helper function to get trend icon
  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-400 dark:text-gray-500" />
    }
  }

  // Get confidence label with explanation
  // Confidence reflects HOW SURE we are about the score, based on data points collected
  // Score reflects WHERE you fall on the trait spectrum
  const getConfidenceLabel = (confidence: number, dataPoints: number = 0) => {
    if (confidence >= 0.8)
      return {
        label: 'High Confidence',
        shortLabel: 'High',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'Strong data support',
        icon: '✓'
      }
    if (confidence >= 0.6)
      return {
        label: 'Good Confidence',
        shortLabel: 'Good',
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        description: 'Reliable estimate',
        icon: '✓'
      }
    if (confidence >= 0.4)
      return {
        label: 'Moderate Confidence',
        shortLabel: 'Moderate',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        description: 'More data needed',
        icon: '~'
      }
    if (confidence >= 0.2)
      return {
        label: 'Low Confidence',
        shortLabel: 'Low',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        description: 'Preliminary estimate',
        icon: '!'
      }
    return {
      label: dataPoints > 0 ? 'Building Profile' : 'No Data Yet',
      shortLabel: dataPoints > 0 ? 'Building' : 'No Data',
      color: 'text-gray-500',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      description: dataPoints > 0 ? 'Keep chatting to improve accuracy' : 'Start chatting to build profile',
      icon: '○'
    }
  }

  // Helper to get domain reference data
  const getDomainRef = (domainId: string): DomainReference | undefined => {
    return DOMAIN_REFERENCE.find(d => d.id === domainId)
  }

  // Helper to get score interpretation for a domain
  const getScoreInterpretation = (domainId: string, score: number): string => {
    const percent = Math.round(score * 100)
    const domainRef = getDomainRef(domainId)
    if (!domainRef) return `${percent}% on this trait`

    // Special interpretations based on domain type
    if (domainId.startsWith('big_five_')) {
      if (percent >= 70) return `High ${domainRef.name.split(' ')[0]}`
      if (percent <= 30) return `Low ${domainRef.name.split(' ')[0]}`
      return `Moderate ${domainRef.name.split(' ')[0]}`
    }

    if (percent >= 70) return 'Strong presence'
    if (percent <= 30) return 'Minimal presence'
    return 'Moderate presence'
  }

  // Helper to open data point details modal with REAL hybrid signal data
  const openDataPointDetails = async (domainId: string) => {
    const domainRef = getDomainRef(domainId)
    if (!domainRef) return

    // Fetch REAL hybrid signal data from database
    const signals = await getHybridSignalsForDomain(domainId)

    // COMPUTE final score and confidence FROM the actual hybrid signals
    // Using the same weighted formula as hybrid-aggregator.ts
    let weightedSum = 0
    let totalWeight = 0
    let totalConfidenceWeightedSum = 0

    const liwcSignal = signals.find(s => s.signalType === 'liwc')
    const embeddingSignal = signals.find(s => s.signalType === 'embedding')
    const llmSignal = signals.find(s => s.signalType === 'llm')

    // Add LIWC contribution: score * weight * confidence
    if (liwcSignal && liwcSignal.weightUsed > 0) {
      const adjustedWeight = liwcSignal.weightUsed * liwcSignal.confidence
      weightedSum += liwcSignal.score * adjustedWeight
      totalWeight += adjustedWeight
      totalConfidenceWeightedSum += liwcSignal.confidence * liwcSignal.weightUsed
    }

    // Add Embedding contribution
    if (embeddingSignal && embeddingSignal.weightUsed > 0) {
      const adjustedWeight = embeddingSignal.weightUsed * embeddingSignal.confidence
      weightedSum += embeddingSignal.score * adjustedWeight
      totalWeight += adjustedWeight
      totalConfidenceWeightedSum += embeddingSignal.confidence * embeddingSignal.weightUsed
    }

    // Add LLM contribution (highest priority)
    if (llmSignal && llmSignal.weightUsed > 0) {
      const adjustedWeight = llmSignal.weightUsed * llmSignal.confidence
      weightedSum += llmSignal.score * adjustedWeight
      totalWeight += adjustedWeight
      totalConfidenceWeightedSum += llmSignal.confidence * llmSignal.weightUsed
    }

    // Calculate final aggregated score and confidence
    const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5
    // Final confidence = sum of (signal confidence * signal weight) / sum of weights
    const totalBaseWeight = (liwcSignal?.weightUsed ?? 0) + (embeddingSignal?.weightUsed ?? 0) + (llmSignal?.weightUsed ?? 0)
    const finalConfidence = totalBaseWeight > 0 ? totalConfidenceWeightedSum / totalBaseWeight : 0

    // Fetch matched words from database (for LIWC signal detail)
    const allMatchedWords = await getAllMatchedWords()

    // Map data points with source and detection status (legacy structure for backward compat)
    const dataPoints = domainRef.dataPoints.map((dp) => {
      // Determine source based on data type
      let source = 'LIWC Dictionary'
      if (dp.feature.toLowerCase().includes('embedding') || dp.feature.toLowerCase().includes('semantic')) {
        source = 'Embedding Similarity'
      } else if (dp.feature.toLowerCase().includes('llm') || dp.feature.toLowerCase().includes('deep')) {
        source = 'LLM Analysis'
      }

      // Get value from signal data if available
      const liwcSignal = signals.find(s => s.signalType === 'liwc')
      const detected = liwcSignal ? liwcSignal.score > 0.5 : false
      const value = liwcSignal ? liwcSignal.score : null

      // Find matched words for this feature
      const featureKey = dp.feature.toLowerCase().replace(/\s+/g, '_')
      let matchedWords: Array<{word: string, count: number}> = []

      // Search through all categories for matching feature
      for (const [, features] of Object.entries(allMatchedWords)) {
        for (const [featureName, words] of Object.entries(features)) {
          if (featureName.includes(featureKey) || featureKey.includes(featureName)) {
            matchedWords = words.map(w => ({ word: w.word, count: w.count }))
            break
          }
        }
        if (matchedWords.length > 0) break
      }

      return {
        feature: dp.feature,
        indicator: dp.indicator,
        high: dp.high,
        low: dp.low,
        source,
        value,
        detected,
        matchedWords: matchedWords.slice(0, 5),
      }
    })

    setDataPointModal({
      isOpen: true,
      domainId,
      domainName: domainRef.name,
      domainDescription: domainRef.description,
      finalScore,
      finalConfidence,
      signals,
      dataPoints,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white tracking-tight">
            Profile Dashboard
          </h1>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1">
            Your psychological profile based on conversation analysis
          </p>
        </div>
        <motion.button
          onClick={handleRefresh}
          disabled={isRefreshing}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors',
            isRefreshing
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          )}
        >
          <RefreshCw
            className={cn('w-4 h-4', isRefreshing && 'animate-spin')}
            strokeWidth={2}
          />
          Refresh Analysis
        </motion.button>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="border-b border-gray-200 dark:border-gray-800"
      >
        <nav className="flex gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Brain },
            { id: 'domains', label: 'All Domains', icon: Target },
            { id: 'trends', label: 'Trends', icon: Activity },
            { id: 'advanced', label: 'Advanced', icon: Sparkles },
            { id: 'data', label: 'Data Inspector', icon: Database },
            { id: 'reference', label: 'Domain Reference', icon: BookOpen },
            { id: 'deep-dive', label: 'Deep Dive', icon: Eye },
            { id: 'input-mode', label: 'Input Mode', icon: Layers },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 text-[13px] font-medium transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeProfileTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <tab.icon className="w-4 h-4" strokeWidth={activeTab === tab.id ? 2.25 : 1.75} />
              {tab.label}
            </motion.button>
          ))}
        </nav>
      </motion.div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="p-5 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Total Messages</p>
                  <p className="text-[20px] font-semibold text-gray-900 dark:text-white tracking-tight">
                    {profile?.totalMessages || 0}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="p-5 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Total Words</p>
                  <p className="text-[20px] font-semibold text-gray-900 dark:text-white tracking-tight">
                    {profile?.totalWords?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="p-5 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Vocabulary Richness</p>
                  <p className="text-[20px] font-semibold text-gray-900 dark:text-white tracking-tight">
                    {analysis ? (analysis.vocabularyRichness * 100).toFixed(0) + '%' : '--'}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="p-5 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Emotional Tone</p>
                  <p className="text-[20px] font-semibold text-gray-900 dark:text-white tracking-tight">
                    {analysis
                      ? analysis.emotionalTone > 0
                        ? 'Positive'
                        : analysis.emotionalTone < 0
                        ? 'Negative'
                        : 'Neutral'
                      : '--'}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Big Five Personality */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Radar Chart */}
            <div className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4 tracking-tight">
                Big Five Personality Profile
              </h2>
              {traits.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
                      <PolarAngleAxis dataKey="trait" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-gray-600 dark:text-gray-400" />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: 'currentColor' }}
                        className="text-gray-500"
                      />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.35}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-7 h-7 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                    </div>
                    <p className="text-[14px] text-gray-500 dark:text-gray-400">Start chatting to build your profile</p>
                  </div>
                </div>
              )}
            </div>

            {/* Trait Details */}
            <div className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4 tracking-tight">
                Trait Details
              </h2>
              <div className="space-y-3">
                {traits.length > 0 ? (
                  traits.map((trait) => (
                    <motion.button
                      key={trait.trait}
                      onClick={() =>
                        setSelectedTrait(
                          selectedTrait === trait.trait ? null : trait.trait
                        )
                      }
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border transition-all',
                        selectedTrait === trait.trait
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white/50 dark:bg-gray-800/50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-medium text-gray-900 dark:text-white">
                          {TRAIT_LABELS[trait.trait]}
                        </span>
                        <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                          {trait.score.toFixed(0)}/100
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${trait.score}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{ backgroundColor: TRAIT_COLORS[trait.trait] }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {getTraitDescription(trait.trait, trait.score)}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                          {(trait.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-[14px] text-gray-400 dark:text-gray-500">
                      No personality data yet. Have some conversations first!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Top 10 Domains Section */}
          {enhancedProfile?.domainScores && enhancedProfile.domainScores.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Top 10 by Score */}
              <div className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                  </div>
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                    Top 10 Domains by Score
                  </h2>
                </div>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-4">
                  Your highest scoring psychological traits (0-1 scale: 0.7+ = HIGH)
                </p>
                <div className="space-y-3">
                  {[...enhancedProfile.domainScores]
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10)
                    .map((domain, index) => {
                      const label = DOMAIN_LABELS[domain.domainId] || domain.domainId
                      const scoreColor = domain.score >= 0.7 ? 'text-emerald-600 dark:text-emerald-400' : domain.score <= 0.3 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                      return (
                        <div key={domain.domainId} className="flex items-center gap-3">
                          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 w-6">#{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{label}</span>
                              <span className={cn('text-[12px] font-semibold', scoreColor)}>
                                {(domain.score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${domain.score * 100}%` }}
                                transition={{ duration: 0.6, delay: index * 0.05 }}
                                className="h-full rounded-full bg-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Top 10 by Confidence */}
              <div className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                  </div>
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                    Top 10 Domains by Confidence
                  </h2>
                </div>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-4">
                  Most reliably measured traits (based on available data)
                </p>
                <div className="space-y-3">
                  {[...enhancedProfile.domainScores]
                    .sort((a, b) => b.confidence - a.confidence)
                    .slice(0, 10)
                    .map((domain, index) => {
                      const label = DOMAIN_LABELS[domain.domainId] || domain.domainId
                      const confColor = domain.confidence >= 0.7 ? 'text-blue-600 dark:text-blue-400' : domain.confidence >= 0.4 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'
                      return (
                        <div key={domain.domainId} className="flex items-center gap-3">
                          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 w-6">#{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                  Score: {(domain.score * 100).toFixed(0)}%
                                </span>
                                <span className={cn('text-[12px] font-semibold', confColor)}>
                                  {(domain.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${domain.confidence * 100}%` }}
                                transition={{ duration: 0.6, delay: index * 0.05 }}
                                className="h-full rounded-full bg-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Trait History */}
          {selectedTrait && historyData.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  {TRAIT_LABELS[selectedTrait]} Over Time
                </h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" className="text-gray-200 dark:text-gray-700" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-gray-500" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-gray-500" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={TRAIT_COLORS[selectedTrait]}
                      strokeWidth={2}
                      dot={{ fill: TRAIT_COLORS[selectedTrait] }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Linguistic Analysis */}
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  Linguistic Patterns
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Words/Sentence</p>
                  <p className="text-[18px] font-semibold text-gray-900 dark:text-white mt-1">
                    {analysis.avgWordsPerSentence.toFixed(1)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Complexity</p>
                  <p className="text-[18px] font-semibold text-gray-900 dark:text-white mt-1">
                    {(analysis.cognitiveComplexity * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">I-references</p>
                  <p className="text-[18px] font-semibold text-gray-900 dark:text-white mt-1">
                    {analysis.categories.pronouns.i}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Social Refs</p>
                  <p className="text-[18px] font-semibold text-gray-900 dark:text-white mt-1">
                    {analysis.categories.social.family +
                      analysis.categories.social.friends +
                      analysis.categories.social.humans}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase 2: Database Stats Summary */}
          {dbStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                  <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" strokeWidth={2} />
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  Data Storage
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Vector DB</p>
                  <p className="text-[20px] font-semibold text-blue-900 dark:text-blue-200 mt-1">{dbStats.vector.messageCount}</p>
                  <p className="text-[11px] text-blue-500 dark:text-blue-400/70">embeddings</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">Graph DB</p>
                  <p className="text-[20px] font-semibold text-purple-900 dark:text-purple-200 mt-1">{dbStats.graph.totalTriples}</p>
                  <p className="text-[11px] text-purple-500 dark:text-purple-400/70">relationships</p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">History</p>
                  <p className="text-[20px] font-semibold text-emerald-900 dark:text-emerald-200 mt-1">{dbStats.history.totalSnapshots}</p>
                  <p className="text-[11px] text-emerald-500 dark:text-emerald-400/70">snapshots</p>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ==================== DOMAINS TAB ==================== */}
      {activeTab === 'domains' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* All Domain Scores */}
          <div className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
              </div>
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                All Domains <span className="text-gray-400 dark:text-gray-500 font-normal">({DOMAIN_REFERENCE.length})</span>
              </h2>
            </div>

            {/* Legend explaining Score vs Confidence */}
            <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-3">How to Read Your Profile</p>

              {/* Score Range Legend */}
              <div className="mb-3 p-3 bg-white dark:bg-gray-900/50 rounded-lg">
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Score Ranges</p>
                <div className="flex flex-wrap gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-400"></span>
                    <span className="text-gray-600 dark:text-gray-300"><span className="font-semibold">0-30%</span> Low</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>
                    <span className="text-gray-600 dark:text-gray-300"><span className="font-semibold">40-60%</span> Neutral</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span>
                    <span className="text-gray-600 dark:text-gray-300"><span className="font-semibold">70-100%</span> High</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Gauge className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Score</p>
                    <p className="text-gray-500 dark:text-gray-400">Your trait level from analysis</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Target className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Confidence</p>
                    <p className="text-gray-500 dark:text-gray-400">Certainty of assessment</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Markers</p>
                    <p className="text-gray-500 dark:text-gray-400">Click to see patterns found</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Always show all domains from DOMAIN_REFERENCE, with actual scores when available */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {DOMAIN_REFERENCE
                .map((domainRef) => {
                  // Find actual score data if it exists
                  const actualData = enhancedProfile?.domainScores?.find(d => d.domainId === domainRef.id)
                  const domain = actualData || {
                    domainId: domainRef.id,
                    score: 0,
                    confidence: 0,
                    dataPointsCount: 0,
                  }
                  const conf = getConfidenceLabel(domain.confidence ?? 0, domain.dataPointsCount ?? 0)
                  const trend = trends[domain.domainId]
                  const categoryColor = CATEGORY_COLORS[domainRef.category]
                  const totalMarkers = domainRef.dataPoints.length
                  const detectedMarkers = domain.dataPointsCount ?? 0

                  return (
                    <motion.div
                      key={domain.domainId}
                      whileHover={{ y: -2, scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={cn(
                        'p-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-gray-800/60',
                        categoryColor?.border || 'border-gray-200/60 dark:border-gray-700/50',
                        expandedDomain === domain.domainId && 'ring-2 ring-indigo-500 dark:ring-indigo-400'
                      )}
                      onClick={() => {
                        setExpandedDomain(expandedDomain === domain.domainId ? null : domain.domainId)
                        openDataPointDetails(domain.domainId)
                      }}
                    >
                      {/* Header: Category badge + Name + Trend */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {/* Category Badge */}
                          {categoryColor && (
                            <span className={cn(
                              'inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold mb-1.5 uppercase tracking-wide',
                              categoryColor.bg, categoryColor.text
                            )}>
                              {domainRef.category.charAt(0).toUpperCase() + domainRef.category.slice(1)}
                            </span>
                          )}
                          {/* Domain Name */}
                          <h3 className="font-semibold text-gray-900 dark:text-white text-[13px] leading-tight tracking-tight">
                            {domainRef.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {trend && getTrendIcon(trend.trend)}
                          <Eye className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                        </div>
                      </div>

                      {/* Score Bar with Interpretation */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className={cn(
                            "font-medium",
                            (domain.confidence ?? 0) < 0.05 ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-600 dark:text-gray-300"
                          )}>
                            {(domain.confidence ?? 0) < 0.05
                              ? "Awaiting analysis..."
                              : getScoreInterpretation(domain.domainId, domain.score ?? 0)
                            }
                          </span>
                          {(() => {
                            const score = domain.score ?? 0
                            const conf = domain.confidence ?? 0
                            // Calculate margin of error: lower confidence = wider interval
                            const margin = (1 - conf) * 0.25 // Max ±25% when confidence is 0
                            const low = Math.max(0, score - margin)
                            const high = Math.min(1, score + margin)

                            if (conf < 0.05) {
                              return <span className="font-bold text-gray-400 dark:text-gray-500">—</span>
                            }

                            return (
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {(score * 100).toFixed(0)}%
                                <span className="font-normal text-[10px] text-gray-400 dark:text-gray-500 ml-1">
                                  ({(low * 100).toFixed(0)}-{(high * 100).toFixed(0)}%)
                                </span>
                              </span>
                            )
                          })()}
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden relative">
                          {(() => {
                            const score = domain.score ?? 0
                            const conf = domain.confidence ?? 0
                            const margin = (1 - conf) * 0.25
                            const low = Math.max(0, score - margin)
                            const high = Math.min(1, score + margin)
                            const color = DOMAIN_COLORS[domain.domainId] || '#6b7280'

                            if (conf < 0.05) {
                              return (
                                <div
                                  className="h-full rounded-full bg-gray-300 animate-pulse"
                                  style={{ width: '100%' }}
                                />
                              )
                            }

                            return (
                              <>
                                {/* Confidence interval range (lighter) */}
                                <div
                                  className="absolute h-full rounded-full transition-all"
                                  style={{
                                    left: `${low * 100}%`,
                                    width: `${(high - low) * 100}%`,
                                    backgroundColor: color,
                                    opacity: 0.25,
                                  }}
                                />
                                {/* Actual score (solid) */}
                                <div
                                  className="h-full rounded-full transition-all relative z-10"
                                  style={{
                                    width: `${score * 100}%`,
                                    backgroundColor: color,
                                  }}
                                />
                              </>
                            )
                          })()}
                        </div>
                      </div>

                      {/* Confidence Bar - More Prominent */}
                      <div className="mb-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Confidence
                          </span>
                          <span className={cn('font-semibold', conf.color)}>
                            {((domain.confidence ?? 0) * 100).toFixed(0)}% · {conf.shortLabel}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700/60 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all',
                              (domain.confidence ?? 0) >= 0.6 ? 'bg-emerald-500' :
                              (domain.confidence ?? 0) >= 0.4 ? 'bg-amber-500' :
                              (domain.confidence ?? 0) >= 0.2 ? 'bg-orange-500' : 'bg-gray-400'
                            )}
                            style={{ width: `${(domain.confidence ?? 0) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">{conf.description}</p>
                      </div>

                      {/* Markers - Clickable */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">
                          <span className="flex items-center gap-1">
                            <CircleDot className="w-3 h-3" />
                            Data Points
                          </span>
                          <span className="font-medium text-gray-600 dark:text-gray-300">
                            {detectedMarkers} / {totalMarkers}
                          </span>
                        </div>
                        {domainRef.markers && domainRef.markers.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {domainRef.markers.slice(0, 3).map((marker, idx) => (
                              <span
                                key={idx}
                                className={cn(
                                  'px-1.5 py-0.5 text-[10px] rounded-md',
                                  idx < detectedMarkers
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                )}
                              >
                                {idx < detectedMarkers && '✓ '}{marker}
                              </span>
                            ))}
                            {domainRef.markers.length > 3 && (
                              <span className="px-1.5 py-0.5 text-indigo-600 dark:text-indigo-400 text-[10px] font-medium">
                                +{domainRef.markers.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Signal source indicators */}
                      {domainSignals[domain.domainId] && domainSignals[domain.domainId].length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">Sources:</span>
                          {domainSignals[domain.domainId].some(s => s.signalType === 'liwc') && (
                            <span className="w-5 h-5 text-[10px] font-semibold rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center" title="LIWC word-matching analysis">
                              L
                            </span>
                          )}
                          {domainSignals[domain.domainId].some(s => s.signalType === 'embedding') && (
                            <span className="w-5 h-5 text-[10px] font-semibold rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center" title="Semantic embedding similarity">
                              E
                            </span>
                          )}
                          {domainSignals[domain.domainId].some(s => s.signalType === 'llm') && (
                            <span className="w-5 h-5 text-[10px] font-semibold rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center" title="AI deep analysis">
                              A
                            </span>
                          )}
                        </div>
                      )}

                      {/* Click hint */}
                      <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium flex items-center gap-1 mt-2">
                        <Eye className="w-3 h-3" /> View details
                      </p>
                    </motion.div>
                  )
                })}
            </div>
          </div>

          {/* Top Linguistic Features */}
          {enhancedProfile?.topFeatures && enhancedProfile.topFeatures.length > 0 && (
            <div className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  Top Linguistic Features
                </h2>
              </div>
              <div className="space-y-2">
                {enhancedProfile.topFeatures.slice(0, 10).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-gray-900 dark:text-white">{feature.featureName ?? 'Unknown'}</span>
                        <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">{(feature.percentage ?? 0).toFixed(2)}%</span>
                      </div>
                      <div className="h-1 bg-gray-100 dark:bg-gray-700/60 rounded-full mt-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((feature.percentage ?? 0) * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Domain Bar Chart */}
          {enhancedProfile?.domainScores && enhancedProfile.domainScores.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  Domain Comparison
                </h2>
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={enhancedProfile.domainScores
                      .filter((d) => d.domainId)
                      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                      .slice(0, 12)
                      .map((d) => ({
                        name: DOMAIN_LABELS[d.domainId]?.slice(0, 12) || d.domainId?.slice(0, 12) || 'Unknown',
                        score: Math.round((d.score ?? 0) * 100),
                        confidence: Math.round((d.confidence ?? 0) * 100),
                      }))}
                    layout="vertical"
                    margin={{ left: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={95} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" fill="#6366f1" name="Score" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="confidence" fill="#10b981" name="Confidence" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ==================== TRENDS TAB ==================== */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Profile Evolution Summary */}
          {evolution && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <History className="w-4 h-4 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  Profile Evolution (Last 30 Days)
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Snapshots</p>
                  <p className="text-[20px] font-semibold text-gray-900 dark:text-white mt-1">{evolution.snapshots}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Domains</p>
                  <p className="text-[20px] font-semibold text-gray-900 dark:text-white mt-1">{Object.keys(evolution.domains).length}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Changes</p>
                  <p className="text-[20px] font-semibold text-gray-900 dark:text-white mt-1">{evolution.significantChanges.length}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Stability</p>
                  <p className="text-[20px] font-semibold text-gray-900 dark:text-white mt-1">{(evolution.overallStability * 100).toFixed(0)}%</p>
                </div>
              </div>

              {/* Significant Changes */}
              {evolution.significantChanges.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wide">Significant Changes</h3>
                  <div className="space-y-2">
                    {evolution.significantChanges.map((change, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl transition-colors',
                          change.direction === 'up'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40'
                            : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/40'
                        )}
                      >
                        <span className="text-[13px] font-medium text-gray-900 dark:text-white">
                          {DOMAIN_LABELS[change.domain] || change.domain}
                        </span>
                        <div className="flex items-center gap-2">
                          {change.direction === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          )}
                          <span className={cn(
                            'text-[13px] font-semibold',
                            change.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          )}>
                            {change.direction === 'up' ? '+' : ''}{(change.change * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Domain Trends Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
              </div>
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                Domain Trends (7-Day Window)
              </h2>
            </div>

            {/* Always show all domains from DOMAIN_REFERENCE with trend data when available */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DOMAIN_REFERENCE.map((domainRef) => {
                // Find actual trend data if it exists
                const actualTrend = trends[domainRef.id]
                const trend = actualTrend || {
                  trend: 'stable' as const,
                  currentScore: 0,
                  change: 0,
                  changePercent: 0,
                  dataPoints: 0,
                  confidence: 0,
                }

                return (
                  <div
                    key={domainRef.id}
                    className={cn(
                      'p-4 rounded-xl border transition-all',
                      trend.dataPoints > 0 && trend.trend === 'improving' && 'border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/20',
                      trend.dataPoints > 0 && trend.trend === 'declining' && 'border-rose-200/60 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-900/20',
                      (trend.dataPoints === 0 || trend.trend === 'stable') && 'border-gray-200/60 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/60'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-medium text-gray-900 dark:text-white">
                        {domainRef.name}
                      </span>
                      {trend.dataPoints > 0 ? getTrendIcon(trend.trend) : <Activity className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[20px] font-semibold text-gray-900 dark:text-white">
                        {(trend.currentScore * 100).toFixed(0)}%
                      </span>
                      <span
                        className={cn(
                          'text-[12px] font-medium',
                          trend.change > 0 && 'text-emerald-600 dark:text-emerald-400',
                          trend.change < 0 && 'text-rose-600 dark:text-rose-400',
                          trend.change === 0 && 'text-gray-500 dark:text-gray-400'
                        )}
                      >
                        {trend.change > 0 ? '+' : ''}{(trend.change * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {trend.dataPoints} data points • {getConfidenceLabel(trend.confidence, trend.dataPoints).shortLabel}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Trend History Chart */}
          {Object.keys(trends).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  Score History (Big Five)
                </h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      // Combine history from Big Five traits
                      const bigFive = ['big_five_openness', 'big_five_conscientiousness', 'big_five_extraversion', 'big_five_agreeableness', 'big_five_neuroticism']
                      const allDates = new Set<string>()
                      bigFive.forEach((trait) => {
                        trends[trait]?.history?.forEach((h) => {
                          allDates.add(new Date(h.timestamp).toLocaleDateString())
                        })
                      })
                      return Array.from(allDates)
                        .slice(0, 10)
                        .map((date) => {
                          const point: Record<string, string | number> = { date }
                          bigFive.forEach((trait) => {
                            const h = trends[trait]?.history?.find(
                              (x) => new Date(x.timestamp).toLocaleDateString() === date
                            )
                            if (h) point[trait] = Math.round(h.score * 100)
                          })
                          return point
                        })
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="big_five_openness" stroke="#8b5cf6" name="Openness" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="big_five_conscientiousness" stroke="#3b82f6" name="Conscient." dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="big_five_extraversion" stroke="#f59e0b" name="Extraversion" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="big_five_agreeableness" stroke="#10b981" name="Agreeable." dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="big_five_neuroticism" stroke="#ef4444" name="Neuroticism" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Dark Triad History Chart */}
          {Object.keys(trends).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-rose-600 dark:text-rose-400" strokeWidth={2} />
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  Score History (Dark Triad)
                </h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      const darkTriad = ['dark_triad_narcissism', 'dark_triad_machiavellianism', 'dark_triad_psychopathy']
                      const allDates = new Set<string>()
                      darkTriad.forEach((trait) => {
                        trends[trait]?.history?.forEach((h) => {
                          allDates.add(new Date(h.timestamp).toLocaleDateString())
                        })
                      })
                      return Array.from(allDates)
                        .slice(0, 10)
                        .map((date) => {
                          const point: Record<string, string | number> = { date }
                          darkTriad.forEach((trait) => {
                            const h = trends[trait]?.history?.find(
                              (x) => new Date(x.timestamp).toLocaleDateString() === date
                            )
                            if (h) point[trait] = Math.round(h.score * 100)
                          })
                          return point
                        })
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="dark_triad_narcissism" stroke="#ef4444" name="Narcissism" dot={false} />
                    <Line type="monotone" dataKey="dark_triad_machiavellianism" stroke="#7c3aed" name="Machiavellianism" dot={false} />
                    <Line type="monotone" dataKey="dark_triad_psychopathy" stroke="#374151" name="Psychopathy" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Emotional Intelligence History Chart */}
          {Object.keys(trends).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-pink-600 dark:text-pink-400" strokeWidth={2} />
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  Score History (Emotional)
                </h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      const emotional = ['emotional_empathy', 'emotional_intelligence', 'emotional_attachment', 'emotional_love_languages', 'emotional_communication']
                      const allDates = new Set<string>()
                      emotional.forEach((trait) => {
                        trends[trait]?.history?.forEach((h) => {
                          allDates.add(new Date(h.timestamp).toLocaleDateString())
                        })
                      })
                      return Array.from(allDates)
                        .slice(0, 10)
                        .map((date) => {
                          const point: Record<string, string | number> = { date }
                          emotional.forEach((trait) => {
                            const h = trends[trait]?.history?.find(
                              (x) => new Date(x.timestamp).toLocaleDateString() === date
                            )
                            if (h) point[trait] = Math.round(h.score * 100)
                          })
                          return point
                        })
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="emotional_empathy" stroke="#ec4899" name="Empathy" dot={false} />
                    <Line type="monotone" dataKey="emotional_intelligence" stroke="#f59e0b" name="EQ" dot={false} />
                    <Line type="monotone" dataKey="emotional_attachment" stroke="#3b82f6" name="Attachment" dot={false} />
                    <Line type="monotone" dataKey="emotional_love_languages" stroke="#10b981" name="Love Lang." dot={false} />
                    <Line type="monotone" dataKey="emotional_communication" stroke="#8b5cf6" name="Comm. Style" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Motivation & Decision Making History Chart */}
          {Object.keys(trends).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  Score History (Motivation & Decision-Making)
                </h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      const traits = ['motivation_achievement', 'motivation_self_efficacy', 'motivation_growth_mindset', 'decision_risk_tolerance', 'decision_time_orientation']
                      const allDates = new Set<string>()
                      traits.forEach((trait) => {
                        trends[trait]?.history?.forEach((h) => {
                          allDates.add(new Date(h.timestamp).toLocaleDateString())
                        })
                      })
                      return Array.from(allDates)
                        .slice(0, 10)
                        .map((date) => {
                          const point: Record<string, string | number> = { date }
                          traits.forEach((trait) => {
                            const h = trends[trait]?.history?.find(
                              (x) => new Date(x.timestamp).toLocaleDateString() === date
                            )
                            if (h) point[trait] = Math.round(h.score * 100)
                          })
                          return point
                        })
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="motivation_achievement" stroke="#f59e0b" name="Achievement" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="motivation_self_efficacy" stroke="#10b981" name="Self-Efficacy" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="motivation_growth_mindset" stroke="#6366f1" name="Growth Mind." dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="decision_risk_tolerance" stroke="#ef4444" name="Risk Tol." dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="decision_time_orientation" stroke="#8b5cf6" name="Time Orient." dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ==================== ADVANCED TAB ==================== */}
      {activeTab === 'advanced' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
        >
          <AdvancedVisualization userId="default" />
        </motion.div>
      )}

      {/* ==================== DATA TAB ==================== */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/30 dark:to-purple-950/30 backdrop-blur-xl border border-indigo-200/50 dark:border-indigo-800/40"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
              </div>
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                Data Inspector
              </h2>
            </div>
            <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed pl-10">
              Explore the four-database architecture storing your profile data. All data is stored locally in your browser - nothing leaves your device.
            </p>
          </motion.div>

          {/* Phase 2 Database Stats - Enhanced Cards */}
          {dbStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {/* Vector DB Card */}
              <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
                <div className="p-4 bg-gradient-to-br from-blue-500/90 to-indigo-600/90 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Network className="w-4 h-4" strokeWidth={2} />
                    <h3 className="text-[13px] font-semibold">TinkerBird Vector DB</h3>
                  </div>
                  <p className="text-[11px] text-blue-100/80">Semantic embeddings</p>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600 dark:text-gray-400">Messages</span>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md font-semibold text-[12px]">
                      {dbStats.vector.messageCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600 dark:text-gray-400">Topics</span>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md font-semibold text-[12px]">
                      {dbStats.vector.topicCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600 dark:text-gray-400">Concepts</span>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md font-semibold text-[12px]">
                      {dbStats.vector.conceptCount}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-[11px] text-gray-500 dark:text-gray-500">
                      Total: <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {dbStats.vector.messageCount + dbStats.vector.topicCount + dbStats.vector.conceptCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graph DB Card */}
              <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
                <div className="p-4 bg-gradient-to-br from-purple-500/90 to-violet-600/90 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4" strokeWidth={2} />
                    <h3 className="text-[13px] font-semibold">LevelGraph DB</h3>
                  </div>
                  <p className="text-[11px] text-purple-100/80">Knowledge graph</p>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600 dark:text-gray-400">Total Triples</span>
                    <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md font-semibold text-[12px]">
                      {dbStats.graph.totalTriples}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600 dark:text-gray-400">User-Topic Links</span>
                    <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md font-semibold text-[12px]">
                      {dbStats.graph.userTopicCount}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-[11px] text-gray-500 dark:text-gray-500">
                      <span className="font-mono text-purple-600 dark:text-purple-400">S → P → O</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SQL.js History Card */}
              <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
                <div className="p-4 bg-gradient-to-br from-emerald-500/90 to-teal-600/90 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4" strokeWidth={2} />
                    <h3 className="text-[13px] font-semibold">SQL.js History</h3>
                  </div>
                  <p className="text-[11px] text-emerald-100/80">Domain snapshots</p>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600 dark:text-gray-400">Snapshots</span>
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md font-semibold text-[12px]">
                      {dbStats.history.totalSnapshots}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600 dark:text-gray-400">Domains Tracked</span>
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md font-semibold text-[12px]">
                      {dbStats.history.domainsTracked}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-[11px] text-gray-500 dark:text-gray-500">
                      Trend analysis enabled
                    </div>
                  </div>
                </div>
              </div>

              {/* IndexedDB Card */}
              <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
                <div className="p-4 bg-gradient-to-br from-amber-500/90 to-orange-600/90 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="w-4 h-4" strokeWidth={2} />
                    <h3 className="text-[13px] font-semibold">IndexedDB (Dexie)</h3>
                  </div>
                  <p className="text-[11px] text-amber-100/80">Primary storage</p>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600 dark:text-gray-400">Messages</span>
                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md font-semibold text-[12px]">
                      {profile?.totalMessages || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600 dark:text-gray-400">Analyses</span>
                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md font-semibold text-[12px]">
                      {profile?.totalMessages || 0}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-[11px] text-gray-500 dark:text-gray-500">
                      6 data stores
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* LevelGraph Knowledge Graph Visualization */}
          {graphVizData && (graphVizData.nodes.length > 0 || Object.keys(graphVizData.triplesByCategory).length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
            >
              <div className="p-5 border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                      Knowledge Graph Visualization
                    </h2>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400">
                      Subject → Predicate → Object relationships
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Graph Node Legend */}
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 mr-2">Node Types:</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">user</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">topic</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400">domain</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">trait</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400">behavior</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400">concept</span>
                </div>

                {/* Simple Visual Graph - Nodes Display */}
                {graphVizData.nodes.length > 0 && (
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
                    <h3 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Network className="w-4 h-4" strokeWidth={2} />
                      Graph Nodes ({graphVizData.nodes.length})
                    </h3>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {graphVizData.nodes.slice(0, 50).map((node) => {
                        const typeColors: Record<string, string> = {
                          user: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
                          topic: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                          domain: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
                          trait: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                          behavior: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
                          concept: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
                        }
                        const color = typeColors[node.type] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                        return (
                          <div
                            key={node.id}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1.5',
                              color
                            )}
                          >
                            <CircleDot className="w-3 h-3" strokeWidth={2} />
                            <span className="font-semibold">{node.type}:</span>
                            <span className="truncate max-w-[100px]">{node.label}</span>
                          </div>
                        )
                      })}
                      {graphVizData.nodes.length > 50 && (
                        <span className="px-2.5 py-1 text-[11px] text-gray-500 dark:text-gray-400">
                          +{graphVizData.nodes.length - 50} more...
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Relationships by Category */}
                {Object.keys(graphVizData.triplesByCategory).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Layers className="w-4 h-4" strokeWidth={2} />
                      Relationships by Type
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(graphVizData.triplesByCategory).map(([predicate, triples]) => {
                        const predicateColors: Record<string, string> = {
                          discusses: 'border-l-blue-500 bg-blue-50/80 dark:bg-blue-900/20',
                          interested_in: 'border-l-blue-400 bg-blue-50/80 dark:bg-blue-900/20',
                          belongs_to_domain: 'border-l-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/20',
                          related_to: 'border-l-purple-500 bg-purple-50/80 dark:bg-purple-900/20',
                          indicates: 'border-l-amber-500 bg-amber-50/80 dark:bg-amber-900/20',
                          correlates_with: 'border-l-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/20',
                          contradicts: 'border-l-red-500 bg-red-50/80 dark:bg-red-900/20',
                          values: 'border-l-violet-500 bg-violet-50/80 dark:bg-violet-900/20',
                          believes: 'border-l-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/20',
                        }
                        const color = predicateColors[predicate] || 'border-l-gray-400 bg-gray-50/80 dark:bg-gray-800/50'
                        return (
                          <div
                            key={predicate}
                            className={cn(
                              'p-3 rounded-xl border-l-4',
                              color
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                                {predicate}
                              </span>
                              <span className="px-2 py-0.5 bg-white/70 dark:bg-gray-800/70 rounded-md text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                                {triples.length}
                              </span>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {triples.slice(0, 5).map((triple, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/30 p-1.5 rounded-md flex items-center gap-1"
                                >
                                  <span className="font-medium text-gray-800 dark:text-gray-300 truncate max-w-[100px]">
                                    {triple.subject.split(':')[1] || triple.subject}
                                  </span>
                                  <span className="text-gray-400 dark:text-gray-600">→</span>
                                  <span className="font-medium text-gray-800 dark:text-gray-300 truncate max-w-[100px]">
                                    {triple.object.split(':')[1] || triple.object}
                                  </span>
                                </div>
                              ))}
                              {triples.length > 5 && (
                                <div className="text-[11px] text-gray-400 dark:text-gray-500 italic">
                                  +{triples.length - 5} more...
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Connection Lines Visualization */}
                {graphVizData.edges.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="p-5 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                      </div>
                      <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                        Recent Connections
                      </h3>
                      <span className="ml-auto text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        {graphVizData.edges.length} total
                      </span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {graphVizData.edges.slice(0, 10).map((edge, idx) => {
                        const sourceType = edge.source.split(':')[0]
                        const targetType = edge.target.split(':')[0]
                        const sourceLabel = edge.source.split(':').slice(1).join(':') || edge.source
                        const targetLabel = edge.target.split(':').slice(1).join(':') || edge.target

                        const getTypeColor = (type: string) => {
                          const colors: Record<string, string> = {
                            user: 'bg-blue-500',
                            topic: 'bg-green-500',
                            domain: 'bg-purple-500',
                            trait: 'bg-amber-500',
                            behavior: 'bg-rose-500',
                            concept: 'bg-cyan-500',
                          }
                          return colors[type] || 'bg-gray-50 dark:bg-gray-8000'
                        }

                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.03 }}
                            className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
                          >
                            <div className="flex items-center gap-1.5">
                              <div className={cn('w-2.5 h-2.5 rounded-full', getTypeColor(sourceType))} />
                              <span className="text-[12px] font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                                {sourceLabel}
                              </span>
                            </div>
                            <div className="flex-1 flex items-center gap-1">
                              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 dark:from-gray-600 via-violet-400 dark:via-violet-500 to-gray-300 dark:to-gray-600" />
                              <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/50 rounded-md text-[11px] font-mono text-violet-700 dark:text-violet-300">
                                {edge.label}
                              </span>
                              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 dark:from-gray-600 via-violet-400 dark:via-violet-500 to-gray-300 dark:to-gray-600" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                                {targetLabel}
                              </span>
                              <div className={cn('w-2.5 h-2.5 rounded-full', getTypeColor(targetType))} />
                            </div>
                          </motion.div>
                        )
                      })}
                      {graphVizData.edges.length > 10 && (
                        <div className="text-center text-[11px] text-gray-500 dark:text-gray-400 py-2">
                          Showing 10 of {graphVizData.edges.length} connections
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Empty State */}
                {graphVizData.nodes.length === 0 && Object.keys(graphVizData.triplesByCategory).length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Layers className="w-8 h-8 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                    </div>
                    <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
                      No graph data yet
                    </p>
                    <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-1">
                      Start chatting to build your knowledge graph!
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Comprehensive Data Inspector Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setShowDataInspector(!showDataInspector)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-blue-600 flex items-center justify-center shadow-lg shadow-slate-500/20">
                  <Database className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                    Data Inspector
                  </h2>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400">
                    View and explore all database stores
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: showDataInspector ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" strokeWidth={2} />
              </motion.div>
            </button>

            {showDataInspector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="px-5 pb-5 border-t border-gray-200/50 dark:border-gray-800/50 space-y-5"
              >
                {/* IndexedDB / Dexie.js Section */}
                <div className="mt-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <HardDrive className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                    </div>
                    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">IndexedDB (Dexie.js)</h3>
                    <span className="text-[11px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">{DEXIE_STORES.length} stores</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {DEXIE_STORES.map((store, idx) => (
                      <motion.button
                        type="button"
                        key={store.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        onClick={() => openDataInspector(store.key, store.label)}
                        className="p-3.5 text-left rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-medium text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">
                            {store.label}
                          </span>
                          <Database className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" strokeWidth={2} />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{store.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* TinkerBird Vector DB Section */}
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <CircleDot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                    </div>
                    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">TinkerBird (Vector DB)</h3>
                    <span className="text-[11px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">{VECTOR_STORES.length} stores</span>
                    {dbStats?.vector && (
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-2">{dbStats.vector.messageCount} embeddings</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {VECTOR_STORES.map((store, idx) => (
                      <motion.button
                        type="button"
                        key={store.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        onClick={() => openDataInspector(store.key, store.label)}
                        className="p-3.5 text-left rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:border-purple-400 dark:hover:border-purple-500 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-medium text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400">
                            {store.label}
                          </span>
                          <CircleDot className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400" strokeWidth={2} />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{store.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* LevelGraph Section */}
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <Network className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                    </div>
                    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">LevelGraph (Knowledge Graph)</h3>
                    <span className="text-[11px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">{GRAPH_STORES.length} stores</span>
                    {dbStats?.graph && (
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-2">{dbStats.graph.totalTriples} triples</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {GRAPH_STORES.map((store, idx) => (
                      <motion.button
                        type="button"
                        key={store.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        onClick={() => openDataInspector(store.key, store.label)}
                        className="p-3.5 text-left rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:border-emerald-400 dark:hover:border-emerald-500 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-medium text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                            {store.label}
                          </span>
                          <Network className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400" strokeWidth={2} />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{store.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* SQL.js History Section */}
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                    </div>
                    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">SQL.js (Historical Data)</h3>
                    <span className="text-[11px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">{SQL_STORES.length} stores</span>
                    {dbStats?.history && (
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-2">{dbStats.history.totalSnapshots} snapshots</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {SQL_STORES.map((store, idx) => (
                      <motion.button
                        type="button"
                        key={store.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        onClick={() => openDataInspector(store.key, store.label)}
                        className="p-3.5 text-left rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:border-amber-400 dark:hover:border-amber-500 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-medium text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400">
                            {store.label}
                          </span>
                          <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-amber-500 dark:group-hover:text-amber-400" strokeWidth={2} />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{store.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* ==================== REFERENCE TAB ==================== */}
      {activeTab === 'reference' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 border border-indigo-200/50 dark:border-indigo-800/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <BookOpen className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  Psychological Domain Reference
                </h2>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">
                  {DOMAIN_REFERENCE.length} domains from psychometric research
                </p>
              </div>
            </div>
            <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              Each domain is derived from established psychometric research and detected through linguistic markers in your conversations.
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
                <span key={category} className={cn('px-3 py-1.5 rounded-lg text-[11px] font-semibold', colors.bg, colors.text)}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Domain Cards - Full Reference */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {DOMAIN_REFERENCE.map((domain, idx) => {
              const categoryColor = CATEGORY_COLORS[domain.category]
              return (
                <motion.div
                  key={domain.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.02 }}
                  className="p-5 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={cn(
                        'inline-block px-2.5 py-1 rounded-lg text-[10px] font-semibold mb-2 uppercase tracking-wide',
                        categoryColor?.bg, categoryColor?.text
                      )}>
                        {domain.category}
                      </span>
                      <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">{domain.name}</h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[12px] text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{domain.description}</p>

                  {/* Psychometric Source */}
                  <div className="mb-4 p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide font-medium">Psychometric Source</p>
                    <p className="text-[12px] font-medium text-gray-700 dark:text-gray-200">{domain.psychometricSource}</p>
                  </div>

                  {/* Markers */}
                  <div className="mb-4">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide font-medium">Linguistic Markers ({domain.markers.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {domain.markers.map((marker, mIdx) => (
                        <span
                          key={mIdx}
                          className={cn('px-2 py-1 rounded-md text-[10px] font-medium', categoryColor?.bg, categoryColor?.text)}
                        >
                          {marker}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Data Points */}
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide font-medium">Data Points ({domain.dataPoints.length})</p>
                    <div className="space-y-1.5">
                      {domain.dataPoints.map((dp, dpIdx) => (
                        <div key={dpIdx} className="text-[11px] bg-gray-50/80 dark:bg-gray-800/50 rounded-lg p-2.5">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{dp.feature}</span>
                          {dp.indicator && (
                            <span className="text-gray-500 dark:text-gray-400 ml-2">→ {dp.indicator}</span>
                          )}
                          {dp.high && dp.low && (
                            <div className="mt-1.5 flex gap-4">
                              <span className="text-emerald-600 dark:text-emerald-400">↑ {dp.high}</span>
                              <span className="text-orange-600 dark:text-orange-400">↓ {dp.low}</span>
                            </div>
                          )}
                          {dp.growth && dp.fixed && (
                            <div className="mt-1.5 flex gap-4">
                              <span className="text-emerald-600 dark:text-emerald-400">Growth: {dp.growth}</span>
                              <span className="text-orange-600 dark:text-orange-400">Fixed: {dp.fixed}</span>
                            </div>
                          )}
                          {dp.conservative && dp.liberal && (
                            <div className="mt-1.5 flex gap-4">
                              <span className="text-blue-600 dark:text-blue-400">Conservative: {dp.conservative}</span>
                              <span className="text-purple-600 dark:text-purple-400">Liberal: {dp.liberal}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Research Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="p-5 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" strokeWidth={2} />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">Research Foundation</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">Big Five Personality</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Costa & McCrae (1992) NEO-PI-R</p>
              </div>
              <div className="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">LIWC Research</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Pennebaker et al. Linguistic Inquiry & Word Count</p>
              </div>
              <div className="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">Moral Foundations</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Haidt & Graham Moral Foundations Theory</p>
              </div>
              <div className="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">Schwartz Values</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Schwartz Theory of Basic Human Values</p>
              </div>
              <div className="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">Time Perspective</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Zimbardo Time Perspective Inventory (ZTPI)</p>
              </div>
              <div className="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">Mindset Theory</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Dweck Implicit Theories of Intelligence</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ==================== DEEP DIVE TAB ==================== */}
      {activeTab === 'deep-dive' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-teal-500/10 to-emerald-500/10 dark:from-cyan-900/30 dark:via-teal-900/30 dark:to-emerald-900/30 border border-cyan-200/50 dark:border-cyan-800/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Eye className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
                  Deep Dive: All Data Points
                </h2>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">
                  Explore every domain, marker, and data point in detail
                </p>
              </div>
            </div>
            <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
              This view shows all 39 psychological domains organized by category. Click on any domain to expand
              and see its markers (behavioral indicators) and data points (specific linguistic features we analyze).
              Each data point shows what high or low values indicate about that trait.
            </p>
          </motion.div>

          {/* Category Tree View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-4"
          >
            {(Object.entries(DOMAIN_CATEGORIES) as [string, PsychologicalDomain[]][]).map(([categoryName, domainIds], catIndex) => (
              <motion.div
                key={categoryName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: catIndex * 0.05 }}
                className="rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
              >
                {/* Category Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/30 border-b border-gray-200/50 dark:border-gray-800/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold text-gray-800 dark:text-gray-200">
                      {categoryName}
                    </h3>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-200/50 dark:bg-gray-700/50 px-2 py-0.5 rounded-full">
                      {domainIds.length} domains
                    </span>
                  </div>
                </div>

                {/* Domains in Category */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {domainIds.map((domainId) => {
                    const domainRef = DOMAIN_REFERENCE.find(d => d.id === domainId)
                    const domainScore = enhancedProfile?.domainScores?.find(s => s.domainId === domainId)
                    const isExpanded = expandedDomains.has(domainId)

                    if (!domainRef) return null

                    return (
                      <div key={domainId}>
                        {/* Domain Row */}
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedDomains)
                            if (isExpanded) {
                              newExpanded.delete(domainId)
                            } else {
                              newExpanded.add(domainId)
                            }
                            setExpandedDomains(newExpanded)
                          }}
                          className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors text-left"
                        >
                          {/* Expand/Collapse Icon */}
                          <motion.div
                            animate={{ rotate: isExpanded ? 0 : -90 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
                          </motion.div>

                          {/* Domain Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-gray-800 dark:text-gray-200 truncate">
                                {domainRef.name}
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                ({domainId})
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {domainRef.markers.length} markers, {domainRef.dataPoints.length} data points
                            </p>
                          </div>

                          {/* Score Badge */}
                          {domainScore ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${domainScore.score * 100}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                              <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300 w-10 text-right">
                                {(domainScore.score * 100).toFixed(0)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 dark:text-gray-500">No data</span>
                          )}
                        </button>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 py-4 ml-7 border-l-2 border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20 space-y-4">
                                {/* Description */}
                                <div>
                                  <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {domainRef.description}
                                  </p>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                    Source: {domainRef.psychometricSource}
                                  </p>
                                </div>

                                {/* Markers */}
                                <div>
                                  <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <Target className="w-3 h-3" />
                                    Behavioral Markers
                                  </h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {domainRef.markers.map((marker, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[11px] px-2 py-1 bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg"
                                      >
                                        {marker}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Data Points */}
                                <div>
                                  <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <CircleDot className="w-3 h-3" />
                                    Data Points ({domainRef.dataPoints.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {domainRef.dataPoints.map((dp, idx) => (
                                      <div
                                        key={idx}
                                        className="p-3 bg-white/60 dark:bg-gray-800/40 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
                                      >
                                        <p className="text-[12px] font-medium text-gray-800 dark:text-gray-200 mb-1.5">
                                          {dp.feature}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                          {dp.high && (
                                            <div className="flex items-center gap-1.5">
                                              <TrendingUp className="w-3 h-3 text-emerald-500" />
                                              <span className="text-gray-600 dark:text-gray-400">
                                                High: <span className="text-emerald-600 dark:text-emerald-400">{dp.high}</span>
                                              </span>
                                            </div>
                                          )}
                                          {dp.low && (
                                            <div className="flex items-center gap-1.5">
                                              <TrendingDown className="w-3 h-3 text-rose-500" />
                                              <span className="text-gray-600 dark:text-gray-400">
                                                Low: <span className="text-rose-600 dark:text-rose-400">{dp.low}</span>
                                              </span>
                                            </div>
                                          )}
                                          {dp.indicator && !dp.high && !dp.low && (
                                            <div className="col-span-2 flex items-center gap-1.5">
                                              <Minus className="w-3 h-3 text-blue-500" />
                                              <span className="text-gray-600 dark:text-gray-400">{dp.indicator}</span>
                                            </div>
                                          )}
                                          {dp.growth && (
                                            <div className="flex items-center gap-1.5">
                                              <TrendingUp className="w-3 h-3 text-emerald-500" />
                                              <span className="text-gray-600 dark:text-gray-400">
                                                Growth: <span className="text-emerald-600 dark:text-emerald-400">{dp.growth}</span>
                                              </span>
                                            </div>
                                          )}
                                          {dp.fixed && (
                                            <div className="flex items-center gap-1.5">
                                              <TrendingDown className="w-3 h-3 text-amber-500" />
                                              <span className="text-gray-600 dark:text-gray-400">
                                                Fixed: <span className="text-amber-600 dark:text-amber-400">{dp.fixed}</span>
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Score Details if available */}
                                {domainScore && (
                                  <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                                    <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                      <Gauge className="w-3 h-3" />
                                      Current Analysis
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                      <div className="p-2 bg-indigo-50/80 dark:bg-indigo-900/30 rounded-lg text-center">
                                        <p className="text-[18px] font-semibold text-indigo-600 dark:text-indigo-400">
                                          {(domainScore.score * 100).toFixed(0)}%
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Score</p>
                                      </div>
                                      <div className="p-2 bg-purple-50/80 dark:bg-purple-900/30 rounded-lg text-center">
                                        <p className="text-[18px] font-semibold text-purple-600 dark:text-purple-400">
                                          {(domainScore.confidence * 100).toFixed(0)}%
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Confidence</p>
                                      </div>
                                      <div className="p-2 bg-emerald-50/80 dark:bg-emerald-900/30 rounded-lg text-center">
                                        <p className="text-[18px] font-semibold text-emerald-600 dark:text-emerald-400">
                                          {domainScore.dataPointsCount || 0}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Data Points</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="p-5 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
          >
            <h3 className="text-[14px] font-semibold text-gray-800 dark:text-gray-200 mb-3">Summary Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                <p className="text-[20px] font-semibold text-indigo-600 dark:text-indigo-400">39</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Total Domains</p>
              </div>
              <div className="text-center p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                <p className="text-[20px] font-semibold text-purple-600 dark:text-purple-400">
                  {DOMAIN_REFERENCE.reduce((sum, d) => sum + d.markers.length, 0)}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Total Markers</p>
              </div>
              <div className="text-center p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                <p className="text-[20px] font-semibold text-teal-600 dark:text-teal-400">
                  {DOMAIN_REFERENCE.reduce((sum, d) => sum + d.dataPoints.length, 0)}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Total Data Points</p>
              </div>
              <div className="text-center p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                <p className="text-[20px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {enhancedProfile?.domainScores?.filter(s => s.score > 0).length || 0}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Domains Analyzed</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ==================== INPUT MODE TAB ==================== */}
      {activeTab === 'input-mode' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 via-indigo-500/10 to-purple-500/10 dark:from-violet-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 border border-violet-200/50 dark:border-violet-800/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Layers className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  Profile Input Mode
                </h2>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">
                  Choose how your psychological profile is built
                </p>
              </div>
            </div>
            <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
              Select a mode that best fits your preference. You can switch modes at any time, and your profile data will be preserved.
            </p>
          </motion.div>

          {/* Input Mode Selection Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Option A: Automatic Discovery */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              onClick={() => setInputMode('auto')}
              className={cn(
                'p-5 rounded-2xl text-left transition-all border-2',
                inputMode === 'auto'
                  ? 'bg-emerald-50/80 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600 shadow-lg shadow-emerald-500/10'
                  : 'bg-white/70 dark:bg-gray-900/70 border-gray-200/50 dark:border-gray-800/50 hover:border-emerald-300 dark:hover:border-emerald-700'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  inputMode === 'auto'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                )}>
                  <Sparkles className="w-6 h-6" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Option A</span>
                    {inputMode === 'auto' && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-semibold rounded-full">Active</span>
                    )}
                  </div>
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-2">Automatic Discovery</h3>
                  <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    The system automatically discovers and builds your psychological profile through natural conversation. No manual input required.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded-md">Passive</span>
                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded-md">AI-Driven</span>
                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded-md">Continuous</span>
                  </div>
                </div>
              </div>
            </motion.button>

            {/* Option B: Manual Input */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              onClick={() => setInputMode('manual')}
              className={cn(
                'p-5 rounded-2xl text-left transition-all border-2',
                inputMode === 'manual'
                  ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 shadow-lg shadow-blue-500/10'
                  : 'bg-white/70 dark:bg-gray-900/70 border-gray-200/50 dark:border-gray-800/50 hover:border-blue-300 dark:hover:border-blue-700'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  inputMode === 'manual'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                )}>
                  <FileText className="w-6 h-6" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Option B</span>
                    {inputMode === 'manual' && (
                      <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-semibold rounded-full">Active</span>
                    )}
                  </div>
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-2">Manual Input</h3>
                  <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    Manually input values for all domains, markers, and data points. Your values remain permanent and won't be adjusted by the system.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-medium rounded-md">User-Controlled</span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-medium rounded-md">Fixed</span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-medium rounded-md">Explicit</span>
                  </div>
                </div>
              </div>
            </motion.button>

            {/* Option C: Hybrid Mode */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              onClick={() => setInputMode('hybrid')}
              className={cn(
                'p-5 rounded-2xl text-left transition-all border-2',
                inputMode === 'hybrid'
                  ? 'bg-purple-50/80 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600 shadow-lg shadow-purple-500/10'
                  : 'bg-white/70 dark:bg-gray-900/70 border-gray-200/50 dark:border-gray-800/50 hover:border-purple-300 dark:hover:border-purple-700'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  inputMode === 'hybrid'
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                )}>
                  <Activity className="w-6 h-6" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Option C</span>
                    {inputMode === 'hybrid' && (
                      <span className="px-2 py-0.5 bg-purple-500 text-white text-[10px] font-semibold rounded-full">Active</span>
                    )}
                  </div>
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-2">Hybrid Mode</h3>
                  <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    Set initial values for all data points, then let the system adjust them based on your conversations. Best of both worlds.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-medium rounded-md">User + AI</span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-medium rounded-md">Adaptive</span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-medium rounded-md">Calibrated</span>
                  </div>
                </div>
              </div>
            </motion.button>

            {/* Option D: Assessments */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              onClick={() => setInputMode('assessments')}
              className={cn(
                'p-5 rounded-2xl text-left transition-all border-2',
                inputMode === 'assessments'
                  ? 'bg-amber-50/80 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 shadow-lg shadow-amber-500/10'
                  : 'bg-white/70 dark:bg-gray-900/70 border-gray-200/50 dark:border-gray-800/50 hover:border-amber-300 dark:hover:border-amber-700'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  inputMode === 'assessments'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                )}>
                  <BarChart3 className="w-6 h-6" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Option D</span>
                    {inputMode === 'assessments' && (
                      <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-semibold rounded-full">Active</span>
                    )}
                  </div>
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-2">Psychological Assessments</h3>
                  <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    Take validated psychological assessments (Big Five, Dark Triad, etc.) that map directly to your profile domains.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-medium rounded-md">Validated</span>
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-medium rounded-md">Scientific</span>
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-medium rounded-md">Standardized</span>
                  </div>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Mode-Specific Content */}
          <AnimatePresence mode="wait">
            {/* Auto Mode Info */}
            {inputMode === 'auto' && (
              <motion.div
                key="auto-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-5 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Automatic Discovery Active</h3>
                </div>
                <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                  Your profile is being built automatically through the three-signal hybrid analysis system:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">LIWC Analysis</p>
                    <p className="text-[12px] text-gray-700 dark:text-gray-300">Word pattern matching for immediate signals</p>
                  </div>
                  <div className="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Embeddings</p>
                    <p className="text-[12px] text-gray-700 dark:text-gray-300">Semantic similarity for contextual understanding</p>
                  </div>
                  <div className="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">LLM Deep Analysis</p>
                    <p className="text-[12px] text-gray-700 dark:text-gray-300">Full semantic analysis every 5 messages</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-emerald-50/80 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                  <p className="text-[12px] text-emerald-700 dark:text-emerald-300">
                    <strong>Tip:</strong> Keep chatting naturally! The system learns more with every conversation.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Manual Mode - Domain Input Form */}
            {inputMode === 'manual' && (
              <motion.div
                key="manual-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="p-5 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                      </div>
                      <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Manual Domain Input</h3>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{DOMAIN_REFERENCE.length} domains</span>
                  </div>
                  <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-4">
                    Set scores for each psychological domain (0-100). These values will remain fixed.
                  </p>
                </div>

                {/* Domain Input Grid by Category */}
                {(Object.entries(DOMAIN_CATEGORIES) as [string, PsychologicalDomain[]][]).map(([category, domainIds]) => {
                  const categoryColor = CATEGORY_COLORS[category.toLowerCase().replace(/[^a-z]/g, '') as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.personality
                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
                    >
                      <h4 className={cn('text-[13px] font-semibold mb-3 uppercase tracking-wide', categoryColor.text)}>
                        {category}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {domainIds.map((domainId) => {
                          const domainInfo = DOMAIN_REFERENCE.find(d => d.id === domainId)
                          return (
                            <div key={domainId} className="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                              <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {domainInfo?.name || domainId}
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={manualDomainInputs[domainId] || 50}
                                  onChange={(e) => setManualDomainInputs(prev => ({
                                    ...prev,
                                    [domainId]: parseInt(e.target.value)
                                  }))}
                                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <span className="text-[12px] font-mono font-semibold text-gray-600 dark:text-gray-400 w-8 text-right">
                                  {manualDomainInputs[domainId] || 50}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )
                })}

                {/* Save Button */}
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-[13px] font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-colors"
                  >
                    Save Manual Profile
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Hybrid Mode */}
            {inputMode === 'hybrid' && (
              <motion.div
                key="hybrid-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="p-5 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                    </div>
                    <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Hybrid Mode Configuration</h3>
                  </div>
                  <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-4">
                    Set your initial baseline values. The system will use these as starting points and adjust based on your conversations.
                  </p>
                  <div className="p-3 bg-purple-50/80 dark:bg-purple-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                    <p className="text-[12px] text-purple-700 dark:text-purple-300">
                      <strong>How it works:</strong> Your initial values serve as priors. The AI analysis adjusts these based on behavioral evidence from conversations. Stronger evidence = bigger adjustments.
                    </p>
                  </div>
                </div>

                {/* Same domain input grid as manual but with different context */}
                {(Object.entries(DOMAIN_CATEGORIES) as [string, PsychologicalDomain[]][]).slice(0, 2).map(([category, domainIds]) => {
                  const categoryColor = CATEGORY_COLORS[category.toLowerCase().replace(/[^a-z]/g, '') as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.personality
                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
                    >
                      <h4 className={cn('text-[13px] font-semibold mb-3 uppercase tracking-wide', categoryColor.text)}>
                        {category} (Initial Values)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {domainIds.map((domainId) => {
                          const domainInfo = DOMAIN_REFERENCE.find(d => d.id === domainId)
                          return (
                            <div key={domainId} className="p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                              <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {domainInfo?.name || domainId}
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={manualDomainInputs[domainId] || 50}
                                  onChange={(e) => setManualDomainInputs(prev => ({
                                    ...prev,
                                    [domainId]: parseInt(e.target.value)
                                  }))}
                                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                                <span className="text-[12px] font-mono font-semibold text-gray-600 dark:text-gray-400 w-8 text-right">
                                  {manualDomainInputs[domainId] || 50}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )
                })}

                <p className="text-[12px] text-gray-500 dark:text-gray-400 text-center">
                  Showing first 2 categories. All {Object.keys(DOMAIN_CATEGORIES).length} categories available.
                </p>

                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white text-[13px] font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-colors"
                  >
                    Set Initial Values & Enable Learning
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Assessments Mode */}
            {inputMode === 'assessments' && (
              <motion.div
                key="assessments-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="p-5 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                    </div>
                    <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Psychological Assessments</h3>
                  </div>
                  <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-4">
                    Take validated psychological assessments to populate your profile with scientifically-grounded scores.
                  </p>
                </div>

                {/* Assessment Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Big Five */}
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white">Big Five Personality</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">NEO-PI-R / IPIP-NEO</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded-md">50 questions</span>
                    </div>
                    <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-3">
                      Measures Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold rounded-lg"
                    >
                      Start Assessment
                    </motion.button>
                  </div>

                  {/* Dark Triad */}
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white">Dark Triad</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">SD3 (Short Dark Triad)</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded-md">27 questions</span>
                    </div>
                    <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-3">
                      Measures Narcissism, Machiavellianism, and Psychopathy traits.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold rounded-lg"
                    >
                      Start Assessment
                    </motion.button>
                  </div>

                  {/* Attachment Style */}
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white">Attachment Style</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">ECR-R</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded-md">36 questions</span>
                    </div>
                    <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-3">
                      Measures attachment anxiety and avoidance in close relationships.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold rounded-lg"
                    >
                      Start Assessment
                    </motion.button>
                  </div>

                  {/* Moral Foundations */}
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white">Moral Foundations</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">MFQ-30</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded-md">30 questions</span>
                    </div>
                    <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-3">
                      Measures Care, Fairness, Loyalty, Authority, and Sanctity foundations.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold rounded-lg"
                    >
                      Start Assessment
                    </motion.button>
                  </div>

                  {/* Growth Mindset */}
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white">Growth Mindset</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Dweck Mindset Scale</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded-md">8 questions</span>
                    </div>
                    <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-3">
                      Measures beliefs about intelligence and ability being fixed vs. malleable.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold rounded-lg"
                    >
                      Start Assessment
                    </motion.button>
                  </div>

                  {/* Time Perspective */}
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white">Time Perspective</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">ZTPI (Zimbardo)</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded-md">56 questions</span>
                    </div>
                    <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-3">
                      Measures past, present, and future time orientations.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold rounded-lg"
                    >
                      Start Assessment
                    </motion.button>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/80 dark:bg-amber-900/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                  <p className="text-[12px] text-amber-700 dark:text-amber-300">
                    <strong>Note:</strong> Assessment results will be mapped to the corresponding psychological domains in your profile. You can take assessments at any time to update or refine your scores.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Data Inspector Modal */}
      {inspectorModal.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setInspectorModal({ isOpen: false, title: '', data: null, loading: false, storeKey: null, viewMode: 'table' })}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col border border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200/60 dark:border-gray-700/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-blue-600 flex items-center justify-center shadow-lg shadow-slate-500/20">
                  <Database className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                    {inspectorModal.title}
                  </h3>
                  {inspectorModal.data && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {inspectorModal.data.length} records
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* View Mode Tabs */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setInspectorModal({ ...inspectorModal, viewMode: 'table' })}
                    className={cn(
                      'relative px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors',
                      inspectorModal.viewMode === 'table'
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    {inspectorModal.viewMode === 'table' && (
                      <motion.div
                        layoutId="inspector-tab"
                        className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative">Table</span>
                  </button>
                  <button
                    onClick={() => setInspectorModal({ ...inspectorModal, viewMode: 'json' })}
                    className={cn(
                      'relative px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors',
                      inspectorModal.viewMode === 'json'
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    {inspectorModal.viewMode === 'json' && (
                      <motion.div
                        layoutId="inspector-tab"
                        className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative">JSON</span>
                  </button>
                  {/* Graph view only for LevelDB stores */}
                  {(inspectorModal.storeKey === 'graphTriples' || inspectorModal.storeKey === 'graphByCategory') && (
                    <button
                      onClick={() => setInspectorModal({ ...inspectorModal, viewMode: 'graph' })}
                      className={cn(
                        'relative px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors',
                        inspectorModal.viewMode === 'graph'
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      )}
                    >
                      {inspectorModal.viewMode === 'graph' && (
                        <motion.div
                          layoutId="inspector-tab"
                          className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className="relative">Graph</span>
                    </button>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setInspectorModal({ isOpen: false, title: '', data: null, loading: false, storeKey: null, viewMode: 'table' })
                  }
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
                </motion.button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-5">
              {inspectorModal.loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-10 h-10 rounded-full border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-500 dark:border-t-indigo-400 animate-spin" />
                  <p className="mt-4 text-[13px] text-gray-500 dark:text-gray-400">Loading data...</p>
                </div>
              ) : inspectorModal.data && inspectorModal.data.length > 0 ? (
                <>
                  {/* TABLE VIEW */}
                  {inspectorModal.viewMode === 'table' && (
                    <div className="overflow-x-auto rounded-xl border border-gray-200/60 dark:border-gray-700/60">
                      {renderDataTable(inspectorModal.data, inspectorModal.storeKey)}
                    </div>
                  )}

                  {/* JSON VIEW */}
                  {inspectorModal.viewMode === 'json' && (
                    <pre className="text-[11px] font-mono bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl overflow-auto whitespace-pre-wrap max-h-[60vh] border border-gray-200/60 dark:border-gray-700/60 text-gray-700 dark:text-gray-300">
                      {JSON.stringify(inspectorModal.data, null, 2)}
                    </pre>
                  )}

                  {/* GRAPH VIEW - Animated force-directed visualization for LevelDB */}
                  {inspectorModal.viewMode === 'graph' && (inspectorModal.storeKey === 'graphTriples' || inspectorModal.storeKey === 'graphByCategory') && (
                    <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                      <AnimatedGraphVisualization
                        triples={inspectorModal.data as Triple[]}
                        width={900}
                        height={600}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <Database className="w-7 h-7 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                  </div>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">No data in this store</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/50 rounded-b-2xl">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Data is stored locally in IndexedDB
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (inspectorModal.data) {
                    const blob = new Blob(
                      [JSON.stringify(inspectorModal.data, null, 2)],
                      { type: 'application/json' }
                    )
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${inspectorModal.title.toLowerCase().replace(/\s+/g, '-')}-export.json`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }
                }}
                disabled={!inspectorModal.data || inspectorModal.data.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-[12px] font-medium rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Download JSON
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Data Point Details Modal - Shows HOW scores are computed */}
      {dataPointModal?.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDataPointModal(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Layers className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                    {dataPointModal.domainName}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 max-w-md">
                    {dataPointModal.domainDescription}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDataPointModal(null)}
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
              </motion.button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-5">
              {/* Final Aggregated Score */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "mb-5 p-5 rounded-xl border",
                  dataPointModal.finalConfidence < 0.05
                    ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200/60 dark:border-gray-700/60"
                    : "bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-indigo-200/60 dark:border-indigo-800/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn(
                      "text-[13px] font-semibold",
                      dataPointModal.finalConfidence < 0.05 ? "text-gray-600 dark:text-gray-300" : "text-indigo-700 dark:text-indigo-300"
                    )}>Final Aggregated Score</p>
                    <p className={cn(
                      "text-[11px] mt-1",
                      dataPointModal.finalConfidence < 0.05 ? "text-gray-500 dark:text-gray-400" : "text-indigo-600/70 dark:text-indigo-400/70"
                    )}>
                      {dataPointModal.finalConfidence < 0.05
                        ? "No analysis data yet - chat more to build profile"
                        : "Combined from 3 analysis methods using weighted average"
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    {dataPointModal.finalConfidence < 0.05 ? (
                      <>
                        <p className="text-[18px] font-medium text-gray-400 dark:text-gray-500">
                          Pending
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                          Awaiting analysis
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[28px] font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {Math.round(dataPointModal.finalScore * 100)}%
                        </p>
                        <p className="text-[10px] text-indigo-500/70 dark:text-indigo-400/70 uppercase tracking-wide">
                          {Math.round(dataPointModal.finalConfidence * 100)}% confidence
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-4 h-2.5 bg-white/60 dark:bg-gray-800/60 rounded-full overflow-hidden">
                  {dataPointModal.finalConfidence < 0.05 ? (
                    <div className="h-full bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" style={{ width: '100%' }} />
                  ) : (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dataPointModal.finalScore * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    />
                  )}
                </div>
              </motion.div>

              {/* Analysis Methods Legend */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mb-5 p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60"
              >
                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Hybrid Analysis Method (3 Signals)</p>
                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <FileText className="w-3 h-3" strokeWidth={2} />
                    </div>
                    LIWC (20%)
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                    <div className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <Network className="w-3 h-3" strokeWidth={2} />
                    </div>
                    Embedding (30%)
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <Zap className="w-3 h-3" strokeWidth={2} />
                    </div>
                    LLM (50%)
                  </span>
                </div>
              </motion.div>

              {/* Three Signal Cards */}
              <div className="space-y-4">
                {/* LIWC Signal */}
                {(() => {
                  const liwcSignal = dataPointModal.signals.find(s => s.signalType === 'liwc')
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 }}
                      className={cn(
                        'p-4 rounded-xl border transition-all',
                        liwcSignal
                          ? 'border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/20'
                          : 'border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                            <FileText className="w-4 h-4 text-white" strokeWidth={2} />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-semibold text-gray-900 dark:text-white">LIWC Analysis</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Dictionary-based word matching</p>
                          </div>
                        </div>
                        <span className={cn(
                          'px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide',
                          liwcSignal ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        )}>
                          20%
                        </span>
                      </div>

                      {liwcSignal ? (
                        <>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-[11px] mb-1.5">
                                <span className="text-gray-600 dark:text-gray-400">Score</span>
                                <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{Math.round(liwcSignal.score * 100)}%</span>
                              </div>
                              <div className="h-2 bg-amber-200/60 dark:bg-amber-900/30 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${liwcSignal.score * 100}%` }}
                                  transition={{ duration: 0.5, ease: 'easeOut' }}
                                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Conf.</p>
                              <p className="text-[13px] font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{Math.round(liwcSignal.confidence * 100)}%</p>
                            </div>
                          </div>

                          {liwcSignal.matchedWords && liwcSignal.matchedWords.length > 0 && (
                            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                              <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 mb-2 uppercase tracking-wide">Matched Keywords</p>
                              <div className="flex flex-wrap gap-1.5">
                                {liwcSignal.matchedWords.map((word, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                                    {word}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 italic">No LIWC analysis available yet</p>
                      )}
                    </motion.div>
                  )
                })()}

                {/* Embedding Signal */}
                {(() => {
                  const embeddingSignal = dataPointModal.signals.find(s => s.signalType === 'embedding')
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className={cn(
                        'p-4 rounded-xl border transition-all',
                        embeddingSignal
                          ? 'border-purple-200/60 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-900/20'
                          : 'border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <Network className="w-4 h-4 text-white" strokeWidth={2} />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-semibold text-gray-900 dark:text-white">Embedding Similarity</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Semantic trait comparison</p>
                          </div>
                        </div>
                        <span className={cn(
                          'px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide',
                          embeddingSignal ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        )}>
                          30%
                        </span>
                      </div>

                      {embeddingSignal ? (
                        <>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-[11px] mb-1.5">
                                <span className="text-gray-600 dark:text-gray-400">Score</span>
                                <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{Math.round(embeddingSignal.score * 100)}%</span>
                              </div>
                              <div className="h-2 bg-purple-200/60 dark:bg-purple-900/30 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${embeddingSignal.score * 100}%` }}
                                  transition={{ duration: 0.5, ease: 'easeOut' }}
                                  className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full"
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Conf.</p>
                              <p className="text-[13px] font-semibold text-purple-600 dark:text-purple-400 tabular-nums">{Math.round(embeddingSignal.confidence * 100)}%</p>
                            </div>
                          </div>

                          {embeddingSignal.prototypeSimilarity !== null && (
                            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg border border-purple-200/60 dark:border-purple-800/40">
                              <p className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 mb-1.5 uppercase tracking-wide">Prototype Similarity</p>
                              <p className="text-[11px] text-purple-600 dark:text-purple-400">
                                Your messages are <span className="font-semibold tabular-nums">{Math.round(embeddingSignal.prototypeSimilarity * 100)}%</span> similar to typical "{dataPointModal.domainName}" expressions
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 italic">No embedding analysis available yet</p>
                      )}
                    </motion.div>
                  )
                })()}

                {/* LLM Signal */}
                {(() => {
                  const llmSignal = dataPointModal.signals.find(s => s.signalType === 'llm')
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.25 }}
                      className={cn(
                        'p-4 rounded-xl border transition-all',
                        llmSignal
                          ? 'border-blue-200/60 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-900/20'
                          : 'border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Zap className="w-4 h-4 text-white" strokeWidth={2} />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-semibold text-gray-900 dark:text-white">LLM Deep Analysis</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">AI-powered semantic understanding (most reliable)</p>
                          </div>
                        </div>
                        <span className={cn(
                          'px-2 py-1 rounded-md text-[10px] font-semibold',
                          llmSignal
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        )}>
                          Weight: 50%
                        </span>
                      </div>

                      {llmSignal ? (
                        <>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-[11px] mb-1.5">
                                <span className="text-gray-600 dark:text-gray-400">Score</span>
                                <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{Math.round(llmSignal.score * 100)}%</span>
                              </div>
                              <div className="h-2 bg-blue-200/50 dark:bg-blue-900/30 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${llmSignal.score * 100}%` }}
                                  transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
                                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">Confidence</p>
                              <p className="text-[13px] font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{Math.round(llmSignal.confidence * 100)}%</p>
                            </div>
                          </div>

                          {llmSignal.evidenceText && (
                            <div className="p-3 bg-white/60 dark:bg-gray-800/40 rounded-lg border border-blue-200/50 dark:border-blue-700/30">
                              <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">LLM Reasoning</p>
                              <p className="text-[12px] text-blue-700 dark:text-blue-300 italic leading-relaxed">"{llmSignal.evidenceText}"</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-[12px] text-gray-500 dark:text-gray-400 italic">
                          <p>LLM analysis not yet triggered</p>
                          <p className="text-[10px] mt-1 text-gray-400 dark:text-gray-500">Runs after every 5 messages or 5 minutes</p>
                        </div>
                      )}
                    </motion.div>
                  )
                })()}
              </div>

              {/* Calculation Explanation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl border border-gray-200/60 dark:border-gray-700/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Calculator className="w-3 h-3 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                  </div>
                  <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">How the Final Score is Calculated</p>
                </div>
                <div className="text-[12px] text-gray-600 dark:text-gray-300 space-y-2">
                  <p className="font-mono text-[11px] bg-white/60 dark:bg-gray-900/40 px-3 py-2 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                    Final = (LIWC × 0.2 × conf) + (Embedding × 0.3 × conf) + (LLM × 0.5 × conf)
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    Each signal's weight is multiplied by its confidence. Higher confidence signals have more influence on the final score.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-800/80 rounded-b-2xl">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {dataPointModal.signals.length === 0
                  ? 'Start chatting to generate analysis signals'
                  : `${dataPointModal.signals.length} signal(s) active`}
              </p>
              <motion.button
                onClick={() => setDataPointModal(null)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[12px] font-medium rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
