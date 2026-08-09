import type {
  SystemTtsSourceDefinition,
  TtsSettingsV1,
  TtsSourceConfig,
  TtsSourceId,
} from '../../tts/events/TtsEvents';

export interface ISettingsTtsRepository {
  listSources(): SystemTtsSourceDefinition[];
  getSelection(): Promise<TtsSourceId>;
  setSelection(sourceId: TtsSourceId): Promise<void>;
  getSourceConfig(sourceId: TtsSourceId): Promise<TtsSourceConfig>;
  updateSourceConfig(sourceId: TtsSourceId, patch: Partial<TtsSourceConfig>): Promise<void>;
  setAzureApiKey(apiKey: string): Promise<void>;
  getAzureApiKey(): Promise<string | null>;
  watchSettings(callback: (settings: TtsSettingsV1) => void): () => void;
}
