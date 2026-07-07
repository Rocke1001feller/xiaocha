import { TASKS } from '../../../../src/llm/config';
import type { ChatCompletionRequestParams } from '../../../../src/llm/provider-chat-transport';
import {
  SYSTEM_TASK_IDS,
  isCustomTaskId,
  toCustomTaskId,
  type CustomTaskId,
  type SystemTaskId,
  type TaskId,
} from '../../../shared/task-ids';

export type { CustomTaskId, SystemTaskId, TaskId };

import type {
  ProviderId,
} from '../../provider-registry/events/ProviderRegistryEvents';

export type TaskRequestParams = ChatCompletionRequestParams;

export type TaskProviderRequestMap = Partial<Record<ProviderId, TaskRequestParams>>;

export const SYSTEM_TASK_DEFINITIONS = TASKS;

export const SYSTEM_TASK_PROVIDER_CHAINS = Object.fromEntries(
  Object.entries(TASKS).map(([task, config]) => [task, [...config.providers]]),
) as Record<SystemTaskId, ProviderId[]>;

export const SYSTEM_TASKS = [...SYSTEM_TASK_IDS] as SystemTaskId[];

export type TaskProviderChainMode = 'inherit' | 'replace';

export type TaskProviderChainRule = {
  mode: TaskProviderChainMode;
  insertPosition?: 'head' | 'tail';
  providerIds: ProviderId[];
  updatedAt: number;
};

export type TaskProviderChainOverlayV1 = {
  version: 1;
  tasks: Partial<Record<SystemTaskId, TaskProviderChainRule>>;
};

export type TaskSource = 'system' | 'user';

export type TaskStatus = 'active';

export type TaskMutability = 'override-only' | 'full';

export type SystemTaskOverride = {
  label?: string;
  mode?: 'json' | 'markdown';
  systemPrompt?: string;
  userPrompt?: string;
  providerRequestParams?: TaskProviderRequestMap;
  updatedAt: number;
};

export type CustomTaskRecord = {
  id: CustomTaskId;
  label: string;
  mode: 'json' | 'markdown';
  systemPrompt: string;
  userPrompt: string;
  providerRequestParams?: TaskProviderRequestMap;
  providerIds: ProviderId[];
  createdAt: number;
  updatedAt: number;
};

export type TaskRegistryOverlayV1 = {
  version: 1;
  systemOverrides: Partial<Record<SystemTaskId, SystemTaskOverride>>;
  customTasks: Partial<Record<CustomTaskId, CustomTaskRecord>>;
  disabledSystemTaskIds: SystemTaskId[];
};

export type TaskRegistryRecord = {
  id: TaskId;
  source: TaskSource;
  status: TaskStatus;
  mutability: TaskMutability;
  label: string;
  mode: 'json' | 'markdown';
  systemPrompt: string;
  userPrompt: string;
  providerSystemPrompts?: Partial<Record<ProviderId, string>>;
  providerRequestParams?: TaskProviderRequestMap;
  providerChainIds: ProviderId[];
  providerChainLabels: string[];
  hasDefinitionOverride: boolean;
  hasProviderChainOverride: boolean;
  hasOverride: boolean;
  updatedAt: number;
};

export type CreateCustomTaskInput = {
  label: string;
  mode: 'json' | 'markdown';
  systemPrompt: string;
  userPrompt: string;
  providerRequestParams?: TaskProviderRequestMap;
  providerIds: ProviderId[];
};

export type UpdateTaskInput = {
  id: TaskId;
  label: string;
  mode: 'json' | 'markdown';
  systemPrompt: string;
  userPrompt: string;
  providerRequestParams?: TaskProviderRequestMap;
  providerIds: ProviderId[];
};

export type ResolvedTaskDefinition = {
  label: string;
  mode: 'json' | 'markdown';
  systemPrompt: string;
  userPrompt: string;
  providerSystemPrompts?: Partial<Record<ProviderId, string>>;
  providerRequestParams?: TaskProviderRequestMap;
};

export const TASK_PROVIDER_CHAIN_OVERLAY_FALLBACK: TaskProviderChainOverlayV1 = {
  version: 1,
  tasks: {},
};

export { isCustomTaskId, toCustomTaskId };

export const TASK_REGISTRY_OVERLAY_FALLBACK: TaskRegistryOverlayV1 = {
  version: 1,
  systemOverrides: {},
  customTasks: {},
  disabledSystemTaskIds: [],
};