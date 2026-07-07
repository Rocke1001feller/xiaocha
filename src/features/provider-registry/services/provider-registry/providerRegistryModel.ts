import {
  SYSTEM_PROVIDERS,
  isCustomProviderId,
  maskProviderSecret,
  type ProviderId,
  type ProviderRegistryRecord,
  type ProviderSecretStoreV1,
  type SystemProviderId,
  type SystemProviderOverride,
} from '../../events/ProviderRegistryEvents';
import type { ProviderRegistryStorageState } from './providerRegistryState';
import { normalizeRequiredApiKey } from './providerRegistryValidation';

export function providerExists(providerId: ProviderId, storageState: ProviderRegistryStorageState): boolean {
  if (isCustomProviderId(providerId)) {
    return storageState.registryOverlay.customProviders[providerId] != null;
  }

  return providerId in SYSTEM_PROVIDERS;
}

export function buildMergedProviders(storageState: ProviderRegistryStorageState): Map<ProviderId, ProviderRegistryRecord> {
  const { registryOverlay, secretStore } = storageState;

  const mergedProviders = new Map<ProviderId, ProviderRegistryRecord>();

  for (const providerId of Object.keys(SYSTEM_PROVIDERS) as SystemProviderId[]) {
    const systemProvider = SYSTEM_PROVIDERS[providerId];
    const override = registryOverlay.systemOverrides[providerId];
    const secretEntry = secretStore.secrets[providerId];
    const resolvedApiKey = secretEntry?.apiKey ?? systemProvider.apiKey ?? null;

    mergedProviders.set(providerId, {
      id: providerId,
      source: 'system',
      status: registryOverlay.disabledSystemProviderIds.includes(providerId) ? 'disabled' : 'active',
      mutability: 'override-only',
      label: override?.label ?? systemProvider.label,
      endpoint: override?.endpoint ?? systemProvider.url,
      model: override?.model ?? systemProvider.model,
      apiKey: resolvedApiKey,
      hasSecret: Boolean(resolvedApiKey),
      secretMask: maskProviderSecret(resolvedApiKey),
      isRuntimeReachable: Boolean(resolvedApiKey),
      updatedAt: Math.max(override?.updatedAt ?? 0, secretEntry?.updatedAt ?? 0),
    });
  }

  for (const customProvider of Object.values(registryOverlay.customProviders)) {
    const secretEntry = secretStore.secrets[customProvider.id];
    const resolvedApiKey = secretEntry?.apiKey ?? null;

    mergedProviders.set(customProvider.id, {
      id: customProvider.id,
      source: 'user',
      status: customProvider.status,
      mutability: 'full',
      label: customProvider.label,
      endpoint: customProvider.endpoint,
      model: customProvider.model,
      apiKey: resolvedApiKey,
      hasSecret: Boolean(resolvedApiKey),
      secretMask: maskProviderSecret(resolvedApiKey),
      isRuntimeReachable: Boolean(resolvedApiKey) && customProvider.status === 'active',
      createdAt: customProvider.createdAt,
      updatedAt: Math.max(customProvider.updatedAt, secretEntry?.updatedAt ?? 0),
    });
  }

  for (const provider of mergedProviders.values()) {
    provider.isRuntimeReachable = isRuntimeProviderReady(provider);
  }

  return mergedProviders;
}

export function applyProviderSecretUpdate(
  secretStore: ProviderSecretStoreV1,
  providerId: ProviderId,
  apiKey: string | null | undefined,
  updatedAt: number,
  systemDefaultApiKey?: string,
): ProviderSecretStoreV1 {
  if (apiKey === undefined) {
    return secretStore;
  }

  const nextSecretStore: ProviderSecretStoreV1 = {
    ...secretStore,
    secrets: { ...secretStore.secrets },
  };

  if (apiKey === null) {
    delete nextSecretStore.secrets[providerId];
    return nextSecretStore;
  }

  const normalizedApiKey = normalizeRequiredApiKey(apiKey);
  if (systemDefaultApiKey && normalizedApiKey === systemDefaultApiKey) {
    delete nextSecretStore.secrets[providerId];
    return nextSecretStore;
  }

  nextSecretStore.secrets[providerId] = {
    apiKey: normalizedApiKey,
    updatedAt,
  };

  return nextSecretStore;
}

export function buildSystemProviderOverride(
  systemProvider: (typeof SYSTEM_PROVIDERS)[SystemProviderId],
  label: string,
  endpoint: string,
  model: string,
  updatedAt: number,
): SystemProviderOverride | null {
  const override: SystemProviderOverride = {
    updatedAt,
  };

  if (label !== systemProvider.label) {
    override.label = label;
  }

  if (endpoint !== systemProvider.url) {
    override.endpoint = endpoint;
  }

  if (model !== systemProvider.model) {
    override.model = model;
  }

  return Object.keys(override).length === 1 ? null : override;
}

export function isRuntimeProviderReady(
  provider: Pick<ProviderRegistryRecord, 'status' | 'apiKey' | 'model' | 'endpoint'>,
): boolean {
  if (provider.status !== 'active' || !provider.apiKey) {
    return false;
  }

  if (!provider.model.trim()) {
    return false;
  }

  try {
    const endpoint = new URL(provider.endpoint);
    return endpoint.protocol === 'https:';
  } catch {
    return false;
  }
}