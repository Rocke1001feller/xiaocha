import type { ExplainTaskState } from '../../../../../src/llm/types';
import type { TaskId } from '../../../../shared/task-ids';
import type { PopoverTaskDescriptor } from '../../events/PopoverEvents';
import { createJsonRuntime, renderJsonState } from './JsonSection';
import { createMarkdownRuntime, renderMarkdownState, resetMarkdown } from './MarkdownSection';
import { getLegacySurfaceContract, sanitizeTaskId } from './OriginalTaskSurfaceContract';
import { createSpeakButton, updateTaskSpeakButton } from './TtsSpeakButtons';

export type OriginalTaskPanelRuntime = {
  descriptor: PopoverTaskDescriptor;
  radio: HTMLInputElement;
  panel: HTMLLIElement;
  speak: HTMLButtonElement;
  render: (state: ExplainTaskState) => void;
  dispose: () => void;
};

export function createOriginalTaskRuntimes(
  explorationRoot: HTMLElement,
  tasks: readonly PopoverTaskDescriptor[],
  onSelectTab: (taskId: TaskId) => void,
) {
  const runtimes = new Map<TaskId, OriginalTaskPanelRuntime>();
  const list = document.createElement('ul');

  explorationRoot.replaceChildren();

  tasks.forEach((task, index) => {
    const surfaceContract = getLegacySurfaceContract(task, index, tasks.length);
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'pcss3t';
    radio.id = `popover-task-${sanitizeTaskId(task.id)}`;
    radio.className = surfaceContract.tabClassName;
    radio.addEventListener('change', () => {
      if (radio.checked) {
        onSelectTab(task.id);
      }
    });

    const label = document.createElement('label');
    label.htmlFor = radio.id;
    label.dataset.role = 'task-tab';
    label.dataset.taskId = task.id;
    label.textContent = task.label;
    label.title = task.label;

    const panelItem = document.createElement('li');
    panelItem.className = surfaceContract.panelItemClassName;
    panelItem.dataset.role = 'task-panel';
    panelItem.dataset.taskId = task.id;

    const panel = document.createElement('div');
    panel.className = surfaceContract.panelClassName;

    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.dataset.role = 'task-loading';
    loading.style.display = 'none';
    loading.textContent = surfaceContract.loadingText;

    const error = document.createElement('div');
    error.className = 'error-message';
    error.dataset.role = 'task-error';
    error.style.display = 'none';

    let render: (state: ExplainTaskState) => void;
    let dispose: () => void;

    const speak = createSpeakButton(`task:${task.id}`, '朗读');
    speak.disabled = true;

    if (task.kind === 'markdown') {
      const content = document.createElement('div');
      content.className = surfaceContract.contentClassName;
      content.dataset.role = 'task-content';
      content.dataset.taskId = task.id;
      const runtime = createMarkdownRuntime(content, {
        setLoadingVisible: (visible) => { loading.style.display = visible ? '' : 'none'; },
        setErrorMessage: (message) => {
          error.textContent = message;
          error.style.display = message ? '' : 'none';
        },
      });
      render = (state) => { renderMarkdownState(runtime, state); };
      dispose = () => { resetMarkdown(runtime); };
      panel.append(speak, loading, error, content);
      panelItem.appendChild(panel);
      runtimes.set(task.id, { descriptor: task, radio, panel: panelItem, speak, render, dispose });
      explorationRoot.append(radio, label);
      list.appendChild(panelItem);
      return;
    }

    const content = document.createElement('pre');
    content.className = `${surfaceContract.contentClassName} scanex-json`;
    content.dataset.role = 'task-content';
    content.dataset.taskId = task.id;
    const runtime = createJsonRuntime(content, {
      setLoadingVisible: (visible) => { loading.style.display = visible ? '' : 'none'; },
      setErrorMessage: (message) => {
        error.textContent = message;
        error.style.display = message ? '' : 'none';
      },
    });
    render = (state) => { renderJsonState(runtime, state); };
    dispose = () => {
      content.textContent = '';
      loading.style.display = 'none';
      error.textContent = '';
      error.style.display = 'none';
    };
    panel.append(speak, loading, error, content);
    panelItem.appendChild(panel);
    runtimes.set(task.id, { descriptor: task, radio, panel: panelItem, speak, render, dispose });
    explorationRoot.append(radio, label);
    list.appendChild(panelItem);
  });

  explorationRoot.appendChild(list);
  return runtimes;
}

export function updateOriginalTaskSelection(taskRuntimes: Iterable<OriginalTaskPanelRuntime>, selectedTaskId: TaskId | null) {
  for (const runtime of taskRuntimes) {
    const active = runtime.descriptor.id === selectedTaskId;
    runtime.radio.checked = active;
    runtime.panel.hidden = !active;
  }
}

export function renderOriginalTaskStates(
  taskRuntimes: Iterable<OriginalTaskPanelRuntime>,
  getTaskState: (taskId: TaskId) => ExplainTaskState,
) {
  for (const runtime of taskRuntimes) {
    const state = getTaskState(runtime.descriptor.id);
    updateTaskSpeakButton(runtime.speak, state);
    runtime.render(state);
  }
}

export function disposeOriginalTaskRuntimes(taskRuntimes: Map<TaskId, OriginalTaskPanelRuntime>) {
  for (const runtime of taskRuntimes.values()) {
    runtime.dispose();
  }

  taskRuntimes.clear();
}
