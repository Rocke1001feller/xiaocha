// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OnlineAudioPlayer, base64ToBytes } from '../../src/features/tts/engines/onlineAudioPlayer';

class MockBufferSource {
  onended: (() => void) | null = null;
  started = false;
  stopped = false;

  connect(): void {}
  disconnect(): void {}
  start(): void {
    this.started = true;
  }
  stop(): void {
    this.stopped = true;
  }
}

class MockAudioContext {
  static instances: MockAudioContext[] = [];

  state: AudioContextState = 'running';
  readonly destination = {};
  readonly sources: MockBufferSource[] = [];
  decodedCount = 0;

  constructor() {
    MockAudioContext.instances.push(this);
  }

  async decodeAudioData(): Promise<AudioBuffer> {
    this.decodedCount += 1;
    return { duration: 1 } as AudioBuffer;
  }

  createBufferSource(): AudioBufferSourceNode {
    const source = new MockBufferSource();
    this.sources.push(source);
    return source as unknown as AudioBufferSourceNode;
  }

  async resume(): Promise<void> {
    this.state = 'running';
  }
}

const CHUNK = btoa('fake-mp3-chunk');

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('OnlineAudioPlayer', () => {
  let audioContext: MockAudioContext;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    MockAudioContext.instances = [];
    vi.stubGlobal('AudioContext', MockAudioContext);
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
  });

  function playerContext(): MockAudioContext {
    const context = MockAudioContext.instances[0];
    expect(context).toBeDefined();
    return context!;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    createObjectURLSpy.mockRestore();
  });

  it('plays audio via Web Audio instead of blob: media URLs (page CSP media-src blocks blob:)', async () => {
    const player = new OnlineAudioPlayer();
    player.enqueueBase64(CHUNK, 'audio/mpeg');
    await flushMicrotasks();

    // Regression guard for the GitHub CSP bug: blob: object URLs must never be
    // created, because page media-src directives block them in content scripts.
    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(playerContext().decodedCount).toBe(1);
    expect(playerContext().sources[0]?.started).toBe(true);
  });

  it('plays queued chunks back-to-back', async () => {
    const player = new OnlineAudioPlayer();
    player.enqueueBase64(CHUNK, 'audio/mpeg');
    player.enqueueBase64(CHUNK, 'audio/mpeg');
    await flushMicrotasks();

    expect(playerContext().sources).toHaveLength(1);
    playerContext().sources[0]!.onended?.();
    await flushMicrotasks();

    expect(playerContext().sources).toHaveLength(2);
    expect(playerContext().sources[1]?.started).toBe(true);
  });

  it('stop() halts the current source and clears the queue', async () => {
    const player = new OnlineAudioPlayer();
    player.enqueueBase64(CHUNK, 'audio/mpeg');
    player.enqueueBase64(CHUNK, 'audio/mpeg');
    await flushMicrotasks();

    player.stop();

    expect(playerContext().sources[0]?.stopped).toBe(true);
    expect(player.isIdle()).toBe(true);
  });

  it('does not start playback for chunks decoded after stop()', async () => {
    const player = new OnlineAudioPlayer();
    player.enqueueBase64(CHUNK, 'audio/mpeg');
    player.stop();
    await flushMicrotasks();

    expect(playerContext().sources.every((source) => !source.started)).toBe(true);
  });

  it('base64ToBytes decodes binary payloads', () => {
    expect(Array.from(base64ToBytes(btoa('ab')))).toEqual([97, 98]);
  });
});
