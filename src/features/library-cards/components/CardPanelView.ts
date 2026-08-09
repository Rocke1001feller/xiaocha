import type { CardCategory, CardId } from '../../card/types';
import { isValidCardCategory } from '../../card/types';
import type { CardLibraryController } from '../viewmodels/CardLibraryController';
import type { CardDraft, CardListItem, CardListViewState } from '../viewmodels/CardLibraryController';

export type CardPanelRefs = {
  galleryWrapper: HTMLElement;
  galleryList: HTMLElement;
  searchInput: HTMLInputElement;
  categoryFilter: HTMLSelectElement;
  tagFilter: HTMLSelectElement;
  pinnedFilter: HTMLSelectElement;
  clearFiltersButton: HTMLButtonElement;
  resultsSummary: HTMLElement;
  tableBody: HTMLElement;
  navCount: HTMLElement;
};

type CardPanelHooks = {
  confirmAction: (message: string) => boolean;
  getCopy: () => Record<string, string>;
};

const PINNED_FILTER_OPTIONS: Array<{ value: 'all' | 'pinned' | 'unpinned'; copyKey: string }> = [
  { value: 'all', copyKey: 'cardPinnedFilterAll' },
  { value: 'pinned', copyKey: 'cardPinnedFilterPinned' },
  { value: 'unpinned', copyKey: 'cardPinnedFilterUnpinned' },
];

export class CardPanelView {
  constructor(
    private readonly cardLibrary: CardLibraryController,
    private readonly refs: CardPanelRefs,
    private readonly hooks: CardPanelHooks,
  ) {}

  bindEvents() {
    this.refs.searchInput.addEventListener('input', () => {
      this.cardLibrary.setQuery(this.refs.searchInput.value);
    });

    this.refs.categoryFilter.addEventListener('change', () => {
      const value = this.refs.categoryFilter.value;
      this.cardLibrary.setFilterCategory(isValidCardCategory(value) ? value : '');
    });

    this.refs.tagFilter.addEventListener('change', () => {
      this.cardLibrary.setFilterTag(this.refs.tagFilter.value);
    });

    this.refs.pinnedFilter.addEventListener('change', () => {
      const value = this.refs.pinnedFilter.value;
      if (value === 'all' || value === 'pinned' || value === 'unpinned') {
        this.cardLibrary.setFilterPinned(value);
      }
    });

    this.refs.clearFiltersButton.addEventListener('click', () => {
      this.cardLibrary.clearFilters();
    });

    this.refs.tableBody.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const button = target.closest<HTMLButtonElement>('[data-action][data-card-id]');
      if (!button) {
        return;
      }

      const action = button.dataset.action;
      const cardId = button.dataset.cardId as CardId;

      if (action === 'open') {
        this.cardLibrary.openCard(cardId);
        return;
      }

      if (action === 'edit') {
        if (!this.canProceedWithDraftDiscard('select')) {
          return;
        }
        this.cardLibrary.beginInlineEdit(cardId);
        return;
      }

      if (action === 'pin') {
        void this.cardLibrary.togglePinned(cardId);
        return;
      }

      if (action === 'delete') {
        if (!this.canProceedWithDraftDiscard('delete')) {
          return;
        }
        void this.cardLibrary.deleteCard(cardId);
      }
    });
  }

  render() {
    const copy = this.hooks.getCopy();
    const libraryCopy = this.cardLibrary.getCardEditorViewState();
    const listState = this.cardLibrary.getCardListViewState();

    this.refs.navCount.textContent = String(listState.navCount);
    this.renderGallery(listState, copy);
    this.renderFilters(listState, copy);
    this.renderResultsSummary(listState, copy);
    this.renderTable(listState, libraryCopy, copy);
  }

  private renderGallery(listState: CardListViewState, copy: Record<string, string>) {
    if (listState.items.length === 0) {
      this.refs.galleryList.innerHTML = `
        <li class="card-empty-gallery-item">
          <div class="empty-state">
            <h4>${copy.cardEmptyGallery}</h4>
          </div>
        </li>
      `;
      return;
    }

    this.refs.galleryList.innerHTML = listState.items
      .map((card) => `
        <li>
          <img draggable="false" src="${card.coverUri}" alt="${copy.cardCoverAlt.replace('{{title}}', this.escapeHtml(card.title))}" />
        </li>
      `)
      .join('');
  }

  private renderFilters(listState: CardListViewState, copy: Record<string, string>) {
    const { category, tag, pinned } = this.cardLibrary.filter.value;

    const categories: Array<{ value: CardCategory | ''; label: string }> = [
      { value: '', label: copy.cardCategoryFilterAll },
      { value: 'word', label: copy.cardCategoryWord },
      { value: 'phrase', label: copy.cardCategoryPhrase },
      { value: 'term', label: copy.cardCategoryTerm },
      { value: 'concept', label: copy.cardCategoryConcept },
      { value: 'sentence', label: copy.cardCategorySentence },
      { value: 'general', label: copy.cardCategoryGeneral },
    ];

    this.refs.categoryFilter.innerHTML = categories
      .map((option) => `<option value="${option.value}" ${option.value === category ? 'selected' : ''}>${option.label}</option>
      `)
      .join('');

    const tags: Array<{ value: string; label: string }> = [
      { value: '', label: copy.cardTagFilterAll },
      ...listState.tags.map((t) => ({ value: t, label: t })),
    ];

    this.refs.tagFilter.innerHTML = tags
      .map((option) => `<option value="${option.value}" ${option.value === tag ? 'selected' : ''}>${option.label}</option>
      `)
      .join('');

    this.refs.pinnedFilter.innerHTML = PINNED_FILTER_OPTIONS.map((option) =>
      `<option value="${option.value}" ${option.value === pinned ? 'selected' : ''}>${copy[option.copyKey]}</option>`
    ).join('');

    this.refs.searchInput.value = this.cardLibrary.query.value;
    this.refs.clearFiltersButton.disabled = listState.activeFilterCount === 0;
  }

  private renderResultsSummary(listState: CardListViewState, copy: Record<string, string>) {
    let text = copy.cardResultsSummary
      .replace('{{filtered}}', String(listState.filteredCount))
      .replace('{{total}}', String(listState.totalCount));

    if (listState.activeFilterCount > 0) {
      text += ` · ${copy.cardResultsActiveFilters.replace('{{count}}', String(listState.activeFilterCount))}`;
    }

    this.refs.resultsSummary.textContent = text;
  }

  private renderTable(
    listState: CardListViewState,
    editorState: ReturnType<CardLibraryController['getCardEditorViewState']>,
    copy: Record<string, string>,
  ) {
    if (listState.items.length === 0) {
      this.refs.tableBody.innerHTML = `
        <div class="empty-state">
          <h4>${copy.cardEmptyTable}</h4>
        </div>
      `;
      return;
    }

    this.refs.tableBody.innerHTML = listState.items
      .map((card) => {
        const rowHtml = this.renderTableRow(card, listState.editingCardId, copy);
        const editorHtml =
          listState.editingCardId === card.id
            ? this.renderInlineEditorRow(editorState.draft, copy)
            : '';
        return `${rowHtml}${editorHtml}`;
      })
      .join('');

    if (listState.editingCardId) {
      this.bindInlineEditorEvents(listState.editingCardId);
    }
  }

  private renderTableRow(card: CardListItem, editingId: CardId | null, copy: Record<string, string>) {
    const query = this.cardLibrary.query.value;
    const categoryLabel = copy[`cardCategory${this.capitalize(card.category)}` as keyof typeof copy] ?? card.category;

    return `
      <div class="table-row ${card.id === editingId ? 'is-editing' : ''}" data-card-id="${card.id}">
        <div class="anchor-cell">
          <div class="anchor-icon">
            <img src="${card.coverUri}" alt="" />
          </div>
          <div class="anchor-copy">
            <div class="anchor-title-row">
              <strong>${this.highlightHtml(card.title, query)}</strong>
              <span class="mini-token tone-${card.tone}">${categoryLabel}</span>
              ${card.pinned ? '<span class="material-symbols-outlined pin-icon">keep</span>' : ''}
            </div>
            <span class="anchor-meta">${this.escapeHtml(card.summary)}</span>
          </div>
        </div>

        <div class="row-tags">
          ${card.tags.length > 0
            ? card.tags.map((tag) => `<span class="tag-chip">${this.highlightHtml(tag, query)}</span>`).join('')
            : `<span class="tag-chip inactive">-</span>`}
        </div>

        <div class="row-actions">
          <button class="icon-button" type="button" data-action="open" data-card-id="${card.id}" title="${copy.cardOpen}">
            <span class="material-symbols-outlined">open_in_new</span>
          </button>
          <button class="icon-button" type="button" data-action="edit" data-card-id="${card.id}" title="${copy.cardEdit}">
            <span class="material-symbols-outlined">edit</span>
          </button>
          <button class="icon-button ${card.pinned ? 'is-active' : ''}" type="button" data-action="pin" data-card-id="${card.id}" title="${card.pinned ? copy.cardUnpin : copy.cardPin}">
            <span class="material-symbols-outlined">keep</span>
          </button>
          <button class="icon-button delete" type="button" data-action="delete" data-card-id="${card.id}" title="${copy.cardDelete}">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    `;
  }

  private renderInlineEditorRow(draft: CardDraft, copy: Record<string, string>) {
    const categories: Array<{ value: CardCategory; label: string }> = [
      { value: 'word', label: copy.cardCategoryWord },
      { value: 'phrase', label: copy.cardCategoryPhrase },
      { value: 'term', label: copy.cardCategoryTerm },
      { value: 'concept', label: copy.cardCategoryConcept },
      { value: 'sentence', label: copy.cardCategorySentence },
      { value: 'general', label: copy.cardCategoryGeneral },
    ];

    return `
      <div class="table-row editor-row">
        <div class="editor-panel">
          <h5 class="editor-title">${copy.cardInlineEditTitle}</h5>

          <div class="field-grid">
            <div class="input-shell">
              <label data-copy="fieldLabelCardTitle">${copy.fieldLabelCardTitle}</label>
              <input id="inline-edit-title" type="text" value="${this.escapeHtml(draft.title)}" />
            </div>
            <div class="input-shell">
              <label data-copy="fieldLabelCardCategory">${copy.fieldLabelCardCategory}</label>
              <select id="inline-edit-category">
                ${categories
                  .map((option) => `<option value="${option.value}" ${option.value === draft.category ? 'selected' : ''}>${option.label}</option>`)
                  .join('')}
              </select>
            </div>
          </div>

          <div class="input-shell" style="margin-top: 16px;">
            <label data-copy="fieldLabelCardTags">${copy.fieldLabelCardTags}</label>
            <input id="inline-edit-tags" type="text" placeholder="${copy.fieldLabelCardTagsHint}" value="${this.escapeHtml(draft.subjectTags)}" />
          </div>

          <div class="input-shell" style="margin-top: 16px;">
            <label data-copy="fieldLabelCardNote">${copy.fieldLabelCardNote}</label>
            <textarea id="inline-edit-note">${this.escapeHtml(draft.note)}</textarea>
          </div>

          <label class="editor-check">
            <input id="inline-edit-pinned" type="checkbox" ${draft.pinned ? 'checked' : ''} />
            <span>${copy.fieldLabelCardPinned}</span>
          </label>

          <div class="editor-footer">
            <button id="inline-edit-cancel" class="editor-button" type="button">${copy.cardInlineEditCancel}</button>
            <button id="inline-edit-save" class="editor-button primary" type="button">${copy.cardInlineEditSave}</button>
          </div>
        </div>
      </div>
    `;
  }

  private bindInlineEditorEvents(editingId: CardId) {
    const titleInput = this.refs.tableBody.querySelector<HTMLInputElement>('#inline-edit-title');
    const categoryInput = this.refs.tableBody.querySelector<HTMLSelectElement>('#inline-edit-category');
    const tagsInput = this.refs.tableBody.querySelector<HTMLInputElement>('#inline-edit-tags');
    const noteInput = this.refs.tableBody.querySelector<HTMLTextAreaElement>('#inline-edit-note');
    const pinnedInput = this.refs.tableBody.querySelector<HTMLInputElement>('#inline-edit-pinned');
    const cancelButton = this.refs.tableBody.querySelector<HTMLButtonElement>('#inline-edit-cancel');
    const saveButton = this.refs.tableBody.querySelector<HTMLButtonElement>('#inline-edit-save');

    titleInput?.addEventListener('input', () => {
      this.cardLibrary.updateDraftField('title', titleInput.value);
    });

    categoryInput?.addEventListener('change', () => {
      const value = categoryInput.value;
      if (isValidCardCategory(value)) {
        this.cardLibrary.updateDraftField('category', value);
      }
    });

    tagsInput?.addEventListener('input', () => {
      this.cardLibrary.updateDraftTags(tagsInput.value);
    });

    noteInput?.addEventListener('input', () => {
      this.cardLibrary.updateDraftField('note', noteInput.value);
    });

    pinnedInput?.addEventListener('change', () => {
      this.cardLibrary.updateDraftField('pinned', pinnedInput.checked);
    });

    cancelButton?.addEventListener('click', () => {
      this.cardLibrary.cancelInlineEdit();
    });

    saveButton?.addEventListener('click', () => {
      void this.cardLibrary.saveCard();
    });
  }

  private canProceedWithDraftDiscard(nextAction: 'select' | 'delete') {
    const listState = this.cardLibrary.getCardListViewState();
    if (!listState.hasUnsavedChanges) {
      return true;
    }

    return this.hooks.confirmAction(listState.discardMessages[nextAction]);
  }

  private highlightHtml(text: string, query: string): string {
    const normalized = query.trim().toLowerCase();
    if (!normalized || !text) {
      return this.escapeHtml(text);
    }

    const lower = text.toLowerCase();
    const segments: Array<{ text: string; matched: boolean }> = [];
    let cursor = 0;

    while (cursor < text.length) {
      const index = lower.indexOf(normalized, cursor);
      if (index === -1) {
        segments.push({ text: text.slice(cursor), matched: false });
        break;
      }

      if (index > cursor) {
        segments.push({ text: text.slice(cursor, index), matched: false });
      }
      segments.push({ text: text.slice(index, index + normalized.length), matched: true });
      cursor = index + normalized.length;
    }

    return segments
      .filter((segment) => segment.text.length > 0)
      .map((segment) =>
        segment.matched ? `<mark>${this.escapeHtml(segment.text)}</mark>` : this.escapeHtml(segment.text)
      )
      .join('');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private capitalize(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  }
}
