import type { TtsLang, TtsSourceId } from '../../../tts/events/TtsEvents';
import type { ResolvedUiDisplayLanguage } from '../../../../shared/ui-language';

export type TtsSourcesCopy = {
  defaultBadge: string;
  onlineTag: string;
  offlineTag: string;
  byokTag: string;
  preview: string;
  systemDefaultVoice: string;
  localVoiceTag: string;
  onlineVoiceTag: string;
  configSaved: string;
  defaultSaved: string;
  saveFailed: string;
  previewing: string;
  previewFailed: string;
  previewUnavailable: string;
  azureApiKeyHint: string;
  previewSampleText: string;
  previewSampleLang: TtsLang;
  sourceLabel: (sourceId: TtsSourceId) => string;
  sourceSummary: (sourceId: TtsSourceId) => string;
  sourceNote: (sourceId: TtsSourceId) => string;
};

type TtsSourceLocalizedCopy = {
  label: string;
  summary: string;
  note: string;
};

const TTS_SOURCE_COPY: Record<ResolvedUiDisplayLanguage, Record<TtsSourceId, TtsSourceLocalizedCopy>> = {
  'zh-CN': {
    auto: {
      label: '智能默认',
      summary: '有网时用 Google 翻译语音，断网自动切系统语音。',
      note: '跟随网络状态自动选择语音源，无需配置。',
    },
    'browser-speech': {
      label: '浏览器语音',
      summary: '离线可用，直接调用系统安装的语音。',
      note: '为中文和英文各选一个系统音色，留空则跟随系统默认；标注“本地”的音色可离线使用。',
    },
    'google-translate': {
      label: 'Google 翻译语音',
      summary: '在线合成，无需配置。',
      note: '无需配置，联网即可使用。',
    },
    'azure-speech': {
      label: 'Azure 语音',
      summary: '在线合成，音色更自然，需要自己的 API Key。',
      note: '密钥只保存在本机浏览器，仅由扩展后台用于语音合成。Region 与音色名留空则使用默认值。',
    },
  },
  en: {
    auto: {
      label: 'Smart Default',
      summary: 'Uses Google Translate voices online and falls back to system voices offline.',
      note: 'Follows your network status automatically. No setup needed.',
    },
    'browser-speech': {
      label: 'Browser Speech',
      summary: 'Works offline with the voices installed on your system.',
      note: 'Pick a system voice for Chinese and English. Leave blank to follow the system default; voices tagged "Local" work offline.',
    },
    'google-translate': {
      label: 'Google Translate',
      summary: 'Online synthesis with zero configuration.',
      note: 'No setup needed. Works whenever you are online.',
    },
    'azure-speech': {
      label: 'Azure Speech',
      summary: 'Natural online voices with your own API key.',
      note: 'The key stays in this browser and is only used by the extension background for synthesis. Leave Region and voice names blank to use defaults.',
    },
  },
};

const TTS_SOURCES_COPY: Record<ResolvedUiDisplayLanguage, Omit<TtsSourcesCopy, 'sourceLabel' | 'sourceSummary' | 'sourceNote'>> = {
  'zh-CN': {
    defaultBadge: '默认',
    onlineTag: '在线',
    offlineTag: '离线',
    byokTag: '需密钥',
    preview: '试听',
    systemDefaultVoice: '跟随系统默认',
    localVoiceTag: '本地',
    onlineVoiceTag: '在线',
    configSaved: '语音配置已保存。',
    defaultSaved: '默认语音源已更新。',
    saveFailed: '语音配置保存失败。',
    previewing: '正在合成试听…',
    previewFailed: '试听失败。',
    previewUnavailable: '当前环境不支持试听。',
    azureApiKeyHint: '留空表示保留当前密钥。',
    previewSampleText: '你好，我是小猹，这是一段语音试听。',
    previewSampleLang: 'zh',
  },
  en: {
    defaultBadge: 'Default',
    onlineTag: 'Online',
    offlineTag: 'Offline',
    byokTag: 'Key required',
    preview: 'Preview',
    systemDefaultVoice: 'Follow system default',
    localVoiceTag: 'Local',
    onlineVoiceTag: 'Online',
    configSaved: 'Voice settings saved.',
    defaultSaved: 'Default voice source updated.',
    saveFailed: 'Failed to save voice settings.',
    previewing: 'Synthesizing preview…',
    previewFailed: 'Preview failed.',
    previewUnavailable: 'Preview is not available in this environment.',
    azureApiKeyHint: 'Leave blank to keep the current key.',
    previewSampleText: 'Hello, this is Xiaocha speaking.',
    previewSampleLang: 'en',
  },
};

export function getTtsSourcesCopy(language: ResolvedUiDisplayLanguage): TtsSourcesCopy {
  const sources = TTS_SOURCE_COPY[language];
  return {
    ...TTS_SOURCES_COPY[language],
    sourceLabel: (sourceId) => sources[sourceId].label,
    sourceSummary: (sourceId) => sources[sourceId].summary,
    sourceNote: (sourceId) => sources[sourceId].note,
  };
}
