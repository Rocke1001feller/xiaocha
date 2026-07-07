import type { TaskId } from '../../../shared/task-ids';

import type {
  ProviderId,
  ProviderViewRecord,
  ResolvedProvider,
  ResolvedTaskRuntimeConfig,
} from '../events/ProviderRegistryEvents';

export interface IProviderRuntimeResolver {
  getProviderById(id: ProviderId): Promise<ResolvedProvider | null>;
  getProvidersForTask(task: TaskId): Promise<ResolvedProvider[]>;
  getTaskRuntimeConfig<TTask extends TaskId>(task: TTask): Promise<ResolvedTaskRuntimeConfig<TTask>>;
  getRegistrySnapshot(): Promise<ProviderViewRecord[]>;
}