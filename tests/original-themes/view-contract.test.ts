// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import type { ExplainTaskState } from '../../src/llm/types';
import { toCustomTaskId, type TaskId } from '../../src/shared/task-ids';
import { POPOVER_THEMES, type PopoverSelectionData, type PopoverTaskDescriptor, type ViewportRect } from '../../src/features/popover/events/PopoverEvents';
import type { IPopoverRepository } from '../../src/features/popover/interfaces/IPopoverRepository';
import { PopoverViewModel } from '../../src/features/popover/viewmodels/PopoverViewModel';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/features/popover/styles/original-themes', () => ({
  default: readFileSync(`${process.cwd()}/src/features/popover/styles/original-themes/order.txt`, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((file) => readFileSync(`${process.cwd()}/src/features/popover/styles/original-themes/${file}`, 'utf8'))
    .join(''),
}));

import { OriginalPopoverView } from '../../src/features/popover/components/OriginalPopoverView';

const idleState: ExplainTaskState = {
  status: 'idle',
  content: '',
  reasoning: '',
};

const customMarkdownTaskId = toCustomTaskId('usage-notes');

const customJsonTaskId = toCustomTaskId('structured-summary');

const dynamicTasks: PopoverTaskDescriptor[] = [
  { id: 'lexical', label: 'Lexical', kind: 'lexical' },
  { id: customMarkdownTaskId, label: 'Usage Notes', kind: 'markdown' },
  { id: customJsonTaskId, label: 'Structured Summary', kind: 'json' },
];

const lexicalSuccessState: ExplainTaskState = {
  status: 'success',
  content: '',
  reasoning: '',
  lexical: {
    translation: 'La función de onda representa la amplitud de probabilidad.',
    phonetic: '/weiv fʌŋkʃən/',
    contextualAnalysis: 'In quantum mechanics, this describes the mathematical state of a particle.',
    definitions: [
      {
        pos: 'n.',
        meaning: 'A mathematical description of a quantum state.',
        example: {
          source: 'wavefunction',
          target: 'función de onda',
        },
      },
    ],
  },
};

const etymologySuccessState: ExplainTaskState = {
  status: 'success',
  content: '## Root\nFrom Latin *unda* and the language of functions.',
  reasoning: '',
};

const informationSuccessState: ExplainTaskState = {
  status: 'success',
  content: '### Insight\n**Amplitude** is the quantity the equation is describing.',
  reasoning: '',
};

class MockPopoverRepository implements IPopoverRepository {
  async listTasks(): Promise<PopoverTaskDescriptor[]> {
    return dynamicTasks;
  }

  async startTask(): Promise<void> {}

  async cancelTask(): Promise<void> {}
}

function createRect(left = 120, top = 80): ViewportRect {
  return {
    left,
    top,
    right: left + 180,
    bottom: top + 24,
    width: 180,
    height: 24,
  };
}

function createRange(): Range {
  const text = document.createTextNode('Wave function amplitude');
  document.body.appendChild(text);
  const range = document.createRange();
  range.selectNode(text);
  return range;
}

function createSelection(): PopoverSelectionData {
  const rect = createRect();
  return {
    text: 'Wave function amplitude',
    context: 'Quantum mechanics explanation context.',
    trigger: 'text-selection',
    blockIndex: 0,
    sourceLabel: 'Block 1',
    rect,
    lastLineRect: rect,
  };
}

function getTriggerRoot(): ShadowRoot | null {
  const triggerHost = document.querySelector('[data-scan-explain-inline-trigger]') as HTMLSpanElement | null;
  return triggerHost?.shadowRoot ?? null;
}

function createMountedView() {
  document.body.innerHTML = '';

  const viewModel = new PopoverViewModel(new MockPopoverRepository());
  const view = new OriginalPopoverView(viewModel);
  const host = document.getElementById('scan-explain-popover-root') as HTMLDivElement;
  const shadowRoot = host.shadowRoot as ShadowRoot;

  return { viewModel, view, host, shadowRoot };
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

afterEach(() => {
  document.body.innerHTML = '';
  for (const host of document.querySelectorAll('#scan-explain-popover-root')) {
    host.remove();
  }
});

describe('OriginalPopoverView Phase 0 contract oracle', () => {
  it('mounts the original DOM contract and renders representative content', () => {
    const { viewModel, view, shadowRoot } = createMountedView();
    const rect = createRect(90, 64);

    viewModel.title.value = 'Quantum Mechanics';
    viewModel.theme.value = 'pro';
    viewModel.lexicalState.value = lexicalSuccessState;
    setTasks(
      viewModel,
      dynamicTasks,
      {
        [customMarkdownTaskId]: etymologySuccessState,
        [customJsonTaskId]: {
          status: 'success',
          content: JSON.stringify({ summary: 'Amplitude matters', bullets: ['Wave function', 'Probability amplitude'] }, null, 2),
          reasoning: '',
        },
      },
      customMarkdownTaskId,
    );

    const triggerRange = createRange();

    view.showTrigger(triggerRange);
    view.activateTrigger();
    view.openAt(rect);

    const triggerRoot = getTriggerRoot();

    expect(shadowRoot.querySelector('style')?.textContent?.length).toBeGreaterThan(9000);
    expect(triggerRoot?.querySelector('.oow-selection-trigger-button.visible.activated')).not.toBeNull();
    expect(shadowRoot.querySelector('.oow-popover.is-visible.is-positioned')).not.toBeNull();
    expect(shadowRoot.querySelector('.modal-header .header-title')?.textContent).toBe('Quantum Mechanics');
    expect(shadowRoot.querySelector('.section-title')?.textContent).toBe('Quantum Mechanics');
    expect(shadowRoot.querySelectorAll('.defs-list .def-item')).toHaveLength(1);
    expect(shadowRoot.querySelector('.translation .text')?.textContent).toContain('función de onda');
    expect(shadowRoot.querySelector('.contextual-analysis .text')?.textContent).toContain('mathematical state');
    expect(shadowRoot.querySelectorAll('[data-role="task-tab"]')).toHaveLength(2);
    expect(shadowRoot.querySelector(`[data-role="task-content"][data-task-id="${customMarkdownTaskId}"]`)?.textContent).toContain('From Latin');
    expect(shadowRoot.querySelector(`[data-role="task-content"][data-task-id="${customJsonTaskId}"]`)?.textContent).toContain('Amplitude matters');
    expect(shadowRoot.querySelector('.footer-theme-label')?.textContent).toBe('Pro Dark · free');

    view.destroy();
  });

  it('keeps theme metadata synchronized across trigger, popover, and footer label', () => {
    const { viewModel, view, shadowRoot } = createMountedView();
    const range = createRange();
    view.showTrigger(range);

    for (const theme of POPOVER_THEMES) {
      viewModel.theme.value = theme.id;

      const triggerRoot = getTriggerRoot();

      expect(shadowRoot.querySelector('.oow-popover')?.getAttribute('data-theme')).toBe(theme.id);
      expect(triggerRoot?.querySelector('.oow-selection-trigger-button')?.getAttribute('data-theme')).toBe(theme.id);
      expect(shadowRoot.querySelector('.footer-theme-label')?.textContent).toBe(`${theme.name} · ${theme.tier}`);
    }

    view.destroy();
  });

  it('preserves lexical collapse and dynamic task-selection behavior', () => {
    const { viewModel, view, shadowRoot } = createMountedView();

    setTasks(
      viewModel,
      dynamicTasks,
      {
        [customMarkdownTaskId]: etymologySuccessState,
        [customJsonTaskId]: informationSuccessState,
      },
      customMarkdownTaskId,
    );

    expect(shadowRoot.querySelector('.lexical-section')?.classList.contains('is-expanded')).toBe(true);

    viewModel.lexicalCollapsed.value = true;
    expect(shadowRoot.querySelector('.lexical-section')?.classList.contains('is-collapsed')).toBe(true);
    expect((shadowRoot.querySelector(`#popover-task-${customMarkdownTaskId.replace(/[^a-z0-9_-]/gi, '-')}`) as HTMLInputElement).checked).toBe(true);

    viewModel.selectedTab.value = customJsonTaskId;
    expect((shadowRoot.querySelector(`#popover-task-${customJsonTaskId.replace(/[^a-z0-9_-]/gi, '-')}`) as HTMLInputElement).checked).toBe(true);
    expect((shadowRoot.querySelector(`[data-role="task-panel"][data-task-id="${customJsonTaskId}"]`) as HTMLElement).hidden).toBe(false);

    viewModel.lexicalState.value = { ...idleState, status: 'loading' };
    expect(shadowRoot.querySelector('.context-loader')?.getAttribute('style')).toContain('display: grid');

    view.destroy();
  });
});