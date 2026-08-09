export const TTS_MAX_CHUNK_LENGTH = 200;

const SENTENCE_PATTERN = /[^。！？.!?\n]+[。！？.!?\n]*/g;
const SOFT_BREAK_PATTERN = /[,，、;；:\s]/g;

/**
 * Splits text into speakable chunks bounded by TTS_MAX_CHUNK_LENGTH.
 * Sentences stay whole when possible; oversized sentences are hard-cut at
 * the last comma/space before the limit, or exactly at the limit.
 */
export function splitSentences(text: string, maxLength: number = TTS_MAX_CHUNK_LENGTH): string[] {
  const sentences = text.match(SENTENCE_PATTERN) ?? [];
  const chunks: string[] = [];
  let current = '';

  const flushCurrent = () => {
    const trimmed = current.trim();
    if (trimmed) {
      chunks.push(trimmed);
    }
    current = '';
  };

  for (const sentence of sentences) {
    if (!sentence.trim()) {
      continue;
    }

    if (sentence.length > maxLength) {
      flushCurrent();
      chunks.push(...hardSplitSentence(sentence, maxLength));
      continue;
    }

    if (current.length + sentence.length > maxLength) {
      flushCurrent();
    }

    current += sentence;
  }

  flushCurrent();
  return chunks;
}

function hardSplitSentence(sentence: string, maxLength: number): string[] {
  const parts: string[] = [];
  let remaining = sentence;

  while (remaining.length > maxLength) {
    const window = remaining.slice(0, maxLength + 1);
    const cutAt = findSoftBreakIndex(window, maxLength);
    parts.push(remaining.slice(0, cutAt).trim());
    remaining = remaining.slice(cutAt);
  }

  const tail = remaining.trim();
  if (tail) {
    parts.push(tail);
  }

  return parts.filter((part) => part.length > 0);
}

function findSoftBreakIndex(window: string, maxLength: number): number {
  SOFT_BREAK_PATTERN.lastIndex = 0;

  let breakIndex = -1;
  let match: RegExpExecArray | null;
  while ((match = SOFT_BREAK_PATTERN.exec(window)) !== null && match.index < maxLength) {
    breakIndex = match.index + 1;
  }

  return breakIndex > 0 ? breakIndex : maxLength;
}
