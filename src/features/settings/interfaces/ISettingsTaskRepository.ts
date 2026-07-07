import type {
  ExplainTask,
  ExplainTaskResult,
  StreamUpdate,
} from '../../../../src/llm/types';

import type {
  CreateCustomTaskInput,
  CustomTaskId,
  SystemTaskId,
  TaskId,
  TaskRegistryRecord,
  UpdateTaskInput,
} from '../../task-registry/events/TaskRegistryEvents';

export type TaskDryRunCallbacks = {
  onStart?: (providerLabel: string) => void;
  onUpdate?: (update: StreamUpdate) => void;
};

export interface ISettingsTaskRepository {
  listTasks(): Promise<TaskRegistryRecord[]>;
  getTask(id: TaskId): Promise<TaskRegistryRecord | null>;
  createCustomTask(input: CreateCustomTaskInput): Promise<CustomTaskId>;
  updateTask(input: UpdateTaskInput): Promise<void>;
  deleteCustomTask(id: CustomTaskId): Promise<void>;
  resetSystemTask(id: SystemTaskId): Promise<void>;
  dryRunTask(
    input: UpdateTaskInput,
    signal: AbortSignal,
    callbacks?: TaskDryRunCallbacks,
  ): Promise<ExplainTaskResult>;
  watchTasks(callback: (tasks: TaskRegistryRecord[]) => void): () => void;
}