import type { ProviderId } from '../../../provider-registry/events/ProviderRegistryEvents';
import type { SettingsProviderRecord } from '../../events/SettingsEvents';

export type TaskEditorMode = 'existing' | 'create';

export type TaskEditorFeedback = {
  tone: 'error' | 'success';
  text: string;
} | null;

export type TaskProviderRequestDraft = {
  temperature: string;
  topP: string;
  maxTokens: string;
};

export type TaskProviderRequestDraftMap = Partial<Record<ProviderId, TaskProviderRequestDraft>>;

export type TaskDraft = {
  label: string;
  mode: 'json' | 'markdown';
  systemPrompt: string;
  userPrompt: string;
  providerRequestParams: TaskProviderRequestDraftMap;
  providerIds: ProviderId[];
};

export type TaskProviderOption = {
  id: ProviderId;
  label: string;
  checked: boolean;
  source: SettingsProviderRecord['source'];
  status: SettingsProviderRecord['status'];
};

export type TaskChainSelectionItem = {
  id: ProviderId;
  label: string;
  source: SettingsProviderRecord['source'];
  status: SettingsProviderRecord['status'];
  canMoveUp: boolean;
  canMoveDown: boolean;
};

export type TaskProviderTuningItem = {
  id: ProviderId;
  label: string;
  source: SettingsProviderRecord['source'];
  status: SettingsProviderRecord['status'];
  requestParams: TaskProviderRequestDraft;
};

export const EMPTY_TASK_PROVIDER_REQUEST_DRAFT: TaskProviderRequestDraft = {
  temperature: '',
  topP: '',
  maxTokens: '',
};

export const EMPTY_TASK_DRAFT: TaskDraft = {
  label: '',
  mode: 'markdown',
  systemPrompt: '',
  userPrompt: '',
  providerRequestParams: {},
  providerIds: [],
};

export function cloneTaskProviderRequestDraft(
  draft: TaskProviderRequestDraft,
): TaskProviderRequestDraft {
  return {
    ...draft,
  };
}

export function cloneTaskProviderRequestDraftMap(
  draftMap: TaskProviderRequestDraftMap,
): TaskProviderRequestDraftMap {
  return Object.fromEntries(
    Object.entries(draftMap).flatMap(([providerId, requestDraft]) => {
      if (!requestDraft) {
        return [];
      }

      return [[providerId, cloneTaskProviderRequestDraft(requestDraft)] as const];
    }),
  ) as TaskProviderRequestDraftMap;
}

export function cloneTaskDraft(draft: TaskDraft): TaskDraft {
  return {
    ...draft,
    providerRequestParams: cloneTaskProviderRequestDraftMap(draft.providerRequestParams),
    providerIds: [...draft.providerIds],
  };
}

export function areProviderIdListsEqual(
  left: readonly ProviderId[],
  right: readonly ProviderId[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((providerId, index) => providerId === right[index]);
}

export function areTaskProviderRequestDraftMapsEqual(
  left: TaskProviderRequestDraftMap,
  right: TaskProviderRequestDraftMap,
): boolean {
  const providerIds = new Set<ProviderId>([
    ...(Object.keys(left) as ProviderId[]),
    ...(Object.keys(right) as ProviderId[]),
  ]);

  for (const providerId of providerIds) {
    const leftDraft = left[providerId] ?? EMPTY_TASK_PROVIDER_REQUEST_DRAFT;
    const rightDraft = right[providerId] ?? EMPTY_TASK_PROVIDER_REQUEST_DRAFT;

    if (
      leftDraft.temperature !== rightDraft.temperature ||
      leftDraft.topP !== rightDraft.topP ||
      leftDraft.maxTokens !== rightDraft.maxTokens
    ) {
      return false;
    }
  }

  return true;
}

export function areTaskDraftsEqual(left: TaskDraft, right: TaskDraft): boolean {
  return (
    left.label === right.label &&
    left.mode === right.mode &&
    left.systemPrompt === right.systemPrompt &&
    left.userPrompt === right.userPrompt &&
    areTaskProviderRequestDraftMapsEqual(left.providerRequestParams, right.providerRequestParams) &&
    areProviderIdListsEqual(left.providerIds, right.providerIds)
  );
}