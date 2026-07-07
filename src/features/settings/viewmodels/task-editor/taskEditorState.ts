import type { ProviderId } from '../../../provider-registry/events/ProviderRegistryEvents';
import type {
  CreateCustomTaskInput,
  TaskProviderRequestMap,
  TaskRequestParams,
  UpdateTaskInput,
} from '../../../task-registry/events/TaskRegistryEvents';
import type {
  SettingsProviderRecord,
  SettingsTaskRecord,
} from '../../events/SettingsEvents';
import type { TaskEditorCopy } from './taskEditorCopy';
import {
  EMPTY_TASK_PROVIDER_REQUEST_DRAFT,
  cloneTaskProviderRequestDraft,
  cloneTaskProviderRequestDraftMap,
  type TaskChainSelectionItem,
  type TaskDraft,
  type TaskEditorMode,
  type TaskProviderOption,
  type TaskProviderRequestDraft,
  type TaskProviderRequestDraftMap,
  type TaskProviderTuningItem,
} from './taskEditorTypes';

export type TaskDiscardAction = 'select' | 'create';

export type TaskListViewState = {
  items: SettingsTaskRecord[];
  selectedTaskId: SettingsTaskRecord['id'] | null;
  navCount: number;
  hasUnsavedChanges: boolean;
  discardMessages: Record<TaskDiscardAction, string>;
};

export type TaskEditorViewState = {
  selectedTask: SettingsTaskRecord | null;
  draft: TaskDraft;
  isCreating: boolean;
  hasTask: boolean;
  isBusy: boolean;
  title: string;
  subtitle: string;
  badge: string;
  primaryActionLabel: string;
  resetActionLabel: string;
  canSave: boolean;
  canReset: boolean;
  resetConfirmMessage: string | null;
  providerOptions: TaskProviderOption[];
  selectedProviderItems: TaskChainSelectionItem[];
  providerTuningItems: TaskProviderTuningItem[];
};

export function getSelectedTask(
  tasks: readonly SettingsTaskRecord[],
  selectedTaskId: SettingsTaskRecord['id'] | null,
): SettingsTaskRecord | null {
  return tasks.find((task) => task.id === selectedTaskId) ?? null;
}

export function getVisibleTasks(
  tasks: readonly SettingsTaskRecord[],
  query: string,
): SettingsTaskRecord[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [...tasks];
  }

  return tasks.filter((task) => {
    const haystack = [task.label, task.summary, task.mode, ...task.providers, ...task.providerChainIds]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function hasUnsavedTaskChanges(
  mode: TaskEditorMode,
  isDirty: boolean,
  draft: TaskDraft,
): boolean {
  if (isDirty) {
    return true;
  }

  return mode === 'create' && !isTaskDraftEmpty(draft);
}

export function buildTaskDraftFromRecord(task: SettingsTaskRecord): TaskDraft {
  return {
    label: task.label,
    mode: task.mode,
    systemPrompt: task.systemPrompt,
    userPrompt: task.userPrompt,
    providerRequestParams: createTaskProviderRequestDraftMap(task.providerRequestParams),
    providerIds: [...task.providerChainIds],
  };
}

export function createInitialTaskDraft(
  selectedTask: SettingsTaskRecord | null,
  providers: readonly SettingsProviderRecord[],
): TaskDraft {
  const fallbackProviderIds = selectedTask?.providerChainIds.length
    ? [...selectedTask.providerChainIds]
    : providers
        .filter((provider) => provider.status === 'active')
        .slice(0, 1)
        .map((provider) => provider.id);

  return {
    label: '',
    mode: selectedTask?.mode ?? 'markdown',
    systemPrompt: '',
    userPrompt: '',
    providerRequestParams: {},
    providerIds: fallbackProviderIds,
  };
}

export function updateTaskProviderSelection(
  draft: TaskDraft,
  providerId: ProviderId,
  checked: boolean,
): TaskDraft {
  const providerIds = checked
    ? [...draft.providerIds.filter((currentProviderId) => currentProviderId !== providerId), providerId]
    : draft.providerIds.filter((currentProviderId) => currentProviderId !== providerId);
  const providerRequestParams = cloneTaskProviderRequestDraftMap(draft.providerRequestParams);

  if (!checked) {
    delete providerRequestParams[providerId];
  }

  return {
    ...draft,
    providerIds,
    providerRequestParams,
  };
}

export function updateTaskProviderRequestDraft(
  draft: TaskDraft,
  providerId: ProviderId,
  field: keyof TaskProviderRequestDraft,
  value: string,
): TaskDraft {
  const providerRequestParams = cloneTaskProviderRequestDraftMap(draft.providerRequestParams);
  const currentDraft =
    providerRequestParams[providerId] ?? cloneTaskProviderRequestDraft(EMPTY_TASK_PROVIDER_REQUEST_DRAFT);

  providerRequestParams[providerId] = {
    ...currentDraft,
    [field]: value,
  };

  return {
    ...draft,
    providerRequestParams,
  };
}

export function moveTaskProviderSelection(
  draft: TaskDraft,
  providerId: ProviderId,
  direction: 'up' | 'down',
): TaskDraft | null {
  const providerIds = [...draft.providerIds];
  const currentIndex = providerIds.indexOf(providerId);

  if (currentIndex === -1) {
    return null;
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= providerIds.length) {
    return null;
  }

  [providerIds[currentIndex], providerIds[targetIndex]] = [providerIds[targetIndex], providerIds[currentIndex]];

  return {
    ...draft,
    providerIds,
  };
}

export function buildCreateTaskInput(
  draft: TaskDraft,
  copy: TaskEditorCopy,
): CreateCustomTaskInput {
  return {
    label: draft.label,
    mode: draft.mode,
    systemPrompt: draft.systemPrompt,
    userPrompt: draft.userPrompt,
    providerRequestParams: parseTaskProviderRequestMap(draft, copy),
    providerIds: [...draft.providerIds],
  };
}

export function buildUpdateTaskInput(
  task: SettingsTaskRecord,
  draft: TaskDraft,
  copy: TaskEditorCopy,
): UpdateTaskInput {
  return {
    id: task.id,
    label: draft.label,
    mode: draft.mode,
    systemPrompt: draft.systemPrompt,
    userPrompt: draft.userPrompt,
    providerRequestParams: parseTaskProviderRequestMap(draft, copy),
    providerIds: [...draft.providerIds],
  };
}

export function buildTaskListViewState(input: {
  tasks: readonly SettingsTaskRecord[];
  selectedTaskId: SettingsTaskRecord['id'] | null;
  query: string;
  mode: TaskEditorMode;
  isDirty: boolean;
  draft: TaskDraft;
  copy: TaskEditorCopy;
}): TaskListViewState {
  return {
    items: getVisibleTasks(input.tasks, input.query),
    selectedTaskId: input.selectedTaskId,
    navCount: input.tasks.length,
    hasUnsavedChanges: hasUnsavedTaskChanges(input.mode, input.isDirty, input.draft),
    discardMessages: {
      select: input.copy.formatDiscardMessage('select'),
      create: input.copy.formatDiscardMessage('create'),
    },
  };
}

export function buildTaskEditorViewState(input: {
  tasks: readonly SettingsTaskRecord[];
  selectedTaskId: SettingsTaskRecord['id'] | null;
  mode: TaskEditorMode;
  draft: TaskDraft;
  isDirty: boolean;
  isSaving: boolean;
  providers: readonly SettingsProviderRecord[];
  copy: TaskEditorCopy;
}): TaskEditorViewState {
  const selectedTask = getSelectedTask(input.tasks, input.selectedTaskId);
  const isCreating = input.mode === 'create';
  const hasTask = isCreating || selectedTask != null;
  const canSave = isCreating ? !input.isSaving : selectedTask != null && input.isDirty && !input.isSaving;
  const hasUnsavedChanges = hasUnsavedTaskChanges(input.mode, input.isDirty, input.draft);
  const canReset = input.isSaving
    ? false
    : isCreating
      ? hasUnsavedChanges
      : selectedTask == null
        ? false
        : selectedTask.source === 'user'
          ? true
          : selectedTask.hasOverride || input.isDirty;

  return {
    selectedTask,
    draft: input.draft,
    isCreating,
    hasTask,
    isBusy: input.isSaving,
    title: isCreating ? input.draft.label.trim() || input.copy.newTask : input.draft.label || selectedTask?.label || '',
    subtitle: isCreating ? input.copy.createSubtitle : selectedTask?.summary ?? '',
    badge: isCreating
      ? input.copy.newTask
      : selectedTask?.source === 'user'
        ? input.copy.customTask
        : selectedTask != null && (input.isDirty || selectedTask.hasOverride)
          ? input.copy.systemTaskOverridden
          : selectedTask != null
            ? input.copy.systemTask
            : '',
    primaryActionLabel: isCreating ? input.copy.createTask : input.copy.saveTask,
    resetActionLabel: isCreating
      ? input.copy.cancel
      : selectedTask?.source === 'user'
        ? input.copy.deleteTask
        : input.copy.resetToDefault,
    canSave,
    canReset,
    resetConfirmMessage: isCreating
      ? hasUnsavedChanges
        ? input.copy.discardCurrentTaskDraft
        : null
      : selectedTask == null
        ? null
        : selectedTask.source === 'user'
          ? input.copy.formatDeleteCustomTaskConfirm(selectedTask.label)
          : !selectedTask.hasOverride && !input.isDirty
            ? null
            : input.copy.formatResetSystemTaskConfirm(selectedTask.label),
    providerOptions: getTaskProviderOptions(input.providers, input.draft),
    selectedProviderItems: getTaskSelectedProviderItems(input.providers, input.draft),
    providerTuningItems: getTaskProviderTuningItems(input.providers, input.draft),
  };
}

function getTaskProviderOptions(
  providers: readonly SettingsProviderRecord[],
  draft: TaskDraft,
): TaskProviderOption[] {
  const selectedProviderIds = new Set(draft.providerIds);

  return providers
    .filter((provider) => provider.status === 'active' || selectedProviderIds.has(provider.id))
    .map((provider) => ({
      id: provider.id,
      label: provider.label,
      checked: selectedProviderIds.has(provider.id),
      source: provider.source,
      status: provider.status,
    }));
}

function getTaskSelectedProviderItems(
  providers: readonly SettingsProviderRecord[],
  draft: TaskDraft,
): TaskChainSelectionItem[] {
  const providerMap = new Map(providers.map((provider) => [provider.id, provider]));

  return draft.providerIds.map((providerId, index, providerIds) => {
    const provider = providerMap.get(providerId);

    return {
      id: providerId,
      label: provider?.label ?? providerId,
      source: provider?.source ?? 'user',
      status: provider?.status ?? 'active',
      canMoveUp: index > 0,
      canMoveDown: index < providerIds.length - 1,
    };
  });
}

function getTaskProviderTuningItems(
  providers: readonly SettingsProviderRecord[],
  draft: TaskDraft,
): TaskProviderTuningItem[] {
  const providerMap = new Map(providers.map((provider) => [provider.id, provider]));

  return draft.providerIds.map((providerId) => {
    const provider = providerMap.get(providerId);

    return {
      id: providerId,
      label: provider?.label ?? providerId,
      source: provider?.source ?? 'user',
      status: provider?.status ?? 'active',
      requestParams: cloneTaskProviderRequestDraft(
        draft.providerRequestParams[providerId] ?? EMPTY_TASK_PROVIDER_REQUEST_DRAFT,
      ),
    };
  });
}

function createTaskProviderRequestDraftMap(
  requestMap: SettingsTaskRecord['providerRequestParams'],
): TaskProviderRequestDraftMap {
  if (!requestMap) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(requestMap).flatMap(([providerId, params]) => {
      if (!params) {
        return [];
      }

      return [[providerId, {
        temperature: params.temperature != null ? String(params.temperature) : '',
        topP: params.top_p != null ? String(params.top_p) : '',
        maxTokens: params.max_tokens != null ? String(params.max_tokens) : '',
      }] as const];
    }),
  ) as TaskProviderRequestDraftMap;
}

function parseTaskProviderRequestMap(
  draft: TaskDraft,
  copy: TaskEditorCopy,
): TaskProviderRequestMap | undefined {
  const requestMap: TaskProviderRequestMap = {};

  for (const providerId of draft.providerIds) {
    const requestDraft = draft.providerRequestParams[providerId];
    if (!requestDraft) {
      continue;
    }

    const params: TaskRequestParams = {};

    if (requestDraft.temperature.trim()) {
      params.temperature = parseTaskNumberInput(requestDraft.temperature, 'temperature', copy);
    }

    if (requestDraft.topP.trim()) {
      params.top_p = parseTaskNumberInput(requestDraft.topP, 'top_p', copy);
    }

    if (requestDraft.maxTokens.trim()) {
      params.max_tokens = parseTaskIntegerInput(requestDraft.maxTokens, copy);
    }

    if (Object.keys(params).length > 0) {
      requestMap[providerId] = params;
    }
  }

  return Object.keys(requestMap).length > 0 ? requestMap : undefined;
}

function parseTaskNumberInput(
  value: string,
  field: 'temperature' | 'top_p',
  copy: TaskEditorCopy,
): number {
  const parsedNumber = Number(value);
  if (!Number.isFinite(parsedNumber)) {
    throw new Error(field === 'temperature' ? copy.temperatureMustBeNumber : copy.topPMustBeNumber);
  }

  return parsedNumber;
}

function parseTaskIntegerInput(value: string, copy: TaskEditorCopy): number {
  const parsedNumber = Number(value);

  if (!Number.isInteger(parsedNumber)) {
    throw new Error(copy.maxTokensMustBeInteger);
  }

  return parsedNumber;
}

function isTaskDraftEmpty(draft: TaskDraft): boolean {
  return (
    draft.label.trim().length === 0 &&
    draft.systemPrompt.trim().length === 0 &&
    draft.userPrompt.trim().length === 0 &&
    Object.values(draft.providerRequestParams).every((requestDraft) => requestDraft == null || (
      requestDraft.temperature.trim().length === 0 &&
      requestDraft.topP.trim().length === 0 &&
      requestDraft.maxTokens.trim().length === 0
    )) &&
    draft.providerIds.length === 0
  );
}