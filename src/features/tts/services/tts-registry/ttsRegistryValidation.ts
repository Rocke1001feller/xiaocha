import { SYSTEM_TTS_SOURCES, type TtsSourceId } from '../../events/TtsEvents';

export class TtsRegistryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TtsRegistryValidationError';
  }
}

export function assertTtsSourceExists(sourceId: TtsSourceId): void {
  if (!(sourceId in SYSTEM_TTS_SOURCES)) {
    throw new TtsRegistryValidationError(`TTS source "${sourceId}" does not exist.`);
  }
}

export function normalizeOptionalName(value: string | undefined, fieldLabel: string, maxLength = 120): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new TtsRegistryValidationError(`${fieldLabel} must be at most ${maxLength} characters.`);
  }

  return normalized || undefined;
}

export function normalizeAzureRegion(region: string | undefined): string | undefined {
  const normalized = normalizeOptionalName(region, 'Azure region', 40);
  if (normalized && !/^[a-z0-9-]+$/.test(normalized)) {
    throw new TtsRegistryValidationError('Azure region must use lowercase letters, numbers, or hyphens.');
  }

  return normalized;
}

export function normalizeAzureApiKey(apiKey: string): string {
  const normalized = apiKey.trim();
  if (normalized.length === 0) {
    throw new TtsRegistryValidationError('Azure API key must not be empty.');
  }

  return normalized;
}
