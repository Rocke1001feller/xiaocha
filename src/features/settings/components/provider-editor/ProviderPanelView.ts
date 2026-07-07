import type { SettingsViewModel } from '../../viewmodels/SettingsViewModel';

type ProviderDiscardAction = 'select' | 'create' | 'duplicate';

export type ProviderPanelRefs = {
  searchInput: HTMLInputElement;
  list: HTMLElement;
  addButton: HTMLButtonElement;
  editorTitle: HTMLElement;
  editorSubtitle: HTMLElement;
  editorBadge: HTMLElement;
  fields: {
    label: HTMLInputElement;
    model: HTMLInputElement;
    endpoint: HTMLInputElement;
    apiKey: HTMLInputElement;
    id: HTMLInputElement;
  };
  idLabel: HTMLLabelElement;
  apiKeyHint: HTMLElement;
  feedback: HTMLElement;
  utilityButton: HTMLButtonElement;
  testButton: HTMLButtonElement;
  dangerButton: HTMLButtonElement;
  saveButton: HTMLButtonElement;
};

type ProviderPanelHooks = {
  confirmAction: (message: string) => boolean;
};

export class ProviderPanelView {
  constructor(
    private readonly viewModel: SettingsViewModel,
    private readonly refs: ProviderPanelRefs,
    private readonly hooks: ProviderPanelHooks,
  ) {}

  bindEvents() {
    this.refs.searchInput.addEventListener('input', () => {
      this.viewModel.providerEditor.setProviderQuery(this.refs.searchInput.value);
    });

    this.refs.addButton.addEventListener('click', () => {
      if (!this.canProceedWithProviderDraftDiscard('create')) {
        return;
      }

      this.viewModel.providerEditor.beginCreateProvider();
    });

    const draftFieldMap = {
      label: 'label',
      model: 'model',
      endpoint: 'endpoint',
      apiKey: 'apiKey',
      id: 'slug',
    } as const;

    for (const [field, input] of Object.entries(this.refs.fields) as Array<
      [keyof ProviderPanelRefs['fields'], HTMLInputElement]
    >) {
      input.addEventListener('input', () => {
        this.viewModel.providerEditor.updateProviderDraftField(draftFieldMap[field], input.value);
      });
    }

    this.refs.utilityButton.addEventListener('click', () => {
      const editorState = this.viewModel.providerEditor.getProviderEditorViewState();
      const confirmMessage = editorState.utilityConfirmMessage;
      if (confirmMessage && !this.hooks.confirmAction(confirmMessage)) {
        return;
      }

      if (editorState.selectedProvider?.source === 'system') {
        void this.viewModel.providerEditor.resetSelectedSystemProvider();
        return;
      }

      if (!this.canProceedWithProviderDraftDiscard('duplicate')) {
        return;
      }

      this.viewModel.providerEditor.duplicateSelectedProvider();
    });

    this.refs.testButton.addEventListener('click', () => {
      void this.viewModel.providerEditor.toggleProviderConnectionTest();
    });

    this.refs.dangerButton.addEventListener('click', () => {
      const confirmMessage = this.viewModel.providerEditor.getProviderEditorViewState().dangerConfirmMessage;
      if (confirmMessage && !this.hooks.confirmAction(confirmMessage)) {
        return;
      }

      void this.viewModel.providerEditor.deleteOrDisableSelectedProvider();
    });

    this.refs.saveButton.addEventListener('click', () => {
      void this.viewModel.providerEditor.saveProvider();
    });
  }

  renderList() {
    const listState = this.viewModel.providerEditor.getProviderListViewState();
    this.refs.list.innerHTML = listState.items
      .map(
        (provider) => `
          <article class="data-list-item ${provider.id === listState.selectedProviderId ? 'is-selected' : ''}" data-provider-id="${provider.id}">
            <div class="list-icon tone-${provider.tone}">
              <span class="material-symbols-outlined">${provider.icon}</span>
            </div>
            <div class="list-copy">
              <strong>${provider.label}</strong>
              <span>${provider.summary}</span>
              <div class="list-tags">${provider.tags.map((tag) => `<span class="mini-token">${tag}</span>`).join('')}</div>
            </div>
          </article>
        `,
      )
      .join('');

    this.refs.list.querySelectorAll<HTMLElement>('[data-provider-id]').forEach((element) => {
      element.addEventListener('click', () => {
        if (listState.isConnectionTestRunning) {
          return;
        }

        const providerId = element.dataset.providerId ?? '';
        if (providerId === listState.selectedProviderId && !listState.isCreating) {
          return;
        }

        if (!this.canProceedWithProviderDraftDiscard('select')) {
          return;
        }

        this.viewModel.providerEditor.selectProvider(providerId);
      });
    });
  }

  renderEditor() {
    const state = this.viewModel.providerEditor.getProviderEditorViewState();
    const feedback = this.viewModel.providerEditor.providerFeedback.value;

    this.refs.editorTitle.textContent = state.title;
    this.refs.editorSubtitle.textContent = state.subtitle;
    this.refs.editorBadge.textContent = state.badge;

    this.refs.fields.label.value = state.draft.label;
    this.refs.fields.model.value = state.draft.model;
    this.refs.fields.endpoint.value = state.draft.endpoint;
    this.refs.fields.apiKey.value = state.draft.apiKey;
    this.refs.fields.apiKey.placeholder = state.apiKeyPlaceholder;
    this.refs.fields.id.value = state.idValue;

    this.refs.idLabel.textContent = state.idFieldLabel;
    this.refs.apiKeyHint.textContent = state.apiKeyHint;

    for (const [field, input] of Object.entries(this.refs.fields) as Array<
      [keyof ProviderPanelRefs['fields'], HTMLInputElement]
    >) {
      const isIdField = field === 'id';
      input.disabled = !state.hasEditorTarget || state.isBusy;
      input.readOnly = isIdField ? !state.isCreating : false;
    }

    this.refs.utilityButton.textContent = state.utilityActionLabel;
    this.refs.utilityButton.disabled = !state.canRunUtilityAction;
    this.refs.testButton.textContent = this.viewModel.providerEditor.getProviderTestActionLabel();
    this.refs.testButton.disabled = !state.canRunConnectionTest;
    this.refs.dangerButton.textContent = state.dangerActionLabel;
    this.refs.dangerButton.disabled = !state.canRunDangerAction;
    this.refs.saveButton.textContent = state.primaryActionLabel;
    this.refs.saveButton.disabled = !state.canSave;
    this.refs.addButton.disabled = state.isBusy;

    this.refs.feedback.hidden = feedback == null;
    this.refs.feedback.textContent = feedback?.text ?? '';
    this.refs.feedback.dataset.tone = feedback?.tone ?? '';
  }

  private canProceedWithProviderDraftDiscard(nextAction: ProviderDiscardAction) {
    const listState = this.viewModel.providerEditor.getProviderListViewState();
    if (!listState.hasUnsavedChanges) {
      return true;
    }

    return this.hooks.confirmAction(listState.discardMessages[nextAction]);
  }
}