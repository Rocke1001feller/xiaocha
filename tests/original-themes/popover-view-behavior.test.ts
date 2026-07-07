// @vitest-environment jsdom

import type { ExplainTaskState } from '../../src/llm/types';
import { toCustomTaskId, type TaskId } from '../../src/shared/task-ids';
import type { PopoverTaskDescriptor } from '../../src/features/popover/events/PopoverEvents';
import type { IPopoverRepository } from '../../src/features/popover/interfaces/IPopoverRepository';
import popoverStyles from '../../src/features/popover/styles/popover';
import { PopoverViewModel } from '../../src/features/popover/viewmodels/PopoverViewModel';
import { afterEach, describe, expect, it } from 'vitest';

import { PopoverView } from '../../src/features/popover/components/PopoverView';

const lexicalSuccessState: ExplainTaskState = {
  status: 'success',
  content: '',
  reasoning: '',
  lexical: {
    translation: 'La función de onda representa la amplitud de probabilidad.',
    phonetic: '/weiv fʌŋkʃən/',
    contextualAnalysis: 'In quantum mechanics, this describes the mathematical state of a particle.',
    definitions: [{ pos: 'n.', meaning: 'A mathematical description of a quantum state.', example: { source: 'wavefunction', target: 'función de onda' } }],
  },
};

const idleState: ExplainTaskState = {
  status: 'idle',
  content: '',
  reasoning: '',
};

const customJsonTaskId = toCustomTaskId('structured-summary');

const modernTasks: PopoverTaskDescriptor[] = [
  { id: 'lexical', label: 'Lexical', kind: 'lexical' },
  { id: 'etymology', label: 'Etymology', kind: 'markdown' },
  { id: customJsonTaskId, label: 'Structured Summary', kind: 'json' },
];

class MockPopoverRepository implements IPopoverRepository {
  async listTasks(): Promise<PopoverTaskDescriptor[]> {
    return modernTasks;
  }

  async startTask(): Promise<void> {}
  async cancelTask(): Promise<void> {}
}

function setTasks(
  viewModel: PopoverViewModel,
  tasks: PopoverTaskDescriptor[],
  states: Partial<Record<TaskId, ExplainTaskState>>,
  selectedTab: TaskId,
) {
  viewModel.tasks.value = tasks;
  viewModel.taskStates.value = Object.fromEntries(
    tasks
      .filter((task) => task.kind !== 'lexical')
      .map((task) => [task.id, states[task.id] ?? idleState]),
  ) as Record<TaskId, ExplainTaskState>;
  viewModel.selectedTab.value = selectedTab;
}

function createMountedView() {
  document.body.innerHTML = '';
  const viewModel = new PopoverViewModel(new MockPopoverRepository());
  const view = new PopoverView(viewModel);
  const host = document.getElementById('scan-explain-popover-root') as HTMLDivElement;
  return { viewModel, view, shadowRoot: host.shadowRoot as ShadowRoot };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('PopoverView behavior contract', () => {
  it('renders lexical and markdown content through the extracted sections', () => {
    const { viewModel, view, shadowRoot } = createMountedView();
    const rect = { left: 120, top: 80, right: 300, bottom: 104, width: 180, height: 24 };
    viewModel.title.value = 'Quantum Mechanics';
    viewModel.providerLabel.value = 'OpenAI · GPT-4.1';
    viewModel.theme.value = 'pro';
    viewModel.lexicalState.value = lexicalSuccessState;
    setTasks(
      viewModel,
      modernTasks,
      {
        etymology: { status: 'success', content: '## Root\nFrom Latin *unda*.', reasoning: '' },
        [customJsonTaskId]: { status: 'success', content: '{"summary":"Amplitude matters"}', reasoning: '' },
      },
      customJsonTaskId,
    );
    view.showTrigger(rect);
    view.openAt(rect);

    expect(shadowRoot.querySelector('.scanex-trigger')?.getAttribute('data-visible')).toBe('true');
    expect((shadowRoot.querySelector('.scanex-popover') as HTMLElement | null)?.hidden).toBe(false);
    expect(shadowRoot.querySelector('.scanex-title')?.textContent).toBe('Quantum Mechanics');
    expect(shadowRoot.querySelector('.scanex-provider')?.textContent).toBe('OpenAI · GPT-4.1');
    expect(shadowRoot.querySelector('.scanex-theme-chip')?.textContent).toBe('Pro Dark · free');
    expect(shadowRoot.querySelector('.scanex-phonetic')?.textContent).toBe('/weiv fʌŋkʃən/');
    expect(shadowRoot.querySelectorAll('.scanex-definition')).toHaveLength(1);
    expect(shadowRoot.querySelector('.scanex-translation')?.textContent).toContain('función de onda');
    expect(shadowRoot.querySelector('.scanex-contextual')?.textContent).toContain('mathematical state');
    expect(shadowRoot.querySelectorAll('[data-role="task-tab"]')).toHaveLength(2);
    expect(shadowRoot.querySelector('[data-role="task-content"][data-task-id="etymology"]')?.textContent).toContain('From Latin');
    expect(shadowRoot.querySelector(`[data-role="task-content"][data-task-id="${customJsonTaskId}"]`)?.textContent).toContain('Amplitude matters');
    expect(shadowRoot.querySelector('style')?.textContent).toBe(popoverStyles);

    view.destroy();
  });

  it('keeps lexical collapse, tab selection, and reset behavior aligned with the view model', () => {
    const { viewModel, view, shadowRoot } = createMountedView();

    setTasks(
      viewModel,
      modernTasks,
      {
        etymology: { status: 'loading', content: '## Root', reasoning: '' },
        [customJsonTaskId]: idleState,
      },
      customJsonTaskId,
    );

    expect(shadowRoot.querySelector('.scanex-lexical-body')?.hasAttribute('hidden')).toBe(false);
    viewModel.lexicalCollapsed.value = true;
    expect(shadowRoot.querySelector('.scanex-lexical')?.getAttribute('data-collapsed')).toBe('true');
    expect((shadowRoot.querySelector('.scanex-lexical-body') as HTMLElement).hidden).toBe(true);

    viewModel.selectedTab.value = customJsonTaskId;
    expect(shadowRoot.querySelector(`[data-role="task-tab"][data-task-id="${customJsonTaskId}"]`)?.getAttribute('data-active')).toBe('true');
    expect((shadowRoot.querySelector(`[data-role="task-panel"][data-task-id="${customJsonTaskId}"]`) as HTMLElement).hidden).toBe(false);

    expect((shadowRoot.querySelector('[data-role="task-panel"][data-task-id="etymology"] [data-role="task-loading"]') as HTMLElement).hidden).toBe(false);

    setTasks(
      viewModel,
      modernTasks,
      {
        etymology: idleState,
        [customJsonTaskId]: idleState,
      },
      customJsonTaskId,
    );
    expect(shadowRoot.querySelector('[data-role="task-content"][data-task-id="etymology"]')?.textContent).toBe('');
    expect((shadowRoot.querySelector('[data-role="task-panel"][data-task-id="etymology"] [data-role="task-loading"]') as HTMLElement).hidden).toBe(true);

    view.destroy();
    expect(document.getElementById('scan-explain-popover-root')).toBeNull();
  });
});