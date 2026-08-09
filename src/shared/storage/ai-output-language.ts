import {
  DEFAULT_AI_OUTPUT_LANGUAGE_PREFERENCE,
  type AiOutputLanguagePreference,
} from '../ai-output-language';
import { extensionStorage } from './extension-storage';

const STORAGE_KEY = 'ai-output-language';

function isAiOutputLanguagePreference(value: unknown): value is AiOutputLanguagePreference {
  return (
    value === 'system' ||
    value === 'en' ||
    value === 'zh-CN' ||
    value === 'ja' ||
    value === 'ko' ||
    value === 'zh-TW' ||
    value === 'de' ||
    value === 'it' ||
    value === 'pt' ||
    value === 'es' ||
    value === 'fr'
  );
}

export async function getAiOutputLanguagePreference(): Promise<AiOutputLanguagePreference> {
  const result = await extensionStorage.get(STORAGE_KEY);
  const value: unknown = result[STORAGE_KEY];
  return isAiOutputLanguagePreference(value) ? value : DEFAULT_AI_OUTPUT_LANGUAGE_PREFERENCE;
}

export async function setAiOutputLanguagePreference(
  preference: AiOutputLanguagePreference,
): Promise<void> {
  await extensionStorage.set({ [STORAGE_KEY]: preference });
}
