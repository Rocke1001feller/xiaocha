import type { TaskId } from '../../../shared/task-ids';

import type { IProviderRuntimeResolver } from '../interfaces/IProviderRuntimeResolver';
import type {
  ProviderId,
  ProviderRegistryRecord,
  ProviderViewRecord,
  ResolvedProvider,
  ResolvedTaskRuntimeConfig,
} from '../events/ProviderRegistryEvents';
import { ProviderRegistryService } from './ProviderRegistryService';
import { TaskRegistryService } from '../../task-registry/services/TaskRegistryService';
import { createRegistryServiceBundle } from '../../task-registry/services/createRegistryServiceBundle';

export class ProviderRuntimeResolver implements IProviderRuntimeResolver {
  private readonly providerRegistryService: ProviderRegistryService;

  private readonly taskRegistryService: TaskRegistryService;

  constructor(
    providerRegistryService?: ProviderRegistryService,
    taskRegistryService?: TaskRegistryService,
  ) {
    const bundle = providerRegistryService && taskRegistryService ? null : createRegistryServiceBundle();

    this.providerRegistryService = providerRegistryService ?? bundle!.providerRegistryService;
    this.taskRegistryService = taskRegistryService ?? bundle!.taskRegistryService;
  }

  async getProviderById(id: ProviderId): Promise<ResolvedProvider | null> {
    const provider = await this.providerRegistryService.getProviderRecord(id);

    if (!provider || !this.isResolvedProvider(provider)) {
      return null;
    }

    return this.toResolvedProvider(provider);
  }

  async getProvidersForTask(task: TaskId): Promise<ResolvedProvider[]> {
    const taskRecord = await this.taskRegistryService.getTaskRecord(task);
    if (!taskRecord) {
      return [];
    }

    const providers = await Promise.all(
      taskRecord.providerChainIds.map(async (providerId) => this.providerRegistryService.getProviderRecord(providerId)),
    );

    return providers
      .filter((provider): provider is ProviderRegistryRecord => provider != null)
      .filter((provider): provider is ProviderRegistryRecord & { apiKey: string } => this.isResolvedProvider(provider))
      .map((provider) => this.toResolvedProvider(provider));
  }

  async getTaskRuntimeConfig<TTask extends TaskId>(task: TTask): Promise<ResolvedTaskRuntimeConfig<TTask>> {
    const taskRecord = await this.taskRegistryService.getTaskRecord(task);
    if (!taskRecord) {
      throw new Error(`Task "${task}" does not exist.`);
    }

    return {
      task,
      label: taskRecord.label,
      mode: taskRecord.mode,
      systemPrompt: taskRecord.systemPrompt,
      userPrompt: taskRecord.userPrompt,
      providerSystemPrompts: taskRecord.providerSystemPrompts,
      providerRequestParams: taskRecord.providerRequestParams,
      providers: await this.getProvidersForTask(task),
    };
  }

  async getRegistrySnapshot(): Promise<ProviderViewRecord[]> {
    return this.providerRegistryService.getProviderViews();
  }

  private isResolvedProvider(provider: ProviderRegistryRecord): provider is ProviderRegistryRecord & { apiKey: string } {
    return provider.status === 'active' && typeof provider.apiKey === 'string' && provider.apiKey.length > 0;
  }

  private toResolvedProvider(provider: ProviderRegistryRecord & { apiKey: string }): ResolvedProvider {
    return {
      id: provider.id,
      source: provider.source,
      label: provider.label,
      endpoint: provider.endpoint,
      apiKey: provider.apiKey,
      model: provider.model,
    };
  }
}