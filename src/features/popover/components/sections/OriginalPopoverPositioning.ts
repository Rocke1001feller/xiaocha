import type { ViewportRect } from '../../events/PopoverEvents';

export function positionPopover(popover: HTMLElement, rect: ViewportRect) {
  const margin = 16;
  const viewportWidth = document.documentElement.clientWidth;
  const panelWidth = popover.offsetWidth || 450;
  const center = rect.left + rect.width / 2;
  const left = center < viewportWidth / 2 ? viewportWidth - panelWidth - margin : margin;
  popover.style.setProperty('--oow-modal-left', `${Math.round(left)}px`);
  popover.style.setProperty('--oow-modal-top', `${margin}px`);
  popover.dataset.placement = 'side';
  popover.classList.add('is-positioned');
}
