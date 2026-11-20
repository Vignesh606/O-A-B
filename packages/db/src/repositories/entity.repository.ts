// =============================================================================
// packages/db/src/repositories/entity.repository.ts
// Data-access layer for Entity definitions within a Project.
//
// NOTE: There is no dedicated `Entity` table in the current schema.
// Entity definitions are stored inside `Project.metadata` (JSON) or
// `Project.generatedCode` (JSON). This repository encapsulates access to
// that data so consumers don't depend on the storage format.
// When a dedicated Entity model is added to the schema, swap the
// implementation here — callers won't need to change.
//
// All queries are scoped by orgId via the parent Project.
// =============================================================================

import { prisma, Prisma } from "../legacy-prisma-disabled";
import { getDb } from "../db";
import { projects } from "../db/schema";
import { eq, and } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of a single entity definition stored in project metadata. */
export interface EntityDefinition {
  name: string;
  fields: EntityField[];
  displayName?: string;
  description?: string;
}

export interface EntityField {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  defaultValue?: string;
  relation?: {
    entity: string;
    field: string;
  };
}

/** The shape of `Project.metadata` that we expect. */
interface ProjectMetadata {
  entities?: EntityDefinition[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class EntityRepository {
  // -------------------------------------------------------------------------
  // Read
  // -------------------------------------------------------------------------

  /** List all entity definitions for a project. */
  async findByProjectId(
    projectId: string,
    orgId: string
  ): Promise<EntityDefinition[]> {
    const db = getDb();
    if (!db) {
      const project = await prisma.project.findFirst({ where: { id: projectId, orgId }, select: { metadata: true } });
      if (!project) throw new Error(`Project ${projectId} not found in org ${orgId}`);
      const metadata = project.metadata as ProjectMetadata;
      return metadata?.entities ?? [];
    }

    const rows = await db.select({ metadata: projects.metadata }).from(projects).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
    const row = rows[0];
    if (!row) throw new Error(`Project ${projectId} not found in org ${orgId}`);
    const metadata = row.metadata ? JSON.parse(String(row.metadata)) : ({} as ProjectMetadata);
    const entities: EntityDefinition[] = (metadata?.entities as EntityDefinition[]) ?? [];
    return entities;
  }

  /** Find a single entity definition by name. */
  async findByName(
    projectId: string,
    orgId: string,
    entityName: string
  ): Promise<EntityDefinition | null> {
    const entities = await this.findByProjectId(projectId, orgId);
    return entities.find((e: EntityDefinition) => e.name === entityName) ?? null;
  }

  // -------------------------------------------------------------------------
  // Write (JSON patch on Project.metadata)
  // -------------------------------------------------------------------------

  /** Add or replace an entity definition in the project metadata. */
  async upsert(
    projectId: string,
    orgId: string,
    entity: EntityDefinition
  ): Promise<EntityDefinition> {
    const db = getDb();
    if (!db) {
      const project = await prisma.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, metadata: true } });
      if (!project) throw new Error(`Project ${projectId} not found in org ${orgId}`);
      const metadata = (project.metadata as ProjectMetadata) ?? {};
      const entities: EntityDefinition[] = (metadata.entities as EntityDefinition[]) ?? [];
      const idx = entities.findIndex((e: EntityDefinition) => e.name === entity.name);
      if (idx >= 0) entities[idx] = entity;
      else entities.push(entity);
      await prisma.project.update({ where: { id: projectId }, data: { metadata: { ...metadata, entities } as unknown as Prisma.InputJsonValue } });
      return entity;
    }

    const rows = await db.select({ metadata: projects.metadata }).from(projects).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
    const row = rows[0];
    if (!row) throw new Error(`Project ${projectId} not found in org ${orgId}`);
    const metadata = row.metadata ? JSON.parse(String(row.metadata)) : ({} as ProjectMetadata);
    const entities: EntityDefinition[] = (metadata.entities as EntityDefinition[]) ?? [];
    const idx = entities.findIndex((e: EntityDefinition) => e.name === entity.name);
    if (idx >= 0) entities[idx] = entity;
    else entities.push(entity);
    await db.update(projects).set({ metadata: JSON.stringify({ ...metadata, entities }) }).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
    return entity;
  }

  /** Remove an entity definition by name. */
  async deleteByName(
    projectId: string,
    orgId: string,
    entityName: string
  ): Promise<void> {
    const db = getDb();
    if (!db) {
      const project = await prisma.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, metadata: true } });
      if (!project) throw new Error(`Project ${projectId} not found in org ${orgId}`);
      const metadata = (project.metadata as ProjectMetadata) ?? {};
      const entities: EntityDefinition[] = (metadata.entities as EntityDefinition[]) ?? [];
      const filtered = entities.filter((e: EntityDefinition) => e.name !== entityName);
      await prisma.project.update({ where: { id: projectId }, data: { metadata: { ...metadata, entities: filtered } as unknown as Prisma.InputJsonValue } });
      return;
    }

    const rows = await db.select({ metadata: projects.metadata }).from(projects).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
    const row = rows[0];
    if (!row) throw new Error(`Project ${projectId} not found in org ${orgId}`);
    const metadata = row.metadata ? JSON.parse(String(row.metadata)) : ({} as ProjectMetadata);
    const entities: EntityDefinition[] = (metadata.entities as EntityDefinition[]) ?? [];
    const filtered = entities.filter((e: EntityDefinition) => e.name !== entityName);
    await db.update(projects).set({ metadata: JSON.stringify({ ...metadata, entities: filtered }) }).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
  }

  /** Replace all entity definitions for a project at once. */
  async replaceAll(
    projectId: string,
    orgId: string,
    entities: EntityDefinition[]
  ): Promise<EntityDefinition[]> {
    const db = getDb();
    if (!db) {
      const project = await prisma.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, metadata: true } });
      if (!project) throw new Error(`Project ${projectId} not found in org ${orgId}`);
      const metadata = (project.metadata as ProjectMetadata) ?? {};
      await prisma.project.update({ where: { id: projectId }, data: { metadata: { ...metadata, entities } as unknown as Prisma.InputJsonValue } });
      return entities;
    }

    const rows = await db.select({ metadata: projects.metadata }).from(projects).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
    const row = rows[0];
    if (!row) throw new Error(`Project ${projectId} not found in org ${orgId}`);
    const metadata = row.metadata ? JSON.parse(String(row.metadata)) : ({} as ProjectMetadata);
    await db.update(projects).set({ metadata: JSON.stringify({ ...metadata, entities }) }).where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));
    return entities;
  }
}
