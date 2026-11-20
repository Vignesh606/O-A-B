// =============================================================================
// packages/db/src/repositories/deployment.repository.ts
// Data-access layer for Deployment and DeploymentTelemetry models.
// Deployment has no direct orgId — tenant isolation is enforced via
// the parent Project.orgId join on every query.
// =============================================================================

import { prisma, Prisma } from "../legacy-prisma-disabled";
import type {
  Deployment,
  DeploymentTelemetry,
  DeploymentStatus,
  DeploymentEnv,
} from "../types";
import { getDb } from "../db";
import { deployments, deploymentTelemetry, projects } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FindDeploymentsParams {
  orgId: string;
  projectId: string;
  status?: DeploymentStatus;
  env?: DeploymentEnv;
  page?: number;
  limit?: number;
}

export interface DeploymentWithTelemetry extends Deployment {
  telemetry: DeploymentTelemetry | null;
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class DeploymentRepository {
  // -------------------------------------------------------------------------
  // Core CRUD
  // -------------------------------------------------------------------------

  /** Find a deployment by id, scoped to org via project. */
  async findById(id: string, orgId: string): Promise<Deployment | null> {
    const db = getDb();
    if (!db) return prisma.deployment.findFirst({ where: { id, project: { orgId } } });

    const rows = await db.select().from(deployments).where(eq(deployments.id, id));
    const d = rows[0];
    if (!d) return null;
    const proj = await db.select().from(projects).where(and(eq(projects.id, d.projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) return null;
    return d as unknown as Deployment;
  }

  /** Find a deployment with its telemetry record. */
  async findByIdWithTelemetry(
    id: string,
    orgId: string
  ): Promise<DeploymentWithTelemetry | null> {
    const db = getDb();
    if (!db) return prisma.deployment.findFirst({ where: { id, project: { orgId } }, include: { telemetry: true } });

    const rows = await db.select().from(deployments).where(eq(deployments.id, id));
    const d = rows[0];
    if (!d) return null;
    const proj = await db.select().from(projects).where(and(eq(projects.id, d.projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) return null;

    const tel = await db.select().from(deploymentTelemetry).where(eq(deploymentTelemetry.deploymentId, id));
    return { ...(d as unknown as Deployment), telemetry: (tel[0] as unknown) as DeploymentTelemetry | null } as DeploymentWithTelemetry;
  }

  /** List deployments for a project within an org. */
  async findMany(
    params: FindDeploymentsParams
  ): Promise<{ data: Deployment[]; total: number }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const db = getDb();
    if (!db) {
      const where: Prisma.DeploymentWhereInput = {
        projectId: params.projectId,
        project: { orgId: params.orgId },
        ...(params.status ? { status: params.status } : {}),
        ...(params.env ? { env: params.env } : {}),
      };

      const [data, total] = await prisma.$transaction([
        prisma.deployment.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
        prisma.deployment.count({ where }),
      ]);

      return { data, total };
    }

    // Verify project belongs to org
    const proj = await db.select().from(projects).where(and(eq(projects.id, params.projectId), eq(projects.orgId, params.orgId)));
    if (!proj[0]) return { data: [], total: 0 };

    const conditions: any[] = [eq(deployments.projectId, params.projectId)];
    if (params.status) conditions.push(eq(deployments.status, params.status));
    if (params.env) conditions.push(eq(deployments.env, params.env));

    const whereExpr = conditions.length === 1 ? conditions[0] : and(...conditions);
    const all = await db.select().from(deployments).where(whereExpr).orderBy(desc(deployments.createdAt));
    const total = all.length;
    const data = all.slice(skip, skip + limit) as unknown as Deployment[];
    return { data, total };
  }

  /** Get the latest deployment for a project (any status). */
  async findLatest(
    projectId: string,
    orgId: string
  ): Promise<Deployment | null> {
    const db = getDb();
    if (!db) return prisma.deployment.findFirst({ where: { projectId, project: { orgId } }, orderBy: { version: "desc" } });

    const proj = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) return null;

    const rows = await db.select().from(deployments).where(eq(deployments.projectId, projectId)).orderBy(desc(deployments.version)).limit(1);
    return (rows[0] as unknown) as Deployment | null;
  }

  /** Get the current live deployment for a project. */
  async findLive(
    projectId: string,
    orgId: string
  ): Promise<Deployment | null> {
    const db = getDb();
    if (!db) return prisma.deployment.findFirst({ where: { projectId, project: { orgId }, status: "LIVE" } });

    const proj = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) return null;

    const rows = await db.select().from(deployments).where(and(eq(deployments.projectId, projectId), eq(deployments.status, "LIVE"))).orderBy(desc(deployments.version)).limit(1);
    return (rows[0] as unknown) as Deployment | null;
  }

  /** Create a new deployment for a project. */
  async create(
    projectId: string,
    orgId: string,
    data: Omit<Prisma.DeploymentCreateInput, "project">
  ): Promise<Deployment> {
    // Verify project belongs to the org
    const db = getDb();
    if (!db) {
      const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
      if (!project) throw new Error(`Project ${projectId} not found in org ${orgId}`);
      return prisma.deployment.create({ data: { ...data, project: { connect: { id: projectId } } } });
    }

    const proj = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) throw new Error(`Project ${projectId} not found in org ${orgId}`);

    const id = (globalThis as any).crypto?.randomUUID?.() ?? `dep_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const inserted = await db.insert(deployments).values({ id, projectId, ...(data as any) }).returning();
    return (inserted[0] as unknown) as Deployment;
  }

  /** Update deployment fields (status, buildLog, etc.). */
  async update(
    id: string,
    orgId: string,
    data: Prisma.DeploymentUpdateInput
  ): Promise<Deployment> {
    const db = getDb();
    if (!db) {
      const deployment = await prisma.deployment.findFirst({ where: { id, project: { orgId } } });
      if (!deployment) throw new Error(`Deployment ${id} not found in org ${orgId}`);
      return prisma.deployment.update({ where: { id }, data });
    }

    const rows = await db.select().from(deployments).where(eq(deployments.id, id));
    const d = rows[0];
    if (!d) throw new Error(`Deployment ${id} not found in org ${orgId}`);
    const proj = await db.select().from(projects).where(and(eq(projects.id, d.projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) throw new Error(`Deployment ${id} not found in org ${orgId}`);

    await db.update(deployments).set(data as any).where(eq(deployments.id, id));
    const updated = await db.select().from(deployments).where(eq(deployments.id, id));
    return (updated[0] as unknown) as Deployment;
  }

  /** Update deployment status specifically (convenience method). */
  async updateStatus(
    id: string,
    orgId: string,
    status: DeploymentStatus,
    extra?: { errorMessage?: string; deployedUrl?: string; deployedAt?: Date }
  ): Promise<Deployment> {
    const db = getDb();
    if (!db) {
      const deployment = await prisma.deployment.findFirst({ where: { id, project: { orgId } } });
      if (!deployment) throw new Error(`Deployment ${id} not found in org ${orgId}`);
      return prisma.deployment.update({ where: { id }, data: { status, ...extra } });
    }

    const rows = await db.select().from(deployments).where(eq(deployments.id, id));
    const d = rows[0];
    if (!d) throw new Error(`Deployment ${id} not found in org ${orgId}`);
    const proj = await db.select().from(projects).where(and(eq(projects.id, d.projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) throw new Error(`Deployment ${id} not found in org ${orgId}`);

    await db.update(deployments).set({ status, ...(extra as any) }).where(eq(deployments.id, id));
    const updated = await db.select().from(deployments).where(eq(deployments.id, id));
    return (updated[0] as unknown) as Deployment;
  }

  /** Delete a deployment (verified via org scope). */
  async delete(id: string, orgId: string): Promise<Deployment> {
    const db = getDb();
    if (!db) {
      const deployment = await prisma.deployment.findFirst({ where: { id, project: { orgId } } });
      if (!deployment) throw new Error(`Deployment ${id} not found in org ${orgId}`);
      return prisma.deployment.delete({ where: { id } });
    }

    const rows = await db.select().from(deployments).where(eq(deployments.id, id));
    const d = rows[0];
    if (!d) throw new Error(`Deployment ${id} not found in org ${orgId}`);
    const proj = await db.select().from(projects).where(and(eq(projects.id, d.projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) throw new Error(`Deployment ${id} not found in org ${orgId}`);

    const deleted = await db.delete(deployments).where(eq(deployments.id, id)).returning();
    return (deleted[0] as unknown) as Deployment;
  }

  /** Get the next version number for a project's deployments. */
  async getNextVersion(projectId: string, orgId: string): Promise<number> {
    const latest = await this.findLatest(projectId, orgId);
    return (latest?.version ?? 0) + 1;
  }

  // -------------------------------------------------------------------------
  // Telemetry
  // -------------------------------------------------------------------------

  /** Create or update telemetry for a deployment. */
  async upsertTelemetry(
    deploymentId: string,
    orgId: string,
    data: Omit<Prisma.DeploymentTelemetryCreateInput, "deployment">
  ): Promise<DeploymentTelemetry> {
    // Verify deployment belongs to org
    const db = getDb();
    if (!db) {
      const deployment = await prisma.deployment.findFirst({ where: { id: deploymentId, project: { orgId } } });
      if (!deployment) throw new Error(`Deployment ${deploymentId} not found in org ${orgId}`);
      return prisma.deploymentTelemetry.upsert({ where: { deploymentId }, create: { ...data, deployment: { connect: { id: deploymentId } } }, update: data });
    }

    const rows = await db.select().from(deployments).where(eq(deployments.id, deploymentId));
    const d = rows[0];
    if (!d) throw new Error(`Deployment ${deploymentId} not found in org ${orgId}`);
    const proj = await db.select().from(projects).where(and(eq(projects.id, d.projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) throw new Error(`Deployment ${deploymentId} not found in org ${orgId}`);

    const existing = await db.select().from(deploymentTelemetry).where(eq(deploymentTelemetry.deploymentId, deploymentId));
    if (existing[0]) {
      await db.update(deploymentTelemetry).set(data as any).where(eq(deploymentTelemetry.deploymentId, deploymentId));
      const updated = await db.select().from(deploymentTelemetry).where(eq(deploymentTelemetry.deploymentId, deploymentId));
      return (updated[0] as unknown) as DeploymentTelemetry;
    }

    const id = (globalThis as any).crypto?.randomUUID?.() ?? `dt_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const inserted = await db.insert(deploymentTelemetry).values({ id, deploymentId, ...(data as any) }).returning();
    return (inserted[0] as unknown) as DeploymentTelemetry;
  }

  /** Find telemetry for a deployment. */
  async findTelemetry(
    deploymentId: string,
    orgId: string
  ): Promise<DeploymentTelemetry | null> {
    const db = getDb();
    if (!db) return prisma.deploymentTelemetry.findFirst({ where: { deploymentId, deployment: { project: { orgId } } } });

    const rows = await db.select().from(deploymentTelemetry).where(eq(deploymentTelemetry.deploymentId, deploymentId));
    const t = rows[0];
    if (!t) return null;
    const drows = await db.select().from(deployments).where(eq(deployments.id, deploymentId));
    const d = drows[0];
    if (!d) return null;
    const proj = await db.select().from(projects).where(and(eq(projects.id, d.projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) return null;
    return t as unknown as DeploymentTelemetry;
  }
}
