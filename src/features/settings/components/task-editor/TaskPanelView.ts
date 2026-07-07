import type { SettingsViewModel } from '../../viewmodels/SettingsViewModel';
import {
  type TaskDryRunRenderData,
  type TaskDryRunSectionRefs,
  renderTaskDryRunSection,
} from './taskDryRunSectionRenderer';
import { renderProviderOptions, renderProviderTuning, renderSelectedProviders } from './taskProviderSectionRenderer';

type TaskDiscardAction = 'select' | 'create';

export type TaskPanelRefs = {
  searchInput: HTMLInputElement;
  list: HTMLElement;
  addButton: HTMLButtonElement;
  navCount: HTMLElement;
  editorTitle: HTMLElement;
  editorSubtitle: HTMLElement;
  editorBadge: HTMLElement;
  fields: {
    label: HTMLInputElement;
    mode: HTMLSelectElement;
    systemPrompt: HTMLTextAreaElement;
    userPrompt: HTMLTextAreaElement;
    providerOrder: HTMLElement;
    providerOptions: HTMLElement;
    providerTuning: HTMLElement;
  };
  selectedProvidersLabel: HTMLElement;
  providerOptionsLabel: HTMLElement;
  feedback: HTMLElement;
  dryRunTitle: HTMLElement;
  dryRunStatus: HTMLElement;
  dryRunProvider: HTMLElement;
  dryRunSampleLabel: HTMLElement;
  dryRunSample: HTMLTextAreaElement;
  dryRunContextLabel: HTMLElement;
  dryRunContext: HTMLTextAreaElement;
  dryRunOutputLabel: HTMLElement;
  dryRunOutput: HTMLTextAreaElement;
  dryRunReasoningShell: HTMLElement;
  dryRunReasoningLabel: HTMLElement;
  dryRunReasoning: HTMLTextAreaElement;
  resetButton: HTMLButtonElement;
  dryRunButton: HTMLButtonElement;
  saveButton: HTMLButtonElement;
};

type TaskPanelHooks = {
  confirmAction: (message: string) => boolean;
};

export class TaskPanelView {
  constructor(
    private readonly viewModel: SettingsViewModel,
    private readonly refs: TaskPanelRefs,
    private readonly hooks: TaskPanelHooks,
  ) {}

  bindEvents() {
    this.refs.searchInput.addEventListener('input', () => {
      this.viewModel.taskEditor.setTaskQuery(this.refs.searchInput.value);
    });

    this.refs.addButton.addEventListener('click', () => {
      if (!this.canProceedWithTaskDraftDiscard('create')) {
        return;
      }

      this.viewModel.beginCreateTask();
    });

    this.refs.fields.label.addEventListener('input', () => {
      this.viewModel.taskEditor.updateTaskDraftField('label', this.refs.fields.label.value);
    });

    this.refs.fields.mode.addEventListener('change', () => {
      this.viewModel.taskEditor.updateTaskDraftMode(this.refs.fields.mode.value as 'json' | 'markdown');
    });

    this.refs.fields.systemPrompt.addEventListener('input', () => {
      this.viewModel.taskEditor.updateTaskDraftField('systemPrompt', this.refs.fields.systemPrompt.value);
    });

    this.refs.fields.userPrompt.addEventListener('input', () => {
      this.viewModel.taskEditor.updateTaskDraftField('userPrompt', this.refs.fields.userPrompt.value);
    });

    this.refs.fields.providerOrder.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const button = target.closest<HTMLButtonElement>('[data-provider-id][data-action]');
      if (!button) {
        return;
      }

      const providerId = button.dataset.providerId;
      const action = button.dataset.action;
      if (!providerId || !action) {
        return;
      }

      if (action === 'remove') {
        this.viewModel.taskEditor.toggleTaskProvider(providerId as any, false);
        return;
      }

      if (action === 'move-up' || action === 'move-down') {
        this.viewModel.taskEditor.moveTaskProvider(providerId as any, action === 'move-up' ? 'up' : 'down');
      }
    });

    this.refs.fields.providerOptions.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') {
        return;
      }

      const providerId = target.dataset.providerId;
      if (!providerId) {
        return;
      }

      this.viewModel.taskEditor.toggleTaskProvider(providerId as any, target.checked);
    });

    this.refs.fields.providerTuning.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      const providerId = target.dataset.providerId;
      const field = target.dataset.paramField;
      if (!providerId || !field) {
        return;
      }

      this.viewModel.taskEditor.updateTaskProviderRequestParam(providerId as any, field as any, target.value);
    });

    this.refs.resetButton.addEventListener('click', () => {
      const confirmMessage = this.viewModel.getTaskEditorViewState().resetConfirmMessage;
      if (confirmMessage && !this.hooks.confirmAction(confirmMessage)) {
        return;
      }

      void this.viewModel.resetSelectedTask();
    });

    this.refs.dryRunButton.addEventListener('click', () => {
      void this.viewModel.taskDryRun.toggleTaskDryRun();
    });

    this.refs.saveButton.addEventListener('click', () => {
      void this.viewModel.saveTask();
    });
  }

  renderList() {
    const listState = this.viewModel.taskEditor.getTaskListViewState();
    const isChinese = this.viewModel.resolvedLanguage.value === 'zh-CN';
    this.refs.navCount.textContent = String(listState.navCount);
    this.refs.list.innerHTML = listState.items
      .map(
        (task) => `
          <article class="data-list-item ${task.id === listState.selectedTaskId ? 'is-selected' : ''}" data-task-id="${task.id}">
            <div class="list-icon tone-${task.tone}">
              <span class="material-symbols-outlined">${task.icon}</span>
            </div>
            <div class="list-copy">
              <strong>${task.label}</strong>
              <span>${task.summary}</span>
              <div class="list-tags">
                <span class="mini-token ${task.mode === 'json' ? 'mode-json' : 'mode-markdown'}">${task.mode}</span>
                ${task.hasOverride ? `<span class="mini-token">${isChinese ? 'override' : 'override'}</span>` : ''}
                ${task.providers.map((provider) => `<span class="mini-token">${provider}</span>`).join('')}
              </div>
            </div>
          </article>
        `,
      )
      .join('');

    this.refs.list.querySelectorAll<HTMLElement>('[data-task-id]').forEach((element) => {
      element.addEventListener('click', () => {
        if (element.dataset.taskId === listState.selectedTaskId) {
          return;
        }

        if (!this.canProceedWithTaskDraftDiscard('select')) {
          return;
        }

        this.viewModel.selectTask(element.dataset.taskId ?? '');      });
    });
  }

  renderEditor() {
    const editorState = this.viewModel.getTaskEditorViewState();
    const isChinese = this.viewModel.resolvedLanguage.value === 'zh-CN';
    const feedback = this.viewModel.taskEditor.taskFeedback.value;
    const dryRun = this.viewModel.taskDryRun;

    this.refs.editorTitle.textContent = editorState.title;
    this.refs.editorSubtitle.textContent = editorState.subtitle;
    this.refs.editorBadge.textContent = editorState.badge;

    this.refs.fields.label.value = editorState.draft.label;
    this.refs.fields.mode.value = editorState.draft.mode;
    this.refs.fields.systemPrompt.value = editorState.draft.systemPrompt;
    this.refs.fields.userPrompt.value = editorState.draft.userPrompt;
    this.refs.selectedProvidersLabel.textContent = isChinese ? '后备 Provider 顺序' : 'Fallback Providers';
    this.refs.providerOptionsLabel.textContent = isChinese ? '添加 Provider' : 'Add Providers';

    this.refs.fields.label.disabled = !editorState.hasTask || editorState.isBusy;
    this.refs.fields.mode.disabled = !editorState.hasTask || editorState.isBusy;
    this.refs.fields.systemPrompt.disabled = !editorState.hasTask || editorState.isBusy;
    this.refs.fields.userPrompt.disabled = !editorState.hasTask || editorState.isBusy;

    renderSelectedProviders(this.refs.fields.providerOrder, editorState.selectedProviderItems, editorState.isBusy, isChinese);
    renderProviderOptions(this.refs.fields.providerOptions, editorState.providerOptions, editorState.isBusy, isChinese);
    renderProviderTuning(
      this.refs.fields.providerTuning,
      editorState.providerTuningItems,
      editorState.isBusy,
      isChinese,
      this.viewModel.uiCopy.value.settings,
    );

    this.refs.addButton.disabled = editorState.isBusy;
    this.refs.addButton.title = '';
    this.refs.resetButton.textContent = editorState.resetActionLabel;
    this.refs.resetButton.disabled = !editorState.canReset;
    this.refs.dryRunButton.textContent = dryRun.getTaskDryRunActionLabel();
    this.refs.dryRunButton.disabled = !dryRun.canRunTaskDryRun();
    this.refs.saveButton.textContent = editorState.primaryActionLabel;
    this.refs.saveButton.disabled = !editorState.canSave;

    this.refs.feedback.hidden = feedback == null;
    this.refs.feedback.textContent = feedback?.text ?? '';
    this.refs.feedback.dataset.tone = feedback?.tone ?? '';

    const dryRunRefs: TaskDryRunSectionRefs = {
      dryRunTitle: this.refs.dryRunTitle,
      dryRunStatus: this.refs.dryRunStatus,
      dryRunProvider: this.refs.dryRunProvider,
      dryRunSampleLabel: this.refs.dryRunSampleLabel,
      dryRunSample: this.refs.dryRunSample,
      dryRunContextLabel: this.refs.dryRunContextLabel,
      dryRunContext: this.refs.dryRunContext,
      dryRunOutputLabel: this.refs.dryRunOutputLabel,
      dryRunOutput: this.refs.dryRunOutput,
      dryRunReasoningShell: this.refs.dryRunReasoningShell,
      dryRunReasoningLabel: this.refs.dryRunReasoningLabel,
      dryRunReasoning: this.refs.dryRunReasoning,
    };
    const dryRunData: TaskDryRunRenderData = {
      state: dryRun.taskDryRunState.value,
      sample: dryRun.getTaskDryRunSample(),
      statusLabel: dryRun.getTaskDryRunStatusLabel(),
      outputValue: dryRun.getTaskDryRunOutputValue(),
      outputPlaceholder: dryRun.getTaskDryRunOutputPlaceholder(),
      reasoningPlaceholder: dryRun.getTaskDryRunReasoningPlaceholder(),
    };
    renderTaskDryRunSection(dryRunRefs, dryRunData, isChinese);
  }

  private canProceedWithTaskDraftDiscard(nextAction: TaskDiscardAction) {
    const listState = this.viewModel.taskEditor.getTaskListViewState();
    if (!listState.hasUnsavedChanges) {
      return true;
    }

    return this.hooks.confirmAction(listState.discardMessages[nextAction]);
  }
}