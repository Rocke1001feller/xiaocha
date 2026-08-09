import type { ExplainSelection } from '../../../../src/llm/types';
import type { TaskId } from '../../../shared/task-ids';
import {
  EXTENSION_CONTEXT_INVALIDATED_MESSAGE,
  isExtensionContextInvalidatedError,
} from '../../../shared/extension-context';
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
    try {
      await browser.runtime.sendMessage({
        kind: POPOVER_START_TASK,
        requestId,
        task,
        selection,
      });
    } catch (error) {
      if (isExtensionContextInvalidatedError(error)) {
        throw new Error(EXTENSION_CONTEXT_INVALIDATED_MESSAGE);
      }
      throw error;
    }
  }

  async cancelTask(requestId: string): Promise<void> {
    try {
      await browser.runtime.sendMessage({
        kind: POPOVER_CANCEL_TASK,
        requestId,
      });
    } catch (error) {
      if (isExtensionContextInvalidatedError(error)) {
        throw new Error(EXTENSION_CONTEXT_INVALIDATED_MESSAGE);
      }
      throw error;
    }
  }
}