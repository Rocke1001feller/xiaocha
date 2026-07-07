import { Observable } from '../../../../shared/Observable';
import type { ProviderId } from '../../../provider-registry/events/ProviderRegistryEvents';
import {
  type CreateCustomTaskInput,
  type CustomTaskId,
  type SystemTaskId,
  type TaskProviderRequestMap,
  type TaskRequestParams,
  type UpdateTaskInput,
} from '../../../task-registry/events/TaskRegistryEvents';
import type {
  SettingsProviderRecord,
  SettingsTaskRecord,
} from '../../events/SettingsEvents';
import type { ISettingsTaskRepository } from '../../interfaces/ISettingsTaskRepository';
import type { SettingsSelectionState } from '../shell/SettingsSelectionState';
import {
  buildCreateTaskInput,
  buildTaskDraftFromRecord,
  buildTaskEditorViewState,
  buildTaskListViewState,
  buildUpdateTaskInput,
  createInitialTaskDraft,
  getSelectedTask,
  moveTaskProviderSelection,
  updateTaskProviderRequestDraft,
  updateTaskProviderSelection,
  type TaskDiscardAction,
  type TaskEditorViewState,
  type TaskListViewState,
} from './taskEditorState';
import {
  EMPTY_TASK_DRAFT,
  EMPTY_TASK_PROVIDER_REQUEST_DRAFT,
  areTaskDraftsEqual,
  cloneTaskDraft,
  type TaskDraft,
  type TaskEditorFeedback,
  type TaskEditorMode,
  type TaskProviderRequestDraft,
} from './taskEditorTypes';
import type { TaskEditorCopy } from './taskEditorCopy';

type TaskEditorHooks = {
  getProviders: () => SettingsProviderRecord[];
  getCopy: () => TaskEditorCopy;
};

export class TaskEditorController {
  readonly tasks = new Observable<SettingsTaskRecord[]>([]);

  readonly taskQuery = new Observable('');

  readonly selectedTaskId = new Observable<SettingsTaskRecord['id'] | null>(null);

  readonly taskEditorMode = new Observable<TaskEditorMode>('existing');

  readonly taskDraft = new Observable<TaskDraft>(cloneTaskDraft(EMPTY_TASK_DRAFT));

  readonly isTaskDirty = new Observable(false);

  readonly isSavingTask = new Observable(false);

  readonly taskFeedback = new Observable<TaskEditorFeedback>(null);

  private taskDraftBaseline: TaskDraft = cloneTaskDraft(EMPTY_TASK_DRAFT);

  private taskSelectionBeforeCreate: SettingsTaskRecord['id'] | null = null;

  constructor(
    private readonly taskRepository: ISettingsTaskRepository,
    private readonly hooks: TaskEditorHooks,
  ) {}

  applyTaskSnapshot(tasks: SettingsTaskRecord[], previousSelection?: SettingsSelectionState) {
    this.tasks.value = tasks;

    const stayInCreateMode = previousSelection?.taskEditorMode === 'create';
    const nextTaskId = previousSelection?.taskId ?? tasks[0]?.id ?? null;
    this.selectedTaskId.value = stayInCreateMode
      ? null
      : tasks.some((task) => task.id === nextTaskId)
        ? nextTaskId
        : tasks[0]?.id ?? null;

    if (stayInCreateMode) {
      this.taskEditorMode.value = 'create';
      this.applyTaskDraft({
        ...this.taskDraft.value,
      });
      return;
    }

    this.taskEditorMode.value = 'existing';
    const selectedTaskChanged = this.selectedTaskId.value !== previousSelection?.taskId;
    if (selectedTaskChanged || !this.isTaskDirty.value) {
      this.syncTaskDraftFromSelectedTask();
    }
  }

  setTaskQuery(query: string) {
    this.taskQuery.value = query;
  }

  beginCreateTask() {
    this.taskSelectionBeforeCreate = this.getSelectedTask()?.id ?? null;
    this.taskEditorMode.value = 'create';
    this.selectedTaskId.value = null;
    this.taskFeedback.value = null;
    this.commitTaskDraftBaseline(createInitialTaskDraft(this.getSelectedTask(), this.providers));
  }

  cancelTaskEditing() {
    this.taskFeedback.value = null;

    if (this.taskEditorMode.value === 'create') {
      this.taskEditorMode.value = 'existing';
      const fallbackTaskId = this.taskSelectionBeforeCreate ?? this.tasks.value[0]?.id ?? null;
      this.taskSelectionBeforeCreate = null;
      this.selectedTaskId.value = fallbackTaskId;
      this.syncTaskDraftFromSelectedTask();
      return;
    }

    this.syncTaskDraftFromSelectedTask();
  }

  selectTask(taskId: string) {
    const task = this.tasks.value.find((currentTask) => currentTask.id === taskId);
    if (!task) {
      return;
    }

    this.taskSelectionBeforeCreate = null;
    this.taskEditorMode.value = 'existing';
    this.selectedTaskId.value = task.id;
    this.taskFeedback.value = null;
    this.syncTaskDraftFromSelectedTask();
  }

  updateTaskDraftField(field: 'label' | 'systemPrompt' | 'userPrompt', value: string) {
    this.taskFeedback.value = null;
    this.applyTaskDraft({
      ...this.taskDraft.value,
      [field]: value,
    });
  }

  updateTaskDraftMode(mode: 'json' | 'markdown') {
    this.taskFeedback.value = null;
    this.applyTaskDraft({
      ...this.taskDraft.value,
      mode,
    });
  }

  toggleTaskProvider(providerId: ProviderId, checked: boolean) {
    this.taskFeedback.value = null;
    this.applyTaskDraft(updateTaskProviderSelection(this.taskDraft.value, providerId, checked));
  }

  updateTaskProviderRequestParam(
    providerId: ProviderId,
    field: keyof TaskProviderRequestDraft,
    value: string,
  ) {
    this.taskFeedback.value = null;
    this.applyTaskDraft(updateTaskProviderRequestDraft(this.taskDraft.value, providerId, field, value));
  }

  moveTaskProvider(providerId: ProviderId, direction: 'up' | 'down') {
    const nextDraft = moveTaskProviderSelection(this.taskDraft.value, providerId, direction);
    if (!nextDraft) {
      return;
    }

    this.taskFeedback.value = null;
    this.applyTaskDraft(nextDraft);
  }

  async saveTask() {
    const selectedTask = this.getSelectedTask();
    if (this.taskEditorMode.value !== 'create' && !selectedTask) {
      return;
    }

    const draft = cloneTaskDraft(this.taskDraft.value);
    this.isSavingTask.value = true;
    this.taskFeedback.value = null;

    try {
      if (this.taskEditorMode.value === 'create') {
        const createdTaskId = await this.taskRepository.createCustomTask(buildCreateTaskInput(draft, this.copy));
        this.taskEditorMode.value = 'existing';
        this.selectedTaskId.value = createdTaskId;
        this.taskSelectionBeforeCreate = null;
        this.commitTaskDraftBaseline(draft);
        this.taskFeedback.value = {
          tone: 'success',
          text: this.copy.taskCreated,
        };
        return;
      }

      if (!selectedTask) {
        return;
      }

      await this.taskRepository.updateTask(buildUpdateTaskInput(selectedTask, draft, this.copy));
      this.commitTaskDraftBaseline(draft);
      this.taskFeedback.value = {
        tone: 'success',
        text: this.copy.taskSaved,
      };
    } catch (error) {
      this.taskFeedback.value = {
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to save task.',
      };
    } finally {
      this.isSavingTask.value = false;
    }
  }

  async resetSelectedTask() {
    const selectedTask = this.getSelectedTask();
    if (this.taskEditorMode.value !== 'create' && !selectedTask) {
      return;
    }

    if (this.taskEditorMode.value === 'create') {
      this.cancelTaskEditing();
      return;
    }

    this.isSavingTask.value = true;
    this.taskFeedback.value = null;

    try {
      if (!selectedTask) {
        return;
      }

      if (selectedTask.source === 'user') {
        await this.taskRepository.deleteCustomTask(selectedTask.id as CustomTaskId);
        this.selectedTaskId.value = null;
        this.taskFeedback.value = {
          tone: 'success',
          text: this.copy.customTaskDeleted,
        };
        this.commitTaskDraftBaseline(cloneTaskDraft(EMPTY_TASK_DRAFT));
      } else {
        await this.taskRepository.resetSystemTask(selectedTask.id as SystemTaskId);
        this.taskFeedback.value = {
          tone: 'success',
          text: this.copy.taskResetToDefaults,
        };
      }
    } catch (error) {
      this.taskFeedback.value = {
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to reset task.',
      };
    } finally {
      this.isSavingTask.value = false;
    }
  }

  getSelectedTask(): SettingsTaskRecord | null {
    return getSelectedTask(this.tasks.value, this.selectedTaskId.value);
  }

  getTaskListViewState(): TaskListViewState {
    return buildTaskListViewState({
      tasks: this.tasks.value,
      selectedTaskId: this.selectedTaskId.value,
      query: this.taskQuery.value,
      mode: this.taskEditorMode.value,
      isDirty: this.isTaskDirty.value,
      draft: this.taskDraft.value,
      copy: this.copy,
    });
  }

  getTaskEditorViewState(): TaskEditorViewState {
    return buildTaskEditorViewState({
      tasks: this.tasks.value,
      selectedTaskId: this.selectedTaskId.value,
      mode: this.taskEditorMode.value,
      draft: this.taskDraft.value,
      isDirty: this.isTaskDirty.value,
      isSaving: this.isSavingTask.value,
      providers: this.providers,
      copy: this.copy,
    });
  }

  buildDryRunRequest(): { selectedTask: SettingsTaskRecord; draft: TaskDraft; input: UpdateTaskInput } | null {
    const selectedTask = this.getSelectedTask();
    if (!selectedTask) {
      return null;
    }

    const draft = cloneTaskDraft(this.taskDraft.value);
    return {
      selectedTask,
      draft,
      input: buildUpdateTaskInput(selectedTask, draft, this.copy),
    };
  }

  private syncTaskDraftFromSelectedTask() {
    const selectedTask = this.getSelectedTask();
    if (!selectedTask) {
      this.commitTaskDraftBaseline(cloneTaskDraft(EMPTY_TASK_DRAFT));
      return;
    }

    this.commitTaskDraftBaseline(buildTaskDraftFromRecord(selectedTask));
  }

  private commitTaskDraftBaseline(draft: TaskDraft) {
    this.taskDraftBaseline = cloneTaskDraft(draft);
    this.taskDraft.value = cloneTaskDraft(draft);
    this.isTaskDirty.value = false;
  }

  private isTaskDraftEmpty(draft: TaskDraft): boolean {
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

  private applyTaskDraft(draft: TaskDraft) {
    const nextDraft = cloneTaskDraft(draft);
    this.taskDraft.value = nextDraft;
    this.isTaskDirty.value = !areTaskDraftsEqual(nextDraft, this.taskDraftBaseline);
  }

  private get providers() {
    return this.hooks.getProviders();
  }

  private get copy() {
    return this.hooks.getCopy();
  }
}