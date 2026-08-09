import type { TtsLang, TtsSynthesizeSuccessResponse } from '../events/TtsEvents';
import { splitSentences } from '../utils/splitSentences';
import { arrayBufferToBase64, concatArrayBuffers } from './googleTranslateTts';

const REQUEST_TIMEOUT_MS = 15_000;
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';

export type AzureTtsOptions = {
  apiKey: string;
  region: string;
  voiceZh: string;
  voiceEn: string;
};

/**
 * Background-side engine for Azure Cognitive Services Speech (BYOK).
 * The subscription key only ever crosses the wire from the background.
 */
export async function synthesizeWithAzure(
  text: string,
  lang: TtsLang,
  options: AzureTtsOptions,
): Promise<TtsSynthesizeSuccessResponse> {
  const chunks = splitSentences(text);
  if (chunks.length === 0) {
    throw new Error('Nothing to synthesize.');
  }

  const voiceName = lang === 'zh' ? options.voiceZh : options.voiceEn;
  const buffers: ArrayBuffer[] = [];
  for (const chunk of chunks) {
    buffers.push(await fetchAzureChunk(chunk, lang, voiceName, options));
  }

  return {
    audioBase64: arrayBufferToBase64(concatArrayBuffers(buffers)),
    mimeType: 'audio/mpeg',
  };
}

async function fetchAzureChunk(
  chunk: string,
  lang: TtsLang,
  voiceName: string,
  options: AzureTtsOptions,
): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://${options.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': options.apiKey,
          'X-Microsoft-OutputFormat': OUTPUT_FORMAT,
          'Content-Type': 'application/ssml+xml',
        },
        body: buildSsml(chunk, lang, voiceName),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Azure TTS request failed with status ${response.status}.`);
    }

    return await response.arrayBuffer();
  } finally {
    globalThis.clearTimeout(timer);
  }
}

function buildSsml(text: string, lang: TtsLang, voiceName: string): string {
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  return (
    `<speak version="1.0" xml:lang="${locale}">` +
    `<voice xml:lang="${locale}" name="${escapeXml(voiceName)}">${escapeXml(text)}</voice>` +
    `</speak>`
  );
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
