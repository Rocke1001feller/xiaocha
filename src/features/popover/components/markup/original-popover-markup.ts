export type OriginalPopoverMarkupRefs = {
  popover: HTMLDivElement;
  header: HTMLDivElement;
  title: HTMLSpanElement;
  sectionTitle: HTMLSpanElement;
  phonetic: HTMLSpanElement;
  lexicalSection: HTMLDivElement;
  lexicalToggle: HTMLButtonElement;
  lexicalLoader: HTMLDivElement;
  definitionsList: HTMLUListElement;
  translationText: HTMLDivElement;
  contextualText: HTMLDivElement;
  themeButton: HTMLButtonElement;
  closeButton: HTMLButtonElement;
  themeLabel: HTMLSpanElement;
  exploration: HTMLDivElement;
};

export function createOriginalPopoverMarkup(shadowRoot: ShadowRoot): OriginalPopoverMarkupRefs {
  const popover = buildPopover();
  shadowRoot.appendChild(popover);

  return {
    popover,
    header: q(popover, '.modal-header'),
    title: q(popover, '.header-title'),
    sectionTitle: q(popover, '.section-title'),
    phonetic: q(popover, '.section-phonetic'),
    lexicalSection: q(popover, '.lexical-section'),
    lexicalToggle: q(popover, '.section-toggle-btn'),
    lexicalLoader: q(popover, '.context-loader'),
    definitionsList: q(popover, '.defs-list'),
    translationText: q(popover, '.translation .text'),
    contextualText: q(popover, '.contextual-analysis .text'),
    themeButton: q(popover, '[data-action="theme"]'),
    closeButton: q(popover, '[data-action="close"]'),
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
  popover.append(buildHeader(), contentBody, buildFooter());
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
  right.append(createHeaderButton('theme-toggle', 'Toggle theme', '🎨', 'theme'), createHeaderButton('', 'Close', '✕', 'close'));
  header.append(left, center, right);
  return header;
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
  headerRight.appendChild(toggle);
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
  contextBox.append(loader, buildTextBlock('translation'), buildTextBlock('contextual-analysis'));
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

function buildTextBlock(className: string) {
  const block = document.createElement('div');
  block.className = className;
  const text = document.createElement('div');
  text.className = 'text';
  block.appendChild(text);
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