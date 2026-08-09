import { runExplainTask } from '../../../llm/client';
import type { ExplainSelection, ExplainTaskResult } from '../../../llm/types';
import type { TaskId } from '../../../shared/task-ids';
import type { PopoverSelectionData } from '../../popover/events/PopoverEvents';
import { ProviderRuntimeResolver } from '../../provider-registry/services/ProviderRuntimeResolver';
import type { ICardCoverResolver } from '../interfaces/ICardCoverResolver';
import type { ICardLifecycleService } from '../interfaces/ICardLifecycleService';
import type { ICardRepository } from '../interfaces/ICardRepository';
import type { ICardSearchIndexResolver } from '../interfaces/ICardSearchIndexResolver';
import type { ICardTaxonomyResolver } from '../interfaces/ICardTaxonomyResolver';
import type {
  CardCover,
  CardSection,
  CardSource,
  CreateCardInput,
  SavedCard,
  UpdateCardInput,
} from '../types';

function toCardSource(selection: PopoverSelectionData): CardSource {
  return {
    url: globalThis.location.href,
    hostname: window.location.hostname,
    pageTitle: document.title,
    selectionText: selection.text,
    surroundingContext: selection.context,
    trigger: selection.trigger,
    rect: selection.rect,
    savedAt: Date.now(),
  };
}

function toExplainSelection(source: CardSource): ExplainSelection {
  return {
    text: source.selectionText,
    context: source.surroundingContext,
    trigger: source.trigger,
    blockIndex: 0,
    sourceLabel: source.hostname,
  };
}

function toCardSection(taskId: TaskId, mode: 'json' | 'markdown', result: ExplainTaskResult<TaskId>): CardSection {
  return {
    taskId,
    taskLabelSnapshot: result.task,
    mode,
    content: result.content,
    reasoning: result.reasoning,
    providerLabelSnapshot: result.providerLabel,
    generatedAt: Date.now(),
  };
}

function truncateTitle(text: string, maxLength = 80): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export class CardLifecycleService implements ICardLifecycleService {
  private readonly repository: ICardRepository;

  private readonly taxonomyResolver: ICardTaxonomyResolver;

  private readonly coverResolver: ICardCoverResolver;

  private readonly searchIndexResolver: ICardSearchIndexResolver;

  private readonly runtimeResolver = new ProviderRuntimeResolver();

  constructor(
    repository: ICardRepository,
    taxonomyResolver: ICardTaxonomyResolver,
    coverResolver: ICardCoverResolver,
    searchIndexResolver: ICardSearchIndexResolver,
  ) {
    this.repository = repository;
    this.taxonomyResolver = taxonomyResolver;
    this.coverResolver = coverResolver;
    this.searchIndexResolver = searchIndexResolver;
  }

  async saveFromPopover(
    selection: PopoverSelectionData,
    taskResults: Partial<Record<TaskId, ExplainTaskResult<TaskId>>>,
  ): Promise<SavedCard> {
    const source = toCardSource(selection);
    const sections = await this.buildSections(taskResults);

    const input: CreateCardInput = { source, sections };
    let card = await this.repository.create(input);

    const [category, subjectTags, cover] = await Promise.all([
      this.taxonomyResolver.inferCategory(input),
      this.taxonomyResolver.inferSubjectTags(input),
      this.coverResolver.resolve({ ...input, ...card } as SavedCard),
    ]);

    const update: UpdateCardInput = {
      title: truncateTitle(source.selectionText),
      category,
      subjectTags,
      cover,
    };

    card = await this.repository.update(card.id, update);
    await this.updateSearchIndex(card.id);

    return this.repository.read(card.id) as Promise<SavedCard>;
  }

  async retryTask(cardId: SavedCard['id'], taskId: TaskId): Promise<CardSection> {
    const card = await this.repository.read(cardId);
    if (!card) {
      throw new Error(`Card ${cardId} not found.`);
    }

    const taskConfig = await this.runtimeResolver.getTaskRuntimeConfig(taskId);
    const controller = new AbortController();
    const result = await runExplainTask(
      taskId,
      toExplainSelection(card.source),
      controller.signal,
      {},
      this.runtimeResolver,
    );

    const section = toCardSection(taskId, taskConfig.mode, result);
    const sections = card.sections.filter((s) => s.taskId !== taskId).concat(section);

    await this.repository.update(cardId, { sections });
    await this.updateSearchIndex(cardId);

    return section;
  }

  async refreshCover(cardId: SavedCard['id']): Promise<SavedCard> {
    const card = await this.repository.read(cardId);
    if (!card) {
      throw new Error(`Card ${cardId} not found.`);
    }

    const cover = await this.coverResolver.resolve(card);
    return this.repository.update(cardId, { cover });
  }

  private async buildSections(
    taskResults: Partial<Record<TaskId, ExplainTaskResult<TaskId>>>,
  ): Promise<CardSection[]> {
    const entries = Object.entries(taskResults) as Array<[TaskId, ExplainTaskResult<TaskId>]>;

    const sections = await Promise.all(
      entries.map(async ([taskId, result]) => {
        const taskConfig = await this.runtimeResolver.getTaskRuntimeConfig(taskId);
        return toCardSection(taskId, taskConfig.mode, result);
      }),
    );

    return sections.sort((a, b) => a.generatedAt - b.generatedAt);
  }

  private async updateSearchIndex(cardId: SavedCard['id']): Promise<void> {
    const card = await this.repository.read(cardId);
    if (!card) {
      return;
    }

    const searchIndexText = this.searchIndexResolver.buildIndexText(card);
    await this.repository.update(cardId, { searchIndexText });
  }
}
