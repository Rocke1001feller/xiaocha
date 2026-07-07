import type { ExplainSelection } from '../../../../../src/llm/types';
import type { TaskDryRunState } from '../../viewmodels/task-dry-run/TaskDryRunController';

export type TaskDryRunSectionRefs = {
  dryRunTitle: HTMLElement;
  dryRunStatus: HTMLElement;
  dryRunProvider: HTMLElement;
  dryRunSampleLabel: HTMLElement;
  dryRunSample: HTMLTextAreaElement;
  dryRunContextLabel: HTMLElement;
  dryRunContext: HTMLTextAreaElement;
  dryRunOutputLabel: HTMLElement;
  dryRunOutput: HTMLTextAreaElement;
  dryRunReasoningShell: HTMLElement;
  dryRunReasoningLabel: HTMLElement;
  dryRunReasoning: HTMLTextAreaElement;
};

export type TaskDryRunRenderData = {
  state: TaskDryRunState;
  sample: ExplainSelection | null;
  statusLabel: string;
  outputValue: string;
  outputPlaceholder: string;
  reasoningPlaceholder: string;
};

export function renderTaskDryRunSection(
  refs: TaskDryRunSectionRefs,
  data: TaskDryRunRenderData,
  isChinese: boolean,
): void {
  refs.dryRunTitle.textContent = isChinese ? '真实测试预览' : 'Dry Run Preview';
  refs.dryRunSampleLabel.textContent = isChinese ? '内置样本文本' : 'Built-in Sample Text';
  refs.dryRunContextLabel.textContent = isChinese ? '内置样本上下文' : 'Built-in Sample Context';
  refs.dryRunOutputLabel.textContent = isChinese ? '真实输出' : 'Live Output';
  refs.dryRunReasoningLabel.textContent = isChinese ? 'Reasoning 输出' : 'Reasoning Output';
  refs.dryRunStatus.textContent = data.statusLabel;
  refs.dryRunStatus.dataset.state = data.state.status;
  refs.dryRunProvider.hidden = data.state.providerLabel.length === 0;
  refs.dryRunProvider.textContent = data.state.providerLabel;
  refs.dryRunSample.value = data.sample?.text ?? '';
  refs.dryRunContext.value = data.sample?.context ?? '';
  refs.dryRunOutput.value = data.outputValue;
  refs.dryRunOutput.placeholder = data.outputPlaceholder;
  refs.dryRunReasoning.value = data.state.reasoning;
  refs.dryRunReasoning.placeholder = data.reasoningPlaceholder;
  refs.dryRunReasoningShell.hidden = !data.state.reasoning && data.state.status !== 'running';
}
