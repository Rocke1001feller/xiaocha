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

import { ProviderRegistryService } from '../../src/features/provider-registry/services/ProviderRegistryService';
import { SYSTEM_PROVIDERS } from '../../src/features/provider-registry/events/ProviderRegistryEvents';
import { TaskRegistryService } from '../../src/features/task-registry/services/TaskRegistryService';
import { createRegistryServiceBundle } from '../../src/features/task-registry/services/createRegistryServiceBundle';

function createSseResponse(chunks: string[], status = 200) {
  return new Response(`${chunks.join('\n\n')}\n\n`, {
    status,
    headers: {
      'Content-Type': 'text/event-stream',
    },
  });
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('ProviderRegistryService write paths', () => {
  beforeEach(() => {
    mockStorage.providerRegistryOverlayStorage.reset();
    mockStorage.providerSecretsStorage.reset();
    mockStorage.taskProviderChainOverlayStorage.reset();
    mockStorage.taskDefinitionOverlayStorage.reset();
  });

  it('creates, updates, and deletes custom providers through the overlay state', async () => {
    const { providerRegistryService: service, taskRegistryService: taskService } = createRegistryServiceBundle();

    const createdProviderId = await service.createCustomProvider({
      slug: 'openrouter-edge',
      label: 'OpenRouter Edge',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: 'sk-or-edge',
      model: 'openai/gpt-4.1-mini',
    });

    expect(createdProviderId).toBe('custom:openrouter-edge');

    const createdProvider = await service.getProviderRecord(createdProviderId);
    expect(createdProvider?.source).toBe('user');
  expect(createdProvider?.isRuntimeReachable).toBe(true);

    await service.updateProvider({
      id: createdProviderId,
      label: 'OpenRouter Edge v2',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'openai/gpt-4.1-mini',
    });

    const updatedProvider = await service.getProviderRecord(createdProviderId);
    expect(updatedProvider?.label).toBe('OpenRouter Edge v2');

    await taskService.updateSystemTask({
      id: 'lexical',
      label: TASKS.lexical.label,
      mode: TASKS.lexical.mode,
      systemPrompt: TASKS.lexical.systemPrompt,
      userPrompt: TASKS.lexical.userPrompt,
      providerRequestParams: TASKS.lexical.providerRequestParams,
      providerIds: [createdProviderId],
    });

    await expect(service.deleteCustomProvider(createdProviderId)).rejects.toThrow('still attached to tasks');

    await taskService.resetSystemTask('lexical');

    await service.deleteCustomProvider(createdProviderId);
    await expect(service.getProviderRecord(createdProviderId)).resolves.toBeNull();
  });

  it('disables and resets system providers while preserving executable fallback rules', async () => {
    const { providerRegistryService: service, taskRegistryService: taskService } = createRegistryServiceBundle();
    const primaryProviderId = 'zhipu_glm4_flash';
    const secondaryProviderId = 'siliconflow_glm4_9b';

    await service.updateProvider({
      id: primaryProviderId,
      label: 'Zhipu Override',
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: SYSTEM_PROVIDERS[primaryProviderId].model,
    });

    expect((await service.getProviderRecord(primaryProviderId))?.label).toBe('Zhipu Override');

    await service.disableProvider(primaryProviderId);
    expect((await service.getProviderRecord(primaryProviderId))?.status).toBe('disabled');

    await expect(service.disableProvider(secondaryProviderId)).rejects.toThrow(
      'must keep at least one executable provider',
    );

    await service.resetSystemProvider(primaryProviderId);
    const resetProvider = await service.getProviderRecord(primaryProviderId);
    expect(resetProvider?.label).toBe(SYSTEM_PROVIDERS[primaryProviderId].label);
    expect(resetProvider?.status).toBe('active');
  });

  it('emits live merged-provider updates to watchers after mutations', async () => {
    const { providerRegistryService: service } = createRegistryServiceBundle();
    const seenProviderIds: string[][] = [];

    const stopWatching = service.watchMergedProviders((providers) => {
      seenProviderIds.push(providers.map((provider) => provider.id));
    });

    await flushMicrotasks();
    await service.createCustomProvider({
      slug: 'watch-me',
      label: 'Watch Me',
      endpoint: 'https://example.com/v1/chat/completions',
      apiKey: 'watch-key',
      model: 'watch-model',
    });
    await flushMicrotasks();

    stopWatching();

    expect(seenProviderIds[0]).toContain('zhipu_glm4_flash');
    expect(seenProviderIds.some((providerIds) => providerIds.includes('custom:watch-me'))).toBe(true);
  });

  it('tests provider connections with existing stored secrets when the draft api key is blank', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createSseResponse([
        'data: {"choices":[{"delta":{"content":"OK"}}]}',
        'data: [DONE]',
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { providerRegistryService: service } = createRegistryServiceBundle();
    await service.updateProvider({
      id: 'zhipu_glm4_flash',
      label: 'Zhipu Draft',
      endpoint: 'https://provider-test.example.com/v1/chat/completions',
      apiKey: 'sk-test-secret',
      model: 'glm-test',
    });

    const result = await service.testProviderConnection(
      {
        providerId: 'zhipu_glm4_flash',
        label: 'Zhipu Draft',
        endpoint: 'https://provider-test.example.com/v1/chat/completions',
        apiKey: null,
        model: 'glm-test',
      },
      new AbortController().signal,
    );

    expect(result.providerLabel).toBe('Zhipu Draft');
    expect(result.content).toBe('OK');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://provider-test.example.com/v1/chat/completions');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer sk-test-secret',
      }),
    });

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
      stream: boolean;
    };
    expect(requestBody.model).toBe('glm-test');
    expect(requestBody.stream).toBe(true);
    expect(requestBody.messages[0]?.role).toBe('system');
    expect(requestBody.messages[1]?.content).toContain('Return OK');
  });

  it('surfaces upstream provider errors during connection tests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'Invalid provider key.' } }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { providerRegistryService: service } = createRegistryServiceBundle();

    await expect(
      service.testProviderConnection(
        {
          providerId: null,
          label: 'Broken Provider',
          endpoint: 'https://broken-provider.example.com/v1/chat/completions',
          apiKey: 'sk-bad-key',
          model: 'broken-model',
        },
        new AbortController().signal,
      ),
    ).rejects.toThrow('Invalid provider key.');
  });
});