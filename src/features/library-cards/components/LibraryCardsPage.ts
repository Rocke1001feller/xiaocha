import type { CardLibraryController } from '../viewmodels/CardLibraryController';
import { CardPanelView, type CardPanelRefs } from './CardPanelView';
import { LIBRARY_CARDS_PAGE_TEMPLATE } from './libraryCardsPageTemplate';

export type LibraryCardsPageHooks = {
  getCopy: () => Record<string, string>;
  onOpenSettings: () => void;
};

export class LibraryCardsPage {
  private readonly cardPanelView: CardPanelView;

  private readonly unsubscribe: () => void;

  constructor(
    private readonly container: HTMLElement,
    private readonly cardLibrary: CardLibraryController,
    private readonly hooks: LibraryCardsPageHooks,
  ) {
    this.container.innerHTML = LIBRARY_CARDS_PAGE_TEMPLATE;
    this.applyCopy(this.hooks.getCopy());

    const refs = this.resolveRefs();

    this.cardPanelView = new CardPanelView(
      this.cardLibrary,
      refs,
      {
        confirmAction: (message) => this.confirmAction(message),
        getCopy: () => this.hooks.getCopy(),
      },
    );

    this.attachWheelAdapter(refs.galleryWrapper);
    this.bindHeaderActions();
    this.cardPanelView.bindEvents();

    this.unsubscribe = this.cardLibrary.cards.subscribe(() => {
      this.cardPanelView.render();
      this.applyCopy(this.hooks.getCopy());
    });

    this.cardLibrary.query.subscribe(() => this.cardPanelView.render());
    this.cardLibrary.filter.subscribe(() => this.cardPanelView.render());
    this.cardLibrary.galleryOffset.subscribe(() => this.cardPanelView.render());
    this.cardLibrary.selectedCardId.subscribe(() => this.cardPanelView.render());
    this.cardLibrary.editingCardId.subscribe(() => this.cardPanelView.render());
    this.cardLibrary.draft.subscribe(() => this.cardPanelView.render());
    this.cardLibrary.isDirty.subscribe(() => this.cardPanelView.render());
    this.cardLibrary.isSaving.subscribe(() => this.cardPanelView.render());
    this.cardLibrary.feedback.subscribe(() => this.cardPanelView.render());

    this.cardPanelView.render();
  }

  destroy() {
    this.unsubscribe();
    this.container.replaceChildren();
  }

  private resolveRefs(): CardPanelRefs {
    return {
      galleryWrapper: this.requireElement('.cards-wrapper'),
      galleryList: this.requireElement('#cards-gallery-list'),
      searchInput: this.requireElement('#card-search'),
      categoryFilter: this.requireElement('#card-category-filter'),
      tagFilter: this.requireElement('#card-tag-filter'),
      pinnedFilter: this.requireElement('#card-pinned-filter'),
      clearFiltersButton: this.requireElement('#card-clear-filters'),
      resultsSummary: this.requireElement('#card-results-summary'),
      tableBody: this.requireElement('#card-table-body'),
      navCount: this.requireElement('#nav-cards-count'),
    };
  }

  private bindHeaderActions() {
    const settingsButton = this.container.querySelector<HTMLElement>('[data-action="open-settings"]');
    settingsButton?.addEventListener('click', () => {
      this.hooks.onOpenSettings();
    });
  }

  private attachWheelAdapter(wrapper: HTMLElement) {
    wrapper.addEventListener(
      'wheel',
      (event) => {
        const wheelEvent = event as WheelEvent;
        if (Math.abs(wheelEvent.deltaY) <= Math.abs(wheelEvent.deltaX)) {
          return;
        }
        wheelEvent.preventDefault();
        wrapper.scrollLeft += wheelEvent.deltaY;
      },
      { passive: false },
    );
  }

  private applyCopy(copy: Record<string, string>) {
    this.container.querySelectorAll<HTMLElement>('[data-copy]').forEach((element) => {
      const key = element.dataset.copy;
      if (key && copy[key]) {
        element.textContent = copy[key];
      }
    });

    this.container.querySelectorAll<HTMLInputElement>('[data-copy-placeholder]').forEach((element) => {
      const key = element.dataset.copyPlaceholder;
      if (key && copy[key]) {
        element.placeholder = copy[key];
      }
    });
  }

  private confirmAction(message: string) {
    if (typeof globalThis.confirm !== 'function') {
      return true;
    }

    return globalThis.confirm(message);
  }

  private requireElement<T extends HTMLElement>(selector: string): T {
    const element = this.container.querySelector<T>(selector);
    if (!element) {
      throw new Error(`Missing element for selector: ${selector}`);
    }
    return element;
  }
}
