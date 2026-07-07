type DragPosition = { left: number; top: number };

type DragBehaviorOptions = {
  getPosition: () => DragPosition;
  applyPosition: (position: DragPosition) => void;
  setDragging: (active: boolean) => void;
};

export type DragBehavior = {
  start: (event: PointerEvent) => void;
  stop: () => void;
  dispose: () => void;
};

export function createDragBehavior(options: DragBehaviorOptions): DragBehavior {
  const state = { active: false, startX: 0, startY: 0, left: 0, top: 0 };

  const stop = () => {
    state.active = false;
    options.setDragging(false);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', stop);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!state.active) return;
    options.applyPosition({
      left: state.left + (event.clientX - state.startX),
      top: state.top + (event.clientY - state.startY),
    });
  };

  return {
    start(event) {
      state.active = true;
      state.startX = event.clientX;
      state.startY = event.clientY;
      ({ left: state.left, top: state.top } = options.getPosition());
      options.setDragging(true);
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', stop);
    },
    stop,
    dispose: stop,
  };
}