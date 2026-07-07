import type { ObservableSubscription } from '../../../shared/Observable';
import { OverviewPanelView } from './overview/OverviewPanelView';
import { ProviderPanelView } from './provider-editor/ProviderPanelView';
import { AdvancedRuntimeView } from './snapshot-runtime/AdvancedRuntimeView';
import { ThemeGalleryView } from './snapshot-runtime/ThemeGalleryView';
import { TaskPanelView } from './task-editor/TaskPanelView';
import { ADVANCED_PAGE_TEMPLATE } from './templates/advancedPageTemplate';
import { OVERVIEW_PAGE_TEMPLATE } from './templates/overviewPageTemplate';
import { PROMPTS_PAGE_TEMPLATE } from './templates/promptsPageTemplate';
import { PROVIDERS_PAGE_TEMPLATE } from './templates/providersPageTemplate';
import { THEMES_PAGE_TEMPLATE } from './templates/themesPageTemplate';
import type { SettingsViewModel } from '../viewmodels/SettingsViewModel';

export class SettingsView {
  private readonly container: HTMLElement;

  private readonly viewModel: SettingsViewModel;

  private unsubscribers: ObservableSubscription[] = [];

  private pageElements!: Record<string, HTMLElement>;

  private navButtons!: Record<string, HTMLButtonElement>;

  private overviewPanelView!: OverviewPanelView;

  private providerPanelView!: ProviderPanelView;

  private taskPanelView!: TaskPanelView;

  private themeGalleryView!: ThemeGalleryView;

  private advancedRuntimeView!: AdvancedRuntimeView;

  constructor(container: HTMLElement, viewModel: SettingsViewModel) {
    this.container = container;
    this.viewModel = viewModel;
    this.initStaticUI();
    this.cacheDOMNodes();
    this.bindEvents();
    this.subscribeToViewModel();
  }

  destroy() {
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers = [];
    this.container.replaceChildren();
  }

  private initStaticUI() {
    this.container.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar">
          <div class="sidebar-top">
            <div class="logo-orb">
              <img src="/icon/display-96.png" alt="查单词，用小猹" />
            </div>
            <div class="brand-lockup" aria-label="查单词，用小猹">
              <span class="brand-scan">Scan</span>
              <span class="brand-explain">Explain</span>
            </div>
            <span class="alpha-badge">4.1 Final</span>
          </div>

          <div class="sidebar-scroll">
            <section>
              <h2 class="sidebar-group-title" data-copy="settingsGroupTitle"></h2>
              <div class="nav-list" role="tablist" aria-label="Settings sections">
                <button class="nav-item is-active" type="button" data-tab="overview">
                  <span class="nav-main">
                    <span class="material-symbols-outlined">dashboard</span>
                    <span class="nav-label" data-copy="navOverview"></span>
                  </span>
                </button>
                <button class="nav-item" type="button" data-tab="providers">
                  <span class="nav-main">
                    <span class="material-symbols-outlined">cloud</span>
                    <span class="nav-label" data-copy="navProviders"></span>
                  </span>
                  <span class="mini-badge">2</span>
                </button>
                <button class="nav-item" type="button" data-tab="prompts">
                  <span class="nav-main">
                    <span class="material-symbols-outlined">chat</span>
                    <span class="nav-label" data-copy="navPrompts"></span>
                  </span>
                  <span class="mini-badge" id="nav-prompts-count">3</span>
                </button>
                <button class="nav-item" type="button" data-tab="themes">
                  <span class="nav-main">
                    <span class="material-symbols-outlined">palette</span>
                    <span class="nav-label" data-copy="navThemes"></span>
                  </span>
                  <span class="mini-badge">7</span>
                </button>
                <button class="nav-item" type="button" data-tab="advanced">
                  <span class="nav-main">
                    <span class="material-symbols-outlined">tune</span>
                    <span class="nav-label" data-copy="navAdvanced"></span>
                  </span>
                </button>
              </div>
            </section>

            <section>
              <h2 class="sidebar-group-title" data-copy="foundationsGroupTitle"></h2>
              <div class="support-list">
                <div class="support-link support-link-static">
                  <span class="support-main">
                    <span class="material-symbols-outlined">brush</span>
                    <span class="support-label" data-copy="foundationBaseline"></span>
                  </span>
                  <span class="mini-token">UI</span>
                </div>
                <div class="support-link support-link-static">
                  <span class="support-main">
                    <span class="material-symbols-outlined">schema</span>
                    <span class="support-label" data-copy="foundationSource"></span>
                  </span>
                  <span class="mini-token">Code</span>
                </div>
              </div>
            </section>
          </div>

          <div class="sidebar-footer" data-copy="sidebarFooter"></div>
        </aside>

        <main class="main-pane">
${OVERVIEW_PAGE_TEMPLATE}
${PROVIDERS_PAGE_TEMPLATE}
${PROMPTS_PAGE_TEMPLATE}
${THEMES_PAGE_TEMPLATE}
${ADVANCED_PAGE_TEMPLATE}
        </main>
      </div>
    `;
  }

  private cacheDOMNodes() {
    this.pageElements = {
      overview: this.requireElement('#page-overview'),
      providers: this.requireElement('#page-providers'),
      prompts: this.requireElement('#page-prompts'),
      themes: this.requireElement('#page-themes'),
      advanced: this.requireElement('#page-advanced'),
    };

    this.navButtons = {
      overview: this.requireElement('[data-tab="overview"]'),
      providers: this.requireElement('[data-tab="providers"]'),
      prompts: this.requireElement('[data-tab="prompts"]'),
      themes: this.requireElement('[data-tab="themes"]'),
      advanced: this.requireElement('[data-tab="advanced"]'),
    } as Record<string, HTMLButtonElement>;

    this.overviewPanelView = new OverviewPanelView(this.viewModel, {
      displayLanguageSelect: this.requireElement('#display-language-select'),
      outputLanguageSelect: this.requireElement('#output-language-select'),
      currentThemeChip: this.requireElement('#current-theme-chip'),
      jumpThemesButton: this.requireElement('#jump-themes-button'),
      metricGrid: this.requireElement('#metrics-grid'),
    });

    this.providerPanelView = new ProviderPanelView(this.viewModel, {
      searchInput: this.requireElement('#provider-search'),
      list: this.requireElement('#provider-list'),
      addButton: this.requireElement('#provider-add-button'),
      editorTitle: this.requireElement('#provider-editor-title'),
      editorSubtitle: this.requireElement('#provider-editor-subtitle'),
      editorBadge: this.requireElement('#provider-editor-badge'),
      fields: {
      label: this.requireElement('#provider-label'),
      model: this.requireElement('#provider-model'),
      endpoint: this.requireElement('#provider-endpoint'),
      apiKey: this.requireElement('#provider-api-key'),
      id: this.requireElement('#provider-id'),
      },
      idLabel: this.requireElement('#provider-id-label'),
      apiKeyHint: this.requireElement('#provider-api-key-hint'),
      feedback: this.requireElement('#provider-feedback'),
      utilityButton: this.requireElement('#provider-utility-button'),
      testButton: this.requireElement('#provider-test-button'),
      dangerButton: this.requireElement('#provider-danger-button'),
      saveButton: this.requireElement('#provider-save-button'),
    }, {
      confirmAction: (message) => this.confirmAction(message),
    });

    this.taskPanelView = new TaskPanelView(this.viewModel, {
      searchInput: this.requireElement('#task-search'),
      list: this.requireElement('#task-list'),
      addButton: this.requireElement('#task-add-button'),
      navCount: this.requireElement('#nav-prompts-count'),
      editorTitle: this.requireElement('#task-editor-title'),
      editorSubtitle: this.requireElement('#task-editor-subtitle'),
      editorBadge: this.requireElement('#task-editor-mode'),
      fields: {
        label: this.requireElement('#task-label'),
        mode: this.requireElement('#task-mode'),
        systemPrompt: this.requireElement('#task-system-prompt'),
        userPrompt: this.requireElement('#task-user-prompt'),
        providerOrder: this.requireElement('#task-provider-order'),
        providerOptions: this.requireElement('#task-provider-options'),
        providerTuning: this.requireElement('#task-provider-tuning'),
      },
      selectedProvidersLabel: this.requireElement('#task-selected-providers-label'),
      providerOptionsLabel: this.requireElement('#task-provider-options-label'),
      feedback: this.requireElement('#task-feedback'),
      dryRunTitle: this.requireElement('#task-dry-run-title'),
      dryRunStatus: this.requireElement('#task-dry-run-status'),
      dryRunProvider: this.requireElement('#task-dry-run-provider'),
      dryRunSampleLabel: this.requireElement('#task-dry-run-sample-label'),
      dryRunSample: this.requireElement('#task-dry-run-sample'),
      dryRunContextLabel: this.requireElement('#task-dry-run-context-label'),
      dryRunContext: this.requireElement('#task-dry-run-context'),
      dryRunOutputLabel: this.requireElement('#task-dry-run-output-label'),
      dryRunOutput: this.requireElement('#task-dry-run-output'),
      dryRunReasoningShell: this.requireElement('#task-dry-run-reasoning-shell'),
      dryRunReasoningLabel: this.requireElement('#task-dry-run-reasoning-label'),
      dryRunReasoning: this.requireElement('#task-dry-run-reasoning'),
      resetButton: this.requireElement('#task-reset-button'),
      dryRunButton: this.requireElement('#task-dry-run-button'),
      saveButton: this.requireElement('#task-save-button'),
    }, {
      confirmAction: (message) => this.confirmAction(message),
    });

    this.themeGalleryView = new ThemeGalleryView(this.viewModel, {
      preview: {
        left: this.requireElement('#theme-preview-left'),
        center: this.requireElement('#theme-preview-center'),
        right: this.requireElement('#theme-preview-right'),
      },
      grid: this.requireElement('#theme-grid'),
    });

    this.advancedRuntimeView = new AdvancedRuntimeView(this.viewModel, {
      requestTimeoutValue: this.requireElement('#request-timeout-value'),
      firstChunkTimeoutValue: this.requireElement('#first-chunk-timeout-value'),
      fallbackChain: this.requireElement('#advanced-fallback-chain'),
    });
  }

  private bindEvents() {
    Object.entries(this.navButtons).forEach(([tab, button]) => {
      button.addEventListener('click', () => this.viewModel.setActiveTab(tab as any));
    });

    this.overviewPanelView.bindEvents();
    this.providerPanelView.bindEvents();
    this.taskPanelView.bindEvents();
  }

  private subscribeToViewModel() {
    this.unsubscribers.push(this.viewModel.activeTab.subscribe((tab) => this.renderActiveTab(tab)));
    this.unsubscribers.push(this.viewModel.uiCopy.subscribe((copy) => {
      this.applyCopy(copy.settings);
      this.providerPanelView.renderEditor();
      this.taskPanelView.renderEditor();
      this.themeGalleryView.renderThemeGallery();
    }));
    this.unsubscribers.push(this.viewModel.displayLanguageOptions.subscribe((options) => this.overviewPanelView.renderDisplayLanguageOptions(options)));
    this.unsubscribers.push(this.viewModel.displayLanguagePreference.subscribe((preference) => {
      this.overviewPanelView.renderDisplayLanguagePreference(preference);
    }));
    this.unsubscribers.push(this.viewModel.outputLanguageOptions.subscribe((options) => this.overviewPanelView.renderOutputLanguageOptions(options)));
    this.unsubscribers.push(this.viewModel.outputLanguagePreference.subscribe((preference) => {
      this.overviewPanelView.renderOutputLanguagePreference(preference);
    }));
    this.unsubscribers.push(this.viewModel.isSavingOutputLanguage.subscribe((isSaving) => {
      this.overviewPanelView.renderOutputLanguageSaving(isSaving);
    }));
    this.unsubscribers.push(this.viewModel.snapshotRuntime.metrics.subscribe((metrics) => this.overviewPanelView.renderMetrics(metrics)));
    this.unsubscribers.push(this.viewModel.providerEditor.providers.subscribe(() => {
      this.providerPanelView.renderList();
      this.providerPanelView.renderEditor();
      this.taskPanelView.renderEditor();
    }));
    this.unsubscribers.push(this.viewModel.providerEditor.providerQuery.subscribe(() => this.providerPanelView.renderList()));
    this.unsubscribers.push(this.viewModel.providerEditor.selectedProviderId.subscribe(() => {
      this.providerPanelView.renderList();
      this.providerPanelView.renderEditor();
    }));
    this.unsubscribers.push(this.viewModel.providerEditor.providerEditorMode.subscribe(() => this.providerPanelView.renderEditor()));
    this.unsubscribers.push(this.viewModel.providerEditor.providerDraft.subscribe(() => this.providerPanelView.renderEditor()));
    this.unsubscribers.push(this.viewModel.providerEditor.isProviderDirty.subscribe(() => this.providerPanelView.renderEditor()));
    this.unsubscribers.push(this.viewModel.providerEditor.isSavingProvider.subscribe(() => this.providerPanelView.renderEditor()));
    this.unsubscribers.push(this.viewModel.providerEditor.providerFeedback.subscribe(() => this.providerPanelView.renderEditor()));
    this.unsubscribers.push(this.viewModel.taskEditor.tasks.subscribe(() => {
      this.taskPanelView.renderList();
      this.taskPanelView.renderEditor();
      this.providerPanelView.renderEditor();
    }));
    this.unsubscribers.push(this.viewModel.taskEditor.taskQuery.subscribe(() => this.taskPanelView.renderList()));
    this.unsubscribers.push(this.viewModel.taskEditor.selectedTaskId.subscribe(() => {
      this.taskPanelView.renderList();
      this.taskPanelView.renderEditor();
    }));
    this.unsubscribers.push(this.viewModel.taskEditor.taskDraft.subscribe(() => this.taskPanelView.renderEditor()));
    this.unsubscribers.push(this.viewModel.taskEditor.isTaskDirty.subscribe(() => this.taskPanelView.renderEditor()));
    this.unsubscribers.push(this.viewModel.taskEditor.isSavingTask.subscribe(() => this.taskPanelView.renderEditor()));
    this.unsubscribers.push(this.viewModel.taskEditor.taskFeedback.subscribe(() => this.taskPanelView.renderEditor()));
    this.unsubscribers.push(this.viewModel.taskDryRun.taskDryRunState.subscribe(() => this.taskPanelView.renderEditor()));
    this.unsubscribers.push(this.viewModel.snapshotRuntime.themes.subscribe(() => {
      this.themeGalleryView.renderThemeGallery();
    }));
    this.unsubscribers.push(this.viewModel.snapshotRuntime.selectedThemeId.subscribe(() => {
      this.themeGalleryView.renderThemeGallery();
    }));
    this.unsubscribers.push(this.viewModel.snapshotRuntime.currentThemeChipLabel.subscribe(() => this.overviewPanelView.renderCurrentThemeChip()));
    this.unsubscribers.push(this.viewModel.snapshotRuntime.advancedFallbackChain.subscribe(() => this.advancedRuntimeView.renderFallbackChain()));
    this.unsubscribers.push(this.viewModel.snapshotRuntime.requestTimeoutMs.subscribe((value) => {
      this.advancedRuntimeView.renderRequestTimeoutValue(value);
    }));
    this.unsubscribers.push(this.viewModel.snapshotRuntime.firstChunkTimeoutMs.subscribe((value) => {
      this.advancedRuntimeView.renderFirstChunkTimeoutValue(value);
    }));
  }

  private renderActiveTab(activeTab: string) {
    Object.entries(this.pageElements).forEach(([tab, page]) => {
      page.classList.toggle('is-active', tab === activeTab);
    });

    Object.entries(this.navButtons).forEach(([tab, button]) => {
      button.classList.toggle('is-active', tab === activeTab);
      button.setAttribute('aria-selected', String(tab === activeTab));
    });
  }

  private applyCopy(copy: Record<string, string>) {
    document.documentElement.lang = this.viewModel.resolvedLanguage.value;
    document.title = copy.pageTitle;

    this.container.querySelectorAll<HTMLElement>('[data-copy]').forEach((element) => {
      const key = element.dataset.copy;
      if (key && copy[key]) {
        element.textContent = copy[key];
      }
    });

    this.container.querySelectorAll<HTMLInputElement>('[data-copy-placeholder]').forEach((element) => {
      const key = element.dataset.copyPlaceholder;
      if (key && copy[key]) {
        element.placeholder = copy[key];
      }
    });
  }

  private confirmAction(message: string) {
    if (typeof globalThis.confirm !== 'function') {
      return true;
    }

    return globalThis.confirm(message);
  }

  private requireElement<T extends HTMLElement>(selector: string): T {
    const element = this.container.querySelector<T>(selector);
    if (!element) {
      throw new Error(`Missing element for selector: ${selector}`);
    }
    return element;
  }
}