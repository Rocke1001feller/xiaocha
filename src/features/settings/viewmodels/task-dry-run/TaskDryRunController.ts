import type {
  ExplainSelection,
} from '../../../../../src/llm/types';
import { Observable } from '../../../../shared/Observable';
import type { ResolvedUiDisplayLanguage } from '../../../../shared/ui-language';
import { isCustomTaskId, type UpdateTaskInput } from '../../../task-registry/events/TaskRegistryEvents';
import type { SettingsTaskRecord } from '../../events/SettingsEvents';
import type { ISettingsTaskRepository } from '../../interfaces/ISettingsTaskRepository';
import { getTaskDryRunSample } from '../../repositories/taskDryRunSamples';
import type { TaskDraft, TaskEditorMode } from '../task-editor/taskEditorTypes';

export type TaskDryRunStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled';

export type TaskDryRunState = {
  status: TaskDryRunStatus;
  providerLabel: string;
  content: string;
  reasoning: string;
  errorMessage: string | null;
};

const EMPTY_TASK_DRY_RUN_STATE: TaskDryRunState = {
  status: 'idle',
  providerLabel: '',
  content: '',
  reasoning: '',
  errorMessage: null,
};

type TaskDryRunRequest = {
  selectedTask: SettingsTaskRecord;
  draft: TaskDraft;
  input: UpdateTaskInput;
};

type TaskDryRunHooks = {
  buildDryRunRequest: () => TaskDryRunRequest | null;
  getIsSavingTask: () => boolean;
  getResolvedLanguage: () => ResolvedUiDisplayLanguage;
  getSelectedTask: () => SettingsTaskRecord | null;
  getTaskEditorMode: () => TaskEditorMode;
};

export class TaskDryRunController {
  readonly taskDryRunState = new Observable<TaskDryRunState>({
    ...EMPTY_TASK_DRY_RUN_STATE,
  });

  private activeTaskDryRunController: AbortController | null = null;

  constructor(
    private readonly taskRepository: ISettingsTaskRepository,
    private readonly hooks: TaskDryRunHooks,
  ) {}

  dispose() {
    this.abortTaskDryRun(true);
  }

  getTaskDryRunActionLabel(): string {
    if (this.isTaskDryRunRunning()) {
      return this.resolvedLanguage === 'zh-CN' ? '取消测试' : 'Cancel Dry Run';
    }

    return this.resolvedLanguage === 'zh-CN' ? '真实测试' : 'Dry Run';
  }

  getTaskDryRunStatusLabel(): string {
    switch (this.taskDryRunState.value.status) {
      case 'running':
        return this.resolvedLanguage === 'zh-CN' ? '运行中' : 'Running';
      case 'success':
        return this.resolvedLanguage === 'zh-CN' ? '已完成' : 'Completed';
      case 'error':
        return this.resolvedLanguage === 'zh-CN' ? '失败' : 'Failed';
      case 'cancelled':
        return this.resolvedLanguage === 'zh-CN' ? '已取消' : 'Cancelled';
      default:
        return this.resolvedLanguage === 'zh-CN' ? '待运行' : 'Ready';
    }
  }

  getTaskDryRunSample(): ExplainSelection | null {
    const selectedTask = this.selectedTask;
    return selectedTask && !isCustomTaskId(selectedTask.id) ? getTaskDryRunSample(selectedTask.id) : null;
  }

  getTaskDryRunOutputValue(): string {
    const state = this.taskDryRunState.value;

    if (state.content.trim()) {
      return state.content;
    }

    if (state.status === 'error' || state.status === 'cancelled') {
      return state.errorMessage ?? '';
    }

    return '';
  }

  getTaskDryRunOutputPlaceholder(): string {
    switch (this.taskDryRunState.value.status) {
      case 'running':
        return this.resolvedLanguage === 'zh-CN'
          ? '正在流式接收真实 Provider 输出…'
          : 'Streaming the live provider response…';
      case 'success':
        return this.resolvedLanguage === 'zh-CN' ? '真实输出会显示在这里。' : 'The live output will appear here.';
      case 'error':
        return this.resolvedLanguage === 'zh-CN' ? '真实测试失败。' : 'The dry run failed.';
      case 'cancelled':
        return this.resolvedLanguage === 'zh-CN' ? '真实测试已取消。' : 'The dry run was cancelled.';
      default:
        return this.resolvedLanguage === 'zh-CN'
          ? '点击“真实测试”即可用内置样本验证当前草稿。'
          : 'Run a dry run to validate the current draft with the built-in sample.';
    }
  }

  getTaskDryRunReasoningPlaceholder(): string {
    if (this.taskDryRunState.value.status === 'running') {
      return this.resolvedLanguage === 'zh-CN'
        ? '如果 Provider 暴露 reasoning stream，会显示在这里。'
        : 'Reasoning appears here when the provider exposes it.';
    }

    return this.resolvedLanguage === 'zh-CN'
      ? '当前这次测试没有额外 reasoning 输出。'
      : 'No additional reasoning output was returned for this run.';
  }

  canRunTaskDryRun(): boolean {
    if (this.isTaskDryRunRunning()) {
      return true;
    }

    return !this.isSavingTask && this.selectedTask != null && this.selectedTask.source === 'system' && this.taskEditorMode !== 'create';
  }

  isTaskDryRunRunning(): boolean {
    return this.taskDryRunState.value.status === 'running';
  }

  async toggleTaskDryRun() {
    if (this.isTaskDryRunRunning()) {
      this.abortTaskDryRun(false);
      return;
    }

    const request = this.hooks.buildDryRunRequest();
    if (!request || request.selectedTask.source !== 'system' || this.taskEditorMode === 'create') {
      return;
    }

    const { draft, input } = request;
    const controller = new AbortController();

    this.abortTaskDryRun(true);
    this.activeTaskDryRunController = controller;
    this.taskDryRunState.value = {
      status: 'running',
      providerLabel: this.resolvedLanguage === 'zh-CN' ? '连接中…' : 'Connecting…',
      content: '',
      reasoning: '',
      errorMessage: null,
    };

    try {
      const result = await this.taskRepository.dryRunTask(input, controller.signal, {
        onStart: (providerLabel) => {
          if (this.activeTaskDryRunController !== controller) {
            return;
          }

          this.taskDryRunState.value = {
            ...this.taskDryRunState.value,
            providerLabel,
          };
        },
        onUpdate: (update) => {
          if (this.activeTaskDryRunController !== controller) {
            return;
          }

          this.taskDryRunState.value = {
            ...this.taskDryRunState.value,
            content: update.content ?? this.taskDryRunState.value.content,
            reasoning: update.reasoning ?? this.taskDryRunState.value.reasoning,
          };
        },
      });

      if (this.activeTaskDryRunController !== controller) {
        return;
      }

      this.taskDryRunState.value = {
        status: 'success',
        providerLabel: result.providerLabel,
        content: this.formatTaskDryRunContent(result.content, draft.mode),
        reasoning: result.reasoning,
        errorMessage: null,
      };
    } catch (error) {
      if (controller.signal.aborted) {
        if (this.activeTaskDryRunController === controller) {
          this.taskDryRunState.value = {
            ...this.taskDryRunState.value,
            status: 'cancelled',
            errorMessage: this.resolvedLanguage === 'zh-CN' ? '真实测试已取消。' : 'Dry run cancelled.',
          };
          this.activeTaskDryRunController = null;
        }

        return;
      }

      if (this.activeTaskDryRunController !== controller) {
        return;
      }

      this.taskDryRunState.value = {
        ...this.taskDryRunState.value,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unable to run the task dry run.',
      };
    } finally {
      if (this.activeTaskDryRunController === controller) {
        this.activeTaskDryRunController = null;
      }
    }
  }

  abortTaskDryRun(resetState: boolean) {
    this.activeTaskDryRunController?.abort();
    this.activeTaskDryRunController = null;

    if (resetState) {
      this.taskDryRunState.value = {
        ...EMPTY_TASK_DRY_RUN_STATE,
      };
      return;
    }

    this.taskDryRunState.value = {
      ...this.taskDryRunState.value,
      status: 'cancelled',
      errorMessage: this.resolvedLanguage === 'zh-CN' ? '真实测试已取消。' : 'Dry run cancelled.',
    };
  }

  private formatTaskDryRunContent(content: string, mode: TaskDraft['mode']): string {
    if (mode !== 'json') {
      return content;
    }

    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }

  private get isSavingTask() {
    return this.hooks.getIsSavingTask();
  }

  private get resolvedLanguage() {
    return this.hooks.getResolvedLanguage();
  }

  private get selectedTask() {
    return this.hooks.getSelectedTask();
  }

  private get taskEditorMode() {
    return this.hooks.getTaskEditorMode();
  }
}