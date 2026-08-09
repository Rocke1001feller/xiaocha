import type { ExplainTaskResult } from '../../llm/types';
import type { TaskId } from '../../shared/task-ids';
import type { ViewportRect } from '../popover/events/PopoverEvents';

export type CardId = `card:${string}`;

export function createCardId(): CardId {
  return `card:${crypto.randomUUID()}`;
}

export type CardSource = {
  url: string;
  hostname: string;
  pageTitle?: string;
  selectionText: string;
  surroundingContext: string;
  trigger: 'text-selection' | 'block-click';
  rect?: ViewportRect;
  savedAt: number;
};

export type CardSection = {
  taskId: TaskId;
  taskLabelSnapshot: string;
  mode: 'json' | 'markdown';
  content: string;
  reasoning: string;
  providerLabelSnapshot: string;
  generatedAt: number;
};

export type CardCoverType = 'generated-gradient' | 'generated-svg' | 'data-url' | 'external-url';

export type CardCover = {
  type: CardCoverType;
  uri: string;
  alt: string;
  generatedAt: number;
};

export type CardCategory =
  | 'word'
  | 'phrase'
  | 'term'
  | 'concept'
  | 'sentence'
  | 'general';

export type SubjectTag = string;

export type SavedCard = {
  id: CardId;
  version: 1;

  title: string;
  note: string;

  source: CardSource;
  sections: CardSection[];

  category: CardCategory;
  subjectTags: SubjectTag[];

  cover: CardCover;
  pinned: boolean;

  searchIndexText: string;

  createdAt: number;
  updatedAt: number;
};

export type CreateCardInput = {
  source: CardSource;
  sections: CardSection[];
};

export type UpdateCardInput = {
  title?: string;
  note?: string;
  category?: CardCategory;
  subjectTags?: SubjectTag[];
  cover?: CardCover;
  pinned?: boolean;
  sections?: CardSection[];
  searchIndexText?: string;
};

export type CardFilter = {
  category?: CardCategory;
  tag?: SubjectTag;
  pinned?: boolean;
};

export function toCardSection(taskId: TaskId, result: ExplainTaskResult): CardSection {
  return {
    taskId,
    taskLabelSnapshot: result.task,
    mode: taskId === 'lexical' ? 'json' : 'markdown',
    content: result.content,
    reasoning: result.reasoning,
    providerLabelSnapshot: result.providerLabel,
    generatedAt: Date.now(),
  };
}

export function isValidCardCategory(value: string): value is CardCategory {
  return ['word', 'phrase', 'term', 'concept', 'sentence', 'general'].includes(value);
}
