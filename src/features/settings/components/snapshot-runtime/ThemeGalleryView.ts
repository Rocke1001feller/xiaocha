import type { SettingsThemeRecord } from '../../events/SettingsEvents';
import type { SettingsViewModel } from '../../viewmodels/SettingsViewModel';

export type ThemeGalleryViewRefs = {
  preview: {
    left: HTMLElement;
    center: HTMLElement;
    right: HTMLElement;
  };
  grid: HTMLElement;
};

export class ThemeGalleryView {
  constructor(
    private readonly viewModel: SettingsViewModel,
    private readonly refs: ThemeGalleryViewRefs,
  ) {}

  renderThemeGallery() {
    const themes = this.viewModel.snapshotRuntime.themes.value;
    const selectedIndex = themes.findIndex((theme) => theme.id === this.viewModel.snapshotRuntime.selectedThemeId.value);
    if (themes.length === 0 || selectedIndex === -1) {
      return;
    }

    const left = themes[(selectedIndex - 1 + themes.length) % themes.length];
    const center = themes[selectedIndex];
    const right = themes[(selectedIndex + 1) % themes.length];

    this.refs.preview.left.innerHTML = this.renderThemePreview(left, 'left');
    this.refs.preview.center.innerHTML = this.renderThemePreview(center, 'center');
    this.refs.preview.right.innerHTML = this.renderThemePreview(right, 'right');

    this.refs.grid.innerHTML = themes
      .map(
        (theme) => `
          <article class="theme-chip ${theme.id === center.id ? 'is-active' : ''}" data-theme-id="${theme.id}">
            <div class="chip-preview" style="background:${theme.background}"></div>
            <div class="chip-copy">
              <strong>${theme.label}</strong>
              <span>${theme.description}</span>
            </div>
            <div class="list-tags">
              <span class="mini-token ${theme.tier === 'premium' ? 'premium' : 'free'}">${theme.tierLabel}</span>
            </div>
          </article>
        `,
      )
      .join('');

    this.refs.grid.querySelectorAll<HTMLElement>('[data-theme-id]').forEach((element) => {
      element.addEventListener('click', () => this.viewModel.selectTheme(element.dataset.themeId ?? ''));
    });
  }

  private renderThemePreview(theme: SettingsThemeRecord, position: 'left' | 'center' | 'right') {
    const settingsCopy = this.viewModel.uiCopy.value.settings;
    const positionLabel = position === 'center' ? settingsCopy.themePreviewSelected : settingsCopy.themePreviewNeighbor;
    return `
      <div class="preview-surface" style="color:${theme.accent}; background:${theme.background};">
        <div>
          <div class="preview-head">
            <span class="preview-tag">${theme.tierLabel}</span>
            <span class="material-symbols-outlined" style="font-size:20px; opacity:0.82">palette</span>
          </div>
          <h3 class="preview-title">${theme.label}</h3>
          <p class="preview-subtitle">${theme.description}</p>
        </div>
        <div class="preview-prompt" style="background:${theme.panel};">
          E = mc² where m is the relativistic mass of the particle.\n\n${theme.sample}
        </div>
        <div class="preview-columns">
          <div class="preview-column">
            <strong>${positionLabel}</strong>
            <span>${theme.tierLabel}</span>
          </div>
          <div class="preview-column">
            <strong>${settingsCopy.themePreviewPopover}</strong>
            <span>${theme.label}</span>
          </div>
        </div>
      </div>
    `;
  }
}