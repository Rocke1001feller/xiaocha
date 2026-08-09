import type { TtsSourceId } from '../../../tts/events/TtsEvents';
import type { SettingsViewModel } from '../../viewmodels/SettingsViewModel';
import type { TtsVoiceOption } from './ttsPreviewRuntime';

export type TtsSourcesPanelRefs = {
  list: HTMLElement;
  editorTitle: HTMLElement;
  editorSubtitle: HTMLElement;
  editorBadge: HTMLElement;
  configNote: HTMLElement;
  browserFields: HTMLElement;
  voiceZhSelect: HTMLSelectElement;
  voiceEnSelect: HTMLSelectElement;
  azureFields: HTMLElement;
  azureApiKey: HTMLInputElement;
  azureApiKeyHint: HTMLElement;
  azureRegion: HTMLInputElement;
  azureVoiceZh: HTMLInputElement;
  azureVoiceEn: HTMLInputElement;
  feedback: HTMLElement;
  setDefaultButton: HTMLButtonElement;
  testButton: HTMLButtonElement;
  saveButton: HTMLButtonElement;
};

type TtsSourcesPanelHooks = {
  listVoices: () => TtsVoiceOption[];
  watchVoices: (callback: () => void) => () => void;
};

export class TtsSourcesPanelView {
  constructor(
    private readonly viewModel: SettingsViewModel,
    private readonly refs: TtsSourcesPanelRefs,
    private readonly hooks: TtsSourcesPanelHooks,
  ) {}

  bindEvents() {
    this.refs.voiceZhSelect.addEventListener('change', () => {
      this.viewModel.ttsSources.updateDraftField('voiceZh', this.refs.voiceZhSelect.value);
    });

    this.refs.voiceEnSelect.addEventListener('change', () => {
      this.viewModel.ttsSources.updateDraftField('voiceEn', this.refs.voiceEnSelect.value);
    });

    const azureFieldMap = {
      azureApiKey: 'azureApiKey',
      azureRegion: 'azureRegion',
      azureVoiceZh: 'azureVoiceZh',
      azureVoiceEn: 'azureVoiceEn',
    } as const;

    for (const [field, draftField] of Object.entries(azureFieldMap)) {
      this.refs[field as keyof typeof azureFieldMap].addEventListener('input', (event) => {
        this.viewModel.ttsSources.updateDraftField(draftField, (event.target as HTMLInputElement).value);
      });
    }

    this.refs.setDefaultButton.addEventListener('click', () => {
      void this.viewModel.ttsSources.setDefaultSource();
    });

    this.refs.testButton.addEventListener('click', () => {
      void this.viewModel.ttsSources.testAzureConnection();
    });

    this.refs.saveButton.addEventListener('click', () => {
      void this.viewModel.ttsSources.saveConfig();
    });

    this.hooks.watchVoices(() => this.renderEditor());
  }

  renderList() {
    const listState = this.viewModel.ttsSources.getListViewState();
    const isPreviewing = this.viewModel.ttsSources.isPreviewing.value;

    this.refs.list.innerHTML = listState.items
      .map(
        (source) => `
          <article class="data-list-item ${source.id === listState.selectedSourceId ? 'is-selected' : ''}" data-tts-source-id="${source.id}">
            <div class="list-icon tone-${source.tone}">
              <span class="material-symbols-outlined">${source.icon}</span>
            </div>
            <div class="list-copy">
              <strong>${source.label}</strong>
              <span>${source.summary}</span>
              <div class="list-tags">
                ${source.id === listState.defaultSourceId ? `<span class="mini-token">${listState.defaultBadge}</span>` : ''}
                ${source.tags.map((tag) => `<span class="mini-token">${tag}</span>`).join('')}
              </div>
            </div>
            <button class="pill-button tts-preview-button" type="button" data-tts-preview-id="${source.id}" ${isPreviewing ? 'disabled' : ''}>${listState.previewLabel}</button>
          </article>
        `,
      )
      .join('');

    this.refs.list.querySelectorAll<HTMLElement>('[data-tts-source-id]').forEach((element) => {
      element.addEventListener('click', () => {
        const sourceId = element.dataset.ttsSourceId;
        if (sourceId) {
          this.viewModel.ttsSources.selectSource(sourceId);
        }
      });
    });

    this.refs.list.querySelectorAll<HTMLButtonElement>('[data-tts-preview-id]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.viewModel.ttsSources.previewSource(button.dataset.ttsPreviewId as TtsSourceId);
      });
    });
  }

  renderEditor() {
    const state = this.viewModel.ttsSources.getEditorViewState();
    const feedback = this.viewModel.ttsSources.feedback.value;

    this.refs.editorTitle.textContent = state.title;
    this.refs.editorSubtitle.textContent = state.subtitle;
    this.refs.editorBadge.textContent = state.badge;
    this.refs.configNote.textContent = state.configNote;

    this.refs.browserFields.hidden = state.configKind !== 'browser-voices';
    this.refs.azureFields.hidden = state.configKind !== 'azure';

    if (state.configKind === 'browser-voices') {
      this.renderVoiceSelect(this.refs.voiceZhSelect, state.draft.voiceZh, 'zh', state.voiceLabels);
      this.renderVoiceSelect(this.refs.voiceEnSelect, state.draft.voiceEn, 'en', state.voiceLabels);
    }

    this.refs.azureApiKey.value = state.draft.azureApiKey;
    this.refs.azureApiKey.placeholder = state.azureApiKeyPlaceholder;
    this.refs.azureApiKeyHint.textContent = state.azureApiKeyHint;
    this.refs.azureRegion.value = state.draft.azureRegion;
    this.refs.azureVoiceZh.value = state.draft.azureVoiceZh;
    this.refs.azureVoiceEn.value = state.draft.azureVoiceEn;

    const disableInputs = state.isBusy;
    this.refs.voiceZhSelect.disabled = disableInputs;
    this.refs.voiceEnSelect.disabled = disableInputs;
    this.refs.azureApiKey.disabled = disableInputs;
    this.refs.azureRegion.disabled = disableInputs;
    this.refs.azureVoiceZh.disabled = disableInputs;
    this.refs.azureVoiceEn.disabled = disableInputs;

    this.refs.setDefaultButton.disabled = !state.canSetDefault;
    this.refs.testButton.hidden = state.configKind !== 'azure';
    this.refs.testButton.disabled = state.isBusy;
    this.refs.saveButton.disabled = !state.canSave;

    this.refs.feedback.hidden = feedback == null;
    this.refs.feedback.textContent = feedback?.text ?? '';
    this.refs.feedback.dataset.tone = feedback?.tone ?? '';
  }

  private renderVoiceSelect(
    select: HTMLSelectElement,
    selectedVoice: string,
    langPrefix: 'zh' | 'en',
    labels: { systemDefault: string; local: string; online: string },
  ) {
    const voices = this.hooks
      .listVoices()
      .filter((voice) => voice.lang.toLowerCase().startsWith(langPrefix));

    const options = [
      `<option value="">${labels.systemDefault}</option>`,
      ...voices.map(
        (voice) =>
          `<option value="${voice.name}">${voice.name}（${voice.local ? labels.local : labels.online}）</option>`,
      ),
    ];

    if (selectedVoice && !voices.some((voice) => voice.name === selectedVoice)) {
      options.push(`<option value="${selectedVoice}">${selectedVoice}</option>`);
    }

    select.innerHTML = options.join('');
    select.value = selectedVoice;
  }
}
