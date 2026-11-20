import type { InferSelectModel } from "drizzle-orm";

import type {
  analyticsEvents,
  apiKeys,
  auditLogs,
  crmContacts,
  crmDeals,
  deployments,
  deploymentTelemetry,
  ecomOrders,
  ecomProducts,
  integrations,
  organizations,
  orgMembers,
  projectDashboardConfigs,
  projectEnvVars,
  projects,
  supportChats,
  supportTickets,
  userSessions,
  users,
  workflowRuns,
  workflows,
} from "./db/schema";
import type {
  DeploymentEnv,
  DeploymentStatus,
  IntegrationProvider,
  OrgPlan,
  OrgStatus,
  ProjectStatus,
  ProjectType,
  TriggerType,
  UserRole,
  UserStatus,
  WorkflowRunStatus,
  WorkflowStatus,
} from "./db/schema";

export type {
  DeploymentEnv,
  DeploymentStatus,
  IntegrationProvider,
  OrgPlan,
  OrgStatus,
  ProjectStatus,
  ProjectType,
  TriggerType,
  UserRole,
  UserStatus,
  WorkflowRunStatus,
  WorkflowStatus,
};

export type User = InferSelectModel<typeof users>;
export type UserSession = InferSelectModel<typeof userSessions>;
export type Organization = InferSelectModel<typeof organizations>;
export type OrgMember = InferSelectModel<typeof orgMembers>;
export type Project = InferSelectModel<typeof projects>;
export type ProjectEnvVar = InferSelectModel<typeof projectEnvVars>;
export type Deployment = InferSelectModel<typeof deployments>;
export type DeploymentTelemetry = InferSelectModel<typeof deploymentTelemetry>;
export type Workflow = InferSelectModel<typeof workflows>;
export type WorkflowRun = InferSelectModel<typeof workflowRuns>;
export type Integration = InferSelectModel<typeof integrations>;
export type ApiKey = InferSelectModel<typeof apiKeys>;
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type ProjectDashboardConfig = InferSelectModel<typeof projectDashboardConfigs>;
export type SupportTicket = InferSelectModel<typeof supportTickets>;
export type SupportChat = InferSelectModel<typeof supportChats>;
export type CrmDeal = InferSelectModel<typeof crmDeals>;
export type CrmContact = InferSelectModel<typeof crmContacts>;
export type EcomOrder = InferSelectModel<typeof ecomOrders>;
export type EcomProduct = InferSelectModel<typeof ecomProducts>;
export type AnalyticsEvent = InferSelectModel<typeof analyticsEvents>;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
