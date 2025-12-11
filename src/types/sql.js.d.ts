declare module 'sql.js' {
  interface SqlJsStatic {
    Database: typeof Database
  }

  interface QueryExecResult {
    columns: string[]
    values: (string | number | null | Uint8Array)[][]
  }

  interface ParamsObject {
    [key: string]: string | number | null | Uint8Array
  }

  interface ParamsCallback {
    (obj: ParamsObject): void
  }

  interface Statement {
    bind(params?: ParamsObject | (string | number | null | Uint8Array)[]): boolean
    step(): boolean
    getAsObject(params?: ParamsObject): Record<string, unknown>
    get(params?: ParamsObject): (string | number | null | Uint8Array)[]
    run(params?: ParamsObject | (string | number | null | Uint8Array)[]): void
    reset(): void
    free(): boolean
    freemem(): void
    getColumnNames(): string[]
  }

  class Database {
    constructor(data?: ArrayLike<number> | Buffer | null)
    run(sql: string, params?: ParamsObject | (string | number | null | Uint8Array)[]): Database
    exec(sql: string, params?: (string | number | null | Uint8Array)[]): QueryExecResult[]
    each(
      sql: string,
      params: ParamsObject | (string | number | null | Uint8Array)[],
      callback: ParamsCallback,
      done: () => void
    ): Database
    each(sql: string, callback: ParamsCallback, done: () => void): Database
    prepare(sql: string, params?: ParamsObject | (string | number | null | Uint8Array)[]): Statement
    export(): Uint8Array
    close(): void
    getRowsModified(): number
    create_function(name: string, func: (...args: unknown[]) => unknown): Database
    create_aggregate(
      name: string,
      init: () => unknown,
      step: (state: unknown, ...args: unknown[]) => unknown,
      finalize: (state: unknown) => unknown
    ): Database
  }

  interface InitSqlJsOptions {
    locateFile?: (filename: string) => string
  }

  export default function initSqlJs(options?: InitSqlJsOptions): Promise<SqlJsStatic>
  export { Database, SqlJsStatic, QueryExecResult, Statement }
}
