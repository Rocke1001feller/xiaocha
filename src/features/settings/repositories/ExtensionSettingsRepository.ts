import { getAiOutputLanguagePreference, setAiOutputLanguagePreference } from '../../../storage/ai-output-language';
import { getUiDisplayLanguagePreference, setUiDisplayLanguagePreference } from '../../../storage/ui-display-language';
import type { AiOutputLanguagePreference } from '../../../shared/ai-output-language';
import type { ResolvedUiDisplayLanguage, UiDisplayLanguagePreference } from '../../../shared/ui-language';
import { createSettingsSnapshot } from '../events/SettingsEvents';
import type { ISettingsRepository } from '../interfaces/ISettingsRepository';
import { SettingsProviderRepository } from './SettingsProviderRepository';
import { SettingsTaskRepository } from './SettingsTaskRepository';

export class ExtensionSettingsRepository implements ISettingsRepository {
  private readonly settingsProviderRepository: SettingsProviderRepository;

  private readonly settingsTaskRepository: SettingsTaskRepository;

  constructor(
    settingsProviderRepository = new SettingsProviderRepository(),
    settingsTaskRepository = new SettingsTaskRepository(),
  ) {
    this.settingsProviderRepository = settingsProviderRepository;
    this.settingsTaskRepository = settingsTaskRepository;
  }

  async getUiDisplayLanguagePreference(): Promise<UiDisplayLanguagePreference> {
    return getUiDisplayLanguagePreference();
  }

  async setUiDisplayLanguagePreference(preference: UiDisplayLanguagePreference): Promise<void> {
    await setUiDisplayLanguagePreference(preference);
  }

  async getAiOutputLanguagePreference(): Promise<AiOutputLanguagePreference> {
    return getAiOutputLanguagePreference();
  }

  async setAiOutputLanguagePreference(preference: AiOutputLanguagePreference): Promise<void> {
    await setAiOutputLanguagePreference(preference);
  }

  async getSnapshot(language: ResolvedUiDisplayLanguage) {
    const [providers, tasks] = await Promise.all([
      this.settingsProviderRepository.listProviders(),
      this.settingsTaskRepository.listTasks(),
    ]);

    return createSettingsSnapshot(language, providers, tasks);
  }

  watchSnapshot(language: ResolvedUiDisplayLanguage, callback: (snapshot: ReturnType<typeof createSettingsSnapshot>) => void) {
    let disposed = false;
    let latestProviders: Awaited<ReturnType<SettingsProviderRepository['listProviders']>> | null = null;
    let latestTasks: Awaited<ReturnType<SettingsTaskRepository['listTasks']>> | null = null;

    const emit = () => {
      if (disposed || latestProviders == null || latestTasks == null) {
        return;
      }

      callback(createSettingsSnapshot(language, latestProviders, latestTasks));
    };

    const stopProvidersWatch = this.settingsProviderRepository.watchProviders((providers) => {
      latestProviders = providers;
      emit();
    });
    const stopTasksWatch = this.settingsTaskRepository.watchTasks((tasks) => {
      latestTasks = tasks;
      emit();
    });

    return () => {
      disposed = true;
      stopProvidersWatch();
      stopTasksWatch();
    };
  }
}