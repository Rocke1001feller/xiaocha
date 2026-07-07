import type { ExplainSelection, ExplainTaskResult } from '../../../../src/llm/types';
import type { TaskId } from '../../../shared/task-ids';

export const POPOVER_START_TASK = 'scan-explain/popover/start-task' as const;
export const POPOVER_CANCEL_TASK = 'scan-explain/popover/cancel-task' as const;
export const POPOVER_STREAM_EVENT = 'scan-explain/popover/stream-event' as const;

export type ViewportRect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type PopoverSelectionData = {
  text: string;
  context: string;
  trigger: ExplainSelection['trigger'];
  blockIndex: number;
  sourceLabel: string;
  rect: ViewportRect;
  lastLineRect: ViewportRect;
};

export type PopoverThemeId = 'basic' | 'pro' | 'creative' | 'galaxy' | 'neon' | 'cyberpunk' | 'aurora';

export type PopoverTheme = {
  id: PopoverThemeId;
  name: string;
  tier: 'free' | 'premium';
  description: string;
};

export const POPOVER_THEMES: readonly PopoverTheme[] = [
  { id: 'basic', name: 'Basic Light', tier: 'free', description: 'Clean paper surface.' },
  { id: 'pro', name: 'Pro Dark', tier: 'free', description: 'Focused dark workspace.' },
  { id: 'creative', name: 'Creative Vibe', tier: 'free', description: 'Warm editorial gradient.' },
  { id: 'galaxy', name: 'Galaxy', tier: 'premium', description: 'Deep-space indigo.' },
  { id: 'neon', name: 'Neon', tier: 'premium', description: 'Signal-green cyber glow.' },
  { id: 'cyberpunk', name: 'Cyberpunk', tier: 'premium', description: 'Hot pink and amber contrast.' },
  { id: 'aurora', name: 'Aurora', tier: 'premium', description: 'Glacial light bloom.' },
] as const;

export type PopoverTaskKind = 'lexical' | 'markdown' | 'json';

export type PopoverTaskDescriptor = {
  id: TaskId;
  label: string;
  kind: PopoverTaskKind;
};

export type StartPopoverTaskMessage = {
  kind: typeof POPOVER_START_TASK;
  requestId: string;
  task: TaskId;
  selection: ExplainSelection;
};

export type CancelPopoverTaskMessage = {
  kind: typeof POPOVER_CANCEL_TASK;
  requestId: string;
};

export type PopoverStreamStartedEvent = {
  kind: typeof POPOVER_STREAM_EVENT;
  requestId: string;
  task: TaskId;
  phase: 'started';
  providerLabel: string;
};

export type PopoverStreamChunkEvent = {
  kind: typeof POPOVER_STREAM_EVENT;
  requestId: string;
  task: TaskId;
  phase: 'chunk';
  contentDelta?: string;
  reasoningDelta?: string;
};

export type PopoverStreamCompletedEvent = {
  kind: typeof POPOVER_STREAM_EVENT;
  requestId: string;
  task: TaskId;
  phase: 'completed';
  result: ExplainTaskResult<TaskId>;
};

export type PopoverStreamFailedEvent = {
  kind: typeof POPOVER_STREAM_EVENT;
  requestId: string;
  task: TaskId;
  phase: 'failed';
  errorMessage: string;
};

export type PopoverStreamEvent =
  | PopoverStreamStartedEvent
  | PopoverStreamChunkEvent
  | PopoverStreamCompletedEvent
  | PopoverStreamFailedEvent;

export type PopoverRuntimeMessage =
  | StartPopoverTaskMessage
  | CancelPopoverTaskMessage
  | PopoverStreamEvent;

export function toViewportRect(rect: DOMRect | ClientRect): ViewportRect {
  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

export function toExplainSelection(selection: PopoverSelectionData): ExplainSelection {
  return {
    text: selection.text,
    context: selection.context,
    trigger: selection.trigger,
    blockIndex: selection.blockIndex,
    sourceLabel: selection.sourceLabel,
  };
}

export function isPopoverStartTaskMessage(value: unknown): value is StartPopoverTaskMessage {
  return Boolean(value && typeof value === 'object' && (value as StartPopoverTaskMessage).kind === POPOVER_START_TASK);
}

export function isPopoverCancelTaskMessage(value: unknown): value is CancelPopoverTaskMessage {
  return Boolean(value && typeof value === 'object' && (value as CancelPopoverTaskMessage).kind === POPOVER_CANCEL_TASK);
}

export function isPopoverStreamEvent(value: unknown): value is PopoverStreamEvent {
  return Boolean(value && typeof value === 'object' && (value as PopoverStreamEvent).kind === POPOVER_STREAM_EVENT);
}