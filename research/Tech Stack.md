### Tech Stack

This table outlines the technology components for your digital twin project with detailed descriptions, links, and usage information.

| Component | Technology | Description | How It's Used in This Project | GitHub URL | URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend Framework** | React 19 | Latest version of React with improved concurrent rendering, server components, and enhanced hooks. | Primary UI framework for building the user interface and managing component state. | [github.com/facebook/react](https://github.com/facebook/react) | [react.dev](https://react.dev) |
| **Knowledge Graph** | LevelGraph | Graph database built on LevelDB for storing and querying relationships between psychological traits, contexts, and behaviors. | Stores relationships between personality traits, values, and contextual behaviors to enable sophisticated queries like "How does user's decision-making change under stress?" | [github.com/levelgraph/levelgraph](https://github.com/levelgraph/levelgraph) | N/A |
| **State Management** | Dexie.js | Minimalistic wrapper for IndexedDB that provides a simple API for browser-based database operations. | Manages persistent state for user profiles, conversation history, and psychological assessment data in the browser. | [github.com/dexie/Dexie.js](https://github.com/dexie/Dexie.js) | [dexie.org](https://dexie.org) |
| **SQL Database** | wa-sqlite | WebAssembly build of SQLite with support for custom virtual file systems in JavaScript. | Stores structured psychometric test results, confidence scores, and time-series data for tracking profile evolution. | [github.com/rhashimoto/wa-sqlite](https://github.com/rhashimoto/wa-sqlite) | [rhashimoto.github.io/wa-sqlite](https://rhashimoto.github.io/wa-sqlite/docs/) |
| **Vector Database** | TinkerBird | Browser-native vector database for efficient storage and retrieval of high-dimensional embeddings. | Stores and retrieves semantic embeddings of user text for similarity search and behavioral pattern matching. | [github.com/wizenheimer/tinkerbird](https://github.com/wizenheimer/tinkerbird) | N/A |
| **Embeddings** | Transformers.js | State-of-the-art machine learning models running directly in the browser via WebAssembly. | Generates embeddings from user text and audio for personality prediction and semantic analysis. | [github.com/huggingface/transformers.js](https://github.com/huggingface/transformers.js) | [huggingface.co/docs/transformers.js](https://huggingface.co/docs/transformers.js) |
| **ML Framework** | TensorFlow.js | JavaScript library for training and deploying machine learning models in the browser. | Runs psychometric analysis models, calculates confidence scores, and performs real-time personality trait prediction. | [github.com/tensorflow/tfjs](https://github.com/tensorflow/tfjs) | [tensorflow.org/js](https://www.tensorflow.org/js) |
| **GPU Acceleration** | WebGPU | Modern web API for high-performance GPU computation and graphics rendering. | Accelerates ML model inference, vector similarity calculations, and real-time audio/video processing. | N/A (Web Standard) | [w3.org/TR/webgpu](https://www.w3.org/TR/webgpu/) |
| **Core Technology** | WASM | WebAssembly enables near-native performance for computationally intensive tasks in the browser. | Powers wa-sqlite, Transformers.js, and other performance-critical components requiring fast execution. | N/A (Web Standard) | [webassembly.org](https://webassembly.org/) |
| **Web LLM** | WebLLM | High-performance in-browser LLM inference engine leveraging WebGPU for hardware acceleration. | Runs the base language model entirely in the browser for privacy-preserving conversations and analysis. | [github.com/mlc-ai/web-llm](https://github.com/mlc-ai/web-llm) | [webllm.mlc.ai](https://webllm.mlc.ai/) |
| **Storage** | IndexedDB | Browser-native NoSQL database for storing large amounts of structured data. | Underlying storage layer for Dexie.js, TinkerBird, and other persistence mechanisms. | N/A (Web Standard) | [developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |
| **LLM Runtime** | Mediapipe | Cross-platform framework for building ML pipelines with support for audio, video, and multimodal processing. | Processes audio and video streams for prosodic analysis, facial expression recognition, and multimodal profiling. | [github.com/google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe) | [ai.google.dev/edge/mediapipe](https://ai.google.dev/edge/mediapipe/solutions/guide) |
| **Base Model** | Gemma 3n | Lightweight, efficient language model optimized for on-device inference. | Serves as the foundation LLM for conversation, personality analysis, and adaptive responses. | N/A | [ai.google.dev/gemma](https://ai.google.dev/gemma) |

---

### Gemma 3n Model Downloads

The following pre-quantized Gemma 3n models are available for browser-based inference:

| Model | Size | Use Case | Download URL |
| :--- | :--- | :--- | :--- |
| **Gemma 3n E4B** | ~4B params | Full capability, best quality | [gemma-3n-E4B-it-int4-Web.litertlm](https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma-3n-E4B-it-int4-Web.litertlm) |
| **Gemma 3n E2B** | ~2B params | Balanced performance/size | [gemma-3n-E2B-it-int4-Web.litertlm](https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma-3n-E2B-it-int4-Web.litertlm) |
| **Gemma 3 270M** | 270M params | Tiny/fast, lower devices | [gemma3-270m-it-q8-web.task](https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma3-270m-it-q8-web.task) |

**Recommended Strategy:**
- Use **E4B** for desktop with dedicated GPU (best inverse profiling accuracy)
- Use **E2B** for laptops and mid-range devices (good balance)
- Use **270M** for low-memory devices or quick responses (fallback)

---

### Data Model Planning: Domains, Markers, and Datapoints

This table maps all 22 psychological domains to their primary markers for inverse profiling and the number of datapoints from a key formal assessment. This provides a foundational data model for your digital twin.

| Domain | Primary Markers (Inverse Profiling) | Formal Assessment (Datapoints) |
| :--- | :--- | :--- |
| **1. Personality Traits** | Word choice, future tense, word count, social words, negative emotion words. | **Big Five Inventory (BFI-2)**: 60 items |
| **2. Cognitive Abilities** | Use of articles/prepositions, causal words, logical connectors. | **Raven's Progressive Matrices**: 36-60 items |
| **3. Emotional Intelligence** | Emotion vocabulary, cognitive reframing, other-focused pronouns. | **MSCEIT**: 141 items |
| **4. Values & Motivations** | Words related to success, power, affiliation, and autonomy. | **Schwartz Value Survey (SVS)**: 57 items |
| **5. Moral Reasoning** | Use of justice, fairness, harm, and rights language; ethical justifications. | **Defining Issues Test (DIT-2)**: 60 items |
| **6. Decision-Making Styles** | Logical connectors (Rational), "gut feeling" language (Intuitive), seeking advice. | **General Decision-Making Style (GDMS)**: 25 items |
| **7. Creativity** | Novel metaphors, divergent ideas, low-frequency words. | **Torrance Tests of Creative Thinking (TTCT)**: Varies |
| **8. Attachment & Relationships** | Relationship descriptors (secure, anxious), emotional tone when discussing others. | **Experiences in Close Relationships (ECR)**: 36 items |
| **9. Learning Styles** | Use of visual, auditory, read/write, or kinesthetic language. | **VARK Questionnaire**: 16 items |
| **10. Information Processing** | Specific facts/numbers (Detail-Oriented) vs. concepts/summaries (Big Picture). | **Cognitive Style Index (CSI)**: 38 items |
| **11. Metacognition** | Self-correction, planning statements, reflective language. | **Metacognitive Awareness Inventory (MAI)**: 52 items |
| **12. Executive Functions** | Goal-setting language, structured responses, ability to stay on topic. | **BRIEF-A**: 75 items |
| **13. Communication Styles** | Direct statements (Assertive), qualifiers (Passive), demands (Aggressive). | **Communication Styles Inventory**: 40 items |
| **14. Social Cognition** | Perspective-taking language, references to social norms. | **Reading the Mind in the Eyes Test**: 36 items |
| **15. Resilience & Coping** | Narratives of overcoming adversity, positive reframing, problem-focused language. | **Connor-Davidson Resilience Scale (CD-RISC)**: 25 items |
| **16. Mindset** | Language of effort and learning (Growth) vs. innate ability (Fixed). | **Dweck Mindset Instrument**: 8 items |
| **17. Psychopathology** | High frequency of negative emotion words, absolutist language, cognitive distortions. | **MMPI-2**: 567 items |
| **18. Political Ideology** | Use of politically charged language, expression of specific political values. | **Political Typology Quizzes**: 16-20 items |
| **19. Cultural Values** | Language reflecting cultural norms (e.g., collectivism vs. individualism). | **Hofstede's Cultural Dimensions (VSM)**: 24 items |
| **20. Work & Career Style** | Language about work-life balance, career goals, leadership preferences. | **Strong Interest Inventory**: 291 items |
| **21. Sensory Processing** | Descriptions of sensory experiences and sensitivity to stimuli. | **Highly Sensitive Person Scale (HSPS)**: 27 items |
| **22. Time Perspective** | Use of past, present, or future tense; focus on memories, immediate feelings, or goals. | **Zimbardo Time Perspective Inventory (ZTPI)**: 56 items |
| **23. Aesthetic Preferences** | Expression of preferences for specific artistic styles, genres, or artists. | **Artistic Preferences Scales**: Varies (e.g., 80 items) |

---

### Table 3: Behavioral Data Collection Techniques for Inverse Profiling

This table maps each psychological domain to specific techniques for extracting insights from natural user interactions across different data types, eliminating the need for formal assessments.

| Domain | Text Analysis Techniques | Audio Analysis Techniques | Video Analysis Techniques | Document Analysis Techniques |
| :--- | :--- | :--- | :--- | :--- |
| **1. Personality Traits** | LIWC analysis for OCEAN traits; NLP models for personality prediction. | Prosodic analysis (pitch, volume for Extraversion; vocal tension for Neuroticism). | Facial expressiveness, body language (e.g., open vs. closed posture). | Writing style analysis in reports or creative writing. |
| **2. Cognitive Abilities** | Lexical diversity, sentence complexity, logical structure of arguments. | Clarity and speed of thought, logical flow of spoken arguments. | Problem-solving approach shown in a screen-share or whiteboard session. | Analysis of reasoning and structure in technical documents or essays. |
| **3. Emotional Intelligence** | Emotional vocabulary richness, sentiment analysis, use of empathy markers. | Emotional prosody (vocal tone), speech emotion recognition (SER). | Facial expression recognition (FACS), micro-expressions, empathetic responses. | Analysis of emotional language in personal narratives or emails. |
| **4. Values & Motivations** | Thematic analysis of goals, priorities, and frequently discussed topics. | Vocal emphasis and emotional tone when discussing certain topics. | Choices made in simulated scenarios, non-verbal reactions to value-laden topics. | Analysis of mission statements, personal essays, or project descriptions. |
| **5. Moral Reasoning** | Analysis of arguments in ethical dilemmas; use of words like "should," "ought," "fair." | Justifications for actions, vocal certainty when discussing moral issues. | Reactions to ethical scenarios presented in videos. | Analysis of policy documents, legal arguments, or philosophical essays. |
| **6. Decision-Making Styles** | Analysis of decision narratives (e.g., weighing pros and cons vs. "gut feeling"). | Hesitation markers (pauses, fillers), speed of response. | Speed and thoroughness of decision-making in interactive tasks. | Analysis of planning documents, business proposals, or strategy memos. |
| **7. Creativity** | Detection of novel metaphors, divergent ideas, and unique solutions. | Fluency and originality of spoken ideas, varied pitch and intonation. | Innovative use of tools or materials in a creative task. | Analysis of creative writing, design documents, or brainstorming notes. |
| **8. Attachment & Relationships** | Language used to describe relationships (secure, anxious); frequency of social words. | Emotional tone when discussing loved ones (warmth, anxiety). | Non-verbal behavior when interacting with others in a video call. | Analysis of personal correspondence or journal entries. |
| **9. Learning Styles** | Preference for text, diagrams, or examples in explanations. | Response to spoken instructions vs. requests to see information. | Engagement with hands-on tasks or visual demonstrations. | Analysis of how information is structured and presented in notes. |
| **10. Information Processing** | Structure of written communication (detail-oriented vs. big picture). | Speed and accuracy of information recall in conversation. | How information is organized visually in a presentation or diagram. | Analysis of outlines, summaries, and detailed reports. |
| **11. Metacognition** | Use of self-correction, planning statements, and reflective language. | Verbalization of thought processes ("I'm thinking that..."), pauses for reflection. | Use of strategies to monitor progress during a task. | Analysis of self-assessment reports or learning journals. |
| **12. Executive Functions** | Goal-setting language, structured responses, ability to stay on topic. | Fluency of speech, ability to inhibit interruptions, organized speech patterns. | Performance on problem-solving tasks requiring planning and organization. | Analysis of project plans, schedules, and to-do lists. |
| **13. Communication Styles** | Directness of language, use of questions, tone (assertive, passive). | Tone of voice, volume, pacing, and use of interruptions. | Body language, eye contact, gestures during conversation. | Analysis of email communication style (formal, informal, direct, indirect). |
| **14. Social Cognition** | Interpretation of social scenarios, understanding of social cues in text. | Understanding of sarcasm, humor, and other social cues in speech. | Accuracy in judging others' emotions and intentions from video. | Analysis of narratives involving social interactions. |
| **15. Resilience & Coping** | Narrative themes of overcoming adversity, use of positive reframing. | Stable emotional tone when discussing challenges. | Persistence in difficult tasks, emotional recovery after a setback. | Analysis of personal stories or journals about overcoming obstacles. |
| **16. Mindset** | Language about effort vs. ability ("I can learn" vs. "I'm not good at this"). | Tone when discussing successes and failures (effort-based vs. ability-based). | Response to feedback and challenges (embracing vs. avoiding). | Analysis of goal-setting documents and self-reflections. |
| **17. Psychopathology** | Negative sentiment, cognitive distortions, absolutist language. | Flat affect, anxious speech, psychomotor agitation in speech patterns. | Anhedonia (lack of pleasure), unusual facial expressions or body language. | Analysis of journal entries or writings for themes of hopelessness or distress. |
| **18. Political Ideology** | Use of politically charged language, expression of specific political values. | Emotional response and emphasis when discussing political topics. | Non-verbal reactions to political stimuli or news. | Analysis of essays, blog posts, or social media comments on political issues. |
| **19. Cultural Values** | Cultural references, language reflecting cultural norms (e.g., collectivism). | Accent, dialect, and culturally specific expressions. | Adherence to cultural customs in greetings or social interactions. | Analysis of documents for cultural context and assumptions. |
| **20. Work & Career Style** | Language about work-life balance, career goals, leadership preferences. | Enthusiasm and confidence when discussing work-related topics. | Collaboration and leadership style in group tasks or meetings. | Analysis of resumes, cover letters, and professional development plans. |
| **21. Sensory Processing** | Descriptions of sensory experiences and sensitivity to stimuli. | Sensitivity to noise levels, reactions to unexpected sounds. | Reactions to visual stimuli (light, color, motion). | Analysis of creative writing or product reviews for sensory details. |
| **22. Time Perspective** | Use of past, present, and future tense; focus on memories, immediate feelings, or goals. | Pacing of speech (rushed vs. deliberate), focus of conversation. | Planning and impulsivity in tasks. | Analysis of personal narratives, plans, and reflections on the past. |
| **23. Aesthetic Preferences** | Descriptions of art and music, expression of artistic tastes. | Emotional response to music (changes in tone, pitch). | Choices of visual art, design, or music when given options. | Analysis of reviews, critiques, or personal collections of art/music. |
