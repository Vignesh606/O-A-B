CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`event` text NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`source` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_events_org_id_idx` ON `analytics_events` (`org_id`);--> statement-breakpoint
CREATE INDEX `analytics_events_project_id_idx` ON `analytics_events` (`project_id`);--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`key_hash` text NOT NULL,
	`prefix` text NOT NULL,
	`last_used_at` text,
	`expires_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_hash_unique` ON `api_keys` (`key_hash`);--> statement-breakpoint
CREATE INDEX `api_keys_org_id_idx` ON `api_keys` (`org_id`);--> statement-breakpoint
CREATE TABLE `ats_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`role` text,
	`stage` text DEFAULT 'applied' NOT NULL,
	`recruiter_id` text,
	`interview_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ats_candidates_org_id_idx` ON `ats_candidates` (`org_id`);--> statement-breakpoint
CREATE INDEX `ats_candidates_project_id_idx` ON `ats_candidates` (`project_id`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`user_id` text,
	`project_id` text,
	`action` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_logs_org_id_idx` ON `audit_logs` (`org_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_id_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_org_id_created_at_idx` ON `audit_logs` (`org_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `crm_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`company` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `crm_contacts_org_id_idx` ON `crm_contacts` (`org_id`);--> statement-breakpoint
CREATE INDEX `crm_contacts_project_id_idx` ON `crm_contacts` (`project_id`);--> statement-breakpoint
CREATE TABLE `crm_deals` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`stage` text DEFAULT 'lead' NOT NULL,
	`contact_name` text,
	`assigned_to` text,
	`closed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `crm_deals_org_id_idx` ON `crm_deals` (`org_id`);--> statement-breakpoint
CREATE INDEX `crm_deals_project_id_idx` ON `crm_deals` (`project_id`);--> statement-breakpoint
CREATE TABLE `deployment_telemetry` (
	`id` text PRIMARY KEY NOT NULL,
	`deployment_id` text NOT NULL,
	`build_duration_ms` integer DEFAULT 0 NOT NULL,
	`startup_time_ms` integer DEFAULT 0 NOT NULL,
	`repair_count` integer DEFAULT 0 NOT NULL,
	`preview_uptime_sec` integer DEFAULT 0 NOT NULL,
	`memory_usage_mb` integer DEFAULT 0 NOT NULL,
	`crash_count` integer DEFAULT 0 NOT NULL,
	`failure_category` text,
	`repaired_errors` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`deployment_id`) REFERENCES `deployments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deployment_telemetry_deployment_id_unique` ON `deployment_telemetry` (`deployment_id`);--> statement-breakpoint
CREATE TABLE `deployments` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`version` integer NOT NULL,
	`status` text DEFAULT 'QUEUED' NOT NULL,
	`env` text DEFAULT 'PRODUCTION' NOT NULL,
	`cf_deployment_id` text,
	`cf_worker_name` text,
	`deployed_url` text,
	`build_log` text,
	`build_duration` integer,
	`error_message` text,
	`code_snapshot` text,
	`triggered_by` text,
	`deployed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deployments_project_id_version_unique` ON `deployments` (`project_id`,`version`);--> statement-breakpoint
CREATE INDEX `deployments_project_id_idx` ON `deployments` (`project_id`);--> statement-breakpoint
CREATE INDEX `deployments_status_idx` ON `deployments` (`status`);--> statement-breakpoint
CREATE TABLE `ecom_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`order_number` text NOT NULL,
	`customer_name` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`item_count` integer DEFAULT 0 NOT NULL,
	`fulfilled_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ecom_orders_org_id_idx` ON `ecom_orders` (`org_id`);--> statement-breakpoint
CREATE INDEX `ecom_orders_project_id_idx` ON `ecom_orders` (`project_id`);--> statement-breakpoint
CREATE TABLE `ecom_products` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`sku` text,
	`stock` integer DEFAULT 0 NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ecom_products_org_id_idx` ON `ecom_products` (`org_id`);--> statement-breakpoint
CREATE INDEX `ecom_products_project_id_idx` ON `ecom_products` (`project_id`);--> statement-breakpoint
CREATE TABLE `edu_courses` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`instructor` text,
	`enrolled` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `edu_courses_org_id_idx` ON `edu_courses` (`org_id`);--> statement-breakpoint
CREATE INDEX `edu_courses_project_id_idx` ON `edu_courses` (`project_id`);--> statement-breakpoint
CREATE TABLE `finance_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`category` text,
	`description` text,
	`date` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `finance_transactions_org_id_idx` ON `finance_transactions` (`org_id`);--> statement-breakpoint
CREATE INDEX `finance_transactions_project_id_idx` ON `finance_transactions` (`project_id`);--> statement-breakpoint
CREATE TABLE `healthcare_patients` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`urgency` text DEFAULT 'normal' NOT NULL,
	`appointed_at` text,
	`assigned_to` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `healthcare_patients_org_id_idx` ON `healthcare_patients` (`org_id`);--> statement-breakpoint
CREATE INDEX `healthcare_patients_project_id_idx` ON `healthcare_patients` (`project_id`);--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`provider` text NOT NULL,
	`name` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`token_expiry` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `integrations_org_id_provider_unique` ON `integrations` (`org_id`,`provider`);--> statement-breakpoint
CREATE INDEX `integrations_org_id_idx` ON `integrations` (`org_id`);--> statement-breakpoint
CREATE TABLE `logistics_shipments` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`tracking_no` text NOT NULL,
	`origin` text,
	`destination` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`carrier` text,
	`estimated_at` text,
	`delivered_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `logistics_shipments_org_id_idx` ON `logistics_shipments` (`org_id`);--> statement-breakpoint
CREATE INDEX `logistics_shipments_project_id_idx` ON `logistics_shipments` (`project_id`);--> statement-breakpoint
CREATE TABLE `org_members` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'MEMBER' NOT NULL,
	`invited_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`accepted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `org_members_org_id_user_id_unique` ON `org_members` (`org_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `org_members_org_id_idx` ON `org_members` (`org_id`);--> statement-breakpoint
CREATE INDEX `org_members_user_id_idx` ON `org_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`clerk_org_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo_url` text,
	`plan` text DEFAULT 'FREE' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`max_apps` integer DEFAULT 3 NOT NULL,
	`max_workflows` integer DEFAULT 5 NOT NULL,
	`max_members` integer DEFAULT 5 NOT NULL,
	`max_storage_mb` integer DEFAULT 500 NOT NULL,
	`ai_calls_per_month` integer DEFAULT 100 NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`plan_expires_at` text,
	`owner_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_clerk_org_id_unique` ON `organizations` (`clerk_org_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_stripe_customer_id_unique` ON `organizations` (`stripe_customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_stripe_subscription_id_unique` ON `organizations` (`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `organizations_slug_idx` ON `organizations` (`slug`);--> statement-breakpoint
CREATE INDEX `organizations_owner_id_idx` ON `organizations` (`owner_id`);--> statement-breakpoint
CREATE TABLE `pm_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`assigned_to` text,
	`due_date` text,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pm_tasks_org_id_idx` ON `pm_tasks` (`org_id`);--> statement-breakpoint
CREATE INDEX `pm_tasks_project_id_idx` ON `pm_tasks` (`project_id`);--> statement-breakpoint
CREATE TABLE `project_dashboard_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`template_id` text NOT NULL,
	`layout` text DEFAULT '{}' NOT NULL,
	`theme` text DEFAULT '{}' NOT NULL,
	`widgets` text DEFAULT '[]' NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_dashboard_configs_project_id_unique` ON `project_dashboard_configs` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_dashboard_configs_org_id_idx` ON `project_dashboard_configs` (`org_id`);--> statement-breakpoint
CREATE TABLE `project_env_vars` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`is_secret` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_env_vars_project_id_key_unique` ON `project_env_vars` (`project_id`,`key`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'CRUD_APP' NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`prompt` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`subdomain` text NOT NULL,
	`custom_domain` text,
	`generated_code` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_subdomain_unique` ON `projects` (`subdomain`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_custom_domain_unique` ON `projects` (`custom_domain`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_org_id_slug_unique` ON `projects` (`org_id`,`slug`);--> statement-breakpoint
CREATE INDEX `projects_org_id_idx` ON `projects` (`org_id`);--> statement-breakpoint
CREATE INDEX `projects_subdomain_idx` ON `projects` (`subdomain`);--> statement-breakpoint
CREATE TABLE `support_chats` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`agent_id` text,
	`agent_name` text,
	`customer_id` text,
	`ai_handled` integer DEFAULT false NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`ended_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `support_chats_org_id_idx` ON `support_chats` (`org_id`);--> statement-breakpoint
CREATE INDEX `support_chats_project_id_idx` ON `support_chats` (`project_id`);--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`project_id` text NOT NULL,
	`ticket_number` text NOT NULL,
	`subject` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`channel` text DEFAULT 'email' NOT NULL,
	`customer_id` text,
	`customer_name` text,
	`assigned_to` text,
	`resolved_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `support_tickets_org_id_idx` ON `support_tickets` (`org_id`);--> statement-breakpoint
CREATE INDEX `support_tickets_project_id_idx` ON `support_tickets` (`project_id`);--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`clerk_session` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_sessions_clerk_session_unique` ON `user_sessions` (`clerk_session`);--> statement-breakpoint
CREATE INDEX `user_sessions_user_id_idx` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`clerk_id` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`name` text,
	`avatar_url` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`last_active_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerk_id_unique` ON `users` (`clerk_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_clerk_id_idx` ON `users` (`clerk_id`);--> statement-breakpoint
CREATE TABLE `workflow_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`workflow_id` text NOT NULL,
	`org_id` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`trace` text DEFAULT '[]' NOT NULL,
	`input_data` text,
	`output_data` text,
	`error_message` text,
	`duration` integer,
	`started_at` text,
	`finished_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workflow_runs_workflow_id_idx` ON `workflow_runs` (`workflow_id`);--> statement-breakpoint
CREATE INDEX `workflow_runs_org_id_idx` ON `workflow_runs` (`org_id`);--> statement-breakpoint
CREATE INDEX `workflow_runs_org_id_status_idx` ON `workflow_runs` (`org_id`,`status`);--> statement-breakpoint
CREATE INDEX `workflow_runs_status_idx` ON `workflow_runs` (`status`);--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`trigger_type` text DEFAULT 'MANUAL' NOT NULL,
	`definition` text DEFAULT '{"edges": [], "nodes": []}' NOT NULL,
	`cron_expression` text,
	`timezone` text DEFAULT 'UTC',
	`webhook_secret` text,
	`last_run_at` text,
	`next_run_at` text,
	`total_runs` integer DEFAULT 0 NOT NULL,
	`success_runs` integer DEFAULT 0 NOT NULL,
	`failed_runs` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workflows_project_id_idx` ON `workflows` (`project_id`);--> statement-breakpoint
CREATE INDEX `workflows_status_idx` ON `workflows` (`status`);