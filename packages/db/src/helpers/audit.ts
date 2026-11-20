// =============================================================================
// packages/db/src/helpers/audit.ts
// Helper for creating audit log entries consistently across the codebase.
// =============================================================================

import { getDb } from "../db";
import { auditLogs } from "../db/schema";

export type AuditAction =
  // Auth
  | "auth.sign_in"
  | "auth.sign_out"
  // Org
  | "org.created"
  | "org.updated"
  | "org.deleted"
  | "org.member_invited"
  | "org.member_removed"
  | "org.member_role_changed"
  // Project
  | "project.created"
  | "project.updated"
  | "project.archived"
  | "project.deleted"
  | "project.generation.started"
  | "project.generation.completed"
  | "project.modification.started"
  | "project.modification.completed"
  // Deployment
  | "deployment.triggered"
  | "deployment.succeeded"
  | "deployment.failed"
  | "deployment.rolled_back"
  | "deployment.live"
  | "deployment.undeployed"
  | "deployment.cf_confirmed_live"
  | "deployment.cf_failed"
  // Workflow
  | "workflow.created"
  | "workflow.updated"
  | "workflow.activated"
  | "workflow.paused"
  | "workflow.deleted"
  | "workflow.archived"
  | "workflow.run_triggered"
  | "workflow.run.triggered"
  // Environment variables
  | "env_var.upserted"
  | "env_var.deleted"
  // Integration
  | "integration.connected"
  | "integration.disconnected"
  // API Key
  | "api_key.created"
  | "api_key.revoked";

interface CreateAuditLogParams {
  orgId: string;
  action: AuditAction;
  userId?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Write an audit log entry. Fire-and-forget — does not throw.
 * Call after the main operation succeeds.
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error("D1 binding has not been initialized");
    }

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      orgId: params.orgId,
      userId: params.userId,
      projectId: params.projectId,
      action: params.action,
      metadata: JSON.stringify(params.metadata ?? {}),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    // Audit logs should never break the main flow
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}
