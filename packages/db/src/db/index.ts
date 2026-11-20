export * from "./client";
export * from "./schema";

import type { AnyD1Database } from "drizzle-orm/d1";
import { createDb } from "./client";

let _db: ReturnType<typeof createDb> | null = null;

export function setDb(database: AnyD1Database) {
	_db = createDb(database);
}

export function getDb() {
	if (_db) return _db;

	// Auto-resolve D1 binding from Cloudflare next-on-pages request context
	const contextSymbol = Symbol.for("__cloudflare-request-context__");
	const context = (globalThis as Record<PropertyKey, unknown>)[contextSymbol] as
		| { env?: { DB?: AnyD1Database } }
		| undefined;
		
	const dbBinding = context?.env?.DB;
	if (dbBinding) {
		_db = createDb(dbBinding);
		return _db;
	}

	return null;
}