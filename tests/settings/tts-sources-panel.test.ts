// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { SettingsView } from '../../src/features/settings/components/SettingsView';
import {
  createSettingsSnapshot,
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
  UpdateProviderInput,
} from '../../src/features/provider-registry/events/ProviderRegistryEvents';
import type {
  CreateCustomTaskInput,
  CustomTaskId,
  SystemTaskId,
  TaskRegistryRecord,
  UpdateTaskInput,
} from '../../src/features/task-registry/events/TaskRegistryEvents';
import type { ResolvedUiDisplayLanguage, UiDisplayLanguagePreference } from '../../src/shared/ui-language';

import { InMemorySettingsTtsRepository } from './helpers/inMemoryTtsRepository';

class StubSettingsRepository implements ISettingsRepository {
  private preference: UiDisplayLanguagePreference = 'system';

  async getUiDisplayLanguagePreference(): Promise<UiDisplayLanguagePreference> {
    return this.preference;
  }

  async setUiDisplayLanguagePreference(preference: UiDisplayLanguagePreference): Promise<void> {
    this.preference = preference;
  }

  async getAiOutputLanguagePreference(): Promise<'zh-CN'> {
    return 'zh-CN';
  }

  async setAiOutputLanguagePreference(): Promise<void> {}

  async getSnapshot(language: ResolvedUiDisplayLanguage): Promise<SettingsSnapshot> {
    return createSettingsSnapshot(language, []);
  }

  watchSnapshot() {
    return () => {};
  }
}

class StubSettingsProviderRepository implements ISettingsProviderRepository {
  async listProviders() {
    return [];
  }

  async getProvider() {
    return null;
  }

  async createCustomProvider(_input: CreateCustomProviderInput): Promise<CustomProviderId> {
    throw new Error('Provider creation is not used in the TTS panel tests.');
  }

  async updateProvider(_input: UpdateProviderInput): Promise<void> {
    throw new Error('Provider updates are not used in the TTS panel tests.');
  }

  async disableProvider(_id: ProviderId): Promise<void> {
    throw new Error('Provider disabling is not used in the TTS panel tests.');
  }

  async resetSystemProvider(_id: SystemProviderId): Promise<void> {
    throw new Error('Provider resets are not used in the TTS panel tests.');
  }

  async deleteCustomProvider(_id: CustomProviderId): Promise<void> {
    throw new Error('Provider deletion is not used in the TTS panel tests.');
  }

  async testProviderConnection(): Promise<never> {
    throw new Error('Provider connection tests are not used in the TTS panel tests.');
  }

  watchProviders(callback: (providers: never[]) => void): () => void {
    callback([]);
    return () => {};
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
    throw new Error('Task creation is not used in the TTS panel tests.');
  }

  async updateTask(_input: UpdateTaskInput): Promise<void> {
    throw new Error('Task updates are not used in the TTS panel tests.');
  }

  async deleteCustomTask(_id: CustomTaskId): Promise<void> {
    throw new Error('Task deletion is not used in the TTS panel tests.');
  }

  async resetSystemTask(_id: SystemTaskId): Promise<void> {
    throw new Error('Task resets are not used in the TTS panel tests.');
  }

  async dryRunTask(): Promise<never> {
    throw new Error('Task dry runs are not used in the TTS panel tests.');
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

async function createMountedTtsView(ttsRepository = new InMemorySettingsTtsRepository()) {
  document.body.innerHTML = '<div id="app"></div>';
  const viewModel = new SettingsViewModel(
    new StubSettingsRepository(),
    new StubSettingsProviderRepository(),
    new NoopSettingsTaskRepository(),
    ttsRepository,
    'en-US',
  );
  const container = document.getElementById('app') as HTMLDivElement;
  const view = new SettingsView(container, viewModel);

  await viewModel.initialize();
  await flushUi();

  return { view, viewModel, ttsRepository };
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('Settings TTS sources panel', () => {
  it('renders the four TTS sources with the smart default selected', async () => {
    const { view } = await createMountedTtsView();

    const items = Array.from(document.querySelectorAll('#tts-source-list [data-tts-source-id]'));
    expect(items.map((item) => item.getAttribute('data-tts-source-id'))).toEqual([
      'auto',
      'browser-speech',
      'google-translate',
      'azure-speech',
    ]);
    expect(items[0]?.textContent).toContain('Smart Default');
    expect(items[1]?.textContent).toContain('Browser Speech');
    expect(items[2]?.textContent).toContain('Google Translate');
    expect(items[3]?.textContent).toContain('Azure Speech');

    const defaultRow = document.querySelector('#tts-source-list [data-tts-source-id="auto"]');
    expect(defaultRow?.textContent).toContain('Default');
    expect(defaultRow?.classList.contains('is-selected')).toBe(true);
    expect(document.querySelector('#tts-editor-title')?.textContent).toBe('Smart Default');
    expect((document.querySelector('#tts-browser-fields') as HTMLElement).hidden).toBe(true);
    expect((document.querySelector('#tts-azure-fields') as HTMLElement).hidden).toBe(true);
    expect((document.querySelector('#tts-save-button') as HTMLButtonElement).disabled).toBe(true);

    view.destroy();
  });

  it('marks a source as the default voice source', async () => {
    const { view, ttsRepository } = await createMountedTtsView();

    click('#tts-source-list [data-tts-source-id="azure-speech"]');
    await flushUi();
    click('#tts-set-default-button');
    await flushUi();

    expect(await ttsRepository.getSelection()).toBe('azure-speech');
    expect(document.querySelector('#tts-source-list [data-tts-source-id="azure-speech"]')?.textContent).toContain('Default');
    const autoRowTags = document.querySelector('#tts-source-list [data-tts-source-id="auto"] .list-tags');
    expect(autoRowTags?.textContent).not.toContain('Default');
    expect(document.querySelector('#tts-editor-badge')?.textContent).toBe('Default');
    expect(document.querySelector('#tts-feedback')?.textContent).toContain('Default voice source updated.');

    view.destroy();
  });

  it('saves the Azure API key and voice config through the repository', async () => {
    const { view, ttsRepository } = await createMountedTtsView();

    click('#tts-source-list [data-tts-source-id="azure-speech"]');
    await flushUi();

    expect((document.querySelector('#tts-azure-fields') as HTMLElement).hidden).toBe(false);
    expect((document.querySelector('#tts-save-button') as HTMLButtonElement).disabled).toBe(true);

    setInputValue('#tts-azure-api-key', 'test-azure-key-1234');
    setInputValue('#tts-azure-region', 'southeastasia');
    setInputValue('#tts-azure-voice-zh', 'zh-CN-YunxiNeural');
    setInputValue('#tts-azure-voice-en', 'en-US-GuyNeural');

    expect((document.querySelector('#tts-save-button') as HTMLButtonElement).disabled).toBe(false);

    click('#tts-save-button');
    await flushUi();

    expect(await ttsRepository.getAzureApiKey()).toBe('test-azure-key-1234');
    expect(await ttsRepository.getSourceConfig('azure-speech')).toMatchObject({
      azureRegion: 'southeastasia',
      azureVoiceZh: 'zh-CN-YunxiNeural',
      azureVoiceEn: 'en-US-GuyNeural',
    });
    expect(document.querySelector('#tts-feedback')?.textContent).toContain('Voice settings saved.');
    expect((document.querySelector('#tts-azure-api-key') as HTMLInputElement).value).toBe('');
    expect((document.querySelector('#tts-azure-api-key') as HTMLInputElement).placeholder).toContain('••••');
    expect((document.querySelector('#tts-save-button') as HTMLButtonElement).disabled).toBe(true);

    view.destroy();
  });

  it('restores the persisted selection on a fresh mount', async () => {
    const ttsRepository = new InMemorySettingsTtsRepository();
    const firstMount = await createMountedTtsView(ttsRepository);

    click('#tts-source-list [data-tts-source-id="browser-speech"]');
    await flushUi();
    click('#tts-set-default-button');
    await flushUi();
    expect(await ttsRepository.getSelection()).toBe('browser-speech');
    firstMount.view.destroy();

    const secondMount = await createMountedTtsView(ttsRepository);

    const browserRow = document.querySelector('#tts-source-list [data-tts-source-id="browser-speech"]');
    expect(browserRow?.textContent).toContain('Default');
    expect(browserRow?.classList.contains('is-selected')).toBe(true);
    expect((document.querySelector('#tts-browser-fields') as HTMLElement).hidden).toBe(false);
    expect((document.querySelector('#tts-voice-zh') as HTMLSelectElement).options[0]?.textContent).toBe('Follow system default');

    secondMount.view.destroy();
  });

  it('persists browser speech voice choices', async () => {
    const { view, viewModel, ttsRepository } = await createMountedTtsView();

    click('#tts-source-list [data-tts-source-id="browser-speech"]');
    await flushUi();

    viewModel.ttsSources.updateDraftField('voiceZh', 'Microsoft Huihui');
    viewModel.ttsSources.updateDraftField('voiceEn', 'Microsoft Zira');
    click('#tts-save-button');
    await flushUi();

    expect(await ttsRepository.getSourceConfig('browser-speech')).toMatchObject({
      voiceZh: 'Microsoft Huihui',
      voiceEn: 'Microsoft Zira',
    });
    expect(document.querySelector('#tts-feedback')?.textContent).toContain('Voice settings saved.');

    view.destroy();
  });
});
