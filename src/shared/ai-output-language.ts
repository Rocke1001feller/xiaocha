import type { ResolvedUiDisplayLanguage } from './ui-language';

export type AiOutputLanguagePreference =
  | 'system'
  | 'en'
  | 'zh-CN'
  | 'ja'
  | 'ko'
  | 'zh-TW'
  | 'de'
  | 'it'
  | 'pt'
  | 'es'
  | 'fr';

export type ResolvedAiOutputLanguage = Exclude<AiOutputLanguagePreference, 'system'>;

export type AiOutputLanguageOption = {
  id: AiOutputLanguagePreference;
  label: string;
};

export const DEFAULT_AI_OUTPUT_LANGUAGE_PREFERENCE: AiOutputLanguagePreference = 'zh-CN';

const SYSTEM_OPTION_LABEL: Record<ResolvedUiDisplayLanguage, string> = {
  'zh-CN': '跟随系统语言',
  en: 'Follow System Language',
};

const AI_OUTPUT_LANGUAGE_DEFINITIONS: Record<ResolvedAiOutputLanguage, { label: string; promptLabel: string }> = {
  en: {
    label: 'English',
    promptLabel: 'English',
  },
  'zh-CN': {
    label: '中文',
    promptLabel: 'Simplified Chinese Language',
  },
  ja: {
    label: '日本語',
    promptLabel: 'Japanese',
  },
  ko: {
    label: '한국어',
    promptLabel: 'Korean',
  },
  'zh-TW': {
    label: '繁體中文',
    promptLabel: 'Traditional Chinese Language',
  },
  de: {
    label: 'Deutsch',
    promptLabel: 'German',
  },
  it: {
    label: 'Italiano',
    promptLabel: 'Italian',
  },
  pt: {
    label: 'Português',
    promptLabel: 'Portuguese',
  },
  es: {
    label: 'Español',
    promptLabel: 'Spanish',
  },
  fr: {
    label: 'Français',
    promptLabel: 'French',
  },
};

function normalizeLanguageTag(value: string) {
  return value.trim().toLowerCase();
}

export function resolveAiOutputLanguage(
  preference: AiOutputLanguagePreference,
  navigatorLanguage = 'en',
): ResolvedAiOutputLanguage {
  if (preference !== 'system') {
    return preference;
  }

  const normalized = normalizeLanguageTag(navigatorLanguage);
  if (!normalized) {
    return 'en';
  }

  if (
    normalized.startsWith('zh-tw') ||
    normalized.startsWith('zh-hk') ||
    normalized.startsWith('zh-mo')
  ) {
    return 'zh-TW';
  }

  if (normalized.startsWith('zh')) {
    return 'zh-CN';
  }

  if (normalized.startsWith('ja')) {
    return 'ja';
  }

  if (normalized.startsWith('ko')) {
    return 'ko';
  }

  if (normalized.startsWith('de')) {
    return 'de';
  }

  if (normalized.startsWith('it')) {
    return 'it';
  }

  if (normalized.startsWith('pt')) {
    return 'pt';
  }

  if (normalized.startsWith('es')) {
    return 'es';
  }

  if (normalized.startsWith('fr')) {
    return 'fr';
  }

  return 'en';
}

export function getAiOutputLanguagePromptLabel(language: ResolvedAiOutputLanguage) {
  return AI_OUTPUT_LANGUAGE_DEFINITIONS[language].promptLabel;
}

export function getResolvedAiOutputLanguagePromptLabel(
  preference: AiOutputLanguagePreference,
  navigatorLanguage = 'en',
) {
  return getAiOutputLanguagePromptLabel(resolveAiOutputLanguage(preference, navigatorLanguage));
}

export function getAiOutputLanguageOptions(
  language: ResolvedUiDisplayLanguage,
): readonly AiOutputLanguageOption[] {
  return [
    {
      id: 'system',
      label: SYSTEM_OPTION_LABEL[language],
    },
    ...Object.entries(AI_OUTPUT_LANGUAGE_DEFINITIONS).map(([id, definition]) => ({
      id: id as ResolvedAiOutputLanguage,
      label: definition.label,
    })),
  ];
}