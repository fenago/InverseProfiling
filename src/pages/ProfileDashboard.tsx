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
  ChevronRight,
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
import clsx from 'clsx'

// Domain Reference Type
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
  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'trends' | 'data' | 'reference'>('overview')

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

  // Graph visualization state for interactive hover
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<{ source: string; target: string; label: string } | null>(null)

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
            { key: 'type', label: 'Type', render: (v) => <span className={`px-2 py-0.5 rounded text-xs ${v === 'message' ? 'bg-blue-100 text-blue-700' : v === 'analysis' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{String(v)}</span> },
            { key: 'description', label: 'Description' },
            { key: 'timestamp', label: 'Time', render: (v) => new Date(v as string).toLocaleString() },
          ]
        case 'sessions':
          return [
            { key: 'id', label: 'Session ID', render: (v) => <span className="font-mono text-xs">{String(v).slice(0, 12)}...</span> },
            { key: 'startedAt', label: 'Started', render: (v) => new Date(v as string).toLocaleString() },
            { key: 'endedAt', label: 'Ended', render: (v) => v ? new Date(v as string).toLocaleString() : <span className="text-green-600">Active</span> },
            { key: 'messageCount', label: 'Messages' },
            { key: 'analysisComplete', label: 'Analyzed', render: (v) => v ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span> },
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
            { key: 'metadata', label: 'Meta', render: (v) => v ? <span className="text-xs text-gray-500">{JSON.stringify(v).slice(0, 30)}</span> : '-' },
          ]
        case 'graphByCategory':
          return [
            { key: 'predicate', label: 'Predicate Type', render: (v) => <span className="font-medium text-purple-700">{String(v).replace(/_/g, ' ')}</span> },
            { key: 'count', label: 'Count', render: (v) => <span className="font-mono">{String(v)}</span> },
            { key: 'triples', label: 'Sample', render: (v) => <span className="text-xs text-gray-500">{(v as Triple[])?.length || 0} triples shown</span> },
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
        <thead className="bg-gray-50">
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
              <tr key={rowIdx} className="hover:bg-gray-50">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 whitespace-nowrap text-gray-700">
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

  // Helper function to render interactive graph visualization
  function renderGraphVisualization(triples: Triple[]) {
    if (!triples || triples.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Network className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No graph data to visualize</p>
        </div>
      )
    }

    // Extract unique nodes from triples
    const nodeMap = new Map<string, { id: string; type: 'subject' | 'object'; connections: number }>()
    const edges: Array<{ source: string; target: string; label: string; metadata?: Record<string, unknown> }> = []

    triples.forEach(triple => {
      // Add subject node
      if (!nodeMap.has(triple.subject)) {
        nodeMap.set(triple.subject, { id: triple.subject, type: 'subject', connections: 0 })
      }
      nodeMap.get(triple.subject)!.connections++

      // Add object node
      if (!nodeMap.has(triple.object)) {
        nodeMap.set(triple.object, { id: triple.object, type: 'object', connections: 0 })
      }
      nodeMap.get(triple.object)!.connections++

      // Add edge
      edges.push({
        source: triple.subject,
        target: triple.object,
        label: triple.predicate,
        metadata: triple.metadata
      })
    })

    const nodes = Array.from(nodeMap.values())

    // Simple force-directed layout calculation
    const width = 800
    const height = 500
    const centerX = width / 2
    const centerY = height / 2

    // Position nodes in a circle with some randomness based on connections
    const nodePositions = new Map<string, { x: number; y: number }>()
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length
      const radius = 150 + (node.connections * 10)
      nodePositions.set(node.id, {
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 50
      })
    })

    // Color coding for node types
    const getNodeColor = (nodeId: string) => {
      if (nodeId.startsWith('user:')) return '#3b82f6' // blue
      if (nodeId.startsWith('topic:')) return '#8b5cf6' // purple
      if (nodeId.startsWith('domain:')) return '#10b981' // green
      if (nodeId.startsWith('concept:')) return '#f59e0b' // amber
      return '#6b7280' // gray
    }

    const getPredicateColor = (predicate: string) => {
      if (predicate === 'discusses' || predicate === 'interested_in') return '#3b82f6'
      if (predicate === 'belongs_to_domain') return '#10b981'
      if (predicate === 'correlates_with' || predicate === 'indicates') return '#8b5cf6'
      if (predicate === 'similar_to' || predicate === 'related_to') return '#f59e0b'
      return '#9ca3af'
    }

    return (
      <div className="relative border border-gray-200 rounded-lg bg-gray-50">
        {/* Legend */}
        <div className="absolute top-2 left-2 bg-white/90 rounded-lg p-2 text-xs shadow-sm z-10">
          <div className="font-medium mb-1">Node Types:</div>
          <div className="flex items-center gap-1 mb-0.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span> User</div>
          <div className="flex items-center gap-1 mb-0.5"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Topic</div>
          <div className="flex items-center gap-1 mb-0.5"><span className="w-3 h-3 rounded-full bg-green-500"></span> Domain</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Concept</div>
        </div>

        {/* Stats */}
        <div className="absolute top-2 right-2 bg-white/90 rounded-lg p-2 text-xs shadow-sm z-10">
          <div className="font-medium">{nodes.length} nodes</div>
          <div className="text-gray-500">{edges.length} edges</div>
        </div>

        {/* Hover tooltip */}
        {(hoveredNode || hoveredEdge) && (
          <div className="absolute bottom-2 left-2 right-2 bg-white rounded-lg p-3 shadow-lg z-20 border border-gray-200">
            {hoveredNode && (
              <div>
                <div className="font-medium text-sm mb-1">Node: {hoveredNode}</div>
                <div className="text-xs text-gray-500">
                  Type: {hoveredNode.split(':')[0] || 'unknown'} |
                  Connections: {nodeMap.get(hoveredNode)?.connections || 0}
                </div>
              </div>
            )}
            {hoveredEdge && (
              <div>
                <div className="font-medium text-sm mb-1">
                  <span className="text-blue-600">{hoveredEdge.source.split(':').pop()}</span>
                  <span className="mx-2 text-purple-600">{hoveredEdge.label.replace(/_/g, ' ')}</span>
                  <span className="text-green-600">{hoveredEdge.target.split(':').pop()}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {hoveredEdge.source} → {hoveredEdge.target}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SVG Graph */}
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="cursor-move">
          {/* Edges */}
          {edges.slice(0, 200).map((edge, i) => {
            const sourcePos = nodePositions.get(edge.source)
            const targetPos = nodePositions.get(edge.target)
            if (!sourcePos || !targetPos) return null

            const isHovered = hoveredEdge?.source === edge.source && hoveredEdge?.target === edge.target

            return (
              <g key={i}>
                <line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke={getPredicateColor(edge.label)}
                  strokeWidth={isHovered ? 3 : 1.5}
                  opacity={isHovered ? 1 : 0.6}
                  className="transition-all duration-150"
                  onMouseEnter={() => setHoveredEdge(edge)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  style={{ cursor: 'pointer' }}
                />
                {/* Edge label on hover */}
                {isHovered && (
                  <text
                    x={(sourcePos.x + targetPos.x) / 2}
                    y={(sourcePos.y + targetPos.y) / 2 - 5}
                    fontSize="10"
                    fill={getPredicateColor(edge.label)}
                    textAnchor="middle"
                    className="pointer-events-none font-medium"
                  >
                    {edge.label.replace(/_/g, ' ')}
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.slice(0, 100).map((node) => {
            const pos = nodePositions.get(node.id)
            if (!pos) return null

            const isHovered = hoveredNode === node.id
            const radius = 6 + Math.min(node.connections * 2, 12)

            return (
              <g key={node.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHovered ? radius + 4 : radius}
                  fill={getNodeColor(node.id)}
                  stroke={isHovered ? '#1f2937' : '#fff'}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                />
                {/* Node label */}
                <text
                  x={pos.x}
                  y={pos.y + radius + 12}
                  fontSize="9"
                  fill="#374151"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {node.id.split(':').pop()?.slice(0, 15) || node.id.slice(0, 15)}
                </text>
              </g>
            )
          })}
        </svg>

        {nodes.length > 100 && (
          <div className="text-center text-xs text-gray-500 py-2 bg-amber-50 rounded-b-lg">
            Showing first 100 nodes of {nodes.length} total
          </div>
        )}
      </div>
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
        return <Minus className="w-4 h-4 text-gray-400" />
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
      bgColor: 'bg-gray-100',
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Dashboard</h1>
          <p className="text-gray-500">
            Your psychological profile based on conversation analysis
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <RefreshCw
            className={clsx('w-4 h-4', isRefreshing && 'animate-spin')}
          />
          Refresh Analysis
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview', icon: Brain },
            { id: 'domains', label: 'All Domains', icon: Target },
            { id: 'trends', label: 'Trends', icon: Activity },
            { id: 'data', label: 'Data Inspector', icon: Database },
            { id: 'reference', label: 'Domain Reference', icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {profile?.totalMessages || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Words</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {profile?.totalWords?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vocabulary Richness</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analysis ? (analysis.vocabularyRichness * 100).toFixed(0) + '%' : '--'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Emotional Tone</p>
                  <p className="text-2xl font-bold text-gray-900">
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
            </div>
          </div>

          {/* Big Five Personality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Big Five Personality Profile
              </h2>
              {traits.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="trait" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                      />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Start chatting to build your profile</p>
                  </div>
                </div>
              )}
            </div>

            {/* Trait Details */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Trait Details
              </h2>
              <div className="space-y-4">
                {traits.length > 0 ? (
                  traits.map((trait) => (
                    <button
                      key={trait.trait}
                      onClick={() =>
                        setSelectedTrait(
                          selectedTrait === trait.trait ? null : trait.trait
                        )
                      }
                      className={clsx(
                        'w-full text-left p-4 rounded-lg border transition-colors',
                        selectedTrait === trait.trait
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {TRAIT_LABELS[trait.trait]}
                        </span>
                        <span className="text-sm text-gray-500">
                          {trait.score.toFixed(0)}/100
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${trait.score}%`,
                            backgroundColor: TRAIT_COLORS[trait.trait],
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          {getTraitDescription(trait.trait, trait.score)}
                        </span>
                        <span className="text-gray-400">
                          {(trait.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    No personality data yet. Have some conversations first!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Top 10 Domains Section */}
          {enhancedProfile?.domainScores && enhancedProfile.domainScores.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 10 by Score */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Top 10 Domains by Score
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Your highest scoring psychological traits (0-1 scale: 0.7+ = HIGH)
                </p>
                <div className="space-y-3">
                  {[...enhancedProfile.domainScores]
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10)
                    .map((domain, index) => {
                      const label = DOMAIN_LABELS[domain.domainId] || domain.domainId
                      const scoreColor = domain.score >= 0.7 ? 'text-emerald-600' : domain.score <= 0.3 ? 'text-rose-600' : 'text-amber-600'
                      return (
                        <div key={domain.domainId} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-400 w-6">#{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 truncate text-sm">{label}</span>
                              <span className={clsx('text-sm font-bold', scoreColor)}>
                                {(domain.score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${domain.score * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Top 10 by Confidence */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Gauge className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Top 10 Domains by Confidence
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Most reliably measured traits (based on available data)
                </p>
                <div className="space-y-3">
                  {[...enhancedProfile.domainScores]
                    .sort((a, b) => b.confidence - a.confidence)
                    .slice(0, 10)
                    .map((domain, index) => {
                      const label = DOMAIN_LABELS[domain.domainId] || domain.domainId
                      const confColor = domain.confidence >= 0.7 ? 'text-blue-600' : domain.confidence >= 0.4 ? 'text-amber-600' : 'text-gray-500'
                      return (
                        <div key={domain.domainId} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-400 w-6">#{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 truncate text-sm">{label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  Score: {(domain.score * 100).toFixed(0)}%
                                </span>
                                <span className={clsx('text-sm font-bold', confColor)}>
                                  {(domain.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all"
                                style={{ width: `${domain.confidence * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Trait History */}
          {selectedTrait && historyData.length > 1 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {TRAIT_LABELS[selectedTrait]} Over Time
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
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
            </div>
          )}

          {/* Linguistic Analysis */}
          {analysis && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Linguistic Patterns
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Avg Words/Sentence</p>
                  <p className="text-xl font-bold text-gray-900">
                    {analysis.avgWordsPerSentence.toFixed(1)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Cognitive Complexity</p>
                  <p className="text-xl font-bold text-gray-900">
                    {(analysis.cognitiveComplexity * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">I-references</p>
                  <p className="text-xl font-bold text-gray-900">
                    {analysis.categories.pronouns.i}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Social References</p>
                  <p className="text-xl font-bold text-gray-900">
                    {analysis.categories.social.family +
                      analysis.categories.social.friends +
                      analysis.categories.social.humans}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Phase 2: Database Stats Summary */}
          {dbStats && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary-600" />
                Data Storage Summary
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Vector DB</p>
                  <p className="text-2xl font-bold text-blue-900">{dbStats.vector.messageCount}</p>
                  <p className="text-xs text-blue-500">message embeddings</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Graph DB</p>
                  <p className="text-2xl font-bold text-purple-900">{dbStats.graph.totalTriples}</p>
                  <p className="text-xs text-purple-500">relationships</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">History</p>
                  <p className="text-2xl font-bold text-green-900">{dbStats.history.totalSnapshots}</p>
                  <p className="text-xs text-green-500">snapshots</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== DOMAINS TAB ==================== */}
      {activeTab === 'domains' && (
        <div className="space-y-6">
          {/* All Domain Scores */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-600" />
              All Domain Scores ({DOMAIN_REFERENCE.length} domains)
            </h2>

            {/* Legend explaining Score vs Confidence */}
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">How to Read Your Profile:</h4>

              {/* Score Range Legend */}
              <div className="mb-3 p-2 bg-white/60 rounded border border-blue-100">
                <p className="text-xs font-semibold text-gray-700 mb-1">Score Interpretation:</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-400"></span>
                    <span className="text-gray-600"><strong>0-30%</strong> = LOW (weak/absent)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-yellow-400"></span>
                    <span className="text-gray-600"><strong>40-60%</strong> = NEUTRAL (unknown/mixed)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-400"></span>
                    <span className="text-gray-600"><strong>70-100%</strong> = HIGH (strong indicators)</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Gauge className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Score (0-100%)</p>
                    <p className="text-gray-600">Your level on this trait based on conversation analysis.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Target className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Confidence</p>
                    <p className="text-gray-600">How sure we are. Low confidence = not enough data yet.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Markers Detected</p>
                    <p className="text-gray-600">Click any domain to see which linguistic patterns were found.</p>
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
                    <div
                      key={domain.domainId}
                      className={clsx(
                        'p-4 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer',
                        categoryColor?.border || 'border-gray-200',
                        expandedDomain === domain.domainId && 'ring-2 ring-primary-500'
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
                            <span className={clsx(
                              'inline-block px-2 py-0.5 rounded text-xs font-medium mb-1',
                              categoryColor.bg, categoryColor.text
                            )}>
                              {domainRef.category.charAt(0).toUpperCase() + domainRef.category.slice(1)}
                            </span>
                          )}
                          {/* Domain Name */}
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                            {domainRef.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          {trend && getTrendIcon(trend.trend)}
                          <Eye className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>

                      {/* Score Bar with Interpretation */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={clsx(
                            "font-medium",
                            (domain.confidence ?? 0) < 0.05 ? "text-gray-400 italic" : "text-gray-700"
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
                              return <span className="font-bold text-gray-400">—</span>
                            }

                            return (
                              <span className="font-bold text-gray-900">
                                {(score * 100).toFixed(0)}%
                                <span className="font-normal text-xs text-gray-500 ml-1">
                                  ({(low * 100).toFixed(0)}-{(high * 100).toFixed(0)}%)
                                </span>
                              </span>
                            )
                          })()}
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
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
                      <div className="mb-3 p-2 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600 flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Confidence
                          </span>
                          <span className={clsx('font-semibold', conf.color)}>
                            {((domain.confidence ?? 0) * 100).toFixed(0)}% - {conf.shortLabel}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={clsx('h-full rounded-full transition-all',
                              (domain.confidence ?? 0) >= 0.6 ? 'bg-green-500' :
                              (domain.confidence ?? 0) >= 0.4 ? 'bg-yellow-500' :
                              (domain.confidence ?? 0) >= 0.2 ? 'bg-orange-500' : 'bg-gray-400'
                            )}
                            style={{ width: `${(domain.confidence ?? 0) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{conf.description}</p>
                      </div>

                      {/* Markers - Clickable */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span className="flex items-center gap-1">
                            <CircleDot className="w-3 h-3" />
                            Data Points
                          </span>
                          <span className="font-medium text-gray-700">
                            {detectedMarkers} / {totalMarkers} detected
                          </span>
                        </div>
                        {domainRef.markers && domainRef.markers.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {domainRef.markers.slice(0, 3).map((marker, idx) => (
                              <span
                                key={idx}
                                className={clsx(
                                  'px-1.5 py-0.5 text-xs rounded border',
                                  idx < detectedMarkers
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-gray-50 text-gray-500 border-gray-200'
                                )}
                              >
                                {idx < detectedMarkers && '✓ '}{marker}
                              </span>
                            ))}
                            {domainRef.markers.length > 3 && (
                              <span className="px-1.5 py-0.5 text-primary-600 text-xs font-medium">
                                +{domainRef.markers.length - 3} more →
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Signal source indicators */}
                      {domainSignals[domain.domainId] && domainSignals[domain.domainId].length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-xs text-gray-500 mr-1">Sources:</span>
                          {domainSignals[domain.domainId].some(s => s.signalType === 'liwc') && (
                            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700 border border-blue-200" title="LIWC word-matching analysis">
                              L
                            </span>
                          )}
                          {domainSignals[domain.domainId].some(s => s.signalType === 'embedding') && (
                            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700 border border-purple-200" title="Semantic embedding similarity">
                              E
                            </span>
                          )}
                          {domainSignals[domain.domainId].some(s => s.signalType === 'llm') && (
                            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-700 border border-amber-200" title="AI deep analysis">
                              A
                            </span>
                          )}
                        </div>
                      )}

                      {/* Click hint */}
                      <p className="text-xs text-primary-500 font-medium flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Click to view all data points
                      </p>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Top Linguistic Features */}
          {enhancedProfile?.topFeatures && enhancedProfile.topFeatures.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Top Linguistic Features
              </h2>
              <div className="space-y-3">
                {enhancedProfile.topFeatures.slice(0, 10).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{feature.featureName ?? 'Unknown'}</span>
                        <span className="text-sm text-gray-500">{(feature.percentage ?? 0).toFixed(2)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                        <div
                          className="h-full bg-amber-400 rounded-full"
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
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Domain Comparison
              </h2>
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
                    <Bar dataKey="score" fill="#3b82f6" name="Score" />
                    <Bar dataKey="confidence" fill="#10b981" name="Confidence" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TRENDS TAB ==================== */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Profile Evolution Summary */}
          {evolution && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-primary-600" />
                Profile Evolution (Last 30 Days)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Snapshots</p>
                  <p className="text-2xl font-bold text-gray-900">{evolution.snapshots}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Domains Tracked</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(evolution.domains).length}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Significant Changes</p>
                  <p className="text-2xl font-bold text-gray-900">{evolution.significantChanges.length}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Profile Stability</p>
                  <p className="text-2xl font-bold text-gray-900">{(evolution.overallStability * 100).toFixed(0)}%</p>
                </div>
              </div>

              {/* Significant Changes */}
              {evolution.significantChanges.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Significant Changes</h3>
                  <div className="space-y-2">
                    {evolution.significantChanges.map((change, idx) => (
                      <div
                        key={idx}
                        className={clsx(
                          'flex items-center justify-between p-3 rounded-lg',
                          change.direction === 'up' ? 'bg-green-50' : 'bg-red-50'
                        )}
                      >
                        <span className="font-medium text-gray-900">
                          {DOMAIN_LABELS[change.domain] || change.domain}
                        </span>
                        <div className="flex items-center gap-2">
                          {change.direction === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span className={change.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
                            {change.direction === 'up' ? '+' : ''}{(change.change * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Domain Trends Grid */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              Domain Trends (7-Day Window)
            </h2>

            {/* Always show all domains from DOMAIN_REFERENCE with trend data when available */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className={clsx(
                      'p-4 rounded-lg border',
                      trend.dataPoints > 0 && trend.trend === 'improving' && 'border-green-200 bg-green-50',
                      trend.dataPoints > 0 && trend.trend === 'declining' && 'border-red-200 bg-red-50',
                      (trend.dataPoints === 0 || trend.trend === 'stable') && 'border-gray-200 bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {domainRef.name}
                      </span>
                      {trend.dataPoints > 0 ? getTrendIcon(trend.trend) : <Activity className="w-4 h-4 text-gray-300" />}
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {(trend.currentScore * 100).toFixed(0)}%
                      </span>
                      <span
                        className={clsx(
                          'text-sm font-medium',
                          trend.change > 0 && 'text-green-600',
                          trend.change < 0 && 'text-red-600',
                          trend.change === 0 && 'text-gray-500'
                        )}
                      >
                        {trend.change > 0 ? '+' : ''}{(trend.change * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {trend.dataPoints} data points • {getConfidenceLabel(trend.confidence, trend.dataPoints).shortLabel}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Trend History Chart */}
          {Object.keys(trends).length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Score History (Big Five)
              </h2>
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
                    <Line type="monotone" dataKey="big_five_openness" stroke="#8b5cf6" name="Openness" dot={false} />
                    <Line type="monotone" dataKey="big_five_conscientiousness" stroke="#3b82f6" name="Conscient." dot={false} />
                    <Line type="monotone" dataKey="big_five_extraversion" stroke="#f59e0b" name="Extraversion" dot={false} />
                    <Line type="monotone" dataKey="big_five_agreeableness" stroke="#10b981" name="Agreeable." dot={false} />
                    <Line type="monotone" dataKey="big_five_neuroticism" stroke="#ef4444" name="Neuroticism" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Dark Triad History Chart */}
          {Object.keys(trends).length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Score History (Dark Triad)
              </h2>
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
            </div>
          )}

          {/* Emotional Intelligence History Chart */}
          {Object.keys(trends).length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Score History (Emotional)
              </h2>
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
            </div>
          )}

          {/* Motivation & Decision Making History Chart */}
          {Object.keys(trends).length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Score History (Motivation & Decision-Making)
              </h2>
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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="motivation_achievement" stroke="#f59e0b" name="Achievement" dot={false} />
                    <Line type="monotone" dataKey="motivation_self_efficacy" stroke="#10b981" name="Self-Efficacy" dot={false} />
                    <Line type="monotone" dataKey="motivation_growth_mindset" stroke="#3b82f6" name="Growth Mind." dot={false} />
                    <Line type="monotone" dataKey="decision_risk_tolerance" stroke="#ef4444" name="Risk Tol." dot={false} />
                    <Line type="monotone" dataKey="decision_time_orientation" stroke="#8b5cf6" name="Time Orient." dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== DATA TAB ==================== */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Introduction */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary-600" />
              Data Inspector
            </h2>
            <p className="text-sm text-gray-600">
              Explore the four-database architecture storing your profile data. All data is stored locally in your browser - nothing leaves your device.
            </p>
          </div>

          {/* Phase 2 Database Stats - Enhanced Cards */}
          {dbStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Vector DB Card */}
              <div className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Network className="w-5 h-5" />
                    <h3 className="font-bold">TinkerBird Vector DB</h3>
                  </div>
                  <p className="text-xs text-blue-100">Semantic embeddings for similarity search</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Messages</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold text-sm">
                      {dbStats.vector.messageCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Topics</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold text-sm">
                      {dbStats.vector.topicCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Concepts</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold text-sm">
                      {dbStats.vector.conceptCount}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Total Embeddings: <span className="font-semibold text-blue-600">
                        {dbStats.vector.messageCount + dbStats.vector.topicCount + dbStats.vector.conceptCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graph DB Card */}
              <div className="bg-white rounded-xl border-2 border-purple-200 overflow-hidden">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-5 h-5" />
                    <h3 className="font-bold">LevelGraph DB</h3>
                  </div>
                  <p className="text-xs text-purple-100">Knowledge graph relationships</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Triples</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-bold text-sm">
                      {dbStats.graph.totalTriples}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">User-Topic Links</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-bold text-sm">
                      {dbStats.graph.userTopicCount}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Format: <span className="font-mono text-purple-600">Subject → Predicate → Object</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SQL.js History Card */}
              <div className="bg-white rounded-xl border-2 border-green-200 overflow-hidden">
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-5 h-5" />
                    <h3 className="font-bold">SQL.js History</h3>
                  </div>
                  <p className="text-xs text-green-100">Historical domain snapshots</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Snapshots</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold text-sm">
                      {dbStats.history.totalSnapshots}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Domains Tracked</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold text-sm">
                      {dbStats.history.domainsTracked}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Enables trend analysis and profile evolution
                    </div>
                  </div>
                </div>
              </div>

              {/* IndexedDB Card */}
              <div className="bg-white rounded-xl border-2 border-amber-200 overflow-hidden">
                <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="w-5 h-5" />
                    <h3 className="font-bold">IndexedDB (Dexie)</h3>
                  </div>
                  <p className="text-xs text-amber-100">Primary data storage</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Messages</span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-bold text-sm">
                      {profile?.totalMessages || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Analyses</span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-bold text-sm">
                      {profile?.totalMessages || 0}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      6 data stores (click below to inspect)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LevelGraph Knowledge Graph Visualization */}
          {graphVizData && (graphVizData.nodes.length > 0 || Object.keys(graphVizData.triplesByCategory).length > 0) && (
            <div className="bg-white rounded-xl border-2 border-purple-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Knowledge Graph Visualization
                    </h2>
                    <p className="text-sm text-gray-500">
                      Explore relationships in your LevelGraph database (Subject → Predicate → Object)
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Graph Node Legend */}
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-xs font-medium text-gray-600 mr-2">Node Types:</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">user</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">topic</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">domain</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">trait</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-rose-100 text-rose-700">behavior</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-cyan-100 text-cyan-700">concept</span>
                </div>

                {/* Simple Visual Graph - Nodes Display */}
                {graphVizData.nodes.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Network className="w-4 h-4" />
                      Graph Nodes ({graphVizData.nodes.length})
                    </h3>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {graphVizData.nodes.slice(0, 50).map((node) => {
                        const typeColors: Record<string, string> = {
                          user: 'bg-blue-100 text-blue-700 border-blue-200',
                          topic: 'bg-green-100 text-green-700 border-green-200',
                          domain: 'bg-purple-100 text-purple-700 border-purple-200',
                          trait: 'bg-amber-100 text-amber-700 border-amber-200',
                          behavior: 'bg-rose-100 text-rose-700 border-rose-200',
                          concept: 'bg-cyan-100 text-cyan-700 border-cyan-200',
                        }
                        const color = typeColors[node.type] || 'bg-gray-100 text-gray-700 border-gray-200'
                        return (
                          <div
                            key={node.id}
                            className={clsx(
                              'px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5',
                              color
                            )}
                          >
                            <CircleDot className="w-3 h-3" />
                            <span className="font-bold">{node.type}:</span>
                            <span className="truncate max-w-[120px]">{node.label}</span>
                          </div>
                        )
                      })}
                      {graphVizData.nodes.length > 50 && (
                        <span className="px-3 py-1.5 text-xs text-gray-500">
                          +{graphVizData.nodes.length - 50} more nodes...
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Relationships by Category */}
                {Object.keys(graphVizData.triplesByCategory).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Relationships by Type
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(graphVizData.triplesByCategory).map(([predicate, triples]) => {
                        const predicateColors: Record<string, string> = {
                          discusses: 'border-l-blue-500 bg-blue-50',
                          interested_in: 'border-l-blue-400 bg-blue-50',
                          belongs_to_domain: 'border-l-green-500 bg-green-50',
                          related_to: 'border-l-purple-500 bg-purple-50',
                          indicates: 'border-l-amber-500 bg-amber-50',
                          correlates_with: 'border-l-emerald-500 bg-emerald-50',
                          contradicts: 'border-l-red-500 bg-red-50',
                          values: 'border-l-violet-500 bg-violet-50',
                          believes: 'border-l-indigo-500 bg-indigo-50',
                        }
                        const color = predicateColors[predicate] || 'border-l-gray-400 bg-gray-50'
                        return (
                          <div
                            key={predicate}
                            className={clsx(
                              'p-3 rounded-r-lg border-l-4',
                              color
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-sm font-semibold text-gray-700">
                                {predicate}
                              </span>
                              <span className="px-2 py-0.5 bg-white/70 rounded text-xs font-bold text-gray-600">
                                {triples.length}
                              </span>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {triples.slice(0, 5).map((triple, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-gray-600 bg-white/50 p-1.5 rounded flex items-center gap-1"
                                >
                                  <span className="font-medium text-gray-800 truncate max-w-[100px]">
                                    {triple.subject.split(':')[1] || triple.subject}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span className="font-medium text-gray-800 truncate max-w-[100px]">
                                    {triple.object.split(':')[1] || triple.object}
                                  </span>
                                </div>
                              ))}
                              {triples.length > 5 && (
                                <div className="text-xs text-gray-400 italic">
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
                  <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border border-purple-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Recent Connections ({graphVizData.edges.length} total)
                    </h3>
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
                          return colors[type] || 'bg-gray-500'
                        }

                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100"
                          >
                            <div className="flex items-center gap-1.5">
                              <div className={clsx('w-2 h-2 rounded-full', getTypeColor(sourceType))} />
                              <span className="text-xs font-medium text-gray-700 max-w-[100px] truncate">
                                {sourceLabel}
                              </span>
                            </div>
                            <div className="flex-1 flex items-center gap-1">
                              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 via-purple-400 to-gray-300" />
                              <span className="px-2 py-0.5 bg-purple-100 rounded text-xs font-mono text-purple-700">
                                {edge.label}
                              </span>
                              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 via-purple-400 to-gray-300" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-700 max-w-[100px] truncate">
                                {targetLabel}
                              </span>
                              <div className={clsx('w-2 h-2 rounded-full', getTypeColor(targetType))} />
                            </div>
                          </div>
                        )
                      })}
                      {graphVizData.edges.length > 10 && (
                        <div className="text-center text-xs text-gray-500 py-1">
                          Showing 10 of {graphVizData.edges.length} connections
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {graphVizData.nodes.length === 0 && Object.keys(graphVizData.triplesByCategory).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No graph data yet. Start chatting to build your knowledge graph!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comprehensive Data Inspector Section */}
          <div className="bg-white rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setShowDataInspector(!showDataInspector)}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-blue-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Data Inspector
                  </h2>
                  <p className="text-sm text-gray-500">
                    View and explore all database stores (IndexedDB, Vector, Graph, SQL)
                  </p>
                </div>
              </div>
              {showDataInspector ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showDataInspector && (
              <div className="px-6 pb-6 border-t border-gray-100 space-y-6">
                {/* IndexedDB / Dexie.js Section */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HardDrive className="w-4 h-4 text-blue-500" />
                    <h3 className="font-semibold text-gray-800">IndexedDB (Dexie.js)</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{DEXIE_STORES.length} stores</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {DEXIE_STORES.map((store) => (
                      <button
                        type="button"
                        key={store.key}
                        onClick={() => openDataInspector(store.key, store.label)}
                        className="p-4 text-left rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 group-hover:text-blue-700">
                            {store.label}
                          </span>
                          <Database className="w-4 h-4 text-blue-400 group-hover:text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500">{store.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* TinkerBird Vector DB Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CircleDot className="w-4 h-4 text-purple-500" />
                    <h3 className="font-semibold text-gray-800">TinkerBird (Vector DB)</h3>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{VECTOR_STORES.length} stores</span>
                    {dbStats?.vector && (
                      <span className="text-xs text-gray-500 ml-2">{dbStats.vector.messageCount} embeddings</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {VECTOR_STORES.map((store) => (
                      <button
                        type="button"
                        key={store.key}
                        onClick={() => openDataInspector(store.key, store.label)}
                        className="p-4 text-left rounded-lg border border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 group-hover:text-purple-700">
                            {store.label}
                          </span>
                          <CircleDot className="w-4 h-4 text-purple-400 group-hover:text-purple-600" />
                        </div>
                        <p className="text-xs text-gray-500">{store.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* LevelGraph Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Network className="w-4 h-4 text-green-500" />
                    <h3 className="font-semibold text-gray-800">LevelGraph (Knowledge Graph)</h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{GRAPH_STORES.length} stores</span>
                    {dbStats?.graph && (
                      <span className="text-xs text-gray-500 ml-2">{dbStats.graph.totalTriples} triples</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {GRAPH_STORES.map((store) => (
                      <button
                        type="button"
                        key={store.key}
                        onClick={() => openDataInspector(store.key, store.label)}
                        className="p-4 text-left rounded-lg border border-green-200 hover:border-green-400 hover:bg-green-50 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 group-hover:text-green-700">
                            {store.label}
                          </span>
                          <Network className="w-4 h-4 text-green-400 group-hover:text-green-600" />
                        </div>
                        <p className="text-xs text-gray-500">{store.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SQL.js History Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-gray-800">SQL.js (Historical Data)</h3>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{SQL_STORES.length} stores</span>
                    {dbStats?.history && (
                      <span className="text-xs text-gray-500 ml-2">{dbStats.history.totalSnapshots} snapshots</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SQL_STORES.map((store) => (
                      <button
                        type="button"
                        key={store.key}
                        onClick={() => openDataInspector(store.key, store.label)}
                        className="p-4 text-left rounded-lg border border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 group-hover:text-amber-700">
                            {store.label}
                          </span>
                          <FileText className="w-4 h-4 text-amber-400 group-hover:text-amber-600" />
                        </div>
                        <p className="text-xs text-gray-500">{store.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== REFERENCE TAB ==================== */}
      {activeTab === 'reference' && (
        <div className="space-y-6">
          {/* Introduction */}
          <div className="bg-gradient-to-r from-primary-50 to-violet-50 rounded-xl p-6 border border-primary-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary-600" />
              Psychological Domain Reference
            </h2>
            <p className="text-gray-600 mb-3">
              This reference documents all {DOMAIN_REFERENCE.length} psychological domains tracked in your profile.
              Each domain is derived from established psychometric research and detected through linguistic markers in your conversations.
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
                <span key={category} className={clsx('px-3 py-1 rounded-full text-xs font-medium', colors.bg, colors.text)}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              ))}
            </div>
          </div>

          {/* Domain Cards - Full Reference */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {DOMAIN_REFERENCE.map((domain) => {
              const categoryColor = CATEGORY_COLORS[domain.category]
              return (
                <div
                  key={domain.id}
                  className={clsx(
                    'bg-white rounded-xl p-6 border-2 shadow-sm',
                    categoryColor?.border || 'border-gray-200'
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={clsx(
                        'inline-block px-2 py-0.5 rounded text-xs font-medium mb-2',
                        categoryColor?.bg, categoryColor?.text
                      )}>
                        {domain.category.charAt(0).toUpperCase() + domain.category.slice(1)}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">{domain.name}</h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4">{domain.description}</p>

                  {/* Psychometric Source */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Psychometric Source</p>
                    <p className="text-sm font-medium text-gray-700">{domain.psychometricSource}</p>
                  </div>

                  {/* Markers */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Linguistic Markers ({domain.markers.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {domain.markers.map((marker, idx) => (
                        <span
                          key={idx}
                          className={clsx('px-2 py-1 rounded text-xs', categoryColor?.bg, categoryColor?.text)}
                        >
                          {marker}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Data Points */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Data Points ({domain.dataPoints.length})</p>
                    <div className="space-y-2">
                      {domain.dataPoints.map((dp, idx) => (
                        <div key={idx} className="text-xs bg-gray-50 rounded p-2">
                          <span className="font-medium text-gray-800">{dp.feature}</span>
                          {dp.indicator && (
                            <span className="text-gray-500 ml-2">→ {dp.indicator}</span>
                          )}
                          {dp.high && dp.low && (
                            <div className="mt-1 flex gap-4">
                              <span className="text-green-600">↑ {dp.high}</span>
                              <span className="text-orange-600">↓ {dp.low}</span>
                            </div>
                          )}
                          {dp.growth && dp.fixed && (
                            <div className="mt-1 flex gap-4">
                              <span className="text-green-600">Growth: {dp.growth}</span>
                              <span className="text-orange-600">Fixed: {dp.fixed}</span>
                            </div>
                          )}
                          {dp.conservative && dp.liberal && (
                            <div className="mt-1 flex gap-4">
                              <span className="text-blue-600">Conservative: {dp.conservative}</span>
                              <span className="text-purple-600">Liberal: {dp.liberal}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Research Sources */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Foundation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">Big Five Personality</p>
                <p className="text-gray-600 text-xs">Costa & McCrae (1992) NEO-PI-R</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">LIWC Research</p>
                <p className="text-gray-600 text-xs">Pennebaker et al. Linguistic Inquiry & Word Count</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">Moral Foundations</p>
                <p className="text-gray-600 text-xs">Haidt & Graham Moral Foundations Theory</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">Schwartz Values</p>
                <p className="text-gray-600 text-xs">Schwartz Theory of Basic Human Values</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">Time Perspective</p>
                <p className="text-gray-600 text-xs">Zimbardo Time Perspective Inventory (ZTPI)</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">Mindset Theory</p>
                <p className="text-gray-600 text-xs">Dweck Implicit Theories of Intelligence</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Inspector Modal */}
      {inspectorModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {inspectorModal.title}
                </h3>
                {inspectorModal.data && (
                  <span className="text-sm text-gray-500">
                    ({inspectorModal.data.length} records)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* View Mode Tabs */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setInspectorModal({ ...inspectorModal, viewMode: 'table' })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      inspectorModal.viewMode === 'table'
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setInspectorModal({ ...inspectorModal, viewMode: 'json' })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      inspectorModal.viewMode === 'json'
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    JSON
                  </button>
                  {/* Graph view only for LevelDB stores */}
                  {(inspectorModal.storeKey === 'graphTriples' || inspectorModal.storeKey === 'graphByCategory') && (
                    <button
                      onClick={() => setInspectorModal({ ...inspectorModal, viewMode: 'graph' })}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        inspectorModal.viewMode === 'graph'
                          ? 'bg-white text-primary-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Graph
                    </button>
                  )}
                </div>
                <button
                  onClick={() =>
                    setInspectorModal({ isOpen: false, title: '', data: null, loading: false, storeKey: null, viewMode: 'table' })
                  }
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              {inspectorModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                </div>
              ) : inspectorModal.data && inspectorModal.data.length > 0 ? (
                <>
                  {/* TABLE VIEW */}
                  {inspectorModal.viewMode === 'table' && (
                    <div className="overflow-x-auto">
                      {renderDataTable(inspectorModal.data, inspectorModal.storeKey)}
                    </div>
                  )}

                  {/* JSON VIEW */}
                  {inspectorModal.viewMode === 'json' && (
                    <pre className="text-xs font-mono bg-gray-50 p-4 rounded-lg overflow-auto whitespace-pre-wrap max-h-[60vh] border border-gray-200">
                      {JSON.stringify(inspectorModal.data, null, 2)}
                    </pre>
                  )}

                  {/* GRAPH VIEW - Interactive visualization for LevelDB */}
                  {inspectorModal.viewMode === 'graph' && (inspectorModal.storeKey === 'graphTriples' || inspectorModal.storeKey === 'graphByCategory') && (
                    <div className="relative">
                      {renderGraphVisualization(inspectorModal.data as Triple[])}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No data in this store</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <p className="text-xs text-gray-500">
                Data is stored locally in IndexedDB
              </p>
              <button
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
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Download JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Point Details Modal - Shows HOW scores are computed */}
      {dataPointModal?.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-violet-50 rounded-t-xl">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary-600" />
                  {dataPointModal.domainName}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {dataPointModal.domainDescription}
                </p>
              </div>
              <button
                onClick={() => setDataPointModal(null)}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-5">
              {/* Final Aggregated Score */}
              <div className={clsx(
                "mb-5 p-4 rounded-lg border",
                dataPointModal.finalConfidence < 0.05
                  ? "bg-gray-50 border-gray-200"
                  : "bg-gradient-to-r from-primary-100 to-violet-100 border-primary-200"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={clsx(
                      "text-sm font-semibold",
                      dataPointModal.finalConfidence < 0.05 ? "text-gray-600" : "text-primary-800"
                    )}>Final Aggregated Score</p>
                    <p className={clsx(
                      "text-xs mt-1",
                      dataPointModal.finalConfidence < 0.05 ? "text-gray-500" : "text-primary-600"
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
                        <p className="text-xl font-medium text-gray-400">
                          Pending
                        </p>
                        <p className="text-xs text-gray-400">
                          Awaiting analysis
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-primary-700">
                          {Math.round(dataPointModal.finalScore * 100)}%
                        </p>
                        <p className="text-xs text-primary-500">
                          Confidence: {Math.round(dataPointModal.finalConfidence * 100)}%
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3 h-3 bg-white/50 rounded-full overflow-hidden">
                  {dataPointModal.finalConfidence < 0.05 ? (
                    <div className="h-full bg-gray-300 rounded-full animate-pulse" style={{ width: '100%' }} />
                  ) : (
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full transition-all"
                      style={{ width: `${dataPointModal.finalScore * 100}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Analysis Methods Legend */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Hybrid Analysis Method (3 Signals):</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1 text-amber-600">
                    <FileText className="w-3 h-3" /> LIWC (20%) - Word Matching
                  </span>
                  <span className="flex items-center gap-1 text-purple-600">
                    <Network className="w-3 h-3" /> Embedding (30%) - Semantic Similarity
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <Zap className="w-3 h-3" /> LLM (50%) - Deep Analysis
                  </span>
                </div>
              </div>

              {/* Three Signal Cards */}
              <div className="space-y-4">
                {/* LIWC Signal */}
                {(() => {
                  const liwcSignal = dataPointModal.signals.find(s => s.signalType === 'liwc')
                  return (
                    <div className={clsx(
                      'p-4 rounded-lg border-2 transition-all',
                      liwcSignal ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'
                    )}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </span>
                          <div>
                            <h4 className="font-semibold text-gray-900">LIWC Analysis</h4>
                            <p className="text-xs text-gray-500">Dictionary-based word matching (fast)</p>
                          </div>
                        </div>
                        <span className={clsx(
                          'px-2 py-1 rounded text-xs font-medium',
                          liwcSignal ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                        )}>
                          Weight: 20%
                        </span>
                      </div>

                      {liwcSignal ? (
                        <>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600">Score</span>
                                <span className="font-semibold">{Math.round(liwcSignal.score * 100)}%</span>
                              </div>
                              <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full"
                                  style={{ width: `${liwcSignal.score * 100}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Confidence</p>
                              <p className="text-sm font-semibold text-amber-700">{Math.round(liwcSignal.confidence * 100)}%</p>
                            </div>
                          </div>

                          {liwcSignal.matchedWords && liwcSignal.matchedWords.length > 0 && (
                            <div className="p-2 bg-white/50 rounded border border-amber-200">
                              <p className="text-xs font-medium text-amber-700 mb-1">Matched Keywords:</p>
                              <div className="flex flex-wrap gap-1">
                                {liwcSignal.matchedWords.map((word, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800">
                                    "{word}"
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No LIWC analysis available yet</p>
                      )}
                    </div>
                  )
                })()}

                {/* Embedding Signal */}
                {(() => {
                  const embeddingSignal = dataPointModal.signals.find(s => s.signalType === 'embedding')
                  return (
                    <div className={clsx(
                      'p-4 rounded-lg border-2 transition-all',
                      embeddingSignal ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'
                    )}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                            <Network className="w-4 h-4 text-white" />
                          </span>
                          <div>
                            <h4 className="font-semibold text-gray-900">Embedding Similarity</h4>
                            <p className="text-xs text-gray-500">Semantic comparison with trait prototypes</p>
                          </div>
                        </div>
                        <span className={clsx(
                          'px-2 py-1 rounded text-xs font-medium',
                          embeddingSignal ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                        )}>
                          Weight: 30%
                        </span>
                      </div>

                      {embeddingSignal ? (
                        <>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600">Score</span>
                                <span className="font-semibold">{Math.round(embeddingSignal.score * 100)}%</span>
                              </div>
                              <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${embeddingSignal.score * 100}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Confidence</p>
                              <p className="text-sm font-semibold text-purple-700">{Math.round(embeddingSignal.confidence * 100)}%</p>
                            </div>
                          </div>

                          {embeddingSignal.prototypeSimilarity !== null && (
                            <div className="p-2 bg-white/50 rounded border border-purple-200">
                              <p className="text-xs font-medium text-purple-700 mb-1">Prototype Similarity:</p>
                              <p className="text-sm text-purple-800">
                                Your messages are {Math.round(embeddingSignal.prototypeSimilarity * 100)}% similar to typical "{dataPointModal.domainName}" expressions
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No embedding analysis available yet</p>
                      )}
                    </div>
                  )
                })()}

                {/* LLM Signal */}
                {(() => {
                  const llmSignal = dataPointModal.signals.find(s => s.signalType === 'llm')
                  return (
                    <div className={clsx(
                      'p-4 rounded-lg border-2 transition-all',
                      llmSignal ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                    )}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                          </span>
                          <div>
                            <h4 className="font-semibold text-gray-900">LLM Deep Analysis</h4>
                            <p className="text-xs text-gray-500">AI-powered semantic understanding (most reliable)</p>
                          </div>
                        </div>
                        <span className={clsx(
                          'px-2 py-1 rounded text-xs font-medium',
                          llmSignal ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        )}>
                          Weight: 50%
                        </span>
                      </div>

                      {llmSignal ? (
                        <>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600">Score</span>
                                <span className="font-semibold">{Math.round(llmSignal.score * 100)}%</span>
                              </div>
                              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${llmSignal.score * 100}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Confidence</p>
                              <p className="text-sm font-semibold text-blue-700">{Math.round(llmSignal.confidence * 100)}%</p>
                            </div>
                          </div>

                          {llmSignal.evidenceText && (
                            <div className="p-2 bg-white/50 rounded border border-blue-200">
                              <p className="text-xs font-medium text-blue-700 mb-1">LLM Reasoning:</p>
                              <p className="text-sm text-blue-800 italic">"{llmSignal.evidenceText}"</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          <p>LLM analysis not yet triggered</p>
                          <p className="text-xs mt-1">Runs after every 5 messages or 5 minutes</p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Calculation Explanation */}
              <div className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">How the Final Score is Calculated:</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Final Score = (LIWC × 0.2 × conf) + (Embedding × 0.3 × conf) + (LLM × 0.5 × conf)</p>
                  <p className="text-gray-500 mt-2">
                    Each signal's weight is multiplied by its confidence. Higher confidence signals have more influence on the final score.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <p className="text-xs text-gray-500">
                {dataPointModal.signals.length === 0
                  ? 'Start chatting to generate analysis signals'
                  : `${dataPointModal.signals.length} signal(s) active`}
              </p>
              <button
                onClick={() => setDataPointModal(null)}
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
