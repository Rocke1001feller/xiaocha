import { Observable } from '../../../shared/Observable';
import type { ICardLifecycleService } from '../../card/interfaces/ICardLifecycleService';
import type { ICardRepository } from '../../card/interfaces/ICardRepository';
import type { ICardSearchIndexResolver } from '../../card/interfaces/ICardSearchIndexResolver';
import { CardSampleSeeder } from '../../card/services/CardSampleSeeder';
import type {
  CardCategory,
  CardId,
  SavedCard,
  SubjectTag,
  UpdateCardInput,
} from '../../card/types';
import { isValidCardCategory } from '../../card/types';
import type { CardLibraryCopy } from './cardLibraryCopy';
import { getCardLibraryCopy } from './cardLibraryCopy';

export type CardDraft = {
  title: string;
  note: string;
  category: CardCategory;
  subjectTags: string;
  pinned: boolean;
};

export type CardFilterState = {
  category: CardCategory | '';
  tag: SubjectTag | '';
  pinned: 'all' | 'pinned' | 'unpinned';
};

export type CardListItem = {
  id: CardId;
  title: string;
  summary: string;
  category: CardCategory;
  tags: string[];
  pinned: boolean;
  coverUri: string;
  tone: 'green' | 'violet' | 'amber';
};

export type CardListViewState = {
  items: CardListItem[];
  totalCount: number;
  filteredCount: number;
  activeFilterCount: number;
  galleryItems: CardListItem[];
  selectedCardId: CardId | null;
  editingCardId: CardId | null;
  navCount: number;
  hasUnsavedChanges: boolean;
  discardMessages: Record<'select' | 'delete', string>;
  tags: SubjectTag[];
};

export type CardEditorViewState = {
  title: string;
  subtitle: string;
  badge: string;
  hasCard: boolean;
  isBusy: boolean;
  canSave: boolean;
  canDelete: boolean;
  primaryActionLabel: string;
  dangerActionLabel: string;
  regenerateCoverLabel: string;
  coverUri: string;
  sourceHostname: string;
  savedAt: number;
  draft: CardDraft;
};

type CardLibraryHooks = {
  getCopy: () => CardLibraryCopy;
};

const CATEGORY_TONES: Record<CardCategory, CardListItem['tone']> = {
  word: 'green',
  phrase: 'green',
  term: 'violet',
  concept: 'violet',
  sentence: 'amber',
  general: 'amber',
};

function createEmptyCardDraft(): CardDraft {
  return {
    title: '',
    note: '',
    category: 'general',
    subjectTags: '',
    pinned: false,
  };
}

function cardToDraft(card: SavedCard): CardDraft {
  return {
    title: card.title,
    note: card.note,
    category: card.category,
    subjectTags: card.subjectTags.join(', '),
    pinned: card.pinned,
  };
}

function parseTags(value: string): SubjectTag[] {
  return value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function isDraftEqualToCard(draft: CardDraft, card: SavedCard | null): boolean {
  if (!card) {
    return false;
  }

  return (
    draft.title === card.title &&
    draft.note === card.note &&
    draft.category === card.category &&
    draft.pinned === card.pinned &&
    parseTags(draft.subjectTags).join(',') === card.subjectTags.join(',')
  );
}

export class CardLibraryController {
  readonly cards = new Observable<SavedCard[]>([]);

  readonly query = new Observable('');

  readonly filter = new Observable<CardFilterState>({ category: '', tag: '', pinned: 'all' });

  readonly galleryOffset = new Observable(0);

  readonly selectedCardId = new Observable<CardId | null>(null);

  readonly editingCardId = new Observable<CardId | null>(null);

  readonly draft = new Observable<CardDraft>(createEmptyCardDraft());

  readonly isDirty = new Observable(false);

  readonly isSaving = new Observable(false);

  readonly feedback = new Observable<{ tone: 'success' | 'error'; text: string } | null>(null);

  private baseline: SavedCard | null = null;

  private hooks: CardLibraryHooks;

  private readonly stopWatch: () => void;

  private readonly sampleSeeder: CardSampleSeeder;

  constructor(
    private readonly repository: ICardRepository,
    private readonly lifecycle: ICardLifecycleService,
    private readonly searchIndexResolver: ICardSearchIndexResolver,
    hooks: CardLibraryHooks,
  ) {
    this.hooks = hooks;
    this.sampleSeeder = new CardSampleSeeder(repository, searchIndexResolver);

    this.stopWatch = repository.onChanged((cards) => {
      this.cards.value = cards;

      const editingId = this.editingCardId.value;
      if (editingId && !cards.some((card) => card.id === editingId)) {
        this.editingCardId.value = null;
        this.commitDraftBaseline(null);
        return;
      }

      if (editingId && !this.isDirty.value) {
        const refreshed = cards.find((card) => card.id === editingId) ?? null;
        if (refreshed) {
          this.commitDraftBaseline(refreshed);
        }
      }
    });
  }

  dispose() {
    this.stopWatch();
  }

  setCopyHooks(hooks: CardLibraryHooks) {
    this.hooks = hooks;
  }

  async seedSampleCardsIfEmpty(): Promise<void> {
    await this.sampleSeeder.seedSampleCardsIfEmpty();
  }

  setQuery(query: string) {
    this.query.value = query;
    this.galleryOffset.value = 0;
  }

  setFilterCategory(category: CardCategory | '') {
    this.filter.value = { ...this.filter.value, category };
    this.galleryOffset.value = 0;
  }

  setFilterTag(tag: SubjectTag | '') {
    this.filter.value = { ...this.filter.value, tag };
    this.galleryOffset.value = 0;
  }

  setFilterPinned(pinned: 'all' | 'pinned' | 'unpinned') {
    this.filter.value = { ...this.filter.value, pinned };
    this.galleryOffset.value = 0;
  }

  clearFilters() {
    this.query.value = '';
    this.filter.value = { category: '', tag: '', pinned: 'all' };
    this.galleryOffset.value = 0;
  }

  prevGallery() {
    const filtered = this.getFilteredCards();
    if (filtered.length <= 1) {
      return;
    }

    this.galleryOffset.value = (this.galleryOffset.value - 1 + filtered.length) % filtered.length;
  }

  nextGallery() {
    const filtered = this.getFilteredCards();
    if (filtered.length <= 1) {
      return;
    }

    this.galleryOffset.value = (this.galleryOffset.value + 1) % filtered.length;
  }

  selectCard(id: CardId) {
    const card = this.cards.value.find((item) => item.id === id) ?? null;
    if (!card) {
      return;
    }

    this.selectedCardId.value = id;
  }

  beginInlineEdit(id: CardId) {
    const card = this.cards.value.find((item) => item.id === id) ?? null;
    if (!card) {
      return;
    }

    this.editingCardId.value = id;
    this.feedback.value = null;
    this.commitDraftBaseline(card);
  }

  cancelInlineEdit() {
    this.editingCardId.value = null;
    this.commitDraftBaseline(null);
  }

  updateDraftField(field: keyof CardDraft, value: string | boolean) {
    const next = { ...this.draft.value, [field]: value };
    if (field === 'category' && typeof value === 'string' && !isValidCardCategory(value)) {
      return;
    }

    this.applyDraft(next);
  }

  updateDraftTags(value: string) {
    this.applyDraft({ ...this.draft.value, subjectTags: value });
  }

  toggleDraftPinned() {
    this.applyDraft({ ...this.draft.value, pinned: !this.draft.value.pinned });
  }

  async saveCard() {
    const id = this.editingCardId.value;
    const baseline = this.baseline;
    if (!id || !baseline) {
      return;
    }

    this.isSaving.value = true;
    this.feedback.value = null;

    try {
      const update: UpdateCardInput = {
        title: this.draft.value.title.trim(),
        note: this.draft.value.note,
        category: this.draft.value.category,
        subjectTags: parseTags(this.draft.value.subjectTags),
        pinned: this.draft.value.pinned,
      };

      let card = await this.repository.update(id, update);
      const searchIndexText = this.searchIndexResolver.buildIndexText(card);
      card = await this.repository.update(id, { searchIndexText });

      if (baseline.title !== card.title || baseline.category !== card.category) {
        card = await this.lifecycle.refreshCover(id);
      }

      this.commitDraftBaseline(card);
      this.editingCardId.value = null;
      this.feedback.value = { tone: 'success', text: this.copy.cardSaved };
    } catch (error) {
      this.feedback.value = {
        tone: 'error',
        text: error instanceof Error ? error.message : this.copy.cardSaveFailed,
      };
    } finally {
      this.isSaving.value = false;
    }
  }

  async deleteCard(id: CardId) {
    this.isSaving.value = true;
    this.feedback.value = null;

    try {
      await this.repository.delete(id);
      if (this.editingCardId.value === id) {
        this.editingCardId.value = null;
        this.commitDraftBaseline(null);
      }

      if (this.selectedCardId.value === id) {
        this.selectedCardId.value = null;
      }

      this.feedback.value = { tone: 'success', text: this.copy.cardDeleted };
    } catch (error) {
      this.feedback.value = {
        tone: 'error',
        text: error instanceof Error ? error.message : this.copy.cardDeleteFailed,
      };
    } finally {
      this.isSaving.value = false;
    }
  }

  async togglePinned(id: CardId) {
    const card = this.cards.value.find((item) => item.id === id);
    if (!card) {
      return;
    }

    try {
      const updated = await this.repository.update(id, { pinned: !card.pinned });
      if (this.editingCardId.value === id) {
        this.commitDraftBaseline(updated);
      }
    } catch (error) {
      this.feedback.value = {
        tone: 'error',
        text: error instanceof Error ? error.message : this.copy.cardSaveFailed,
      };
    }
  }

  async refreshCover(id: CardId) {
    this.isSaving.value = true;
    this.feedback.value = null;

    try {
      const card = await this.lifecycle.refreshCover(id);
      if (this.editingCardId.value === id) {
        this.commitDraftBaseline(card);
      }

      this.feedback.value = { tone: 'success', text: this.copy.coverRefreshed };
    } catch (error) {
      this.feedback.value = {
        tone: 'error',
        text: error instanceof Error ? error.message : this.copy.coverRefreshFailed,
      };
    } finally {
      this.isSaving.value = false;
    }
  }

  openCard(id: CardId) {
    const card = this.cards.value.find((item) => item.id === id);
    if (!card) {
      return;
    }

    const url = card.source.url;
    if (!url || url.startsWith('#')) {
      return;
    }

    globalThis.open(url, '_blank');
  }

  getCardListViewState(): CardListViewState {
    const filteredCards = this.getFilteredCards();
    const normalizedQuery = this.query.value.trim().toLowerCase();
    const { category, tag, pinned } = this.filter.value;

    let activeFilterCount = 0;
    if (normalizedQuery) activeFilterCount += 1;
    if (category) activeFilterCount += 1;
    if (tag) activeFilterCount += 1;
    if (pinned !== 'all') activeFilterCount += 1;

    const allTags = Array.from(
      new Set(this.cards.value.flatMap((card) => card.subjectTags)),
    ).sort((a, b) => a.localeCompare(b));

    const items = filteredCards.map((card) => this.toListItem(card));
    const galleryItems = this.buildGalleryItems(items);

    return {
      items,
      totalCount: this.cards.value.length,
      filteredCount: filteredCards.length,
      activeFilterCount,
      galleryItems,
      selectedCardId: this.selectedCardId.value,
      editingCardId: this.editingCardId.value,
      navCount: this.cards.value.length,
      hasUnsavedChanges: this.isDirty.value,
      discardMessages: {
        select: this.copy.cardDiscardSelect,
        delete: this.copy.cardDiscardDelete,
      },
      tags: allTags,
    };
  }

  getCardEditorViewState(): CardEditorViewState {
    const card = this.baseline;
    const copy = this.copy;

    if (!card) {
      return {
        title: copy.cardEmptyState,
        subtitle: '',
        badge: '',
        hasCard: false,
        isBusy: this.isSaving.value,
        canSave: false,
        canDelete: false,
        primaryActionLabel: copy.saveCard,
        dangerActionLabel: copy.deleteCard,
        regenerateCoverLabel: copy.regenerateCover,
        coverUri: '',
        sourceHostname: '',
        savedAt: 0,
        draft: this.draft.value,
      };
    }

    const isBusy = this.isSaving.value;
    const canSave = this.isDirty.value && !isBusy;

    return {
      title: card.title || card.source.selectionText,
      subtitle: card.source.selectionText,
      badge: copy.categoryLabels[card.category] ?? card.category,
      hasCard: true,
      isBusy,
      canSave,
      canDelete: !isBusy,
      primaryActionLabel: copy.saveCard,
      dangerActionLabel: copy.deleteCard,
      regenerateCoverLabel: copy.regenerateCover,
      coverUri: card.cover.uri,
      sourceHostname: card.source.hostname,
      savedAt: card.source.savedAt,
      draft: this.draft.value,
    };
  }

  private getFilteredCards(): SavedCard[] {
    const normalizedQuery = this.query.value.trim().toLowerCase();
    const { category, tag, pinned } = this.filter.value;

    return this.cards.value.filter((card) => {
      if (normalizedQuery && !card.searchIndexText.includes(normalizedQuery)) {
        return false;
      }

      if (category && card.category !== category) {
        return false;
      }

      if (tag && !card.subjectTags.includes(tag)) {
        return false;
      }

      if (pinned === 'pinned' && !card.pinned) {
        return false;
      }

      if (pinned === 'unpinned' && card.pinned) {
        return false;
      }

      return true;
    });
  }

  private buildGalleryItems(items: CardListItem[]): CardListItem[] {
    if (items.length === 0) {
      return [];
    }

    const offset = this.galleryOffset.value % items.length;
    if (items.length === 1) {
      return [items[0]];
    }

    if (items.length === 2) {
      return [items[offset], items[(offset + 1) % items.length]];
    }

    return [
      items[offset],
      items[(offset + 1) % items.length],
      items[(offset + 2) % items.length],
    ];
  }

  private toListItem(card: SavedCard): CardListItem {
    return {
      id: card.id,
      title: card.title || card.source.selectionText,
      summary: `${card.source.hostname} · ${card.sections.length} sections`,
      category: card.category,
      tags: card.subjectTags.slice(0, 3),
      pinned: card.pinned,
      coverUri: card.cover.uri,
      tone: CATEGORY_TONES[card.category] ?? 'amber',
    };
  }

  private get copy() {
    return this.hooks.getCopy();
  }

  private applyDraft(next: CardDraft) {
    this.draft.value = next;
    this.isDirty.value = !isDraftEqualToCard(next, this.baseline);
  }

  private commitDraftBaseline(card: SavedCard | null) {
    this.baseline = card;
    this.draft.value = card ? cardToDraft(card) : createEmptyCardDraft();
    this.isDirty.value = false;
  }
}
