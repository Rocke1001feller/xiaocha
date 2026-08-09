import type { PopoverSelectionData } from '../../popover/events/PopoverEvents';
import type { ExplainTaskResult } from '../../../llm/types';
import type { TaskId } from '../../../shared/task-ids';
import type { SavedCard, CardSection } from '../types';

export interface ICardLifecycleService {
  saveFromPopover(
    selection: PopoverSelectionData,
    taskResults: Partial<Record<TaskId, ExplainTaskResult<TaskId>>>,
  ): Promise<SavedCard>;

  retryTask(cardId: SavedCard['id'], taskId: TaskId): Promise<CardSection>;

  refreshCover(cardId: SavedCard['id']): Promise<SavedCard>;
}
