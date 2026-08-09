import type { SavedCard } from '../types';
import type { ICardSearchIndexResolver } from '../interfaces/ICardSearchIndexResolver';

export class DefaultCardSearchIndexResolver implements ICardSearchIndexResolver {
  buildIndexText(card: SavedCard): string {
    const parts: string[] = [
      card.title,
      card.source.selectionText,
      card.source.pageTitle ?? '',
      card.source.hostname,
      card.note,
      card.category,
      ...card.subjectTags,
      ...card.sections.map((section) => `${section.taskLabelSnapshot} ${section.content}`),
    ];

    return parts
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
}
