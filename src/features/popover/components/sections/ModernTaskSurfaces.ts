import type { ExplainTaskState } from '../../../../../src/llm/types';
import type { TaskId } from '../../../../shared/task-ids';
import type { PopoverTaskDescriptor } from '../../events/PopoverEvents';
import { createJsonRuntime, renderJsonState } from './JsonSection';
import { createMarkdownRuntime, renderMarkdownState, resetMarkdown } from './MarkdownSection';

export type ModernTaskPanelRuntime = {
  descriptor: PopoverTaskDescriptor;
  button: HTMLButtonElement;
  panel: HTMLElement;
  render: (state: ExplainTaskState) => void;
  dispose: () => void;
};

export function createModernTaskRuntimes(
  taskTabs: HTMLElement,
  taskPanels: HTMLElement,
  tasks: readonly PopoverTaskDescriptor[],
  onSelectTab: (taskId: TaskId) => void,
) {
  const runtimes = new Map<TaskId, ModernTaskPanelRuntime>();

  taskTabs.replaceChildren();
  taskPanels.replaceChildren();
  taskTabs.hidden = tasks.length === 0;

  for (const task of tasks) {
    const button = document.createElement('button');
    button.className = 'scanex-tab';
    button.type = 'button';
    button.dataset.taskId = task.id;
    button.dataset.role = 'task-tab';
    button.textContent = task.label;
    button.addEventListener('click', () => { onSelectTab(task.id); });

    const panel = document.createElement('section');
    panel.className = 'scanex-panel';
    panel.dataset.taskId = task.id;
    panel.dataset.role = 'task-panel';

    const loading = document.createElement('div');
    loading.className = 'scanex-status';
    loading.dataset.role = 'task-loading';
    loading.hidden = true;
    loading.textContent = `Streaming ${task.label}...`;

    const error = document.createElement('div');
    error.className = 'scanex-error';
    error.dataset.role = 'task-error';

    let render: (state: ExplainTaskState) => void;
    let dispose: () => void;

    if (task.kind === 'markdown') {
      const content = document.createElement('div');
      content.className = 'scanex-markdown';
      content.dataset.role = 'task-content';
      content.dataset.taskId = task.id;
      const runtime = createMarkdownRuntime(content, {
        setLoadingVisible: (visible) => { loading.hidden = !visible; },
        setErrorMessage: (message) => { error.textContent = message; },
      });
      render = (state) => { renderMarkdownState(runtime, state); };
      dispose = () => { resetMarkdown(runtime); };
      panel.append(loading, error, content);
      runtimes.set(task.id, { descriptor: task, button, panel, render, dispose });
      taskTabs.appendChild(button);
      taskPanels.appendChild(panel);
      continue;
    }

    const content = document.createElement('pre');
    content.className = 'scanex-markdown scanex-json';
    content.dataset.role = 'task-content';
    content.dataset.taskId = task.id;
    const runtime = createJsonRuntime(content, {
      setLoadingVisible: (visible) => { loading.hidden = !visible; },
      setErrorMessage: (message) => { error.textContent = message; },
    });
    render = (state) => { renderJsonState(runtime, state); };
    dispose = () => {
      content.textContent = '';
      loading.hidden = true;
      error.textContent = '';
    };
    panel.append(loading, error, content);
    runtimes.set(task.id, { descriptor: task, button, panel, render, dispose });
    taskTabs.appendChild(button);
    taskPanels.appendChild(panel);
  }

  return runtimes;
}

export function updateModernTaskSelection(taskRuntimes: Iterable<ModernTaskPanelRuntime>, selectedTaskId: TaskId | null) {
  for (const runtime of taskRuntimes) {
    const active = runtime.descriptor.id === selectedTaskId;
    runtime.button.dataset.active = String(active);
    runtime.panel.hidden = !active;
  }
}

export function renderModernTaskStates(
  taskRuntimes: Iterable<ModernTaskPanelRuntime>,
  getTaskState: (taskId: TaskId) => ExplainTaskState,
) {
  for (const runtime of taskRuntimes) {
    runtime.render(getTaskState(runtime.descriptor.id));
  }
}

export function disposeModernTaskRuntimes(taskRuntimes: Map<TaskId, ModernTaskPanelRuntime>) {
  for (const runtime of taskRuntimes.values()) {
    runtime.dispose();
  }

  taskRuntimes.clear();
}
