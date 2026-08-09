// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';

import { SettingsView } from '../../src/features/settings/components/SettingsView';
import {
  createSettingsSnapshot,
  type SettingsProviderRecord,
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

import { InMemorySettingsTtsRepository } from './helpers/inMemoryTtsRepository';

import type {

  CreateCustomTaskInput,
  CustomTaskId,
  SystemTaskId,
  TaskId,
  TaskRegistryRecord,
  UpdateTaskInput,
} from '../../src/features/task-registry/events/TaskRegistryEvents';

function cloneProviders(providers: SettingsProviderRecord[]) {
  return providers.map((provider) => ({
    ...provider,
    tags: [...provider.tags],
  }));
}

class StaticSettingsRepository implements ISettingsRepository {
  private displayLanguagePreference: UiDisplayLanguagePreference = 'system';

  private outputLanguagePreference: 'zh-CN' | 'ja' = 'zh-CN';

  async getUiDisplayLanguagePreference(): Promise<UiDisplayLanguagePreference> {
    return this.displayLanguagePreference;
  }

  async setUiDisplayLanguagePreference(preference: UiDisplayLanguagePreference): Promise<void> {
    this.displayLanguagePreference = preference;
  }

  async getAiOutputLanguagePreference(): Promise<'zh-CN' | 'ja'> {
    return this.outputLanguagePreference;
  }

  async setAiOutputLanguagePreference(preference: 'zh-CN' | 'ja'): Promise<void> {
    this.outputLanguagePreference = preference;
  }

  async getSnapshot(language: ResolvedUiDisplayLanguage) {
    return createSettingsSnapshot(language);
  }

  watchSnapshot(_language: ResolvedUiDisplayLanguage, _callback: (snapshot: ReturnType<typeof createSettingsSnapshot>) => void) {
    return () => {};
  }
}

class StaticSettingsProviderRepository implements ISettingsProviderRepository {
  private readonly providers = cloneProviders(createSettingsSnapshot('en').providers);

  async listProviders(): Promise<SettingsProviderRecord[]> {
    return cloneProviders(this.providers);
  }

  async getProvider(id: ProviderId): Promise<SettingsProviderRecord | null> {
    const provider = this.providers.find((item) => item.id === id);
    return provider ? { ...provider, tags: [...provider.tags] } : null;
  }

  async createCustomProvider(_input: CreateCustomProviderInput): Promise<CustomProviderId> {
    throw new Error('Not used in overview tests.');
  }

  async updateProvider(_input: UpdateProviderInput): Promise<void> {
    throw new Error('Not used in overview tests.');
  }

  async disableProvider(_id: ProviderId): Promise<void> {
    throw new Error('Not used in overview tests.');
  }

  async resetSystemProvider(_id: SystemProviderId): Promise<void> {
    throw new Error('Not used in overview tests.');
  }

  async deleteCustomProvider(_id: CustomProviderId): Promise<void> {
    throw new Error('Not used in overview tests.');
  }

  async testProviderConnection(
    _input: TestProviderConnectionInput,
    _signal: AbortSignal,
  ): Promise<TestProviderConnectionResult> {
    throw new Error('Not used in overview tests.');
  }

  watchProviders(callback: (providers: SettingsProviderRecord[]) => void): () => void {
    callback(cloneProviders(this.providers));
    return () => {};
  }
}

class StaticSettingsTaskRepository implements ISettingsTaskRepository {
  async listTasks(): Promise<TaskRegistryRecord[]> {
    return [];
  }

  async getTask(_id: TaskId): Promise<TaskRegistryRecord | null> {
    return null;
  }

  async createCustomTask(_input: CreateCustomTaskInput): Promise<CustomTaskId> {
    throw new Error('Not used in overview tests.');
  }

  async updateTask(_input: UpdateTaskInput): Promise<void> {
    throw new Error('Not used in overview tests.');
  }

  async deleteCustomTask(_id: CustomTaskId): Promise<void> {
    throw new Error('Not used in overview tests.');
  }

  async resetSystemTask(_id: SystemTaskId): Promise<void> {
    throw new Error('Not used in overview tests.');
  }

  async dryRunTask(): Promise<never> {
    throw new Error('Not used in overview tests.');
  }

  watchTasks(callback: (tasks: TaskRegistryRecord[]) => void): () => void {
    callback([]);
    return () => {};
  }
}

async function flushUi() {
  await Promise.resolve();
  await Promise.resolve();
}

function click(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  element.click();
}

async function mountOverview() {
  document.body.innerHTML = '<div id="app"></div>';

  const settingsRepository = new StaticSettingsRepository();
  const providerRepository = new StaticSettingsProviderRepository();
  const taskRepository = new StaticSettingsTaskRepository();
  const viewModel = new SettingsViewModel(settingsRepository, providerRepository, taskRepository, new InMemorySettingsTtsRepository(), 'en-US');
  const view = new SettingsView(document.getElementById('app') as HTMLDivElement, viewModel);

  await viewModel.initialize();
  await flushUi();

  return { view, viewModel, settingsRepository };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Settings overview panel', () => {
  it('renders snapshot metrics and the current theme chip on the overview page', async () => {
    const { view } = await mountOverview();
    const snapshot = createSettingsSnapshot('en');
    const selectedTheme = snapshot.themes.find((theme) => theme.id === snapshot.selectedThemeId);

    expect(document.querySelectorAll('#metrics-grid .metric-card')).toHaveLength(snapshot.metrics.length);
    expect(document.querySelector('#current-theme-chip')?.textContent).toBe(
      selectedTheme ? `${selectedTheme.label} · ${selectedTheme.tierLabel}` : '',
    );
    expect(document.querySelectorAll('#display-language-select option').length).toBeGreaterThan(1);
    expect(document.querySelectorAll('#output-language-select option').length).toBeGreaterThan(1);

    view.destroy();
  });

  it('jumps from the overview page to the theme gallery', async () => {
    const { view } = await mountOverview();

    click('#jump-themes-button');

    expect(document.querySelector('#page-themes')?.classList.contains('is-active')).toBe(true);
    expect(document.querySelector('[data-tab="themes"]')?.classList.contains('is-active')).toBe(true);

    view.destroy();
  });

  it('updates the output language preference through the overview controls', async () => {
    const { view, viewModel, settingsRepository } = await mountOverview();
    const select = document.querySelector<HTMLSelectElement>('#output-language-select');
    if (!select) {
      throw new Error('Missing output language select.');
    }

    select.value = 'ja';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await flushUi();

    expect(viewModel.outputLanguagePreference.value).toBe('ja');
    await expect(settingsRepository.getAiOutputLanguagePreference()).resolves.toBe('ja');

    view.destroy();
  });
});