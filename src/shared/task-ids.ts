export const SYSTEM_TASK_IDS = ['lexical', 'etymology', 'information'] as const;

export type SystemTaskId = (typeof SYSTEM_TASK_IDS)[number];

export type CustomTaskId = `custom:${string}`;

export type TaskId = SystemTaskId | CustomTaskId;

export function isSystemTaskId(taskId: string): taskId is SystemTaskId {
  return SYSTEM_TASK_IDS.includes(taskId as SystemTaskId);
}

export function isCustomTaskId(taskId: TaskId): taskId is CustomTaskId {
  return taskId.startsWith('custom:');
}

export function toCustomTaskId(slug: string): CustomTaskId {
  return `custom:${slug}`;
}