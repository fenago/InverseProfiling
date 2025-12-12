// Comprehensive LIWC-inspired word dictionaries for psychological analysis
// Based on LIWC research and domain-markers.md specifications

// === PRONOUNS ===
export const PRONOUNS = {
  first_person_singular: [
    'i', 'me', 'my', 'mine', 'myself', "i'm", "i've", "i'll", "i'd"
  ],
  first_person_plural: [
    'we', 'us', 'our', 'ours', 'ourselves', "we're", "we've", "we'll", "we'd"
  ],
  second_person: [
    'you', 'your', 'yours', 'yourself', 'yourselves', "you're", "you've", "you'll", "you'd"
  ],
  third_person_singular: [
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself'
  ],
  third_person_plural: [
    'they', 'them', 'their', 'theirs', 'themselves', "they're", "they've", "they'll", "they'd"
  ],
} as const

// === COGNITIVE PROCESSES ===
export const COGNITIVE = {
  insight: [
    'think', 'know', 'consider', 'understand', 'realize', 'believe', 'feel', 'sense',
    'thought', 'idea', 'concept', 'notion', 'aware', 'recognize', 'perceive', 'comprehend',
    'grasp', 'discover', 'notice', 'learn', 'remember', 'conclude', 'determine', 'figure',
    'analyze', 'ponder', 'contemplate', 'reflect', 'wonder', 'suspect', 'presume'
  ],
  causation: [
    'because', 'cause', 'effect', 'hence', 'therefore', 'thus', 'consequently',
    'result', 'reason', 'why', 'leads', 'creates', 'since', 'accordingly', 'due',
    'owing', 'produces', 'generates', 'triggers', 'stems', 'origins', 'basis',
    'makes', 'forces', 'compels', 'induces', 'provokes', 'brings'
  ],
  discrepancy: [
    'should', 'would', 'could', 'ought', 'need', 'must', 'want', 'wish',
    'hope', 'expect', 'desire', 'require', 'supposed', 'meant', 'intended'
  ],
  tentative: [
    'maybe', 'perhaps', 'might', 'possibly', 'probably', 'seems', 'appears',
    'guess', 'suppose', 'wonder', 'uncertain', 'unclear', 'likely', 'unlikely',
    'somewhat', 'almost', 'nearly', 'roughly', 'approximately', 'about', 'around',
    'fairly', 'rather', 'sort', 'kind', 'somehow'
  ],
  certainty: [
    'always', 'never', 'definitely', 'certainly', 'absolutely', 'completely',
    'totally', 'surely', 'undoubtedly', 'clearly', 'obviously', 'evidently',
    'truly', 'really', 'exactly', 'precisely', 'positively', 'unquestionably',
    'without doubt', 'for sure', 'guaranteed', 'inevitable', 'certain'
  ],
  differentiation: [
    'but', 'except', 'without', 'exclude', 'however', 'although', 'though',
    'unless', 'rather', 'instead', 'otherwise', 'alternatively', 'whereas',
    'unlike', 'contrary', 'nevertheless', 'nonetheless', 'yet', 'still',
    'besides', 'apart', 'aside', 'other than'
  ],
} as const

// === AFFECT/EMOTIONS ===
export const AFFECT = {
  positive_emotion: [
    'happy', 'joy', 'love', 'wonderful', 'great', 'amazing', 'excellent', 'good',
    'fantastic', 'beautiful', 'excited', 'grateful', 'thankful', 'pleased',
    'delighted', 'glad', 'cheerful', 'optimistic', 'hopeful', 'thrilled',
    'ecstatic', 'elated', 'content', 'satisfied', 'proud', 'confident',
    'enthusiastic', 'eager', 'peaceful', 'calm', 'serene', 'blessed',
    'fortunate', 'lucky', 'appreciate', 'admire', 'adore', 'enjoy', 'like',
    'fun', 'exciting', 'pleasant', 'nice', 'lovely', 'charming', 'perfect',
    'awesome', 'brilliant', 'superb', 'magnificent', 'marvelous', 'terrific'
  ],
  negative_emotion: [
    'sad', 'angry', 'hate', 'terrible', 'awful', 'bad', 'horrible', 'upset',
    'frustrated', 'annoyed', 'disappointed', 'worried', 'scared', 'fear',
    'anxious', 'stressed', 'depressed', 'lonely', 'hurt', 'miserable',
    'unhappy', 'gloomy', 'distressed', 'troubled', 'bothered', 'disturbed',
    'uncomfortable', 'uneasy', 'dismayed', 'disheartened', 'discouraged',
    'hopeless', 'helpless', 'worthless', 'useless', 'pathetic', 'regret',
    'sorry', 'guilty', 'ashamed', 'embarrassed', 'disgusted', 'sick'
  ],
  anxiety: [
    'worried', 'nervous', 'anxious', 'stress', 'panic', 'fear', 'scared',
    'tense', 'uneasy', 'overwhelmed', 'dread', 'apprehensive', 'frightened',
    'terrified', 'alarmed', 'distressed', 'agitated', 'restless', 'jittery',
    'edgy', 'on edge', 'freaking', 'paranoid', 'phobia', 'obsess'
  ],
  anger: [
    'angry', 'mad', 'furious', 'rage', 'hate', 'hostile', 'irritated',
    'annoyed', 'frustrated', 'aggravated', 'infuriated', 'enraged', 'livid',
    'outraged', 'resentful', 'bitter', 'indignant', 'offended', 'provoked',
    'exasperated', 'incensed', 'irate', 'fuming', 'seething'
  ],
  sadness: [
    'sad', 'depressed', 'unhappy', 'miserable', 'gloomy', 'melancholy',
    'sorrowful', 'heartbroken', 'devastated', 'grief', 'mourn', 'cry',
    'tears', 'weep', 'despair', 'hopeless', 'dejected', 'downcast',
    'dismal', 'bleak', 'forlorn', 'lonely', 'isolated', 'abandoned'
  ],
  joy: [
    'happy', 'joyful', 'elated', 'ecstatic', 'thrilled', 'delighted',
    'overjoyed', 'euphoric', 'blissful', 'cheerful', 'gleeful', 'merry',
    'jubilant', 'exuberant', 'radiant', 'beaming', 'grinning', 'laugh',
    'smile', 'giggle', 'chuckle', 'amused', 'entertained'
  ],
  trust: [
    'trust', 'believe', 'faith', 'confident', 'rely', 'depend', 'count on',
    'loyal', 'faithful', 'reliable', 'dependable', 'trustworthy', 'honest',
    'sincere', 'genuine', 'authentic', 'credible', 'believable'
  ],
  fear: [
    'fear', 'afraid', 'scared', 'terrified', 'frightened', 'horrified',
    'petrified', 'panicked', 'alarmed', 'startled', 'spooked', 'dread',
    'terror', 'horror', 'nightmare', 'phobia', 'intimidated', 'threatened'
  ],
  surprise: [
    'surprised', 'shocked', 'amazed', 'astonished', 'astounded', 'stunned',
    'startled', 'unexpected', 'unbelievable', 'incredible', 'wow', 'whoa',
    'omg', 'speechless', 'dumbfounded', 'flabbergasted'
  ],
  disgust: [
    'disgust', 'disgusted', 'revolted', 'repulsed', 'nauseated', 'sick',
    'gross', 'vile', 'nasty', 'foul', 'repugnant', 'loathsome', 'abhorrent',
    'offensive', 'appalling', 'horrifying', 'disturbing', 'sickening'
  ],
} as const

// === SOCIAL PROCESSES ===
export const SOCIAL = {
  family: [
    'mom', 'dad', 'mother', 'father', 'parent', 'parents', 'sister', 'brother',
    'family', 'son', 'daughter', 'child', 'children', 'grandma', 'grandpa',
    'grandmother', 'grandfather', 'aunt', 'uncle', 'cousin', 'nephew', 'niece',
    'sibling', 'relative', 'in-law', 'stepmother', 'stepfather', 'spouse',
    'husband', 'wife', 'marriage', 'married', 'wedding', 'divorce'
  ],
  friends: [
    'friend', 'friends', 'buddy', 'pal', 'companion', 'mate', 'colleague',
    'coworker', 'neighbor', 'acquaintance', 'bestie', 'bff', 'roommate',
    'classmate', 'teammate', 'partner', 'ally', 'confidant'
  ],
  social_general: [
    'person', 'people', 'human', 'humans', 'someone', 'anyone', 'everyone',
    'nobody', 'somebody', 'individual', 'group', 'team', 'community', 'society',
    'public', 'crowd', 'audience', 'population', 'citizen', 'member'
  ],
  affiliation: [
    'ally', 'together', 'share', 'join', 'belong', 'connect', 'bond',
    'unite', 'collaborate', 'cooperate', 'support', 'help', 'assist',
    'community', 'team', 'group', 'club', 'organization', 'association'
  ],
  achievement: [
    'win', 'success', 'accomplish', 'achieve', 'attain', 'earn', 'gain',
    'succeed', 'triumph', 'victory', 'master', 'excel', 'outperform',
    'complete', 'finish', 'graduate', 'promote', 'award', 'prize', 'medal',
    'champion', 'best', 'top', 'first', 'leader', 'expert'
  ],
  power: [
    'power', 'control', 'lead', 'authority', 'command', 'dominate', 'rule',
    'govern', 'manage', 'direct', 'boss', 'chief', 'head', 'superior',
    'influence', 'impact', 'force', 'strength', 'might', 'dominant'
  ],
} as const

// === DRIVES ===
export const DRIVES = {
  affiliation: [
    'together', 'share', 'join', 'belong', 'connect', 'bond', 'unite',
    'collaborate', 'cooperate', 'team', 'group', 'community', 'relationship',
    'friendship', 'companion', 'partner', 'ally', 'social', 'socialize'
  ],
  achievement: [
    'achieve', 'accomplish', 'success', 'win', 'goal', 'ambitious', 'strive',
    'excel', 'master', 'best', 'improve', 'progress', 'advance', 'develop',
    'grow', 'learn', 'skill', 'ability', 'capable', 'competent', 'efficient'
  ],
  power: [
    'power', 'control', 'influence', 'authority', 'lead', 'dominate', 'rule',
    'command', 'force', 'strength', 'impact', 'status', 'prestige', 'respect',
    'reputation', 'important', 'significant', 'powerful', 'strong'
  ],
  reward: [
    'reward', 'prize', 'bonus', 'benefit', 'gain', 'profit', 'win', 'earn',
    'receive', 'get', 'obtain', 'acquire', 'pleasure', 'enjoy', 'satisfy',
    'gratify', 'indulge', 'treat', 'luxury', 'comfort'
  ],
  risk: [
    'risk', 'danger', 'threat', 'hazard', 'gamble', 'bet', 'chance', 'dare',
    'venture', 'adventure', 'uncertain', 'unpredictable', 'volatile', 'risky',
    'dangerous', 'precarious', 'perilous', 'unsafe'
  ],
} as const

// === TIME ORIENTATION ===
export const TIME = {
  past_focus: [
    'was', 'were', 'had', 'been', 'did', 'used to', 'ago', 'yesterday',
    'before', 'previously', 'earlier', 'once', 'former', 'past', 'history',
    'memory', 'remember', 'recall', 'nostalgia', 'regret', 'back then',
    'in the past', 'long ago', 'when i was', 'growing up'
  ],
  present_focus: [
    'is', 'am', 'are', 'being', 'now', 'today', 'currently', 'presently',
    'right now', 'at the moment', 'these days', 'nowadays', 'here', 'this',
    'immediate', 'instant', 'ongoing', 'existing', 'actual', 'real-time'
  ],
  future_focus: [
    'will', 'shall', 'going to', 'gonna', 'tomorrow', 'soon', 'later',
    'eventually', 'someday', 'future', 'upcoming', 'next', 'plan', 'planning',
    'intend', 'expect', 'anticipate', 'hope', 'wish', 'goal', 'aspire',
    'dream', 'vision', 'forecast', 'predict', 'prepare'
  ],
} as const

// === PERCEPTUAL PROCESSES ===
export const PERCEPTUAL = {
  see: [
    'see', 'look', 'watch', 'view', 'observe', 'notice', 'spot', 'glimpse',
    'glance', 'stare', 'gaze', 'peer', 'scan', 'examine', 'inspect', 'visible',
    'sight', 'vision', 'visual', 'image', 'picture', 'scene', 'color', 'bright',
    'dark', 'light', 'appear', 'seem', 'show', 'display', 'reveal'
  ],
  hear: [
    'hear', 'listen', 'sound', 'noise', 'voice', 'speak', 'talk', 'say',
    'tell', 'whisper', 'shout', 'yell', 'scream', 'call', 'ring', 'tone',
    'music', 'song', 'melody', 'rhythm', 'loud', 'quiet', 'silent', 'audible'
  ],
  feel: [
    'feel', 'touch', 'sense', 'sensation', 'texture', 'smooth', 'rough',
    'soft', 'hard', 'warm', 'cold', 'hot', 'cool', 'pressure', 'pain',
    'comfort', 'uncomfortable', 'physical', 'body', 'skin', 'hand', 'finger'
  ],
} as const

// === PERSONAL CONCERNS ===
export const PERSONAL = {
  work: [
    'work', 'job', 'career', 'office', 'boss', 'employee', 'company', 'business',
    'profession', 'occupation', 'employment', 'workplace', 'colleague', 'meeting',
    'project', 'task', 'deadline', 'salary', 'promotion', 'hire', 'fire', 'retire',
    'resume', 'interview', 'corporate', 'industry', 'market'
  ],
  leisure: [
    'fun', 'play', 'game', 'sport', 'hobby', 'vacation', 'holiday', 'relax',
    'rest', 'entertainment', 'movie', 'music', 'book', 'read', 'travel', 'trip',
    'party', 'celebrate', 'enjoy', 'recreation', 'leisure', 'free time', 'weekend'
  ],
  home: [
    'home', 'house', 'apartment', 'room', 'kitchen', 'bedroom', 'bathroom',
    'living room', 'garden', 'yard', 'furniture', 'domestic', 'household',
    'clean', 'cook', 'laundry', 'chore', 'decorate', 'rent', 'mortgage', 'move'
  ],
  money: [
    'money', 'cash', 'dollar', 'price', 'cost', 'pay', 'spend', 'save', 'invest',
    'budget', 'income', 'salary', 'wage', 'debt', 'loan', 'credit', 'bank',
    'account', 'financial', 'economic', 'rich', 'poor', 'wealth', 'afford',
    'expensive', 'cheap', 'bill', 'tax'
  ],
  religion: [
    'god', 'pray', 'church', 'faith', 'belief', 'soul', 'spirit', 'heaven',
    'hell', 'sin', 'holy', 'sacred', 'divine', 'blessed', 'worship', 'religion',
    'religious', 'spiritual', 'bible', 'jesus', 'christian', 'muslim', 'jewish',
    'buddhist', 'meditation', 'temple', 'mosque', 'synagogue'
  ],
  death: [
    'death', 'die', 'dead', 'dying', 'kill', 'murder', 'funeral', 'grave',
    'cemetery', 'coffin', 'mourn', 'grief', 'loss', 'passed away', 'deceased',
    'mortal', 'immortal', 'afterlife', 'eternal', 'suicide', 'fatal', 'lethal'
  ],
} as const

// === INFORMAL LANGUAGE ===
export const INFORMAL = {
  swear: [
    'damn', 'hell', 'crap', 'cuss', 'darn', 'heck', 'shoot', 'frick'
    // Note: Kept mild for this application
  ],
  netspeak: [
    'lol', 'lmao', 'rofl', 'omg', 'btw', 'imo', 'imho', 'fyi', 'tbh', 'ngl',
    'idk', 'smh', 'ikr', 'brb', 'afk', 'gg', 'rn', 'dm', 'tl;dr', 'eta',
    'fomo', 'yolo', 'goat', 'bae', 'lit', 'slay', 'vibe', 'sus', 'lowkey',
    'highkey', 'stan', 'simp', 'flex', 'salty', 'shade', 'tea', 'cap', 'bet'
  ],
  assent: [
    'yes', 'yeah', 'yep', 'yup', 'ok', 'okay', 'sure', 'right', 'agree',
    'true', 'correct', 'absolutely', 'definitely', 'exactly', 'indeed',
    'certainly', 'totally', 'uh-huh', 'mhm', 'alright', 'fine'
  ],
  nonfluencies: [
    'uh', 'um', 'er', 'ah', 'hmm', 'hm', 'ehh', 'uhh', 'umm', 'err',
    'well', 'like', 'you know', 'i mean', 'basically', 'actually', 'literally',
    'honestly', 'seriously'
  ],
  fillers: [
    'like', 'you know', 'i mean', 'basically', 'actually', 'literally',
    'honestly', 'seriously', 'whatever', 'anyway', 'so', 'just', 'really',
    'very', 'kind of', 'sort of', 'pretty much', 'i guess'
  ],
} as const

// === MORAL FOUNDATIONS ===
export const MORAL = {
  care_harm: [
    'care', 'caring', 'protect', 'protection', 'safe', 'safety', 'harm', 'hurt',
    'suffer', 'suffering', 'pain', 'cruel', 'cruelty', 'kind', 'kindness',
    'compassion', 'empathy', 'sympathetic', 'gentle', 'nurture', 'comfort',
    'help', 'defend', 'vulnerable', 'victim', 'abuse', 'violence'
  ],
  fairness_cheating: [
    'fair', 'fairness', 'unfair', 'just', 'justice', 'injustice', 'equal',
    'equality', 'rights', 'deserve', 'balance', 'reciprocal', 'cheat',
    'fraud', 'dishonest', 'honest', 'bias', 'prejudice', 'discriminate',
    'equity', 'impartial', 'objective'
  ],
  loyalty_betrayal: [
    'loyal', 'loyalty', 'betray', 'betrayal', 'faithful', 'traitor', 'team',
    'group', 'together', 'united', 'solidarity', 'patriot', 'patriotic',
    'belong', 'member', 'ally', 'enemy', 'us', 'them', 'insider', 'outsider'
  ],
  authority_subversion: [
    'authority', 'respect', 'obey', 'obedience', 'tradition', 'traditional',
    'order', 'law', 'legal', 'illegal', 'rule', 'duty', 'hierarchy', 'rank',
    'leader', 'follow', 'rebel', 'rebellion', 'subvert', 'defy', 'disobey'
  ],
  sanctity_degradation: [
    'pure', 'purity', 'clean', 'sacred', 'holy', 'divine', 'corrupt',
    'corruption', 'disgust', 'disgusting', 'sin', 'sinful', 'virtue',
    'virtuous', 'moral', 'immoral', 'noble', 'degrade', 'degradation',
    'pollute', 'contaminate', 'taint', 'wholesome', 'decent'
  ],
  liberty_oppression: [
    'freedom', 'free', 'liberty', 'liberate', 'oppress', 'oppression',
    'tyranny', 'control', 'restrict', 'restriction', 'autonomy', 'independent',
    'independence', 'choice', 'coerce', 'force', 'compel', 'rights', 'slave',
    'slavery', 'dictator', 'democracy'
  ],
} as const

// === MINDSET (Growth vs Fixed) ===
export const MINDSET = {
  growth_language: [
    'learn', 'improve', 'develop', 'grow', 'progress', 'practice', 'effort',
    'try', 'challenge', 'mistake', 'feedback', 'potential', 'opportunity',
    'yet', 'becoming', 'evolve', 'adapt', 'change', 'stretch', 'struggle',
    'persist', 'persevere', 'dedication', 'hard work'
  ],
  fixed_language: [
    'talent', 'gifted', 'natural', 'born', 'innate', 'genius', 'smart',
    "can't", 'impossible', 'never', 'always', 'just', 'either', 'or',
    'limit', 'limited', 'stuck', 'fixed', 'permanent', 'trait', 'ability',
    'incapable', 'unable'
  ],
  effort_attribution: [
    'effort', 'work', 'practice', 'study', 'prepare', 'train', 'dedication',
    'commitment', 'persistence', 'perseverance', 'determination', 'discipline',
    'focus', 'concentrate', 'apply'
  ],
  ability_attribution: [
    'talent', 'gifted', 'natural', 'innate', 'ability', 'smart', 'intelligent',
    'genius', 'brilliant', 'capable', 'skilled', 'talented', 'aptitude'
  ],
} as const

// === METACOGNITION ===
export const METACOGNITION = {
  planning: [
    'plan', 'strategy', 'approach', 'method', 'prepare', 'organize', 'goal',
    'objective', 'step', 'process', 'procedure', 'schedule', 'timeline',
    'outline', 'framework', 'structure', 'design', 'blueprint'
  ],
  monitoring: [
    'check', 'verify', 'track', 'monitor', 'assess', 'evaluate', 'review',
    'measure', 'gauge', 'observe', 'watch', 'notice', 'attention', 'aware',
    'conscious', 'mindful'
  ],
  evaluation: [
    'evaluate', 'assess', 'judge', 'review', 'analyze', 'reflect', 'consider',
    'examine', 'critique', 'appraise', 'rate', 'rank', 'compare', 'weigh',
    'determine', 'conclude'
  ],
  self_correction: [
    'correct', 'fix', 'adjust', 'revise', 'modify', 'change', 'improve',
    'refine', 'update', 'amend', 'rectify', 'repair', 'redo', 'rethink',
    'reconsider'
  ],
} as const

// === CREATIVITY ===
export const CREATIVITY = {
  novelty_words: [
    'new', 'novel', 'original', 'unique', 'innovative', 'fresh', 'different',
    'unprecedented', 'groundbreaking', 'revolutionary', 'cutting-edge',
    'pioneering', 'inventive', 'unconventional', 'unusual'
  ],
  imagination_words: [
    'imagine', 'envision', 'dream', 'conceive', 'visualize', 'fantasy',
    'creative', 'creativity', 'artistic', 'inventive', 'imaginative',
    'visionary', 'inspired', 'inspiration', 'muse'
  ],
  innovation_words: [
    'innovate', 'innovation', 'invent', 'invention', 'create', 'creation',
    'design', 'develop', 'discover', 'explore', 'experiment', 'breakthrough',
    'transform', 'reimagine', 'revolutionize'
  ],
} as const

// === ATTACHMENT ===
export const ATTACHMENT = {
  trust_words: [
    'trust', 'trustworthy', 'reliable', 'depend', 'dependable', 'faith',
    'believe', 'honest', 'sincere', 'genuine', 'authentic', 'loyal',
    'faithful', 'consistent', 'predictable', 'safe', 'secure'
  ],
  intimacy_words: [
    'close', 'intimate', 'bond', 'connect', 'connection', 'deep', 'meaningful',
    'personal', 'private', 'share', 'open up', 'vulnerable', 'emotional',
    'affection', 'warmth', 'tender', 'loving', 'caring'
  ],
  independence_words: [
    'independent', 'independence', 'alone', 'self', 'myself', 'own', 'personal',
    'individual', 'autonomous', 'freedom', 'space', 'distance', 'separate',
    'self-reliant', 'self-sufficient'
  ],
  anxiety_attachment: [
    'worry', 'anxious', 'fear', 'scared', 'abandoned', 'reject', 'rejection',
    'leave', 'leaving', 'alone', 'lonely', 'insecure', 'clingy', 'needy',
    'reassure', 'reassurance', 'validate', 'approval'
  ],
} as const

// === COMMUNICATION STYLE ===
export const COMMUNICATION = {
  formal_language: [
    'therefore', 'furthermore', 'moreover', 'consequently', 'nevertheless',
    'notwithstanding', 'regarding', 'concerning', 'pursuant', 'hereby',
    'henceforth', 'whereas', 'accordingly', 'subsequently', 'hence'
  ],
  informal_language: [
    'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'dunno', "y'all", 'hey',
    'hi', 'bye', 'cool', 'awesome', 'stuff', 'thing', 'like', 'whatever'
  ],
  direct_language: [
    'must', 'should', 'need', 'require', 'demand', 'insist', 'expect',
    'want', 'will', 'going to', 'immediately', 'now', 'directly', 'clearly',
    'simply', 'just', 'exactly', 'specifically'
  ],
  indirect_language: [
    'perhaps', 'maybe', 'might', 'could', 'possibly', 'potentially',
    'somewhat', 'rather', 'quite', 'fairly', 'tend to', 'seem to',
    'appear to', 'suggest', 'imply', 'hint'
  ],
  assertive_language: [
    'believe', 'think', 'feel', 'want', 'need', 'expect', 'insist', 'demand',
    'require', 'prefer', 'choose', 'decide', 'will', 'going to', 'certain',
    'sure', 'confident', 'know'
  ],
  hedging_language: [
    'maybe', 'perhaps', 'possibly', 'might', 'could', 'may', 'seem',
    'appear', 'suggest', 'indicate', 'tend', 'somewhat', 'rather', 'quite',
    'fairly', 'kind of', 'sort of', 'a bit', 'slightly'
  ],
} as const

// === EXECUTIVE FUNCTION ===
export const EXECUTIVE = {
  inhibition_words: [
    'stop', 'resist', 'control', 'restrain', 'avoid', 'prevent', 'hold back',
    'refrain', 'suppress', 'inhibit', 'contain', 'limit', 'restrict', 'block',
    'pause', 'wait', 'delay', 'postpone'
  ],
  shifting_words: [
    'change', 'switch', 'adapt', 'flexible', 'adjust', 'modify', 'shift',
    'transition', 'transform', 'convert', 'alternate', 'vary', 'pivot',
    'redirect', 'reframe'
  ],
  planning_words: [
    'plan', 'organize', 'schedule', 'prepare', 'arrange', 'structure',
    'coordinate', 'manage', 'prioritize', 'sequence', 'order', 'systematic',
    'methodical', 'strategic'
  ],
  organization_words: [
    'organize', 'organized', 'structure', 'structured', 'order', 'ordered',
    'system', 'systematic', 'arrange', 'arranged', 'categorize', 'classify',
    'sort', 'file', 'manage'
  ],
} as const

// === COPING & RESILIENCE ===
export const COPING = {
  problem_focused: [
    'solve', 'fix', 'address', 'handle', 'deal', 'manage', 'tackle', 'resolve',
    'approach', 'strategy', 'plan', 'action', 'step', 'solution', 'work on'
  ],
  emotion_focused: [
    'feel', 'process', 'accept', 'acknowledge', 'express', 'vent', 'release',
    'cope', 'adapt', 'adjust', 'let go', 'move on', 'comfort', 'soothe'
  ],
  avoidant: [
    'avoid', 'ignore', 'distract', 'deny', 'escape', 'hide', 'run', 'forget',
    'suppress', 'repress', 'block', 'shut out', 'push away', 'numb'
  ],
  support_seeking: [
    'help', 'support', 'talk', 'share', 'reach out', 'ask', 'advice', 'guidance',
    'listen', 'understand', 'comfort', 'reassure', 'encourage', 'together'
  ],
  optimism: [
    'hope', 'hopeful', 'optimistic', 'positive', 'bright', 'promising',
    'opportunity', 'possibility', 'potential', 'better', 'improve', 'looking up'
  ],
  self_efficacy: [
    'can', 'able', 'capable', 'competent', 'confident', 'manage', 'handle',
    'achieve', 'accomplish', 'succeed', 'overcome', 'strong', 'resilient'
  ],
} as const

// === VALUES (Schwartz) ===
export const VALUES = {
  self_direction: [
    'independent', 'freedom', 'choose', 'create', 'explore', 'curious',
    'autonomous', 'self', 'own', 'individual', 'unique', 'original', 'creative'
  ],
  stimulation: [
    'exciting', 'adventure', 'challenge', 'risk', 'new', 'novel', 'variety',
    'diverse', 'change', 'thrill', 'daring', 'bold', 'spontaneous'
  ],
  hedonism: [
    'pleasure', 'enjoy', 'fun', 'happy', 'satisfaction', 'gratification',
    'comfort', 'luxury', 'indulge', 'treat', 'relax', 'leisure'
  ],
  achievement: [
    'success', 'achieve', 'accomplish', 'capable', 'competent', 'ambitious',
    'influence', 'recognition', 'excellence', 'perform', 'win', 'best'
  ],
  power_value: [
    'power', 'control', 'authority', 'wealth', 'status', 'prestige', 'dominant',
    'influence', 'lead', 'command', 'resources', 'recognition'
  ],
  security: [
    'safe', 'secure', 'stable', 'order', 'clean', 'healthy', 'protect',
    'preserve', 'predictable', 'reliable', 'certain', 'trust'
  ],
  conformity: [
    'obey', 'duty', 'respect', 'polite', 'honor', 'loyal', 'responsible',
    'comply', 'follow', 'rules', 'discipline', 'proper', 'appropriate'
  ],
  tradition: [
    'tradition', 'custom', 'culture', 'heritage', 'religion', 'faith',
    'humble', 'devout', 'respect', 'accept', 'moderate', 'conservative'
  ],
  benevolence: [
    'help', 'honest', 'forgiving', 'loyal', 'responsible', 'friendship',
    'love', 'caring', 'supportive', 'kind', 'generous', 'compassionate'
  ],
  universalism: [
    'equality', 'justice', 'peace', 'beautiful', 'nature', 'environment',
    'tolerance', 'wisdom', 'broad-minded', 'social justice', 'protect',
    'world', 'global', 'humanity'
  ],
} as const

// === DECISION MAKING ===
export const DECISION = {
  rational_language: [
    'analyze', 'logical', 'reason', 'evidence', 'data', 'fact', 'objective',
    'systematic', 'careful', 'thorough', 'consider', 'evaluate', 'compare',
    'weigh', 'pros', 'cons', 'criteria', 'assess'
  ],
  intuitive_language: [
    'feel', 'sense', 'gut', 'instinct', 'intuition', 'hunch', 'impression',
    'vibe', 'energy', 'just know', 'heart', 'soul', 'spirit'
  ],
  dependent_language: [
    'advice', 'opinion', 'think', 'suggest', 'recommend', 'help', 'guidance',
    'support', 'consult', 'ask', 'others', 'someone', 'people', 'they'
  ],
  avoidant_decision: [
    'later', 'wait', 'postpone', 'delay', 'avoid', 'ignore', "don't know",
    'unsure', 'uncertain', 'maybe', 'possibly', "can't decide", 'stuck'
  ],
  spontaneous_language: [
    'now', 'immediately', 'quick', 'fast', 'instant', 'impulse', 'spontaneous',
    'spur of the moment', 'just do', 'go for it', 'why not', 'yolo'
  ],
} as const

// === POLITICAL/CULTURAL ===
export const POLITICAL = {
  authority_language: [
    'authority', 'leader', 'respect', 'obey', 'tradition', 'order', 'law',
    'discipline', 'hierarchy', 'structure', 'rules', 'duty', 'responsibility'
  ],
  equality_language: [
    'equal', 'equality', 'fair', 'fairness', 'rights', 'justice', 'freedom',
    'democracy', 'opportunity', 'access', 'inclusive', 'diverse', 'equity'
  ],
  ingroup_language: [
    'us', 'we', 'our', 'ours', 'together', 'united', 'family', 'community',
    'nation', 'country', 'people', 'team', 'group', 'belong'
  ],
  outgroup_language: [
    'they', 'them', 'their', 'others', 'different', 'foreign', 'outsider',
    'stranger', 'enemy', 'threat', 'dangerous', 'alien'
  ],
} as const

export const CULTURAL = {
  individualism: [
    'i', 'me', 'my', 'myself', 'individual', 'personal', 'independent',
    'unique', 'self', 'own', 'alone', 'private', 'autonomy', 'freedom'
  ],
  collectivism: [
    'we', 'us', 'our', 'together', 'group', 'team', 'family', 'community',
    'society', 'belong', 'share', 'cooperate', 'harmony', 'duty'
  ],
} as const

// === SENSORY ===
export const SENSORY = {
  visual_words: [
    'see', 'look', 'watch', 'view', 'observe', 'bright', 'dark', 'color',
    'colorful', 'vivid', 'clear', 'picture', 'image', 'beautiful', 'ugly',
    'appear', 'show', 'display', 'visible', 'sight', 'vision'
  ],
  auditory_words: [
    'hear', 'listen', 'sound', 'loud', 'quiet', 'silent', 'noise', 'music',
    'voice', 'speak', 'say', 'tell', 'ring', 'tone', 'rhythm', 'melody'
  ],
  kinesthetic_words: [
    'feel', 'touch', 'hold', 'grab', 'push', 'pull', 'move', 'run', 'walk',
    'jump', 'hit', 'soft', 'hard', 'rough', 'smooth', 'warm', 'cold',
    'heavy', 'light', 'pressure', 'tight', 'loose'
  ],
  olfactory_words: [
    'smell', 'scent', 'aroma', 'fragrance', 'odor', 'stink', 'fresh',
    'perfume', 'sniff', 'nose'
  ],
  gustatory_words: [
    'taste', 'flavor', 'sweet', 'sour', 'bitter', 'salty', 'spicy', 'savory',
    'delicious', 'yummy', 'disgusting', 'mouth', 'tongue', 'eat', 'drink'
  ],
} as const

// === AESTHETIC ===
export const AESTHETIC = {
  beauty_words: [
    'beautiful', 'pretty', 'gorgeous', 'stunning', 'lovely', 'elegant',
    'graceful', 'attractive', 'charming', 'magnificent', 'splendid', 'exquisite',
    'aesthetic', 'artistic', 'design', 'style', 'fashion'
  ],
  complexity_preference: [
    'complex', 'intricate', 'elaborate', 'detailed', 'sophisticated', 'nuanced',
    'layered', 'rich', 'dense', 'ornate', 'decorative'
  ],
  novelty_aesthetic: [
    'modern', 'contemporary', 'avant-garde', 'innovative', 'experimental',
    'unique', 'original', 'fresh', 'new', 'cutting-edge', 'bold'
  ],
} as const

// === DARK TRIAD ===
export const DARK_TRIAD = {
  narcissism: [
    'special', 'unique', 'superior', 'best', 'exceptional', 'extraordinary', 'remarkable',
    'admire', 'admiration', 'praise', 'compliment', 'recognition', 'attention', 'spotlight',
    'deserve', 'entitled', 'important', 'impressive', 'successful', 'winner', 'champion',
    'brilliant', 'genius', 'talented', 'gifted', 'perfect', 'flawless', 'magnificent',
    'dominant', 'powerful', 'influential', 'prestigious', 'elite', 'exclusive', 'vip',
    'me', 'my', 'mine', 'myself', 'i', 'envy', 'jealous', 'better than', 'above',
    'look at me', 'notice me', 'appreciate me', 'respect me', 'worship'
  ],
  machiavellianism: [
    'manipulate', 'manipulation', 'strategy', 'strategic', 'scheme', 'plot', 'plan',
    'calculate', 'calculated', 'cunning', 'shrewd', 'clever', 'smart', 'outsmart',
    'advantage', 'leverage', 'exploit', 'use', 'useful', 'benefit', 'gain', 'profit',
    'control', 'influence', 'persuade', 'convince', 'sway', 'negotiate', 'deal',
    'alliance', 'ally', 'enemy', 'opponent', 'competitor', 'rivalry', 'win', 'lose',
    'power', 'position', 'status', 'reputation', 'image', 'appear', 'impression',
    'network', 'connection', 'favor', 'owe', 'debt', 'exchange', 'trade', 'quid pro quo',
    'ends justify means', 'necessary evil', 'pragmatic', 'realistic', 'cynical'
  ],
  psychopathy: [
    'thrill', 'excitement', 'rush', 'adrenaline', 'risk', 'danger', 'fearless',
    'bold', 'daring', 'reckless', 'impulsive', 'spontaneous', 'unpredictable',
    'bored', 'boring', 'tedious', 'routine', 'monotonous', 'restless', 'impatient',
    'cold', 'detached', 'indifferent', 'unconcerned', 'callous', 'heartless',
    'ruthless', 'merciless', 'cruel', 'harsh', 'tough', 'hard', 'remorseless',
    'guilt-free', 'shameless', 'unapologetic', 'blame', 'fault', 'excuse', 'justify',
    'superficial', 'charm', 'charming', 'charisma', 'smooth', 'glib', 'persuasive',
    'lie', 'lying', 'deceive', 'deception', 'fake', 'pretend', 'mask', 'act'
  ],
} as const

// === LOVE LANGUAGES ===
export const LOVE_LANGUAGES = {
  words_of_affirmation: [
    'love you', 'appreciate', 'proud of', 'grateful', 'thank', 'thanks', 'thankful',
    'amazing', 'wonderful', 'incredible', 'beautiful', 'handsome', 'gorgeous',
    'smart', 'brilliant', 'talented', 'kind', 'caring', 'thoughtful', 'sweet',
    'support', 'believe in', 'encourage', 'praise', 'compliment', 'admire',
    'respect', 'value', 'cherish', 'treasure', 'mean so much', 'lucky to have',
    'best', 'favorite', 'special', 'unique', 'one of a kind', 'irreplaceable',
    'well done', 'great job', 'impressed', 'proud', 'accomplished', 'success'
  ],
  quality_time: [
    'together', 'spend time', 'hang out', 'be with', 'presence', 'company',
    'talk', 'conversation', 'chat', 'discuss', 'share', 'listen', 'attention',
    'focus', 'undivided', 'priority', 'dedicated', 'exclusive', 'alone time',
    'date', 'outing', 'trip', 'vacation', 'adventure', 'experience', 'memory',
    'moments', 'connection', 'bond', 'relationship', 'intimacy', 'closeness',
    'quality', 'meaningful', 'deep', 'engage', 'participate', 'involve', 'join'
  ],
  gifts: [
    'gift', 'present', 'surprise', 'give', 'gave', 'brought', 'buy', 'bought',
    'shop', 'shopping', 'treat', 'token', 'souvenir', 'memento', 'keepsake',
    'remember', 'thought of you', 'reminded me', 'saw this', 'perfect for',
    'special', 'meaningful', 'symbolic', 'gesture', 'effort', 'thoughtful',
    'wrap', 'unwrap', 'open', 'receive', 'package', 'deliver', 'mail', 'send',
    'flowers', 'chocolate', 'jewelry', 'card', 'letter', 'note', 'handmade', 'diy'
  ],
  acts_of_service: [
    'help', 'helped', 'helping', 'assist', 'support', 'do for', 'take care',
    'handle', 'manage', 'fix', 'repair', 'clean', 'cook', 'prepare', 'make',
    'run errands', 'chores', 'tasks', 'responsibilities', 'duties', 'burden',
    'ease', 'lighten', 'relieve', 'stress', 'load', 'shoulder', 'carry',
    'sacrifice', 'effort', 'work', 'labor', 'action', 'deed', 'favor',
    'serve', 'service', 'cater', 'provide', 'arrange', 'organize', 'plan for'
  ],
  physical_touch: [
    'touch', 'hold', 'hug', 'embrace', 'cuddle', 'snuggle', 'caress', 'stroke',
    'kiss', 'peck', 'smooch', 'hand', 'arm', 'shoulder', 'back', 'face', 'hair',
    'close', 'near', 'proximity', 'physical', 'contact', 'affection', 'warmth',
    'comfort', 'soothe', 'massage', 'rub', 'pat', 'squeeze', 'gentle', 'soft',
    'intimate', 'sensual', 'tender', 'loving', 'romantic', 'passionate',
    'hold hands', 'lean on', 'sit close', 'next to', 'beside', 'wrap around'
  ],
} as const

// === LOCUS OF CONTROL ===
export const LOCUS_OF_CONTROL = {
  internal: [
    'i can', 'i will', 'i choose', 'i decide', 'i control', 'i determine',
    'my choice', 'my decision', 'my responsibility', 'my fault', 'my doing',
    'effort', 'hard work', 'dedication', 'persistence', 'perseverance', 'determination',
    'skill', 'ability', 'capability', 'competence', 'talent', 'strength',
    'achieve', 'accomplish', 'succeed', 'earn', 'deserve', 'create', 'make happen',
    'take charge', 'take control', 'take action', 'initiative', 'proactive',
    'responsible', 'accountability', 'ownership', 'in my hands', 'up to me',
    'self-made', 'self-reliant', 'independent', 'autonomous', 'empowered'
  ],
  external: [
    'luck', 'lucky', 'unlucky', 'chance', 'fate', 'destiny', 'meant to be',
    'coincidence', 'random', 'accident', 'happen to', 'by chance', 'fortunate',
    'unfortunately', 'beyond control', 'out of hands', 'nothing i can do',
    'they', 'them', 'others', 'people', 'society', 'system', 'government',
    'circumstances', 'situation', 'environment', 'conditions', 'context',
    'unfair', 'unjust', 'biased', 'rigged', 'stacked against', 'disadvantage',
    'victim', 'powerless', 'helpless', 'hopeless', 'trapped', 'stuck',
    'blame', 'fault of', 'because of', 'thanks to', 'due to', 'caused by'
  ],
} as const

// === LIFE SATISFACTION ===
export const LIFE_SATISFACTION = {
  positive_life: [
    'satisfied', 'content', 'fulfilled', 'happy', 'joyful', 'blessed', 'grateful',
    'fortunate', 'lucky', 'thriving', 'flourishing', 'prospering', 'succeeding',
    'meaningful', 'purposeful', 'worthwhile', 'valuable', 'significant', 'important',
    'good life', 'great life', 'best life', 'loving life', 'living well',
    'accomplished', 'achieved', 'realized', 'attained', 'reached', 'goals met',
    'dreams', 'aspirations', 'hopes', 'wishes', 'desires', 'wants', 'needs met',
    'balance', 'harmony', 'peace', 'calm', 'serene', 'tranquil', 'relaxed',
    'optimistic', 'positive', 'hopeful', 'bright future', 'looking forward'
  ],
  negative_life: [
    'dissatisfied', 'unsatisfied', 'unfulfilled', 'unhappy', 'miserable', 'depressed',
    'unfortunate', 'unlucky', 'struggling', 'suffering', 'failing', 'stuck',
    'meaningless', 'pointless', 'worthless', 'empty', 'hollow', 'void',
    'bad life', 'terrible life', 'hate my life', 'hate life', 'not living',
    'regret', 'remorse', 'guilt', 'shame', 'disappointment', 'letdown',
    'unfulfilled dreams', 'missed opportunities', 'wasted', 'lost', 'behind',
    'imbalance', 'chaos', 'stress', 'anxiety', 'worry', 'fear', 'dread',
    'pessimistic', 'negative', 'hopeless', 'bleak future', 'dreading'
  ],
  wellbeing_indicators: [
    'healthy', 'health', 'wellness', 'well-being', 'fit', 'fitness', 'energy',
    'sleep', 'rest', 'relaxation', 'recovery', 'balance', 'stability',
    'relationships', 'connections', 'friends', 'family', 'community', 'belonging',
    'growth', 'learning', 'development', 'progress', 'improvement', 'better',
    'autonomy', 'freedom', 'choice', 'control', 'independence', 'self-determination',
    'competence', 'mastery', 'skill', 'ability', 'capable', 'confident'
  ],
} as const

// === SOCIAL SUPPORT ===
export const SOCIAL_SUPPORT = {
  emotional_support: [
    'listen', 'listening', 'heard', 'understand', 'understanding', 'empathy',
    'care', 'caring', 'concern', 'concerned', 'worry', 'worried about me',
    'comfort', 'comforting', 'soothe', 'soothing', 'reassure', 'reassurance',
    'validate', 'validation', 'accept', 'acceptance', 'non-judgmental',
    'there for me', 'by my side', 'support', 'supportive', 'encourage',
    'love', 'affection', 'warmth', 'kindness', 'compassion', 'sympathy',
    'shoulder to cry', 'vent', 'express', 'share feelings', 'open up'
  ],
  instrumental_support: [
    'help', 'helped', 'helping', 'assist', 'assistance', 'aid', 'support',
    'lend', 'borrow', 'give', 'provide', 'offer', 'pitch in', 'chip in',
    'money', 'financial', 'funds', 'loan', 'pay', 'cover', 'expense',
    'ride', 'drive', 'pick up', 'drop off', 'transportation', 'car',
    'babysit', 'watch', 'take care', 'look after', 'cover for', 'fill in',
    'task', 'chore', 'errand', 'favor', 'request', 'need', 'require',
    'resource', 'tool', 'equipment', 'supplies', 'materials', 'access'
  ],
  informational_support: [
    'advice', 'suggest', 'suggestion', 'recommend', 'recommendation', 'tip',
    'information', 'info', 'knowledge', 'know-how', 'expertise', 'experience',
    'teach', 'show', 'explain', 'clarify', 'guide', 'guidance', 'direction',
    'mentor', 'coach', 'counsel', 'consult', 'consultation', 'feedback',
    'opinion', 'perspective', 'viewpoint', 'insight', 'wisdom', 'lesson',
    'resource', 'reference', 'link', 'contact', 'connection', 'introduction',
    'learn', 'discover', 'find out', 'figure out', 'understand', 'realize'
  ],
  network_indicators: [
    'friend', 'friends', 'friendship', 'buddy', 'pal', 'companion', 'mate',
    'family', 'relative', 'parent', 'sibling', 'spouse', 'partner', 'significant',
    'colleague', 'coworker', 'teammate', 'classmate', 'neighbor', 'community',
    'group', 'circle', 'network', 'connections', 'relationships', 'bonds',
    'belong', 'belonging', 'member', 'part of', 'included', 'welcome',
    'alone', 'lonely', 'isolated', 'disconnected', 'alienated', 'excluded'
  ],
} as const

// === AUTHENTICITY ===
export const AUTHENTICITY = {
  genuine_expression: [
    'honest', 'honestly', 'truthful', 'truth', 'sincere', 'sincerely', 'genuine',
    'real', 'really', 'truly', 'actually', 'authentic', 'authentically',
    'myself', 'true self', 'real me', 'who i am', 'be myself', 'express myself',
    'open', 'transparent', 'candid', 'frank', 'direct', 'straightforward',
    'vulnerable', 'vulnerability', 'raw', 'unfiltered', 'uncensored', 'unedited',
    'admit', 'confess', 'acknowledge', 'reveal', 'disclose', 'share',
    'feel', 'feeling', 'emotion', 'emotional', 'heart', 'soul', 'gut'
  ],
  self_awareness: [
    'aware', 'awareness', 'conscious', 'consciousness', 'mindful', 'mindfulness',
    'reflect', 'reflection', 'introspect', 'introspection', 'examine', 'self-examine',
    'understand myself', 'know myself', 'self-knowledge', 'self-understanding',
    'recognize', 'realize', 'discover', 'learn about myself', 'insight',
    'strength', 'weakness', 'flaw', 'limitation', 'growth area', 'blind spot',
    'pattern', 'tendency', 'habit', 'behavior', 'reaction', 'trigger',
    'values', 'beliefs', 'principles', 'priorities', 'motivations', 'drives'
  ],
  authentic_behavior: [
    'integrity', 'consistent', 'consistency', 'congruent', 'congruence', 'aligned',
    'walk the talk', 'practice what preach', 'mean what say', 'true to',
    'stand by', 'stand for', 'believe in', 'value', 'principle', 'conviction',
    'choose', 'decision', 'intentional', 'deliberate', 'purposeful', 'meaningful',
    'boundaries', 'limits', 'say no', 'decline', 'refuse', 'assert', 'assertion',
    'own', 'ownership', 'responsible', 'accountability', 'admit mistake',
    'genuine interest', 'real concern', 'truly care', 'actually want'
  ],
  inauthenticity: [
    'fake', 'pretend', 'act', 'acting', 'perform', 'performance', 'mask',
    'hide', 'conceal', 'suppress', 'repress', 'deny', 'avoid', 'evade',
    'lie', 'lying', 'deceive', 'deception', 'mislead', 'misrepresent',
    'conform', 'fit in', 'please others', 'approval', 'validation seeking',
    'should', 'supposed to', 'have to', 'must', 'expected', 'obligation',
    'image', 'appearance', 'perception', 'reputation', 'what others think',
    'compromise myself', 'betray myself', 'sell out', 'give up', 'abandon'
  ],
} as const

// === EMPATHY ===
export const EMPATHY = {
  cognitive_empathy: [
    'understand', 'understanding', 'comprehend', 'grasp', 'get', 'see',
    'perspective', 'viewpoint', 'point of view', 'standpoint', 'position',
    'imagine', 'picture', 'envision', 'put myself in', 'walk in shoes',
    'consider', 'think about', 'reflect on', 'ponder', 'contemplate',
    'recognize', 'identify', 'notice', 'observe', 'perceive', 'detect',
    'reason', 'logic', 'rationale', 'motivation', 'intention', 'purpose',
    'why', 'how', 'what', 'situation', 'circumstance', 'context', 'background'
  ],
  affective_empathy: [
    'feel', 'feeling', 'felt', 'emotion', 'emotional', 'moved', 'touched',
    'share', 'shared', 'sharing', 'resonate', 'connect', 'connection',
    'sympathy', 'sympathize', 'compassion', 'compassionate', 'pity', 'sorrow',
    'sad', 'sadness', 'hurt', 'pain', 'suffer', 'suffering', 'ache', 'heart',
    'happy for', 'joy', 'excited', 'thrilled', 'proud', 'glad', 'pleased',
    'worried', 'concerned', 'anxious', 'afraid', 'scared', 'frightened',
    'angry', 'frustrated', 'upset', 'disappointed', 'devastated', 'heartbroken'
  ],
  behavioral_empathy: [
    'help', 'helping', 'helped', 'assist', 'support', 'aid', 'comfort',
    'listen', 'listening', 'hear', 'attend', 'attention', 'present', 'there',
    'respond', 'react', 'act', 'action', 'do', 'did', 'done', 'step in',
    'reach out', 'check on', 'follow up', 'call', 'text', 'message', 'visit',
    'give', 'offer', 'provide', 'share', 'donate', 'contribute', 'volunteer',
    'care', 'caring', 'tend', 'nurture', 'protect', 'defend', 'advocate',
    'kind', 'kindness', 'gentle', 'patient', 'understanding', 'accepting'
  ],
  empathy_barriers: [
    'judge', 'judging', 'judgmental', 'criticize', 'criticism', 'condemn',
    'dismiss', 'ignore', 'overlook', 'disregard', 'minimize', 'invalidate',
    'blame', 'fault', 'accuse', 'attack', 'defend', 'defensive', 'justify',
    'assume', 'assumption', 'presume', 'stereotype', 'generalize', 'label',
    'interrupt', 'cut off', 'talk over', 'not listen', 'tune out', 'zone out',
    'self-centered', 'selfish', 'narcissistic', 'apathetic', 'indifferent',
    'cold', 'distant', 'detached', 'disconnected', 'unavailable', 'closed'
  ],
} as const

// === ARTICLES & PREPOSITIONS (for Analytical Thinking) ===
export const FUNCTION_WORDS = {
  articles: ['a', 'an', 'the'],
  prepositions: [
    'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'to', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very'
  ],
  conjunctions: [
    'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'although', 'because',
    'since', 'unless', 'while', 'whereas', 'if', 'then', 'else', 'when',
    'where', 'whether', 'however', 'therefore', 'moreover', 'furthermore',
    'nevertheless', 'nonetheless', 'consequently', 'accordingly', 'thus', 'hence'
  ],
  auxiliary_verbs: [
    'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
    'had', 'having', 'do', 'does', 'did', 'will', 'would', 'shall', 'should',
    'may', 'might', 'must', 'can', 'could', 'ought', 'need', 'dare', 'used'
  ],
  adverbs: [
    'very', 'really', 'quite', 'just', 'even', 'also', 'only', 'still',
    'already', 'always', 'never', 'often', 'sometimes', 'usually', 'probably',
    'perhaps', 'maybe', 'certainly', 'definitely', 'actually', 'basically',
    'generally', 'typically', 'especially', 'particularly', 'specifically'
  ],
  negations: [
    'no', 'not', 'never', 'neither', 'nor', 'none', 'nothing', 'nobody',
    'nowhere', 'cannot', "can't", "won't", "wouldn't", "shouldn't", "couldn't",
    "don't", "doesn't", "didn't", "isn't", "aren't", "wasn't", "weren't"
  ],
} as const

// === Unified Dictionary Export ===
export const LIWC_DICTIONARIES = {
  pronouns: PRONOUNS,
  cognitive: COGNITIVE,
  affect: AFFECT,
  social: SOCIAL,
  drives: DRIVES,
  time: TIME,
  perceptual: PERCEPTUAL,
  personal: PERSONAL,
  informal: INFORMAL,
  moral: MORAL,
  mindset: MINDSET,
  metacognition: METACOGNITION,
  creativity: CREATIVITY,
  attachment: ATTACHMENT,
  communication: COMMUNICATION,
  executive: EXECUTIVE,
  coping: COPING,
  values: VALUES,
  decision: DECISION,
  political: POLITICAL,
  cultural: CULTURAL,
  sensory: SENSORY,
  aesthetic: AESTHETIC,
  function_words: FUNCTION_WORDS,
  // New dictionaries for full 39-domain coverage
  dark_triad: DARK_TRIAD,
  love_languages: LOVE_LANGUAGES,
  locus_of_control: LOCUS_OF_CONTROL,
  life_satisfaction: LIFE_SATISFACTION,
  social_support: SOCIAL_SUPPORT,
  authenticity: AUTHENTICITY,
  empathy: EMPATHY,
} as const

export type LIWCCategory = keyof typeof LIWC_DICTIONARIES
export type LIWCSubcategory<T extends LIWCCategory> = keyof typeof LIWC_DICTIONARIES[T]
