// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ICardLifecycleService } from '../../src/features/card/interfaces/ICardLifecycleService';
import type { ICardRepository } from '../../src/features/card/interfaces/ICardRepository';
import type { ICardSearchIndexResolver } from '../../src/features/card/interfaces/ICardSearchIndexResolver';
import type { SavedCard } from '../../src/features/card/types';
import { CardLibraryController } from '../../src/features/library-cards/viewmodels/CardLibraryController';
import { sampleCardsSeededStorage } from '../../src/features/card/storage/cardStorage';
import { SAMPLE_CARD_DESCRIPTORS } from '../../src/features/card/services/CardSampleSeeder';

const MOCK_COPY = {
  cardSaved: 'Saved.',
  cardSaveFailed: 'Save failed.',
  cardDeleted: 'Deleted.',
  cardDeleteFailed: 'Delete failed.',
  coverRefreshed: 'Cover refreshed.',
  coverRefreshFailed: 'Cover refresh failed.',
  cardDiscardSelect: 'Discard select?',
  cardDiscardDelete: 'Discard delete?',
  saveCard: 'Save',
  deleteCard: 'Delete',
  regenerateCover: 'Regenerate',
  cardEmptyState: 'No cards.',
  cardSectionTitle: 'Sections',
  cardTagFilterAll: 'All tags',
  cardClearFilters: 'Clear',
  cardResultsSummary: '{{filtered}} of {{total}}',
  cardResultsActiveFilters: '{{count}} active',
  cardEdit: 'Edit',
  cardOpen: 'Open',
  cardPin: 'Pin',
  cardUnpin: 'Unpin',
  cardDelete: 'Delete',
  cardInlineEditTitle: 'Edit card',
  cardInlineEditCancel: 'Cancel',
  cardInlineEditSave: 'Save',
  cardEmptyGallery: 'No cards in gallery.',
  cardEmptyTable: 'No cards found.',
  cardCoverAlt: 'Cover for {{title}}',
  cardTableHeaderCard: 'Card',
  cardTableHeaderTags: 'Tags',
  cardTableHeaderActions: 'Actions',
  categoryLabels: {
    word: 'Word',
    phrase: 'Phrase',
    term: 'Term',
    concept: 'Concept',
    sentence: 'Sentence',
    general: 'General',
  },
};

function createCard(partial: Partial<SavedCard> = {}): SavedCard {
  const now = Date.now();
  return {
    id: 'card:test-1' as SavedCard['id'],
    version: 1,
    title: 'Test card',
    note: '',
    source: {
      url: 'https://example.com/page',
      hostname: 'example.com',
      pageTitle: 'Example',
      selectionText: 'Test card',
      surroundingContext: '',
      trigger: 'text-selection',
      savedAt: now,
    },
    sections: [],
    category: 'word',
    subjectTags: ['english'],
    cover: {
      type: 'generated-svg',
      uri: 'data:image/svg+xml;utf8,',
      alt: 'Test card cover',
      generatedAt: now,
    },
    pinned: false,
    searchIndexText: 'test card english example.com',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function createController(cards: SavedCard[] = []) {
  let store = new Map(cards.map((card) => [card.id, card]));
  const watchers = new Set<(cards: SavedCard[]) => void>();

  const repository: ICardRepository = {
    create: vi.fn(async (input) => {
      const card = createCard({ ...input.source, id: `card:test-${store.size + 1}` as SavedCard['id'] });
      store.set(card.id, card);
      watchers.forEach((watcher) => watcher(Array.from(store.values())));
      return card;
    }),
    list: vi.fn(async () => Array.from(store.values())),
    read: vi.fn(async (id) => store.get(id) ?? null),
    update: vi.fn(async (id, input) => {
      const existing = store.get(id);
      if (!existing) {
        throw new Error(`Card ${id} not found.`);
      }

      const updated = { ...existing, ...input, id, updatedAt: Date.now() };
      store.set(id, updated);
      watchers.forEach((watcher) => watcher(Array.from(store.values())));
      return updated;
    }),
    delete: vi.fn(async (id) => {
      store.delete(id);
      watchers.forEach((watcher) => watcher(Array.from(store.values())));
    }),
    search: vi.fn(async (query, filters) => {
      const normalized = query.trim().toLowerCase();
      return Array.from(store.values()).filter((card) => {
        if (normalized && !card.searchIndexText.includes(normalized)) {
          return false;
        }

        if (filters?.category && card.category !== filters.category) {
          return false;
        }

        if (filters?.pinned !== undefined && card.pinned !== filters.pinned) {
          return false;
        }

        return true;
      });
    }),
    onChanged: vi.fn((callback) => {
      watchers.add(callback);
      callback(Array.from(store.values()));
      return () => watchers.delete(callback);
    }),
  };

  const lifecycle: ICardLifecycleService = {
    saveFromPopover: vi.fn(),
    retryTask: vi.fn(),
    refreshCover: vi.fn(async (id) => {
      const card = store.get(id);
      if (!card) {
        throw new Error(`Card ${id} not found.`);
      }

      const updated = { ...card, cover: { ...card.cover, generatedAt: Date.now() } };
      store.set(id, updated);
      watchers.forEach((watcher) => watcher(Array.from(store.values())));
      return updated;
    }),
  };

  const searchIndexResolver: ICardSearchIndexResolver = {
    buildIndexText: vi.fn((card) => card.searchIndexText),
  };

  const controller = new CardLibraryController(repository, lifecycle, searchIndexResolver, {
    getCopy: () => MOCK_COPY,
  });

  return { controller, repository, lifecycle, searchIndexResolver };
}

describe('CardLibraryController', () => {
  beforeEach(async () => {
    await sampleCardsSeededStorage.setValue(false);
  });

  it('exposes the initial card list', () => {
    const { controller } = createController([createCard()]);

    const listState = controller.getCardListViewState();
    expect(listState.items).toHaveLength(1);
    expect(listState.navCount).toBe(1);
  });

  it('begins inline editing and populates the draft', () => {
    const { controller } = createController([createCard({ subjectTags: ['a', 'b'] })]);

    controller.beginInlineEdit('card:test-1' as SavedCard['id']);

    const editorState = controller.getCardEditorViewState();
    expect(editorState.hasCard).toBe(true);
    expect(editorState.draft.title).toBe('Test card');
    expect(editorState.draft.subjectTags).toBe('a, b');
  });

  it('saves metadata updates and refreshes the cover when the title changes', async () => {
    const { controller, repository, lifecycle } = createController([createCard()]);

    controller.beginInlineEdit('card:test-1' as SavedCard['id']);
    controller.updateDraftField('title', 'Updated title');

    expect(controller.isDirty.value).toBe(true);

    await controller.saveCard();

    expect(repository.update).toHaveBeenCalledWith(
      'card:test-1',
      expect.objectContaining({ title: 'Updated title' }),
    );
    expect(lifecycle.refreshCover).toHaveBeenCalledWith('card:test-1');
    expect(controller.isDirty.value).toBe(false);
    expect(controller.feedback.value?.tone).toBe('success');
  });

  it('toggles pinned status independently of the editor', async () => {
    const { controller, repository } = createController([createCard()]);

    await controller.togglePinned('card:test-1' as SavedCard['id']);

    expect(repository.update).toHaveBeenCalledWith('card:test-1', { pinned: true });
  });

  it('deletes the selected card and clears the editor', async () => {
    const { controller, repository } = createController([createCard()]);

    controller.selectCard('card:test-1' as SavedCard['id']);
    await controller.deleteCard('card:test-1' as SavedCard['id']);

    expect(repository.delete).toHaveBeenCalledWith('card:test-1');
    expect(controller.selectedCardId.value).toBeNull();
    expect(controller.getCardEditorViewState().hasCard).toBe(false);
  });

  it('filters the list by tag and reports active filter count', () => {
    const { controller } = createController([
      createCard({ id: 'card:a' as SavedCard['id'], subjectTags: ['english'], searchIndexText: 'alpha english' }),
      createCard({ id: 'card:b' as SavedCard['id'], subjectTags: ['spanish'], searchIndexText: 'beta spanish' }),
    ]);

    controller.setFilterTag('english');
    const listState = controller.getCardListViewState();
    expect(listState.items).toHaveLength(1);
    expect(listState.items[0]?.id).toBe('card:a');
    expect(listState.activeFilterCount).toBe(1);
  });

  it('clears all filters', () => {
    const { controller } = createController([
      createCard({ id: 'card:a' as SavedCard['id'], category: 'word', pinned: true, searchIndexText: 'alpha' }),
      createCard({ id: 'card:b' as SavedCard['id'], category: 'term', pinned: false, searchIndexText: 'beta' }),
    ]);

    controller.setQuery('alpha');
    controller.setFilterCategory('word');
    controller.setFilterPinned('pinned');

    controller.clearFilters();

    const listState = controller.getCardListViewState();
    expect(listState.items).toHaveLength(2);
    expect(listState.activeFilterCount).toBe(0);
    expect(controller.query.value).toBe('');
  });

  it('returns gallery items and cycles through them', () => {
    const { controller } = createController([
      createCard({ id: 'card:a' as SavedCard['id'], title: 'A', searchIndexText: 'a' }),
      createCard({ id: 'card:b' as SavedCard['id'], title: 'B', searchIndexText: 'b' }),
      createCard({ id: 'card:c' as SavedCard['id'], title: 'C', searchIndexText: 'c' }),
      createCard({ id: 'card:d' as SavedCard['id'], title: 'D', searchIndexText: 'd' }),
    ]);

    const first = controller.getCardListViewState();
    expect(first.galleryItems).toHaveLength(3);
    expect(first.galleryItems.map((item) => item.id)).toEqual(['card:a', 'card:b', 'card:c']);

    controller.nextGallery();
    const second = controller.getCardListViewState();
    expect(second.galleryItems.map((item) => item.id)).toEqual(['card:b', 'card:c', 'card:d']);

    controller.prevGallery();
    const third = controller.getCardListViewState();
    expect(third.galleryItems.map((item) => item.id)).toEqual(['card:a', 'card:b', 'card:c']);
  });

  it('cancels inline editing without saving', () => {
    const { controller, repository } = createController([createCard()]);

    controller.beginInlineEdit('card:test-1' as SavedCard['id']);
    controller.updateDraftField('title', 'Unsaved title');
    controller.cancelInlineEdit();

    expect(controller.editingCardId.value).toBeNull();
    expect(controller.isDirty.value).toBe(false);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('seeds sample cards only once', async () => {
    const { controller, repository, searchIndexResolver } = createController();

    await controller.seedSampleCardsIfEmpty();

    expect(repository.create).toHaveBeenCalledTimes(SAMPLE_CARD_DESCRIPTORS.length);
    expect(searchIndexResolver.buildIndexText).toHaveBeenCalled();
    expect(await sampleCardsSeededStorage.getValue()).toBe(true);

    await controller.seedSampleCardsIfEmpty();

    expect(repository.create).toHaveBeenCalledTimes(SAMPLE_CARD_DESCRIPTORS.length);
  });
});
