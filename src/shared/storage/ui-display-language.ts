import type { UiDisplayLanguagePreference } from '../ui-language';
import { extensionStorage } from './extension-storage';

const STORAGE_KEY = 'ui-display-language';

function isUiDisplayLanguagePreference(value: unknown): value is UiDisplayLanguagePreference {
  return value === 'system' || value === 'zh-CN' || value === 'en';
}

export async function getUiDisplayLanguagePreference(): Promise<UiDisplayLanguagePreference> {
  const result = await extensionStorage.get(STORAGE_KEY);
  const value: unknown = result[STORAGE_KEY];
  return isUiDisplayLanguagePreference(value) ? value : 'system';
}

export async function setUiDisplayLanguagePreference(
  preference: UiDisplayLanguagePreference,
): Promise<void> {
  await extensionStorage.set({ [STORAGE_KEY]: preference });
}
