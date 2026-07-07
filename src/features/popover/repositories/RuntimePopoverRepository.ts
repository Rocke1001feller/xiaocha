import type { ExplainSelection } from '../../../../src/llm/types';
import type { TaskId } from '../../../shared/task-ids';
import { POPOVER_CANCEL_TASK, POPOVER_START_TASK } from '../events/PopoverEvents';
import type { IPopoverRepository } from '../interfaces/IPopoverRepository';
import { createRegistryServiceBundle } from '../../task-registry/services/createRegistryServiceBundle';
import { toPopoverTaskDescriptor } from '../utils/popover-tasks';

export class RuntimePopoverRepository implements IPopoverRepository {
  private readonly taskRegistryService = createRegistryServiceBundle().taskRegistryService;

  async listTasks() {
    const tasks = await this.taskRegistryService.getTaskRecords();
    return tasks.map((task) => toPopoverTaskDescriptor(task));
  }

  async startTask(requestId: string, task: TaskId, selection: ExplainSelection): Promise<void> {
    await browser.runtime.sendMessage({
      kind: POPOVER_START_TASK,
      requestId,
      task,
      selection,
    });
  }

  async cancelTask(requestId: string): Promise<void> {
    await browser.runtime.sendMessage({
      kind: POPOVER_CANCEL_TASK,
      requestId,
    });
  }
}