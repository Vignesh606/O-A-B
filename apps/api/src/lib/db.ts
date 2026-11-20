import { getDb, setDb } from "@oneatlas/db";

type D1PreparedStatement = {
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results?: T[] }>;
  run(): Promise<unknown>;
  bind(...values: unknown[]): D1PreparedStatement;
};

type D1Binding = {
  prepare(query: string): D1PreparedStatement;
};

type CloudflareEnv = {
  DB?: D1Binding;
};

async function getCloudflareEnv(): Promise<CloudflareEnv> {
  const contextSymbol = Symbol.for("__cloudflare-request-context__");
  const context = (globalThis as Record<PropertyKey, unknown>)[contextSymbol] as
    | { env?: CloudflareEnv }
    | undefined;

  return context?.env ?? {};
}

export async function initDb() {
  const existing = getDb();
  if (existing) return existing;

  const env = await getCloudflareEnv();
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding DB is not configured.");
  }

  setDb(env.DB as never);
  return getDb();
}

export async function getD1Binding() {
  const env = await getCloudflareEnv();
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding DB is not configured.");
  }

  return env.DB;
}
