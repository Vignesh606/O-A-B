import { drizzle, type AnyD1Database } from "drizzle-orm/d1";

import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>;

export function createDb(database: AnyD1Database) {
  return drizzle(database, { schema });
}
