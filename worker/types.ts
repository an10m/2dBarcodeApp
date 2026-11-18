// Minimal Cloudflare D1 / Worker types so the project type-checks without extra packages.
export interface D1Result<T> { results: T[]; success: boolean; meta: { last_row_id?: number; changes?: number } }
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<unknown>>;
}
export interface D1Database { prepare(query: string): D1PreparedStatement }

export interface Env {
  DB: D1Database;
  /** Long random string used to sign session cookies: `wrangler secret put SESSION_SECRET`. */
  SESSION_SECRET: string;
}

export type UserRow = { id: number; username: string; password_hash: string; pharmacy_name: string; city: string; active: number };
