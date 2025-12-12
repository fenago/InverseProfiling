/**
 * Domain Reference Data
 * Centralized metadata for all 39 psychological domains from Fine-Tuned-Psychometrics.md PRD
 * Used by ProfileDashboard for displaying domain information
 */

import type { PsychologicalDomain } from './analysis-config'
import { PSYCHOLOGICAL_DOMAINS, DOMAIN_CATEGORIES } from './analysis-config'
import { TRAIT_PROTOTYPE_TEXTS } from './trait-prototypes'

/**
 * Metadata for a psychological domain
 */
export interface DomainMetadata {
  id: PsychologicalDomain
  name: string
  category: string
  description: string
  psychometricSource: string
  markers: string[]
  prototypeTexts: string[]
}

/**
 * Category display configuration (matches PRD categories)
 */
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Core Personality (Big Five)': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'Dark Personality': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'Emotional/Social Intelligence': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Decision Making & Motivation': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Values & Wellbeing': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Cognitive/Learning': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Social/Cultural/Values': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Sensory/Aesthetic': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
}

/**
 * Domain colors for charts - all 39 domains
 */
export const DOMAIN_COLORS: Record<PsychologicalDomain, string> = {
  // Category A: Core Personality - Big Five (Domains 1-5)
  big_five_openness: '#8b5cf6',
  big_five_conscientiousness: '#3b82f6',
  big_five_extraversion: '#f59e0b',
  big_five_agreeableness: '#10b981',
  big_five_neuroticism: '#ef4444',

  // Category B: Dark Personality (Domains 6-8)
  dark_triad_narcissism: '#991b1b',
  dark_triad_machiavellianism: '#7f1d1d',
  dark_triad_psychopathy: '#450a0a',

  // Category C: Emotional/Social Intelligence (Domains 9-13)
  emotional_empathy: '#e879f9',
  emotional_intelligence: '#db2777',
  attachment_style: '#f472b6',
  love_languages: '#be185d',
  communication_style: '#ec4899',

  // Category D: Decision Making & Motivation (Domains 14-20)
  risk_tolerance: '#f97316',
  decision_style: '#ea580c',
  time_orientation: '#d97706',
  achievement_motivation: '#ca8a04',
  self_efficacy: '#eab308',
  locus_of_control: '#4338ca',
  growth_mindset: '#22c55e',

  // Category E: Values & Wellbeing (Domains 21-26)
  personal_values: '#059669',
  interests: '#14b8a6',
  life_satisfaction: '#15803d',
  stress_coping: '#16a34a',
  social_support: '#0369a1',
  authenticity: '#9333ea',

  // Category F: Cognitive/Learning (Domains 27-32)
  cognitive_abilities: '#2563eb',
  creativity: '#c026d3',
  learning_styles: '#6366f1',
  information_processing: '#4f46e5',
  metacognition: '#7c3aed',
  executive_functions: '#0891b2',

  // Category G: Social/Cultural/Values (Domains 33-37)
  social_cognition: '#0d9488',
  political_ideology: '#64748b',
  cultural_values: '#475569',
  moral_reasoning: '#6b7280',
  work_career_style: '#78716c',

  // Category H: Sensory/Aesthetic (Domains 38-39)
  sensory_processing: '#a855f7',
  aesthetic_preferences: '#d946ef',
}

/**
 * Full domain metadata - all 39 domains from PRD
 */
export const DOMAIN_METADATA: Record<PsychologicalDomain, DomainMetadata> = {
  // ============================================
  // Category A: Core Personality - Big Five (Domains 1-5)
  // ============================================
  big_five_openness: {
    id: 'big_five_openness',
    name: 'Openness to Experience',
    category: 'Core Personality (Big Five)',
    description: 'Reflects intellectual curiosity, creativity, and preference for novelty. High scorers are imaginative, artistic, and open to new experiences.',
    psychometricSource: 'Big Five / NEO-PI-R (Costa & McCrae, 1992)',
    markers: ['Curiosity language', 'Abstract concepts', 'Creative references', 'Novelty seeking', 'Imaginative expressions'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.big_five_openness,
  },
  big_five_conscientiousness: {
    id: 'big_five_conscientiousness',
    name: 'Conscientiousness',
    category: 'Core Personality (Big Five)',
    description: 'Reflects self-discipline, organization, and goal-directed behavior. High scorers are reliable, hardworking, and achievement-oriented.',
    psychometricSource: 'Big Five / NEO-PI-R (Costa & McCrae, 1992)',
    markers: ['Planning language', 'Goal references', 'Organization words', 'Commitment expressions', 'Detail focus'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.big_five_conscientiousness,
  },
  big_five_extraversion: {
    id: 'big_five_extraversion',
    name: 'Extraversion',
    category: 'Core Personality (Big Five)',
    description: 'Reflects sociability, assertiveness, and positive emotionality. High scorers are outgoing, energetic, and seek stimulation from others.',
    psychometricSource: 'Big Five / NEO-PI-R (Costa & McCrae, 1992)',
    markers: ['Social words', 'Enthusiasm', 'Group references', 'Excitement language', 'Talkativeness'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.big_five_extraversion,
  },
  big_five_agreeableness: {
    id: 'big_five_agreeableness',
    name: 'Agreeableness',
    category: 'Core Personality (Big Five)',
    description: 'Reflects cooperativeness, trust, and concern for social harmony. High scorers are warm, friendly, and considerate.',
    psychometricSource: 'Big Five / NEO-PI-R (Costa & McCrae, 1992)',
    markers: ['Caring language', 'Trust words', 'Cooperation', 'Kindness expressions', 'Harmony focus'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.big_five_agreeableness,
  },
  big_five_neuroticism: {
    id: 'big_five_neuroticism',
    name: 'Neuroticism',
    category: 'Core Personality (Big Five)',
    description: 'Reflects emotional instability and tendency to experience negative emotions. High scorers are more prone to anxiety and stress.',
    psychometricSource: 'Big Five / NEO-PI-R (Costa & McCrae, 1992)',
    markers: ['Anxiety words', 'Worry language', 'Stress references', 'Negative emotions', 'Uncertainty'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.big_five_neuroticism,
  },

  // ============================================
  // Category B: Dark Personality (Domains 6-8)
  // ============================================
  dark_triad_narcissism: {
    id: 'dark_triad_narcissism',
    name: 'Narcissism',
    category: 'Dark Personality',
    description: 'Grandiosity, entitlement, and need for admiration. Includes superiority, self-focus, and expectation of special treatment.',
    psychometricSource: 'Dark Triad Dirty Dozen / NPI (Narcissistic Personality Inventory)',
    markers: ['Self-importance', 'Entitlement', 'Superiority', 'Special treatment', 'Admiration seeking'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.dark_triad_narcissism,
  },
  dark_triad_machiavellianism: {
    id: 'dark_triad_machiavellianism',
    name: 'Machiavellianism',
    category: 'Dark Personality',
    description: 'Strategic manipulation and exploitation of others for personal gain. Includes cynicism, moral flexibility, and strategic thinking.',
    psychometricSource: 'Dark Triad Dirty Dozen / MACH-IV',
    markers: ['Strategic words', 'Manipulation', 'Ends justify means', 'Cunning', 'Exploitation'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.dark_triad_machiavellianism,
  },
  dark_triad_psychopathy: {
    id: 'dark_triad_psychopathy',
    name: 'Psychopathy',
    category: 'Dark Personality',
    description: 'Callousness, impulsivity, and lack of empathy or remorse. Includes shallow affect and antisocial tendencies.',
    psychometricSource: 'Dark Triad Dirty Dozen / SRP (Self-Report Psychopathy Scale)',
    markers: ['Callous language', 'No remorse', 'Impulsive', 'Rule breaking', 'Indifference'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.dark_triad_psychopathy,
  },

  // ============================================
  // Category C: Emotional/Social Intelligence (Domains 9-13)
  // ============================================
  emotional_empathy: {
    id: 'emotional_empathy',
    name: 'Empathy',
    category: 'Emotional/Social Intelligence',
    description: 'Ability to understand and share the feelings of others. Includes both cognitive and affective empathy components.',
    psychometricSource: 'Empathy Quotient (EQ) / Interpersonal Reactivity Index (IRI)',
    markers: ['Understanding others', 'Feel what they feel', 'Perspective taking', 'Compassion', 'Shared feelings'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.emotional_empathy,
  },
  emotional_intelligence: {
    id: 'emotional_intelligence',
    name: 'Emotional Intelligence',
    category: 'Emotional/Social Intelligence',
    description: 'Ability to perceive, use, understand, and manage emotions effectively in self and others.',
    psychometricSource: 'MSCEIT (Mayer-Salovey-Caruso Emotional Intelligence Test)',
    markers: ['Emotion identification', 'Using emotions', 'Understanding emotions', 'Managing emotions', 'EQ references'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.emotional_intelligence,
  },
  attachment_style: {
    id: 'attachment_style',
    name: 'Attachment Style',
    category: 'Emotional/Social Intelligence',
    description: 'Pattern of relating to others in close relationships. Ranges from secure to anxious or avoidant attachment.',
    psychometricSource: 'ECR-R (Experiences in Close Relationships-Revised)',
    markers: ['Relationship comfort', 'Dependency', 'Closeness seeking', 'Abandonment concerns', 'Trust in relationships'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.attachment_style,
  },
  love_languages: {
    id: 'love_languages',
    name: 'Love Languages',
    category: 'Emotional/Social Intelligence',
    description: 'Preferred ways of giving and receiving love: words of affirmation, quality time, acts of service, physical touch, or gifts.',
    psychometricSource: 'Five Love Languages Assessment (Chapman)',
    markers: ['Affirmation words', 'Quality time', 'Acts of service', 'Physical touch', 'Gift references'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.love_languages,
  },
  communication_style: {
    id: 'communication_style',
    name: 'Communication Style',
    category: 'Emotional/Social Intelligence',
    description: 'Preferred approach to communication. DISC model: Dominant, Influential, Steady, or Conscientious.',
    psychometricSource: 'DISC Assessment / Communication Style Inventory',
    markers: ['Direct/indirect', 'Expressive/reserved', 'Detail orientation', 'Relationship focus', 'Pace preferences'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.communication_style,
  },

  // ============================================
  // Category D: Decision Making & Motivation (Domains 14-20)
  // ============================================
  risk_tolerance: {
    id: 'risk_tolerance',
    name: 'Risk Tolerance',
    category: 'Decision Making & Motivation',
    description: 'Willingness to take risks for potential gains. Includes financial, health, recreational, social, and ethical risk domains.',
    psychometricSource: 'DOSPERT (Domain-Specific Risk-Taking Scale)',
    markers: ['Risk words', 'Gambling language', 'Uncertainty comfort', 'Safety preferences', 'Adventure vs caution'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.risk_tolerance,
  },
  decision_style: {
    id: 'decision_style',
    name: 'Decision Style',
    category: 'Decision Making & Motivation',
    description: 'Preference for rational/analytical versus intuitive/experiential decision-making approaches.',
    psychometricSource: 'Rational-Experiential Inventory (REI)',
    markers: ['Analysis words', 'Intuition', 'Gut feeling', 'Data-driven', 'Logical reasoning'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.decision_style,
  },
  time_orientation: {
    id: 'time_orientation',
    name: 'Time Orientation',
    category: 'Decision Making & Motivation',
    description: 'Focus on past, present, or future. Includes hedonistic vs future-focused orientations.',
    psychometricSource: 'ZTPI (Zimbardo Time Perspective Inventory)',
    markers: ['Past references', 'Present focus', 'Future planning', 'Delayed gratification', 'Temporal language'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.time_orientation,
  },
  achievement_motivation: {
    id: 'achievement_motivation',
    name: 'Achievement Motivation',
    category: 'Decision Making & Motivation',
    description: 'Drive to accomplish challenging goals and excel. Need for achievement (nAch).',
    psychometricSource: 'Achievement Motivation Inventory / TAT (McClelland)',
    markers: ['Success words', 'Goals', 'Excellence', 'Accomplishment', 'Competitive language'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.achievement_motivation,
  },
  self_efficacy: {
    id: 'self_efficacy',
    name: 'Self-Efficacy',
    category: 'Decision Making & Motivation',
    description: 'Belief in one\'s capability to execute behaviors necessary to produce specific outcomes.',
    psychometricSource: 'GSE (General Self-Efficacy Scale)',
    markers: ['I can', 'Confidence', 'Capability', 'Handle challenges', 'Ability beliefs'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.self_efficacy,
  },
  locus_of_control: {
    id: 'locus_of_control',
    name: 'Locus of Control',
    category: 'Decision Making & Motivation',
    description: 'Belief about whether outcomes are controlled by self (internal) or external forces (luck, fate, others).',
    psychometricSource: 'Rotter\'s Locus of Control Scale',
    markers: ['Control words', 'Destiny', 'My choice', 'Luck/fate', 'Responsibility'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.locus_of_control,
  },
  growth_mindset: {
    id: 'growth_mindset',
    name: 'Growth Mindset',
    category: 'Decision Making & Motivation',
    description: 'Belief that abilities can be developed through dedication and hard work, versus fixed intelligence.',
    psychometricSource: 'Implicit Theories of Intelligence Scale (Dweck)',
    markers: ['Effort words', 'Learning', 'Improve', 'Grow', 'Develop abilities'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.growth_mindset,
  },

  // ============================================
  // Category E: Values & Wellbeing (Domains 21-26)
  // ============================================
  personal_values: {
    id: 'personal_values',
    name: 'Personal Values',
    category: 'Values & Wellbeing',
    description: 'Core values guiding behavior and decisions. Schwartz\'s 10 values: self-direction, stimulation, hedonism, achievement, power, security, conformity, tradition, benevolence, universalism.',
    psychometricSource: 'Schwartz Portrait Values Questionnaire (PVQ)',
    markers: ['Value statements', 'Important to me', 'What matters', 'Priorities', 'Principles'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.personal_values,
  },
  interests: {
    id: 'interests',
    name: 'Vocational Interests',
    category: 'Values & Wellbeing',
    description: 'Career and activity interests based on RIASEC model: Realistic, Investigative, Artistic, Social, Enterprising, Conventional.',
    psychometricSource: 'Holland Codes / Strong Interest Inventory',
    markers: ['Interest expressions', 'Enjoy doing', 'Career preferences', 'Activity types', 'Work environment'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.interests,
  },
  life_satisfaction: {
    id: 'life_satisfaction',
    name: 'Life Satisfaction',
    category: 'Values & Wellbeing',
    description: 'Overall cognitive evaluation of satisfaction with one\'s life as a whole.',
    psychometricSource: 'SWLS (Satisfaction with Life Scale)',
    markers: ['Satisfied words', 'Happy with life', 'Content', 'Fulfilled', 'Ideal life'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.life_satisfaction,
  },
  stress_coping: {
    id: 'stress_coping',
    name: 'Stress Coping',
    category: 'Values & Wellbeing',
    description: 'Strategies used to manage stress. Problem-focused vs emotion-focused coping approaches.',
    psychometricSource: 'Brief COPE / COPE Inventory',
    markers: ['Coping strategies', 'Deal with stress', 'Problem solving', 'Emotional support', 'Avoidance'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.stress_coping,
  },
  social_support: {
    id: 'social_support',
    name: 'Social Support',
    category: 'Values & Wellbeing',
    description: 'Perception of having supportive relationships from family, friends, and significant others.',
    psychometricSource: 'MSPSS (Multidimensional Scale of Perceived Social Support)',
    markers: ['Support words', 'Help available', 'People there', 'Network', 'Count on others'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.social_support,
  },
  authenticity: {
    id: 'authenticity',
    name: 'Authenticity',
    category: 'Values & Wellbeing',
    description: 'Living in accordance with one\'s true self and values rather than external expectations.',
    psychometricSource: 'Authenticity Scale (Wood et al.)',
    markers: ['True to self', 'Genuine', 'Real', 'Honest', 'Authentic living'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.authenticity,
  },

  // ============================================
  // Category F: Cognitive/Learning (Domains 27-32)
  // ============================================
  cognitive_abilities: {
    id: 'cognitive_abilities',
    name: 'Cognitive Abilities',
    category: 'Cognitive/Learning',
    description: 'General mental capabilities including verbal, numerical, and spatial reasoning abilities.',
    psychometricSource: 'Cognitive Ability Tests / g-factor assessments',
    markers: ['Analytical language', 'Reasoning', 'Problem solving', 'Understanding', 'Mental processing'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.cognitive_abilities,
  },
  creativity: {
    id: 'creativity',
    name: 'Creativity',
    category: 'Cognitive/Learning',
    description: 'Ability to generate novel and valuable ideas. Includes divergent thinking and creative achievement.',
    psychometricSource: 'CAQ (Creative Achievement Questionnaire) / TTCT',
    markers: ['Original ideas', 'Innovation', 'Imagination', 'Novel solutions', 'Creative expressions'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.creativity,
  },
  learning_styles: {
    id: 'learning_styles',
    name: 'Learning Styles',
    category: 'Cognitive/Learning',
    description: 'Preferred modalities for learning: Visual, Auditory, Read/Write, or Kinesthetic (VARK).',
    psychometricSource: 'VARK Questionnaire (Fleming)',
    markers: ['See/visualize', 'Hear/listen', 'Read/write', 'Do/practice', 'Learning preferences'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.learning_styles,
  },
  information_processing: {
    id: 'information_processing',
    name: 'Information Processing',
    category: 'Cognitive/Learning',
    description: 'Depth and style of cognitive processing. Deep vs shallow, fast vs deliberate processing.',
    psychometricSource: 'CSI (Cognitive Style Index) / Need for Cognition Scale',
    markers: ['Analyze', 'Consider', 'Think through', 'Process depth', 'Cognitive engagement'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.information_processing,
  },
  metacognition: {
    id: 'metacognition',
    name: 'Metacognition',
    category: 'Cognitive/Learning',
    description: 'Awareness and understanding of one\'s own thought processes. Thinking about thinking.',
    psychometricSource: 'MAI (Metacognitive Awareness Inventory)',
    markers: ['Self-reflection', 'Think about thinking', 'Strategy awareness', 'Monitoring comprehension', 'Self-regulation'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.metacognition,
  },
  executive_functions: {
    id: 'executive_functions',
    name: 'Executive Functions',
    category: 'Cognitive/Learning',
    description: 'Higher-order cognitive processes: inhibition, working memory, cognitive flexibility, planning.',
    psychometricSource: 'BRIEF (Behavior Rating Inventory of Executive Function)',
    markers: ['Planning words', 'Organizing', 'Self-control', 'Flexibility', 'Goal management'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.executive_functions,
  },

  // ============================================
  // Category G: Social/Cultural/Values (Domains 33-37)
  // ============================================
  social_cognition: {
    id: 'social_cognition',
    name: 'Social Cognition',
    category: 'Social/Cultural/Values',
    description: 'Ability to understand social situations, others\' mental states, and social dynamics (Theory of Mind).',
    psychometricSource: 'RMET (Reading the Mind in the Eyes Test)',
    markers: ['Understanding others', 'Social awareness', 'Mental state attribution', 'Perspective taking', 'Social dynamics'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.social_cognition,
  },
  political_ideology: {
    id: 'political_ideology',
    name: 'Political Ideology',
    category: 'Social/Cultural/Values',
    description: 'Political beliefs and moral foundations. Includes conservative-liberal spectrum and moral foundations.',
    psychometricSource: 'MFQ (Moral Foundations Questionnaire) / Political Compass',
    markers: ['Political language', 'Moral foundations', 'Liberal/conservative', 'Social issues', 'Authority/fairness'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.political_ideology,
  },
  cultural_values: {
    id: 'cultural_values',
    name: 'Cultural Values',
    category: 'Social/Cultural/Values',
    description: 'Cultural dimensions: individualism-collectivism, power distance, uncertainty avoidance, masculinity-femininity.',
    psychometricSource: 'Hofstede Cultural Dimensions / World Values Survey',
    markers: ['I vs We', 'Hierarchy', 'Group harmony', 'Individual achievement', 'Cultural norms'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.cultural_values,
  },
  moral_reasoning: {
    id: 'moral_reasoning',
    name: 'Moral Reasoning',
    category: 'Social/Cultural/Values',
    description: 'Level and style of moral thinking. Moral foundations: care, fairness, loyalty, authority, sanctity.',
    psychometricSource: 'DIT-2 (Defining Issues Test) / MFQ',
    markers: ['Right/wrong', 'Moral language', 'Justice', 'Fairness', 'Ethical reasoning'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.moral_reasoning,
  },
  work_career_style: {
    id: 'work_career_style',
    name: 'Work & Career Style',
    category: 'Social/Cultural/Values',
    description: 'Career anchors and work preferences: technical, managerial, autonomy, security, entrepreneurial, service.',
    psychometricSource: 'Career Anchors (Schein) / Strong Interest Inventory',
    markers: ['Career preferences', 'Work style', 'Job values', 'Professional identity', 'Work-life balance'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.work_career_style,
  },

  // ============================================
  // Category H: Sensory/Aesthetic (Domains 38-39)
  // ============================================
  sensory_processing: {
    id: 'sensory_processing',
    name: 'Sensory Processing',
    category: 'Sensory/Aesthetic',
    description: 'Sensitivity to sensory stimulation. Includes highly sensitive person traits and sensory processing patterns.',
    psychometricSource: 'HSP Scale (Highly Sensitive Person) / Sensory Profile',
    markers: ['Sensory words', 'Sensitivity', 'Overwhelmed', 'Notice details', 'Environmental awareness'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.sensory_processing,
  },
  aesthetic_preferences: {
    id: 'aesthetic_preferences',
    name: 'Aesthetic Preferences',
    category: 'Sensory/Aesthetic',
    description: 'Appreciation for and engagement with beauty, art, and aesthetic experiences.',
    psychometricSource: 'Aesthetic Fluency Scale / Art Preference Assessment',
    markers: ['Beauty words', 'Art appreciation', 'Style preferences', 'Aesthetic judgment', 'Visual harmony'],
    prototypeTexts: TRAIT_PROTOTYPE_TEXTS.aesthetic_preferences,
  },
}

/**
 * Get domain metadata by ID
 */
export function getDomainMetadata(domainId: PsychologicalDomain): DomainMetadata | undefined {
  return DOMAIN_METADATA[domainId]
}

/**
 * Get all domain metadata as array
 */
export function getAllDomainMetadata(): DomainMetadata[] {
  return PSYCHOLOGICAL_DOMAINS.map(id => DOMAIN_METADATA[id])
}

/**
 * Get domains by category
 */
export function getDomainsByCategory(category: string): DomainMetadata[] {
  const domainIds = DOMAIN_CATEGORIES[category] || []
  return domainIds.map(id => DOMAIN_METADATA[id])
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return Object.keys(DOMAIN_CATEGORIES)
}

/**
 * Format domain name from ID
 */
export function formatDomainName(domainId: string): string {
  const metadata = DOMAIN_METADATA[domainId as PsychologicalDomain]
  if (metadata) return metadata.name

  // Fallback: convert snake_case to Title Case
  return domainId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get category for a domain
 */
export function getDomainCategory(domainId: PsychologicalDomain): string {
  const metadata = DOMAIN_METADATA[domainId]
  return metadata?.category || 'Other'
}

/**
 * Get color for category styling
 */
export function getCategoryColor(category: string): { bg: string; text: string; border: string } {
  return CATEGORY_COLORS[category] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
}
