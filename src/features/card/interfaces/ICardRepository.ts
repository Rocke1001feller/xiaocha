import type { CreateCardInput, SavedCard, UpdateCardInput, CardFilter } from '../types';

export interface ICardRepository {
  create(input: CreateCardInput): Promise<SavedCard>;
  list(): Promise<SavedCard[]>;
  read(id: SavedCard['id']): Promise<SavedCard | null>;
  update(id: SavedCard['id'], input: UpdateCardInput): Promise<SavedCard>;
  delete(id: SavedCard['id']): Promise<void>;

  search(query: string, filters?: CardFilter): Promise<SavedCard[]>;

  onChanged(callback: (cards: SavedCard[]) => void): () => void;
}
