import { describe, expect, it } from 'vitest';

import { splitSentences, TTS_MAX_CHUNK_LENGTH } from '../../src/features/tts/utils/splitSentences';

describe('splitSentences', () => {
  it('returns an empty list for blank text', () => {
    expect(splitSentences('')).toEqual([]);
    expect(splitSentences('   \n  ')).toEqual([]);
  });

  it('keeps short mixed Chinese and English sentences together', () => {
    expect(splitSentences('你好。Hello world! 今天天气不错？')).toEqual(['你好。Hello world! 今天天气不错？']);
  });

  it('splits on Chinese and English sentence punctuation and newlines', () => {
    const text = `${'一'.repeat(120)}。${'二'.repeat(120)}。`;
    const chunks = splitSentences(text);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe(`${'一'.repeat(120)}。`);
    expect(chunks[1]).toBe(`${'二'.repeat(120)}。`);
  });

  it('hard-cuts an overlong sentence at the chunk limit when no soft break exists', () => {
    const chunks = splitSentences('a'.repeat(450));

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(TTS_MAX_CHUNK_LENGTH);
    expect(chunks[1]).toHaveLength(TTS_MAX_CHUNK_LENGTH);
    expect(chunks[2]).toHaveLength(50);
  });

  it('prefers cutting an overlong sentence at the last comma before the limit', () => {
    const sentence = `${'x'.repeat(150)},${'y'.repeat(100)}`;
    const chunks = splitSentences(sentence);

    expect(chunks[0]).toBe(`${'x'.repeat(150)},`);
    expect(chunks[1]).toBe('y'.repeat(100));
  });

  it('prefers cutting an overlong sentence at the last space before the limit', () => {
    const sentence = `${'word '.repeat(60)}tail`;
    const chunks = splitSentences(sentence);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(TTS_MAX_CHUNK_LENGTH);
    }
    expect(chunks.join(' ').replaceAll(/\s+/g, ' ')).toContain('tail');
  });

  it('never emits a chunk longer than the limit for dense punctuation text', () => {
    const text = Array.from({ length: 40 }, (_, index) => `第${index}句${'字'.repeat(30)}。`).join('');
    const chunks = splitSentences(text);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(TTS_MAX_CHUNK_LENGTH);
    }
    expect(chunks.join('')).toBe(text);
  });
});
