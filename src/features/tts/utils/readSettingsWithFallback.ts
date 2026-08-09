/**
 * storage 读取兜底：超时或异常（如 Extension context invalidated 后
 * chrome.storage 调用永久 pending 或直接 reject）时返回 fallback，
 * 让调用方走降级路径而不是静默卡死。
 */
export async function readSettingsWithFallback<T>(
  read: Promise<T>,
  fallback: T,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    const timeout = new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(fallback), timeoutMs);
    });
    return await Promise.race([read, timeout]);
  } catch {
    return fallback;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
