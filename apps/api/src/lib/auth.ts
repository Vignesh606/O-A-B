// =============================================================================
// apps/api/src/lib/auth.ts
// Auth helpers — resolve Clerk session → DB user + org membership.
// Use requireAuth() at the top of every protected route handler.
// =============================================================================

import { headers } from "next/headers";
import { prisma } from "@oneatlas/db";
import { UnauthorizedError, ForbiddenError } from "@oneatlas/shared";
import type { UserRole } from "@oneatlas/db";

export interface AuthContext {
  userId: string;
  orgId: string;
  role: UserRole;
  clerkUserId: string;
}

/**
 * Resolve the current session and load the DB user.
 * Throws UnauthorizedError if no valid session.
 */
export async function requireAuth() {
  const reqHeaders = await headers();
  const apiKeyUserId = reqHeaders.get("x-api-key-user-id");
  if (apiKeyUserId) {
    return {
      user: { id: apiKeyUserId, status: "ACTIVE", email: "api-key@oneatlas.dev" },
      clerkUserId: "api-key",
    };
  }

  const clerkUserIdFromHeader = reqHeaders.get("x-clerk-user-id");

  const clerkUserId = clerkUserIdFromHeader;

  if (!clerkUserId) {
    throw new UnauthorizedError("No valid session found");
  }

  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true, status: true, email: true },
  });

  // Auto-onboarding: create DB user on first login
  if (!user) {
    try {
      const email = reqHeaders.get("x-clerk-email") ?? `${clerkUserId}@oneatlas.dev`;
      const existingUser = await prisma.user.findFirst({
        where: { email },
        select: { id: true, status: true, email: true },
      });

      if (existingUser) {
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: { clerkId: clerkUserId },
          select: { id: true, status: true, email: true },
        });
      } else {
        user = await prisma.user.create({
          data: {
            clerkId: clerkUserId,
            email,
            name: reqHeaders.get("x-clerk-name") ?? "User",
            avatarUrl: reqHeaders.get("x-clerk-avatar-url"),
            status: "ACTIVE",
          },
          select: { id: true, status: true, email: true },
        });
      }
    } catch (err) {
      console.error("[Auto-Onboarding] Failed to create or link user:", err);
      throw new UnauthorizedError("User not found. Please complete onboarding.");
    }
  }

  if (user.status === "SUSPENDED") {
    throw new ForbiddenError("Your account has been suspended. Contact support.");
  }

  return { user, clerkUserId };
}

/**
 * Resolve auth + verify the user is a member of the given org.
 * Throws ForbiddenError if not a member.
 * Optionally require a minimum role level.
 */

export async function requireOrgMember(
  orgId: string,
  minimumRole?: UserRole
) {
  const { user, clerkUserId } = await requireAuth();

  const reqHeaders = await headers();
  const apiKeyOrgId = reqHeaders.get("x-api-key-org-id");
  if (apiKeyOrgId) {
    return {
      userId: user.id,
      orgId: apiKeyOrgId,
      role: "OWNER",
      clerkUserId,
    } satisfies AuthContext;
  }

  const sessionOrgId = reqHeaders.get("x-clerk-org-id") ?? null;
  const sessionOrgRole = reqHeaders.get("x-clerk-org-role") ?? null;
  const sessionOrgSlug = reqHeaders.get("x-clerk-org-slug") ?? null;

  console.log(`[auth] requireOrgMember inputs: routeOrgId=${orgId} sessionOrgId=${sessionOrgId}`);

  // Try to find organization first by ID or Clerk ID
  const organization = await prisma.organization.findFirst({
    where: { OR: [{ id: orgId }, { clerkOrgId: orgId }] },
    select: { id: true },
  });

  console.log(`[auth] requireOrgMember db lookup result: ${organization ? `found ID ${organization.id}` : "not found"}`);

  let membership = null;
  let resolvedOrgId = orgId;

  if (organization) {
    resolvedOrgId = organization.id;
    membership = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId: organization.id, userId: user.id } },
      select: { role: true },
    });
  }

  // Auto-create Organization and OrgMember if Clerk session matches
  if (!membership && sessionOrgId === orgId) {
    try {
      let dbOrg = organization;
      if (!dbOrg) {
        const orgName = sessionOrgSlug ? sessionOrgSlug.toUpperCase() : "My Organization";
        const slug = sessionOrgSlug ?? `org-${Date.now()}`;
        dbOrg = await prisma.organization.create({
          data: {
            clerkOrgId: orgId,
            name: orgName,
            slug,
            ownerId: user.id,
            plan: "FREE",
            status: "ACTIVE",
          },
          select: { id: true },
        });
      }

      resolvedOrgId = dbOrg.id;

      const roleMap: Record<string, UserRole> = {
        "org:admin": "ADMIN",
        "org:owner": "OWNER",
        "org:member": "MEMBER",
      };
      const assignedRole: UserRole = roleMap[sessionOrgRole ?? ""] ?? "MEMBER";

      await prisma.orgMember.upsert({
        where: { orgId_userId: { orgId: dbOrg.id, userId: user.id } },
        create: { orgId: dbOrg.id, userId: user.id, role: assignedRole },
        update: { role: assignedRole },
      });

      membership = { role: assignedRole };
    } catch (err) {
      console.error("[Auto-Onboarding] Failed to create org/member:", err);
    }
  }

  // Direct DB organization lookup fallback
  if (!membership && organization) {
    const directMembership = await prisma.orgMember.findFirst({
      where: {
        orgId: organization.id,
        userId: user.id,
      },
      select: { role: true },
    });
    if (directMembership) {
      membership = { role: directMembership.role };
    }
  }

  if (!membership) {
    throw new ForbiddenError("You are not a member of this organization");
  }

  if (minimumRole && !hasMinimumRole(membership.role as UserRole, minimumRole)) {
    throw new ForbiddenError(
      `This action requires ${minimumRole} role or higher`
    );
  }

  return {
    userId: user.id,
    orgId: resolvedOrgId,
    role: membership.role as UserRole,
    clerkUserId,
  } satisfies AuthContext;
}

/**
 * Require the user to be an OWNER or ADMIN of an org.
 */
export async function requireOrgAdmin(orgId: string) {
  return requireOrgMember(orgId, "ADMIN");
}

/**
 * Require the user to be the OWNER of an org.
 */
export async function requireOrgOwner(orgId: string) {
  return requireOrgMember(orgId, "OWNER");
}

// ── Role hierarchy ────────────────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export function hasMinimumRole(
  actual: UserRole,
  required: UserRole
): boolean {
  const actualLevel = ROLE_HIERARCHY[actual] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[required] ?? 0;
  return actualLevel >= requiredLevel;
}
