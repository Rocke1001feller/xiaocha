import type {
  SavedCard,
  CreateCardInput,
  UpdateCardInput,
  CardFilter,
  CardId,
} from '../types';
import type { ICardRepository } from '../interfaces/ICardRepository';
import { cardStorage, readCardStore, writeCardStore } from '../storage/cardStorage';
import { isExtensionContextInvalidatedError } from '../../../shared/extension-context';
import { createCardId } from '../types';

export class ExtensionCardRepository implements ICardRepository {
  async create(input: CreateCardInput): Promise<SavedCard> {
    const store = await readCardStore();
    const id = createCardId();
    const now = Date.now();

    const card: SavedCard = {
      ...input,
      id,
      version: 1,
      title: input.source.selectionText,
      note: '',
      category: 'general',
      subjectTags: [],
      cover: {
        type: 'generated-gradient',
        uri: '',
        alt: '',
        generatedAt: now,
      },
      pinned: false,
      searchIndexText: '',
      createdAt: now,
      updatedAt: now,
    };

    store[id] = card;
    await writeCardStore(store);

    return card;
  }

  async list(): Promise<SavedCard[]> {
    const store = await readCardStore();
    return Object.values(store).sort((a, b) => b.createdAt - a.createdAt);
  }

  async read(id: CardId): Promise<SavedCard | null> {
    const store = await readCardStore();
    return store[id] ?? null;
  }

  async update(id: CardId, input: UpdateCardInput): Promise<SavedCard> {
    const store = await readCardStore();
    const existing = store[id];

    if (!existing) {
      throw new Error(`Card ${id} not found.`);
    }

    const updated: SavedCard = {
      ...existing,
      ...input,
      id,
      updatedAt: Date.now(),
    };

    store[id] = updated;
    await writeCardStore(store);

    return updated;
  }

  async delete(id: CardId): Promise<void> {
    const store = await readCardStore();
    delete store[id];
    await writeCardStore(store);
  }

  async search(query: string, filters?: CardFilter): Promise<SavedCard[]> {
    const cards = await this.list();
    const normalized = query.trim().toLowerCase();

    return cards.filter((card) => {
      if (normalized && !card.searchIndexText.includes(normalized)) {
        return false;
      }

      if (filters?.category && card.category !== filters.category) {
        return false;
      }

      if (filters?.tag && !card.subjectTags.includes(filters.tag)) {
        return false;
      }

      if (filters?.pinned !== undefined && card.pinned !== filters.pinned) {
        return false;
      }

      return true;
    });
  }

  onChanged(callback: (cards: SavedCard[]) => void): () => void {
    let unwatch: () => void = () => undefined;
    const notify = async () => {
      try {
        callback(await this.list());
      } catch (error) {
        /* 扩展上下文失效后 storage 读取必然失败：自我退订，停止异步工作 */
        if (isExtensionContextInvalidatedError(error)) {
          unwatch();
        }
      }
    };

    void notify();
    unwatch = cardStorage.watch(() => {
      void notify();
    });
    return () => unwatch();
  }
}
