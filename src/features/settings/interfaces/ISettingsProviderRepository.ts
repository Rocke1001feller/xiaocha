import type {
  CreateCustomProviderInput,
  CustomProviderId,
  ProviderId,
  SystemProviderId,
  TestProviderConnectionInput,
  TestProviderConnectionResult,
  UpdateProviderInput,
} from '../../provider-registry/events/ProviderRegistryEvents';
import type { SettingsProviderRecord } from '../events/SettingsEvents';

export interface ISettingsProviderRepository {
  listProviders(): Promise<SettingsProviderRecord[]>;
  getProvider(id: ProviderId): Promise<SettingsProviderRecord | null>;
  createCustomProvider(input: CreateCustomProviderInput): Promise<CustomProviderId>;
  updateProvider(input: UpdateProviderInput): Promise<void>;
  disableProvider(id: ProviderId): Promise<void>;
  resetSystemProvider(id: SystemProviderId): Promise<void>;
  deleteCustomProvider(id: CustomProviderId): Promise<void>;
  testProviderConnection(input: TestProviderConnectionInput, signal: AbortSignal): Promise<TestProviderConnectionResult>;
  watchProviders(callback: (providers: SettingsProviderRecord[]) => void): () => void;
}