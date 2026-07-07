import { FIRST_CHUNK_TIMEOUT_MS, REQUEST_TIMEOUT_MS } from './runtime-config';
import type { StreamUpdate } from './types';

export type ChatCompletionRequestParams = {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
};

export type ProviderTransportTarget = {
  label: string;
  endpoint: string;
  apiKey: string;
  model: string;
};

export type ProviderTransportMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ProviderTransportCallbacks = {
  onStart?: (providerLabel: string) => void;
  onUpdate?: (update: StreamUpdate) => void;
  onContentChunk?: (chunk: string, content: string) => void;
  onReasoningChunk?: (chunk: string, reasoning: string) => void;
};

export type ProviderTransportResult = {
  content: string;
  reasoning: string;
};

const scheduleTimeout = globalThis.setTimeout.bind(globalThis);
const clearScheduledTimeout = globalThis.clearTimeout.bind(globalThis);

export class ProviderRequestError extends Error {
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = 'ProviderRequestError';
    this.retryable = retryable;
  }
}

export async function streamProviderChatCompletion(
  provider: ProviderTransportTarget,
  messages: readonly ProviderTransportMessage[],
  signal: AbortSignal,
  callbacks: ProviderTransportCallbacks = {},
  requestParams?: ChatCompletionRequestParams,
): Promise<ProviderTransportResult> {
  const requestController = new AbortController();
  const forwardAbort = () => requestController.abort(signal.reason);
  const requestTimeoutId = scheduleTimeout(() => requestController.abort(new Error('Request timeout.')), REQUEST_TIMEOUT_MS);

  if (signal.aborted) {
    requestController.abort(signal.reason);
  } else {
    signal.addEventListener('abort', forwardAbort, { once: true });
  }

  try {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        stream: true,
        ...requestParams,
      }),
      signal: requestController.signal,
    });

    if (!response.ok) {
      const detail = await readResponseDetail(response);
      throw new ProviderRequestError(detail || `${provider.label} returned ${response.status}.`, true);
    }

    if (!response.body) {
      throw new ProviderRequestError(`${provider.label} did not return a readable stream.`, true);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const firstChunkController = new AbortController();
    const stopFirstChunkTimer = linkFirstChunkTimeout(firstChunkController, requestController);

    let buffer = '';
    let content = '';
    let reasoning = '';
    let receivedChunk = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        receivedChunk = true;
        stopFirstChunkTimer();
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) {
            continue;
          }

          const payload = trimmed.slice(5).trimStart();
          if (payload === '[DONE]') {
            continue;
          }

          let parsed: any;
          try {
            parsed = JSON.parse(payload);
          } catch {
            continue;
          }

          const delta = parsed?.choices?.[0]?.delta;
          if (!delta) {
            continue;
          }

          if (typeof delta.reasoning_content === 'string' && delta.reasoning_content.length > 0) {
            reasoning += delta.reasoning_content;
            callbacks.onReasoningChunk?.(delta.reasoning_content, reasoning);
            callbacks.onUpdate?.({ content, reasoning, reasoningDelta: delta.reasoning_content });
          }

          if (typeof delta.content === 'string' && delta.content.length > 0) {
            content += delta.content;
            callbacks.onContentChunk?.(delta.content, content);
            callbacks.onUpdate?.({ content, reasoning, contentDelta: delta.content });
          }
        }
      }
    } catch (error) {
      if (requestController.signal.aborted) {
        throw error;
      }

      throw new ProviderRequestError(
        error instanceof Error ? error.message : `${provider.label} stream failed.`,
        !receivedChunk,
      );
    } finally {
      stopFirstChunkTimer();
      firstChunkController.abort();
      reader.releaseLock();
    }

    return {
      content,
      reasoning,
    };
  } catch (error) {
    if (requestController.signal.aborted && !signal.aborted) {
      throw new ProviderRequestError(error instanceof Error ? error.message : 'Request aborted.', true);
    }

    if (signal.aborted) {
      throw error;
    }

    if (error instanceof ProviderRequestError) {
      throw error;
    }

    throw new ProviderRequestError(error instanceof Error ? error.message : `${provider.label} request failed.`, true);
  } finally {
    clearScheduledTimeout(requestTimeoutId);
    signal.removeEventListener('abort', forwardAbort);
  }
}

function linkFirstChunkTimeout(firstChunkController: AbortController, requestController: AbortController) {
  const timeoutId = scheduleTimeout(() => {
    if (!firstChunkController.signal.aborted) {
      requestController.abort(new Error('First chunk timeout.'));
    }
  }, FIRST_CHUNK_TIMEOUT_MS);

  return () => {
    firstChunkController.abort();
    clearScheduledTimeout(timeoutId);
  };
}

async function readResponseDetail(response: Response) {
  try {
    const text = (await response.text()).trim();
    if (!text) {
      return '';
    }

    try {
      const parsed = JSON.parse(text) as {
        error?: { message?: unknown };
        message?: unknown;
      };
      const detail = parsed.error?.message ?? parsed.message;
      return typeof detail === 'string' ? detail : text;
    } catch {
      return text;
    }
  } catch {
    return '';
  }
}