import { beforeEach, describe, expect, it } from 'vitest';

import {
  TTS_SECRETS_FALLBACK,
  TTS_SETTINGS_FALLBACK,
  type TtsSettingsV1,
} from '../../src/features/tts/events/TtsEvents';
import { TtsRegistryService } from '../../src/features/tts/services/TtsRegistryService';
import { ttsSecretsStorage } from '../../src/features/tts/storage/ttsSecrets';
import { ttsSettingsStorage } from '../../src/features/tts/storage/ttsSettings';

const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('TtsRegistryService', () => {
  beforeEach(async () => {
    await ttsSettingsStorage.setValue(TTS_SETTINGS_FALLBACK);
    await ttsSecretsStorage.setValue(TTS_SECRETS_FALLBACK);
  });

  it('lists all system sources with auto as the default selection', async () => {
    const service = new TtsRegistryService();

    expect(service.listSources().map((source) => source.id)).toEqual([
      'auto',
      'browser-speech',
      'google-translate',
      'azure-speech',
    ]);
    expect(await service.getSelection()).toBe('auto');
  });

  it('persists an explicit selection', async () => {
    const service = new TtsRegistryService();

    await service.setSelection('azure-speech');

    expect(await service.getSelection()).toBe('azure-speech');
  });

  it('updates per-source config without touching other sources', async () => {
    const service = new TtsRegistryService();

    await service.updateSourceConfig('browser-speech', { voiceZh: ' 婷婷 ', voiceEn: 'Samantha' });
    await service.updateSourceConfig('azure-speech', { azureRegion: 'japaneast' });

    expect(await service.getSourceConfig('browser-speech')).toEqual({
      voiceZh: '婷婷',
      voiceEn: 'Samantha',
    });
    expect(await service.getSourceConfig('azure-speech')).toEqual({
      azureRegion: 'japaneast',
    });
  });

  it('rejects an invalid azure region', async () => {
    const service = new TtsRegistryService();

    await expect(service.updateSourceConfig('azure-speech', { azureRegion: 'East Asia!' })).rejects.toThrow(
      'Azure region',
    );
  });

  it('stores and clears the azure api key via the secrets item', async () => {
    const service = new TtsRegistryService();

    expect(await service.getAzureApiKey()).toBeNull();

    await service.setAzureApiKey('  test-key  ');
    expect(await service.getAzureApiKey()).toBe('test-key');

    await service.setAzureApiKey(null);
    expect(await service.getAzureApiKey()).toBeNull();

    await expect(service.setAzureApiKey('   ')).rejects.toThrow('Azure API key');
  });

  it('notifies watchSettings subscribers on selection changes', async () => {
    const service = new TtsRegistryService();
    const observed: TtsSettingsV1[] = [];

    const unwatch = service.watchSettings((settings) => observed.push(settings));
    await flushMicrotasks();

    await service.setSelection('google-translate');
    await flushMicrotasks();

    unwatch();

    expect(observed.map((settings) => settings.selectedSourceId)).toEqual(['auto', 'google-translate']);
  });
});
