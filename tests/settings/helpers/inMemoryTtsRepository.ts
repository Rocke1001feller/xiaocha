import {
  SYSTEM_TTS_SOURCES,
  type SystemTtsSourceDefinition,
  type TtsSettingsV1,
  type TtsSourceConfig,
  type TtsSourceId,
} from '../../../src/features/tts/events/TtsEvents';
import type { ISettingsTtsRepository } from '../../../src/features/settings/interfaces/ISettingsTtsRepository';

export class InMemorySettingsTtsRepository implements ISettingsTtsRepository {
  private settings: TtsSettingsV1 = {
    version: 1,
    selectedSourceId: 'auto',
    configs: {},
  };

  private azureApiKey: string | null = null;

  private readonly watchers = new Set<(settings: TtsSettingsV1) => void>();

  listSources(): SystemTtsSourceDefinition[] {
    return Object.values(SYSTEM_TTS_SOURCES);
  }

  async getSelection(): Promise<TtsSourceId> {
    return this.settings.selectedSourceId;
  }

  async setSelection(sourceId: TtsSourceId): Promise<void> {
    this.settings = {
      ...this.settings,
      selectedSourceId: sourceId,
    };
    this.emit();
  }

  async getSourceConfig(sourceId: TtsSourceId): Promise<TtsSourceConfig> {
    return {
      ...this.settings.configs[sourceId],
    };
  }

  async updateSourceConfig(sourceId: TtsSourceId, patch: Partial<TtsSourceConfig>): Promise<void> {
    this.settings = {
      ...this.settings,
      configs: {
        ...this.settings.configs,
        [sourceId]: {
          ...this.settings.configs[sourceId],
          ...patch,
        },
      },
    };
    this.emit();
  }

  async setAzureApiKey(apiKey: string): Promise<void> {
    this.azureApiKey = apiKey;
  }

  async getAzureApiKey(): Promise<string | null> {
    return this.azureApiKey;
  }

  watchSettings(callback: (settings: TtsSettingsV1) => void): () => void {
    this.watchers.add(callback);
    callback(this.settings);
    return () => {
      this.watchers.delete(callback);
    };
  }

  private emit() {
    this.watchers.forEach((watcher) => watcher(this.settings));
  }
}
