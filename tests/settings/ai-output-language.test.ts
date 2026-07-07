import {
  DEFAULT_AI_OUTPUT_LANGUAGE_PREFERENCE,
  getAiOutputLanguageOptions,
  getAiOutputLanguagePromptLabel,
  resolveAiOutputLanguage,
} from '../../src/shared/ai-output-language';
import { describe, expect, it } from 'vitest';

describe('AI output language shared seam', () => {
  it('preserves the existing simplified Chinese default when no user preference exists', () => {
    expect(DEFAULT_AI_OUTPUT_LANGUAGE_PREFERENCE).toBe('zh-CN');
    expect(getAiOutputLanguagePromptLabel('zh-CN')).toBe('Simplified Chinese Language');
  });

  it('resolves supported system locales to the closest supported output language', () => {
    expect(resolveAiOutputLanguage('system', 'ja-JP')).toBe('ja');
    expect(resolveAiOutputLanguage('system', 'ko-KR')).toBe('ko');
    expect(resolveAiOutputLanguage('system', 'zh-HK')).toBe('zh-TW');
    expect(resolveAiOutputLanguage('system', 'zh-CN')).toBe('zh-CN');
    expect(resolveAiOutputLanguage('system', 'pt-BR')).toBe('pt');
  });

  it('falls back to English when the system locale is outside the supported set', () => {
    expect(resolveAiOutputLanguage('system', 'ru-RU')).toBe('en');
  });

  it('exposes the exact output language options promised by the design draft', () => {
    expect(getAiOutputLanguageOptions('en').map((option) => option.label)).toEqual([
      'Follow System Language',
      'English',
      '中文',
      '日本語',
      '한국어',
      '繁體中文',
      'Deutsch',
      'Italiano',
      'Português',
      'Español',
      'Français',
    ]);
  });
});