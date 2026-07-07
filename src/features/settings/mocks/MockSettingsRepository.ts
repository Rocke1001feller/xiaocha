import {
  DEFAULT_AI_OUTPUT_LANGUAGE_PREFERENCE,
  type AiOutputLanguagePreference,
} from '../../../shared/ai-output-language';
import { createSettingsSnapshot } from '../events/SettingsEvents';
import type { ISettingsRepository } from '../interfaces/ISettingsRepository';
import type { ResolvedUiDisplayLanguage, UiDisplayLanguagePreference } from '../../../shared/ui-language';

export class MockSettingsRepository implements ISettingsRepository {
  private preference: UiDisplayLanguagePreference = 'system';

  private outputLanguagePreference: AiOutputLanguagePreference = DEFAULT_AI_OUTPUT_LANGUAGE_PREFERENCE;

  async getUiDisplayLanguagePreference(): Promise<UiDisplayLanguagePreference> {
    return this.preference;
  }

  async setUiDisplayLanguagePreference(preference: UiDisplayLanguagePreference): Promise<void> {
    this.preference = preference;
  }

  async getAiOutputLanguagePreference(): Promise<AiOutputLanguagePreference> {
    return this.outputLanguagePreference;
  }

  async setAiOutputLanguagePreference(preference: AiOutputLanguagePreference): Promise<void> {
    this.outputLanguagePreference = preference;
  }

  async getSnapshot(language: ResolvedUiDisplayLanguage) {
    return createSettingsSnapshot(language);
  }

  watchSnapshot(_language: ResolvedUiDisplayLanguage, _callback: (snapshot: ReturnType<typeof createSettingsSnapshot>) => void) {
    return () => {};
  }
}