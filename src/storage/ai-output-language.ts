import {
  DEFAULT_AI_OUTPUT_LANGUAGE_PREFERENCE,
  type AiOutputLanguagePreference,
} from '../shared/ai-output-language';

const STORAGE_KEY = 'ai-output-language';

type StorageLike = {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
};

function createLocalStorageAdapter(): StorageLike {
  // In Chrome extension sandbox pages the document has a null/opaque origin
  // (CSP: sandbox without allow-same-origin). Accessing window.localStorage
  // in that context throws a SecurityError *at the property getter* — before
  // optional-chaining can intercept it. Guard with try/catch so the sandbox
  // silently falls back to the default preference value.
  function safeGet(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  function safeSet(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // noop in sandboxed context
    }
  }
  return {
    async get(key) {
      const rawValue = safeGet(key);
      if (rawValue === null) {
        return {};
      }

      try {
        return { [key]: JSON.parse(rawValue) };
      } catch {
        return { [key]: rawValue };
      }
    },
    async set(items) {
      for (const [key, value] of Object.entries(items)) {
        safeSet(key, JSON.stringify(value));
      }
    },
  };
}

const extensionStorage: StorageLike = (() => {
  const extensionApi = globalThis as typeof globalThis & {
    browser?: typeof browser;
    chrome?: {
      storage?: {
        local?: typeof browser.storage.local;
      };
    };
  };

  if (extensionApi.browser?.storage?.local) {
    return extensionApi.browser.storage.local;
  }

  if (extensionApi.chrome?.storage?.local) {
    return extensionApi.chrome.storage.local;
  }

  return createLocalStorageAdapter();
})();

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