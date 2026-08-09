import type { TtsLang, TtsSynthesizeSuccessResponse } from '../events/TtsEvents';
import { splitSentences } from '../utils/splitSentences';

const GOOGLE_TRANSLATE_TTS_URL = 'https://translate.google.com/translate_tts';
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Background-side engine. translate_tts returns MP3 for a single short
 * query, so longer text is fetched per sentence chunk and concatenated.
 */
export async function synthesizeWithGoogleTranslate(
  text: string,
  lang: TtsLang,
): Promise<TtsSynthesizeSuccessResponse> {
  const chunks = splitSentences(text);
  if (chunks.length === 0) {
    throw new Error('Nothing to synthesize.');
  }

  const buffers: ArrayBuffer[] = [];
  for (const chunk of chunks) {
    buffers.push(await fetchGoogleTranslateChunk(chunk, lang));
  }

  return {
    audioBase64: arrayBufferToBase64(concatArrayBuffers(buffers)),
    mimeType: 'audio/mpeg',
  };
}

async function fetchGoogleTranslateChunk(chunk: string, lang: TtsLang): Promise<ArrayBuffer> {
  const query = new URLSearchParams({
    ie: 'UTF-8',
    client: 'tw-ob',
    tl: lang === 'zh' ? 'zh-CN' : 'en',
    q: chunk,
    total: '1',
    idx: '0',
    textlen: String(chunk.length),
  });

  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${GOOGLE_TRANSLATE_TTS_URL}?${query.toString()}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Google Translate TTS request failed with status ${response.status}.`);
    }

    return await response.arrayBuffer();
  } finally {
    globalThis.clearTimeout(timer);
  }
}

export function concatArrayBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const buffer of buffers) {
    merged.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }

  return merged.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  const sliceSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += sliceSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + sliceSize));
  }

  return btoa(binary);
}
