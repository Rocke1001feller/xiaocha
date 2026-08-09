import type { TtsLang } from '../events/TtsEvents';
import { splitSentences } from '../utils/splitSentences';

const VOICE_LOAD_TIMEOUT_MS = 1_500;
const INTERRUPTED_ERRORS = new Set(['canceled', 'interrupted']);

export type SpeechSynthesisEngineOptions = {
  /** Injectable for tests; defaults to the global speechSynthesis. */
  synthesis?: SpeechSynthesis;
};

/**
 * Content-side engine backed by the Web Speech API. Long text is queued in
 * sentence chunks so Chrome's remote-voice 15s cutoff never applies; voices
 * with localService === true are preferred to avoid remote voices entirely.
 */
export class SpeechSynthesisEngine {
  private readonly synthesis: SpeechSynthesis | null;
  private voicesCache: SpeechSynthesisVoice[] | null = null;
  private generation = 0;

  constructor(options: SpeechSynthesisEngineOptions = {}) {
    this.synthesis = options.synthesis ?? (typeof speechSynthesis === 'undefined' ? null : speechSynthesis);
  }

  isAvailable(): boolean {
    return this.synthesis !== null;
  }

  stop(): void {
    this.generation += 1;
    this.synthesis?.cancel();
  }

  async speak(text: string, lang: TtsLang, preferredVoiceName?: string): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Browser speech synthesis is not available.');
    }

    this.stop();
    const generation = this.generation;
    const chunks = splitSentences(text);
    const voice = await this.resolveVoice(lang, preferredVoiceName);

    for (const chunk of chunks) {
      if (generation !== this.generation) {
        return;
      }

      const completed = await this.speakChunk(chunk, lang, voice ?? undefined);
      if (!completed || generation !== this.generation) {
        return;
      }
    }
  }

  private speakChunk(chunk: string, lang: TtsLang, voice?: SpeechSynthesisVoice): Promise<boolean> {
    const synthesis = this.synthesis!;
    const generation = this.generation;

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve(generation === this.generation);
      utterance.onerror = (event) => {
        if (INTERRUPTED_ERRORS.has(event.error)) {
          resolve(false);
          return;
        }

        // Skip a broken chunk instead of stalling the whole queue.
        resolve(generation === this.generation);
      };

      synthesis.speak(utterance);
    });
  }

  private async resolveVoice(lang: TtsLang, preferredVoiceName?: string): Promise<SpeechSynthesisVoice | null> {
    const voices = await this.loadVoices();
    if (voices.length === 0) {
      return null;
    }

    if (preferredVoiceName) {
      const preferred = voices.find((voice) => voice.name === preferredVoiceName);
      if (preferred) {
        return preferred;
      }
    }

    const langPrefix = lang === 'zh' ? 'zh' : 'en';
    const matching = voices.filter((voice) => voice.lang.toLowerCase().startsWith(langPrefix));
    return matching.find((voice) => voice.localService) ?? matching[0] ?? null;
  }

  private loadVoices(): Promise<SpeechSynthesisVoice[]> {
    if (this.voicesCache) {
      return Promise.resolve(this.voicesCache);
    }

    const synthesis = this.synthesis!;
    const cached = synthesis.getVoices();
    if (cached.length > 0) {
      this.voicesCache = cached;
      return Promise.resolve(cached);
    }

    return new Promise((resolve) => {
      const finish = (voices: SpeechSynthesisVoice[]) => {
        globalThis.clearTimeout(timer);
        synthesis.removeEventListener('voiceschanged', onVoicesChanged);
        this.voicesCache = voices;
        resolve(voices);
      };

      const onVoicesChanged = () => {
        finish(synthesis.getVoices());
      };

      const timer = globalThis.setTimeout(() => {
        finish(synthesis.getVoices());
      }, VOICE_LOAD_TIMEOUT_MS);

      synthesis.addEventListener('voiceschanged', onVoicesChanged);
    });
  }
}
