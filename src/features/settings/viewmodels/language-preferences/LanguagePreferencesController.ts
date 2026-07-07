import { Observable } from '../../../../shared/Observable';
import {
  DEFAULT_AI_OUTPUT_LANGUAGE_PREFERENCE,
  getAiOutputLanguageOptions,
  type AiOutputLanguageOption,
  type AiOutputLanguagePreference,
} from '../../../../shared/ai-output-language';
import {
  getUiCopy,
  getUiDisplayLanguageOptions,
  resolveUiDisplayLanguage,
  type ResolvedUiDisplayLanguage,
  type UiCopyBundle,
  type UiDisplayLanguageOption,
  type UiDisplayLanguagePreference,
} from '../../../../shared/ui-language';
import type { ISettingsRepository } from '../../interfaces/ISettingsRepository';

type LanguagePreferencesHooks<TSelection> = {
  captureSelection: () => TSelection;
  prepareResolvedLanguageChange: (
    resolvedLanguage: ResolvedUiDisplayLanguage,
    preserveSelection: boolean,
    previousSelection?: TSelection,
  ) => Promise<void>;
  setErrorMessage: (message: string | null) => void;
};

export class LanguagePreferencesController<TSelection> {
  readonly isSavingDisplayLanguage = new Observable(false);

  readonly isSavingOutputLanguage = new Observable(false);

  readonly displayLanguagePreference = new Observable<UiDisplayLanguagePreference>('system');

  readonly resolvedLanguage = new Observable<ResolvedUiDisplayLanguage>('zh-CN');

  readonly displayLanguageOptions = new Observable<readonly UiDisplayLanguageOption[]>(
    getUiDisplayLanguageOptions('zh-CN'),
  );

  readonly outputLanguagePreference = new Observable<AiOutputLanguagePreference>(
    DEFAULT_AI_OUTPUT_LANGUAGE_PREFERENCE,
  );

  readonly outputLanguageOptions = new Observable<readonly AiOutputLanguageOption[]>(
    getAiOutputLanguageOptions('zh-CN'),
  );

  readonly uiCopy = new Observable<UiCopyBundle>(getUiCopy('zh-CN'));

  constructor(
    private readonly repository: ISettingsRepository,
    private readonly navigatorLanguage: string,
    private readonly hooks: LanguagePreferencesHooks<TSelection>,
  ) {}

  async initialize() {
    const [preference, outputLanguagePreference] = await Promise.all([
      this.repository.getUiDisplayLanguagePreference(),
      this.repository.getAiOutputLanguagePreference(),
    ]);

    await this.applyDisplayLanguagePreference(preference, outputLanguagePreference, false);
  }

  async updateDisplayLanguagePreference(preference: UiDisplayLanguagePreference) {
    const previousPreference = this.displayLanguagePreference.value;
    const previousOutputLanguagePreference = this.outputLanguagePreference.value;
    const previousSelection = this.hooks.captureSelection();
    this.isSavingDisplayLanguage.value = true;
    this.hooks.setErrorMessage(null);

    try {
      await this.applyDisplayLanguagePreference(
        preference,
        previousOutputLanguagePreference,
        true,
        previousSelection,
      );
      await this.repository.setUiDisplayLanguagePreference(preference);
    } catch (error) {
      this.hooks.setErrorMessage(error instanceof Error ? error.message : 'Unable to save display language.');
      await this.applyDisplayLanguagePreference(
        previousPreference,
        previousOutputLanguagePreference,
        false,
        previousSelection,
      );
    } finally {
      this.isSavingDisplayLanguage.value = false;
    }
  }

  async updateOutputLanguagePreference(preference: AiOutputLanguagePreference) {
    const previousPreference = this.outputLanguagePreference.value;
    this.isSavingOutputLanguage.value = true;
    this.hooks.setErrorMessage(null);

    try {
      this.applyOutputLanguagePreference(preference, this.resolvedLanguage.value);
      await this.repository.setAiOutputLanguagePreference(preference);
    } catch (error) {
      this.hooks.setErrorMessage(
        error instanceof Error ? error.message : 'Unable to save AI output language.',
      );
      this.applyOutputLanguagePreference(previousPreference, this.resolvedLanguage.value);
    } finally {
      this.isSavingOutputLanguage.value = false;
    }
  }

  private async applyDisplayLanguagePreference(
    preference: UiDisplayLanguagePreference,
    outputLanguagePreference: AiOutputLanguagePreference,
    preserveSelection: boolean,
    previousSelection?: TSelection,
  ) {
    const resolvedLanguage = resolveUiDisplayLanguage(preference, this.navigatorLanguage);

    await this.hooks.prepareResolvedLanguageChange(
      resolvedLanguage,
      preserveSelection,
      preserveSelection ? previousSelection : undefined,
    );

    this.displayLanguagePreference.value = preference;
    this.resolvedLanguage.value = resolvedLanguage;
    this.displayLanguageOptions.value = getUiDisplayLanguageOptions(resolvedLanguage);
    this.applyOutputLanguagePreference(outputLanguagePreference, resolvedLanguage);
    this.uiCopy.value = getUiCopy(resolvedLanguage);
  }

  private applyOutputLanguagePreference(
    preference: AiOutputLanguagePreference,
    language: ResolvedUiDisplayLanguage,
  ) {
    this.outputLanguagePreference.value = preference;
    this.outputLanguageOptions.value = getAiOutputLanguageOptions(language);
  }
}