import type { ProviderId } from '../../../provider-registry/events/ProviderRegistryEvents';
import type {
  CustomTaskRecord,
  ResolvedTaskDefinition,
  SystemTaskId,
  SystemTaskOverride,
  TaskProviderChainRule,
  TaskProviderRequestMap,
  TaskRegistryOverlayV1,
  TaskRegistryRecord,
} from '../../events/TaskRegistryEvents';
import { SYSTEM_TASK_DEFINITIONS } from '../../events/TaskRegistryEvents';
import {
  areTaskProviderRequestMapsEqual,
  cloneTaskProviderRequestMap,
} from './taskRegistryValidation';

export function buildSystemTaskRecord(
  task: SystemTaskId,
  overlay: TaskRegistryOverlayV1,
  providerLabelMap: ReadonlyMap<string, string>,
  chainRule: TaskProviderChainRule | null,
  providerChainIds: readonly ProviderId[],
): TaskRegistryRecord {
  const resolvedTaskDefinition = resolveTaskDefinition(task, overlay);
  const definitionOverride = overlay.systemOverrides[task];
  const hasDefinitionOverride = definitionOverride != null;
  const hasProviderChainOverride = chainRule != null;

  return {
    id: task,
    source: 'system',
    status: 'active',
    mutability: 'override-only',
    label: resolvedTaskDefinition.label,
    mode: resolvedTaskDefinition.mode,
    systemPrompt: resolvedTaskDefinition.systemPrompt,
    userPrompt: resolvedTaskDefinition.userPrompt,
    providerSystemPrompts: resolvedTaskDefinition.providerSystemPrompts,
    providerRequestParams: cloneTaskProviderRequestMap(resolvedTaskDefinition.providerRequestParams),
    providerChainIds: [...providerChainIds],
    providerChainLabels: providerChainIds.map((providerId) => providerLabelMap.get(providerId) ?? providerId),
    hasDefinitionOverride,
    hasProviderChainOverride,
    hasOverride: hasDefinitionOverride || hasProviderChainOverride,
    updatedAt: Math.max(definitionOverride?.updatedAt ?? 0, chainRule?.updatedAt ?? 0),
  };
}

export function buildCustomTaskRecord(
  task: CustomTaskRecord,
  providerLabelMap: ReadonlyMap<string, string>,
): TaskRegistryRecord {
  return {
    id: task.id,
    source: 'user',
    status: 'active',
    mutability: 'full',
    label: task.label,
    mode: task.mode,
    systemPrompt: task.systemPrompt,
    userPrompt: task.userPrompt,
    providerRequestParams: cloneTaskProviderRequestMap(task.providerRequestParams),
    providerChainIds: [...task.providerIds],
    providerChainLabels: task.providerIds.map((providerId) => providerLabelMap.get(providerId) ?? providerId),
    hasDefinitionOverride: false,
    hasProviderChainOverride: false,
    hasOverride: false,
    updatedAt: task.updatedAt,
  };
}

export function resolveTaskDefinition(task: SystemTaskId, overlay: TaskRegistryOverlayV1): ResolvedTaskDefinition {
  const systemTask = SYSTEM_TASK_DEFINITIONS[task];
  const definitionOverride = overlay.systemOverrides[task];

  return {
    label: definitionOverride?.label ?? systemTask.label,
    mode: definitionOverride?.mode ?? systemTask.mode,
    systemPrompt: definitionOverride?.systemPrompt ?? systemTask.systemPrompt,
    userPrompt: definitionOverride?.userPrompt ?? systemTask.userPrompt,
    providerSystemPrompts: systemTask.providerSystemPrompts,
    providerRequestParams: cloneTaskProviderRequestMap(
      definitionOverride?.providerRequestParams ?? systemTask.providerRequestParams,
    ),
  };
}

export function buildSystemTaskOverride(
  task: SystemTaskId,
  label: string,
  mode: 'json' | 'markdown',
  systemPrompt: string,
  userPrompt: string,
  providerRequestParams: TaskProviderRequestMap | undefined,
  updatedAt: number,
): SystemTaskOverride | null {
  const systemTask = SYSTEM_TASK_DEFINITIONS[task];
  const override: SystemTaskOverride = {
    updatedAt,
  };

  if (label !== systemTask.label) {
    override.label = label;
  }

  if (mode !== systemTask.mode) {
    override.mode = mode;
  }

  if (systemPrompt !== systemTask.systemPrompt) {
    override.systemPrompt = systemPrompt;
  }

  if (userPrompt !== systemTask.userPrompt) {
    override.userPrompt = userPrompt;
  }

  if (!areTaskProviderRequestMapsEqual(providerRequestParams, systemTask.providerRequestParams)) {
    override.providerRequestParams = cloneTaskProviderRequestMap(providerRequestParams) ?? {};
  }

  return Object.keys(override).length === 1 ? null : override;
}