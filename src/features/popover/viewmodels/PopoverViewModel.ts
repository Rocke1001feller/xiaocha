import type { ExplainSelection, ExplainTaskState } from '../../../../src/llm/types';
import type { TaskId } from '../../../shared/task-ids';
import {
  POPOVER_THEMES,
  type PopoverTaskDescriptor,
  type PopoverSelectionData,
  type PopoverStreamEvent,
  type PopoverThemeId,
  toExplainSelection,
} from '../events/PopoverEvents';
import type { IPopoverRepository } from '../interfaces/IPopoverRepository';
import { createDefaultPopoverTasks } from '../utils/popover-tasks';
import { Observable } from '../utils/Observable';

const EMPTY_TASK_STATE: ExplainTaskState = {
  status: 'idle',
  content: '',
  reasoning: '',
};

const DEFAULT_TASKS = createDefaultPopoverTasks();

function createRequestId(task: TaskId) {
  return `${task}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createTabTaskStates(tasks: readonly PopoverTaskDescriptor[]): Record<TaskId, ExplainTaskState> {
  const states = {} as Record<TaskId, ExplainTaskState>;

  for (const task of tasks) {
    if (task.kind === 'lexical') {
      continue;
    }

    states[task.id] = { ...EMPTY_TASK_STATE };
  }

  return states;
}

function getDefaultSelectedTab(tasks: readonly PopoverTaskDescriptor[]): TaskId | null {
  return tasks.find((task) => task.kind !== 'lexical')?.id ?? null;
}

function truncateTitle(text: string, maxLength = 28) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export class PopoverViewModel {
  readonly isOpen = new Observable(false);

  readonly title = new Observable('查单词，用小猹');

  readonly theme = new Observable<PopoverThemeId>('pro');

  readonly selection = new Observable<PopoverSelectionData | null>(null);

  readonly tasks = new Observable<PopoverTaskDescriptor[]>(DEFAULT_TASKS);

  readonly selectedTab = new Observable<TaskId | null>(getDefaultSelectedTab(DEFAULT_TASKS));

  readonly lexicalCollapsed = new Observable(false);

  readonly providerLabel = new Observable<string | null>(null);

  readonly lexicalState = new Observable<ExplainTaskState>({ ...EMPTY_TASK_STATE });

  readonly taskStates = new Observable<Record<TaskId, ExplainTaskState>>(createTabTaskStates(DEFAULT_TASKS));

  readonly errorMessage = new Observable<string | null>(null);

  private readonly repository: IPopoverRepository;

  private readonly requestIds = new Map<TaskId, string>();

  private readonly requestedTaskIds = new Set<TaskId>();

  constructor(repository: IPopoverRepository) {
    this.repository = repository;
  }

  openSelection(selection: PopoverSelectionData) {
    void this.resetAndStart(selection);
  }

  close() {
    void this.cancelActiveRequests();
    this.isOpen.value = false;
    this.selection.value = null;
  }

  cycleTheme() {
    const currentIndex = POPOVER_THEMES.findIndex((theme) => theme.id === this.theme.value);
    const nextTheme = POPOVER_THEMES[(currentIndex + 1) % POPOVER_THEMES.length];
    this.theme.value = nextTheme.id;
  }

  toggleLexicalCollapsed() {
    this.lexicalCollapsed.value = !this.lexicalCollapsed.value;
  }

  selectTab(tab: TaskId) {
    if (!this.getTabTasks().some((task) => task.id === tab)) {
      return;
    }

    this.selectedTab.value = tab;

    if (!this.requestedTaskIds.has(tab) && this.selection.value) {
      void this.startTask(tab, toExplainSelection(this.selection.value));
    }
  }

  getLexicalTask() {
    return this.tasks.value.find((task) => task.kind === 'lexical') ?? null;
  }

  getTabTasks() {
    return this.tasks.value.filter((task) => task.kind !== 'lexical');
  }

  getTaskState(taskId: TaskId): ExplainTaskState {
    if (taskId === 'lexical') {
      return this.lexicalState.value;
    }

    return this.taskStates.value[taskId] ?? { ...EMPTY_TASK_STATE };
  }

  handleStreamEvent(event: PopoverStreamEvent) {
    const activeRequestId = this.requestIds.get(event.task);
    if (!activeRequestId || activeRequestId !== event.requestId) {
      return;
    }

    switch (event.phase) {
      case 'started': {
        this.providerLabel.value = event.providerLabel;
        this.setTaskState(event.task, (current) => ({
          ...current,
          status: 'loading',
          providerLabel: event.providerLabel,
          errorMessage: undefined,
        }));
        return;
      }
      case 'chunk': {
        if (event.task === 'lexical') {
          return;
        }

        this.setTaskState(event.task, (current) => ({
          ...current,
          status: 'loading',
          content: `${current.content}${event.contentDelta ?? ''}`,
          reasoning: `${current.reasoning}${event.reasoningDelta ?? ''}`,
        }));
        return;
      }
      case 'completed': {
        this.providerLabel.value = event.result.providerLabel;
        this.setTaskState(event.task, () => ({
          status: 'success',
          providerLabel: event.result.providerLabel,
          content: event.result.content,
          reasoning: event.result.reasoning,
          lexical: event.result.lexical,
        }));

        if (event.task === this.selectedTab.value && event.result.content.trim()) {
          this.lexicalCollapsed.value = true;
        }
        return;
      }
      case 'failed': {
        const errorMessage = event.errorMessage || 'The explanation request failed.';
        this.errorMessage.value = errorMessage;
        this.setTaskState(event.task, (current) => ({
          ...current,
          status: 'error',
          errorMessage,
        }));
      }
    }
  }

  dispose() {
    this.isOpen.clear();
    this.title.clear();
    this.theme.clear();
    this.selection.clear();
    this.tasks.clear();
    this.selectedTab.clear();
    this.lexicalCollapsed.clear();
    this.providerLabel.clear();
    this.lexicalState.clear();
    this.taskStates.clear();
    this.errorMessage.clear();
  }

  private async resetAndStart(selection: PopoverSelectionData) {
    await this.cancelActiveRequests();

    const tasks = await this.loadTasks();
    const selectedTab = getDefaultSelectedTab(tasks);
    const lexicalTask = tasks.find((task) => task.kind === 'lexical') ?? null;

    this.selection.value = selection;
    this.tasks.value = tasks;
    this.title.value = truncateTitle(selection.text);
    this.selectedTab.value = selectedTab;
    this.providerLabel.value = null;
    this.errorMessage.value = null;
    this.lexicalCollapsed.value = false;
    this.lexicalState.value = { ...EMPTY_TASK_STATE };
    this.taskStates.value = createTabTaskStates(tasks);
    this.requestedTaskIds.clear();
    this.isOpen.value = true;

    const explainSelection = toExplainSelection(selection);
    const startupTasks: Promise<void>[] = [];

    if (lexicalTask) {
      startupTasks.push(this.startTask(lexicalTask.id, explainSelection));
    }

    if (selectedTab) {
      startupTasks.push(this.startTask(selectedTab, explainSelection));
    }

    await Promise.all(startupTasks);
  }

  private async startTask(task: TaskId, selection: ExplainSelection) {
    const requestId = createRequestId(task);
    this.requestIds.set(task, requestId);
    this.requestedTaskIds.add(task);
    this.setTaskState(task, () => ({
      ...EMPTY_TASK_STATE,
      status: 'loading',
    }));
    await this.repository.startTask(requestId, task, selection);
  }

  private async cancelActiveRequests() {
    const requestIds = [...this.requestIds.values()];
    this.requestIds.clear();
    await Promise.allSettled(requestIds.map((requestId) => this.repository.cancelTask(requestId)));
  }

  private async loadTasks() {
    try {
      const tasks = await this.repository.listTasks();
      const seenTaskIds = new Set<TaskId>();

      return tasks.filter((task) => {
        if (seenTaskIds.has(task.id)) {
          return false;
        }

        seenTaskIds.add(task.id);
        return true;
      });
    } catch {
      return DEFAULT_TASKS;
    }
  }

  private setTaskState(task: TaskId, updater: (current: ExplainTaskState) => ExplainTaskState) {
    if (task === 'lexical') {
      this.lexicalState.value = updater(this.lexicalState.value);
      return;
    }

    const currentStates = this.taskStates.value;
    const currentState = currentStates[task] ?? { ...EMPTY_TASK_STATE };
    this.taskStates.value = {
      ...currentStates,
      [task]: updater(currentState),
    };
  }
}