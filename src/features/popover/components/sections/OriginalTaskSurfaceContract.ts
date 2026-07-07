import type { PopoverTaskDescriptor } from '../../events/PopoverEvents';

export function sanitizeTaskId(taskId: string) {
  return taskId.replace(/[^a-z0-9_-]/gi, '-');
}

export function getLegacySurfaceContract(
  task: PopoverTaskDescriptor,
  index: number,
  totalTasks: number,
) {
  const tabClassName = getLegacyTabClassName(index, totalTasks);
  const panelItemClassName = `tab-content ${tabClassName} typography`;

  if (task.id === 'etymology') {
    return {
      tabClassName,
      panelItemClassName,
      panelClassName: 'etymology-panel part2-content',
      contentClassName: 'etymology-panel-content markdown-content',
      loadingText: 'Streaming etymology…',
    };
  }

  if (task.id === 'information') {
    return {
      tabClassName,
      panelItemClassName,
      panelClassName: 'information-panel base-markdown-panel part2-content',
      contentClassName: 'info-panel-content markdown-content',
      loadingText: 'Streaming interpretation…',
    };
  }

  return {
    tabClassName,
    panelItemClassName,
    panelClassName: 'base-markdown-panel part2-content',
    contentClassName: 'markdown-content',
    loadingText: `Streaming ${task.label}...`,
  };
}

function getLegacyTabClassName(index: number, totalTasks: number) {
  if (index === 0) {
    return 'tab-content-first';
  }

  if (index === totalTasks - 1) {
    return 'tab-content-last';
  }

  return `tab-content-${index + 1}`;
}
