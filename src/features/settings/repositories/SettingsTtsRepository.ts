import { TtsRegistryService } from '../../tts/services/TtsRegistryService';
import type {
  SystemTtsSourceDefinition,
  TtsSettingsV1,
  TtsSourceConfig,
  TtsSourceId,
} from '../../tts/events/TtsEvents';
import type { ISettingsTtsRepository } from '../interfaces/ISettingsTtsRepository';

export class SettingsTtsRepository implements ISettingsTtsRepository {
  private readonly ttsRegistryService: TtsRegistryService;

  constructor(ttsRegistryService?: TtsRegistryService) {
    this.ttsRegistryService = ttsRegistryService ?? new TtsRegistryService();
  }

  listSources(): SystemTtsSourceDefinition[] {
    return this.ttsRegistryService.listSources();
  }

  async getSelection(): Promise<TtsSourceId> {
    return this.ttsRegistryService.getSelection();
  }

  async setSelection(sourceId: TtsSourceId): Promise<void> {
    await this.ttsRegistryService.setSelection(sourceId);
  }

  async getSourceConfig(sourceId: TtsSourceId): Promise<TtsSourceConfig> {
    return this.ttsRegistryService.getSourceConfig(sourceId);
  }

  async updateSourceConfig(sourceId: TtsSourceId, patch: Partial<TtsSourceConfig>): Promise<void> {
    await this.ttsRegistryService.updateSourceConfig(sourceId, patch);
  }

  async setAzureApiKey(apiKey: string): Promise<void> {
    await this.ttsRegistryService.setAzureApiKey(apiKey);
  }

  async getAzureApiKey(): Promise<string | null> {
    return this.ttsRegistryService.getAzureApiKey();
  }

  watchSettings(callback: (settings: TtsSettingsV1) => void): () => void {
    return this.ttsRegistryService.watchSettings(callback);
  }
}
