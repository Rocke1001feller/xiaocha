import type { SavedCard } from '../types';

export interface ICardSearchIndexResolver {
  buildIndexText(card: SavedCard): string;
}
