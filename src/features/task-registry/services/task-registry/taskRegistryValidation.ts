import { dedupeProviderIds, type ProviderId } from '../../../provider-registry/events/ProviderRegistryEvents';
import type { TaskProviderRequestMap, TaskRequestParams } from '../../events/TaskRegistryEvents';

export class TaskRegistryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskRegistryValidationError';
  }
}

export function cloneTaskProviderRequestMap(
  requestMap: TaskProviderRequestMap | undefined,
): TaskProviderRequestMap | undefined {
  if (!requestMap) {
    return undefined;
  }

  const clonedEntries = Object.entries(requestMap).flatMap(([providerId, params]) => {
    if (!params) {
      return [];
    }

    return [[providerId, { ...params }] as const];
  });

  if (clonedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(clonedEntries) as TaskProviderRequestMap;
}

export function normalizeTaskProviderRequestMap(
  requestMap: TaskProviderRequestMap | undefined,
  providerIds: readonly ProviderId[],
): TaskProviderRequestMap | undefined {
  if (!requestMap) {
    return undefined;
  }

  const normalizedRequestMap: TaskProviderRequestMap = {};

  for (const providerId of dedupeProviderIds(providerIds)) {
    const params = requestMap[providerId];
    const normalizedParams = normalizeTaskRequestParams(params);

    if (normalizedParams) {
      normalizedRequestMap[providerId] = normalizedParams;
    }
  }

  return Object.keys(normalizedRequestMap).length > 0 ? normalizedRequestMap : undefined;
}

export function normalizeTaskRequestParams(
  params: TaskRequestParams | undefined,
): TaskRequestParams | undefined {
  if (!params) {
    return undefined;
  }

  const normalizedParams: TaskRequestParams = {};

  if (params.temperature !== undefined) {
    if (!Number.isFinite(params.temperature) || params.temperature < 0 || params.temperature > 2) {
      throw new TaskRegistryValidationError('Task temperature must be between 0 and 2.');
    }

    normalizedParams.temperature = params.temperature;
  }

  if (params.top_p !== undefined) {
    if (!Number.isFinite(params.top_p) || params.top_p <= 0 || params.top_p > 1) {
      throw new TaskRegistryValidationError('Task top_p must be greater than 0 and less than or equal to 1.');
    }

    normalizedParams.top_p = params.top_p;
  }

  if (params.max_tokens !== undefined) {
    if (!Number.isInteger(params.max_tokens) || params.max_tokens <= 0) {
      throw new TaskRegistryValidationError('Task max_tokens must be a positive integer.');
    }

    normalizedParams.max_tokens = params.max_tokens;
  }

  return Object.keys(normalizedParams).length > 0 ? normalizedParams : undefined;
}

export function areTaskProviderRequestMapsEqual(
  left: TaskProviderRequestMap | undefined,
  right: TaskProviderRequestMap | undefined,
): boolean {
  const providerIds = new Set<ProviderId>([
    ...Object.keys(left ?? {}) as ProviderId[],
    ...Object.keys(right ?? {}) as ProviderId[],
  ]);

  for (const providerId of providerIds) {
    const leftParams = left?.[providerId];
    const rightParams = right?.[providerId];

    if (
      leftParams?.temperature !== rightParams?.temperature ||
      leftParams?.top_p !== rightParams?.top_p ||
      leftParams?.max_tokens !== rightParams?.max_tokens
    ) {
      return false;
    }
  }

  return true;
}

export function normalizeTaskLabel(label: string): string {
  const normalizedLabel = label.trim();

  if (normalizedLabel.length === 0 || normalizedLabel.length > 80) {
    throw new TaskRegistryValidationError('Task label must be between 1 and 80 characters.');
  }

  return normalizedLabel;
}

export function normalizeTaskMode(mode: 'json' | 'markdown'): 'json' | 'markdown' {
  if (mode !== 'json' && mode !== 'markdown') {
    throw new TaskRegistryValidationError('Task mode must be either json or markdown.');
  }

  return mode;
}

export function normalizePromptBody(prompt: string, promptLabel: 'System Prompt' | 'User Prompt'): string {
  const normalizedPrompt = prompt.trim();

  if (normalizedPrompt.length === 0 || normalizedPrompt.length > 20000) {
    throw new TaskRegistryValidationError(
      `${promptLabel} must be between 1 and 20000 characters.`,
    );
  }

  return normalizedPrompt;
}