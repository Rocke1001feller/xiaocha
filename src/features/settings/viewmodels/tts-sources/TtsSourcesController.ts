import { Observable } from '../../../../shared/Observable';
import {
  isTtsSourceId,
  type SystemTtsSourceDefinition,
  type TtsLang,
  type TtsSettingsV1,
  type TtsSourceConfig,
  type TtsSourceId,
} from '../../../tts/events/TtsEvents';
import type { ISettingsTtsRepository } from '../../interfaces/ISettingsTtsRepository';
import type { TtsSourcesCopy } from './ttsSourcesCopy';
import {
  buildTtsSourceEditorViewState,
  buildTtsSourcesListViewState,
  createTtsSourceDraftFromConfig,
  maskTtsApiKey,
  resolveTtsSourceConfigKind,
  type TtsSourceEditorViewState,
  type TtsSourcesListViewState,
} from './ttsSourcesState';
import {
  areTtsSourceDraftsEqual,
  cloneTtsSourceDraft,
  EMPTY_TTS_SOURCE_DRAFT,
  type TtsSourceDraft,
  type TtsSourcesFeedback,
} from './ttsSourcesTypes';

export type TtsPreviewRequest = {
  sourceId: TtsSourceId;
  text: string;
  lang: TtsLang;
  config: TtsSourceConfig;
};

type TtsSourcesHooks = {
  getCopy: () => TtsSourcesCopy;
  preview?: (request: TtsPreviewRequest) => Promise<void>;
};

export class TtsSourcesController {
  readonly sources = new Observable<SystemTtsSourceDefinition[]>([]);

  readonly selectedSourceId = new Observable<TtsSourceId | null>(null);

  readonly defaultSourceId = new Observable<TtsSourceId>('auto');

  readonly draft = new Observable<TtsSourceDraft>(cloneTtsSourceDraft(EMPTY_TTS_SOURCE_DRAFT));

  readonly isDirty = new Observable(false);

  readonly isSaving = new Observable(false);

  readonly isPreviewing = new Observable(false);

  readonly feedback = new Observable<TtsSourcesFeedback>(null);

  readonly azureApiKeyMasked = new Observable('');

  private baseline: TtsSourceDraft = cloneTtsSourceDraft(EMPTY_TTS_SOURCE_DRAFT);

  private settingsSnapshot: TtsSettingsV1 | null = null;

  private stopWatch: (() => void) | null = null;

  constructor(
    private readonly ttsRepository: ISettingsTtsRepository,
    private readonly hooks: TtsSourcesHooks,
  ) {}

  initialize() {
    this.sources.value = this.ttsRepository.listSources();
    this.stopWatch = this.ttsRepository.watchSettings((settings) => this.applySettings(settings));
  }

  dispose() {
    this.stopWatch?.();
    this.stopWatch = null;
  }

  selectSource(sourceId: string) {
    if (!isTtsSourceId(sourceId) || this.isPreviewing.value) {
      return;
    }

    this.feedback.value = null;
    this.selectedSourceId.value = sourceId;
    void this.syncDraft();
  }

  updateDraftField(field: keyof TtsSourceDraft, value: string) {
    this.feedback.value = null;
    const nextDraft: TtsSourceDraft = {
      ...this.draft.value,
      [field]: value,
    };
    this.draft.value = nextDraft;
    this.isDirty.value = !areTtsSourceDraftsEqual(nextDraft, this.baseline);
  }

  async saveConfig() {
    const sourceId = this.selectedSourceId.value;
    if (!sourceId || this.isSaving.value || this.isPreviewing.value) {
      return;
    }

    const configKind = resolveTtsSourceConfigKind(sourceId);
    if (configKind === 'none') {
      return;
    }

    const draft = cloneTtsSourceDraft(this.draft.value);
    this.isSaving.value = true;
    this.feedback.value = null;

    try {
      if (configKind === 'browser-voices') {
        await this.ttsRepository.updateSourceConfig(sourceId, {
          voiceZh: draft.voiceZh,
          voiceEn: draft.voiceEn,
        });
      } else {
        await this.ttsRepository.updateSourceConfig(sourceId, {
          azureRegion: draft.azureRegion,
          azureVoiceZh: draft.azureVoiceZh,
          azureVoiceEn: draft.azureVoiceEn,
        });
        if (draft.azureApiKey.trim()) {
          await this.ttsRepository.setAzureApiKey(draft.azureApiKey.trim());
        }
        this.azureApiKeyMasked.value = maskTtsApiKey(await this.ttsRepository.getAzureApiKey());
      }

      this.commitBaseline({
        ...draft,
        azureApiKey: '',
      });
      this.feedback.value = {
        tone: 'success',
        text: this.copy.configSaved,
      };
    } catch (error) {
      this.feedback.value = {
        tone: 'error',
        text: error instanceof Error ? error.message : this.copy.saveFailed,
      };
    } finally {
      this.isSaving.value = false;
    }
  }

  async setDefaultSource(sourceId?: TtsSourceId) {
    const target = sourceId ?? this.selectedSourceId.value;
    if (!target || this.isSaving.value || this.isPreviewing.value) {
      return;
    }

    this.feedback.value = null;

    try {
      await this.ttsRepository.setSelection(target);
      this.feedback.value = {
        tone: 'success',
        text: this.copy.defaultSaved,
      };
    } catch (error) {
      this.feedback.value = {
        tone: 'error',
        text: error instanceof Error ? error.message : this.copy.saveFailed,
      };
    }
  }

  async previewSource(sourceId?: TtsSourceId) {
    const target = sourceId ?? this.selectedSourceId.value;
    if (!target || this.isPreviewing.value) {
      return;
    }

    const preview = this.hooks.preview;
    if (!preview) {
      this.feedback.value = {
        tone: 'error',
        text: this.copy.previewUnavailable,
      };
      return;
    }

    this.isPreviewing.value = true;
    this.feedback.value = {
      tone: 'info',
      text: this.copy.previewing,
    };

    // The background synthesizes with the current selection, so swap it in for
    // the duration of the preview and restore it afterwards.
    const previousSelection = this.defaultSourceId.value;
    const swapSelection = target !== previousSelection;

    try {
      if (swapSelection) {
        await this.ttsRepository.setSelection(target);
      }

      await preview({
        sourceId: target,
        text: this.copy.previewSampleText,
        lang: this.copy.previewSampleLang,
        config: this.settingsSnapshot?.configs[target] ?? {},
      });
      this.feedback.value = null;
    } catch (error) {
      this.feedback.value = {
        tone: 'error',
        text: error instanceof Error ? error.message : this.copy.previewFailed,
      };
    } finally {
      if (swapSelection) {
        await this.ttsRepository.setSelection(previousSelection).catch(() => undefined);
      }
      this.isPreviewing.value = false;
    }
  }

  async testAzureConnection() {
    if (this.selectedSourceId.value !== 'azure-speech') {
      return;
    }

    await this.saveConfig();
    if (this.feedback.value?.tone === 'error') {
      return;
    }

    await this.previewSource('azure-speech');
  }

  getListViewState(): TtsSourcesListViewState {
    return buildTtsSourcesListViewState({
      sources: this.sources.value,
      selectedSourceId: this.selectedSourceId.value,
      defaultSourceId: this.defaultSourceId.value,
      copy: this.copy,
    });
  }

  getEditorViewState(): TtsSourceEditorViewState {
    return buildTtsSourceEditorViewState({
      sources: this.sources.value,
      selectedSourceId: this.selectedSourceId.value,
      defaultSourceId: this.defaultSourceId.value,
      draft: this.draft.value,
      isDirty: this.isDirty.value,
      isSaving: this.isSaving.value,
      isPreviewing: this.isPreviewing.value,
      azureApiKeyMasked: this.azureApiKeyMasked.value,
      copy: this.copy,
    });
  }

  private applySettings(settings: TtsSettingsV1) {
    this.settingsSnapshot = settings;
    this.defaultSourceId.value = settings.selectedSourceId;

    if (this.selectedSourceId.value == null) {
      this.selectedSourceId.value = settings.selectedSourceId;
      void this.syncDraft();
      return;
    }

    if (!this.isDirty.value) {
      void this.syncDraft();
    }
  }

  private async syncDraft() {
    const sourceId = this.selectedSourceId.value;
    if (!sourceId) {
      this.commitBaseline(cloneTtsSourceDraft(EMPTY_TTS_SOURCE_DRAFT));
      return;
    }

    const config = this.settingsSnapshot?.configs[sourceId] ?? {};
    if (sourceId === 'azure-speech') {
      const maskedKey = maskTtsApiKey(await this.ttsRepository.getAzureApiKey());
      if (this.selectedSourceId.value !== sourceId) {
        return;
      }
      this.azureApiKeyMasked.value = maskedKey;
    }

    this.commitBaseline(createTtsSourceDraftFromConfig(config));
  }

  private commitBaseline(draft: TtsSourceDraft) {
    this.baseline = cloneTtsSourceDraft(draft);
    this.draft.value = cloneTtsSourceDraft(draft);
    this.isDirty.value = false;
  }

  private get copy() {
    return this.hooks.getCopy();
  }
}
