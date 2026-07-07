// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import type { PopoverTaskDescriptor } from '../../src/features/popover/events/PopoverEvents';
import {
  createOriginalTaskRuntimes,
  disposeOriginalTaskRuntimes,
  updateOriginalTaskSelection,
} from '../../src/features/popover/components/sections/OriginalTaskSurfaces';

const builtInTasks: PopoverTaskDescriptor[] = [
  { id: 'etymology', label: 'Etymology', kind: 'markdown' },
  { id: 'information', label: 'Information', kind: 'markdown' },
];

describe('OriginalTaskSurfaces legacy DOM contract', () => {
  it('keeps the radio and panel classes expected by original theme CSS', () => {
    document.body.innerHTML = '<div class="pcss3t pcss3t-effect-scale pcss3t-theme-1"></div>';
    const root = document.querySelector('.pcss3t') as HTMLElement;
    const runtimes = createOriginalTaskRuntimes(root, builtInTasks, () => {});

    const etymologyRadio = root.querySelector('#popover-task-etymology') as HTMLInputElement;
    const informationRadio = root.querySelector('#popover-task-information') as HTMLInputElement;
    const etymologyPanel = root.querySelector('[data-role="task-panel"][data-task-id="etymology"]') as HTMLElement;
    const informationPanel = root.querySelector('[data-role="task-panel"][data-task-id="information"]') as HTMLElement;

    expect(etymologyRadio.className).toBe('tab-content-first');
    expect(informationRadio.className).toBe('tab-content-last');

    expect(etymologyPanel.className).toContain('tab-content');
    expect(etymologyPanel.className).toContain('tab-content-first');
    expect(etymologyPanel.querySelector('.etymology-panel.part2-content')).not.toBeNull();
    expect(etymologyPanel.querySelector('.etymology-panel-content.markdown-content')).not.toBeNull();

    expect(informationPanel.className).toContain('tab-content');
    expect(informationPanel.className).toContain('tab-content-last');
    expect(informationPanel.querySelector('.information-panel.base-markdown-panel.part2-content')).not.toBeNull();
    expect(informationPanel.querySelector('.info-panel-content.markdown-content')).not.toBeNull();

    updateOriginalTaskSelection(runtimes.values(), 'information');
    expect(informationRadio.checked).toBe(true);

    disposeOriginalTaskRuntimes(runtimes);
  });
});