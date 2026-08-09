import {
  SYSTEM_TTS_SOURCES,
  type SystemTtsSourceDefinition,
  type TtsSettingsV1,
  type TtsSourceConfig,
  type TtsSourceId,
} from '../events/TtsEvents';
import { applySourceConfigPatch, resolveSelectedSourceId } from './tts-registry/ttsRegistryModel';
import {
  loadTtsStorageState,
  persistTtsSecrets,
  persistTtsSettings,
  watchTtsStorageState,
} from './tts-registry/ttsRegistryState';
import {
  assertTtsSourceExists,
  normalizeAzureApiKey,
  normalizeAzureRegion,
  normalizeOptionalName,
} from './tts-registry/ttsRegistryValidation';

export class TtsRegistryService {
  listSources(): SystemTtsSourceDefinition[] {
    return Object.values(SYSTEM_TTS_SOURCES);
  }

  async getSelection(): Promise<TtsSourceId> {
    const { settings } = await loadTtsStorageState();
    return resolveSelectedSourceId(settings);
  }

  async setSelection(sourceId: TtsSourceId): Promise<void> {
    assertTtsSourceExists(sourceId);

    const { settings } = await loadTtsStorageState();
    await persistTtsSettings({
      ...settings,
      selectedSourceId: sourceId,
    });
  }

  async getSourceConfig(sourceId: TtsSourceId): Promise<TtsSourceConfig> {
    assertTtsSourceExists(sourceId);

    const { settings } = await loadTtsStorageState();
    return { ...settings.configs[sourceId] };
  }

  async updateSourceConfig(sourceId: TtsSourceId, patch: Partial<TtsSourceConfig>): Promise<void> {
    assertTtsSourceExists(sourceId);

    const normalizedPatch: Partial<TtsSourceConfig> = {
      voiceZh: normalizeOptionalName(patch.voiceZh, 'Chinese voice'),
      voiceEn: normalizeOptionalName(patch.voiceEn, 'English voice'),
      azureRegion: normalizeAzureRegion(patch.azureRegion),
      azureVoiceZh: normalizeOptionalName(patch.azureVoiceZh, 'Azure Chinese voice'),
      azureVoiceEn: normalizeOptionalName(patch.azureVoiceEn, 'Azure English voice'),
    };

    const { settings } = await loadTtsStorageState();
    await persistTtsSettings(applySourceConfigPatch(settings, sourceId, normalizedPatch));
  }

  async setAzureApiKey(apiKey: string | null): Promise<void> {
    const { secrets } = await loadTtsStorageState();
    if (apiKey === null) {
      const nextSecrets = { ...secrets };
      delete nextSecrets.azureApiKey;
      await persistTtsSecrets(nextSecrets);
      return;
    }

    await persistTtsSecrets({
      ...secrets,
      azureApiKey: normalizeAzureApiKey(apiKey),
    });
  }

  async getAzureApiKey(): Promise<string | null> {
    const { secrets } = await loadTtsStorageState();
    return secrets.azureApiKey ?? null;
  }

  watchSettings(callback: (settings: TtsSettingsV1) => void): () => void {
    let lastSnapshot: string | null = null;
    const emitChange = () => {
      void loadTtsStorageState().then(({ settings }) => {
        const snapshot = JSON.stringify(settings);
        if (snapshot === lastSnapshot) {
          return;
        }

        lastSnapshot = snapshot;
        callback(settings);
      });
    };

    return watchTtsStorageState(emitChange);
  }
}
