import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TASKS } from '../../src/llm/config';

const mockStorage = vi.hoisted(() => {
  const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

  const createStorageItem = <T>(fallback: T) => {
    let value = clone(fallback);
    const watchers = new Set<() => void>();

    return {
      async getValue(): Promise<T> {
        return clone(value);
      },
      async setValue(nextValue: T): Promise<void> {
        value = clone(nextValue);
        watchers.forEach((watcher) => watcher());
      },
      watch(callback: () => void) {
        watchers.add(callback);
        return () => {
          watchers.delete(callback);
        };
      },
      reset() {
        value = clone(fallback);
        watchers.clear();
      },
    };
  };

  return {
    providerRegistryOverlayStorage: createStorageItem({
      version: 1,
      customProviders: {},
      systemOverrides: {},
      disabledSystemProviderIds: [],
    }),
    providerSecretsStorage: createStorageItem({
      version: 1,
      secrets: {},
    }),
    taskProviderChainOverlayStorage: createStorageItem({
      version: 1,
      tasks: {},
    }),
    taskDefinitionOverlayStorage: createStorageItem({
      version: 1,
      systemOverrides: {},
      customTasks: {},
      disabledSystemTaskIds: [],
    }),
  };
});

vi.mock('../../src/features/provider-registry/storage/providerRegistryOverlay', () => ({
  providerRegistryOverlayStorage: mockStorage.providerRegistryOverlayStorage,
}));

vi.mock('../../src/features/provider-registry/storage/providerSecrets', () => ({
  providerSecretsStorage: mockStorage.providerSecretsStorage,
}));

vi.mock('../../src/features/task-registry/storage/taskProviderChainOverlay', () => ({
  taskProviderChainOverlayStorage: mockStorage.taskProviderChainOverlayStorage,
}));

vi.mock('../../src/features/task-registry/storage/taskDefinitionOverlay', () => ({
  taskDefinitionOverlayStorage: mockStorage.taskDefinitionOverlayStorage,
}));

import { TaskRegistryService } from '../../src/features/task-registry/services/TaskRegistryService';
import { createRegistryServiceBundle } from '../../src/features/task-registry/services/createRegistryServiceBundle';

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('TaskRegistryService write paths', () => {
  beforeEach(() => {
    mockStorage.providerRegistryOverlayStorage.reset();
    mockStorage.providerSecretsStorage.reset();
    mockStorage.taskProviderChainOverlayStorage.reset();
    mockStorage.taskDefinitionOverlayStorage.reset();
  });

  it('updates and resets system task overlays with provider-chain control', async () => {
    const { taskRegistryService: service } = createRegistryServiceBundle();

    await service.updateSystemTask({
      id: 'information',
      label: 'Deep Context',
      mode: 'json',
      systemPrompt: 'Return structured context analysis.',
      userPrompt: 'Explain "{{text}}" with surrounding context.',
      providerIds: ['siliconflow_glm4_9b'],
    });

    const updatedTask = await service.getTaskRecord('information');
    expect(updatedTask?.label).toBe('Deep Context');
    expect(updatedTask?.mode).toBe('json');
    expect(updatedTask?.providerChainIds).toEqual(['siliconflow_glm4_9b']);
    expect(updatedTask?.hasOverride).toBe(true);

    await service.resetSystemTask('information');

    const resetTask = await service.getTaskRecord('information');
    expect(resetTask?.label).toBe(TASKS.information.label);
    expect(resetTask?.mode).toBe(TASKS.information.mode);
    expect(resetTask?.systemPrompt).toBe(TASKS.information.systemPrompt);
    expect(resetTask?.userPrompt).toBe(TASKS.information.userPrompt);
    expect(resetTask?.providerChainIds).toEqual(['zhipu_glm4_flash', 'siliconflow_glm4_9b']);
    expect(resetTask?.hasOverride).toBe(false);
  });

  it('emits live task updates to watchers after mutations', async () => {
    const { taskRegistryService: service } = createRegistryServiceBundle();
    const seenChains: string[] = [];

    const stopWatching = service.watchTaskRecords((tasks) => {
      const lexicalTask = tasks.find((task) => task.id === 'lexical');
      seenChains.push(lexicalTask?.providerChainIds.join(' > ') ?? '');
    });

    await flushMicrotasks();

    await service.updateSystemTask({
      id: 'lexical',
      label: TASKS.lexical.label,
      mode: TASKS.lexical.mode,
      systemPrompt: TASKS.lexical.systemPrompt,
      userPrompt: TASKS.lexical.userPrompt,
      providerIds: ['siliconflow_glm4_9b'],
    });
    await flushMicrotasks();
    await flushMicrotasks();

    stopWatching();

    expect(seenChains.length).toBeGreaterThan(0);
  });

  it('creates, updates, and deletes custom tasks inside task-registry overlay ownership', async () => {
    const { taskRegistryService: service } = createRegistryServiceBundle();

    const customTaskId = await service.createCustomTask({
      label: 'Context Ladder',
      mode: 'markdown',
      systemPrompt: 'Analyze the selection in three escalating layers.',
      userPrompt: 'Explain {{text}} with summary, detail, and next action.',
      providerIds: ['zhipu_glm4_flash', 'siliconflow_glm4_9b'],
    });

    expect(customTaskId).toBe('custom:context-ladder');

    const createdTask = await service.getTaskRecord(customTaskId);
    expect(createdTask).toMatchObject({
      id: 'custom:context-ladder',
      source: 'user',
      mutability: 'full',
      label: 'Context Ladder',
      mode: 'markdown',
      providerChainIds: ['zhipu_glm4_flash', 'siliconflow_glm4_9b'],
    });

    await service.updateTask({
      id: customTaskId,
      label: 'Context Ladder+',
      mode: 'json',
      systemPrompt: 'Return a structured multi-layer analysis.',
      userPrompt: 'Explain {{text}} in JSON.',
      providerIds: ['siliconflow_glm4_9b'],
    });

    const updatedTask = await service.getTaskRecord(customTaskId);
    expect(updatedTask).toMatchObject({
      id: 'custom:context-ladder',
      label: 'Context Ladder+',
      mode: 'json',
      providerChainIds: ['siliconflow_glm4_9b'],
    });

    const allTasks = await service.getTaskRecords();
    expect(allTasks.some((task) => task.id === customTaskId)).toBe(true);

    await service.deleteCustomTask(customTaskId);

    await expect(service.getTaskRecord(customTaskId)).resolves.toBeNull();
  });
});