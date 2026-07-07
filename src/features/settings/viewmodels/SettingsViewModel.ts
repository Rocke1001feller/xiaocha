import { Observable } from '../../../shared/Observable';
import { type AiOutputLanguagePreference, type AiOutputLanguageOption } from '../../../shared/ai-output-language';
import {
  type ResolvedUiDisplayLanguage,
  type UiCopyBundle,
  type UiDisplayLanguageOption,
  type UiDisplayLanguagePreference,
} from '../../../shared/ui-language';
import type { SettingsPageTab } from '../events/SettingsEvents';
import type { ISettingsProviderRepository } from '../interfaces/ISettingsProviderRepository';
import type { ISettingsRepository } from '../interfaces/ISettingsRepository';
import type { ISettingsTaskRepository } from '../interfaces/ISettingsTaskRepository';
import { LanguagePreferencesController } from './language-preferences/LanguagePreferencesController';
import { ProviderEditorController } from './provider-editor/ProviderEditorController';
import { getProviderEditorCopy } from './provider-editor/providerEditorCopy';
import { SettingsShellCoordinator } from './shell/SettingsShellCoordinator';
import type { SettingsSelectionState } from './shell/SettingsSelectionState';
import { SnapshotRuntimeController } from './snapshot-runtime/SnapshotRuntimeController';
import { TaskDryRunController } from './task-dry-run/TaskDryRunController';
import { TaskEditorController } from './task-editor/TaskEditorController';
import { getTaskEditorCopy } from './task-editor/taskEditorCopy';
import type { TaskEditorViewState } from './task-editor/taskEditorState';
export class SettingsViewModel {
  readonly isLoading = new Observable(true);

  readonly isSavingDisplayLanguage: Observable<boolean>;

  readonly isSavingOutputLanguage: Observable<boolean>;

  readonly errorMessage = new Observable<string | null>(null);

  readonly activeTab: Observable<SettingsPageTab>;

  readonly displayLanguagePreference: Observable<UiDisplayLanguagePreference>;

  readonly resolvedLanguage: Observable<ResolvedUiDisplayLanguage>;

  readonly displayLanguageOptions: Observable<readonly UiDisplayLanguageOption[]>;

  readonly outputLanguagePreference: Observable<AiOutputLanguagePreference>;

  readonly outputLanguageOptions: Observable<readonly AiOutputLanguageOption[]>;

  readonly uiCopy: Observable<UiCopyBundle>;

  readonly providerEditor: ProviderEditorController;

  readonly taskEditor: TaskEditorController;

  readonly taskDryRun: TaskDryRunController;

  readonly snapshotRuntime: SnapshotRuntimeController;

  private readonly languagePreferencesController: LanguagePreferencesController<SettingsSelectionState>;

  private readonly shellCoordinator: SettingsShellCoordinator;

  constructor(
    repository: ISettingsRepository,
    providerRepository: ISettingsProviderRepository,
    taskRepository: ISettingsTaskRepository,
    navigatorLanguage = globalThis.navigator?.language ?? 'en',
  ) {
    this.snapshotRuntime = new SnapshotRuntimeController();
    this.providerEditor = new ProviderEditorController(providerRepository, {
      getCopy: () => getProviderEditorCopy(this.resolvedLanguage.value),
    });
    this.taskEditor = new TaskEditorController(taskRepository, {
      getProviders: () => this.providerEditor.providers.value,
      getCopy: () => getTaskEditorCopy(this.resolvedLanguage.value),
    });
    this.taskDryRun = new TaskDryRunController(taskRepository, {
      buildDryRunRequest: () => this.taskEditor.buildDryRunRequest(),
      getIsSavingTask: () => this.taskEditor.isSavingTask.value,
      getResolvedLanguage: () => this.resolvedLanguage.value,
      getSelectedTask: () => this.taskEditor.getSelectedTask(),
      getTaskEditorMode: () => this.taskEditor.taskEditorMode.value,
    });
    this.shellCoordinator = new SettingsShellCoordinator(
      repository,
      this.snapshotRuntime,
      this.providerEditor,
      this.taskEditor,
      this.taskDryRun,
      {
        initializeLanguagePreferences: () => this.languagePreferencesController.initialize(),
        setErrorMessage: (message) => {
          this.errorMessage.value = message;
        },
        setIsLoading: (loading) => {
          this.isLoading.value = loading;
        },
      },
    );
    this.languagePreferencesController = new LanguagePreferencesController(repository, navigatorLanguage, {
      captureSelection: () => this.shellCoordinator.captureSelection(),
      prepareResolvedLanguageChange: (resolvedLanguage, preserveSelection, previousSelection) =>
        this.shellCoordinator.prepareResolvedLanguageChange(resolvedLanguage, preserveSelection, previousSelection),
      setErrorMessage: (message) => {
        this.errorMessage.value = message;
      },
    });
    this.isSavingDisplayLanguage = this.languagePreferencesController.isSavingDisplayLanguage;
    this.isSavingOutputLanguage = this.languagePreferencesController.isSavingOutputLanguage;
    this.displayLanguagePreference = this.languagePreferencesController.displayLanguagePreference;
    this.resolvedLanguage = this.languagePreferencesController.resolvedLanguage;
    this.displayLanguageOptions = this.languagePreferencesController.displayLanguageOptions;
    this.outputLanguagePreference = this.languagePreferencesController.outputLanguagePreference;
    this.outputLanguageOptions = this.languagePreferencesController.outputLanguageOptions;
    this.uiCopy = this.languagePreferencesController.uiCopy;
    this.activeTab = this.shellCoordinator.activeTab;
  }

  async initialize() {
    await this.shellCoordinator.initialize();
  }

  dispose() {
    this.shellCoordinator.dispose();
  }

  setActiveTab(tab: SettingsPageTab) {
    this.shellCoordinator.setActiveTab(tab);
  }

  jumpToTab(tab: SettingsPageTab) {
    this.shellCoordinator.jumpToTab(tab);
  }

  beginCreateTask() {
    this.taskDryRun.abortTaskDryRun(true);
    this.taskEditor.beginCreateTask();
  }

  cancelTaskEditing() {
    this.taskDryRun.abortTaskDryRun(true);
    this.taskEditor.cancelTaskEditing();
  }

  selectTask(taskId: string) {
    this.taskDryRun.abortTaskDryRun(true);
    this.taskEditor.selectTask(taskId);
  }

  async saveTask() {
    if (this.taskDryRun.isTaskDryRunRunning()) {
      return;
    }

    await this.taskEditor.saveTask();
  }

  async resetSelectedTask() {
    if (this.taskDryRun.isTaskDryRunRunning()) {
      return;
    }

    await this.taskEditor.resetSelectedTask();
  }

  getTaskEditorViewState(): TaskEditorViewState {
    const editorState = this.taskEditor.getTaskEditorViewState();
    if (!this.taskDryRun.isTaskDryRunRunning()) {
      return editorState;
    }

    return {
      ...editorState,
      isBusy: true,
      canSave: false,
      canReset: false,
    };
  }

  async updateDisplayLanguagePreference(preference: UiDisplayLanguagePreference) {
    await this.languagePreferencesController.updateDisplayLanguagePreference(preference);
  }

  async updateOutputLanguagePreference(preference: AiOutputLanguagePreference) {
    await this.languagePreferencesController.updateOutputLanguagePreference(preference);
  }

  selectTheme(themeId: string) {
    const theme = this.snapshotRuntime.themes.value.find((item) => item.id === themeId);
    if (!theme) {
      return;
    }

    this.snapshotRuntime.selectTheme(theme.id);
  }
}