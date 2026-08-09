import type { ExplainTaskState } from '../../../../src/llm/types';
import type { TaskId } from '../../../shared/task-ids';
import { POPOVER_THEMES, type PopoverThemeId, type ViewportRect } from '../events/PopoverEvents';
import originalStyles from '../styles/original-themes';
import type { PopoverViewModel } from '../viewmodels/PopoverViewModel';
import { createOriginalPopoverMarkup } from './markup/original-popover-markup';
import { createDragBehavior } from './sections/DragBehavior';
import { bindPopoverSpeak, type SpeakControl } from './sections/TtsSpeakButtons';
import { renderLexicalState as applyLexicalState, renderDefinition, replaceDefinitionList } from './sections/LexicalSection';
import { renderStaticMarkdown } from './sections/MarkdownSection';
import { positionPopover } from './sections/OriginalPopoverPositioning';
import { mountInlineTrigger, removeInlineTrigger } from './sections/OriginalPopoverTriggerMount';
import {
  createOriginalTaskRuntimes,
  disposeOriginalTaskRuntimes,
  renderOriginalTaskStates,
  type OriginalTaskPanelRuntime,
  updateOriginalTaskSelection,
} from './sections/OriginalTaskSurfaces';

type PopoverCallbacks = {
  onTriggerActivate: () => void;
  onClose: () => void;
  onCycleTheme: () => void;
  onToggleLexical: () => void;
  onSelectTab: (tab: TaskId) => void;
  onReloadPage: () => void;
  onLike: () => void;
  onDislike: () => void;
  onSpeak: SpeakControl;
};
export class OriginalPopoverView {
  private readonly host: HTMLDivElement;
  private readonly shadow: ShadowRoot;
  private readonly refs;
  private readonly drag;
  private triggerHost: HTMLSpanElement | null = null;
  private triggerElement: HTMLDivElement | null = null;
  private currentTheme: PopoverThemeId = 'pro';
  private taskRuntimes = new Map<TaskId, OriginalTaskPanelRuntime>();
  private callbacks: PopoverCallbacks | null = null;
  private unsubscribers: Array<() => void> = [];

  constructor(private readonly viewModel: PopoverViewModel) {
    this.host = document.createElement('div');
    this.host.id = 'scan-explain-popover-root';
    document.documentElement.appendChild(this.host);
    this.shadow = this.host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = originalStyles;
    this.shadow.appendChild(style);
    this.refs = createOriginalPopoverMarkup(this.shadow);
    this.drag = createDragBehavior({
      getPosition: () => {
        const styles = getComputedStyle(this.refs.popover);
        return {
          left: parseInt(styles.getPropertyValue('--oow-modal-left'), 10) || this.refs.popover.offsetLeft,
          top: parseInt(styles.getPropertyValue('--oow-modal-top'), 10) || this.refs.popover.offsetTop,
        };
      },
      applyPosition: ({ left, top }) => {
        this.refs.popover.style.setProperty('--oow-modal-left', `${left}px`);
        this.refs.popover.style.setProperty('--oow-modal-top', `${top}px`);
      },
      setDragging: (active) => { this.refs.header.classList.toggle('is-dragging', active); },
    });
    this.bindStaticEvents();
    this.subscribeToViewModel(viewModel);
  }
  setCallbacks(callbacks: PopoverCallbacks) {
    this.callbacks = callbacks;
    this.unsubscribers.push(bindPopoverSpeak({ root: this.shadow, viewModel: this.viewModel, control: callbacks.onSpeak }).dispose);
  }
  containsEvent(event: Event) {
    const path = event.composedPath();
    return path.includes(this.host) || (this.triggerHost ? path.includes(this.triggerHost) : false);
  }
  showTrigger(range: Range) {
    this.hideTrigger();
    const { triggerHost, triggerElement } = mountInlineTrigger(range, this.currentTheme, () => {
      this.callbacks?.onTriggerActivate();
    });
    this.triggerHost = triggerHost;
    this.triggerElement = triggerElement;
    this.triggerElement.classList.add('visible');
    this.triggerElement.classList.remove('hidden');
  }
  hideTrigger() {
    removeInlineTrigger(this.triggerHost);
    this.triggerHost = null;
    this.triggerElement = null;
  }
  activateTrigger() { this.triggerElement?.classList.add('activated'); }
  openAt(rect: ViewportRect) {
    positionPopover(this.refs.popover, rect);
    this.refs.popover.classList.add('is-visible');
    this.refs.popover.classList.remove('is-hidden');
    if (typeof this.refs.popover.showPopover === 'function') try { this.refs.popover.showPopover(); } catch {}
  }
  close() {
    if (typeof this.refs.popover.hidePopover === 'function') try { this.refs.popover.hidePopover(); } catch {}
    this.refs.popover.classList.remove('is-visible', 'is-positioned');
    this.refs.popover.classList.add('is-hidden');
  }
  destroy() {
    this.drag.dispose();
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers = [];
    disposeOriginalTaskRuntimes(this.taskRuntimes);
    removeInlineTrigger(this.triggerHost);
    this.triggerHost = null;
    this.triggerElement = null;
    this.host.remove();
  }
  private bindStaticEvents() {
    this.refs.themeButton.addEventListener('click', () => { this.callbacks?.onCycleTheme(); });
    this.refs.closeButton.addEventListener('click', () => { this.callbacks?.onClose(); });
    this.refs.likeButton.addEventListener('click', () => { this.callbacks?.onLike(); });
    this.refs.dislikeButton.addEventListener('click', () => { this.callbacks?.onDislike(); });
    this.refs.lexicalToggle.addEventListener('click', () => { this.callbacks?.onToggleLexical(); });
    this.refs.errorReload.addEventListener('click', () => { this.callbacks?.onReloadPage(); });
    this.refs.header.addEventListener('pointerdown', (event) => {
      if ((event.target as HTMLElement | null)?.closest('button')) return;
      this.drag.start(event);
    });
  }
  private subscribeToViewModel(viewModel: PopoverViewModel) {
    this.unsubscribers.push(viewModel.title.subscribe((title) => {
      this.refs.title.textContent = title;
      this.refs.sectionTitle.textContent = title;
    }));
    this.unsubscribers.push(viewModel.theme.subscribe((theme) => {
      this.currentTheme = theme;
      this.refs.popover.dataset.theme = theme;
      if (this.triggerElement) {
        this.triggerElement.dataset.theme = theme;
      }
      const meta = POPOVER_THEMES.find((entry) => entry.id === theme);
      this.refs.themeLabel.textContent = meta ? `${meta.name} · ${meta.tier}` : theme;
    }));
    this.unsubscribers.push(viewModel.isOpen.subscribe((isOpen) => { if (!isOpen) { this.close(); this.hideTrigger(); } }));
    this.unsubscribers.push(viewModel.lexicalCollapsed.subscribe((collapsed) => {
      this.refs.lexicalSection.classList.toggle('is-expanded', !collapsed);
      this.refs.lexicalSection.classList.toggle('is-collapsed', collapsed);
    }));
    this.unsubscribers.push(viewModel.tasks.subscribe(() => { this.renderTaskSurfaces(viewModel); }));
    this.unsubscribers.push(viewModel.selectedTab.subscribe((tab) => {
      updateOriginalTaskSelection(this.taskRuntimes.values(), tab);
      renderOriginalTaskStates(this.taskRuntimes.values(), (taskId) => viewModel.getTaskState(taskId));
    }));
    this.unsubscribers.push(viewModel.lexicalState.subscribe((state) => { this.updateLexicalState(state); }));
    this.unsubscribers.push(viewModel.taskStates.subscribe(() => {
      renderOriginalTaskStates(this.taskRuntimes.values(), (taskId) => viewModel.getTaskState(taskId));
    }));
    this.unsubscribers.push(viewModel.errorMessage.subscribe((message) => {
      this.updateErrorBanner(message);
    }));
    this.unsubscribers.push(viewModel.isSaving.subscribe((isSaving) => {
      this.refs.likeButton.disabled = isSaving || viewModel.savedCardId.value != null;
    }));
    this.unsubscribers.push(viewModel.savedCardId.subscribe((cardId) => {
      this.refs.likeButton.disabled = cardId != null;
      this.refs.likeButton.textContent = cardId != null ? '✅' : '👍';
    }));
    this.unsubscribers.push(viewModel.isRetrying.subscribe((isRetrying) => {
      this.refs.dislikeButton.disabled = isRetrying;
    }));
  }
  private renderTaskSurfaces(viewModel: PopoverViewModel) {
    disposeOriginalTaskRuntimes(this.taskRuntimes);
    this.taskRuntimes = createOriginalTaskRuntimes(
      this.refs.exploration,
      viewModel.getTabTasks(),
      (taskId) => { this.callbacks?.onSelectTab(taskId); },
    );
    updateOriginalTaskSelection(this.taskRuntimes.values(), viewModel.selectedTab.value);
    renderOriginalTaskStates(this.taskRuntimes.values(), (taskId) => viewModel.getTaskState(taskId));
  }
  private updateLexicalState(state: ExplainTaskState) {
    applyLexicalState(state, {
      setLoadingVisible: (visible) => { this.refs.lexicalLoader.style.display = visible ? 'grid' : 'none'; },
      setPhonetic: (value) => { this.refs.phonetic.textContent = value ? ` ${value}` : ''; },
      renderTranslation: (value) => {
        this.refs.translationText.replaceChildren();
        if (value) renderStaticMarkdown(this.refs.translationText, value);
      },
      renderContextual: (value) => {
        this.refs.contextualText.replaceChildren();
        if (value) renderStaticMarkdown(this.refs.contextualText, value);
      },
      renderDefinitions: (definitions) => replaceDefinitionList(this.refs.definitionsList, definitions, renderDefinition),
    });
  }

  private updateErrorBanner(message: string | null) {
    const hasMessage = message != null && message !== '';
    this.refs.errorBanner.style.display = hasMessage ? 'flex' : 'none';
    this.refs.errorMessage.textContent = message ?? '';
  }
}
