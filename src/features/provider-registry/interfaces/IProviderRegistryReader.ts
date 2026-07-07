import type { ProviderViewRecord } from '../events/ProviderRegistryEvents';

export interface IProviderRegistryReader {
  getProviderViews(): Promise<ProviderViewRecord[]>;

  watchMergedProviders(callback: (providers: ProviderViewRecord[]) => void): () => void;
}