// =============================================================================
// packages/db/src/repositories/user.repository.ts
// Data-access layer for User and related auth models.
// All membership queries are scoped by orgId (multi-tenant).
// =============================================================================

import { prisma, Prisma } from "../legacy-prisma-disabled";
import type { User, UserSession, OrgMember } from "../types";
import { getDb } from "../db";
import { users, userSessions, orgMembers } from "../db/schema";
import { eq, desc } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FindUsersInOrgParams {
  orgId: string;
  page?: number;
  limit?: number;
}

export interface UserWithMembership extends User {
  memberships: OrgMember[];
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class UserRepository {
  // -------------------------------------------------------------------------
  // Core CRUD
  // -------------------------------------------------------------------------

  /** Find a user by their internal id. */
  async findById(id: string): Promise<User | null> {
    const db = getDb();
    if (!db) return prisma.user.findUnique({ where: { id } });

    const rows = await db.select().from(users).where(eq(users.id, id));
    return (rows[0] as unknown) as User | null;
  }

  /** Find a user by Clerk external id. */
  async findByClerkId(clerkId: string): Promise<User | null> {
    const db = getDb();
    if (!db) return prisma.user.findUnique({ where: { clerkId } });

    const rows = await db.select().from(users).where(eq(users.clerkId, clerkId));
    return (rows[0] as unknown) as User | null;
  }

  /** Find a user by email address. */
  async findByEmail(email: string): Promise<User | null> {
    const db = getDb();
    if (!db) return prisma.user.findUnique({ where: { email } });

    const rows = await db.select().from(users).where(eq(users.email, email));
    return (rows[0] as unknown) as User | null;
  }

  /** Create a new user record. */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    const db = getDb();
    if (!db) return prisma.user.create({ data });

    const insert = await db.insert(users).values(data as any).returning();
    return (insert[0] as unknown) as User;
  }

  /** Update an existing user. */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    const db = getDb();
    if (!db) return prisma.user.update({ where: { id }, data });

    await db.update(users).set(data as any).where(eq(users.id, id));
    const rows = await db.select().from(users).where(eq(users.id, id));
    return (rows[0] as unknown) as User;
  }

  /** Hard-delete a user by id. */
  async delete(id: string): Promise<User> {
    const db = getDb();
    if (!db) return prisma.user.delete({ where: { id } });

    const deleted = await db.delete(users).where(eq(users.id, id)).returning();
    return (deleted[0] as unknown) as User;
  }

  // -------------------------------------------------------------------------
  // Org-scoped queries (multi-tenant)
  // -------------------------------------------------------------------------

  /** List all users that belong to a given org. */
  async findByOrgId(
    orgId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<{ data: User[]; total: number }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;
    const db = getDb();
    if (!db) {
      const [data, total] = await prisma.$transaction([
        prisma.user.findMany({
          where: { memberships: { some: { orgId } } },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where: { memberships: { some: { orgId } } } }),
      ]);

      return { data, total };
    }

    // NOTE: Simple implementation using EXISTS; not optimized for very large orgs.
    const existsCondition = (orgIdParam: string) =>
      //@ts-ignore - raw EXISTS expression
      db.raw(
        `EXISTS (SELECT 1 FROM org_members WHERE org_members.user_id = users.id AND org_members.org_id = ? )`,
        [orgIdParam]
      );

    const rows = await db
      .select()
      .from(users)
      .where(existsCondition(orgId))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(skip);

    // count (simple route): fetch total matching rows
    const allRows = await db.select().from(users).where(existsCondition(orgId));
    return { data: allRows.slice(skip, skip + limit) as unknown as User[], total: allRows.length };
  }

  /** Find a single user within an org (confirms membership). */
  async findByIdInOrg(id: string, orgId: string): Promise<User | null> {
    const db = getDb();
    if (!db)
      return prisma.user.findFirst({ where: { id, memberships: { some: { orgId } } } });

    const rows = await db
      .select()
      .from(users)
      .where(
        eq(users.id, id),
        //@ts-ignore
        db.raw(
          `EXISTS (SELECT 1 FROM org_members WHERE org_members.user_id = users.id AND org_members.org_id = ? )`,
          [orgId]
        )
      );

    return (rows[0] as unknown) as User | null;
  }

  // -------------------------------------------------------------------------
  // Sessions
  // -------------------------------------------------------------------------

  /** Create a user session record. */
  async createSession(
    data: Prisma.UserSessionCreateInput
  ): Promise<UserSession> {
    const db = getDb();
    if (!db) return prisma.userSession.create({ data });

    const insert = await db.insert(userSessions).values(data as any).returning();
    return (insert[0] as unknown) as UserSession;
  }

  /** Delete a session by Clerk session id. */
  async deleteSessionByClerkId(clerkSession: string): Promise<UserSession> {
    const db = getDb();
    if (!db) return prisma.userSession.delete({ where: { clerkSession } });

    const deleted = await db.delete(userSessions).where(eq(userSessions.clerkSession, clerkSession)).returning();
    return (deleted[0] as unknown) as UserSession;
  }

  /** Update user's lastActiveAt timestamp. */
  async touch(id: string): Promise<User> {
    const db = getDb();
    if (!db)
      return prisma.user.update({ where: { id }, data: { lastActiveAt: new Date() } });

    await db.update(users).set({ lastActiveAt: new Date().toISOString() }).where(eq(users.id, id));
    const rows = await db.select().from(users).where(eq(users.id, id));
    return (rows[0] as unknown) as User;
  }
}
