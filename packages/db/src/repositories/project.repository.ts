// =============================================================================
// packages/db/src/repositories/project.repository.ts
// Data-access layer for Project and ProjectEnvVar models.
// Every query is scoped by orgId — multi-tenant, no exceptions.
// =============================================================================

import { prisma, Prisma } from "../legacy-prisma-disabled";
import type {
  Project,
  ProjectEnvVar,
  ProjectStatus,
} from "../types";
import { getDb } from "../db";
import { projects, projectEnvVars, deployments, workflows } from "../db/schema";
import { eq, desc, asc, and } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FindProjectsParams {
  orgId: string;
  status?: ProjectStatus;
  page?: number;
  limit?: number;
}

export interface ProjectWithRelations extends Project {
  deployments?: { id: string; status: string }[];
  workflows?: { id: string; name: string }[];
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class ProjectRepository {
  // -------------------------------------------------------------------------
  // Core CRUD
  // -------------------------------------------------------------------------

  /** Find a project by id, scoped to org. */
  async findById(id: string, orgId: string): Promise<Project | null> {
    const db = getDb();
    if (!db) return prisma.project.findFirst({ where: { id, orgId } });

    const rows = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.orgId, orgId)));
    return (rows[0] as unknown) as Project | null;
  }

  /** Find a project by slug within an org. */
  async findBySlug(slug: string, orgId: string): Promise<Project | null> {
    const db = getDb();
    if (!db) return prisma.project.findUnique({ where: { orgId_slug: { orgId, slug } } });

    const rows = await db.select().from(projects).where(and(eq(projects.orgId, orgId), eq(projects.slug, slug)));
    return (rows[0] as unknown) as Project | null;
  }

  /** Find a project by its unique subdomain. */
  async findBySubdomain(subdomain: string): Promise<Project | null> {
    const db = getDb();
    if (!db) return prisma.project.findUnique({ where: { subdomain } });

    const rows = await db.select().from(projects).where(eq(projects.subdomain, subdomain));
    return (rows[0] as unknown) as Project | null;
  }

  /** List projects for an org with optional status filter. */
  async findMany(
    params: FindProjectsParams
  ): Promise<{ data: Project[]; total: number }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const db = getDb();
    if (!db) {
      const where: Prisma.ProjectWhereInput = {
        orgId: params.orgId,
        ...(params.status ? { status: params.status } : {}),
      };

      const [data, total] = await prisma.$transaction([
        prisma.project.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
        prisma.project.count({ where }),
      ]);

      return { data, total };
    }

    const conditions: any[] = [eq(projects.orgId, params.orgId)];
    if (params.status) conditions.push(eq(projects.status, params.status));

    const whereExpr = conditions.length === 1 ? conditions[0] : and(...conditions);
    const all = await db.select().from(projects).where(whereExpr).orderBy(desc(projects.createdAt));
    const total = all.length;
    const data = all.slice(skip, skip + limit) as unknown as Project[];
    return { data, total };
  }

  /** Create a new project within an org. */
  async create(
    orgId: string,
    data: Omit<Prisma.ProjectCreateInput, "org">
  ): Promise<Project> {
    const db = getDb();
    if (!db)
      return prisma.project.create({ data: { ...data, org: { connect: { id: orgId } } } });

    const insert = await db.insert(projects).values({ ...(data as any), orgId }).returning();
    return (insert[0] as unknown) as Project;
  }

  /** Update a project (must belong to org). */
  async update(
    id: string,
    orgId: string,
    data: Prisma.ProjectUpdateInput
  ): Promise<Project> {
    // Verify ownership first, then update
    const db = getDb();
    if (!db) {
      const project = await prisma.project.findFirst({ where: { id, orgId } });
      if (!project) throw new Error(`Project ${id} not found in org ${orgId}`);
      return prisma.project.update({ where: { id }, data });
    }

    const rows = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.orgId, orgId)));
    if (!rows[0]) throw new Error(`Project ${id} not found in org ${orgId}`);

    await db.update(projects).set(data as any).where(eq(projects.id, id));
    const updated = await db.select().from(projects).where(eq(projects.id, id));
    return (updated[0] as unknown) as Project;
  }

  /** Soft-delete by setting status to DELETED. */
  async softDelete(id: string, orgId: string): Promise<Project> {
    const db = getDb();
    if (!db) {
      const project = await prisma.project.findFirst({ where: { id, orgId } });
      if (!project) throw new Error(`Project ${id} not found in org ${orgId}`);
      return prisma.project.update({ where: { id }, data: { status: "DELETED" } });
    }

    const rows = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.orgId, orgId)));
    if (!rows[0]) throw new Error(`Project ${id} not found in org ${orgId}`);

    await db.update(projects).set({ status: "DELETED" }).where(eq(projects.id, id));
    const updated = await db.select().from(projects).where(eq(projects.id, id));
    return (updated[0] as unknown) as Project;
  }

  /** Hard-delete a project (cascades dependents). */
  async delete(id: string, orgId: string): Promise<Project> {
    const db = getDb();
    if (!db) {
      const project = await prisma.project.findFirst({ where: { id, orgId } });
      if (!project) throw new Error(`Project ${id} not found in org ${orgId}`);
      return prisma.project.delete({ where: { id } });
    }

    const rows = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.orgId, orgId)));
    if (!rows[0]) throw new Error(`Project ${id} not found in org ${orgId}`);

    const deleted = await db.delete(projects).where(eq(projects.id, id)).returning();
    return (deleted[0] as unknown) as Project;
  }

  /** Count projects in an org, optionally by status. */
  async count(orgId: string, status?: ProjectStatus): Promise<number> {
    const db = getDb();
    if (!db) return prisma.project.count({ where: { orgId, ...(status ? { status } : {}) } });

    const conditions: any[] = [eq(projects.orgId, orgId)];
    if (status) conditions.push(eq(projects.status, status));
    const whereExpr = conditions.length === 1 ? conditions[0] : and(...conditions);
    const all = await db.select().from(projects).where(whereExpr);
    return all.length;
  }

  // -------------------------------------------------------------------------
  // Project with relations
  // -------------------------------------------------------------------------

  /** Fetch a project with its deployments and workflows. */
  async findByIdWithRelations(
    id: string,
    orgId: string
  ): Promise<ProjectWithRelations | null> {
    const db = getDb();
    if (!db)
      return prisma.project.findFirst({ where: { id, orgId }, include: { deployments: { select: { id: true, status: true }, orderBy: { createdAt: "desc" }, take: 10 }, workflows: { select: { id: true, name: true }, orderBy: { createdAt: "desc" } } } });

    const p = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.orgId, orgId)));
    if (!p[0]) return null;

    const deps = await db
      .select({ id: deployments.id, status: deployments.status })
      .from(deployments)
      .where(eq(deployments.projectId, id))
      .orderBy(desc(deployments.createdAt))
      .limit(10);

    const wfs = await db
      .select({ id: workflows.id, name: workflows.name })
      .from(workflows)
      .where(eq(workflows.projectId, id))
      .orderBy(desc(workflows.createdAt));

    const proj = p[0] as unknown as Project;
    return { ...proj, deployments: deps as any, workflows: wfs as any };
  }

  // -------------------------------------------------------------------------
  // Environment variables (scoped via project → orgId)
  // -------------------------------------------------------------------------

  /** List env vars for a project (after verifying org ownership). */
  async findEnvVars(
    projectId: string,
    orgId: string
  ): Promise<ProjectEnvVar[]> {
    const db = getDb();
    if (!db) return prisma.projectEnvVar.findMany({ where: { project: { id: projectId, orgId } }, orderBy: { key: "asc" } });

    const project = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
    if (!project[0]) throw new Error(`Project ${projectId} not found in org ${orgId}`);

    const rows = await db.select().from(projectEnvVars).where(eq(projectEnvVars.projectId, projectId)).orderBy(asc(projectEnvVars.key));
    return rows as unknown as ProjectEnvVar[];
  }

  /** Upsert an env var on a project. */
  async upsertEnvVar(
    projectId: string,
    orgId: string,
    key: string,
    value: string,
    isSecret = true
  ): Promise<ProjectEnvVar> {
    // Verify org ownership
    const db = getDb();
    if (!db) {
      const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
      if (!project) throw new Error(`Project ${projectId} not found in org ${orgId}`);
      return prisma.projectEnvVar.upsert({ where: { projectId_key: { projectId, key } }, create: { projectId, key, value, isSecret }, update: { value, isSecret } });
    }

    const project = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
    if (!project[0]) throw new Error(`Project ${projectId} not found in org ${orgId}`);

    const existing = await db.select().from(projectEnvVars).where(and(eq(projectEnvVars.projectId, projectId), eq(projectEnvVars.key, key)));
    if (existing[0]) {
      await db.update(projectEnvVars).set({ value, isSecret }).where(and(eq(projectEnvVars.projectId, projectId), eq(projectEnvVars.key, key)));
      const updated = await db.select().from(projectEnvVars).where(and(eq(projectEnvVars.projectId, projectId), eq(projectEnvVars.key, key)));
      return (updated[0] as unknown) as ProjectEnvVar;
    }

    const id = (globalThis as any).crypto?.randomUUID?.() ?? `env_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const inserted = await db.insert(projectEnvVars).values({ id, projectId, key, value, isSecret }).returning();
    return (inserted[0] as unknown) as ProjectEnvVar;
  }

  /** Delete an env var from a project. */
  async deleteEnvVar(
    projectId: string,
    orgId: string,
    key: string
  ): Promise<ProjectEnvVar> {
    const db = getDb();
    if (!db) {
      const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
      if (!project) throw new Error(`Project ${projectId} not found in org ${orgId}`);
      return prisma.projectEnvVar.delete({ where: { projectId_key: { projectId, key } } });
    }

    const project = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
    if (!project[0]) throw new Error(`Project ${projectId} not found in org ${orgId}`);

    const deleted = await db.delete(projectEnvVars).where(and(eq(projectEnvVars.projectId, projectId), eq(projectEnvVars.key, key))).returning();
    return (deleted[0] as unknown) as ProjectEnvVar;
  }
}
