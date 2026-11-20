// =============================================================================
// packages/db/src/repositories/workflow.repository.ts
// Data-access layer for Workflow and WorkflowRun models.
// Workflow is org-scoped via its parent Project.orgId.
// WorkflowRun has a direct orgId column.
// =============================================================================

import { prisma, Prisma } from "../legacy-prisma-disabled";
import type {
  Workflow,
  WorkflowRun,
  WorkflowStatus,
  WorkflowRunStatus,
} from "../types";
import { getDb } from "../db";
import { workflows, workflowRuns, projects } from "../db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FindWorkflowsParams {
  orgId: string;
  projectId: string;
  status?: WorkflowStatus;
  page?: number;
  limit?: number;
}

export interface FindWorkflowRunsParams {
  orgId: string;
  workflowId: string;
  status?: WorkflowRunStatus;
  page?: number;
  limit?: number;
}

export interface WorkflowWithRuns extends Workflow {
  runs: WorkflowRun[];
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class WorkflowRepository {
  // -------------------------------------------------------------------------
  // Workflow CRUD
  // -------------------------------------------------------------------------

  /** Find a workflow by id, scoped to org via project. */
  async findById(id: string, orgId: string): Promise<Workflow | null> {
    const db = getDb();
    if (!db) return prisma.workflow.findFirst({ where: { id, project: { orgId } } });

    const rows = await db.select().from(workflows).where(eq(workflows.id, id));
    const wf = rows[0];
    if (!wf) return null;

    const proj = await db.select().from(projects).where(and(eq(projects.id, wf.projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) return null;

    return wf as unknown as Workflow;
  }

  /** List workflows for a project within an org. */
  async findMany(
    params: FindWorkflowsParams
  ): Promise<{ data: Workflow[]; total: number }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const db = getDb();
    if (!db) {
      const where: Prisma.WorkflowWhereInput = {
        projectId: params.projectId,
        project: { orgId: params.orgId },
        ...(params.status ? { status: params.status } : {}),
      };

      const [data, total] = await prisma.$transaction([
        prisma.workflow.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
        prisma.workflow.count({ where }),
      ]);

      return { data, total };
    }

    const proj = await db.select().from(projects).where(and(eq(projects.id, params.projectId), eq(projects.orgId, params.orgId)));
    if (!proj[0]) return { data: [], total: 0 };

    const conditions: any[] = [eq(workflows.projectId, params.projectId)];
    if (params.status) conditions.push(eq(workflows.status, params.status));
    const whereExpr = conditions.length === 1 ? conditions[0] : and(...conditions);

    const all = await db.select().from(workflows).where(whereExpr).orderBy(desc(workflows.createdAt));
    return {
      data: all.slice(skip, skip + limit) as unknown as Workflow[],
      total: all.length,
    };
  }

  /** Create a workflow under a project (org-scoped). */
  async create(
    projectId: string,
    orgId: string,
    data: Omit<Prisma.WorkflowCreateInput, "project">
  ): Promise<Workflow> {
    // Verify project belongs to the org
    const db = getDb();
    if (!db) {
      const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
      if (!project) throw new Error(`Project ${projectId} not found in org ${orgId}`);
      return prisma.workflow.create({ data: { ...data, project: { connect: { id: projectId } } } });
    }

    const proj = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) throw new Error(`Project ${projectId} not found in org ${orgId}`);

    const id = (globalThis as any).crypto?.randomUUID?.() ?? `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const inserted = await db.insert(workflows).values({ id, projectId, ...(data as any) }).returning();
    return inserted[0] as unknown as Workflow;
  }

  /** Update a workflow (verified via org scope). */
  async update(
    id: string,
    orgId: string,
    data: Prisma.WorkflowUpdateInput
  ): Promise<Workflow> {
    const db = getDb();
    if (!db) {
      const workflow = await prisma.workflow.findFirst({ where: { id, project: { orgId } } });
      if (!workflow) throw new Error(`Workflow ${id} not found in org ${orgId}`);
      return prisma.workflow.update({ where: { id }, data });
    }

    const wfRows = await db.select().from(workflows).where(eq(workflows.id, id));
    const wf = wfRows[0];
    if (!wf) throw new Error(`Workflow ${id} not found in org ${orgId}`);
    const proj = await db.select().from(projects).where(and(eq(projects.id, wf.projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) throw new Error(`Workflow ${id} not found in org ${orgId}`);

    await db.update(workflows).set(data as any).where(eq(workflows.id, id));
    const updated = await db.select().from(workflows).where(eq(workflows.id, id));
    return updated[0] as unknown as Workflow;
  }

  /** Delete a workflow (verified via org scope). */
  async delete(id: string, orgId: string): Promise<Workflow> {
    const db = getDb();
    if (!db) {
      const workflow = await prisma.workflow.findFirst({ where: { id, project: { orgId } } });
      if (!workflow) throw new Error(`Workflow ${id} not found in org ${orgId}`);
      return prisma.workflow.delete({ where: { id } });
    }

    const wfRows = await db.select().from(workflows).where(eq(workflows.id, id));
    const wf = wfRows[0];
    if (!wf) throw new Error(`Workflow ${id} not found in org ${orgId}`);
    const proj = await db.select().from(projects).where(and(eq(projects.id, wf.projectId), eq(projects.orgId, orgId)));
    if (!proj[0]) throw new Error(`Workflow ${id} not found in org ${orgId}`);

    const deleted = await db.delete(workflows).where(eq(workflows.id, id)).returning();
    return deleted[0] as unknown as Workflow;
  }

  /** Find a workflow with its recent runs. */
  async findByIdWithRuns(
    id: string,
    orgId: string,
    runLimit = 10
  ): Promise<WorkflowWithRuns | null> {
    const db = getDb();
    if (!db) {
      return prisma.workflow.findFirst({
        where: { id, project: { orgId } },
        include: { runs: { orderBy: { createdAt: "desc" }, take: runLimit } },
      });
    }

    const wf = await this.findById(id, orgId);
    if (!wf) return null;
    const runs = await db.select().from(workflowRuns).where(and(eq(workflowRuns.workflowId, id), eq(workflowRuns.orgId, orgId))).orderBy(desc(workflowRuns.createdAt)).limit(runLimit);
    return { ...wf, runs: runs as unknown as WorkflowRun[] };
  }

  // -------------------------------------------------------------------------
  // WorkflowRun CRUD
  // -------------------------------------------------------------------------

  /** Find a workflow run by id, scoped by orgId. */
  async findRunById(
    runId: string,
    orgId: string
  ): Promise<WorkflowRun | null> {
    const db = getDb();
    if (!db) return prisma.workflowRun.findFirst({ where: { id: runId, orgId } });

    const rows = await db.select().from(workflowRuns).where(and(eq(workflowRuns.id, runId), eq(workflowRuns.orgId, orgId)));
    return (rows[0] as unknown as WorkflowRun) ?? null;
  }

  /** List runs for a workflow, scoped by orgId. */
  async findRuns(
    params: FindWorkflowRunsParams
  ): Promise<{ data: WorkflowRun[]; total: number }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const db = getDb();
    if (!db) {
      const where: Prisma.WorkflowRunWhereInput = {
        workflowId: params.workflowId,
        orgId: params.orgId,
        ...(params.status ? { status: params.status } : {}),
      };

      const [data, total] = await prisma.$transaction([
        prisma.workflowRun.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
        prisma.workflowRun.count({ where }),
      ]);
      return { data, total };
    }

    const conditions: any[] = [eq(workflowRuns.workflowId, params.workflowId), eq(workflowRuns.orgId, params.orgId)];
    if (params.status) conditions.push(eq(workflowRuns.status, params.status));
    const whereExpr = and(...conditions);
    const all = await db.select().from(workflowRuns).where(whereExpr).orderBy(desc(workflowRuns.createdAt));
    return {
      data: all.slice(skip, skip + limit) as unknown as WorkflowRun[],
      total: all.length,
    };
  }

  /** Create a workflow run. */
  async createRun(
    workflowId: string,
    orgId: string,
    data?: Omit<Prisma.WorkflowRunCreateInput, "workflow" | "orgId">
  ): Promise<WorkflowRun> {
    const db = getDb();
    if (!db) {
      return prisma.workflowRun.create({
        data: { ...(data as any), orgId, workflow: { connect: { id: workflowId } } },
      });
    }

    const id = (globalThis as any).crypto?.randomUUID?.() ?? `wr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const inserted = await db.insert(workflowRuns).values({ id, workflowId, orgId, ...(data as any) }).returning();
    return inserted[0] as unknown as WorkflowRun;
  }

  /** Update a workflow run status and optional output data. */
  async updateRun(
    runId: string,
    orgId: string,
    data: Prisma.WorkflowRunUpdateInput
  ): Promise<WorkflowRun> {
    const db = getDb();
    if (!db) {
      const run = await prisma.workflowRun.findFirst({ where: { id: runId, orgId } });
      if (!run) throw new Error(`WorkflowRun ${runId} not found in org ${orgId}`);
      return prisma.workflowRun.update({ where: { id: runId }, data });
    }

    const run = await db.select().from(workflowRuns).where(and(eq(workflowRuns.id, runId), eq(workflowRuns.orgId, orgId)));
    if (!run[0]) throw new Error(`WorkflowRun ${runId} not found in org ${orgId}`);
    await db.update(workflowRuns).set(data as any).where(eq(workflowRuns.id, runId));
    const updated = await db.select().from(workflowRuns).where(eq(workflowRuns.id, runId));
    return updated[0] as unknown as WorkflowRun;
  }

  // -------------------------------------------------------------------------
  // Stats helpers
  // -------------------------------------------------------------------------

  /**
   * Increment the totalRuns counter and the success/failed counter
   * on the parent workflow. Called after a run completes.
   */
  async incrementRunStats(
    workflowId: string,
    orgId: string,
    outcome: "success" | "failed"
  ): Promise<Workflow> {
    const db = getDb();
    if (!db) {
      const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, project: { orgId } } });
      if (!workflow) throw new Error(`Workflow ${workflowId} not found in org ${orgId}`);
      return prisma.workflow.update({
        where: { id: workflowId },
        data: {
          totalRuns: { increment: 1 },
          ...(outcome === "success" ? { successRuns: { increment: 1 } } : { failedRuns: { increment: 1 } }),
          lastRunAt: new Date(),
        },
      });
    }

    const wf = await this.findById(workflowId, orgId);
    if (!wf) throw new Error(`Workflow ${workflowId} not found in org ${orgId}`);

    await db
      .update(workflows)
      .set({
        totalRuns: sql`${workflows.totalRuns} + 1`,
        ...(outcome === "success"
          ? { successRuns: sql`${workflows.successRuns} + 1` }
          : { failedRuns: sql`${workflows.failedRuns} + 1` }),
        lastRunAt: new Date().toISOString(),
      } as any)
      .where(eq(workflows.id, workflowId));

    const updated = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    return updated[0] as unknown as Workflow;
  }
}
