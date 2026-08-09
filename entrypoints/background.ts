import { runExplainTask } from '../src/llm/client';
import {
  POPOVER_STREAM_EVENT,
  isPopoverCancelTaskMessage,
  isPopoverStartTaskMessage,
  type StartPopoverTaskMessage,
  type PopoverStreamEvent,
} from '../src/features/popover/events/PopoverEvents';
import { ProviderRuntimeResolver } from '../src/features/provider-registry/services/ProviderRuntimeResolver';
import { synthesizeWithAzure } from '../src/features/tts/engines/azureTts';
import { synthesizeWithGoogleTranslate } from '../src/features/tts/engines/googleTranslateTts';
import {
  isTtsSynthesizeRequestMessage,
  type TtsSynthesizeRequestPayload,
  type TtsSynthesizeResponse,
} from '../src/features/tts/events/TtsEvents';
import { TtsRegistryService } from '../src/features/tts/services/TtsRegistryService';
import {
  resolveAzureRegion,
  resolveAzureVoiceName,
  resolveTtsSourceId,
} from '../src/features/tts/services/tts-registry/ttsRegistryModel';

const activeRequests = new Map<string, AbortController>();
const providerRuntimeResolver = new ProviderRuntimeResolver();
const ttsRegistryService = new TtsRegistryService();

type PopoverMessageSender = {
  tab?: {
    id?: number;
  };
  frameId?: number;
};

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender) => {
    if (isPopoverStartTaskMessage(message)) {
      return keepServiceWorkerAlive(handleStartTask(message, sender));
    }

    if (isPopoverCancelTaskMessage(message)) {
      activeRequests.get(message.requestId)?.abort();
      activeRequests.delete(message.requestId);
      return Promise.resolve();
    }

    if (isTtsSynthesizeRequestMessage(message)) {
      return keepServiceWorkerAlive(handleTtsSynthesize(message.payload));
    }

    return undefined;
  });
});

async function keepServiceWorkerAlive<T>(operation: Promise<T>): Promise<T> {
  const keepAlive = globalThis.setInterval(() => {
    void browser.runtime.getPlatformInfo().catch(() => undefined);
  }, 25_000);

  try {
    return await operation;
  } finally {
    globalThis.clearInterval(keepAlive);
  }
}

async function handleStartTask(
  message: StartPopoverTaskMessage,
  sender: PopoverMessageSender,
) {
  if (!sender.tab?.id) {
    return;
  }

  activeRequests.get(message.requestId)?.abort();

  const controller = new AbortController();
  activeRequests.set(message.requestId, controller);

  await emitToSender(sender, {
    kind: POPOVER_STREAM_EVENT,
    requestId: message.requestId,
    task: message.task,
    phase: 'started',
    providerLabel: 'Connecting…',
  });

  try {
    const result = await runExplainTask(message.task, message.selection, controller.signal, {
      onStart: async (providerLabel) => {
        await emitToSender(sender, {
          kind: POPOVER_STREAM_EVENT,
          requestId: message.requestId,
          task: message.task,
          phase: 'started',
          providerLabel,
        });
      },
      onContentChunk: async (contentDelta) => {
        if (message.task === 'lexical' || !contentDelta) {
          return;
        }

        await emitToSender(sender, {
          kind: POPOVER_STREAM_EVENT,
          requestId: message.requestId,
          task: message.task,
          phase: 'chunk',
          contentDelta,
        });
      },
      onReasoningChunk: async (reasoningDelta) => {
        if (!reasoningDelta) {
          return;
        }

        await emitToSender(sender, {
          kind: POPOVER_STREAM_EVENT,
          requestId: message.requestId,
          task: message.task,
          phase: 'chunk',
          reasoningDelta,
        });
      },
    }, providerRuntimeResolver);

    await emitToSender(sender, {
      kind: POPOVER_STREAM_EVENT,
      requestId: message.requestId,
      task: message.task,
      phase: 'completed',
      result,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      return;
    }

    await emitToSender(sender, {
      kind: POPOVER_STREAM_EVENT,
      requestId: message.requestId,
      task: message.task,
      phase: 'failed',
      errorMessage: error instanceof Error ? error.message : 'The explanation request failed.',
    });
  } finally {
    activeRequests.delete(message.requestId);
  }
}

async function handleTtsSynthesize(payload: TtsSynthesizeRequestPayload): Promise<TtsSynthesizeResponse> {
  try {
    const selection = await ttsRegistryService.getSelection();
    const resolvedSourceId = resolveTtsSourceId(selection, navigator.onLine);

    if (resolvedSourceId === 'browser-speech') {
      // Web Speech API only exists page-side; the content script falls back on this error.
      return { error: 'browser-speech-unavailable-in-background' };
    }

    if (resolvedSourceId === 'azure-speech') {
      const [sourceConfig, azureApiKey] = await Promise.all([
        ttsRegistryService.getSourceConfig('azure-speech'),
        ttsRegistryService.getAzureApiKey(),
      ]);

      if (!azureApiKey) {
        return { error: 'Azure Speech API key is not configured.' };
      }

      return await synthesizeWithAzure(payload.text, payload.lang, {
        apiKey: azureApiKey,
        region: resolveAzureRegion(sourceConfig),
        voiceZh: payload.voice ?? resolveAzureVoiceName(sourceConfig, 'zh'),
        voiceEn: payload.voice ?? resolveAzureVoiceName(sourceConfig, 'en'),
      });
    }

    return await synthesizeWithGoogleTranslate(payload.text, payload.lang);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'The TTS synthesis request failed.',
    };
  }
}

async function emitToSender(sender: PopoverMessageSender, event: PopoverStreamEvent) {
  if (!sender.tab?.id) {
    return;
  }

  try {
    await browser.tabs.sendMessage(sender.tab.id, event, sender.frameId != null ? { frameId: sender.frameId } : undefined);
  } catch {
    // Ignore delivery failures when the sender page navigates away.
  }
}
