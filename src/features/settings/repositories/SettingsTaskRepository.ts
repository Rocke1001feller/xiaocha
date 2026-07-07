import { runExplainTask } from '../../../../src/llm/client';
import { TaskRegistryService } from '../../task-registry/services/TaskRegistryService';
import { createRegistryServiceBundle } from '../../task-registry/services/createRegistryServiceBundle';
import type {
  ProviderId,
  ResolvedProvider,
  ResolvedTaskRuntimeConfig,
} from '../../provider-registry/events/ProviderRegistryEvents';
import {
  dedupeProviderIds,
} from '../../provider-registry/events/ProviderRegistryEvents';
import type { IProviderRuntimeResolver } from '../../provider-registry/interfaces/IProviderRuntimeResolver';
import { ProviderRuntimeResolver } from '../../provider-registry/services/ProviderRuntimeResolver';
import type {
  CreateCustomTaskInput,
  CustomTaskId,
  SystemTaskId,
  TaskId,
  TaskRegistryRecord,
  UpdateTaskInput,
} from '../../task-registry/events/TaskRegistryEvents';
import { isCustomTaskId } from '../../task-registry/events/TaskRegistryEvents';
import type {
  ISettingsTaskRepository,
  TaskDryRunCallbacks,
} from '../interfaces/ISettingsTaskRepository';
import { getTaskDryRunSample } from './taskDryRunSamples';

export class SettingsTaskRepository implements ISettingsTaskRepository {
  private readonly taskRegistryService: TaskRegistryService;

  private readonly providerRuntimeResolver: Pick<IProviderRuntimeResolver, 'getProviderById'>;

  constructor(
    taskRegistryService = createRegistryServiceBundle().taskRegistryService,
    providerRuntimeResolver: Pick<IProviderRuntimeResolver, 'getProviderById'> = new ProviderRuntimeResolver(),
  ) {
    this.taskRegistryService = taskRegistryService;
    this.providerRuntimeResolver = providerRuntimeResolver;
  }

  async listTasks(): Promise<TaskRegistryRecord[]> {
    return this.taskRegistryService.getTaskRecords();
  }

  async getTask(id: TaskId): Promise<TaskRegistryRecord | null> {
    return this.taskRegistryService.getTaskRecord(id);
  }

  async createCustomTask(input: CreateCustomTaskInput): Promise<CustomTaskId> {
    return this.taskRegistryService.createCustomTask(input);
  }

  async updateTask(input: UpdateTaskInput): Promise<void> {
    await this.taskRegistryService.updateTask(input);
  }

  async deleteCustomTask(id: CustomTaskId): Promise<void> {
    await this.taskRegistryService.deleteCustomTask(id);
  }

  async resetSystemTask(id: SystemTaskId): Promise<void> {
    await this.taskRegistryService.resetSystemTask(id);
  }

  async dryRunTask(
    input: UpdateTaskInput,
    signal: AbortSignal,
    callbacks: TaskDryRunCallbacks = {},
  ) {
    if (isCustomTaskId(input.id)) {
      throw new Error('Dry run is currently available for built-in tasks only.');
    }

    const [providers, existingTask] = await Promise.all([
      this.resolveDraftProviders(input),
      this.taskRegistryService.getTaskRecord(input.id),
    ]);
    const baseTaskConfig = {
      label: input.label,
      mode: input.mode,
      systemPrompt: input.systemPrompt,
      userPrompt: input.userPrompt,
      providerSystemPrompts: existingTask?.providerSystemPrompts,
      providerRequestParams: input.providerRequestParams,
      providers: [...providers],
    };
    const runtimeResolver: IProviderRuntimeResolver = {
      getProviderById: async (id) => providers.find((provider) => provider.id === id) ?? null,
      getProvidersForTask: async (task) => (task === input.id ? [...providers] : []),
      getTaskRuntimeConfig: async <TTask extends TaskId>(task: TTask): Promise<ResolvedTaskRuntimeConfig<TTask>> => {
        if (task !== input.id) {
          throw new Error(`Task dry run is only available for "${input.id}".`);
        }

        return {
          ...baseTaskConfig,
          task,
          providers: [...providers],
        };
      },
      getRegistrySnapshot: async () => [],
    };

    return runExplainTask(input.id, getTaskDryRunSample(input.id), signal, callbacks, runtimeResolver);
  }

  watchTasks(callback: (tasks: TaskRegistryRecord[]) => void): () => void {
    return this.taskRegistryService.watchTaskRecords(callback);
  }

  private async resolveDraftProviders(input: UpdateTaskInput): Promise<ResolvedProvider[]> {
    const effectiveProviderIds = dedupeProviderIds(input.providerIds);
    const resolvedProviders = await Promise.all(
      effectiveProviderIds.map(async (providerId) => this.providerRuntimeResolver.getProviderById(providerId)),
    );

    return resolvedProviders.filter((provider): provider is ResolvedProvider => provider != null);
  }
}