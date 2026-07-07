import type { ExplainSelection } from '../../../../src/llm/types';
import type { TaskId } from '../../../shared/task-ids';
import type { PopoverTaskDescriptor } from '../events/PopoverEvents';

export interface IPopoverRepository {
  listTasks(): Promise<PopoverTaskDescriptor[]>;
  startTask(requestId: string, task: TaskId, selection: ExplainSelection): Promise<void>;
  cancelTask(requestId: string): Promise<void>;
}