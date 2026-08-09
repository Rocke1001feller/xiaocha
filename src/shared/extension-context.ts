/**
 * User-facing message shown when the extension's background context has been
 * invalidated (reloaded, updated, or uninstalled) while a content script is
 * still running.
 */
export const EXTENSION_CONTEXT_INVALIDATED_MESSAGE = '扩展已更新，请刷新页面';

/**
 * Detects the runtime error thrown by `browser.runtime.sendMessage` and other
 * extension APIs after the extension context has been invalidated.
 */
export function isExtensionContextInvalidatedError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /extension context invalidated/i.test(error.message)
  );
}

/**
 * Returns `false` when the extension runtime has been invalidated and can no
 * longer receive messages. Prefer this before calling `browser.runtime` APIs
 * to fail fast with a friendly message instead of an unhandled rejection.
 */
export function isExtensionContextValid(): boolean {
  return (
    typeof browser !== 'undefined' &&
    typeof browser.runtime !== 'undefined' &&
    browser.runtime.id != null
  );
}
