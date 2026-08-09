import {
  TTS_PLAYBACK_IDLE,
  TTS_SYNTHESIZE_KIND,
  isTtsSynthesizeSuccessResponse,
  type TtsLang,
  type TtsPlaybackState,
  type TtsSynthesizeRequestPayload,
  type TtsSynthesizeResponse,
} from '../events/TtsEvents';
import { OnlineAudioPlayer } from '../engines/onlineAudioPlayer';
import { SpeechSynthesisEngine } from '../engines/speechSynthesisEngine';
import { splitSentences } from '../utils/splitSentences';
import { readSettingsWithFallback } from '../utils/readSettingsWithFallback';
import { TtsRegistryService } from './TtsRegistryService';
import {
  resolveAzureVoiceName,
  resolveBrowserVoiceName,
  resolveTtsSourceId,
} from './tts-registry/ttsRegistryModel';

export type TtsService = {
  speak(ownerId: string, text: string, lang: TtsLang): Promise<void>;
  stop(): void;
  subscribe(listener: (state: TtsPlaybackState) => void): () => void;
};

export type TtsAudioPlayer = {
  enqueueBase64(audioBase64: string, mimeType: string): void;
  stop(): void;
  isIdle(): boolean;
  setOnQueueDrained(callback: (() => void) | null): void;
};

export type TtsServiceDeps = {
  registry?: TtsRegistryService;
  isOnline?: () => boolean;
  speechEngine?: Pick<SpeechSynthesisEngine, 'isAvailable' | 'speak' | 'stop'>;
  player?: TtsAudioPlayer;
  requestSynthesis?: (payload: TtsSynthesizeRequestPayload) => Promise<TtsSynthesizeResponse>;
  /* storage 读取兜底超时：孤立 content script 里 chrome.storage 会永久 pending */
  settingsTimeoutMs?: number;
};

type StreamOutcome =
  | { kind: 'ok' }
  | { kind: 'stopped' }
  | { kind: 'failed'; failedChunkIndex: number };

const DEFAULT_SETTINGS_TIMEOUT_MS = 1500;

/**
 * Content-side facade. Resolves the selected source ('auto' follows
 * navigator.onLine), streams online audio through the background, and falls
 * back to browser speech whenever an online source fails.
 */
export function createTtsService(deps: TtsServiceDeps = {}): TtsService {
  const registry = deps.registry ?? new TtsRegistryService();
  const isOnline = deps.isOnline ?? (() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const speechEngine = deps.speechEngine ?? new SpeechSynthesisEngine();
  const player = deps.player ?? new OnlineAudioPlayer();
  const requestSynthesis = deps.requestSynthesis ?? sendSynthesizeRequest;
  const settingsTimeoutMs = deps.settingsTimeoutMs ?? DEFAULT_SETTINGS_TIMEOUT_MS;

  const listeners = new Set<(state: TtsPlaybackState) => void>();
  let state: TtsPlaybackState = TTS_PLAYBACK_IDLE;
  let generation = 0;

  const emit = (next: TtsPlaybackState) => {
    state = next;
    listeners.forEach((listener) => listener(state));
  };

  const haltCurrent = () => {
    generation += 1;
    speechEngine.stop();
    player.stop();
  };

  const stop = () => {
    haltCurrent();
    emit(TTS_PLAYBACK_IDLE);
  };

  const speakWithBrowser = async (
    gen: number,
    ownerId: string,
    text: string,
    lang: TtsLang,
  ): Promise<void> => {
    if (!speechEngine.isAvailable()) {
      if (gen === generation) {
        emit(TTS_PLAYBACK_IDLE);
      }
      return;
    }

    const browserConfig = await readSettingsWithFallback(
      registry.getSourceConfig('browser-speech'),
      {},
      settingsTimeoutMs,
    );
    if (gen !== generation) {
      return;
    }

    emit({ status: 'playing', ownerId });
    try {
      await speechEngine.speak(text, lang, resolveBrowserVoiceName(browserConfig, lang));
    } catch {
      // Browser speech is the last resort; a failure just ends playback.
    }

    if (gen === generation) {
      emit(TTS_PLAYBACK_IDLE);
    }
  };

  const streamOnline = async (
    gen: number,
    ownerId: string,
    chunks: string[],
    lang: TtsLang,
    voice?: string,
  ): Promise<StreamOutcome> => {
    let resolveDrained: () => void = () => undefined;
    const drained = new Promise<void>((resolve) => {
      resolveDrained = resolve;
    });

    let allChunksEnqueued = false;
    player.setOnQueueDrained(() => {
      if (allChunksEnqueued) {
        resolveDrained();
      }
    });

    for (let index = 0; index < chunks.length; index += 1) {
      if (gen !== generation) {
        return { kind: 'stopped' };
      }

      let response: TtsSynthesizeResponse;
      try {
        response = await requestSynthesis({ text: chunks[index], lang, voice });
      } catch {
        return { kind: 'failed', failedChunkIndex: index };
      }

      if (gen !== generation) {
        return { kind: 'stopped' };
      }

      if (!isTtsSynthesizeSuccessResponse(response)) {
        return { kind: 'failed', failedChunkIndex: index };
      }

      player.enqueueBase64(response.audioBase64, response.mimeType);
      if (index === 0) {
        emit({ status: 'playing', ownerId });
      }
    }

    allChunksEnqueued = true;
    if (!player.isIdle()) {
      await drained;
    }

    if (gen === generation) {
      emit(TTS_PLAYBACK_IDLE);
      return { kind: 'ok' };
    }

    return { kind: 'stopped' };
  };

  const speak = async (ownerId: string, text: string, lang: TtsLang): Promise<void> => {
    haltCurrent();
    const gen = generation;
    emit({ status: 'loading', ownerId });

    const trimmedText = text.trim();
    if (!trimmedText) {
      if (gen === generation) {
        emit(TTS_PLAYBACK_IDLE);
      }
      return;
    }

    const selection = await readSettingsWithFallback(registry.getSelection(), 'auto', settingsTimeoutMs);
    const resolvedSourceId = resolveTtsSourceId(selection, isOnline());
    if (gen !== generation) {
      return;
    }

    if (resolvedSourceId === 'browser-speech') {
      await speakWithBrowser(gen, ownerId, trimmedText, lang);
      return;
    }

    const sourceConfig = await readSettingsWithFallback(
      registry.getSourceConfig(resolvedSourceId),
      {},
      settingsTimeoutMs,
    );
    const voice = resolvedSourceId === 'azure-speech' ? resolveAzureVoiceName(sourceConfig, lang) : undefined;
    const outcome = await streamOnline(gen, ownerId, splitSentences(trimmedText), lang, voice);

    if (outcome.kind === 'failed' && gen === generation) {
      const remainingText = splitSentences(trimmedText).slice(outcome.failedChunkIndex).join('');
      await speakWithBrowser(gen, ownerId, remainingText, lang);
    }
  };

  const subscribe = (listener: (state: TtsPlaybackState) => void) => {
    listeners.add(listener);
    listener(state);

    return () => {
      listeners.delete(listener);
    };
  };

  return {
    speak,
    stop,
    subscribe,
  };
}

async function sendSynthesizeRequest(payload: TtsSynthesizeRequestPayload): Promise<TtsSynthesizeResponse> {
  const response = await browser.runtime.sendMessage({
    kind: TTS_SYNTHESIZE_KIND,
    payload,
  });

  return response as TtsSynthesizeResponse;
}
