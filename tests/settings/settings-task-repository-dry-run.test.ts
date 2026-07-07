import { afterEach, describe, expect, it, vi } from 'vitest';

const { runExplainTaskMock } = vi.hoisted(() => ({
  runExplainTaskMock: vi.fn(),
}));

vi.mock('../../src/llm/client', () => ({
  runExplainTask: runExplainTaskMock,
}));

vi.mock('../../src/features/task-registry/services/TaskRegistryService', () => ({
  TaskRegistryService: class TaskRegistryService {},
}));

vi.mock('../../src/features/task-registry/services/createRegistryServiceBundle', () => ({
  createRegistryServiceBundle: () => ({
    taskRegistryService: {},
    providerRegistryService: {},
  }),
}));

vi.mock('../../src/features/provider-registry/services/ProviderRuntimeResolver', () => ({
  ProviderRuntimeResolver: class ProviderRuntimeResolver {
    async getProviderById() {
      return null;
    }
  },
}));

import type { UpdateTaskInput } from '../../src/features/task-registry/events/TaskRegistryEvents';
import { SettingsTaskRepository } from '../../src/features/settings/repositories/SettingsTaskRepository';
import type {
  ProviderId,
  ResolvedProvider,
} from '../../src/features/provider-registry/events/ProviderRegistryEvents';
import type { IProviderRuntimeResolver } from '../../src/features/provider-registry/interfaces/IProviderRuntimeResolver';

function createProvider(id: ProviderId, label: string): ResolvedProvider {
  return {
    id,
    label,
    source: id.startsWith('custom:') ? 'user' : 'system',
    endpoint: `https://example.com/${id}`,
    apiKey: 'secret',
    model: `${id}-model`,
  };
}

const PROVIDERS = {
  zhipu_glm4_flash: createProvider('zhipu_glm4_flash', 'GLM-4 Flash'),
  siliconflow_glm4_9b: createProvider('siliconflow_glm4_9b', 'GLM-4 9B'),
  'custom:alpha': createProvider('custom:alpha', 'Custom Alpha'),
} as const;

function createRepository() {
  const providerRuntimeResolver: Pick<IProviderRuntimeResolver, 'getProviderById'> = {
    getProviderById: async (id) => PROVIDERS[id as keyof typeof PROVIDERS] ?? null,
  };

  const taskRegistryService = {
    getTaskRecord: async () => null,
  };

  return new SettingsTaskRepository(taskRegistryService as any, providerRuntimeResolver);
}

afterEach(() => {
  runExplainTaskMock.mockReset();
});

describe('SettingsTaskRepository dry run', () => {
  it('builds a draft-aware runtime config for replace mode without persisting the task', async () => {
    const repository = createRepository();
    const input: UpdateTaskInput = {
      id: 'information',
      label: 'Deep Context',
      mode: 'json',
      systemPrompt: 'Return structured analysis.',
      userPrompt: 'Explain {{text}} with context.',
      providerIds: ['custom:alpha', 'zhipu_glm4_flash'],
    };

    runExplainTaskMock.mockImplementation(async (task, selection, _signal, _callbacks, runtimeResolver) => {
      expect(task).toBe('information');
      expect(selection.sourceLabel).toBe('settings-dry-run');

      const taskConfig = await runtimeResolver.getTaskRuntimeConfig(task);
      expect(taskConfig.label).toBe('Deep Context');
      expect(taskConfig.mode).toBe('json');
      expect(taskConfig.systemPrompt).toBe('Return structured analysis.');
      expect(taskConfig.userPrompt).toBe('Explain {{text}} with context.');
      expect(taskConfig.providers.map((provider: ResolvedProvider) => provider.id)).toEqual([
        'custom:alpha',
        'zhipu_glm4_flash',
      ]);

      return {
        task,
        providerId: 'custom:alpha',
        providerLabel: 'Custom Alpha',
        content: '{"preview":"ok"}',
        reasoning: '',
      };
    });

    const result = await repository.dryRunTask(input, new AbortController().signal);

    expect(result.providerId).toBe('custom:alpha');
    expect(runExplainTaskMock).toHaveBeenCalledTimes(1);
  });

  it('uses the explicit draft provider order without implicitly merging defaults', async () => {
    const repository = createRepository();
    const input: UpdateTaskInput = {
      id: 'information',
      label: 'Information',
      mode: 'markdown',
      systemPrompt: 'Analyze the selection.',
      userPrompt: 'Explain {{text}}.',
      providerIds: ['custom:alpha'],
    };

    runExplainTaskMock.mockImplementation(async (task, _selection, _signal, _callbacks, runtimeResolver) => {
      const taskConfig = await runtimeResolver.getTaskRuntimeConfig(task);
      expect(taskConfig.providers.map((provider: ResolvedProvider) => provider.id)).toEqual([
        'custom:alpha',
      ]);

      return {
        task,
        providerId: 'zhipu_glm4_flash',
        providerLabel: 'GLM-4 Flash',
        content: 'ok',
        reasoning: 'done',
      };
    });

    await repository.dryRunTask(input, new AbortController().signal);

    expect(runExplainTaskMock).toHaveBeenCalledTimes(1);
  });

  it('rejects dry runs for custom tasks before hitting the runtime client', async () => {
    const repository = createRepository();

    await expect(repository.dryRunTask({
      id: 'custom:context-ladder',
      label: 'Context Ladder',
      mode: 'markdown',
      systemPrompt: 'Analyze the selection.',
      userPrompt: 'Explain {{text}}.',
      providerIds: ['custom:alpha'],
    }, new AbortController().signal)).rejects.toThrow('Dry run is currently available for built-in tasks only.');

    expect(runExplainTaskMock).not.toHaveBeenCalled();
  });
});