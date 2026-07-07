import type { ExplainTaskState } from '../../../../../src/llm/types';

type JsonVisibility = {
  setLoadingVisible: (visible: boolean) => void;
  setErrorMessage: (message: string) => void;
};

export type JsonRuntime = {
  container: HTMLElement;
  visibility: JsonVisibility;
};

export function createJsonRuntime(container: HTMLElement, visibility: JsonVisibility): JsonRuntime {
  return { container, visibility };
}

export function renderJsonState(runtime: JsonRuntime, state: ExplainTaskState) {
  runtime.visibility.setLoadingVisible(state.status === 'loading');
  runtime.visibility.setErrorMessage(state.status === 'error' ? state.errorMessage ?? '' : '');

  if (state.status === 'idle') {
    runtime.container.textContent = '';
    return;
  }

  runtime.container.textContent = formatJsonOutput(state.content);
}

function formatJsonOutput(content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const normalized = trimmed.startsWith('```')
      ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      : trimmed;
    return JSON.stringify(JSON.parse(normalized), null, 2);
  } catch {
    return content;
  }
}