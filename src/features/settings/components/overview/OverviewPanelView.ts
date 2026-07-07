import type { SettingsViewModel } from '../../viewmodels/SettingsViewModel';

type OverviewMetric = {
  label: string;
  value: string;
  meta: string;
};

export type OverviewPanelViewRefs = {
  displayLanguageSelect: HTMLSelectElement;
  outputLanguageSelect: HTMLSelectElement;
  currentThemeChip: HTMLElement;
  jumpThemesButton: HTMLButtonElement;
  metricGrid: HTMLElement;
};

export class OverviewPanelView {
  constructor(
    private readonly viewModel: SettingsViewModel,
    private readonly refs: OverviewPanelViewRefs,
  ) {}

  bindEvents() {
    this.refs.displayLanguageSelect.addEventListener('change', () => {
      void this.viewModel.updateDisplayLanguagePreference(this.refs.displayLanguageSelect.value as any);
    });

    this.refs.outputLanguageSelect.addEventListener('change', () => {
      void this.viewModel.updateOutputLanguagePreference(this.refs.outputLanguageSelect.value as any);
    });

    this.refs.jumpThemesButton.addEventListener('click', () => {
      this.viewModel.jumpToTab('themes');
    });
  }

  renderDisplayLanguageOptions(options: readonly { id: string; label: string }[]) {
    this.refs.displayLanguageSelect.innerHTML = options
      .map((option) => `<option value="${option.id}">${option.label}</option>`)
      .join('');
    this.refs.displayLanguageSelect.value = this.viewModel.displayLanguagePreference.value;
  }

  renderDisplayLanguagePreference(preference: string) {
    this.refs.displayLanguageSelect.value = preference;
  }

  renderOutputLanguageOptions(options: readonly { id: string; label: string }[]) {
    this.refs.outputLanguageSelect.innerHTML = options
      .map((option) => `<option value="${option.id}">${option.label}</option>`)
      .join('');
    this.refs.outputLanguageSelect.value = this.viewModel.outputLanguagePreference.value;
  }

  renderOutputLanguagePreference(preference: string) {
    this.refs.outputLanguageSelect.value = preference;
  }

  renderOutputLanguageSaving(isSaving: boolean) {
    this.refs.outputLanguageSelect.disabled = isSaving;
  }

  renderMetrics(metrics: OverviewMetric[]) {
    this.refs.metricGrid.innerHTML = metrics
      .map(
        (metric) => `
          <article class="metric-card">
            <div class="metric-label">${metric.label}</div>
            <div class="metric-value">${metric.value}</div>
            <div class="metric-meta">${metric.meta}</div>
          </article>
        `,
      )
      .join('');
  }

  renderCurrentThemeChip() {
    this.refs.currentThemeChip.textContent = this.viewModel.snapshotRuntime.currentThemeChipLabel.value;
  }
}