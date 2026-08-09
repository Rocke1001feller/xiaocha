import {
  DEFAULT_TTS_SOURCE_ID,
  isTtsSourceId,
  type TtsLang,
  type TtsSettingsV1,
  type TtsSourceConfig,
  type TtsSourceId,
} from '../../events/TtsEvents';

export const DEFAULT_AZURE_REGION = 'eastasia';
export const DEFAULT_AZURE_VOICE_ZH = 'zh-CN-XiaoxiaoNeural';
export const DEFAULT_AZURE_VOICE_EN = 'en-US-JennyNeural';

export function resolveSelectedSourceId(settings: TtsSettingsV1): TtsSourceId {
  return isTtsSourceId(settings.selectedSourceId) ? settings.selectedSourceId : DEFAULT_TTS_SOURCE_ID;
}

/**
 * 'auto' follows the network: google-translate while online, browser-speech otherwise.
 * Explicit selections are returned unchanged; runtime failures fall back separately.
 */
export function resolveTtsSourceId(selection: TtsSourceId, isOnline: boolean): Exclude<TtsSourceId, 'auto'> {
  if (selection !== 'auto') {
    return selection;
  }

  return isOnline ? 'google-translate' : 'browser-speech';
}

export function resolveBrowserVoiceName(config: TtsSourceConfig, lang: TtsLang): string | undefined {
  const voiceName = lang === 'zh' ? config.voiceZh : config.voiceEn;
  return voiceName?.trim() || undefined;
}

export function resolveAzureRegion(config: TtsSourceConfig): string {
  return config.azureRegion?.trim() || DEFAULT_AZURE_REGION;
}

export function resolveAzureVoiceName(config: TtsSourceConfig, lang: TtsLang): string {
  const voiceName = lang === 'zh' ? config.azureVoiceZh : config.azureVoiceEn;
  return voiceName?.trim() || (lang === 'zh' ? DEFAULT_AZURE_VOICE_ZH : DEFAULT_AZURE_VOICE_EN);
}

export function applySourceConfigPatch(
  settings: TtsSettingsV1,
  sourceId: TtsSourceId,
  patch: Partial<TtsSourceConfig>,
): TtsSettingsV1 {
  const nextConfig: TtsSourceConfig = {
    ...settings.configs[sourceId],
    ...patch,
  };

  return {
    ...settings,
    configs: {
      ...settings.configs,
      [sourceId]: nextConfig,
    },
  };
}
