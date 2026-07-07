import type { ResolvedUiDisplayLanguage } from '../../../../shared/ui-language';

type TaskDiscardAction = 'select' | 'create';

export type TaskEditorCopy = {
  taskCreated: string;
  taskSaved: string;
  customTaskDeleted: string;
  taskResetToDefaults: string;
  newTask: string;
  createSubtitle: string;
  customTask: string;
  systemTaskOverridden: string;
  systemTask: string;
  createTask: string;
  saveTask: string;
  cancel: string;
  deleteTask: string;
  resetToDefault: string;
  discardCurrentTaskDraft: string;
  temperatureMustBeNumber: string;
  topPMustBeNumber: string;
  maxTokensMustBeInteger: string;
  formatDiscardMessage: (nextAction: TaskDiscardAction) => string;
  formatDeleteCustomTaskConfirm: (taskLabel: string) => string;
  formatResetSystemTaskConfirm: (taskLabel: string) => string;
};

const TASK_EDITOR_COPY: Record<ResolvedUiDisplayLanguage, TaskEditorCopy> = {
  'zh-CN': {
    taskCreated: '任务已创建。',
    taskSaved: '任务已保存。',
    customTaskDeleted: '自定义任务已删除。',
    taskResetToDefaults: '任务已重置为默认值。',
    newTask: '新建任务',
    createSubtitle: '填写字段后即可保存到真实 Task Registry。',
    customTask: '自定义任务',
    systemTaskOverridden: '系统任务 · 已覆盖',
    systemTask: '系统任务',
    createTask: '创建任务',
    saveTask: '保存任务',
    cancel: '取消',
    deleteTask: '删除任务',
    resetToDefault: '重置默认值',
    discardCurrentTaskDraft: '确认放弃当前未保存的任务草稿吗？',
    temperatureMustBeNumber: 'Temperature 必须是数字。',
    topPMustBeNumber: 'Top P 必须是数字。',
    maxTokensMustBeInteger: 'Max Tokens 必须是整数。',
    formatDiscardMessage: (nextAction) =>
      nextAction === 'create'
        ? '当前任务编辑器里有未保存的改动，确认开始新建并丢弃这些改动吗？'
        : '当前任务编辑器里有未保存的改动，确认切换并丢弃这些改动吗？',
    formatDeleteCustomTaskConfirm: (taskLabel) => `确认删除自定义任务「${taskLabel}」吗？`,
    formatResetSystemTaskConfirm: (taskLabel) =>
      `确认把任务「${taskLabel}」重置为默认值吗？这会同时清除 Prompt 覆盖和 Provider Chain 覆盖。`,
  },
  en: {
    taskCreated: 'Task created.',
    taskSaved: 'Task saved.',
    customTaskDeleted: 'Custom task deleted.',
    taskResetToDefaults: 'Task reset to defaults.',
    newTask: 'New Task',
    createSubtitle: 'Fill in the fields to save into the live task registry.',
    customTask: 'Custom Task',
    systemTaskOverridden: 'System Task · Overridden',
    systemTask: 'System Task',
    createTask: 'Create Task',
    saveTask: 'Save Task',
    cancel: 'Cancel',
    deleteTask: 'Delete Task',
    resetToDefault: 'Reset to Default',
    discardCurrentTaskDraft: 'Discard the current unsaved task draft?',
    temperatureMustBeNumber: 'Temperature must be a number.',
    topPMustBeNumber: 'Top P must be a number.',
    maxTokensMustBeInteger: 'Max Tokens must be an integer.',
    formatDiscardMessage: (nextAction) =>
      nextAction === 'create'
        ? 'The task editor has unsaved changes. Start a new task draft and discard them?'
        : 'The task editor has unsaved changes. Switch tasks and discard them?',
    formatDeleteCustomTaskConfirm: (taskLabel) => `Delete the custom task "${taskLabel}"?`,
    formatResetSystemTaskConfirm: (taskLabel) =>
      `Reset the task "${taskLabel}" to defaults? This clears both prompt overrides and provider-chain overrides.`,
  },
};

export function getTaskEditorCopy(
  language: ResolvedUiDisplayLanguage,
): TaskEditorCopy {
  return TASK_EDITOR_COPY[language];
}