import { Observable } from '../../../../shared/Observable';
import {
  isCustomProviderId,
  type CustomProviderId,
  type ProviderId,
  type SystemProviderId,
  type TestProviderConnectionInput,
  type TestProviderConnectionResult,
  type UpdateProviderInput,
} from '../../../provider-registry/events/ProviderRegistryEvents';
import type { SettingsProviderRecord } from '../../events/SettingsEvents';
import type { ISettingsProviderRepository } from '../../interfaces/ISettingsProviderRepository';
import type { SettingsSelectionState } from '../shell/SettingsSelectionState';
import {
  buildCreateProviderInput,
  buildProviderEditorViewState,
  buildProviderListViewState,
  buildTestProviderConnectionInput,
  buildUpdateProviderInput,
  createDuplicateProviderDraft,
  createProviderDraftFromRecord,
  formatProviderConnectionSuccessMessage,
  getSelectedProvider,
  type ProviderDiscardAction,
  type ProviderEditorViewState,
  type ProviderListViewState,
} from './providerEditorState';
import {
  EMPTY_PROVIDER_DRAFT,
  areProviderDraftsEqual,
  cloneProviderDraft,
  type ProviderDraft,
  type ProviderEditorFeedback,
  type ProviderEditorMode,
} from './providerEditorTypes';
import { ProviderConnectionTestController } from './ProviderConnectionTestController';
import type { ProviderEditorCopy } from './providerEditorCopy';

type ProviderEditorHooks = {
  getCopy: () => ProviderEditorCopy;
};

export class ProviderEditorController {
  readonly providers = new Observable<SettingsProviderRecord[]>([]);

  readonly providerQuery = new Observable('');

  readonly selectedProviderId = new Observable<ProviderId | null>(null);

  readonly providerEditorMode = new Observable<ProviderEditorMode>('existing');

  readonly providerDraft = new Observable<ProviderDraft>(cloneProviderDraft(EMPTY_PROVIDER_DRAFT));

  readonly isProviderDirty = new Observable(false);

  readonly isSavingProvider = new Observable(false);

  readonly providerFeedback = new Observable<ProviderEditorFeedback>(null);

  private providerDraftBaseline: ProviderDraft = cloneProviderDraft(EMPTY_PROVIDER_DRAFT);

  private providerSelectionBeforeCreate: ProviderId | null = null;

  private readonly connectionTestController: ProviderConnectionTestController;

  constructor(
    private readonly providerRepository: ISettingsProviderRepository,
    private readonly hooks: ProviderEditorHooks,
  ) {
    this.connectionTestController = new ProviderConnectionTestController(providerRepository, {
      getDraft: () => this.providerDraft.value,
      getSelectedProvider: () => this.getSelectedProvider(),
      isCreateMode: () => this.providerEditorMode.value === 'create',
      buildInput: (draft, provider) =>
        buildTestProviderConnectionInput(draft, provider, this.providerEditorMode.value),
      formatSuccessMessage: (result) => this.formatProviderConnectionSuccessMessage(result),
      setFeedback: (feedback) => {
        this.providerFeedback.value = feedback;
      },
      getCopy: () => this.copy,
    });
  }

  dispose() {
    this.connectionTestController.dispose();
  }

  applyProviderSnapshot(
    providers: SettingsProviderRecord[],
    previousSelection?: SettingsSelectionState,
  ) {
    this.providers.value = providers;

    const stayInCreateMode = previousSelection?.providerEditorMode === 'create';
    if (stayInCreateMode) {
      this.providerEditorMode.value = 'create';
      this.selectedProviderId.value = null;
      this.applyProviderDraft({
        ...this.providerDraft.value,
      });
      return;
    }

    const nextProviderId = previousSelection?.providerId ?? providers[0]?.id ?? null;
    this.selectedProviderId.value = providers.some((provider) => provider.id === nextProviderId)
      ? nextProviderId
      : providers[0]?.id ?? null;
    this.providerEditorMode.value = 'existing';

    const selectedProviderChanged = this.selectedProviderId.value !== previousSelection?.providerId;
    if (selectedProviderChanged) {
      this.connectionTestController.cancel(true);
    }

    if (selectedProviderChanged || !this.isProviderDirty.value) {
      this.syncProviderDraftFromSelectedProvider();
    }
  }

  setProviderQuery(query: string) {
    this.providerQuery.value = query;
  }

  selectProvider(providerId: string) {
    const provider = this.providers.value.find((item) => item.id === providerId);
    if (!provider) {
      return;
    }

    this.connectionTestController.cancel(true);
    this.providerSelectionBeforeCreate = null;
    this.providerEditorMode.value = 'existing';
    this.selectedProviderId.value = provider.id;
    this.providerFeedback.value = null;
    this.syncProviderDraftFromProvider(provider);
  }

  beginCreateProvider() {
    this.connectionTestController.cancel(true);
    this.providerSelectionBeforeCreate = this.getSelectedProvider()?.id ?? null;
    this.providerEditorMode.value = 'create';
    this.selectedProviderId.value = null;
    this.providerFeedback.value = null;
    this.commitProviderDraftBaseline(cloneProviderDraft(EMPTY_PROVIDER_DRAFT));
  }

  duplicateSelectedProvider() {
    const provider = this.getSelectedProvider();
    if (!provider) {
      return;
    }

    this.connectionTestController.cancel(true);
    this.providerSelectionBeforeCreate = provider.id;
    this.providerEditorMode.value = 'create';
    this.selectedProviderId.value = null;
    this.providerFeedback.value = null;
    this.commitProviderDraftBaseline(this.createDuplicateProviderDraft(provider));
  }

  cancelProviderEditing() {
    this.connectionTestController.cancel(true);
    this.providerFeedback.value = null;

    if (this.providerEditorMode.value === 'create') {
      this.providerEditorMode.value = 'existing';
      const fallbackProviderId = this.providerSelectionBeforeCreate ?? this.providers.value[0]?.id ?? null;
      this.providerSelectionBeforeCreate = null;
      this.selectedProviderId.value = fallbackProviderId;
      this.syncProviderDraftFromSelectedProvider();
      return;
    }

    this.syncProviderDraftFromSelectedProvider();
  }

  updateProviderDraftField(field: keyof ProviderDraft, value: string) {
    this.providerFeedback.value = null;
    this.applyProviderDraft({
      ...this.providerDraft.value,
      [field]: value,
    });
  }

  async saveProvider() {
    if (this.isProviderConnectionTestRunning()) {
      return;
    }

    const draft = cloneProviderDraft(this.providerDraft.value);
    this.isSavingProvider.value = true;
    this.providerFeedback.value = null;

    try {
      if (this.providerEditorMode.value === 'create') {
        const createdProviderId = await this.providerRepository.createCustomProvider(buildCreateProviderInput(draft));
        this.providerEditorMode.value = 'existing';
        this.selectedProviderId.value = createdProviderId;
        this.providerSelectionBeforeCreate = null;
        this.commitProviderDraftBaseline({
          ...draft,
          apiKey: '',
        });
        this.providerFeedback.value = {
          tone: 'success',
          text: this.copy.providerCreated,
        };
        return;
      }

      const selectedProvider = this.getSelectedProvider();
      if (!selectedProvider) {
        throw new Error(this.copy.noSelectedProvider);
      }

      await this.providerRepository.updateProvider(buildUpdateProviderInput(selectedProvider, draft));
      this.commitProviderDraftBaseline({
        ...draft,
        apiKey: '',
      });
      this.providerFeedback.value = {
        tone: 'success',
        text: this.copy.providerSaved,
      };
    } catch (error) {
      this.providerFeedback.value = {
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to save provider.',
      };
    } finally {
      this.isSavingProvider.value = false;
    }
  }

  async deleteOrDisableSelectedProvider() {
    if (this.isProviderConnectionTestRunning()) {
      return;
    }

    if (this.providerEditorMode.value === 'create') {
      this.cancelProviderEditing();
      return;
    }

    const selectedProvider = this.getSelectedProvider();
    if (!selectedProvider) {
      return;
    }

    this.isSavingProvider.value = true;
    this.providerFeedback.value = null;

    try {
      if (selectedProvider.source === 'system') {
        await this.providerRepository.disableProvider(selectedProvider.id);
        this.providerFeedback.value = {
          tone: 'success',
          text: this.copy.systemProviderDisabled,
        };
      } else {
        await this.providerRepository.deleteCustomProvider(selectedProvider.id as CustomProviderId);
        this.selectedProviderId.value = null;
        this.providerFeedback.value = {
          tone: 'success',
          text: this.copy.customProviderDeleted,
        };
      }

      this.commitProviderDraftBaseline(cloneProviderDraft(EMPTY_PROVIDER_DRAFT));
    } catch (error) {
      this.providerFeedback.value = {
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to update provider status.',
      };
    } finally {
      this.isSavingProvider.value = false;
    }
  }

  async resetSelectedSystemProvider() {
    const selectedProvider = this.getSelectedProvider();
    if (!selectedProvider || selectedProvider.source !== 'system' || this.isProviderConnectionTestRunning()) {
      return;
    }

    this.isSavingProvider.value = true;
    this.providerFeedback.value = null;

    try {
      await this.providerRepository.resetSystemProvider(selectedProvider.id as SystemProviderId);
      this.commitProviderDraftBaseline({
        ...this.providerDraft.value,
        apiKey: '',
      });
      this.providerFeedback.value = {
        tone: 'success',
        text: this.copy.systemProviderReset,
      };
    } catch (error) {
      this.providerFeedback.value = {
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to reset provider.',
      };
    } finally {
      this.isSavingProvider.value = false;
    }
  }

  getSelectedProvider(): SettingsProviderRecord | null {
    return getSelectedProvider(this.providers.value, this.selectedProviderId.value);
  }

  getProviderListViewState(): ProviderListViewState {
    return buildProviderListViewState({
      providers: this.providers.value,
      selectedProviderId: this.selectedProviderId.value,
      query: this.providerQuery.value,
      mode: this.providerEditorMode.value,
      isDirty: this.isProviderDirty.value,
      draft: this.providerDraft.value,
      isConnectionTestRunning: this.isProviderConnectionTestRunning(),
      copy: this.copy,
    });
  }

  isProviderConnectionTestRunning(): boolean {
    return this.connectionTestController.isRunning();
  }

  getProviderTestActionLabel(): string {
    return this.connectionTestController.getActionLabel();
  }

  async toggleProviderConnectionTest() {
    await this.connectionTestController.toggle();
  }

  getProviderEditorViewState(): ProviderEditorViewState {
    return buildProviderEditorViewState({
      providers: this.providers.value,
      selectedProviderId: this.selectedProviderId.value,
      mode: this.providerEditorMode.value,
      draft: this.providerDraft.value,
      isDirty: this.isProviderDirty.value,
      isSaving: this.isSavingProvider.value,
      isConnectionTestRunning: this.isProviderConnectionTestRunning(),
      copy: this.copy,
      testActionLabel: this.getProviderTestActionLabel(),
    });
  }

  private syncProviderDraftFromProvider(provider: SettingsProviderRecord) {
    this.commitProviderDraftBaseline(createProviderDraftFromRecord(provider));
  }

  private syncProviderDraftFromSelectedProvider() {
    const selectedProvider = this.getSelectedProvider();
    if (!selectedProvider) {
      this.commitProviderDraftBaseline(cloneProviderDraft(EMPTY_PROVIDER_DRAFT));
      return;
    }

    this.syncProviderDraftFromProvider(selectedProvider);
  }

  private createDuplicateProviderDraft(provider: SettingsProviderRecord): ProviderDraft {
    return createDuplicateProviderDraft(provider, this.providers.value, this.copy);
  }

  private commitProviderDraftBaseline(draft: ProviderDraft) {
    this.providerDraftBaseline = cloneProviderDraft(draft);
    this.providerDraft.value = cloneProviderDraft(draft);
    this.isProviderDirty.value = false;
  }

  private applyProviderDraft(draft: ProviderDraft) {
    const nextDraft = cloneProviderDraft(draft);
    this.providerDraft.value = nextDraft;
    this.isProviderDirty.value = !areProviderDraftsEqual(nextDraft, this.providerDraftBaseline);
  }

  private formatProviderConnectionSuccessMessage(result: TestProviderConnectionResult): string {
    return formatProviderConnectionSuccessMessage(result, this.copy);
  }

  private get copy() {
    return this.hooks.getCopy();
  }
}