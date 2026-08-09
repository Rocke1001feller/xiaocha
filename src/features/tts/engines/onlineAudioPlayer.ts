/**
 * Content-side player for audio synthesized in the background. Base64 chunks
 * arrive in order and are played back-to-back; playback starts as soon as the
 * first chunk lands so the rest can stream in while the user listens.
 *
 * Playback uses Web Audio (decodeAudioData + AudioBufferSourceNode) rather
 * than HTMLAudioElement + blob: URLs on purpose: media elements are subject
 * to the host page's CSP `media-src`, which blocks blob: URLs on strict sites
 * (e.g. github.com), whereas decoding in-memory bytes is not a resource load
 * and bypasses page CSP entirely.
 */
export class OnlineAudioPlayer {
  private readonly pendingChunks: ArrayBuffer[] = [];
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private onQueueDrained: (() => void) | null = null;
  private stopped = false;
  private advancing = false;

  isIdle(): boolean {
    return this.currentSource === null && !this.advancing && this.pendingChunks.length === 0;
  }

  setOnQueueDrained(callback: (() => void) | null): void {
    this.onQueueDrained = callback;
  }

  enqueueBase64(audioBase64: string, _mimeType: string): void {
    this.stopped = false;
    this.pendingChunks.push(base64ToBytes(audioBase64).buffer as ArrayBuffer);
    void this.playNextIfIdle();
  }

  stop(): void {
    this.stopped = true;
    this.onQueueDrained = null;
    this.pendingChunks.length = 0;

    if (this.currentSource) {
      this.currentSource.onended = null;
      try {
        this.currentSource.stop();
      } catch {
        // stop() throws if the source never started; nothing to halt then.
      }
      this.currentSource.disconnect();
      this.currentSource = null;
    }
  }

  private ensureAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Playback is always triggered from a click, so resume() has user
    // activation; it is a no-op when the context is already running.
    void this.audioContext.resume();
    return this.audioContext;
  }

  private async playNextIfIdle(): Promise<void> {
    if (this.stopped || this.currentSource || this.advancing) {
      return;
    }

    const chunk = this.pendingChunks.shift();
    if (!chunk) {
      this.onQueueDrained?.();
      return;
    }

    this.advancing = true;
    try {
      const context = this.ensureAudioContext();
      const buffer = await context.decodeAudioData(chunk);
      if (this.stopped) {
        return;
      }

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      this.currentSource = source;
      source.onended = () => {
        if (this.currentSource !== source) {
          return;
        }

        this.currentSource = null;
        source.disconnect();
        void this.playNextIfIdle();
      };
      source.start();
    } catch {
      // Undecodable chunk: skip it and continue with the rest of the queue.
    } finally {
      this.advancing = false;
    }

    if (!this.currentSource) {
      void this.playNextIfIdle();
    }
  }
}

export function base64ToBytes(audioBase64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(audioBase64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
