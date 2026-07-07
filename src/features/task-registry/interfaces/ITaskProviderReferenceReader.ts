import type { ProviderId } from '../../provider-registry/events/ProviderRegistryEvents';
import type { TaskId } from '../events/TaskRegistryEvents';

export interface ITaskProviderReferenceReader {
  getProviderReferenceTasks(providerId: ProviderId): Promise<TaskId[]>;

  assertTasksRetainExecutableProviders(
    activeProviderIds: readonly ProviderId[],
    executableProviderIds: readonly ProviderId[],
  ): Promise<void>;
}