import type { ExplainTaskState, LexicalDefinition } from '../../../../src/llm/types';
import type { TaskId } from '../../../shared/task-ids';
import { POPOVER_THEMES, type ViewportRect } from '../events/PopoverEvents';
import popoverStyles from '../styles/popover';
import type { PopoverViewModel } from '../viewmodels/PopoverViewModel';
import { createPopoverMarkup } from './markup/popover-markup';
import { createDragBehavior } from './sections/DragBehavior';
import { renderLexicalState as applyLexicalState, replaceDefinitionList } from './sections/LexicalSection';
import { renderStaticMarkdown } from './sections/MarkdownSection';
import {
  createModernTaskRuntimes,
  disposeModernTaskRuntimes,
  renderModernTaskStates,
  type ModernTaskPanelRuntime,
  updateModernTaskSelection,
} from './sections/ModernTaskSurfaces';

type PopoverCallbacks = {
  onTriggerActivate: () => void;
  onClose: () => void;
  onCycleTheme: () => void;
  onToggleLexical: () => void;
  onSelectTab: (tab: TaskId) => void;
};
export class PopoverView {
  private readonly host: HTMLDivElement;
  private readonly shadowRootRef: ShadowRoot;
  private readonly refs;
  private readonly drag;
  private taskRuntimes = new Map<TaskId, ModernTaskPanelRuntime>();
  private callbacks: PopoverCallbacks | null = null;
  private unsubscribers: Array<() => void> = [];

  constructor(viewModel: PopoverViewModel) {
    this.host = document.createElement('div');
    this.host.id = 'scan-explain-popover-root';
    document.documentElement.appendChild(this.host);
    this.shadowRootRef = this.host.attachShadow({ mode: 'open' });
    const styleElement = document.createElement('style');
    styleElement.textContent = popoverStyles;
    this.shadowRootRef.appendChild(styleElement);
    this.refs = createPopoverMarkup(this.shadowRootRef);
    this.drag = createDragBehavior({
      getPosition: () => ({ left: this.refs.popover.offsetLeft, top: this.refs.popover.offsetTop }),
      applyPosition: ({ left, top }) => {
        this.refs.popover.style.left = `${left}px`;
        this.refs.popover.style.top = `${top}px`;
      },
      setDragging: (active) => this.refs.header.setAttribute('data-dragging', String(active)),
    });
    this.bindStaticEvents();
    this.subscribeToViewModel(viewModel);
  }
  setCallbacks(callbacks: PopoverCallbacks) { this.callbacks = callbacks; }
  containsEvent(event: Event) { return event.composedPath().includes(this.host); }
  showTrigger(rect: ViewportRect) {
    this.refs.trigger.style.left = `${Math.min(window.innerWidth - 52, rect.right + 6)}px`;
    this.refs.trigger.style.top = `${Math.max(8, rect.top - 10)}px`;
    this.refs.trigger.dataset.visible = 'true';
  }
  hideTrigger() { this.refs.trigger.dataset.visible = 'false'; }
  openAt(rect: ViewportRect) {
    this.positionPopover(rect);
    this.refs.popover.hidden = false;
    if (typeof this.refs.popover.showPopover === 'function') try { this.refs.popover.showPopover(); } catch {}
  }
  close() {
    if (typeof this.refs.popover.hidePopover === 'function') try { this.refs.popover.hidePopover(); } catch {}
    this.refs.popover.hidden = true;
  }
  destroy() {
    this.drag.dispose();
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers = [];
    disposeModernTaskRuntimes(this.taskRuntimes);
    this.host.remove();
  }
  private subscribeToViewModel(viewModel: PopoverViewModel) {
    this.unsubscribers.push(viewModel.title.subscribe((title) => { this.refs.title.textContent = title; }));
    this.unsubscribers.push(viewModel.providerLabel.subscribe((label) => { this.refs.provider.textContent = label ?? 'Waiting for provider'; }));
    this.unsubscribers.push(viewModel.theme.subscribe((theme) => {
      this.refs.popover.dataset.theme = theme;
      const activeTheme = POPOVER_THEMES.find((entry) => entry.id === theme);
      this.refs.themeChip.textContent = activeTheme ? `${activeTheme.name} · ${activeTheme.tier}` : theme;
    }));
    this.unsubscribers.push(viewModel.isOpen.subscribe((isOpen) => { if (!isOpen) this.close(); }));
    this.unsubscribers.push(viewModel.lexicalCollapsed.subscribe((collapsed) => {
      this.refs.lexicalSection.dataset.collapsed = String(collapsed);
      this.refs.lexicalBody.hidden = collapsed;
    }));
    this.unsubscribers.push(viewModel.tasks.subscribe(() => { this.renderTaskSurfaces(viewModel); }));
    this.unsubscribers.push(viewModel.selectedTab.subscribe((tab) => {
      updateModernTaskSelection(this.taskRuntimes.values(), tab);
      renderModernTaskStates(this.taskRuntimes.values(), (taskId) => viewModel.getTaskState(taskId));
    }));
    this.unsubscribers.push(viewModel.lexicalState.subscribe((state) => { this.updateLexicalState(state); }));
    this.unsubscribers.push(viewModel.taskStates.subscribe(() => {
      renderModernTaskStates(this.taskRuntimes.values(), (taskId) => viewModel.getTaskState(taskId));
    }));
  }
  private bindStaticEvents() {
    this.refs.triggerButton.addEventListener('pointerenter', () => { this.callbacks?.onTriggerActivate(); });
    this.refs.triggerButton.addEventListener('click', () => { this.callbacks?.onTriggerActivate(); });
    this.refs.themeButton.addEventListener('click', () => { this.callbacks?.onCycleTheme(); });
    this.refs.closeButton.addEventListener('click', () => { this.callbacks?.onClose(); });
    this.refs.lexicalToggle.addEventListener('click', () => { this.callbacks?.onToggleLexical(); });
    this.refs.header.addEventListener('pointerdown', (event) => {
      if ((event.target as HTMLElement | null)?.closest('button')) return;
      this.drag.start(event);
    });
  }
  private renderTaskSurfaces(viewModel: PopoverViewModel) {
    disposeModernTaskRuntimes(this.taskRuntimes);
    this.taskRuntimes = createModernTaskRuntimes(
      this.refs.taskTabs,
      this.refs.taskPanels,
      viewModel.getTabTasks(),
      (taskId) => { this.callbacks?.onSelectTab(taskId); },
    );
    updateModernTaskSelection(this.taskRuntimes.values(), viewModel.selectedTab.value);
    renderModernTaskStates(this.taskRuntimes.values(), (taskId) => viewModel.getTaskState(taskId));
  }
  private updateLexicalState(state: ExplainTaskState) {
    applyLexicalState(state, {
      setLoadingVisible: (visible) => { this.refs.lexicalLoading.hidden = !visible; },
      setErrorMessage: (message) => { this.refs.lexicalError.textContent = message; },
      setPhonetic: (value) => { this.refs.phonetic.textContent = value; },
      renderTranslation: (value) => { this.renderCard(this.refs.translation, 'Translation', value); },
      renderContextual: (value) => { this.renderCard(this.refs.contextual, 'Context', value); },
      renderDefinitions: (definitions) => replaceDefinitionList(this.refs.definitions, definitions, (definition) => this.renderDefinition(definition)),
    });
  }
  private renderCard(container: HTMLElement, label: string, value?: string) {
    container.replaceChildren();
    if (!value?.trim()) return void (container.hidden = true);
    container.hidden = false;
    const card = document.createElement('div');
    card.className = 'scanex-card';
    const labelElement = document.createElement('div');
    labelElement.className = 'scanex-card-label';
    labelElement.textContent = label;
    const body = document.createElement('div');
    body.className = 'scanex-card-body';
    renderStaticMarkdown(body, value);
    card.append(labelElement, body);
    container.appendChild(card);
  }
  private renderDefinition(definition: LexicalDefinition) {
    const item = document.createElement('li');
    item.className = 'scanex-definition';
    const head = document.createElement('div');
    head.className = 'scanex-definition-head';
    if (definition.pos) {
      head.appendChild(Object.assign(document.createElement('span'), { className: 'scanex-definition-pos', textContent: definition.pos }));
    }
    const meaning = document.createElement('div');
    renderStaticMarkdown(meaning, definition.meaning ?? '');
    head.appendChild(meaning);
    item.appendChild(head);
    if (definition.example?.source || definition.example?.target) {
      const example = document.createElement('div');
      example.className = 'scanex-definition-example';
      if (definition.example.source) example.appendChild(Object.assign(document.createElement('div'), { textContent: definition.example.source }));
      if (definition.example.target) example.appendChild(Object.assign(document.createElement('div'), { textContent: definition.example.target }));
      item.appendChild(example);
    }
    return item;
  }
  private positionPopover(rect: ViewportRect) {
    const spacing = 12;
    const margin = 8;
    const wasHidden = this.refs.popover.hidden;
    const previousVisibility = this.refs.popover.style.visibility;
    this.refs.popover.hidden = false;
    this.refs.popover.style.visibility = 'hidden';
    const measured = this.refs.popover.getBoundingClientRect();
    const width = measured.width || 420;
    const height = measured.height || 560;
    const left = rect.left > window.innerWidth / 2
      ? Math.max(margin, rect.left - width - spacing)
      : Math.min(window.innerWidth - width - margin, rect.right + spacing);
    const top = Math.min(Math.max(margin, rect.top - 24), Math.max(margin, window.innerHeight - height - margin));
    this.refs.popover.style.left = `${left}px`;
    this.refs.popover.style.top = `${top}px`;
    this.refs.popover.style.visibility = previousVisibility;
    this.refs.popover.hidden = wasHidden;
  }
}