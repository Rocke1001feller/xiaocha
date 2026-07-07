import type { ProviderRegistryOverlayV1, ProviderSecretStoreV1 } from '../../events/ProviderRegistryEvents';
import { providerRegistryOverlayStorage } from '../../storage/providerRegistryOverlay';
import { providerSecretsStorage } from '../../storage/providerSecrets';

export type ProviderRegistryStorageState = {
  registryOverlay: ProviderRegistryOverlayV1;
  secretStore: ProviderSecretStoreV1;
};

export async function loadProviderRegistryStorageState(): Promise<ProviderRegistryStorageState> {
  const [registryOverlay, secretStore] = await Promise.all([
    providerRegistryOverlayStorage.getValue(),
    providerSecretsStorage.getValue(),
  ]);

  return {
    registryOverlay,
    secretStore,
  };
}

export async function persistProviderRegistryStorageState(storageState: ProviderRegistryStorageState): Promise<void> {
  await Promise.all([
    providerRegistryOverlayStorage.setValue(storageState.registryOverlay),
    providerSecretsStorage.setValue(storageState.secretStore),
  ]);
}

export function cloneProviderRegistryStorageState(storageState: ProviderRegistryStorageState): ProviderRegistryStorageState {
  return {
    registryOverlay: {
      ...storageState.registryOverlay,
      customProviders: { ...storageState.registryOverlay.customProviders },
      systemOverrides: { ...storageState.registryOverlay.systemOverrides },
      disabledSystemProviderIds: [...storageState.registryOverlay.disabledSystemProviderIds],
    },
    secretStore: {
      ...storageState.secretStore,
      secrets: { ...storageState.secretStore.secrets },
    },
  };
}

export function watchProviderRegistryStorageState(callback: () => void): () => void {
  const unwatchRegistryOverlay = providerRegistryOverlayStorage.watch(callback);
  const unwatchSecrets = providerSecretsStorage.watch(callback);

  return () => {
    unwatchRegistryOverlay();
    unwatchSecrets();
  };
}