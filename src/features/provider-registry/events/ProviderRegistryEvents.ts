import { PROVIDERS } from '../../../../src/llm/config';
import type { ProviderConfig, ProviderId as StaticProviderId } from '../../../../src/llm/config';
import type { ChatCompletionRequestParams } from '../../../../src/llm/provider-chat-transport';
import type { TaskId } from '../../../shared/task-ids';

export const SYSTEM_PROVIDERS = PROVIDERS;

export type SystemProviderId = StaticProviderId;

export type CustomProviderId = `custom:${string}`;

export type ProviderId = SystemProviderId | CustomProviderId;

export type ProviderSource = 'system' | 'user';

export type ProviderStatus = 'active' | 'disabled';

export type ProviderMutability = 'override-only' | 'full';

export type SystemProviderDefinition = {
  id: SystemProviderId;
  label: string;
  endpoint: string;
  apiKey: string;
  model: string;
};

export type SystemProviderOverride = {
  label?: string;
  endpoint?: string;
  model?: string;
  updatedAt: number;
};

export type CustomProviderRecord = {
  id: CustomProviderId;
  label: string;
  endpoint: string;
  model: string;
  status: ProviderStatus;
  createdAt: number;
  updatedAt: number;
};

export type ProviderSecretEntry = {
  apiKey: string;
  updatedAt: number;
};

export type ProviderRegistryOverlayV1 = {
  version: 1;
  customProviders: Record<CustomProviderId, CustomProviderRecord>;
  systemOverrides: Partial<Record<SystemProviderId, SystemProviderOverride>>;
  disabledSystemProviderIds: SystemProviderId[];
};

export type ProviderSecretStoreV1 = {
  version: 1;
  secrets: Partial<Record<ProviderId, ProviderSecretEntry>>;
};

export type ProviderRegistryRecord = {
  id: ProviderId;
  source: ProviderSource;
  status: ProviderStatus;
  mutability: ProviderMutability;
  label: string;
  endpoint: string;
  model: string;
  apiKey: string | null;
  hasSecret: boolean;
  secretMask: string | null;
  isRuntimeReachable: boolean;
  createdAt?: number;
  updatedAt: number;
};

export type ProviderViewRecord = Omit<ProviderRegistryRecord, 'apiKey'>;

export type ResolvedProvider = {
  id: ProviderId;
  source: ProviderSource;
  label: string;
  endpoint: string;
  apiKey: string;
  model: string;
};

export type ResolvedTaskRuntimeConfig<TTask extends TaskId = TaskId> = {
  task: TTask;
  label: string;
  mode: 'json' | 'markdown';
  systemPrompt: string;
  userPrompt: string;
  providerSystemPrompts?: Partial<Record<ProviderId, string>>;
  providerRequestParams?: Partial<Record<ProviderId, ChatCompletionRequestParams>>;
  providers: ResolvedProvider[];
};

export type CreateCustomProviderInput = {
  slug: string;
  label: string;
  endpoint: string;
  apiKey: string;
  model: string;
};

export type UpdateProviderInput = {
  id: ProviderId;
  label: string;
  endpoint: string;
  apiKey?: string | null;
  model: string;
};

export type TestProviderConnectionInput = {
  providerId: ProviderId | null;
  label: string;
  endpoint: string;
  apiKey?: string | null;
  model: string;
};

export type TestProviderConnectionResult = {
  providerId: ProviderId | null;
  providerLabel: string;
  content: string;
  reasoning: string;
};

export const PROVIDER_REGISTRY_OVERLAY_FALLBACK: ProviderRegistryOverlayV1 = {
  version: 1,
  customProviders: {},
  systemOverrides: {},
  disabledSystemProviderIds: [],
};

export const PROVIDER_SECRET_STORE_FALLBACK: ProviderSecretStoreV1 = {
  version: 1,
  secrets: {},
};

export function isCustomProviderId(providerId: ProviderId): providerId is CustomProviderId {
  return providerId.startsWith('custom:');
}

export function toCustomProviderId(slug: string): CustomProviderId {
  return `custom:${slug}`;
}

export function dedupeProviderIds(providerIds: readonly ProviderId[]): ProviderId[] {
  const uniqueProviderIds = new Set<ProviderId>();

  for (const providerId of providerIds) {
    uniqueProviderIds.add(providerId);
  }

  return [...uniqueProviderIds];
}

export function maskProviderSecret(secret: string | null | undefined): string | null {
  if (!secret) {
    return null;
  }

  if (secret.length <= 8) {
    return '••••••••';
  }

  return `${secret.slice(0, 4)}••••••••${secret.slice(-4)}`;
}

export function toProviderViewRecord(record: ProviderRegistryRecord): ProviderViewRecord {
  const { apiKey: _apiKey, ...viewRecord } = record;
  return viewRecord;
}