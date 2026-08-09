import { storage } from '#imports';
import type { CardId, SavedCard } from '../types';

export type CardStoreV1 = Record<CardId, SavedCard>;

const CARD_STORAGE_FALLBACK: CardStoreV1 = {};

export const cardStorage = storage.defineItem<CardStoreV1>('local:cards', {
  fallback: CARD_STORAGE_FALLBACK,
  version: 1,
});

export const sampleCardsSeededStorage = storage.defineItem<boolean>('local:has-seeded-sample-cards', {
  fallback: false,
  version: 1,
});

export async function readCardStore(): Promise<CardStoreV1> {
  return (await cardStorage.getValue()) ?? CARD_STORAGE_FALLBACK;
}


export async function writeCardStore(store: CardStoreV1): Promise<void> {
  await cardStorage.setValue(store);
}
