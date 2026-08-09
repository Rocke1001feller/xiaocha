import type { CreateCardInput, SavedCard, CardCover } from '../types';

export interface ICardCoverResolver {
  resolve(card: SavedCard | CreateCardInput): Promise<CardCover>;
}
