/**
 * TinkerBird Vector Database Module
 * Phase 2: Semantic search and similarity using 384-dimensional embeddings
 *
 * Collections:
 * - message_embeddings: Vector representations of user messages
 * - topic_embeddings: Extracted topic vectors for clustering
 * - concept_embeddings: Abstract concept vectors for similarity
 */

import { VectorStore } from 'tinkerbird'
import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers'

// Embedding model configuration
// Using BGE-small which produces 384-dimensional embeddings compatible with TinkerBird
// This is the most reliable model with HuggingFace Transformers.js v3
const EMBEDDING_MODEL = 'Xenova/bge-small-en-v1.5' // ~33MB, high quality embeddings

// Vector store instances
let messageStore: VectorStore | null = null
let topicStore: VectorStore | null = null
let conceptStore: VectorStore | null = null

// Embedding pipeline (lazy loaded)
let embeddingPipeline: FeatureExtractionPipeline | null = null
let isInitializing = false
let embeddingLoadFailed = false

// Initialization state
let isInitialized = false

// ID counters for TinkerBird (requires numeric IDs)
let messageIdCounter = 1
let topicIdCounter = 1
let conceptIdCounter = 1

// Map string IDs to numeric IDs
const messageIdMap = new Map<string, number>()
const topicIdMap = new Map<string, number>()
const conceptIdMap = new Map<string, number>()

/**
 * Initialize the embedding pipeline
 */
async function initEmbeddingPipeline(): Promise<FeatureExtractionPipeline | null> {
  if (embeddingPipeline) return embeddingPipeline
  if (embeddingLoadFailed) return null

  if (isInitializing) {
    // Wait for initialization to complete with a timeout (max 30 seconds)
    let waitTime = 0
    const maxWait = 30000
    while (isInitializing && waitTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
      waitTime += 100
    }
    if (waitTime >= maxWait) {
      console.warn('Embedding initialization timed out')
      return null
    }
    return embeddingPipeline
  }

  isInitializing = true

  try {
    console.log('Loading embedding model:', EMBEDDING_MODEL)

    // @ts-expect-error - HuggingFace pipeline types are too complex for TypeScript
    embeddingPipeline = await pipeline('feature-extraction', EMBEDDING_MODEL, {
      dtype: 'q8', // Use quantized int8 model for browser (v3 API)
    })

    console.log('✓ Embedding model loaded successfully:', EMBEDDING_MODEL)
    isInitializing = false
    return embeddingPipeline
  } catch (error) {
    console.warn('Failed to load embedding model:', error instanceof Error ? error.message : error)
    embeddingLoadFailed = true
    isInitializing = false
    return null
  }
}

/**
 * Initialize all vector stores
 * Uses TinkerBird's static create() method for proper initialization
 */
export async function initVectorDB(): Promise<boolean> {
  if (isInitialized) return true

  try {
    console.log('Initializing TinkerBird vector stores...')

    // Create vector stores using the static create() method
    // TinkerBird requires this pattern instead of new VectorStore()
    messageStore = await VectorStore.create({
      collectionName: 'message_embeddings',
      M: 16, // Maximum neighbor count
      efConstruction: 200, // Construction quality parameter
    })

    topicStore = await VectorStore.create({
      collectionName: 'topic_embeddings',
      M: 16,
      efConstruction: 200,
    })

    conceptStore = await VectorStore.create({
      collectionName: 'concept_embeddings',
      M: 16,
      efConstruction: 200,
    })

    isInitialized = true
    console.log('TinkerBird vector stores initialized successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize TinkerBird vector stores:', error)
    isInitialized = true // Mark as initialized to prevent retries
    return false
  }
}

/**
 * Generate embedding for text
 * Returns null if embedding model is not available
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const pipe = await initEmbeddingPipeline()

  if (!pipe) {
    return null
  }

  try {
    // Generate embedding
    const output = await pipe(text, {
      pooling: 'mean',
      normalize: true,
    })

    // Convert to array
    return Array.from(output.data as Float32Array)
  } catch (error) {
    console.warn('Failed to generate embedding:', error)
    return null
  }
}

/**
 * Helper to get or create numeric ID for a string key
 */
function getOrCreateNumericId(
  stringId: string,
  idMap: Map<string, number>,
  counter: { value: number }
): number {
  if (idMap.has(stringId)) {
    return idMap.get(stringId)!
  }
  const numericId = counter.value++
  idMap.set(stringId, numericId)
  return numericId
}

/**
 * Store message embedding
 */
export async function storeMessageEmbedding(
  messageId: number,
  content: string,
  metadata?: {
    sessionId?: string
    timestamp?: Date
    role?: 'user' | 'assistant'
  }
): Promise<void> {
  if (!messageStore) {
    await initVectorDB()
  }
  if (!messageStore) return

  const embedding = await generateEmbedding(content)
  if (!embedding) {
    // Embedding model not available, skip vector storage
    return
  }

  // TinkerBird uses numeric IDs and string content
  // Store metadata as JSON in content field
  const stringId = `msg_${messageId}`
  const numericId = getOrCreateNumericId(stringId, messageIdMap, { value: messageIdCounter })
  messageIdCounter = Math.max(messageIdCounter, numericId + 1)

  const contentWithMeta = JSON.stringify({
    id: stringId,
    messageId,
    content: content.substring(0, 500), // Store truncated content for reference
    ...metadata,
    timestamp: metadata?.timestamp?.toISOString() || new Date().toISOString(),
  })

  await messageStore.addVector(numericId, embedding, contentWithMeta)
  await messageStore.saveIndex()
}

/**
 * Store topic embedding
 */
export async function storeTopicEmbedding(
  topicId: string,
  topicText: string,
  metadata?: {
    domain?: string
    frequency?: number
    firstSeen?: Date
    lastSeen?: Date
  }
): Promise<void> {
  if (!topicStore) {
    await initVectorDB()
  }
  if (!topicStore) return

  const embedding = await generateEmbedding(topicText)
  if (!embedding) {
    // Embedding model not available, skip vector storage
    return
  }

  const stringId = `topic_${topicId}`
  const numericId = getOrCreateNumericId(stringId, topicIdMap, { value: topicIdCounter })
  topicIdCounter = Math.max(topicIdCounter, numericId + 1)

  const contentWithMeta = JSON.stringify({
    id: stringId,
    topicId,
    topicText,
    ...metadata,
  })

  await topicStore.addVector(numericId, embedding, contentWithMeta)
  await topicStore.saveIndex()
}

/**
 * Store concept embedding
 */
export async function storeConceptEmbedding(
  conceptId: string,
  conceptText: string,
  metadata?: {
    type?: 'value' | 'belief' | 'interest' | 'goal' | 'preference'
    confidence?: number
    domain?: string
  }
): Promise<void> {
  if (!conceptStore) {
    await initVectorDB()
  }
  if (!conceptStore) return

  const embedding = await generateEmbedding(conceptText)
  if (!embedding) {
    // Embedding model not available, skip vector storage
    return
  }

  const stringId = `concept_${conceptId}`
  const numericId = getOrCreateNumericId(stringId, conceptIdMap, { value: conceptIdCounter })
  conceptIdCounter = Math.max(conceptIdCounter, numericId + 1)

  const contentWithMeta = JSON.stringify({
    id: stringId,
    conceptId,
    conceptText,
    ...metadata,
  })

  await conceptStore.addVector(numericId, embedding, contentWithMeta)
  await conceptStore.saveIndex()
}

/**
 * Parse content JSON safely
 */
function parseContent(content: string): Record<string, unknown> {
  try {
    return JSON.parse(content)
  } catch {
    return { content }
  }
}

/**
 * Search similar messages
 */
export async function searchSimilarMessages(
  query: string,
  limit: number = 10
): Promise<Array<{
  id: string
  score: number
  metadata: Record<string, unknown>
}>> {
  if (!messageStore) {
    await initVectorDB()
  }
  if (!messageStore) return []

  const queryEmbedding = await generateEmbedding(query)
  if (!queryEmbedding) return []

  // TinkerBird query returns {id, content, embedding, score}[]
  const results = messageStore.query(queryEmbedding, limit)

  return results.map((r) => {
    const metadata = parseContent(r.content)
    return {
      id: (metadata.id as string) || `msg_${r.id}`,
      score: r.score,
      metadata,
    }
  })
}

/**
 * Search similar topics
 */
export async function searchSimilarTopics(
  query: string,
  limit: number = 10
): Promise<Array<{
  id: string
  score: number
  metadata: Record<string, unknown>
}>> {
  if (!topicStore) {
    await initVectorDB()
  }
  if (!topicStore) return []

  const queryEmbedding = await generateEmbedding(query)
  if (!queryEmbedding) return []

  const results = topicStore.query(queryEmbedding, limit)

  return results.map((r) => {
    const metadata = parseContent(r.content)
    return {
      id: (metadata.id as string) || `topic_${r.id}`,
      score: r.score,
      metadata,
    }
  })
}

/**
 * Search similar concepts
 */
export async function searchSimilarConcepts(
  query: string,
  limit: number = 10
): Promise<Array<{
  id: string
  score: number
  metadata: Record<string, unknown>
}>> {
  if (!conceptStore) {
    await initVectorDB()
  }
  if (!conceptStore) return []

  const queryEmbedding = await generateEmbedding(query)
  if (!queryEmbedding) return []

  const results = conceptStore.query(queryEmbedding, limit)

  return results.map((r) => {
    const metadata = parseContent(r.content)
    return {
      id: (metadata.id as string) || `concept_${r.id}`,
      score: r.score,
      metadata,
    }
  })
}

/**
 * Find semantically similar messages to a given message
 */
export async function findRelatedMessages(
  messageId: number,
  limit: number = 5
): Promise<Array<{
  id: string
  score: number
  metadata: Record<string, unknown>
}>> {
  if (!messageStore) {
    await initVectorDB()
  }
  if (!messageStore) return []

  // Find the message's embedding
  const stringId = `msg_${messageId}`
  const numericId = messageIdMap.get(stringId)

  if (numericId === undefined) {
    return []
  }

  // Get the node from the store
  const node = messageStore.nodes.get(numericId)
  if (!node) {
    return []
  }

  // Query with the message's embedding
  const results = messageStore.query(node.embedding, limit + 1)

  // Filter out the original message and return
  return results
    .filter((r) => r.id !== numericId)
    .slice(0, limit)
    .map((r) => {
      const metadata = parseContent(r.content)
      return {
        id: (metadata.id as string) || `msg_${r.id}`,
        score: r.score,
        metadata,
      }
    })
}

/**
 * Cluster messages by semantic similarity
 * Returns groups of related messages
 */
export async function clusterMessages(
  threshold: number = 0.7
): Promise<Array<Array<string>>> {
  if (!messageStore) {
    await initVectorDB()
  }
  if (!messageStore) return []

  // Get all nodes from the store
  const allNodes = Array.from(messageStore.nodes.values())

  if (allNodes.length === 0) {
    return []
  }

  const clusters: Array<Set<string>> = []
  const assigned = new Set<number>()

  for (const node of allNodes) {
    if (assigned.has(node.id)) continue

    // Find similar messages
    const similar = messageStore.query(node.embedding, 20)

    // Create cluster with messages above threshold
    const nodeMetadata = parseContent(node.content)
    const nodeStringId = (nodeMetadata.id as string) || `msg_${node.id}`
    const cluster = new Set<string>([nodeStringId])

    for (const s of similar) {
      if (s.score >= threshold && !assigned.has(s.id)) {
        const metadata = parseContent(s.content)
        const stringId = (metadata.id as string) || `msg_${s.id}`
        cluster.add(stringId)
        assigned.add(s.id)
      }
    }

    if (cluster.size > 1) {
      clusters.push(cluster)
    }
    assigned.add(node.id)
  }

  return clusters.map(c => Array.from(c))
}

/**
 * Extract and store topics from a message
 */
export async function extractAndStoreTopics(
  messageId: number,
  content: string
): Promise<string[]> {
  // Simple topic extraction: extract noun phrases and key terms
  // In production, you'd use a more sophisticated NER/topic model

  const words = content.toLowerCase().split(/\s+/)
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we',
    'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its',
    'our', 'their', 'this', 'that', 'these', 'those', 'and', 'or', 'but',
    'if', 'then', 'else', 'when', 'where', 'why', 'how', 'what', 'which',
    'who', 'whom', 'to', 'from', 'in', 'on', 'at', 'by', 'for', 'with',
    'about', 'as', 'of', 'so', 'just', 'very', 'really', 'quite', 'too',
  ])

  // Extract meaningful words (potential topics)
  const topicCandidates = words
    .filter(w => w.length > 3)
    .filter(w => !stopWords.has(w))
    .filter(w => /^[a-z]+$/.test(w)) // Only alphabetic

  // Get unique topics
  const uniqueTopics = [...new Set(topicCandidates)]

  // Store top 5 topics
  const topTopics = uniqueTopics.slice(0, 5)

  for (const topic of topTopics) {
    const topicId = `${messageId}_${topic}`
    await storeTopicEmbedding(topicId, topic, {
      firstSeen: new Date(),
      lastSeen: new Date(),
      frequency: 1,
    })
  }

  return topTopics
}

/**
 * Extract and store concepts (values, beliefs, interests) from text
 */
export async function extractAndStoreConcepts(
  messageId: number,
  content: string,
  domainScores: Record<string, number>
): Promise<void> {
  // Extract concepts based on domain scores
  // High-scoring domains suggest strong concepts

  const conceptTypes = {
    values: ['openness', 'conscientiousness', 'agreeableness'],
    beliefs: ['growth_mindset', 'moral_reasoning', 'political_ideology'],
    interests: ['creativity', 'aesthetic_preferences', 'learning_styles'],
    goals: ['achievement', 'power', 'self_direction'],
  }

  for (const [type, domains] of Object.entries(conceptTypes)) {
    for (const domain of domains) {
      const score = domainScores[domain] || 0
      if (score > 0.6) {
        // High confidence concept
        const conceptId = `${messageId}_${domain}`
        await storeConceptEmbedding(conceptId, `${domain}: ${content.substring(0, 200)}`, {
          type: type as 'value' | 'belief' | 'interest' | 'goal',
          confidence: score,
          domain,
        })
      }
    }
  }
}

/**
 * Get embedding statistics
 */
export async function getVectorStats(): Promise<{
  messageCount: number
  topicCount: number
  conceptCount: number
  isInitialized: boolean
  embeddingModelLoaded: boolean
  embeddingLoadFailed: boolean
}> {
  const messageCount = messageStore ? messageStore.nodes.size : 0
  const topicCount = topicStore ? topicStore.nodes.size : 0
  const conceptCount = conceptStore ? conceptStore.nodes.size : 0

  return {
    messageCount,
    topicCount,
    conceptCount,
    isInitialized,
    embeddingModelLoaded: embeddingPipeline !== null,
    embeddingLoadFailed,
  }
}

/**
 * Check if embeddings are available
 */
export function isEmbeddingAvailable(): boolean {
  return embeddingPipeline !== null && !embeddingLoadFailed
}

/**
 * Compute cosine similarity between two vectors
 * Returns similarity score between -1 and 1
 */
export function computeCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Ensure embedding pipeline is initialized
 * Call this during app startup to pre-load the model
 */
export async function ensureEmbeddingReady(): Promise<boolean> {
  const pipe = await initEmbeddingPipeline()
  return pipe !== null
}

/**
 * Clear all vector stores
 */
export async function clearVectorStores(): Promise<void> {
  if (messageStore) {
    await messageStore.deleteIndex()
    messageStore = await VectorStore.create({
      collectionName: 'message_embeddings',
      M: 16,
      efConstruction: 200,
    })
  }
  if (topicStore) {
    await topicStore.deleteIndex()
    topicStore = await VectorStore.create({
      collectionName: 'topic_embeddings',
      M: 16,
      efConstruction: 200,
    })
  }
  if (conceptStore) {
    await conceptStore.deleteIndex()
    conceptStore = await VectorStore.create({
      collectionName: 'concept_embeddings',
      M: 16,
      efConstruction: 200,
    })
  }

  // Reset ID maps and counters
  messageIdMap.clear()
  topicIdMap.clear()
  conceptIdMap.clear()
  messageIdCounter = 1
  topicIdCounter = 1
  conceptIdCounter = 1

  console.log('Vector stores cleared')
}

/**
 * Get all embeddings for inspection
 */
export async function getAllEmbeddings(): Promise<{
  messages: Array<{ id: string; metadata: Record<string, unknown> }>
  topics: Array<{ id: string; metadata: Record<string, unknown> }>
  concepts: Array<{ id: string; metadata: Record<string, unknown> }>
}> {
  const messages: Array<{ id: string; metadata: Record<string, unknown> }> = []
  const topics: Array<{ id: string; metadata: Record<string, unknown> }> = []
  const concepts: Array<{ id: string; metadata: Record<string, unknown> }> = []

  if (messageStore) {
    for (const node of messageStore.nodes.values()) {
      const metadata = parseContent(node.content)
      messages.push({
        id: (metadata.id as string) || `msg_${node.id}`,
        metadata,
      })
    }
  }

  if (topicStore) {
    for (const node of topicStore.nodes.values()) {
      const metadata = parseContent(node.content)
      topics.push({
        id: (metadata.id as string) || `topic_${node.id}`,
        metadata,
      })
    }
  }

  if (conceptStore) {
    for (const node of conceptStore.nodes.values()) {
      const metadata = parseContent(node.content)
      concepts.push({
        id: (metadata.id as string) || `concept_${node.id}`,
        metadata,
      })
    }
  }

  return { messages, topics, concepts }
}
