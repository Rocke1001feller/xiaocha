import { getResolvedAiOutputLanguagePromptLabel } from '../shared/ai-output-language';
import { getAiOutputLanguagePreference } from '../storage/ai-output-language';
import {
  ProviderRequestError,
  streamProviderChatCompletion,
  type ProviderTransportCallbacks as StreamCallbacks,
  type ProviderTransportMessage,
} from './provider-chat-transport';
import { renderTemplate } from './render-template';
import { PROVIDERS, TASKS, type ProviderId as StaticProviderId } from './config';
import type { SystemTaskId } from '../shared/task-ids';
import type {
  ProviderViewRecord,
  ResolvedProvider,
  ResolvedTaskRuntimeConfig,
} from '../features/provider-registry/events/ProviderRegistryEvents';
import type { IProviderRuntimeResolver } from '../features/provider-registry/interfaces/IProviderRuntimeResolver';
import type { ExplainSelection, ExplainTaskResult, LexicalDefinition, LexicalResult, RuntimeTaskId, StreamUpdate } from './types';

function toResolvedProvider(id: StaticProviderId): ResolvedProvider {
  const provider = PROVIDERS[id];
  return {
    id,
    source: 'system',
    label: provider.label,
    endpoint: provider.url,
    apiKey: provider.apiKey,
    model: provider.model,
  };
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '••••••••';
  }
  return `${apiKey.slice(0, 4)}••••••••${apiKey.slice(-4)}`;
}

function isRuntimeTaskId(task: string): task is SystemTaskId {
  return task in TASKS;
}

const defaultProviderRuntimeResolver: IProviderRuntimeResolver = {
  async getProviderById(id) {
    if (!(id in PROVIDERS)) {
      return null;
    }
    return toResolvedProvider(id as StaticProviderId);
  },

  async getProvidersForTask(task) {
    const runtimeTask = String(task);
    if (!isRuntimeTaskId(runtimeTask)) {
      return [];
    }

    const taskConfig = TASKS[runtimeTask];
    if (!taskConfig) {
      return [];
    }
    return taskConfig.providers.map((providerId: StaticProviderId) => toResolvedProvider(providerId));
  },

  async getTaskRuntimeConfig(task) {
    const runtimeTask = String(task);
    if (!isRuntimeTaskId(runtimeTask)) {
      throw new Error(`Task "${task}" does not exist.`);
    }

    const taskConfig = TASKS[runtimeTask];

    return {
      task,
      label: taskConfig.label,
      mode: taskConfig.mode,
      systemPrompt: taskConfig.systemPrompt,
      userPrompt: taskConfig.userPrompt,
      providerSystemPrompts: taskConfig.providerSystemPrompts,
      providerRequestParams: taskConfig.providerRequestParams,
      providers: taskConfig.providers.map((providerId: StaticProviderId) => toResolvedProvider(providerId)),
    } as ResolvedTaskRuntimeConfig<typeof task>;
  },

  async getRegistrySnapshot() {
    return Object.values(PROVIDERS).map((provider): ProviderViewRecord => ({
      id: provider.id,
      source: 'system',
      status: 'active',
      mutability: 'override-only',
      label: provider.label,
      endpoint: provider.url,
      model: provider.model,
      hasSecret: provider.apiKey.length > 0,
      secretMask: maskApiKey(provider.apiKey),
      isRuntimeReachable: provider.apiKey.length > 0,
      updatedAt: 0,
    }));
  },
};

export async function runExplainTask<TTask extends RuntimeTaskId>(
  task: TTask,
  selection: ExplainSelection,
  signal: AbortSignal,
  callbacks: StreamCallbacks = {},
  runtimeResolver: IProviderRuntimeResolver = defaultProviderRuntimeResolver,
): Promise<ExplainTaskResult<TTask>> {
  const taskConfig = await runtimeResolver.getTaskRuntimeConfig(task);
  let lastError: unknown;

  if (taskConfig.providers.length === 0) {
    throw new Error(`No active provider is available for ${taskConfig.label}.`);
  }

  for (const provider of taskConfig.providers) {

    try {
      return await streamTaskWithProvider(taskConfig, selection, provider, signal, callbacks);
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      if (error instanceof ProviderRequestError && error.retryable) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Unable to complete ${taskConfig.label} analysis.`);
}

async function streamTaskWithProvider<TTask extends RuntimeTaskId>(
  taskConfig: ResolvedTaskRuntimeConfig<TTask>,
  selection: ExplainSelection,
  provider: ResolvedProvider,
  signal: AbortSignal,
  callbacks: StreamCallbacks,
): Promise<ExplainTaskResult<TTask>> {
  callbacks.onStart?.(provider.label);

  const { content, reasoning } = await streamProviderChatCompletion(
    provider,
    await buildRequestMessages(taskConfig, selection, provider),
    signal,
    callbacks,
    taskConfig.providerRequestParams?.[provider.id],
  );
  const lexical = taskConfig.task === 'lexical' ? parseLexicalContent(content) : undefined;

  return {
    task: taskConfig.task,
    providerId: provider.id,
    providerLabel: provider.label,
    content,
    reasoning,
    lexical,
  };
}

async function buildRequestMessages(
  taskConfig: ResolvedTaskRuntimeConfig,
  selection: ExplainSelection,
  provider: ResolvedProvider,
): Promise<ProviderTransportMessage[]> {
  const preference = await getAiOutputLanguagePreference();
  const promptData = {
    text: selection.text,
    lang: getResolvedAiOutputLanguagePromptLabel(preference, globalThis.navigator?.language ?? 'en'),
    context: selection.context,
  };

  const systemPrompt = taskConfig.providerSystemPrompts?.[provider.id] ?? taskConfig.systemPrompt;

  return [
    {
      role: 'system' as const,
      content: renderTemplate(systemPrompt, promptData),
    },
    {
      role: 'user' as const,
      content: renderTemplate(taskConfig.userPrompt, promptData),
    },
  ];
}

function parseLexicalContent(content: string): LexicalResult {
  const cleaned = normalizeJsonText(content);
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  return {
    phonetic: getString(parsed.phonetic),
    translation: getString(parsed.translation),
    contextualAnalysis: getString(parsed.contextual_analysis),
    definitions: normalizeDefinitions(parsed.definitions),
  };
}

function normalizeJsonText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('The lexical response was empty.');
  }

  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }

  return trimmed;
}

function normalizeDefinitions(value: unknown): LexicalDefinition[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const definition = typeof entry === 'object' && entry ? (entry as Record<string, unknown>) : {};
    const example = typeof definition.example === 'object' && definition.example ? (definition.example as Record<string, unknown>) : undefined;

    return {
      pos: getString(definition.pos),
      meaning: getString(definition.meaning),
      example: example
        ? {
            source: getString(example.source),
            target: getString(example.target),
          }
        : undefined,
    };
  });
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}
