import type { SystemTaskId, TaskId } from '../shared/task-ids';

export type ExplainTask = SystemTaskId;

export type RuntimeTaskId = TaskId;

export type ExplainTrigger = 'block-click' | 'text-selection';

export type ExplainSelection = {
  text: string;
  context: string;
  trigger: ExplainTrigger;
  blockIndex: number;
  sourceLabel: string;
  charStart?: number;
  charEnd?: number;
};

export type LexicalDefinition = {
  pos?: string;
  meaning?: string;
  example?: {
    source?: string;
    target?: string;
  };
};

export type LexicalResult = {
  phonetic?: string;
  translation?: string;
  contextualAnalysis?: string;
  definitions: LexicalDefinition[];
};

export type ExplainTaskResult<TTask extends TaskId = ExplainTask> = {
  task: TTask;
  providerId: string;
  providerLabel: string;
  content: string;
  reasoning: string;
  lexical?: LexicalResult;
};

export type ExplainTaskState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  providerLabel?: string;
  content: string;
  reasoning: string;
  lexical?: LexicalResult;
  errorMessage?: string;
};

export type StreamUpdate = {
  content?: string;
  reasoning?: string;
  contentDelta?: string;
  reasoningDelta?: string;
};
