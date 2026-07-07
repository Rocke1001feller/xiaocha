// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/features/popover/styles/original-themes', () => ({
  default: readFileSync(`${process.cwd()}/src/features/popover/styles/original-themes/order.txt`, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((file) => readFileSync(`${process.cwd()}/src/features/popover/styles/original-themes/${file}`, 'utf8'))
    .join(''),
}));

vi.mock('../../src/features/popover/repositories/RuntimePopoverRepository', () => ({
  RuntimePopoverRepository: class MockRuntimePopoverRepository {
    async listTasks() {
      return [
        { id: 'lexical', label: 'Lexical', kind: 'lexical' },
        { id: 'etymology', label: 'Etymology', kind: 'markdown' },
      ];
    }

    async startTask() {}

    async cancelTask() {}
  },
}));

import { PopoverFeature } from '../../src/features/popover/PopoverFeature';

const highlightStore = new Map<string, unknown>();

const originalCSS = globalThis.CSS;
const originalHighlight = (globalThis as typeof globalThis & { Highlight?: unknown }).Highlight;

function createRect(): DOMRect {
  return {
    x: 48,
    y: 80,
    top: 80,
    left: 48,
    right: 188,
    bottom: 104,
    width: 140,
    height: 24,
    toJSON() {
      return this;
    },
  } as DOMRect;
}

function setTextSelection(text: string, selectionText = text) {
  document.body.innerHTML = `<p id="copy">${text}</p>`;

  const paragraph = document.getElementById('copy');
  const textNode = paragraph?.firstChild;
  if (!textNode) {
    throw new Error('Expected test fixture text node.');
  }

  const selectionStart = text.indexOf(selectionText);
  if (selectionStart < 0) {
    throw new Error(`Expected to find selection text "${selectionText}" in fixture.`);
  }

  const selectionEnd = selectionStart + selectionText.length;

  const range = document.createRange();
  range.setStart(textNode, selectionStart);
  range.setEnd(textNode, selectionEnd);

  const rect = createRect();
  Object.defineProperty(range, 'getBoundingClientRect', {
    configurable: true,
    value: () => rect,
  });
  Object.defineProperty(range, 'getClientRects', {
    configurable: true,
    value: () => [rect],
  });

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

beforeEach(() => {
  vi.useFakeTimers();
  highlightStore.clear();

  Object.defineProperty(globalThis, 'browser', {
    configurable: true,
    value: {
      runtime: {
        onMessage: {
          addListener: vi.fn(),
        },
        sendMessage: vi.fn(),
      },
    },
  });

  class MockHighlight {
    constructor(public readonly range: Range) {}
  }

  Object.defineProperty(globalThis, 'Highlight', {
    configurable: true,
    value: MockHighlight,
  });
  Object.defineProperty(window, 'Highlight', {
    configurable: true,
    value: MockHighlight,
  });
  Object.defineProperty(globalThis, 'CSS', {
    configurable: true,
    value: {
      ...(originalCSS ?? {}),
      highlights: highlightStore,
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
  highlightStore.clear();
  window.getSelection()?.removeAllRanges();
  document.getElementById('scan-explain-popover-root')?.remove();
  document.querySelector('style[data-scan-explain="highlight"]')?.remove();
  document.body.innerHTML = '';

  if (originalCSS) {
    Object.defineProperty(globalThis, 'CSS', {
      configurable: true,
      value: originalCSS,
    });
  }
  else {
    Reflect.deleteProperty(globalThis, 'CSS');
  }

  if (originalHighlight) {
    Object.defineProperty(globalThis, 'Highlight', {
      configurable: true,
      value: originalHighlight,
    });
    Object.defineProperty(window, 'Highlight', {
      configurable: true,
      value: originalHighlight,
    });
  }
  else {
    Reflect.deleteProperty(globalThis, 'Highlight');
    Reflect.deleteProperty(window, 'Highlight');
  }

  Reflect.deleteProperty(globalThis, 'browser');
});

describe('PopoverFeature selection affordance', () => {
  it('keeps the native selection, applies the underline immediately, and inserts the trigger as a true inline badge after the selected text', async () => {
    setTextSelection('Immediate underline follows', 'Immediate underline');

    const feature = new PopoverFeature();
    feature.start();

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(10);

    const host = document.getElementById('scan-explain-popover-root') as HTMLDivElement;
    const shadowRoot = host.shadowRoot as ShadowRoot;
    const paragraph = document.getElementById('copy') as HTMLParagraphElement;
    const triggerHost = paragraph.querySelector('[data-scan-explain-inline-trigger="true"]') as HTMLSpanElement;
    const trigger = triggerHost.shadowRoot?.querySelector('.oow-selection-trigger-button') as HTMLDivElement;

    expect(trigger.classList.contains('visible')).toBe(true);
    expect(trigger.classList.contains('activated')).toBe(false);
    expect(shadowRoot.querySelector('.oow-popover')?.classList.contains('is-visible')).toBe(false);
    expect(highlightStore.has('scan-explain-selection')).toBe(true);
    expect(window.getSelection()?.toString()).toBe('Immediate underline');
    expect(window.getSelection()?.rangeCount).toBe(1);
    expect(paragraph.childNodes[0]?.textContent).toBe('Immediate underline');
    expect(paragraph.childNodes[1]).toBe(triggerHost);
    expect(paragraph.childNodes[2]?.textContent).toBe(' follows');

    window.getSelection()?.removeAllRanges();
    document.dispatchEvent(new Event('selectionchange'));

    expect(highlightStore.has('scan-explain-selection')).toBe(false);
    expect(paragraph.querySelector('[data-scan-explain-inline-trigger="true"]')).toBeNull();
    expect(paragraph.textContent).toBe('Immediate underline follows');
  });
});