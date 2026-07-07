export type PopoverMarkupRefs = {
  root: HTMLDivElement;
  trigger: HTMLDivElement;
  triggerButton: HTMLButtonElement;
  popover: HTMLDivElement;
  header: HTMLElement;
  title: HTMLDivElement;
  provider: HTMLDivElement;
  themeChip: HTMLSpanElement;
  themeButton: HTMLButtonElement;
  closeButton: HTMLButtonElement;
  lexicalSection: HTMLElement;
  lexicalBody: HTMLElement;
  lexicalToggle: HTMLButtonElement;
  lexicalLoading: HTMLElement;
  lexicalError: HTMLElement;
  phonetic: HTMLElement;
  translation: HTMLElement;
  contextual: HTMLElement;
  definitions: HTMLUListElement;
  taskTabs: HTMLElement;
  taskPanels: HTMLElement;
};

export function createPopoverMarkup(shadowRoot: ShadowRoot): PopoverMarkupRefs {
  const root = document.createElement('div');
  root.className = 'scanex-root';
  root.innerHTML = renderStaticMarkup();
  shadowRoot.appendChild(root);

  return {
    root,
    trigger: requireElement(root, '.scanex-trigger'),
    triggerButton: requireElement(root, '.scanex-trigger-button'),
    popover: requireElement(root, '.scanex-popover'),
    header: requireElement(root, '.scanex-header'),
    title: requireElement(root, '.scanex-title'),
    provider: requireElement(root, '.scanex-provider'),
    themeChip: requireElement(root, '.scanex-theme-chip'),
    themeButton: requireElement(root, '[data-action="theme"]'),
    closeButton: requireElement(root, '[data-action="close"]'),
    lexicalSection: requireElement(root, '.scanex-lexical'),
    lexicalBody: requireElement(root, '.scanex-lexical-body'),
    lexicalToggle: requireElement(root, '.scanex-lexical-toggle'),
    lexicalLoading: requireElement(root, '[data-role="lexical-loading"]'),
    lexicalError: requireElement(root, '[data-role="lexical-error"]'),
    phonetic: requireElement(root, '.scanex-phonetic'),
    translation: requireElement(root, '.scanex-translation'),
    contextual: requireElement(root, '.scanex-contextual'),
    definitions: requireElement(root, '.scanex-definitions'),
    taskTabs: requireElement(root, '[data-role="task-tabs"]'),
    taskPanels: requireElement(root, '[data-role="task-panels"]'),
  };
}

export function renderStaticMarkup() {
  return `
    <div class="scanex-trigger" data-visible="false">
      <button class="scanex-trigger-button" type="button" aria-label="Open 查单词，用小猹">释</button>
    </div>
    <div class="scanex-popover" popover="manual" data-theme="pro" hidden>
      <div class="scanex-shell">
        <header class="scanex-header" data-dragging="false">
          <div class="scanex-brand">
            <span class="scanex-brand-mark">小猹</span>
            <div>
              <div class="scanex-title">查单词，用小猹</div>
              <div class="scanex-provider">Waiting for provider</div>
            </div>
          </div>
          <div class="scanex-actions">
            <button class="scanex-action" data-action="theme" type="button">Theme</button>
            <button class="scanex-action" data-action="close" type="button">Close</button>
          </div>
        </header>

        <section class="scanex-lexical" data-collapsed="false">
          <button class="scanex-lexical-toggle" type="button">
            <span>Lexical</span>
            <span>▾</span>
          </button>
          <div class="scanex-lexical-body">
            <div class="scanex-status" data-role="lexical-loading" hidden>Loading lexical analysis…</div>
            <div class="scanex-error" data-role="lexical-error"></div>
            <div class="scanex-phonetic"></div>
            <div class="scanex-translation"></div>
            <div class="scanex-contextual"></div>
            <ul class="scanex-definitions"></ul>
          </div>
        </section>

        <nav class="scanex-tabs" data-role="task-tabs"></nav>
        <div data-role="task-panels"></div>

        <footer class="scanex-footer">
          <span class="scanex-theme-chip">Pro Dark · free</span>
          <span>3 free themes, 4 premium themes</span>
        </footer>
      </div>
    </div>
  `;
}

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element for selector: ${selector}`);
  return element;
}