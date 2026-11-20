// =============================================================================
// apps/api/src/events/emitter.ts
// Typed EventEmitter wrapper for application events.
// =============================================================================

import type { JsonObject } from "../realtime/server";

export interface ProjectEventPayload extends JsonObject {
  orgId: string;
  projectId: string;
  userId: string;
  name?: string;
  metadata?: JsonObject;
}

export interface DeploymentEventPayload extends JsonObject {
  orgId: string;
  projectId: string;
  deploymentId: string;
  userId: string;
  status?: string;
  metadata?: JsonObject;
}

export interface WorkflowEventPayload extends JsonObject {
  orgId: string;
  projectId: string;
  workflowId: string;
  userId: string;
  status?: string;
  metadata?: JsonObject;
}

export interface AiEventPayload extends JsonObject {
  orgId: string;
  projectId: string;
  userId: string;
  provider?: string;
  model?: string;
  metadata?: JsonObject;
}

export interface AppEventMap {
  "project.created": ProjectEventPayload;
  "project.updated": ProjectEventPayload;
  "project.deleted": ProjectEventPayload;
  "deployment.started": DeploymentEventPayload;
  "deployment.completed": DeploymentEventPayload;
  "deployment.failed": DeploymentEventPayload;
  "workflow.started": WorkflowEventPayload;
  "workflow.completed": WorkflowEventPayload;
  "workflow.failed": WorkflowEventPayload;
  "ai.started": AiEventPayload;
  "ai.completed": AiEventPayload;
  "ai.failed": AiEventPayload;
}

export type AppEventName = keyof AppEventMap;
export type AppEventPayload<K extends AppEventName> = AppEventMap[K];
export type AppEventListener<K extends AppEventName> = (
  payload: AppEventMap[K]
) => void | Promise<void>;

class TypedEventEmitter {
  private readonly listeners = new Map<AppEventName, Set<AppEventListener<any>>>();

  on<K extends AppEventName>(
    eventName: K,
    listener: AppEventListener<K>
  ): this {
    const listeners = this.listeners.get(eventName) ?? new Set();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);
    return this;
  }

  once<K extends AppEventName>(
    eventName: K,
    listener: AppEventListener<K>
  ): this {
    const onceListener: AppEventListener<K> = async (payload) => {
      this.off(eventName, onceListener);
      await listener(payload);
    };
    return this.on(eventName, onceListener);
  }

  off<K extends AppEventName>(
    eventName: K,
    listener: AppEventListener<K>
  ): this {
    this.listeners.get(eventName)?.delete(listener);
    return this;
  }

  emit<K extends AppEventName>(
    eventName: K,
    payload: AppEventMap[K]
  ): boolean {
    const listeners = this.listeners.get(eventName);
    if (!listeners?.size) return false;
    for (const listener of listeners) {
      Promise.resolve(listener(payload)).catch((error) => {
        console.error(`[events] listener failed for ${eventName}`, error);
      });
    }
    return true;
  }
}

export const appEvents = new TypedEventEmitter();
