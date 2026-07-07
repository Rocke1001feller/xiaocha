import * as smd from 'streaming-markdown';
import type { ExplainTaskState } from '../../../../../src/llm/types';

type MarkdownVisibility = {
  setLoadingVisible: (visible: boolean) => void;
  setErrorMessage: (message: string) => void;
};

export type MarkdownRuntime = {
  parser: ReturnType<typeof smd.parser> | null;
  renderedLength: number;
  finalized: boolean;
  container: HTMLElement;
  visibility: MarkdownVisibility;
};

export function createMarkdownRuntime(container: HTMLElement, visibility: MarkdownVisibility): MarkdownRuntime {
  return { parser: null, renderedLength: 0, finalized: false, container, visibility };
}

export function renderStaticMarkdown(container: HTMLElement, markdown: string) {
  container.replaceChildren();
  if (!markdown) return;
  const renderer = smd.default_renderer(container);
  const parser = smd.parser(renderer);
  smd.parser_write(parser, markdown);
  smd.parser_end(parser);
}

export function renderMarkdownState(runtime: MarkdownRuntime, state: ExplainTaskState) {
  runtime.visibility.setLoadingVisible(state.status === 'loading');
  runtime.visibility.setErrorMessage(state.status === 'error' ? state.errorMessage ?? '' : '');
  if (state.status === 'idle') return resetMarkdown(runtime);
  if (state.content.length < runtime.renderedLength) resetMarkdown(runtime);

  if (!runtime.parser) {
    const renderer = smd.default_renderer(runtime.container);
    runtime.parser = smd.parser(renderer);
    runtime.finalized = false;
  }

  const parser = runtime.parser;
  if (!parser) return;

  const delta = state.content.slice(runtime.renderedLength);
  if (delta) {
    smd.parser_write(parser, delta);
    runtime.renderedLength = state.content.length;
  }

  if (state.status !== 'loading' && !runtime.finalized) {
    smd.parser_end(parser);
    runtime.finalized = true;
    runtime.parser = null;
  }
}

export function resetMarkdown(runtime: MarkdownRuntime) {
  if (runtime.parser) smd.parser_end(runtime.parser);
  runtime.parser = null;
  runtime.renderedLength = 0;
  runtime.finalized = false;
  runtime.container.replaceChildren();
  runtime.visibility.setErrorMessage('');
  runtime.visibility.setLoadingVisible(false);
}