# Psychological Domain Markers & Data Points

## Source Confirmation

Per PRD Section 5.2 (F2: Inverse Profiling Engine) and Section 6.4:
> "Infers psychological traits from natural interaction without explicit testing"

All profiling data comes from **user interactions with the system**, including:
- Text input during conversations (IP-01, IP-02, IP-03, IP-04)
- Response patterns and timing
- Topic choices and engagement levels
- Optional audio/video analysis (IP-05, IP-06)

---

## Primary Analysis Framework: LIWC-Style Text Analysis

### LIWC Summary Variables (Composite Measures)

| Measure | Description | Components |
|---------|-------------|------------|
| **Analytical Thinking** | Formal, logical, hierarchical thinking | High articles, prepositions; Low personal pronouns, auxiliary verbs, conjunctions, adverbs, negations |
| **Clout** | Confidence and social status | High 1st person plural (we), 2nd person (you); Low 1st person singular (I), negations, hedging |
| **Authenticity** | Honest, personal, disclosing | High 1st person singular, exclusive words; Low negative emotion, motion words |
| **Emotional Tone** | Positive vs. negative affect | Ratio of positive to negative emotion words |

---

## Domain 1: Personality Traits (Big Five/OCEAN)

### Openness to Experience

**Markers:**
- Lexical diversity and vocabulary richness
- Use of insight words (think, know, consider)
- Abstract vs. concrete language ratio
- Perceptual process words (see, hear, feel)
- Creative and artistic references

**Data Points:**
| Feature | High Openness | Low Openness |
|---------|---------------|--------------|
| Word variety (TTR) | Higher type-token ratio | Lower type-token ratio |
| Articles | More frequent | Less frequent |
| Insight words | More frequent | Less frequent |
| Tentative words | More frequent | Less frequent |
| Exclusive words (but, except) | More frequent | Less frequent |
| Certainty words | Less frequent | More frequent |

### Conscientiousness

**Markers:**
- Achievement words (win, success, better)
- Work-related vocabulary
- Future tense usage
- Negations and inhibition words
- Organizational language

**Data Points:**
| Feature | High Conscientiousness | Low Conscientiousness |
|---------|------------------------|----------------------|
| Achievement words | More frequent | Less frequent |
| Work words | More frequent | Less frequent |
| Future focus | Higher | Lower |
| Negations | More frequent | Less frequent |
| Discrepancy words (should, would) | More frequent | Less frequent |
| Fillers (um, uh) | Less frequent | More frequent |

### Extraversion

**Markers:**
- Social process words (talk, friend, share)
- Positive emotion words
- First-person plural pronouns (we, us)
- Word count and verbosity
- Exclamation usage

**Data Points:**
| Feature | High Extraversion | Low Extraversion |
|---------|-------------------|------------------|
| Social words | More frequent | Less frequent |
| Positive emotion | More frequent | Less frequent |
| Word count | Higher | Lower |
| 1st person plural | More frequent | Less frequent |
| 1st person singular | Less frequent | More frequent |
| Questions asked | More frequent | Less frequent |

### Agreeableness

**Markers:**
- Affiliation words (ally, friend, social)
- Positive emotion words
- Assent words (agree, OK, yes)
- Family/friend references
- Politeness markers

**Data Points:**
| Feature | High Agreeableness | Low Agreeableness |
|---------|--------------------|--------------------|
| Positive emotion | More frequent | Less frequent |
| Negative emotion | Less frequent | More frequent |
| Swear words | Less frequent | More frequent |
| Affiliation words | More frequent | Less frequent |
| Anger words | Less frequent | More frequent |
| 2nd person pronouns | More frequent | Less frequent |

### Neuroticism (Emotional Stability)

**Markers:**
- Negative emotion words (anxiety, anger, sadness)
- First-person singular pronouns (I, me, my)
- Certainty vs. tentative language
- Health and body references
- Death and existential references

**Data Points:**
| Feature | High Neuroticism | Low Neuroticism |
|---------|------------------|-----------------|
| Negative emotion | More frequent | Less frequent |
| Anxiety words | More frequent | Less frequent |
| 1st person singular | More frequent | Less frequent |
| Tentative words | More frequent | Less frequent |
| Certainty words | Less frequent | More frequent |
| Health words | More frequent | Less frequent |

---

## Domain 2: Cognitive Abilities

**Markers:**
- Lexical sophistication (rare word usage)
- Sentence complexity and length
- Logical connectors usage
- Abstract reasoning language
- Working memory indicators (reference coherence)

**Data Points:**
| Feature | Indicator |
|---------|-----------|
| Average word length | General verbal intelligence |
| Words per sentence | Cognitive complexity |
| Subordinate clauses | Hierarchical thinking |
| Causal words (because, effect) | Causal reasoning |
| Quantifiers (few, many, more) | Numerical reasoning |
| Exclusive words (but, without, except) | Differentiation ability |
| Coherence across messages | Working memory |

---

## Domain 3: Emotional Intelligence

**Markers:**
- Emotion word diversity
- Emotion word specificity (granularity)
- Social awareness language
- Empathy expressions
- Emotional regulation language

**Data Points:**
| Component | Linguistic Features |
|-----------|---------------------|
| Self-awareness | Emotion vocabulary diversity, insight words |
| Self-regulation | Inhibition words, future-focused language |
| Motivation | Achievement words, drive words |
| Empathy | 2nd person pronouns, social process words |
| Social skills | Affiliation words, positive emotion, politeness |

**Emotion Granularity Measure:**
- Ratio of specific emotion words (frustrated, elated) vs. general (good, bad)
- Variety in emotional expression across contexts

---

## Domain 4: Values & Motivations (Schwartz Values)

**Markers:**
- Value-laden vocabulary
- Priority expressions
- Goal-oriented language
- Cultural reference patterns

**Data Points:**
| Value Dimension | Linguistic Markers |
|-----------------|-------------------|
| Self-Direction | Autonomy words, creative vocabulary, independence |
| Stimulation | Novelty words, excitement, variety expressions |
| Hedonism | Pleasure words, enjoyment, gratification |
| Achievement | Success words, competence, ambition |
| Power | Status words, control, dominance markers |
| Security | Safety words, stability, order |
| Conformity | Compliance words, rule references |
| Tradition | Heritage words, cultural references |
| Benevolence | Helping words, care, loyalty |
| Universalism | Equality words, justice, nature/environment |

---

## Domain 5: Moral Reasoning

**Markers:**
- Moral vocabulary (right, wrong, should, ought)
- Justice vs. care orientation
- Principled vs. conventional reasoning
- Moral foundation references

**Data Points:**
| Moral Foundation | Linguistic Markers |
|------------------|-------------------|
| Care/Harm | Suffering words, kindness, compassion |
| Fairness/Cheating | Justice, rights, equality, reciprocity |
| Loyalty/Betrayal | Group words, patriotism, sacrifice |
| Authority/Subversion | Respect, tradition, obedience |
| Sanctity/Degradation | Purity, sacred, disgust words |
| Liberty/Oppression | Freedom, autonomy, tyranny |

**Kohlberg Stage Indicators:**
| Stage | Language Patterns |
|-------|------------------|
| Pre-conventional | Self-interest, punishment avoidance |
| Conventional | Social norms, law and order |
| Post-conventional | Universal principles, individual rights |

---

## Domain 6: Decision-Making Styles

**Markers:**
- Deliberation language
- Intuition references
- Risk vocabulary
- Temporal orientation in choices

**Data Points:**
| Style | Linguistic Features |
|-------|---------------------|
| Rational | Cause/effect words, analytical language, comparison |
| Intuitive | Feeling words, gut references, certainty without evidence |
| Dependent | Social reference, advice-seeking, conformity |
| Avoidant | Delay words, uncertainty, hedging |
| Spontaneous | Present focus, speed references, urgency |

**Risk Orientation:**
| Orientation | Markers |
|-------------|---------|
| Risk-seeking | Opportunity words, gain focus, excitement |
| Risk-averse | Safety words, loss focus, caution, certainty |

---

## Domain 7: Creativity

**Markers:**
- Remote associations (unusual word combinations)
- Metaphor and analogy usage
- Novelty language
- Divergent thinking indicators

**Data Points:**
| Feature | Description |
|---------|-------------|
| Semantic distance | Average conceptual distance between words |
| Unusual word combinations | Frequency of rare collocations |
| Metaphor density | Ratio of figurative to literal language |
| Question diversity | Variety in question types |
| Idea fluency | Number of distinct concepts per response |
| Elaboration | Detail and development of ideas |

**Creativity Dictionary Terms:**
- Innovation words: innovative, inventive, original, novel, creative
- Imagination words: imagine, envision, dream, conceive
- Inspiration words: inspired, breakthrough, insight
- Artistic references: art, design, aesthetic

---

## Domain 8: Attachment & Relationships

**Markers:**
- Relationship vocabulary
- Proximity-seeking language
- Trust and intimacy words
- Social network references

**Data Points:**
| Attachment Style | Linguistic Markers |
|------------------|-------------------|
| Secure | Balanced self/other focus, positive social words, trust |
| Anxious/Preoccupied | High 1st person, relationship worry, reassurance-seeking |
| Avoidant/Dismissive | Low intimacy words, independence, distancing |
| Fearful/Disorganized | Inconsistent patterns, approach-avoidance language |

**Specific Indicators:**
| Feature | Secure | Insecure |
|---------|--------|----------|
| Trust words | High | Low |
| Intimacy words | Moderate | Extreme high or low |
| Independence words | Balanced | Extreme |
| Relationship anxiety | Low | High |

---

## Domain 9: Learning Styles (VARK + Processing)

**Markers:**
- Sensory preference language
- Information seeking patterns
- Processing style indicators

**Data Points:**
| Style | Linguistic Indicators |
|-------|----------------------|
| Visual | See, look, picture, imagine, visualize, diagram |
| Auditory | Hear, sound, tell, discuss, explain verbally |
| Read/Write | Read, write, list, note, text, define |
| Kinesthetic | Feel, touch, hands-on, practice, experience |

**Processing Preferences:**
| Style | Markers |
|-------|---------|
| Sequential | Step-by-step, first/then/next, ordered |
| Global | Big picture, overview, context-first |
| Active | Do, try, experiment, apply |
| Reflective | Think, consider, analyze, ponder |

---

## Domain 10: Information Processing

**Markers:**
- Processing depth indicators
- Attention allocation patterns
- Memory reference styles

**Data Points:**
| Dimension | Linguistic Features |
|-----------|---------------------|
| Processing depth | Elaboration, connections, abstract words |
| Processing speed | Response latency (behavioral) |
| Attention span | Topic coherence, completion |
| Selective attention | Focus maintenance, distraction response |

**Cognitive Load Indicators:**
| Load Level | Markers |
|------------|---------|
| Low | Fluent, complex sentences, elaboration |
| High | Shorter responses, simpler language, errors |

---

## Domain 11: Metacognition

**Markers:**
- Self-monitoring language
- Strategy awareness
- Knowledge calibration
- Reflection vocabulary

**Data Points:**
| Component | Linguistic Markers |
|-----------|-------------------|
| Planning | Goal words, strategy, approach, method |
| Monitoring | Check, verify, evaluate, track |
| Evaluation | Assess, judge, review, reflect |
| Debugging | Correct, fix, adjust, revise |

**Metacognitive Awareness Indicators:**
| Feature | High Metacognition | Low Metacognition |
|---------|-------------------|-------------------|
| "I think I..." | More frequent | Less frequent |
| Strategy talk | More frequent | Less frequent |
| Self-correction | More frequent | Less frequent |
| Uncertainty acknowledgment | Calibrated | Overconfident or underconfident |

---

## Domain 12: Executive Functions

**Markers:**
- Inhibition language
- Cognitive flexibility indicators
- Working memory proxies
- Planning language

**Data Points:**
| Function | Linguistic Indicators |
|----------|----------------------|
| Inhibition | Stop, resist, control, restrain, avoid |
| Shifting | Change, switch, adapt, flexible, alternatively |
| Updating | Remember, forget, recall, working on |
| Planning | Plan, organize, schedule, prepare, steps |

**Executive Dysfunction Markers:**
| Indicator | Pattern |
|-----------|---------|
| Perseveration | Topic repetition, stuck patterns |
| Distractibility | Topic jumping, incomplete thoughts |
| Impulsivity | Interrupting, premature responses |

---

## Domain 13: Communication Styles

**Markers:**
- Directness level
- Formality markers
- Assertiveness indicators
- Listening cues

**Data Points:**
| Style Dimension | High | Low |
|-----------------|------|-----|
| Directness | Imperative, clear statements | Hedging, indirect, suggestions |
| Formality | Formal vocabulary, full sentences | Casual, abbreviations, fragments |
| Assertiveness | Certainty, "I" statements, commands | Tentative, deferent, questions |
| Expressiveness | Emotion words, exclamations | Neutral, factual, restrained |

**Communication Pattern Analysis:**
| Pattern | Markers |
|---------|---------|
| Elaborate | Long responses, detail, examples |
| Succinct | Brief, to-the-point |
| High-context | Implicit, indirect, contextual |
| Low-context | Explicit, direct, detailed |

---

## Domain 14: Social Cognition

**Markers:**
- Theory of mind language
- Perspective-taking indicators
- Social inference language
- Attribution patterns

**Data Points:**
| Component | Linguistic Features |
|-----------|---------------------|
| Theory of Mind | "They think...", "She believes...", mental state verbs |
| Perspective taking | "From their view...", "In their shoes..." |
| Social inference | "They probably...", "That suggests..." |
| Attribution | Cause explanations for social behavior |

**Attribution Style:**
| Pattern | Internal | External |
|---------|----------|----------|
| Positive events | Self-credit | Situational |
| Negative events | Self-blame | Others/situation |

---

## Domain 15: Resilience & Coping

**Markers:**
- Coping strategy language
- Stress response indicators
- Recovery language
- Support-seeking patterns

**Data Points:**
| Coping Style | Linguistic Markers |
|--------------|-------------------|
| Problem-focused | Action words, plan, solve, fix, address |
| Emotion-focused | Feel, process, accept, support, vent |
| Avoidant | Avoid, ignore, distract, deny |
| Seeking support | Help, talk to, reach out, share |

**Resilience Indicators:**
| Factor | Markers |
|--------|---------|
| Optimism | Positive future, hope, opportunity |
| Self-efficacy | "I can", capability, confidence |
| Adaptability | Adjust, flexible, change approach |
| Purpose | Meaning, why, reason, purpose |

---

## Domain 16: Mindset (Growth vs. Fixed)

**Markers:**
- Effort vs. ability attribution
- Challenge response language
- Failure interpretation
- Learning orientation

**Data Points:**
| Mindset | Linguistic Markers |
|---------|-------------------|
| Growth | Effort, practice, learn, improve, yet, develop |
| Fixed | Talent, natural, born with, can't, always was |

**Specific Indicators:**
| Feature | Growth | Fixed |
|---------|--------|-------|
| Failure talk | Learning opportunity | Defining, permanent |
| Challenge response | Embrace, try | Avoid, defensive |
| Effort attribution | Key to success | Sign of lack |
| Comparison focus | Self-improvement | Others' performance |

---

## Domain 17: Psychopathology Indicators (Screening Only)

**Note:** For screening/flagging purposes only, not diagnosis.

**Markers:**
- Depression indicators
- Anxiety markers
- Thought disorder signs

**Data Points:**
| Condition | Linguistic Patterns |
|-----------|---------------------|
| Depression | Negative emotion, 1st person singular, absolutist words (always, never), past focus |
| Anxiety | Worry words, future focus, somatic references, tentative language |
| Thought disorder | Loose associations, tangentiality, neologisms |

**Risk Indicators:**
| Indicator | Markers |
|-----------|---------|
| Hopelessness | No future, pointless, never will |
| Self-harm | Explicit references, death words |
| Social isolation | Absent social words, withdrawal language |

---

## Domain 18: Political Ideology

**Markers:**
- Authority/hierarchy orientation
- In-group/out-group language
- Equality/inequality framing
- Moral foundation emphasis

**Data Points:**
| Orientation | Conservative Markers | Liberal Markers |
|-------------|---------------------|-----------------|
| Authority | Respect, tradition, order | Question, challenge, change |
| Group focus | In-group loyalty, us/them | Universal, equality, inclusion |
| Certainty | Higher certainty words | More nuance, complexity |
| Threat sensitivity | More threat words | Fewer threat words |
| Binding foundations | Loyalty, authority, sanctity | Care, fairness |

---

## Domain 19: Cultural Values (Hofstede Dimensions)

**Markers:**
- Collectivism vs. individualism
- Power distance indicators
- Uncertainty avoidance
- Long-term orientation

**Data Points:**
| Dimension | High | Low |
|-----------|------|-----|
| Individualism | I, personal, independence | We, group, harmony |
| Power Distance | Hierarchy, respect, status | Equality, challenge authority |
| Uncertainty Avoidance | Rules, structure, certainty | Ambiguity tolerance, flexibility |
| Long-term Orientation | Future, persistence, thrift | Present, tradition, immediate |
| Masculinity | Competition, success, assertive | Cooperation, quality of life, modest |

---

## Domain 20: Work & Career Style

**Markers:**
- Work orientation language
- Career value indicators
- Professional communication style
- Achievement motivation

**Data Points:**
| Orientation | Markers |
|-------------|---------|
| Career-focused | Advancement, success, achievement |
| Job-focused | Security, stability, balance |
| Calling-focused | Purpose, meaning, impact, contribution |

**Work Style Indicators:**
| Style | Linguistic Features |
|-------|---------------------|
| Independent | Solo, autonomous, self-directed |
| Collaborative | Team, together, joint |
| Structured | Process, procedure, organized |
| Flexible | Adapt, dynamic, fluid |

---

## Domain 21: Sensory Processing

**Markers:**
- Sensory vocabulary preferences
- Sensitivity indicators
- Stimulation seeking/avoiding

**Data Points:**
| Modality | Linguistic Markers |
|----------|-------------------|
| Visual | See, look, bright, colorful, picture |
| Auditory | Hear, sound, loud, quiet, tune |
| Kinesthetic | Feel, touch, rough, smooth, pressure |
| Olfactory | Smell, scent, fragrance |
| Gustatory | Taste, flavor, sweet, bitter |

**Sensitivity Level:**
| Level | Markers |
|-------|---------|
| High sensitivity | Intensity words, overwhelm, too much |
| Low sensitivity | Seeking words, more, intense, stimulation |

---

## Domain 22: Time Perspective (Zimbardo)

**Markers:**
- Temporal reference patterns
- Verb tense usage
- Planning vs. spontaneity

**Data Points:**
| Perspective | Linguistic Markers |
|-------------|-------------------|
| Past-Negative | Regret, should have, if only, mistakes |
| Past-Positive | Nostalgia, good times, memories, traditions |
| Present-Hedonistic | Now, enjoy, pleasure, experience, YOLO |
| Present-Fatalistic | Fate, destiny, whatever happens, no control |
| Future | Will, plan, goal, when I, going to |

**Temporal Language Ratio:**
- Past:Present:Future word ratio indicates orientation
- Verb tense distribution analysis

---

## Domain 23: Aesthetic Preferences

**Markers:**
- Beauty vocabulary
- Style preferences
- Artistic reference patterns

**Data Points:**
| Dimension | Markers |
|-----------|---------|
| Complexity preference | Simple vs. intricate, minimal vs. elaborate |
| Novelty preference | Classic, traditional vs. new, modern, avant-garde |
| Emotional resonance | Feeling words when discussing aesthetics |
| Sensory emphasis | Which sensory words dominate aesthetic discussion |

---

## Behavioral Data Points (Non-Linguistic)

### Interaction Patterns
| Data Point | Psychological Relevance |
|------------|------------------------|
| Response latency | Processing speed, deliberation |
| Message length | Extraversion, elaboration |
| Session duration | Engagement, interest |
| Return frequency | Attachment, habit |
| Time of interaction | Chronotype, routine |

### Engagement Metrics
| Data Point | Psychological Relevance |
|------------|------------------------|
| Topic diversity | Openness, curiosity |
| Question frequency | Learning orientation |
| Follow-up depth | Interest, persistence |
| Topic avoidance | Sensitivities, values |

---

## Confidence Scoring Thresholds

Per PRD requirements, confidence levels:

| Level | Range | Data Requirements |
|-------|-------|-------------------|
| Very Low | 0.0-0.2 | <5 relevant data points |
| Low | 0.2-0.4 | 5-15 data points |
| Moderate | 0.4-0.6 | 15-30 data points |
| High | 0.6-0.8 | 30-50 data points |
| Very High | 0.8-1.0 | >50 data points + consistency |

**Factors Affecting Confidence:**
1. Number of observations
2. Consistency across contexts
3. Temporal stability
4. Cross-validation between domains
5. Explicit vs. implicit indicators

---

## Implementation Priority (MVP)

### Phase 1 Focus: Big Five Personality

| Trait | Primary LIWC Categories |
|-------|------------------------|
| Openness | Articles, insight, tentative, exclusive |
| Conscientiousness | Achievement, work, future focus, negations |
| Extraversion | Social, positive emotion, word count, 1st plural |
| Agreeableness | Positive emotion, affiliation, assent |
| Neuroticism | Negative emotion, anxiety, 1st singular, health |

### Phase 2 Expansion
- Full 22-domain coverage
- Domain interaction modeling
- Temporal stability tracking
- Context-dependent adjustments

---

## References & Research Sources

1. LIWC (Linguistic Inquiry and Word Count) - Pennebaker et al.
2. Big Five Personality Trait linguistic correlates - various meta-analyses
3. Moral Foundations Theory - Haidt & Graham
4. Schwartz Values Theory
5. Zimbardo Time Perspective Inventory linguistic markers
6. Attachment style language patterns
7. Growth Mindset linguistic indicators - Dweck
8. Creativity assessment linguistic features - Runco & Jaeger
