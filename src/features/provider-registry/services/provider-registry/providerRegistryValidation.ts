import type { ProviderTransportTarget } from '../../../../../src/llm/provider-chat-transport';
import {
  SYSTEM_PROVIDERS,
  type ProviderRegistryRecord,
  type SystemProviderId,
  type TestProviderConnectionInput,
} from '../../events/ProviderRegistryEvents';

export class ProviderRegistryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderRegistryValidationError';
  }
}

export function assertSystemProviderExists(id: SystemProviderId): void {
  if (!(id in SYSTEM_PROVIDERS)) {
    throw new ProviderRegistryValidationError(`System provider "${id}" does not exist.`);
  }
}

export function getSystemProviderDefinition(id: SystemProviderId) {
  assertSystemProviderExists(id);
  return SYSTEM_PROVIDERS[id];
}

export function normalizeCustomProviderSlug(slug: string): string {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!/^[a-z0-9-_]{3,48}$/.test(normalizedSlug)) {
    throw new ProviderRegistryValidationError(
      'Custom provider slug must use 3-48 lowercase letters, numbers, hyphens, or underscores.',
    );
  }

  return normalizedSlug;
}

export function normalizeProviderLabel(label: string): string {
  const normalizedLabel = label.trim();

  if (normalizedLabel.length === 0 || normalizedLabel.length > 80) {
    throw new ProviderRegistryValidationError('Provider label must be between 1 and 80 characters.');
  }

  return normalizedLabel;
}

export function normalizeProviderEndpoint(endpoint: string): string {
  const normalizedEndpoint = endpoint.trim();
  let url: URL;

  try {
    url = new URL(normalizedEndpoint);
  } catch {
    throw new ProviderRegistryValidationError('Provider endpoint must be a valid HTTPS URL.');
  }

  if (url.protocol !== 'https:') {
    throw new ProviderRegistryValidationError('Provider endpoint must use HTTPS.');
  }

  return url.toString();
}

export function normalizeProviderModel(model: string): string {
  const normalizedModel = model.trim();

  if (normalizedModel.length === 0 || normalizedModel.length > 120) {
    throw new ProviderRegistryValidationError('Provider model must be between 1 and 120 characters.');
  }

  return normalizedModel;
}

export function normalizeRequiredApiKey(apiKey: string): string {
  const normalizedApiKey = apiKey.trim();

  if (normalizedApiKey.length === 0) {
    throw new ProviderRegistryValidationError('Provider API key cannot be empty.');
  }

  return normalizedApiKey;
}

export function resolveConnectionTestApiKey(
  draftApiKey: string | null | undefined,
  existingProvider: Pick<ProviderRegistryRecord, 'apiKey'> | null,
): string {
  if (typeof draftApiKey === 'string' && draftApiKey.trim().length > 0) {
    return normalizeRequiredApiKey(draftApiKey);
  }

  if (existingProvider?.apiKey) {
    return existingProvider.apiKey;
  }

  throw new ProviderRegistryValidationError('Provider API key cannot be empty.');
}

export function buildConnectionTestTarget(
  input: TestProviderConnectionInput,
  existingProvider: ProviderRegistryRecord | null,
): ProviderTransportTarget {
  if (input.providerId && !existingProvider) {
    throw new ProviderRegistryValidationError(`Provider "${input.providerId}" does not exist.`);
  }

  return {
    label: normalizeProviderLabel(input.label),
    endpoint: normalizeProviderEndpoint(input.endpoint),
    apiKey: resolveConnectionTestApiKey(input.apiKey, existingProvider),
    model: normalizeProviderModel(input.model),
  };
}