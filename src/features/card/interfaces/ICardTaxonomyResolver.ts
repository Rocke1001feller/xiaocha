import type { CreateCardInput, CardCategory, SubjectTag } from '../types';

export interface ICardTaxonomyResolver {
  inferCategory(input: CreateCardInput): Promise<CardCategory>;
  inferSubjectTags(input: CreateCardInput): Promise<SubjectTag[]>;
  isValidCategory(value: string): value is CardCategory;
}
