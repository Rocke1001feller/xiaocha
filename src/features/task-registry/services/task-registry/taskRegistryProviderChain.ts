import {
  dedupeProviderIds,
  type ProviderId,
  type ProviderViewRecord,
} from '../../../provider-registry/events/ProviderRegistryEvents';
import {
  SYSTEM_TASK_DEFINITIONS,
  SYSTEM_TASK_PROVIDER_CHAINS,
  SYSTEM_TASKS,
  toCustomTaskId,
  type CustomTaskId,
  type SystemTaskId,
  type TaskId,
  type TaskProviderChainOverlayV1,
  type TaskProviderChainRule,
  type TaskRegistryOverlayV1,
  type UpdateTaskInput,
} from '../../events/TaskRegistryEvents';
import { TaskRegistryValidationError } from './taskRegistryValidation';

function areProviderIdListsEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((providerId, index) => providerId === right[index]);
}

export function buildTaskChainRule(
  input: UpdateTaskInput,
  updatedAt: number,
): TaskProviderChainRule | null {
  const providerIds = dedupeProviderIds(input.providerIds);
  const defaultProviderIds = SYSTEM_TASK_PROVIDER_CHAINS[input.id as SystemTaskId];

  if (providerIds.length === 0) {
    throw new TaskRegistryValidationError('Task provider chain must include at least one provider.');
  }

  if (areProviderIdListsEqual(providerIds, defaultProviderIds)) {
    return null;
  }

  return {
    mode: 'replace',
    providerIds,
    updatedAt,
  };
}

export function resolveTaskProviderIds(
  task: SystemTaskId,
  taskChainOverlay: TaskProviderChainOverlayV1,
  activeProviderIds: ReadonlySet<ProviderId>,
): ProviderId[] {
  const baseProviderIds = SYSTEM_TASK_PROVIDER_CHAINS[task];
  const taskOverride = taskChainOverlay.tasks[task];
  let providerIds: ProviderId[];

  if (!taskOverride) {
    providerIds = [...baseProviderIds];
  } else if (taskOverride.mode === 'replace') {
    providerIds = [...taskOverride.providerIds];
  } else if (taskOverride.insertPosition === 'head') {
    providerIds = [...taskOverride.providerIds, ...baseProviderIds];
  } else {
    providerIds = [...baseProviderIds, ...taskOverride.providerIds];
  }

  return dedupeProviderIds(providerIds).filter((providerId) => activeProviderIds.has(providerId));
}

export function assertSystemTaskExists(task: TaskId): asserts task is SystemTaskId {
  if (!SYSTEM_TASKS.includes(task as SystemTaskId)) {
    throw new TaskRegistryValidationError(`Unknown task "${task}".`);
  }
}

export function assertTaskChainIsValid(
  task: SystemTaskId,
  rule: TaskProviderChainRule | null,
  providerViews: readonly ProviderViewRecord[],
): void {
  const providerViewMap = new Map(providerViews.map((provider) => [provider.id, provider]));
  const configuredProviderIds = rule?.providerIds ?? SYSTEM_TASK_PROVIDER_CHAINS[task];

  for (const providerId of configuredProviderIds) {
    if (!providerViewMap.has(providerId)) {
      throw new TaskRegistryValidationError(
        `Task "${SYSTEM_TASK_DEFINITIONS[task].label}" references unknown provider "${providerId}".`,
      );
    }
  }

  const activeProviderIdSet = new Set(
    providerViews
      .filter((provider) => provider.status === 'active')
      .map((provider) => provider.id),
  );
  const resolvedProviderIds = resolveTaskProviderIds(
    task,
    {
      version: 1,
      tasks: rule ? { [task]: rule } : {},
    },
    activeProviderIdSet,
  );
  const hasExecutableProvider = resolvedProviderIds.some((providerId) => providerViewMap.get(providerId)?.isRuntimeReachable);

  if (!hasExecutableProvider) {
    throw new TaskRegistryValidationError(
      `Task "${SYSTEM_TASK_DEFINITIONS[task].label}" must keep at least one executable provider.`,
    );
  }
}

export function assertCustomTaskProvidersAreValid(
  providerIds: ProviderId[],
  taskLabel: string,
  providerViews: readonly ProviderViewRecord[],
): void {
  if (providerIds.length === 0) {
    throw new TaskRegistryValidationError('Task provider chain must include at least one provider.');
  }

  const providerViewMap = new Map(providerViews.map((provider) => [provider.id, provider]));

  for (const providerId of providerIds) {
    if (!providerViewMap.has(providerId)) {
      throw new TaskRegistryValidationError(
        `Task "${taskLabel}" references unknown provider "${providerId}".`,
      );
    }
  }

  const hasExecutableProvider = providerIds.some((providerId) => providerViewMap.get(providerId)?.isRuntimeReachable);

  if (!hasExecutableProvider) {
    throw new TaskRegistryValidationError(`Task "${taskLabel}" must keep at least one executable provider.`);
  }
}

export function createUniqueCustomTaskId(label: string, overlay: TaskRegistryOverlayV1): CustomTaskId {
  const baseSlug = normalizeCustomTaskSlug(label);
  let suffix = 1;
  let candidate = toCustomTaskId(baseSlug);

  while (overlay.customTasks[candidate]) {
    suffix += 1;
    candidate = toCustomTaskId(`${baseSlug}-${suffix}`);
  }

  return candidate;
}

export function normalizeCustomTaskSlug(label: string): string {
  const normalized = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return normalized.length >= 3 ? normalized : 'task';
}