import {
  dedupeProviderIds,
  isCustomProviderId,
  toCustomProviderId,
  toProviderViewRecord,
  type CreateCustomProviderInput,
  type CustomProviderId,
  type ProviderId,
  type ProviderRegistryRecord,
  type ProviderViewRecord,
  type SystemProviderId,
  type TestProviderConnectionInput,
  type TestProviderConnectionResult,
  type UpdateProviderInput,
} from '../events/ProviderRegistryEvents';
import type { ITaskProviderReferenceReader } from '../../task-registry/interfaces/ITaskProviderReferenceReader';
import {
  streamProviderChatCompletion,
  type ProviderTransportMessage,
} from '../../../../src/llm/provider-chat-transport';
import {
  applyProviderSecretUpdate,
  buildMergedProviders,
  buildSystemProviderOverride,
  isRuntimeProviderReady,
  providerExists,
} from './provider-registry/providerRegistryModel';
import {
  buildConnectionTestTarget,
  getSystemProviderDefinition,
  normalizeCustomProviderSlug,
  normalizeProviderEndpoint,
  normalizeProviderLabel,
  normalizeProviderModel,
  normalizeRequiredApiKey,
  ProviderRegistryValidationError,
  assertSystemProviderExists,
} from './provider-registry/providerRegistryValidation';
import {
  cloneProviderRegistryStorageState,
  loadProviderRegistryStorageState,
  persistProviderRegistryStorageState,
  type ProviderRegistryStorageState,
  watchProviderRegistryStorageState,
} from './provider-registry/providerRegistryState';

const PROVIDER_CONNECTION_TEST_MESSAGES: ProviderTransportMessage[] = [
  {
    role: 'system',
    content: 'You are a connection probe for a browser extension. Reply with a short confirmation only.',
  },
  {
    role: 'user',
    content: 'Return OK if this chat completion endpoint is working.',
  },
];

export class ProviderRegistryService {
  private taskProviderReferenceReader: ITaskProviderReferenceReader | null;

  constructor(taskProviderReferenceReader: ITaskProviderReferenceReader | null = null) {
    this.taskProviderReferenceReader = taskProviderReferenceReader;
  }

  attachTaskProviderReferenceReader(taskProviderReferenceReader: ITaskProviderReferenceReader): void {
    this.taskProviderReferenceReader = taskProviderReferenceReader;
  }

  async getMergedProviders(): Promise<Map<ProviderId, ProviderRegistryRecord>> {
    const storageState = await loadProviderRegistryStorageState();
    return buildMergedProviders(storageState);
  }

  async getProviderViews(): Promise<ProviderViewRecord[]> {
    const mergedProviders = await this.getMergedProviders();

    return [...mergedProviders.values()]
      .sort((left, right) => {
        if (left.source !== right.source) {
          return left.source === 'system' ? -1 : 1;
        }

        return left.label.localeCompare(right.label);
      })
      .map(toProviderViewRecord);
  }

  async getProviderRecord(providerId: ProviderId): Promise<ProviderRegistryRecord | null> {
    const mergedProviders = await this.getMergedProviders();
    return mergedProviders.get(providerId) ?? null;
  }

  watchMergedProviders(callback: (providers: ProviderViewRecord[]) => void): () => void {
    let disposed = false;

    const emit = async () => {
      if (disposed) {
        return;
      }

      callback(await this.getProviderViews());
    };

    void emit();

    const stopWatchingStorage = watchProviderRegistryStorageState(() => {
      void emit();
    });

    return () => {
      disposed = true;
      stopWatchingStorage();
    };
  }

  async createCustomProvider(input: CreateCustomProviderInput): Promise<CustomProviderId> {
    const now = Date.now();
    const storageState = cloneProviderRegistryStorageState(await loadProviderRegistryStorageState());
    const slug = normalizeCustomProviderSlug(input.slug);
    const providerId = toCustomProviderId(slug);

    if (providerExists(providerId, storageState)) {
      throw new ProviderRegistryValidationError(`Provider ID "${providerId}" already exists.`);
    }

    storageState.registryOverlay.customProviders[providerId] = {
      id: providerId,
      label: normalizeProviderLabel(input.label),
      endpoint: normalizeProviderEndpoint(input.endpoint),
      model: normalizeProviderModel(input.model),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    storageState.secretStore.secrets[providerId] = {
      apiKey: normalizeRequiredApiKey(input.apiKey),
      updatedAt: now,
    };

    await persistProviderRegistryStorageState(storageState);

    return providerId;
  }

  async updateProvider(input: UpdateProviderInput): Promise<void> {
    if (isCustomProviderId(input.id)) {
      await this.updateCustomProvider(input.id, input);
      return;
    }

    await this.updateSystemProvider(input.id, input);
  }

  async disableProvider(id: ProviderId): Promise<void> {
    const storageState = cloneProviderRegistryStorageState(await loadProviderRegistryStorageState());

    if (isCustomProviderId(id)) {
      const customProvider = storageState.registryOverlay.customProviders[id];
      if (!customProvider) {
        throw new ProviderRegistryValidationError(`Custom provider "${id}" does not exist.`);
      }

      const referencedTasks = await this.getReferencedTasks(id);
      if (referencedTasks.length > 0) {
        throw new ProviderRegistryValidationError(
          `Provider "${customProvider.label}" is still attached to tasks: ${referencedTasks.join(', ')}.`,
        );
      }

      if (customProvider.status === 'disabled') {
        return;
      }

      storageState.registryOverlay.customProviders[id] = {
        ...customProvider,
        status: 'disabled',
        updatedAt: Date.now(),
      };
    } else {
      assertSystemProviderExists(id);

      if (storageState.registryOverlay.disabledSystemProviderIds.includes(id)) {
        return;
      }

      storageState.registryOverlay.disabledSystemProviderIds = dedupeProviderIds([
        ...storageState.registryOverlay.disabledSystemProviderIds,
        id,
      ]) as SystemProviderId[];
    }

    await this.assertTasksRemainExecutable(storageState);
    await persistProviderRegistryStorageState(storageState);
  }

  async resetSystemProvider(id: SystemProviderId): Promise<void> {
    assertSystemProviderExists(id);

    const storageState = cloneProviderRegistryStorageState(await loadProviderRegistryStorageState());

    delete storageState.registryOverlay.systemOverrides[id];
    delete storageState.secretStore.secrets[id];
    storageState.registryOverlay.disabledSystemProviderIds = storageState.registryOverlay.disabledSystemProviderIds.filter(
      (providerId) => providerId !== id,
    );

    await this.assertTasksRemainExecutable(storageState);
    await persistProviderRegistryStorageState(storageState);
  }

  async deleteCustomProvider(id: CustomProviderId): Promise<void> {
    const storageState = cloneProviderRegistryStorageState(await loadProviderRegistryStorageState());
    const customProvider = storageState.registryOverlay.customProviders[id];

    if (!customProvider) {
      throw new ProviderRegistryValidationError(`Custom provider "${id}" does not exist.`);
    }

    const referencedTasks = await this.getReferencedTasks(id);
    if (referencedTasks.length > 0) {
      throw new ProviderRegistryValidationError(
        `Provider "${customProvider.label}" is still attached to tasks: ${referencedTasks.join(', ')}.`,
      );
    }

    delete storageState.registryOverlay.customProviders[id];
    delete storageState.secretStore.secrets[id];

    await persistProviderRegistryStorageState(storageState);
  }

  async testProviderConnection(
    input: TestProviderConnectionInput,
    signal: AbortSignal,
  ): Promise<TestProviderConnectionResult> {
    const storageState = await loadProviderRegistryStorageState();
    const existingProvider = input.providerId
      ? buildMergedProviders(storageState).get(input.providerId) ?? null
      : null;
    const target = buildConnectionTestTarget(input, existingProvider);
    const result = await streamProviderChatCompletion(target, PROVIDER_CONNECTION_TEST_MESSAGES, signal);

    return {
      providerId: input.providerId,
      providerLabel: target.label,
      content: result.content.trim(),
      reasoning: result.reasoning.trim(),
    };
  }

  private async updateCustomProvider(id: CustomProviderId, input: UpdateProviderInput): Promise<void> {
    const now = Date.now();
    const storageState = cloneProviderRegistryStorageState(await loadProviderRegistryStorageState());
    const customProvider = storageState.registryOverlay.customProviders[id];

    if (!customProvider) {
      throw new ProviderRegistryValidationError(`Custom provider "${id}" does not exist.`);
    }

    storageState.registryOverlay.customProviders[id] = {
      ...customProvider,
      label: normalizeProviderLabel(input.label),
      endpoint: normalizeProviderEndpoint(input.endpoint),
      model: normalizeProviderModel(input.model),
      updatedAt: now,
    };

    storageState.secretStore = applyProviderSecretUpdate(storageState.secretStore, id, input.apiKey, now);

    await this.assertTasksRemainExecutable(storageState);
    await persistProviderRegistryStorageState(storageState);
  }

  private async updateSystemProvider(id: SystemProviderId, input: UpdateProviderInput): Promise<void> {
    const now = Date.now();
    const storageState = cloneProviderRegistryStorageState(await loadProviderRegistryStorageState());
    const systemProvider = getSystemProviderDefinition(id);

    const normalizedLabel = normalizeProviderLabel(input.label);
    const normalizedEndpoint = normalizeProviderEndpoint(input.endpoint);
    const normalizedModel = normalizeProviderModel(input.model);
    const override = buildSystemProviderOverride(
      systemProvider,
      normalizedLabel,
      normalizedEndpoint,
      normalizedModel,
      now,
    );

    if (override) {
      storageState.registryOverlay.systemOverrides[id] = override;
    } else {
      delete storageState.registryOverlay.systemOverrides[id];
    }

    storageState.secretStore = applyProviderSecretUpdate(
      storageState.secretStore,
      id,
      input.apiKey,
      now,
      systemProvider.apiKey,
    );

    await this.assertTasksRemainExecutable(storageState);
    await persistProviderRegistryStorageState(storageState);
  }

  private async getReferencedTasks(providerId: ProviderId): Promise<string[]> {
    return this.taskProviderReferenceReader?.getProviderReferenceTasks(providerId) ?? [];
  }

  private async assertTasksRemainExecutable(storageState: ProviderRegistryStorageState): Promise<void> {
    if (!this.taskProviderReferenceReader) {
      return;
    }

    const mergedProviders = buildMergedProviders(storageState);
    const activeProviderIds: ProviderId[] = [];
    const executableProviderIds: ProviderId[] = [];

    for (const provider of mergedProviders.values()) {
      if (provider.status === 'active') {
        activeProviderIds.push(provider.id);
      }

      if (isRuntimeProviderReady(provider)) {
        executableProviderIds.push(provider.id);
      }
    }

    await this.taskProviderReferenceReader.assertTasksRetainExecutableProviders(
      activeProviderIds,
      executableProviderIds,
    );
  }
}