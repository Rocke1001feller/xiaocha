import { createDefaultCardLifecycleService } from '../card';
import { createTtsService } from '../tts';
import { ContentScriptContext } from 'wxt/utils/content-script-context';
import { isPopoverStreamEvent, POPOVER_THEMES, toViewportRect, type PopoverSelectionData, type PopoverThemeId } from './events/PopoverEvents';
import { RuntimePopoverRepository } from './repositories/RuntimePopoverRepository';
import { PopoverViewModel } from './viewmodels/PopoverViewModel';
import { OriginalPopoverView } from './components/OriginalPopoverView';
import { buildNeighborContext } from './context/buildNeighborContext';
import type { SpeakControl, SpeakPlaybackState } from './components/sections/TtsSpeakButtons';

/* TTS 门面签名（与 src/features/tts 的 createTtsService() 对齐） */
type TtsService = {
  speak: (ownerId: string, text: string, lang: 'zh' | 'en') => Promise<void>;
  stop: () => void;
  subscribe: (listener: (state: SpeakPlaybackState) => void) => () => void;
};

/* Theme → wavy underline color (accent-1 from each theme) */
const THEME_UNDERLINE_COLORS: Record<PopoverThemeId, string> = {
  basic: '#0ea5e9',
  pro: '#3b82f6',
  creative: '#ed8936',
  galaxy: '#c084fc',
  neon: '#39ff14',
  cyberpunk: '#ff006e',
  aurora: '#67e8f9',
};

export class PopoverFeature {
  private readonly viewModel = new PopoverViewModel(new RuntimePopoverRepository(), createDefaultCardLifecycleService());

  private readonly view = new OriginalPopoverView(this.viewModel);

  private pendingSelection: PopoverSelectionData | null = null;

  /* Wavy underline highlight */
  private highlightRange: Range | null = null;
  private highlightStyle: HTMLStyleElement | null = null;

  private ctx: ContentScriptContext | null = null;

  private removeInvalidatedListener: (() => void) | null = null;

  private themeUnsubscribe: (() => void) | null = null;

  /* TTS 服务懒创建单例：状态经 speakStateListeners 扇出给视图 */
  private ttsService: TtsService | null = null;

  private ttsUnsubscribe: (() => void) | null = null;

  private readonly speakStateListeners = new Set<(state: SpeakPlaybackState) => void>();

  private readonly speakControl: SpeakControl = {
    speak: (request) => {
      void this.getTtsService()
        .speak(request.ownerId, request.text, request.lang)
        .catch(() => this.ttsService?.stop());
    },
    stop: () => {
      this.ttsService?.stop();
    },
    subscribe: (listener) => {
      this.speakStateListeners.add(listener);
      return () => {
        this.speakStateListeners.delete(listener);
      };
    },
  };

  private getTtsService(): TtsService {
    if (!this.ttsService) {
      this.ttsService = createTtsService();
      this.ttsUnsubscribe = this.ttsService.subscribe((state) => {
        for (const listener of this.speakStateListeners) {
          listener(state);
        }
      });
    }

    return this.ttsService;
  }

  start(ctx: ContentScriptContext) {
    this.ctx = ctx;
    this.view.setCallbacks({
      onTriggerActivate: () => {
        if (!this.pendingSelection) {
          return;
        }

        this.view.activateTrigger();
        this.viewModel.openSelection(this.pendingSelection);
        this.view.openAt(this.pendingSelection.lastLineRect ?? this.pendingSelection.rect);
      },
      onClose: () => {
        this.pendingSelection = null;
        this.speakControl.stop();
        this.clearSelectionHighlight();
        this.clearBrowserSelection();
        this.viewModel.close();
      },
      onCycleTheme: () => {
        this.viewModel.cycleTheme();
      },
      onToggleLexical: () => {
        this.viewModel.toggleLexicalCollapsed();
      },
      onSelectTab: (tab) => {
        this.viewModel.selectTab(tab);
      },
      onReloadPage: () => {
        window.location.reload();
      },
      onLike: () => {
        void this.viewModel.like();
      },
      onDislike: () => {
        const tab = this.viewModel.selectedTab.value;
        if (tab) {
          void this.viewModel.dislike(tab);
        }
      },
      onSpeak: this.speakControl,
    });

    if (ctx.isInvalid) {
      this.dispose();
      return;
    }

    ctx.addEventListener(document, 'mouseup', this.handleMouseUp);
    ctx.addEventListener(document, 'selectionchange', this.handleSelectionChange);
    ctx.addEventListener(document, 'pointerdown', this.handlePointerDown);
    ctx.addEventListener(window, 'scroll', this.handleViewportChange, true);
    ctx.addEventListener(window, 'resize', this.handleViewportChange);
    browser.runtime.onMessage.addListener(this.handleRuntimeMessage);

    this.removeInvalidatedListener = ctx.onInvalidated(() => {
      browser.runtime.onMessage.removeListener(this.handleRuntimeMessage);
      this.dispose();
    });

    /* Update wavy underline color when theme changes */
    this.themeUnsubscribe = this.viewModel.theme.subscribe((theme) => {
      this.updateHighlightColor(theme);
    });
  }

  private readonly handleRuntimeMessage = (message: unknown) => {
    if (isPopoverStreamEvent(message)) {
      this.viewModel.handleStreamEvent(message);
    }
  };

  private readonly handleViewportChange = () => {
    this.view.hideTrigger();

    if (!this.viewModel.isOpen.value) {
      this.pendingSelection = null;
      this.clearSelectionHighlight();
    }
  };

  private readonly handleSelectionChange = () => {
    if (this.viewModel.isOpen.value) {
      return;
    }

    if (window.getSelection()?.toString().trim()) {
      return;
    }

    this.pendingSelection = null;
    this.view.hideTrigger();
    this.clearSelectionHighlight();
  };

  private readonly handlePointerDown = (event: PointerEvent) => {
    if (this.view.containsEvent(event)) {
      return;
    }

    if (!window.getSelection()?.toString().trim()) {
      this.pendingSelection = null;
      this.view.hideTrigger();

      if (!this.viewModel.isOpen.value) {
        this.clearSelectionHighlight();
      }
    }
  };

  private readonly handleMouseUp = (event: MouseEvent) => {
    if (this.view.containsEvent(event)) {
      return;
    }

    this.ctx?.setTimeout(() => {
      const selectionData = this.readSelection();
      if (!selectionData) {
        if (!this.viewModel.isOpen.value) {
          this.view.hideTrigger();
          this.clearSelectionHighlight();
        }
        this.pendingSelection = null;
        return;
      }

      this.pendingSelection = selectionData;
      this.applySelectionHighlight();
      this.view.showTrigger(this.readTriggerRange());
    }, 10);
  };

  private readSelection(): PopoverSelectionData | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return null;
    }

    const text = selection.toString().replace(/\s+/g, ' ').trim();
    if (!text) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      return null;
    }

    const clientRects = range.getClientRects();
    const lastLineRect = clientRects.length > 0 ? clientRects[clientRects.length - 1] : rect;

    return {
      text,
      context: this.readContext(selection),
      trigger: 'text-selection',
      blockIndex: 0,
      sourceLabel: window.location.hostname,
      rect: toViewportRect(rect),
      lastLineRect: toViewportRect(lastLineRect),
    };
  }

  private readContext(selection: Selection) {
    const anchorNode = selection.anchorNode;
    if (!anchorNode) {
      return '';
    }

    const startElement = anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : (anchorNode as Element);
    const container = startElement?.closest('p, li, blockquote, article, section, div, h1, h2, h3, h4, h5, h6');
    if (!container) {
      return buildNeighborContext('', selection.toString(), '');
    }

    return buildNeighborContext(
      container.previousElementSibling?.textContent,
      container.textContent,
      container.nextElementSibling?.textContent,
    );
  }

  private readTriggerRange() {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      throw new Error('PopoverFeature: expected an active selection range for trigger placement.');
    }

    return selection.getRangeAt(0).cloneRange();
  }

  /* ── Wavy underline highlight ── */

  private applySelectionHighlight() {
    this.clearSelectionHighlight();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    const range = sel.getRangeAt(0).cloneRange();
    this.highlightRange = range;

    if (!('Highlight' in window)) return;

    const highlight = new Highlight(range);
    CSS.highlights.set('scan-explain-selection', highlight);

    if (!this.highlightStyle) {
      this.highlightStyle = document.createElement('style');
      this.highlightStyle.dataset.scanExplain = 'highlight';
      document.head.appendChild(this.highlightStyle);
    }

    const color = THEME_UNDERLINE_COLORS[this.viewModel.theme.value] ?? '#3b82f6';
    this.highlightStyle.textContent =
      `::highlight(scan-explain-selection) { text-decoration: underline wavy ${color}; text-decoration-skip-ink: none; text-underline-offset: 3px; background-color: transparent; }`;

    /* Preserve the browser's native selection background so it coexists with the custom underline. */
  }

  private clearSelectionHighlight() {
    if ('Highlight' in window) {
      CSS.highlights.delete('scan-explain-selection');
    }
    this.highlightRange = null;
  }

  private updateHighlightColor(theme: PopoverThemeId) {
    if (!this.highlightStyle || !this.highlightRange) return;
    const color = THEME_UNDERLINE_COLORS[theme] ?? '#3b82f6';
    this.highlightStyle.textContent =
      `::highlight(scan-explain-selection) { text-decoration: underline wavy ${color}; text-decoration-skip-ink: none; text-underline-offset: 3px; background-color: transparent; }`;
  }

  private clearBrowserSelection() {
    window.getSelection()?.removeAllRanges();
  }

  private dispose() {
    this.themeUnsubscribe?.();
    this.themeUnsubscribe = null;
    this.ttsUnsubscribe?.();
    this.ttsUnsubscribe = null;
    this.ttsService?.stop();
    this.ttsService = null;
    this.speakStateListeners.clear();
    this.view.destroy();
    this.clearSelectionHighlight();
    this.clearBrowserSelection();
    this.viewModel.dispose();
    this.removeInvalidatedListener?.();
    this.removeInvalidatedListener = null;
    this.ctx = null;
  }
}