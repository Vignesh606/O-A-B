import { and, asc, desc, eq } from "drizzle-orm";

import { getDb } from "./db";
import * as schema from "./db/schema";

export namespace Prisma {
  export type UserCreateInput = Record<string, any>;
  export type UserUpdateInput = Record<string, any>;
  export type UserSessionCreateInput = Record<string, any>;
  export type ProjectWhereInput = Record<string, any>;
  export type ProjectCreateInput = Record<string, any>;
  export type ProjectUpdateInput = Record<string, any>;
  export type DeploymentWhereInput = Record<string, any>;
  export type DeploymentCreateInput = Record<string, any>;
  export type DeploymentUpdateInput = Record<string, any>;
  export type DeploymentTelemetryCreateInput = Record<string, any>;
  export type WorkflowWhereInput = Record<string, any>;
  export type WorkflowCreateInput = Record<string, any>;
  export type WorkflowUpdateInput = Record<string, any>;
  export type WorkflowRunWhereInput = Record<string, any>;
  export type WorkflowRunCreateInput = Record<string, any>;
  export type WorkflowRunUpdateInput = Record<string, any>;
  export type InputJsonValue = Record<string, any> | any[] | string | number | boolean | null;
}

type ModelConfig = {
  table: any;
  uniques?: Record<string, string[]>;
  relations?: Record<string, RelationConfig>;
  json?: string[];
};

type RelationConfig = {
  model: string;
  localKey: string;
  foreignKey: string;
  many?: boolean;
};

const modelConfigs = {
  user: {
    table: schema.users,
    uniques: { clerkId: ["clerkId"], email: ["email"] },
    relations: {
      memberships: { model: "orgMember", localKey: "id", foreignKey: "userId", many: true },
    },
  },
  userSession: {
    table: schema.userSessions,
    uniques: { clerkSession: ["clerkSession"] },
  },
  organization: {
    table: schema.organizations,
    uniques: { clerkOrgId: ["clerkOrgId"], slug: ["slug"] },
    relations: {
      members: { model: "orgMember", localKey: "id", foreignKey: "orgId", many: true },
      projects: { model: "project", localKey: "id", foreignKey: "orgId", many: true },
    },
  },
  orgMember: {
    table: schema.orgMembers,
    uniques: { orgId_userId: ["orgId", "userId"] },
    relations: {
      user: { model: "user", localKey: "userId", foreignKey: "id" },
      org: { model: "organization", localKey: "orgId", foreignKey: "id" },
    },
  },
  project: {
    table: schema.projects,
    uniques: { orgId_slug: ["orgId", "slug"], subdomain: ["subdomain"], customDomain: ["customDomain"] },
    json: ["metadata", "generatedCode"],
    relations: {
      org: { model: "organization", localKey: "orgId", foreignKey: "id" },
      deployments: { model: "deployment", localKey: "id", foreignKey: "projectId", many: true },
      workflows: { model: "workflow", localKey: "id", foreignKey: "projectId", many: true },
    },
  },
  projectEnvVar: {
    table: schema.projectEnvVars,
    uniques: { projectId_key: ["projectId", "key"] },
    relations: {
      project: { model: "project", localKey: "projectId", foreignKey: "id" },
    },
  },
  deployment: {
    table: schema.deployments,
    uniques: { projectId_version: ["projectId", "version"] },
    json: ["codeSnapshot"],
    relations: {
      project: { model: "project", localKey: "projectId", foreignKey: "id" },
      telemetry: { model: "deploymentTelemetry", localKey: "id", foreignKey: "deploymentId" },
    },
  },
  deploymentTelemetry: {
    table: schema.deploymentTelemetry,
    uniques: { deploymentId: ["deploymentId"] },
    json: ["repairedErrors"],
  },
  workflow: {
    table: schema.workflows,
    json: ["definition"],
    relations: {
      project: { model: "project", localKey: "projectId", foreignKey: "id" },
      runs: { model: "workflowRun", localKey: "id", foreignKey: "workflowId", many: true },
    },
  },
  workflowRun: {
    table: schema.workflowRuns,
    json: ["trace", "inputData", "outputData"],
    relations: {
      workflow: { model: "workflow", localKey: "workflowId", foreignKey: "id" },
    },
  },
  integration: {
    table: schema.integrations,
    uniques: { orgId_provider: ["orgId", "provider"] },
    json: ["metadata"],
  },
  apiKey: {
    table: schema.apiKeys,
    uniques: { keyHash: ["keyHash"] },
    relations: {
      org: { model: "organization", localKey: "orgId", foreignKey: "id" },
    },
  },
  auditLog: { table: schema.auditLogs, json: ["metadata"] },
  projectDashboardConfig: {
    table: schema.projectDashboardConfigs,
    uniques: { projectId: ["projectId"] },
    json: ["layout", "theme", "widgets"],
  },
  supportTicket: { table: schema.supportTickets },
  supportChat: { table: schema.supportChats },
  crmDeal: { table: schema.crmDeals },
  crmContact: { table: schema.crmContacts },
  ecomOrder: { table: schema.ecomOrders },
  ecomProduct: { table: schema.ecomProducts },
  atsCandidate: { table: schema.atsCandidates },
  financeTransaction: { table: schema.financeTransactions },
  logisticsShipment: { table: schema.logisticsShipments },
  pmTask: { table: schema.pmTasks },
  eduCourse: { table: schema.eduCourses },
  healthcarePatient: { table: schema.healthcarePatients },
  analyticsEvent: { table: schema.analyticsEvents, json: ["metadata"] },
} as const;

function requireDb() {
  const db = getDb();
  if (!db) {
    throw new Error("Cloudflare D1 binding DB is not configured or initialized. If running locally, ensure setupDevPlatform() is called in next.config.mjs or use 'npm run preview'. If in production, ensure the DB binding is attached to the Pages environment.");
  }
  return db;
}

function randomId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function normalizeData(config: ModelConfig, data: Record<string, any>) {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data ?? {})) {
    if (value === undefined) continue;
    if (key === "connect" || key === "select" || key === "include") continue;
    if (value && typeof value === "object" && "increment" in value) continue;
    if (value && typeof value === "object" && "connect" in value) {
      normalized[`${key}Id`] = value.connect.id;
      continue;
    }

    normalized[key] = config.json?.includes(key) && value !== null ? JSON.stringify(value) : value instanceof Date ? value.toISOString() : value;
  }

  return normalized;
}

function hydrateRow(config: ModelConfig, row: any) {
  if (!row) return row;
  const hydrated = { ...row };

  for (const key of config.json ?? []) {
    if (typeof hydrated[key] !== "string") continue;
    try {
      hydrated[key] = JSON.parse(hydrated[key]);
    } catch {
      // Keep the raw value if older data is not JSON.
    }
  }

  return hydrated;
}

function uniqueWhere(config: ModelConfig, where: Record<string, any> = {}) {
  if ("id" in where) return { id: where.id };

  for (const [key, columns] of Object.entries(config.uniques ?? {})) {
    if (key in where && typeof where[key] === "object") {
      return Object.fromEntries(columns.map((column) => [column, where[key][column]]));
    }
    if (columns.length === 1 && key in where) {
      return { [columns[0] as string]: where[key] };
    }
  }

  return where;
}

function matchScalar(actual: any, expected: any): boolean {
  if (expected && typeof expected === "object" && !(expected instanceof Date) && !Array.isArray(expected)) {
    if ("not" in expected) return actual !== expected.not;
    if ("in" in expected) return expected.in.includes(actual);
    if ("gte" in expected) return new Date(actual).getTime() >= new Date(expected.gte).getTime();
    if ("lte" in expected) return new Date(actual).getTime() <= new Date(expected.lte).getTime();
    if ("contains" in expected) return String(actual ?? "").includes(String(expected.contains));
  }

  return actual === expected;
}

async function matchesWhere(modelName: string, row: any, where: Record<string, any> = {}): Promise<boolean> {
  const config = modelConfigs[modelName as keyof typeof modelConfigs] as ModelConfig;

  for (const [key, expected] of Object.entries(where ?? {})) {
    if (key === "AND") {
      const clauses = Array.isArray(expected) ? expected : [expected];
      if (!(await Promise.all(clauses.map((clause) => matchesWhere(modelName, row, clause)))).every(Boolean)) return false;
      continue;
    }

    if (key === "OR") {
      const clauses = Array.isArray(expected) ? expected : [expected];
      if (!(await Promise.all(clauses.map((clause) => matchesWhere(modelName, row, clause)))).some(Boolean)) return false;
      continue;
    }

    const relation = config.relations?.[key];
    if (relation) {
      const related = await findManyRows(relation.model, { where: { [relation.foreignKey]: row[relation.localKey] } });
      if (expected?.some && !(await Promise.all(related.map((item) => matchesWhere(relation.model, item, expected.some)))).some(Boolean)) return false;
      if (!expected?.some && related.length === 0) return false;
      continue;
    }

    if (!matchScalar(row[key], expected)) return false;
  }

  return true;
}

function applyOrder(rows: any[], orderBy: any) {
  if (!orderBy) return rows;
  const entries = Object.entries(Array.isArray(orderBy) ? orderBy[0] : orderBy);
  if (entries.length === 0) return rows;
  const [key, direction] = entries[0] as [string, "asc" | "desc"];

  return [...rows].sort((a, b) => {
    const av = a[key] instanceof Date ? a[key].getTime() : a[key];
    const bv = b[key] instanceof Date ? b[key].getTime() : b[key];
    if (av === bv) return 0;
    const result = av > bv ? 1 : -1;
    return direction === "desc" ? -result : result;
  });
}

function applySelect(row: any, select?: Record<string, any>) {
  if (!row || !select) return row;
  return Object.fromEntries(Object.entries(select).filter(([, enabled]) => enabled).map(([key]) => [key, row[key]]));
}

async function includeRelations(modelName: string, row: any, include?: Record<string, any>) {
  if (!row || !include) return row;
  const config = modelConfigs[modelName as keyof typeof modelConfigs] as ModelConfig;
  const output = { ...row };

  for (const [name, options] of Object.entries(include)) {
    if (!options) continue;
    const relation = config.relations?.[name];
    if (!relation) continue;

    const related = await findManyRows(relation.model, {
      where: { [relation.foreignKey]: row[relation.localKey] },
      ...(typeof options === "object" ? options : {}),
    });
    output[name] = relation.many ? related : related[0] ?? null;
  }

  return output;
}

async function findManyRows(modelName: string, args: any = {}) {
  const db = requireDb();
  const config = modelConfigs[modelName as keyof typeof modelConfigs] as ModelConfig;
  const rows = (await db.select().from(config.table)) as any[];
  const hydrated = rows.map((row) => hydrateRow(config, row));
  const filtered = [];

  for (const row of hydrated) {
    if (await matchesWhere(modelName, row, args.where)) filtered.push(row);
  }

  return applyOrder(filtered, args.orderBy).slice(args.skip ?? 0, args.take ? (args.skip ?? 0) + args.take : undefined);
}

function whereExpression(config: ModelConfig, where: Record<string, any>) {
  const flat = uniqueWhere(config, where);
  const clauses = Object.entries(flat).map(([key, value]) => eq(config.table[key], value));
  return clauses.length === 1 ? clauses[0] : and(...clauses);
}

function createModelClient(modelName: string) {
  const config = modelConfigs[modelName as keyof typeof modelConfigs] as ModelConfig;

  return {
    async findMany(args: any = {}) {
      const rows = await findManyRows(modelName, args);
      return Promise.all(rows.map(async (row) => applySelect(await includeRelations(modelName, row, args.include), args.select)));
    },
    async findFirst(args: any = {}) {
      return (await this.findMany({ ...args, take: 1 }))[0] ?? null;
    },
    async findUnique(args: any = {}) {
      return this.findFirst({ ...args, where: uniqueWhere(config, args.where) });
    },
    async findUniqueOrThrow(args: any = {}) {
      const row = await this.findUnique(args);
      if (!row) throw new Error(`${String(modelName)} not found`);
      return row;
    },
    async count(args: any = {}) {
      return (await findManyRows(modelName, args)).length;
    },
    async create(args: any = {}) {
      const db = requireDb();
      const data = normalizeData(config, args.data ?? {});
      if (!data.id) data.id = randomId(String(modelName));
      const inserted = (await db.insert(config.table).values(data).returning()) as any[];
      const row = hydrateRow(config, inserted[0]);
      return applySelect(await includeRelations(modelName, row, args.include), args.select);
    },
    async update(args: any = {}) {
      const db = requireDb();
      const existing = await this.findUnique({ where: args.where });
      if (!existing) throw new Error(`${String(modelName)} not found`);
      const data = normalizeData(config, args.data ?? {});
      const incrementData = Object.fromEntries(
        Object.entries(args.data ?? {})
          .filter(([, value]) => value && typeof value === "object" && "increment" in (value as any))
          .map(([key, value]) => [key, (existing[key] ?? 0) + (value as any).increment])
      );
      await db.update(config.table).set({ ...data, ...incrementData }).where(whereExpression(config, uniqueWhere(config, args.where)));
      return this.findUnique({ where: { id: existing.id }, select: args.select, include: args.include });
    },
    async updateMany(args: any = {}) {
      const rows = await findManyRows(modelName, args);
      for (const row of rows) {
        await this.update({ where: { id: row.id }, data: args.data });
      }
      return { count: rows.length };
    },
    async delete(args: any = {}) {
      const db = requireDb();
      const existing = await this.findUnique({ where: args.where });
      if (!existing) throw new Error(`${String(modelName)} not found`);
      await db.delete(config.table).where(whereExpression(config, uniqueWhere(config, args.where)));
      return existing;
    },
    async deleteMany(args: any = {}) {
      const rows = await findManyRows(modelName, args);
      for (const row of rows) {
        await this.delete({ where: { id: row.id } });
      }
      return { count: rows.length };
    },
    async upsert(args: any = {}) {
      const existing = await this.findUnique({ where: args.where });
      if (existing) return this.update({ where: args.where, data: args.update, select: args.select, include: args.include });
      return this.create({ data: args.create, select: args.select, include: args.include });
    },
    async aggregate(args: any = {}) {
      const rows = await findManyRows(modelName, args);
      const sum = Object.fromEntries(
        Object.keys(args._sum ?? {}).map((key) => [key, rows.reduce((total, row) => total + Number(row[key] ?? 0), 0)])
      );
      return { _sum: sum };
    },
    async groupBy(args: any = {}) {
      const rows = await findManyRows(modelName, args);
      const by = args.by ?? [];
      const groups = new Map<string, any[]>();

      for (const row of rows) {
        const key = JSON.stringify(by.map((column: string) => row[column]));
        groups.set(key, [...(groups.get(key) ?? []), row]);
      }

      return [...groups.values()].map((items) => {
        const first = items[0];
        return {
          ...Object.fromEntries(by.map((column: string) => [column, first[column]])),
          _count: { _all: items.length },
          _sum: Object.fromEntries(
            Object.keys(args._sum ?? {}).map((key) => [key, items.reduce((total, row) => total + Number(row[key] ?? 0), 0)])
          ),
        };
      });
    },
  };
}

export const prisma = {
  $transaction<T>(operations: Promise<T>[]) {
    return Promise.all(operations);
  },
  async $disconnect() {},
  async $executeRawUnsafe() {
    throw new Error("Raw unsafe SQL is disabled on the D1 compatibility client.");
  },
  ...Object.fromEntries(Object.keys(modelConfigs).map((name) => [name, createModelClient(name)])),
} as any;
