// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PROVIDERS, TASKS } from '../../src/llm/config';
import type {
  ExplainTaskResult,
} from '../../src/llm/types';
import { SettingsView } from '../../src/features/settings/components/SettingsView';
import {
  createSettingsSnapshot,
  type SettingsProviderRecord,
  type SettingsSnapshot,
} from '../../src/features/settings/events/SettingsEvents';
import type { ISettingsProviderRepository } from '../../src/features/settings/interfaces/ISettingsProviderRepository';
import type { ISettingsRepository } from '../../src/features/settings/interfaces/ISettingsRepository';
import type {
  ISettingsTaskRepository,
  TaskDryRunCallbacks,
} from '../../src/features/settings/interfaces/ISettingsTaskRepository';
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
  TaskRegistryRecord,
  SystemTaskId,
  TaskId,
  UpdateTaskInput,
} from '../../src/features/task-registry/events/TaskRegistryEvents';

function cloneProviders(providers: SettingsProviderRecord[]): SettingsProviderRecord[] {
  return providers.map((provider) => ({
    ...provider,
    tags: [...provider.tags],
  }));
}

function cloneTaskRecords(tasks: TaskRegistryRecord[]): TaskRegistryRecord[] {
  return tasks.map((task) => ({
    ...task,
    providerRequestParams: task.providerRequestParams
      ? Object.fromEntries(
          Object.entries(task.providerRequestParams).map(([providerId, params]) => [providerId, { ...params }]),
        ) as TaskRegistryRecord['providerRequestParams']
      : undefined,
    providerChainIds: [...task.providerChainIds],
    providerChainLabels: [...task.providerChainLabels],
  }));
}

function areProviderIdListsEqual(left: readonly ProviderId[], right: readonly ProviderId[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((providerId, index) => providerId === right[index]);
}

function createTaskRecord(taskId: SystemTaskId): TaskRegistryRecord {
  const taskConfig = TASKS[taskId];
  const providerChainIds = [...taskConfig.providers];

  return {
    id: taskId,
    source: 'system',
    status: 'active',
    mutability: 'override-only',
    label: taskConfig.label,
    mode: taskConfig.mode,
    systemPrompt: taskConfig.systemPrompt,
    userPrompt: taskConfig.userPrompt,
    providerRequestParams: taskConfig.providerRequestParams,
    providerChainIds,
    providerChainLabels: providerChainIds.map((providerId) => PROVIDERS[providerId].label),
    hasDefinitionOverride: false,
    hasProviderChainOverride: false,
    hasOverride: false,
    updatedAt: 0,
  };
}

class StaticSettingsProviderRepository implements ISettingsProviderRepository {
  private readonly providers: SettingsProviderRecord[];

  constructor(initialProviders: SettingsProviderRecord[]) {
    this.providers = cloneProviders(initialProviders);
  }

  async listProviders(): Promise<SettingsProviderRecord[]> {
    return cloneProviders(this.providers);
  }

  async getProvider(id: ProviderId): Promise<SettingsProviderRecord | null> {
    const provider = this.providers.find((item) => item.id === id);
    return provider ? { ...provider, tags: [...provider.tags] } : null;
  }

  async createCustomProvider(_input: CreateCustomProviderInput): Promise<CustomProviderId> {
    throw new Error('Provider creation is not used in the prompt-task tests.');
  }

  async updateProvider(_input: UpdateProviderInput): Promise<void> {
    throw new Error('Provider updates are not used in the prompt-task tests.');
  }

  async disableProvider(_id: ProviderId): Promise<void> {
    throw new Error('Provider updates are not used in the prompt-task tests.');
  }

  async resetSystemProvider(_id: SystemProviderId): Promise<void> {
    throw new Error('Provider updates are not used in the prompt-task tests.');
  }

  async deleteCustomProvider(_id: CustomProviderId): Promise<void> {
    throw new Error('Provider updates are not used in the prompt-task tests.');
  }

  async testProviderConnection(
    _input: TestProviderConnectionInput,
    _signal: AbortSignal,
  ): Promise<TestProviderConnectionResult> {
    throw new Error('Provider connection tests are not used in the prompt-task tests.');
  }

  watchProviders(callback: (providers: SettingsProviderRecord[]) => void): () => void {
    callback(cloneProviders(this.providers));
    return () => {};
  }
}

class InMemorySettingsTaskRepository implements ISettingsTaskRepository {
  private tasks: TaskRegistryRecord[];

  private readonly watchers = new Set<(tasks: TaskRegistryRecord[]) => void>();

  constructor(initialTasks: TaskRegistryRecord[]) {
    this.tasks = cloneTaskRecords(initialTasks);
  }

  async listTasks(): Promise<TaskRegistryRecord[]> {
    return cloneTaskRecords(this.tasks);
  }

  async getTask(id: TaskId): Promise<TaskRegistryRecord | null> {
    const task = this.tasks.find((item) => item.id === id);
    return task ? cloneTaskRecords([task])[0] : null;
  }

  async createCustomTask(input: CreateCustomTaskInput): Promise<CustomTaskId> {
    const now = Date.now();
    const slug = input.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'task';
    let suffix = 1;
    let id = `custom:${slug}` as CustomTaskId;

    while (this.tasks.some((task) => task.id === id)) {
      suffix += 1;
      id = `custom:${slug}-${suffix}` as CustomTaskId;
    }

    const providerChainIds = [...new Set(input.providerIds)];
    this.tasks.unshift({
      id,
      source: 'user',
      status: 'active',
      mutability: 'full',
      label: input.label,
      mode: input.mode,
      systemPrompt: input.systemPrompt,
      userPrompt: input.userPrompt,
      providerRequestParams: input.providerRequestParams,
      providerChainIds,
      providerChainLabels: providerChainIds.map((providerId) => PROVIDERS[providerId as keyof typeof PROVIDERS]?.label ?? providerId),
      hasDefinitionOverride: false,
      hasProviderChainOverride: false,
      hasOverride: false,
      updatedAt: now,
    });
    this.emit();

    return id;
  }

  async updateTask(input: UpdateTaskInput): Promise<void> {
    const index = this.tasks.findIndex((task) => task.id === input.id);
    if (index === -1) {
      throw new Error(`Task "${input.id}" does not exist.`);
    }

    const providerChainIds = [...new Set(input.providerIds)];
    const existingTask = this.tasks[index];

    if (existingTask.source === 'user') {
      this.tasks.splice(index, 1, {
        ...existingTask,
        label: input.label,
        mode: input.mode,
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        providerRequestParams: input.providerRequestParams,
        providerChainIds,
        providerChainLabels: providerChainIds.map((providerId) => PROVIDERS[providerId as keyof typeof PROVIDERS]?.label ?? providerId),
        updatedAt: Date.now(),
      });
      this.emit();
      return;
    }

    const baseline = TASKS[input.id as SystemTaskId];
    const hasDefinitionOverride =
      input.label !== baseline.label ||
      input.mode !== baseline.mode ||
      input.systemPrompt !== baseline.systemPrompt ||
      input.userPrompt !== baseline.userPrompt;
    const hasProviderChainOverride = !areProviderIdListsEqual(providerChainIds, baseline.providers);

    this.tasks.splice(index, 1, {
      id: input.id,
      source: 'system',
      status: 'active',
      mutability: 'override-only',
      label: input.label,
      mode: input.mode,
      systemPrompt: input.systemPrompt,
      userPrompt: input.userPrompt,
      providerRequestParams: input.providerRequestParams,
      providerChainIds,
      providerChainLabels: providerChainIds.map((providerId) => PROVIDERS[providerId as keyof typeof PROVIDERS]?.label ?? providerId),
      hasDefinitionOverride,
      hasProviderChainOverride,
      hasOverride: hasDefinitionOverride || hasProviderChainOverride,
      updatedAt: Date.now(),
    });

    this.emit();
  }

  async deleteCustomTask(id: CustomTaskId): Promise<void> {
    this.tasks = this.tasks.filter((task) => task.id !== id);
    this.emit();
  }

  async resetSystemTask(id: SystemTaskId): Promise<void> {
    const index = this.tasks.findIndex((task) => task.id === id);
    if (index === -1) {
      throw new Error(`Task "${id}" does not exist.`);
    }

    this.tasks.splice(index, 1, createTaskRecord(id));
    this.emit();
  }

  async dryRunTask(
    input: UpdateTaskInput,
    _signal: AbortSignal,
    callbacks: TaskDryRunCallbacks = {},
  ): Promise<ExplainTaskResult> {
    if (String(input.id).startsWith('custom:')) {
      throw new Error('Dry run is currently available for built-in tasks only.');
    }

    const taskId = input.id as SystemTaskId;

    callbacks.onStart?.(PROVIDERS.zhipu_glm4_flash.label);
    callbacks.onUpdate?.({
      content: `Dry run for ${input.label}`,
      reasoning: 'Checked the live provider chain.',
    });

    return {
      task: taskId,
      providerId: 'zhipu_glm4_flash',
      providerLabel: PROVIDERS.zhipu_glm4_flash.label,
      content: input.mode === 'json'
        ? JSON.stringify({ preview: `Dry run for ${input.label}` }, null, 2)
        : `Dry run for ${input.label}`,
      reasoning: 'Checked the live provider chain.',
    };
  }

  watchTasks(callback: (tasks: TaskRegistryRecord[]) => void): () => void {
    this.watchers.add(callback);
    callback(cloneTaskRecords(this.tasks));
    return () => {
      this.watchers.delete(callback);
    };
  }

  private emit() {
    const nextTasks = cloneTaskRecords(this.tasks);
    this.watchers.forEach((watcher) => watcher(nextTasks));
  }
}

class InMemorySettingsRepository implements ISettingsRepository {
  private preference: UiDisplayLanguagePreference = 'system';

  private outputLanguagePreference: 'zh-CN' = 'zh-CN';

  constructor(
    private readonly providerRepository: ISettingsProviderRepository,
    private readonly taskRepository: ISettingsTaskRepository,
  ) {}

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
    const [providers, tasks] = await Promise.all([
      this.providerRepository.listProviders(),
      this.taskRepository.listTasks(),
    ]);

    return createSettingsSnapshot(language, providers, tasks);
  }

  watchSnapshot(language: ResolvedUiDisplayLanguage, callback: (snapshot: SettingsSnapshot) => void) {
    let latestProviders: SettingsProviderRecord[] | null = null;
    let latestTasks: TaskRegistryRecord[] | null = null;

    const emit = () => {
      if (latestProviders == null || latestTasks == null) {
        return;
      }

      callback(createSettingsSnapshot(language, latestProviders, latestTasks));
    };

    const stopProvidersWatch = this.providerRepository.watchProviders((providers) => {
      latestProviders = providers;
      emit();
    });
    const stopTasksWatch = this.taskRepository.watchTasks((tasks) => {
      latestTasks = tasks;
      emit();
    });

    return () => {
      stopProvidersWatch();
      stopTasksWatch();
    };
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

function setInputValue(selector: string, value: string) {
  const input = document.querySelector<HTMLInputElement>(selector);
  if (!input) {
    throw new Error(`Missing input: ${selector}`);
  }

  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function setTextareaValue(selector: string, value: string) {
  const textarea = document.querySelector<HTMLTextAreaElement>(selector);
  if (!textarea) {
    throw new Error(`Missing textarea: ${selector}`);
  }

  textarea.value = value;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function setSelectValue(selector: string, value: string) {
  const select = document.querySelector<HTMLSelectElement>(selector);
  if (!select) {
    throw new Error(`Missing select: ${selector}`);
  }

  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function toggleTaskProvider(providerId: ProviderId, checked: boolean) {
  const input = document.querySelector<HTMLInputElement>(`#task-provider-options input[data-provider-id="${providerId}"]`);
  if (!input) {
    throw new Error(`Missing provider checkbox: ${providerId}`);
  }

  input.checked = checked;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function setTaskProviderParamValue(
  providerId: ProviderId,
  field: 'temperature' | 'topP' | 'maxTokens',
  value: string,
) {
  const input = document.querySelector<HTMLInputElement>(
    `#task-provider-tuning input[data-provider-id="${providerId}"][data-param-field="${field}"]`,
  );
  if (!input) {
    throw new Error(`Missing task provider tuning field: ${providerId} / ${field}`);
  }

  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

async function createMountedTasksView(initialTasks?: TaskRegistryRecord[]) {
  document.body.innerHTML = '<div id="app"></div>';
  const providerRepository = new StaticSettingsProviderRepository(createSettingsSnapshot('en').providers);
  const taskRepository = new InMemorySettingsTaskRepository(
    initialTasks ?? (Object.keys(TASKS) as SystemTaskId[]).map((taskId) => createTaskRecord(taskId)),
  );
  const settingsRepository = new InMemorySettingsRepository(providerRepository, taskRepository);
  const viewModel = new SettingsViewModel(settingsRepository, providerRepository, taskRepository, 'en-US');
  const container = document.getElementById('app') as HTMLDivElement;
  const view = new SettingsView(container, viewModel);

  await viewModel.initialize();
  await flushUi();

  return { view, viewModel, taskRepository };
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('Settings prompt tasks panel CRUD', () => {
  beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('filters the prompt-task collection by search query', async () => {
    const { view } = await createMountedTasksView();

    setInputValue('#task-search', 'information');

    const items = Array.from(document.querySelectorAll('#task-list [data-task-id]'));
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent?.toLowerCase()).toContain('information');

    view.destroy();
  });

  it('saves prompt-task overlays for prompt bodies and explicit fallback provider order', async () => {
    const { view, taskRepository } = await createMountedTasksView();

    click('#task-list [data-task-id="information"]');
    setInputValue('#task-label', 'Deep Context');
    setSelectValue('#task-mode', 'json');
    setTextareaValue('#task-system-prompt', 'Return structured context analysis.');
    setTextareaValue('#task-user-prompt', 'Explain "{{text}}" using the surrounding context.');
    toggleTaskProvider('zhipu_glm4_flash', false);
    setTaskProviderParamValue('siliconflow_glm4_9b', 'temperature', '0.15');
    setTaskProviderParamValue('siliconflow_glm4_9b', 'maxTokens', '1024');

    click('#task-save-button');
    await flushUi();

    const savedTask = await taskRepository.getTask('information');

    expect(document.querySelector('#task-feedback')?.textContent).toContain('Task saved.');
    expect(document.querySelector('#task-editor-mode')?.textContent).toContain('Overridden');
    expect((document.querySelector('#task-label') as HTMLInputElement | null)?.value).toBe('Deep Context');
    expect(document.querySelector('#task-provider-order')?.textContent).toContain('GLM-4 9B');
    expect(document.querySelector('#task-provider-order')?.textContent).not.toContain('GLM-4 Flash');
    expect(document.querySelector('#task-list')?.textContent).toContain('Deep Context');
    expect(savedTask?.providerRequestParams?.siliconflow_glm4_9b?.temperature).toBe(0.15);
    expect(savedTask?.providerRequestParams?.siliconflow_glm4_9b?.max_tokens).toBe(1024);

    view.destroy();
  });

  it('creates a new custom prompt task from the New Task action', async () => {
    const { view } = await createMountedTasksView();

    click('#task-add-button');
    setInputValue('#task-label', 'Context Ladder');
    setTextareaValue('#task-system-prompt', 'Analyze the selected text in three escalating layers.');
    setTextareaValue('#task-user-prompt', 'Explain "{{text}}" with summary, detail, and next-step guidance.');
    toggleTaskProvider('siliconflow_glm4_9b', false);

    click('#task-save-button');
    await flushUi();

    expect(document.querySelector('#task-feedback')?.textContent).toContain('Task created.');
    expect(document.querySelector('#task-editor-mode')?.textContent).toContain('Custom Task');
    expect(document.querySelector('#task-list')?.textContent).toContain('Context Ladder');
    expect(document.querySelector('#nav-prompts-count')?.textContent).toBe('4');

    view.destroy();
  });

  it('resets a modified system task back to defaults', async () => {
    const { view } = await createMountedTasksView();

    click('#task-list [data-task-id="information"]');
    setInputValue('#task-label', 'Deep Context');
    toggleTaskProvider('zhipu_glm4_flash', false);
    click('#task-save-button');
    await flushUi();

    click('#task-reset-button');
    await flushUi();

    expect((document.querySelector('#task-label') as HTMLInputElement | null)?.value).toBe('Information');
    expect((document.querySelector('#task-mode') as HTMLSelectElement | null)?.value).toBe('markdown');
    expect(document.querySelector('#task-provider-order')?.textContent).toContain('GLM-4 Flash');
    expect(document.querySelector('#task-provider-order')?.textContent).toContain('GLM-4 9B');
    expect(
      (document.querySelector(
        '#task-provider-tuning input[data-provider-id="zhipu_glm4_flash"][data-param-field="temperature"]',
      ) as HTMLInputElement | null)?.value,
    ).toBe('');
    expect(document.querySelector('#task-editor-mode')?.textContent).toBe('System Task');

    view.destroy();
  });

  it('guards task selection changes behind unsaved-change confirmation', async () => {
    const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.stubGlobal('confirm', confirm);

    const { view } = await createMountedTasksView();

    setInputValue('#task-label', 'Locally Edited Task');
    click('#task-list [data-task-id="information"]');

    expect(confirm).toHaveBeenCalledTimes(1);
    expect((document.querySelector('#task-label') as HTMLInputElement | null)?.value).toBe('Locally Edited Task');

    click('#task-list [data-task-id="information"]');

    expect(confirm).toHaveBeenCalledTimes(2);
    expect((document.querySelector('#task-label') as HTMLInputElement | null)?.value).toBe('Information');

    view.destroy();
  });

  it('runs a dry run against the current task draft and renders the live preview state', async () => {
    const { view } = await createMountedTasksView();

    click('#task-list [data-task-id="information"]');
    setInputValue('#task-label', 'Deep Context');
    setSelectValue('#task-mode', 'json');

    click('#task-dry-run-button');
    await flushUi();

    expect(document.querySelector('#task-dry-run-status')?.textContent).toContain('Completed');
    expect(document.querySelector('#task-dry-run-provider')?.textContent).toContain('GLM-4 Flash');
    expect((document.querySelector('#task-dry-run-output') as HTMLTextAreaElement | null)?.value).toContain('Deep Context');
    expect((document.querySelector('#task-dry-run-reasoning') as HTMLTextAreaElement | null)?.value).toContain(
      'Checked the live provider chain.',
    );
    expect((document.querySelector('#task-dry-run-sample') as HTMLTextAreaElement | null)?.value.length).toBeGreaterThan(0);
    expect((document.querySelector('#task-dry-run-context') as HTMLTextAreaElement | null)?.value.length).toBeGreaterThan(0);

    view.destroy();
  });
});