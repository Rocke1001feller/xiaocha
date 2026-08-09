export * from './types';
export type * from './interfaces/ICardRepository';
export type * from './interfaces/ICardCoverResolver';
export type * from './interfaces/ICardTaxonomyResolver';
export type * from './interfaces/ICardSearchIndexResolver';
export type * from './interfaces/ICardLifecycleService';

export { ExtensionCardRepository } from './repositories/ExtensionCardRepository';
export { DefaultCardCoverResolver } from './resolvers/DefaultCardCoverResolver';
export { DefaultCardTaxonomyResolver } from './resolvers/DefaultCardTaxonomyResolver';
export { DefaultCardSearchIndexResolver } from './resolvers/DefaultCardSearchIndexResolver';
export { CardLifecycleService } from './services/CardLifecycleService';
export { CardSampleSeeder } from './services/CardSampleSeeder';

import { ExtensionCardRepository } from './repositories/ExtensionCardRepository';
import { DefaultCardCoverResolver } from './resolvers/DefaultCardCoverResolver';
import { DefaultCardTaxonomyResolver } from './resolvers/DefaultCardTaxonomyResolver';
import { DefaultCardSearchIndexResolver } from './resolvers/DefaultCardSearchIndexResolver';
import { CardLifecycleService } from './services/CardLifecycleService';

export function createDefaultCardLifecycleService(): import('./interfaces/ICardLifecycleService').ICardLifecycleService {
  const repository = new ExtensionCardRepository();
  const taxonomy = new DefaultCardTaxonomyResolver();
  const cover = new DefaultCardCoverResolver();
  const searchIndex = new DefaultCardSearchIndexResolver();

  return new CardLifecycleService(repository, taxonomy, cover, searchIndex);
}
