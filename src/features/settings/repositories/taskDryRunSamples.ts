import type {
  ExplainSelection,
  ExplainTask,
} from '../../../../src/llm/types';

export function getTaskDryRunSample(task: ExplainTask): ExplainSelection {
  switch (task) {
    case 'lexical':
      return {
        text: 'resilient',
        context: 'The startup remained resilient despite repeated market shocks and supply-chain delays.',
        trigger: 'text-selection',
        blockIndex: 0,
        sourceLabel: 'settings-dry-run',
      };
    case 'etymology':
      return {
        text: 'nostalgia',
        context: 'The soldiers were overcome with nostalgia, a longing so acute it was once classified as a medical disease.',
        trigger: 'text-selection',
        blockIndex: 0,
        sourceLabel: 'settings-dry-run',
      };
    case 'information':
      return {
        text: 'Natural selection acts on heritable variation within a population, favoring traits that increase reproductive fitness over successive generations.',
        context:
          'Darwin introduced the mechanism of natural selection in 1859, proposing that species are not fixed but transform gradually through differential survival and reproduction.',
        trigger: 'text-selection',
        blockIndex: 0,
        sourceLabel: 'settings-dry-run',
      };
  }
}