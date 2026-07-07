import {
  SYSTEM_TASKS,
  type CustomTaskId,
  type CustomTaskRecord,
  type TaskProviderChainOverlayV1,
  type TaskRegistryOverlayV1,
} from '../../events/TaskRegistryEvents';
import { cloneTaskProviderRequestMap } from './taskRegistryValidation';

export function cloneTaskRegistryOverlay(overlay: TaskRegistryOverlayV1): TaskRegistryOverlayV1 {
  const systemOverrides: TaskRegistryOverlayV1['systemOverrides'] = {};
  for (const task of SYSTEM_TASKS) {
    const override = overlay.systemOverrides[task];
    if (!override) {
      continue;
    }

    systemOverrides[task] = {
      ...override,
      providerRequestParams: cloneTaskProviderRequestMap(override.providerRequestParams),
    };
  }

  const customTasks: TaskRegistryOverlayV1['customTasks'] = {};

  for (const [taskId, task] of Object.entries(overlay.customTasks) as [CustomTaskId, CustomTaskRecord | undefined][]) {
    if (!task) {
      continue;
    }

    customTasks[taskId] = {
      ...task,
      providerRequestParams: cloneTaskProviderRequestMap(task.providerRequestParams),
      providerIds: [...task.providerIds],
    };
  }

  return {
    ...overlay,
    systemOverrides,
    customTasks,
    disabledSystemTaskIds: [...overlay.disabledSystemTaskIds],
  };
}

export function cloneTaskProviderChainOverlay(taskChainOverlay: TaskProviderChainOverlayV1): TaskProviderChainOverlayV1 {
  const tasks: TaskProviderChainOverlayV1['tasks'] = {};

  for (const task of SYSTEM_TASKS) {
    const rule = taskChainOverlay.tasks[task];
    if (!rule) {
      continue;
    }

    tasks[task] = {
      ...rule,
      providerIds: [...rule.providerIds],
    };
  }

  return {
    ...taskChainOverlay,
    tasks,
  };
}