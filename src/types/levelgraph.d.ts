declare module 'levelgraph' {
  import type { Level } from 'level'

  interface Triple {
    subject: string
    predicate: string
    object: string
    [key: string]: unknown
  }

  interface Query {
    subject?: string
    predicate?: string
    object?: string
  }

  interface LevelGraph {
    put(triple: Triple, callback: (err: Error | null) => void): void
    del(triple: Triple | Query, callback: (err: Error | null) => void): void
    get(query: Query, callback: (err: Error | null, list: Triple[]) => void): void
    search(patterns: Query[], callback: (err: Error | null, solutions: Record<string, string>[]) => void): void
  }

  function levelgraph(db: Level | unknown): LevelGraph
  export = levelgraph
}
