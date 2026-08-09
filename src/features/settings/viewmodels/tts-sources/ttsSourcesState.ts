import type {
  SystemTtsSourceDefinition,
  TtsSourceConfig,
  TtsSourceId,
} from '../../../tts/events/TtsEvents';
import { createSettingsTtsSourceRecord, type SettingsTtsSourceRecord } from '../../events/SettingsEvents';
import type { TtsSourcesCopy } from './ttsSourcesCopy';
import type { TtsSourceDraft } from './ttsSourcesTypes';

export type TtsSourceConfigKind = 'none' | 'browser-voices' | 'azure';

export type TtsSourcesListViewState = {
  items: SettingsTtsSourceRecord[];
  selectedSourceId: TtsSourceId | null;
  defaultSourceId: TtsSourceId;
  defaultBadge: string;
  previewLabel: string;
};

export type TtsSourceEditorViewState = {
  selectedSource: SettingsTtsSourceRecord | null;
  draft: TtsSourceDraft;
  configKind: TtsSourceConfigKind;
  isDefault: boolean;
  isBusy: boolean;
  isDirty: boolean;
  title: string;
  subtitle: string;
  badge: string;
  configNote: string;
  azureApiKeyPlaceholder: string;
  azureApiKeyHint: string;
  voiceLabels: {
    systemDefault: string;
    local: string;
    online: string;
  };
  canSetDefault: boolean;
  canSave: boolean;
};

export function resolveTtsSourceConfigKind(sourceId: TtsSourceId): TtsSourceConfigKind {
  if (sourceId === 'browser-speech') {
    return 'browser-voices';
  }

  return sourceId === 'azure-speech' ? 'azure' : 'none';
}

export function createTtsSourceDraftFromConfig(config: TtsSourceConfig): TtsSourceDraft {
  return {
    voiceZh: config.voiceZh ?? '',
    voiceEn: config.voiceEn ?? '',
    azureApiKey: '',
    azureRegion: config.azureRegion ?? '',
    azureVoiceZh: config.azureVoiceZh ?? '',
    azureVoiceEn: config.azureVoiceEn ?? '',
  };
}

export function maskTtsApiKey(value: string | null): string {
  if (!value) {
    return '';
  }

  if (value.length <= 8) {
    return '••••••••';
  }

  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
}

export function buildTtsSourcesListViewState(input: {
  sources: readonly SystemTtsSourceDefinition[];
  selectedSourceId: TtsSourceId | null;
  defaultSourceId: TtsSourceId;
  copy: TtsSourcesCopy;
}): TtsSourcesListViewState {
  return {
    items: input.sources.map((source) =>
      createSettingsTtsSourceRecord(source, {
        label: input.copy.sourceLabel(source.id),
        summary: input.copy.sourceSummary(source.id),
      }),
    ),
    selectedSourceId: input.selectedSourceId,
    defaultSourceId: input.defaultSourceId,
    defaultBadge: input.copy.defaultBadge,
    previewLabel: input.copy.preview,
  };
}

export function buildTtsSourceEditorViewState(input: {
  sources: readonly SystemTtsSourceDefinition[];
  selectedSourceId: TtsSourceId | null;
  defaultSourceId: TtsSourceId;
  draft: TtsSourceDraft;
  isDirty: boolean;
  isSaving: boolean;
  isPreviewing: boolean;
  azureApiKeyMasked: string;
  copy: TtsSourcesCopy;
}): TtsSourceEditorViewState {
  const source = input.sources.find((item) => item.id === input.selectedSourceId) ?? null;
  const configKind = source ? resolveTtsSourceConfigKind(source.id) : 'none';
  const isDefault = source != null && source.id === input.defaultSourceId;
  const isBusy = input.isSaving || input.isPreviewing;
  const selectedSource = source
    ? createSettingsTtsSourceRecord(source, {
        label: input.copy.sourceLabel(source.id),
        summary: input.copy.sourceSummary(source.id),
      })
    : null;

  return {
    selectedSource,
    draft: input.draft,
    configKind,
    isDefault,
    isBusy,
    isDirty: input.isDirty,
    title: source ? input.copy.sourceLabel(source.id) : '',
    subtitle: source ? input.copy.sourceSummary(source.id) : '',
    badge: isDefault
      ? input.copy.defaultBadge
      : source?.requiresApiKey
        ? input.copy.byokTag
        : source?.isOnline
          ? input.copy.onlineTag
          : input.copy.offlineTag,
    configNote: source ? input.copy.sourceNote(source.id) : '',
    azureApiKeyPlaceholder: input.azureApiKeyMasked,
    azureApiKeyHint: input.copy.azureApiKeyHint,
    voiceLabels: {
      systemDefault: input.copy.systemDefaultVoice,
      local: input.copy.localVoiceTag,
      online: input.copy.onlineVoiceTag,
    },
    canSetDefault: source != null && !isDefault && !isBusy,
    canSave: source != null && configKind !== 'none' && input.isDirty && !isBusy,
  };
}
