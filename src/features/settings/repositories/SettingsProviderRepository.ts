import { ProviderRegistryService } from '../../provider-registry/services/ProviderRegistryService';
import { createRegistryServiceBundle } from '../../task-registry/services/createRegistryServiceBundle';
import {
  createSettingsProviderRecord,
  type SettingsProviderRecord,
} from '../events/SettingsEvents';
import type { ISettingsProviderRepository } from '../interfaces/ISettingsProviderRepository';
import type {
  CreateCustomProviderInput,
  CustomProviderId,
  ProviderId,
  SystemProviderId,
  TestProviderConnectionInput,
  TestProviderConnectionResult,
  UpdateProviderInput,
} from '../../provider-registry/events/ProviderRegistryEvents';

export class SettingsProviderRepository implements ISettingsProviderRepository {
  private readonly providerRegistryService: ProviderRegistryService;

  constructor(providerRegistryService?: ProviderRegistryService) {
    this.providerRegistryService = providerRegistryService ?? createRegistryServiceBundle().providerRegistryService;
  }

  async listProviders(): Promise<SettingsProviderRecord[]> {
    const providers = await this.providerRegistryService.getProviderViews();
    return providers.map(createSettingsProviderRecord);
  }

  async getProvider(id: ProviderId): Promise<SettingsProviderRecord | null> {
    const provider = await this.providerRegistryService.getProviderRecord(id);
    return provider ? createSettingsProviderRecord(provider) : null;
  }

  async createCustomProvider(input: CreateCustomProviderInput): Promise<CustomProviderId> {
    return this.providerRegistryService.createCustomProvider(input);
  }

  async updateProvider(input: UpdateProviderInput): Promise<void> {
    await this.providerRegistryService.updateProvider(input);
  }

  async disableProvider(id: ProviderId): Promise<void> {
    await this.providerRegistryService.disableProvider(id);
  }

  async resetSystemProvider(id: SystemProviderId): Promise<void> {
    await this.providerRegistryService.resetSystemProvider(id);
  }

  async deleteCustomProvider(id: CustomProviderId): Promise<void> {
    await this.providerRegistryService.deleteCustomProvider(id);
  }

  async testProviderConnection(
    input: TestProviderConnectionInput,
    signal: AbortSignal,
  ): Promise<TestProviderConnectionResult> {
    return this.providerRegistryService.testProviderConnection(input, signal);
  }

  watchProviders(callback: (providers: SettingsProviderRecord[]) => void): () => void {
    return this.providerRegistryService.watchMergedProviders((providers) => {
      callback(providers.map(createSettingsProviderRecord));
    });
  }
}