import type { CreateCardInput, CardCategory, SubjectTag } from '../types';
import type { ICardTaxonomyResolver } from '../interfaces/ICardTaxonomyResolver';

const CARD_CATEGORIES: readonly CardCategory[] = ['word', 'phrase', 'term', 'concept', 'sentence', 'general'];

export class DefaultCardTaxonomyResolver implements ICardTaxonomyResolver {
  inferCategory(input: CreateCardInput): Promise<CardCategory> {
    const text = input.source.selectionText.trim();
    const hasMarkdownTask = input.sections.some((s) => s.taskId === 'information' || s.taskId === 'etymology');

    let category: CardCategory = 'general';

    if (text.split(/\s+/).length > 5) {
      category = 'sentence';
    } else if (/\s/.test(text)) {
      category = 'phrase';
    } else if (hasMarkdownTask) {
      category = 'term';
    } else if (text.length <= 25) {
      category = 'word';
    }

    return Promise.resolve(category);
  }

  inferSubjectTags(input: CreateCardInput): Promise<SubjectTag[]> {
    const text = input.source.selectionText.toLowerCase();
    const tags: SubjectTag[] = [];

    const heuristics: Array<[readonly string[], SubjectTag]> = [
      [['react', 'vue', 'angular', 'component', 'hook', 'jsx'], 'frontend'],
      [['javascript', 'typescript', 'python', 'java', 'c++', 'go', 'rust', 'algorithm'], 'cs'],
      [['derivative', 'integral', 'equation', 'theorem', 'proof', 'algebra'], 'math'],
      [['atom', 'molecule', 'reaction', 'element', 'chemical'], 'chemistry'],
      [['gene', 'cell', 'protein', 'species', 'evolution'], 'biology'],
      [['gdp', 'inflation', 'market', 'stock', 'economy'], 'economics'],
      [['democracy', 'constitution', 'parliament', 'policy'], 'politics'],
      [['renaissance', 'revolution', 'empire', 'dynasty', 'war'], 'history'],
    ];

    for (const [keywords, tag] of heuristics) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        tags.push(tag);
      }
    }

    return Promise.resolve(tags.slice(0, 3));
  }

  isValidCategory(value: string): value is CardCategory {
    return CARD_CATEGORIES.includes(value as CardCategory);
  }
}
