import { Observable } from '../../../../shared/Observable';
import type { ResolvedUiDisplayLanguage } from '../../../../shared/ui-language';
import type { SettingsPageTab, SettingsSnapshot } from '../../events/SettingsEvents';
import type { ISettingsRepository } from '../../interfaces/ISettingsRepository';
import { ProviderEditorController } from '../provider-editor/ProviderEditorController';
import { SnapshotRuntimeController } from '../snapshot-runtime/SnapshotRuntimeController';
import { TaskDryRunController } from '../task-dry-run/TaskDryRunController';
import { TaskEditorController } from '../task-editor/TaskEditorController';
import type { SettingsSelectionState } from './SettingsSelectionState';

type SettingsShellCoordinatorHooks = {
  initializeLanguagePreferences: () => Promise<void>;
  setErrorMessage: (message: string | null) => void;
  setIsLoading: (loading: boolean) => void;
};

export class SettingsShellCoordinator {
  readonly activeTab = new Observable<SettingsPageTab>('overview');

  private stopSnapshotWatch: (() => void) | null = null;

  constructor(
    private readonly repository: ISettingsRepository,
    private readonly snapshotRuntimeController: SnapshotRuntimeController,
    private readonly providerEditorController: ProviderEditorController,
    private readonly taskEditorController: TaskEditorController,
    private readonly taskDryRunController: TaskDryRunController,
    private readonly hooks: SettingsShellCoordinatorHooks,
  ) {}

  async initialize() {
    this.hooks.setIsLoading(true);
    this.hooks.setErrorMessage(null);

    try {
      await this.hooks.initializeLanguagePreferences();
    } catch (error) {
      this.hooks.setErrorMessage(error instanceof Error ? error.message : 'Unable to load settings.');
    } finally {
      this.hooks.setIsLoading(false);
    }
  }

  dispose() {
    this.providerEditorController.dispose();
    this.taskDryRunController.dispose();
    this.stopSnapshotWatch?.();
    this.stopSnapshotWatch = null;
  }

  setActiveTab(tab: SettingsPageTab) {
    this.activeTab.value = tab;
  }

  jumpToTab(tab: SettingsPageTab) {
    this.activeTab.value = tab;
  }

  captureSelection(): SettingsSelectionState {
    return {
      providerId: this.providerEditorController.selectedProviderId.value,
      taskId: this.taskEditorController.selectedTaskId.value,
      themeId: this.snapshotRuntimeController.selectedThemeId.value,
      providerEditorMode: this.providerEditorController.providerEditorMode.value,
      taskEditorMode: this.taskEditorController.taskEditorMode.value,
    };
  }

  async prepareResolvedLanguageChange(
    resolvedLanguage: ResolvedUiDisplayLanguage,
    preserveSelection: boolean,
    previousSelection?: SettingsSelectionState,
  ) {
    const snapshot = await this.repository.getSnapshot(resolvedLanguage);
    this.applySnapshot(snapshot, preserveSelection ? previousSelection : undefined);
    this.startSnapshotWatch(resolvedLanguage);
  }

  private startSnapshotWatch(language: ResolvedUiDisplayLanguage) {
    this.stopSnapshotWatch?.();
    this.stopSnapshotWatch = this.repository.watchSnapshot(language, (snapshot) => {
      this.applySnapshot(snapshot, this.captureSelection());
    });
  }

  private applySnapshot(snapshot: SettingsSnapshot, previousSelection?: SettingsSelectionState) {
    this.snapshotRuntimeController.applySnapshot(snapshot);
    this.providerEditorController.applyProviderSnapshot(snapshot.providers, previousSelection);
    this.taskEditorController.applyTaskSnapshot(snapshot.tasks, previousSelection);

    if (
      this.taskEditorController.selectedTaskId.value == null ||
      this.taskEditorController.selectedTaskId.value !== previousSelection?.taskId
    ) {
      this.taskDryRunController.abortTaskDryRun(true);
    }

    const nextThemeId = previousSelection?.themeId ?? snapshot.selectedThemeId;
    this.snapshotRuntimeController.selectTheme(
      snapshot.themes.some((theme) => theme.id === nextThemeId)
        ? nextThemeId
        : snapshot.selectedThemeId,
    );
  }
}