import type {
  TestProviderConnectionInput,
  TestProviderConnectionResult,
} from '../../../provider-registry/events/ProviderRegistryEvents';
import type { SettingsProviderRecord } from '../../events/SettingsEvents';
import type { ISettingsProviderRepository } from '../../interfaces/ISettingsProviderRepository';
import {
  cloneProviderDraft,
  type ProviderDraft,
  type ProviderEditorFeedback,
} from './providerEditorTypes';
import type { ProviderEditorCopy } from './providerEditorCopy';

type ProviderConnectionTestHooks = {
  getDraft: () => ProviderDraft;
  getSelectedProvider: () => SettingsProviderRecord | null;
  isCreateMode: () => boolean;
  buildInput: (
    draft: ProviderDraft,
    provider: SettingsProviderRecord | null,
  ) => TestProviderConnectionInput;
  formatSuccessMessage: (result: TestProviderConnectionResult) => string;
  setFeedback: (feedback: ProviderEditorFeedback) => void;
  getCopy: () => ProviderEditorCopy;
};

export class ProviderConnectionTestController {
  private activeController: AbortController | null = null;

  constructor(
    private readonly providerRepository: ISettingsProviderRepository,
    private readonly hooks: ProviderConnectionTestHooks,
  ) {}

  dispose() {
    this.cancel(true);
  }

  isRunning(): boolean {
    return this.activeController != null;
  }

  getActionLabel(): string {
    const copy = this.hooks.getCopy();
    return this.isRunning() ? copy.cancelTest : copy.testConnection;
  }

  cancel(resetFeedback: boolean) {
    this.activeController?.abort();
    this.activeController = null;

    if (!resetFeedback) {
      this.hooks.setFeedback({
        tone: 'info',
        text: this.hooks.getCopy().connectionTestCancelled,
      });
    }
  }

  async toggle() {
    if (this.isRunning()) {
      this.cancel(false);
      return;
    }

    const selectedProvider = this.hooks.getSelectedProvider();
    if (!this.hooks.isCreateMode() && !selectedProvider) {
      return;
    }

    const draft = cloneProviderDraft(this.hooks.getDraft());
    let input: TestProviderConnectionInput;

    try {
      input = this.hooks.buildInput(draft, selectedProvider);
    } catch (error) {
      this.hooks.setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to test provider connection.',
      });
      return;
    }

    const controller = new AbortController();
    const copy = this.hooks.getCopy();
    const draftLabel = draft.label.trim() || selectedProvider?.label || copy.currentProviderLabel;

    this.cancel(true);
    this.activeController = controller;
    this.hooks.setFeedback({
      tone: 'info',
      text: copy.formatTestingConnection(draftLabel),
    });

    try {
      const result = await this.providerRepository.testProviderConnection(input, controller.signal);
      if (this.activeController !== controller) {
        return;
      }

      this.activeController = null;
      this.hooks.setFeedback({
        tone: 'success',
        text: this.hooks.formatSuccessMessage(result),
      });
    } catch (error) {
      if (controller.signal.aborted) {
        if (this.activeController === controller) {
          this.activeController = null;
          this.hooks.setFeedback({
            tone: 'info',
            text: copy.connectionTestCancelled,
          });
        }

        return;
      }

      if (this.activeController !== controller) {
        return;
      }

      this.activeController = null;
      this.hooks.setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to test provider connection.',
      });
    }
  }
}