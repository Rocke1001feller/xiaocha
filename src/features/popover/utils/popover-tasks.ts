import { TASKS } from '../../../../src/llm/config';
import type { SystemTaskId } from '../../../shared/task-ids';
import { SYSTEM_TASK_IDS } from '../../../shared/task-ids';
import type { TaskRegistryRecord } from '../../task-registry/events/TaskRegistryEvents';
import type { PopoverTaskDescriptor } from '../events/PopoverEvents';

export function createDefaultPopoverTasks(): PopoverTaskDescriptor[] {
  return SYSTEM_TASK_IDS.map((taskId) => toDefaultPopoverTask(taskId));
}

export function toPopoverTaskDescriptor(task: Pick<TaskRegistryRecord, 'id' | 'label' | 'mode'>): PopoverTaskDescriptor {
  return {
    id: task.id,
    label: task.label,
    kind: task.id === 'lexical' ? 'lexical' : task.mode === 'json' ? 'json' : 'markdown',
  };
}

function toDefaultPopoverTask(taskId: SystemTaskId): PopoverTaskDescriptor {
  const task = TASKS[taskId];
  return {
    id: taskId,
    label: task.label,
    kind: taskId === 'lexical' ? 'lexical' : task.mode === 'json' ? 'json' : 'markdown',
  };
}