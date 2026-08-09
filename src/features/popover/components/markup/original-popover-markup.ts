import { createSpeakButton } from '../sections/TtsSpeakButtons';

export type OriginalPopoverMarkupRefs = {
  popover: HTMLDivElement;
  header: HTMLDivElement;
  errorBanner: HTMLDivElement;
  errorMessage: HTMLSpanElement;
  errorReload: HTMLButtonElement;
  title: HTMLSpanElement;
  sectionTitle: HTMLSpanElement;
  phonetic: HTMLSpanElement;
  lexicalSection: HTMLDivElement;
  lexicalToggle: HTMLButtonElement;
  lexicalLoader: HTMLDivElement;
  definitionsList: HTMLUListElement;
  translationText: HTMLDivElement;
  contextualText: HTMLDivElement;
  selectionSpeak: HTMLButtonElement;
  translationSpeak: HTMLButtonElement;
  contextualSpeak: HTMLButtonElement;
  themeButton: HTMLButtonElement;
  closeButton: HTMLButtonElement;
  likeButton: HTMLButtonElement;
  dislikeButton: HTMLButtonElement;
  themeLabel: HTMLSpanElement;
  exploration: HTMLDivElement;
};

export function createOriginalPopoverMarkup(shadowRoot: ShadowRoot): OriginalPopoverMarkupRefs {
  const popover = buildPopover();
  shadowRoot.appendChild(popover);

  return {
    popover,
    header: q(popover, '.modal-header'),
    errorBanner: q(popover, '[data-role="error-banner"]'),
    errorMessage: q(popover, '[data-role="error-message"]'),
    errorReload: q(popover, '[data-role="error-reload"]'),
    title: q(popover, '.header-title'),
    sectionTitle: q(popover, '.section-title'),
    phonetic: q(popover, '.section-phonetic'),
    lexicalSection: q(popover, '.lexical-section'),
    lexicalToggle: q(popover, '.section-toggle-btn'),
    lexicalLoader: q(popover, '.context-loader'),
    definitionsList: q(popover, '.defs-list'),
    translationText: q(popover, '.translation .text'),
    contextualText: q(popover, '.contextual-analysis .text'),
    selectionSpeak: q(popover, '[data-speak-owner="selection"]'),
    translationSpeak: q(popover, '[data-speak-owner="translation"]'),
    contextualSpeak: q(popover, '[data-speak-owner="contextual"]'),
    themeButton: q(popover, '[data-action="theme"]'),
    closeButton: q(popover, '[data-action="close"]'),
    likeButton: q(popover, '[data-action="like"]'),
    dislikeButton: q(popover, '[data-action="dislike"]'),
    themeLabel: q(popover, '.footer-theme-label'),
    exploration: q(popover, '.pcss3t'),
  };
}

export function createOriginalTriggerElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'oow-selection-trigger-button';
  el.dataset.theme = 'pro';
  el.setAttribute('aria-haspopup', 'dialog');
  return el;
}

function buildPopover(): HTMLDivElement {
  const popover = document.createElement('div');
  popover.className = 'oow-popover';
  popover.id = 'oow-popover';
  popover.setAttribute('popover', 'auto');
  popover.setAttribute('aria-live', 'polite');
  popover.dataset.theme = 'pro';
  popover.dataset.placement = 'side';
  const contentBody = document.createElement('div');
  contentBody.className = 'content-body';
  contentBody.append(buildLexicalSection(), buildExplorationSection());
  popover.append(buildHeader(), buildErrorBanner(), contentBody, buildFooter());
  return popover;
}

function buildHeader(): HTMLDivElement {
  const header = document.createElement('div');
  header.className = 'modal-header';
  const left = document.createElement('div');
  left.className = 'header-left';
  const logo = document.createElement('span');
  logo.className = 'header-logo';
  logo.textContent = '小猹';
  left.appendChild(logo);

  const center = document.createElement('div');
  center.className = 'header-center';
  const title = document.createElement('span');
  title.className = 'header-title';
  title.setAttribute('aria-live', 'polite');
  center.appendChild(title);

  const right = document.createElement('div');
  right.className = 'header-right';
  right.append(
    createHeaderButton('theme-toggle', 'Toggle theme', '🎨', 'theme'),
    createHeaderButton('like', 'Like and save card', '👍', 'like'),
    createHeaderButton('dislike', 'Dislike and retry', '👎', 'dislike'),
    createHeaderButton('', 'Close', '✕', 'close'),
  );
  header.append(left, center, right);
  return header;
}

function buildErrorBanner(): HTMLDivElement {
  const banner = document.createElement('div');
  banner.className = 'error-banner';
  banner.dataset.role = 'error-banner';
  banner.style.cssText =
    'display:none;align-items:center;gap:8px;padding:8px 12px;background:#fef2f2;border-bottom:1px solid #fecaca;color:#991b1b;font-size:12px;line-height:1.4;';

  const icon = document.createElement('span');
  icon.textContent = '⚠️';

  const message = document.createElement('span');
  message.dataset.role = 'error-message';
  message.style.cssText = 'flex:1;';

  const reload = document.createElement('button');
  reload.dataset.role = 'error-reload';
  reload.type = 'button';
  reload.textContent = '刷新页面';
  reload.style.cssText =
    'padding:4px 10px;background:#dc2626;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;';

  banner.append(icon, message, reload);
  return banner;
}

function buildLexicalSection(): HTMLDivElement {
  const section = document.createElement('div');
  section.className = 'collapsible-section lexical-section is-expanded';
  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'section-header';
  sectionHeader.setAttribute('aria-expanded', 'true');
  const headerLeft = document.createElement('div');
  headerLeft.className = 'header-left';
  const title = document.createElement('span');
  title.className = 'section-title';
  title.textContent = 'Lexical';
  const phonetic = document.createElement('span');
  phonetic.className = 'section-phonetic';
  headerLeft.append(title, phonetic);
  const headerRight = document.createElement('div');
  headerRight.className = 'header-right';
  const toggle = document.createElement('button');
  toggle.className = 'section-toggle-btn';
  toggle.setAttribute('aria-label', 'Toggle section');
  toggle.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  headerRight.append(createSpeakButton('selection', '朗读选中文本'), toggle);
  sectionHeader.append(headerLeft, headerRight);

  const content = document.createElement('div');
  content.className = 'section-content';
  const panel = document.createElement('div');
  panel.className = 'lexical-panel part2-content';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Lexical information');
  const defsList = document.createElement('ul');
  defsList.className = 'defs-list';

  const contextBox = document.createElement('div');
  contextBox.className = 'lexical-context-box';
  const loader = document.createElement('div');
  loader.className = 'context-loader';
  loader.style.display = 'none';
  const eq = document.createElement('div');
  eq.className = 'eq';
  for (let index = 1; index <= 5; index += 1) {
    const bar = document.createElement('i');
    bar.className = `bar b${index}`;
    eq.appendChild(bar);
  }
  loader.appendChild(eq);
  contextBox.append(loader, buildTextBlock('translation', 'translation', '朗读翻译'), buildTextBlock('contextual-analysis', 'contextual', '朗读语境分析'));
  panel.append(defsList, contextBox);
  content.appendChild(panel);
  section.append(sectionHeader, content);
  return section;
}

function buildExplorationSection(): HTMLDivElement {
  const exploration = document.createElement('div');
  exploration.className = 'pcss3t pcss3t-effect-scale pcss3t-theme-1';
  const list = document.createElement('ul');
  list.dataset.role = 'task-panels';
  exploration.appendChild(list);
  return exploration;
}

function buildFooter(): HTMLDivElement {
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  const label = document.createElement('span');
  label.className = 'footer-theme-label';
  label.style.cssText = 'font-size:11px;color:var(--muted);padding:6px 12px;';
  label.textContent = 'Pro Dark · free';
  footer.appendChild(label);
  return footer;
}

function buildTextBlock(className: string, speakOwnerId?: string, speakAriaLabel?: string) {
  const block = document.createElement('div');
  block.className = className;
  const text = document.createElement('div');
  text.className = 'text';
  block.appendChild(text);
  if (speakOwnerId) {
    block.appendChild(createSpeakButton(speakOwnerId, speakAriaLabel ?? '朗读'));
  }
  return block;
}

function createHeaderButton(extraClass: string, ariaLabel: string, text: string, action: string) {
  const button = document.createElement('button');
  button.className = ['action-btn', extraClass].filter(Boolean).join(' ');
  button.setAttribute('aria-label', ariaLabel);
  button.textContent = text;
  button.dataset.action = action;
  return button;
}

function q<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`OriginalPopoverView: missing "${selector}"`);
  return element;
}