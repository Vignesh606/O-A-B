// =============================================================================
// packages/db/src/client.ts
// Prisma client singleton — exports the Drizzle-backed Prisma mock.
// =============================================================================

import { prisma } from "./legacy-prisma-disabled";

export { prisma };
export default prisma;
