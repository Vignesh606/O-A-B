import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const userRoleValues = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;
export type UserRole = (typeof userRoleValues)[number];

export const userStatusValues = ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"] as const;
export type UserStatus = (typeof userStatusValues)[number];

export const orgPlanValues = ["FREE", "PRO", "ENTERPRISE"] as const;
export type OrgPlan = (typeof orgPlanValues)[number];

export const orgStatusValues = ["ACTIVE", "SUSPENDED", "CANCELLED"] as const;
export type OrgStatus = (typeof orgStatusValues)[number];

export const projectStatusValues = ["DRAFT", "ACTIVE", "ARCHIVED", "DELETED"] as const;
export type ProjectStatus = (typeof projectStatusValues)[number];

export const projectTypeValues = ["CRUD_APP", "DASHBOARD", "ADMIN_PANEL", "WORKFLOW_APP", "CUSTOM"] as const;
export type ProjectType = (typeof projectTypeValues)[number];

export const deploymentStatusValues = [
  "QUEUED",
  "BUILDING",
  "DEPLOYING",
  "LIVE",
  "FAILED",
  "ROLLED_BACK",
  "REPAIRING",
  "BUILD_RETRY",
  "PROCESS_CRASHED",
] as const;
export type DeploymentStatus = (typeof deploymentStatusValues)[number];

export const deploymentEnvValues = ["PREVIEW", "PRODUCTION"] as const;
export type DeploymentEnv = (typeof deploymentEnvValues)[number];

export const workflowStatusValues = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] as const;
export type WorkflowStatus = (typeof workflowStatusValues)[number];

export const workflowRunStatusValues = ["PENDING", "RUNNING", "SUCCESS", "FAILED", "TIMED_OUT", "CANCELLED"] as const;
export type WorkflowRunStatus = (typeof workflowRunStatusValues)[number];

export const triggerTypeValues = ["MANUAL", "SCHEDULE", "WEBHOOK", "DATABASE_EVENT", "FORM_SUBMIT", "API_CALL"] as const;
export type TriggerType = (typeof triggerTypeValues)[number];

export const integrationProviderValues = [
  "SLACK",
  "GMAIL",
  "GOOGLE_SHEETS",
  "GOOGLE_DRIVE",
  "NOTION",
  "GITHUB",
  "JIRA",
  "STRIPE",
  "ZAPIER",
  "WEBHOOK",
  "CUSTOM",
] as const;
export type IntegrationProvider = (typeof integrationProviderValues)[number];

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    clerkId: text("clerk_id").notNull().unique(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    status: text("status", { enum: userStatusValues }).notNull().default("ACTIVE"),
    lastActiveAt: text("last_active_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    clerkIdx: index("users_clerk_id_idx").on(table.clerkId),
  })
);

export const userSessions = sqliteTable(
  "user_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    clerkSession: text("clerk_session").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("user_sessions_user_id_idx").on(table.userId),
  })
);

export const organizations = sqliteTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    clerkOrgId: text("clerk_org_id").unique(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    plan: text("plan", { enum: orgPlanValues }).notNull().default("FREE"),
    status: text("status", { enum: orgStatusValues }).notNull().default("ACTIVE"),
    maxApps: integer("max_apps").notNull().default(3),
    maxWorkflows: integer("max_workflows").notNull().default(5),
    maxMembers: integer("max_members").notNull().default(5),
    maxStorageMb: integer("max_storage_mb").notNull().default(500),
    aiCallsPerMonth: integer("ai_calls_per_month").notNull().default(100),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    planExpiresAt: text("plan_expires_at"),
    ownerId: text("owner_id").notNull().references(() => users.id),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    slugIdx: index("organizations_slug_idx").on(table.slug),
    ownerIdx: index("organizations_owner_id_idx").on(table.ownerId),
  })
);

export const orgMembers = sqliteTable(
  "org_members",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: userRoleValues }).notNull().default("MEMBER"),
    invitedAt: text("invited_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    acceptedAt: text("accepted_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    uniqueOrgUser: uniqueIndex("org_members_org_id_user_id_unique").on(table.orgId, table.userId),
    orgIdx: index("org_members_org_id_idx").on(table.orgId),
    userIdx: index("org_members_user_id_idx").on(table.userId),
  })
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    type: text("type", { enum: projectTypeValues }).notNull().default("CRUD_APP"),
    status: text("status", { enum: projectStatusValues }).notNull().default("DRAFT"),
    prompt: text("prompt").notNull(),
    metadata: text("metadata").notNull().default(sql`'{}'`),
    subdomain: text("subdomain").notNull().unique(),
    customDomain: text("custom_domain").unique(),
    generatedCode: text("generated_code"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgSlugUnique: uniqueIndex("projects_org_id_slug_unique").on(table.orgId, table.slug),
    orgIdx: index("projects_org_id_idx").on(table.orgId),
    subdomainIdx: index("projects_subdomain_idx").on(table.subdomain),
  })
);

export const projectEnvVars = sqliteTable(
  "project_env_vars",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
    isSecret: integer("is_secret", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    uniqueProjectKey: uniqueIndex("project_env_vars_project_id_key_unique").on(table.projectId, table.key),
  })
);

export const deployments = sqliteTable(
  "deployments",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    status: text("status", { enum: deploymentStatusValues }).notNull().default("QUEUED"),
    env: text("env", { enum: deploymentEnvValues }).notNull().default("PRODUCTION"),
    cfDeploymentId: text("cf_deployment_id"),
    cfWorkerName: text("cf_worker_name"),
    deployedUrl: text("deployed_url"),
    buildLog: text("build_log"),
    buildDuration: integer("build_duration"),
    errorMessage: text("error_message"),
    codeSnapshot: text("code_snapshot"),
    triggeredBy: text("triggered_by"),
    deployedAt: text("deployed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    uniqueProjectVersion: uniqueIndex("deployments_project_id_version_unique").on(table.projectId, table.version),
    projectIdx: index("deployments_project_id_idx").on(table.projectId),
    statusIdx: index("deployments_status_idx").on(table.status),
  })
);

export const workflows = sqliteTable(
  "workflows",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status", { enum: workflowStatusValues }).notNull().default("DRAFT"),
    triggerType: text("trigger_type", { enum: triggerTypeValues }).notNull().default("MANUAL"),
    definition: text("definition").notNull().default(sql`'{"edges": [], "nodes": []}'`),
    cronExpression: text("cron_expression"),
    timezone: text("timezone").default("UTC"),
    webhookSecret: text("webhook_secret"),
    lastRunAt: text("last_run_at"),
    nextRunAt: text("next_run_at"),
    totalRuns: integer("total_runs").notNull().default(0),
    successRuns: integer("success_runs").notNull().default(0),
    failedRuns: integer("failed_runs").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdx: index("workflows_project_id_idx").on(table.projectId),
    statusIdx: index("workflows_status_idx").on(table.status),
  })
);

export const workflowRuns = sqliteTable(
  "workflow_runs",
  {
    id: text("id").primaryKey(),
    workflowId: text("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
    orgId: text("org_id").notNull(),
    status: text("status", { enum: workflowRunStatusValues }).notNull().default("PENDING"),
    trace: text("trace").notNull().default(sql`'[]'`),
    inputData: text("input_data"),
    outputData: text("output_data"),
    errorMessage: text("error_message"),
    duration: integer("duration"),
    startedAt: text("started_at"),
    finishedAt: text("finished_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    workflowIdx: index("workflow_runs_workflow_id_idx").on(table.workflowId),
    orgIdx: index("workflow_runs_org_id_idx").on(table.orgId),
    orgStatusIdx: index("workflow_runs_org_id_status_idx").on(table.orgId, table.status),
    statusIdx: index("workflow_runs_status_idx").on(table.status),
  })
);

export const integrations = sqliteTable(
  "integrations",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: integrationProviderValues }).notNull(),
    name: text("name").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiry: text("token_expiry"),
    metadata: text("metadata").notNull().default(sql`'{}'`),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    uniqueOrgProvider: uniqueIndex("integrations_org_id_provider_unique").on(table.orgId, table.provider),
    orgIdx: index("integrations_org_id_idx").on(table.orgId),
  })
);

export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    prefix: text("prefix").notNull(),
    lastUsedAt: text("last_used_at"),
    expiresAt: text("expires_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("api_keys_org_id_idx").on(table.orgId),
  })
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id),
    projectId: text("project_id").references(() => projects.id),
    action: text("action").notNull(),
    metadata: text("metadata").notNull().default(sql`'{}'`),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("audit_logs_org_id_idx").on(table.orgId),
    userIdx: index("audit_logs_user_id_idx").on(table.userId),
    createdIdx: index("audit_logs_created_at_idx").on(table.createdAt),
    orgCreatedIdx: index("audit_logs_org_id_created_at_idx").on(table.orgId, table.createdAt),
  })
);

export const deploymentTelemetry = sqliteTable(
  "deployment_telemetry",
  {
    id: text("id").primaryKey(),
    deploymentId: text("deployment_id").notNull().unique().references(() => deployments.id, { onDelete: "cascade" }),
    buildDurationMs: integer("build_duration_ms").notNull().default(0),
    startupTimeMs: integer("startup_time_ms").notNull().default(0),
    repairCount: integer("repair_count").notNull().default(0),
    previewUptimeSec: integer("preview_uptime_sec").notNull().default(0),
    memoryUsageMb: integer("memory_usage_mb").notNull().default(0),
    crashCount: integer("crash_count").notNull().default(0),
    failureCategory: text("failure_category"),
    repairedErrors: text("repaired_errors"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  }
);

export const projectDashboardConfigs = sqliteTable(
  "project_dashboard_configs",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull().unique().references(() => projects.id, { onDelete: "cascade" }),
    templateId: text("template_id").notNull(),
    layout: text("layout").notNull().default(sql`'{}'`),
    theme: text("theme").notNull().default(sql`'{}'`),
    widgets: text("widgets").notNull().default(sql`'[]'`),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("project_dashboard_configs_org_id_idx").on(table.orgId),
  })
);

export const supportTickets = sqliteTable(
  "support_tickets",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    ticketNumber: text("ticket_number").notNull(),
    subject: text("subject").notNull(),
    status: text("status").notNull().default("open"),
    priority: text("priority").notNull().default("normal"),
    channel: text("channel").notNull().default("email"),
    customerId: text("customer_id"),
    customerName: text("customer_name"),
    assignedTo: text("assigned_to"),
    resolvedAt: text("resolved_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("support_tickets_org_id_idx").on(table.orgId),
    projectIdx: index("support_tickets_project_id_idx").on(table.projectId),
  })
);

export const supportChats = sqliteTable(
  "support_chats",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    status: text("status").notNull().default("active"),
    agentId: text("agent_id"),
    agentName: text("agent_name"),
    customerId: text("customer_id"),
    aiHandled: integer("ai_handled", { mode: "boolean" }).notNull().default(false),
    startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    endedAt: text("ended_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("support_chats_org_id_idx").on(table.orgId),
    projectIdx: index("support_chats_project_id_idx").on(table.projectId),
  })
);

export const crmDeals = sqliteTable(
  "crm_deals",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    title: text("title").notNull(),
    value: integer("value", { mode: "number" }).notNull().default(0),
    stage: text("stage").notNull().default("lead"),
    contactName: text("contact_name"),
    assignedTo: text("assigned_to"),
    closedAt: text("closed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("crm_deals_org_id_idx").on(table.orgId),
    projectIdx: index("crm_deals_project_id_idx").on(table.projectId),
  })
);

export const crmContacts = sqliteTable(
  "crm_contacts",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    company: text("company"),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("crm_contacts_org_id_idx").on(table.orgId),
    projectIdx: index("crm_contacts_project_id_idx").on(table.projectId),
  })
);

export const ecomOrders = sqliteTable(
  "ecom_orders",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    orderNumber: text("order_number").notNull(),
    customerName: text("customer_name"),
    status: text("status").notNull().default("pending"),
    total: integer("total", { mode: "number" }).notNull().default(0),
    itemCount: integer("item_count").notNull().default(0),
    fulfilledAt: text("fulfilled_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("ecom_orders_org_id_idx").on(table.orgId),
    projectIdx: index("ecom_orders_project_id_idx").on(table.projectId),
  })
);

export const ecomProducts = sqliteTable(
  "ecom_products",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    name: text("name").notNull(),
    sku: text("sku"),
    stock: integer("stock").notNull().default(0),
    price: integer("price", { mode: "number" }).notNull().default(0),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("ecom_products_org_id_idx").on(table.orgId),
    projectIdx: index("ecom_products_project_id_idx").on(table.projectId),
  })
);

export const atsCandidates = sqliteTable(
  "ats_candidates",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    role: text("role"),
    stage: text("stage").notNull().default("applied"),
    recruiterId: text("recruiter_id"),
    interviewAt: text("interview_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("ats_candidates_org_id_idx").on(table.orgId),
    projectIdx: index("ats_candidates_project_id_idx").on(table.projectId),
  })
);

export const financeTransactions = sqliteTable(
  "finance_transactions",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    type: text("type").notNull(),
    amount: integer("amount", { mode: "number" }).notNull(),
    category: text("category"),
    description: text("description"),
    date: text("date").notNull().default(sql`CURRENT_TIMESTAMP`),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("finance_transactions_org_id_idx").on(table.orgId),
    projectIdx: index("finance_transactions_project_id_idx").on(table.projectId),
  })
);

export const logisticsShipments = sqliteTable(
  "logistics_shipments",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    trackingNo: text("tracking_no").notNull(),
    origin: text("origin"),
    destination: text("destination"),
    status: text("status").notNull().default("pending"),
    carrier: text("carrier"),
    estimatedAt: text("estimated_at"),
    deliveredAt: text("delivered_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("logistics_shipments_org_id_idx").on(table.orgId),
    projectIdx: index("logistics_shipments_project_id_idx").on(table.projectId),
  })
);

export const pmTasks = sqliteTable(
  "pm_tasks",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull().default("todo"),
    priority: text("priority").notNull().default("medium"),
    assignedTo: text("assigned_to"),
    dueDate: text("due_date"),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("pm_tasks_org_id_idx").on(table.orgId),
    projectIdx: index("pm_tasks_project_id_idx").on(table.projectId),
  })
);

export const eduCourses = sqliteTable(
  "edu_courses",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    title: text("title").notNull(),
    instructor: text("instructor"),
    enrolled: integer("enrolled").notNull().default(0),
    completed: integer("completed").notNull().default(0),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("edu_courses_org_id_idx").on(table.orgId),
    projectIdx: index("edu_courses_project_id_idx").on(table.projectId),
  })
);

export const healthcarePatients = sqliteTable(
  "healthcare_patients",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("waiting"),
    urgency: text("urgency").notNull().default("normal"),
    appointedAt: text("appointed_at"),
    assignedTo: text("assigned_to"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("healthcare_patients_org_id_idx").on(table.orgId),
    projectIdx: index("healthcare_patients_project_id_idx").on(table.projectId),
  })
);

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    event: text("event").notNull(),
    value: integer("value", { mode: "number" }).notNull().default(0),
    source: text("source"),
    metadata: text("metadata").notNull().default(sql`'{}'`),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    orgIdx: index("analytics_events_org_id_idx").on(table.orgId),
    projectIdx: index("analytics_events_project_id_idx").on(table.projectId),
  })
);
