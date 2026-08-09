// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsView } from '../../src/features/settings/components/SettingsView';
import {
  createSettingsSnapshot,
  type SettingsProviderRecord,
  type SettingsSnapshot,
} from '../../src/features/settings/events/SettingsEvents';
import type { ISettingsProviderRepository } from '../../src/features/settings/interfaces/ISettingsProviderRepository';
import type { ISettingsRepository } from '../../src/features/settings/interfaces/ISettingsRepository';
import type { ISettingsTaskRepository } from '../../src/features/settings/interfaces/ISettingsTaskRepository';
import { SettingsViewModel } from '../../src/features/settings/viewmodels/SettingsViewModel';

import type {
  CreateCustomProviderInput,
  CustomProviderId,
  ProviderId,
  SystemProviderId,
  TestProviderConnectionInput,
  TestProviderConnectionResult,
  UpdateProviderInput,
} from '../../src/features/provider-registry/events/ProviderRegistryEvents';
import type { ResolvedUiDisplayLanguage, UiDisplayLanguagePreference } from '../../src/shared/ui-language';
import type {
  CreateCustomTaskInput,
  CustomTaskId,
  SystemTaskId,
  TaskRegistryRecord,
  UpdateTaskInput,
} from '../../src/features/task-registry/events/TaskRegistryEvents';

import { InMemorySettingsTtsRepository } from './helpers/inMemoryTtsRepository';

function cloneProviders(providers: SettingsProviderRecord[]): SettingsProviderRecord[] {
  return providers.map((provider) => ({
    ...provider,
    tags: [...provider.tags],
  }));
}

function formatProviderSummary(endpoint: string, model: string) {
  try {
    return `${new URL(endpoint).hostname} · ${model}`;
  } catch {
    return model;
  }
}

function buildProviderTags(provider: SettingsProviderRecord): string[] {
  return [...new Set([
    provider.source === 'system' ? 'system' : 'custom',
    provider.status,
    provider.mutability === 'override-only' ? 'default' : 'editable',
    provider.hasSecret ? 'secret' : 'missing-secret',
    provider.isRuntimeReachable ? 'reachable' : 'inactive',
  ])];
}

function hydrateProvider(provider: SettingsProviderRecord): SettingsProviderRecord {
  return {
    ...provider,
    summary: formatProviderSummary(provider.endpoint, provider.model),
    tags: buildProviderTags(provider),
    tone: provider.source === 'system' ? 'green' : 'violet',
    icon: provider.source === 'system' ? 'bolt' : 'hub',
  };
}

function maskApiKey(apiKey: string) {
  if (apiKey.length <= 8) {
    return '••••••••';
  }

  return `${apiKey.slice(0, 4)}••••••••${apiKey.slice(-4)}`;
}

function createCustomProviderRecord(input: CreateCustomProviderInput): SettingsProviderRecord {
  return hydrateProvider({
    id: `custom:${input.slug}` as CustomProviderId,
    source: 'user',
    status: 'active',
    mutability: 'full',
    hasSecret: true,
    isRuntimeReachable: false,
    label: input.label,
    endpoint: input.endpoint,
    model: input.model,
    apiKeyMasked: maskApiKey(input.apiKey),
    summary: '',
    tags: [],
    tone: 'violet',
    icon: 'hub',
  });
}

class InMemorySettingsProviderRepository implements ISettingsProviderRepository {
  private providers: SettingsProviderRecord[];

  readonly testConnectionCalls: TestProviderConnectionInput[] = [];

  private readonly initialSystemProviders = new Map<ProviderId, SettingsProviderRecord>();

  private readonly watchers = new Set<(providers: SettingsProviderRecord[]) => void>();

  constructor(initialProviders: SettingsProviderRecord[]) {
    this.providers = this.sortProviders(cloneProviders(initialProviders).map(hydrateProvider));

    for (const provider of this.providers.filter((item) => item.source === 'system')) {
      this.initialSystemProviders.set(provider.id, { ...provider, tags: [...provider.tags] });
    }
  }

  async listProviders(): Promise<SettingsProviderRecord[]> {
    return cloneProviders(this.providers);
  }

  async getProvider(id: ProviderId): Promise<SettingsProviderRecord | null> {
    const provider = this.providers.find((item) => item.id === id);
    return provider ? hydrateProvider({ ...provider, tags: [...provider.tags] }) : null;
  }

  async createCustomProvider(input: CreateCustomProviderInput): Promise<CustomProviderId> {
    const id = `custom:${input.slug}` as CustomProviderId;
    if (this.providers.some((provider) => provider.id === id)) {
      throw new Error(`Provider ID "${id}" already exists.`);
    }

    this.providers = this.sortProviders([...this.providers, createCustomProviderRecord(input)]);
    this.emit();
    return id;
  }

  async updateProvider(input: UpdateProviderInput): Promise<void> {
    const providerIndex = this.providers.findIndex((provider) => provider.id === input.id);
    if (providerIndex === -1) {
      throw new Error(`Provider "${input.id}" does not exist.`);
    }

    const provider = this.providers[providerIndex];
    const nextProvider = hydrateProvider({
      ...provider,
      label: input.label,
      endpoint: input.endpoint,
      model: input.model,
      apiKeyMasked: input.apiKey ? maskApiKey(input.apiKey) : provider.apiKeyMasked,
      hasSecret: input.apiKey ? true : provider.hasSecret,
      isRuntimeReachable:
        provider.status === 'active' &&
        (input.apiKey ? true : provider.hasSecret) &&
        provider.isRuntimeReachable,
    });

    this.providers.splice(providerIndex, 1, nextProvider);
    this.providers = this.sortProviders(this.providers);
    this.emit();
  }

  async disableProvider(id: ProviderId): Promise<void> {
    const providerIndex = this.providers.findIndex((provider) => provider.id === id);
    if (providerIndex === -1) {
      throw new Error(`Provider "${id}" does not exist.`);
    }

    const provider = this.providers[providerIndex];
    this.providers.splice(
      providerIndex,
      1,
      hydrateProvider({
        ...provider,
        status: 'disabled',
        isRuntimeReachable: false,
      }),
    );
    this.emit();
  }

  async resetSystemProvider(id: SystemProviderId): Promise<void> {
    const baseline = this.initialSystemProviders.get(id);
    if (!baseline) {
      throw new Error(`System provider "${id}" does not exist.`);
    }

    const providerIndex = this.providers.findIndex((provider) => provider.id === id);
    this.providers.splice(providerIndex, 1, hydrateProvider({ ...baseline, tags: [...baseline.tags] }));
    this.providers = this.sortProviders(this.providers);
    this.emit();
  }

  async deleteCustomProvider(id: CustomProviderId): Promise<void> {
    const provider = this.providers.find((item) => item.id === id);
    if (!provider) {
      throw new Error(`Custom provider "${id}" does not exist.`);
    }

    this.providers = this.providers.filter((item) => item.id !== id);
    this.emit();
  }

  async testProviderConnection(
    input: TestProviderConnectionInput,
    signal: AbortSignal,
  ): Promise<TestProviderConnectionResult> {
    this.testConnectionCalls.push({ ...input });

    const existingProvider = input.providerId
      ? this.providers.find((provider) => provider.id === input.providerId) ?? null
      : null;
    const hasSecret = typeof input.apiKey === 'string' ? input.apiKey.trim().length > 0 : Boolean(existingProvider?.hasSecret);

    if (!hasSecret) {
      throw new Error('Provider API key cannot be empty.');
    }

    if (input.endpoint.includes('pending')) {
      return new Promise<TestProviderConnectionResult>((_resolve, reject) => {
        const handleAbort = () => reject(new Error('Aborted'));

        if (signal.aborted) {
          handleAbort();
          return;
        }

        signal.addEventListener('abort', handleAbort, { once: true });
      });
    }

    if (input.endpoint.includes('fail')) {
      throw new Error('Connection refused by test endpoint.');
    }

    return {
      providerId: input.providerId,
      providerLabel: input.label.trim() || existingProvider?.label || 'Provider',
      content: 'OK',
      reasoning: '',
    };
  }

  watchProviders(callback: (providers: SettingsProviderRecord[]) => void): () => void {
    this.watchers.add(callback);
    callback(cloneProviders(this.providers));
    return () => {
      this.watchers.delete(callback);
    };
  }

  private sortProviders(providers: SettingsProviderRecord[]) {
    return [...providers].sort((left, right) => {
      if (left.source !== right.source) {
        return left.source === 'system' ? -1 : 1;
      }

      return left.label.localeCompare(right.label);
    });
  }

  private emit() {
    const nextProviders = cloneProviders(this.providers);
    this.watchers.forEach((watcher) => watcher(nextProviders));
  }
}

class InMemorySettingsRepository implements ISettingsRepository {
  private preference: UiDisplayLanguagePreference = 'system';

  private outputLanguagePreference: 'zh-CN' = 'zh-CN';

  constructor(private readonly providerRepository: ISettingsProviderRepository) {}

  async getUiDisplayLanguagePreference(): Promise<UiDisplayLanguagePreference> {
    return this.preference;
  }

  async setUiDisplayLanguagePreference(preference: UiDisplayLanguagePreference): Promise<void> {
    this.preference = preference;
  }

  async getAiOutputLanguagePreference(): Promise<'zh-CN'> {
    return this.outputLanguagePreference;
  }

  async setAiOutputLanguagePreference(preference: 'zh-CN'): Promise<void> {
    this.outputLanguagePreference = preference;
  }

  async getSnapshot(language: ResolvedUiDisplayLanguage): Promise<SettingsSnapshot> {
    return createSettingsSnapshot(language, await this.providerRepository.listProviders());
  }

  watchSnapshot(language: ResolvedUiDisplayLanguage, callback: (snapshot: SettingsSnapshot) => void) {
    return this.providerRepository.watchProviders((providers) => {
      callback(createSettingsSnapshot(language, providers));
    });
  }
}

class NoopSettingsTaskRepository implements ISettingsTaskRepository {
  async listTasks(): Promise<TaskRegistryRecord[]> {
    return [];
  }

  async getTask(): Promise<TaskRegistryRecord | null> {
    return null;
  }

  async createCustomTask(_input: CreateCustomTaskInput): Promise<CustomTaskId> {
    throw new Error('Task creation is not used in the providers panel tests.');
  }

  async updateTask(_input: UpdateTaskInput): Promise<void> {
    throw new Error('Task updates are not used in the providers panel tests.');
  }

  async deleteCustomTask(_id: CustomTaskId): Promise<void> {
    throw new Error('Task deletion is not used in the providers panel tests.');
  }

  async resetSystemTask(_id: SystemTaskId): Promise<void> {
    throw new Error('Task resets are not used in the providers panel tests.');
  }

  async dryRunTask(): Promise<never> {
    throw new Error('Task dry runs are not used in the providers panel tests.');
  }

  watchTasks(_callback: (tasks: TaskRegistryRecord[]) => void): () => void {
    return () => {};
  }
}

async function flushUi() {
  await Promise.resolve();
  await Promise.resolve();
}

function setInputValue(selector: string, value: string) {
  const input = document.querySelector<HTMLInputElement>(selector);
  if (!input) {
    throw new Error(`Missing input: ${selector}`);
  }

  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function click(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  element.click();
}

async function createMountedProvidersView(initialProviders?: SettingsProviderRecord[]) {
  document.body.innerHTML = '<div id="app"></div>';
  const providerRepository = new InMemorySettingsProviderRepository(
    initialProviders ?? createSettingsSnapshot('en').providers,
  );
  const settingsRepository = new InMemorySettingsRepository(providerRepository);
  const taskRepository = new NoopSettingsTaskRepository();
  const viewModel = new SettingsViewModel(settingsRepository, providerRepository, taskRepository, new InMemorySettingsTtsRepository(), 'en-US');
  const container = document.getElementById('app') as HTMLDivElement;
  const view = new SettingsView(container, viewModel);

  await viewModel.initialize();
  await flushUi();

  return { view, viewModel, providerRepository };
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('Settings providers panel CRUD', () => {
  beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('filters the provider collection by search query', async () => {
    const { view } = await createMountedProvidersView();

    setInputValue('#provider-search', 'siliconflow');

    const items = Array.from(document.querySelectorAll('#provider-list [data-provider-id]'));
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent?.toLowerCase()).toContain('siliconflow');

    view.destroy();
  });

  it('creates a custom provider from the live editor', async () => {
    const { view } = await createMountedProvidersView();

    click('#provider-add-button');
    setInputValue('#provider-id', 'openrouter-lab');
    setInputValue('#provider-label', 'OpenRouter Lab');
    setInputValue('#provider-model', 'openai/gpt-4.1-mini');
    setInputValue('#provider-endpoint', 'https://openrouter.ai/api/v1/chat/completions');
    setInputValue('#provider-api-key', 'sk-or-create');

    click('#provider-save-button');
    await flushUi();

    expect(document.querySelector('#provider-list [data-provider-id="custom:openrouter-lab"]')).not.toBeNull();
    expect(document.querySelector('#provider-editor-badge')?.textContent).toBe('Custom Provider');
    expect(document.querySelector('#provider-feedback')?.textContent).toContain('Provider created.');
    expect((document.querySelector('#provider-id') as HTMLInputElement | null)?.value).toBe('custom:openrouter-lab');
    expect(document.querySelector('#provider-temperature')).toBeNull();
    expect(document.querySelector('#provider-top-p')).toBeNull();

    view.destroy();
  });

  it('updates and deletes a custom provider through the live editor', async () => {
    const seededProviders = [
      ...createSettingsSnapshot('en').providers,
      createCustomProviderRecord({
        slug: 'edge-custom',
        label: 'Edge Custom',
        endpoint: 'https://edge.example.com/v1/chat/completions',
        apiKey: 'sk-edge-custom',
        model: 'edge/custom-model',
      }),
    ];

    const { view } = await createMountedProvidersView(seededProviders);

    click('#provider-list [data-provider-id="custom:edge-custom"]');
    setInputValue('#provider-model', 'edge/custom-model-v2');
    click('#provider-save-button');
    await flushUi();

    expect(document.querySelector('#provider-feedback')?.textContent).toContain('Provider saved.');

    click('#provider-danger-button');
    await flushUi();

    expect(document.querySelector('#provider-list [data-provider-id="custom:edge-custom"]')).toBeNull();

    view.destroy();
  });

  it('tests the current provider draft without saving it first', async () => {
    const { view, providerRepository } = await createMountedProvidersView();

    click('#provider-add-button');
    setInputValue('#provider-id', 'draft-provider');
    setInputValue('#provider-label', 'Draft Provider');
    setInputValue('#provider-model', 'draft/model');
    setInputValue('#provider-endpoint', 'https://draft-provider.example.com/v1/chat/completions');
    setInputValue('#provider-api-key', 'sk-draft-provider');

    click('#provider-test-button');
    await flushUi();

    expect(providerRepository.testConnectionCalls).toHaveLength(1);
    expect(providerRepository.testConnectionCalls[0]).toMatchObject({
      providerId: null,
      label: 'Draft Provider',
      endpoint: 'https://draft-provider.example.com/v1/chat/completions',
      model: 'draft/model',
      apiKey: 'sk-draft-provider',
    });
    expect(document.querySelector('#provider-feedback')?.textContent).toContain('Connection successful.');
    expect(document.querySelector('#provider-list [data-provider-id="custom:draft-provider"]')).toBeNull();

    view.destroy();
  });

  it('cancels an in-flight provider connection test', async () => {
    const { view } = await createMountedProvidersView();

    click('#provider-add-button');
    setInputValue('#provider-id', 'pending-provider');
    setInputValue('#provider-label', 'Pending Provider');
    setInputValue('#provider-model', 'pending/model');
    setInputValue('#provider-endpoint', 'https://pending-provider.example.com/v1/chat/completions');
    setInputValue('#provider-api-key', 'sk-pending-provider');

    click('#provider-test-button');
    await flushUi();
    expect(document.querySelector('#provider-test-button')?.textContent).toBe('Cancel Test');

    click('#provider-test-button');
    await flushUi();

    expect(document.querySelector('#provider-feedback')?.textContent).toContain('Connection test cancelled.');
    expect(document.querySelector('#provider-test-button')?.textContent).toBe('Test Connection');

    view.destroy();
  });

  it('shows provider connection failures in the editor feedback', async () => {
    const { view } = await createMountedProvidersView();

    click('#provider-add-button');
    setInputValue('#provider-id', 'failing-provider');
    setInputValue('#provider-label', 'Failing Provider');
    setInputValue('#provider-model', 'fail/model');
    setInputValue('#provider-endpoint', 'https://fail-provider.example.com/v1/chat/completions');
    setInputValue('#provider-api-key', 'sk-failing-provider');

    click('#provider-test-button');
    await flushUi();

    expect(document.querySelector('#provider-feedback')?.textContent).toContain('Connection refused by test endpoint.');

    view.destroy();
  });

  it('guards provider selection changes behind unsaved-change confirmation', async () => {
    const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.stubGlobal('confirm', confirm);

    const { view } = await createMountedProvidersView();
    const initialTitle = document.querySelector('#provider-editor-title')?.textContent;

    setInputValue('#provider-label', 'Locally Edited Name');
    click('#provider-list [data-provider-id="zhipu_glm4_flash"]');

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(document.querySelector('#provider-editor-title')?.textContent).toBe(initialTitle);

    click('#provider-list [data-provider-id="zhipu_glm4_flash"]');

    expect(confirm).toHaveBeenCalledTimes(2);
    expect(document.querySelector('#provider-editor-title')?.textContent).toBe('GLM-4 Flash');

    view.destroy();
  });

  it('resets and disables system providers through the real panel actions', async () => {
    const { view } = await createMountedProvidersView();

    setInputValue('#provider-label', 'GLM-4 9B Override');
    click('#provider-save-button');
    await flushUi();
    expect((document.querySelector('#provider-label') as HTMLInputElement | null)?.value).toBe('GLM-4 9B Override');

    click('#provider-utility-button');
    await flushUi();
    expect((document.querySelector('#provider-label') as HTMLInputElement | null)?.value).toBe('GLM-4 9B');

    click('#provider-danger-button');
    await flushUi();

    expect(document.querySelector('#provider-feedback')?.textContent).toContain('System provider disabled.');
    expect(document.querySelector('#provider-list [data-provider-id="siliconflow_glm4_9b"]')?.textContent).toContain('disabled');

    view.destroy();
  });
});