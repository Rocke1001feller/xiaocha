import type { AiOutputLanguagePreference } from '../../../shared/ai-output-language';
import type { ResolvedUiDisplayLanguage, UiDisplayLanguagePreference } from '../../../shared/ui-language';
import type { SettingsSnapshot } from '../events/SettingsEvents';

export interface ISettingsRepository {
  getUiDisplayLanguagePreference(): Promise<UiDisplayLanguagePreference>;
  setUiDisplayLanguagePreference(preference: UiDisplayLanguagePreference): Promise<void>;
  getAiOutputLanguagePreference(): Promise<AiOutputLanguagePreference>;
  setAiOutputLanguagePreference(preference: AiOutputLanguagePreference): Promise<void>;
  getSnapshot(language: ResolvedUiDisplayLanguage): Promise<SettingsSnapshot>;
  watchSnapshot(language: ResolvedUiDisplayLanguage, callback: (snapshot: SettingsSnapshot) => void): () => void;
}