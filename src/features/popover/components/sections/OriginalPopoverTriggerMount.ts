import { createOriginalTriggerElement } from '../markup/original-popover-markup';
import originalStyles from '../../styles/original-themes';

export type MountedTrigger = {
  triggerHost: HTMLSpanElement;
  triggerElement: HTMLDivElement;
};

export function mountInlineTrigger(
  range: Range,
  currentTheme: string,
  onActivate: () => void,
): MountedTrigger {
  const insertionRange = range.cloneRange();
  insertionRange.collapse(false);

  const triggerHost = document.createElement('span');
  triggerHost.dataset.scanExplainInlineTrigger = 'true';
  triggerHost.setAttribute('contenteditable', 'false');

  const shadow = triggerHost.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `${originalStyles}
    :host {
      display: inline-block;
      position: relative;
      width: 16px;
      height: 14px;
      margin: 0 4px;
      vertical-align: baseline;
      line-height: 1;
      user-select: none;
    }

    .oow-selection-trigger-button {
      position: absolute !important;
      top: 2px !important;
      left: 0 !important;
      margin: 0 !important;
    }
  `;

  const trigger = createOriginalTriggerElement();
  trigger.dataset.theme = currentTheme;
  trigger.classList.add('visible');
  trigger.classList.remove('hidden');
  trigger.addEventListener('pointerenter', () => { onActivate(); });
  trigger.addEventListener('click', () => { onActivate(); });

  shadow.append(style, trigger);
  insertionRange.insertNode(triggerHost);

  return { triggerHost, triggerElement: trigger };
}

export function removeInlineTrigger(triggerHost: HTMLSpanElement | null) {
  if (!triggerHost) {
    return;
  }

  const parent = triggerHost.parentNode;
  triggerHost.remove();

  if (parent instanceof Element && !window.getSelection()?.toString().trim()) {
    parent.normalize();
  }
}
