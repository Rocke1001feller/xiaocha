import { Observable } from '../../../../shared/Observable';
import type { SettingsSnapshot, SettingsThemeRecord } from '../../events/SettingsEvents';

export class SnapshotRuntimeController {
  readonly metrics = new Observable<SettingsSnapshot['metrics']>([]);

  readonly themes = new Observable<SettingsThemeRecord[]>([]);

  readonly selectedThemeId = new Observable<SettingsThemeRecord['id']>('pro');

  readonly currentThemeChipLabel = new Observable('');

  readonly advancedFallbackChain = new Observable<string[]>([]);

  readonly requestTimeoutMs = new Observable(0);

  readonly firstChunkTimeoutMs = new Observable(0);

  applySnapshot(snapshot: SettingsSnapshot) {
    this.metrics.value = snapshot.metrics;
    this.themes.value = snapshot.themes;
    this.advancedFallbackChain.value = [...(snapshot.tasks[0]?.providers ?? [])];
    this.requestTimeoutMs.value = snapshot.requestTimeoutMs;
    this.firstChunkTimeoutMs.value = snapshot.firstChunkTimeoutMs;
    this.syncCurrentThemeChipLabel();
  }

  selectTheme(themeId: SettingsThemeRecord['id']) {
    this.selectedThemeId.value = themeId;
    this.syncCurrentThemeChipLabel();
  }

  getSelectedTheme(): SettingsThemeRecord | null {
    return this.themes.value.find((theme) => theme.id === this.selectedThemeId.value) ?? null;
  }

  private syncCurrentThemeChipLabel() {
    const theme = this.getSelectedTheme();
    this.currentThemeChipLabel.value = theme ? `${theme.label} · ${theme.tierLabel}` : '';
  }
}