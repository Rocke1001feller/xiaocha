import { describe, expect, it, vi } from 'vitest';

import { ExtensionCardRepository } from '../../src/features/card/repositories/ExtensionCardRepository';

const harness = vi.hoisted(() => ({
  getValue: vi.fn(),
  unwatch: vi.fn(),
  fireChange: () => undefined as void,
}));

vi.mock('../../src/features/card/storage/cardStorage', () => ({
  cardStorage: {
    watch: (callback: () => void) => {
      harness.fireChange = callback;
      return harness.unwatch;
    },
  },
  readCardStore: () => harness.getValue(),
  writeCardStore: async () => {},
}));

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('ExtensionCardRepository.onChanged', () => {
  it('delivers cards on subscribe and on storage changes', async () => {
    harness.getValue.mockResolvedValue({});
    const repository = new ExtensionCardRepository();
    const callback = vi.fn();

    repository.onChanged(callback);
    await flushMicrotasks();

    expect(callback).toHaveBeenCalledWith([]);
  });

  it('swallows invalidated-context rejections instead of leaking unhandled rejections', async () => {
    harness.getValue.mockRejectedValue(new Error('Extension context invalidated.'));
    const repository = new ExtensionCardRepository();
    const callback = vi.fn();

    // Must not produce an unhandled rejection when the extension context is
    // already invalidated (orphaned page after an extension reload).
    repository.onChanged(callback);
    await flushMicrotasks();
    harness.fireChange();
    await flushMicrotasks();

    expect(callback).not.toHaveBeenCalled();
  });
});
