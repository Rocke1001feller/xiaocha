import type { UiDisplayLanguagePreference } from '../shared/ui-language';

const STORAGE_KEY = 'ui-display-language';

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