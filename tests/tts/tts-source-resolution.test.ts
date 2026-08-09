import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  TtsPlaybackState,
  TtsSynthesizeResponse,
} from '../../src/features/tts/events/TtsEvents';
import {
  TTS_SECRETS_FALLBACK,
  TTS_SETTINGS_FALLBACK,
} from '../../src/features/tts/events/TtsEvents';
import { createTtsService, type TtsAudioPlayer } from '../../src/features/tts/services/TtsService';
import { resolveTtsSourceId } from '../../src/features/tts/services/tts-registry/ttsRegistryModel';
import { ttsSecretsStorage } from '../../src/features/tts/storage/ttsSecrets';
import { ttsSettingsStorage } from '../../src/features/tts/storage/ttsSettings';

const createFakePlayer = (): TtsAudioPlayer & { enqueued: string[] } => {
  const enqueued: string[] = [];
  return {
    enqueued,
    enqueueBase64: (audioBase64) => {
      enqueued.push(audioBase64);
    },
    stop: () => {},
    isIdle: () => true,
    setOnQueueDrained: () => {},
  };
};

const createFakeSpeechEngine = () => ({
  isAvailable: () => true,
  speak: vi.fn(async () => {}),
  stop: vi.fn(),
});

describe('resolveTtsSourceId', () => {
  it('resolves auto by network state', () => {
    expect(resolveTtsSourceId('auto', true)).toBe('google-translate');
    expect(resolveTtsSourceId('auto', false)).toBe('browser-speech');
  });

  it('keeps explicit selections regardless of network state', () => {
    expect(resolveTtsSourceId('azure-speech', true)).toBe('azure-speech');
    expect(resolveTtsSourceId('azure-speech', false)).toBe('azure-speech');
    expect(resolveTtsSourceId('browser-speech', true)).toBe('browser-speech');
  });
});

describe('createTtsService', () => {
  beforeEach(async () => {
    await ttsSettingsStorage.setValue(TTS_SETTINGS_FALLBACK);
    await ttsSecretsStorage.setValue(TTS_SECRETS_FALLBACK);
  });

  it('streams online audio through the background when auto resolves online', async () => {
    const player = createFakePlayer();
    const speechEngine = createFakeSpeechEngine();
    const requestSynthesis = vi.fn(async (): Promise<TtsSynthesizeResponse> => ({
      audioBase64: 'QUJD',
      mimeType: 'audio/mpeg',
    }));
    const service = createTtsService({
      isOnline: () => true,
      player,
      speechEngine,
      requestSynthesis,
    });
    const states: TtsPlaybackState[] = [];
    service.subscribe((state) => states.push(state));

    await service.speak('card-1', '你好。世界。', 'zh');

    expect(requestSynthesis).toHaveBeenCalledWith({ text: '你好。世界。', lang: 'zh', voice: undefined });
    expect(player.enqueued).toEqual(['QUJD']);
    expect(speechEngine.speak).not.toHaveBeenCalled();
    expect(states.map((state) => state.status)).toEqual(['idle', 'loading', 'playing', 'idle']);
    expect(states[1].ownerId).toBe('card-1');
  });

  it('uses browser speech when auto resolves offline', async () => {
    const player = createFakePlayer();
    const speechEngine = createFakeSpeechEngine();
    const requestSynthesis = vi.fn();
    const service = createTtsService({
      isOnline: () => false,
      player,
      speechEngine,
      requestSynthesis,
    });

    await service.speak('card-2', 'Hello there.', 'en');

    expect(requestSynthesis).not.toHaveBeenCalled();
    expect(speechEngine.speak).toHaveBeenCalledWith('Hello there.', 'en', undefined);
    expect(player.enqueued).toEqual([]);
  });

  it('falls back to browser speech when online synthesis fails', async () => {
    const player = createFakePlayer();
    const speechEngine = createFakeSpeechEngine();
    const requestSynthesis = vi.fn(async (): Promise<TtsSynthesizeResponse> => ({ error: 'HTTP 429' }));
    const service = createTtsService({
      isOnline: () => true,
      player,
      speechEngine,
      requestSynthesis,
    });

    await service.speak('card-3', '失败也要读出来。', 'zh');

    expect(speechEngine.speak).toHaveBeenCalledWith('失败也要读出来。', 'zh', undefined);
  });

  it('falls back to browser speech when the background request throws', async () => {
    const player = createFakePlayer();
    const speechEngine = createFakeSpeechEngine();
    const requestSynthesis = vi.fn(async (): Promise<TtsSynthesizeResponse> => {
      throw new Error('network down');
    });
    const service = createTtsService({
      isOnline: () => true,
      player,
      speechEngine,
      requestSynthesis,
    });

    await service.speak('card-4', 'Network is gone.', 'en');

    expect(speechEngine.speak).toHaveBeenCalledWith('Network is gone.', 'en', undefined);
  });

  it('stops the current playback when speak is called again', async () => {
    const player = createFakePlayer();
    const speechEngine = createFakeSpeechEngine();
    const requestSynthesis = vi.fn(async (): Promise<TtsSynthesizeResponse> => ({
      audioBase64: 'QUJD',
      mimeType: 'audio/mpeg',
    }));
    const service = createTtsService({
      isOnline: () => true,
      player,
      speechEngine,
      requestSynthesis,
    });
    const states: TtsPlaybackState[] = [];
    service.subscribe((state) => states.push(state));

    await service.speak('card-5', '第一句。', 'zh');
    service.stop();

    expect(states.map((state) => state.status)).toEqual(['idle', 'loading', 'playing', 'idle', 'idle']);
    expect(states.at(-1)?.ownerId).toBeNull();
  });

  it('falls back to browser speech when reading the selection rejects (orphaned content script)', async () => {
    const brokenRegistry = {
      getSelection: () => Promise.reject(new Error('Extension context invalidated')),
      getSourceConfig: () => Promise.reject(new Error('Extension context invalidated')),
    };
    const speechEngine = createFakeSpeechEngine();
    const service = createTtsService({
      registry: brokenRegistry as never,
      isOnline: () => false,
      player: createFakePlayer(),
      speechEngine,
      requestSynthesis: vi.fn(),
    });

    await service.speak('card-6', '上下文失效也要读。', 'zh');

    expect(speechEngine.speak).toHaveBeenCalledWith('上下文失效也要读。', 'zh', undefined);
  });

  it('falls back to browser speech when reading the selection hangs forever', async () => {
    const hangingRegistry = {
      getSelection: () => new Promise<string>(() => {}),
      getSourceConfig: () => new Promise<object>(() => {}),
    };
    const speechEngine = createFakeSpeechEngine();
    const service = createTtsService({
      registry: hangingRegistry as never,
      isOnline: () => false,
      player: createFakePlayer(),
      speechEngine,
      requestSynthesis: vi.fn(),
      settingsTimeoutMs: 10,
    });

    await service.speak('card-7', '挂起也要有兜底。', 'zh');

    expect(speechEngine.speak).toHaveBeenCalledWith('挂起也要有兜底。', 'zh', undefined);
  });
});
