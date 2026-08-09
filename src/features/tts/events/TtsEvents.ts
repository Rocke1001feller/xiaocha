export type TtsSourceId = 'auto' | 'browser-speech' | 'google-translate' | 'azure-speech';

export type TtsLang = 'zh' | 'en';

export type SystemTtsSourceDefinition = {
  id: TtsSourceId;
  label: string;
  isOnline: boolean;
  requiresApiKey: boolean;
};

export const SYSTEM_TTS_SOURCES: Record<TtsSourceId, SystemTtsSourceDefinition> = {
  auto: {
    id: 'auto',
    label: 'Smart Default',
    isOnline: true,
    requiresApiKey: false,
  },
  'browser-speech': {
    id: 'browser-speech',
    label: 'Browser Speech',
    isOnline: false,
    requiresApiKey: false,
  },
  'google-translate': {
    id: 'google-translate',
    label: 'Google Translate',
    isOnline: true,
    requiresApiKey: false,
  },
  'azure-speech': {
    id: 'azure-speech',
    label: 'Azure Speech',
    isOnline: true,
    requiresApiKey: true,
  },
};

export const DEFAULT_TTS_SOURCE_ID: TtsSourceId = 'auto';

export const TTS_SOURCE_IDS = Object.keys(SYSTEM_TTS_SOURCES) as TtsSourceId[];

export type TtsSourceConfig = {
  voiceZh?: string;
  voiceEn?: string;
  azureRegion?: string;
  azureVoiceZh?: string;
  azureVoiceEn?: string;
};

export type TtsSettingsV1 = {
  version: 1;
  selectedSourceId: TtsSourceId;
  configs: Partial<Record<TtsSourceId, TtsSourceConfig>>;
};

export const TTS_SETTINGS_FALLBACK: TtsSettingsV1 = {
  version: 1,
  selectedSourceId: DEFAULT_TTS_SOURCE_ID,
  configs: {},
};

export type TtsSecretsV1 = {
  version: 1;
  azureApiKey?: string;
};

export const TTS_SECRETS_FALLBACK: TtsSecretsV1 = {
  version: 1,
};

export type TtsPlaybackStatus = 'idle' | 'loading' | 'playing';

export type TtsPlaybackState = {
  status: TtsPlaybackStatus;
  ownerId: string | null;
};

export const TTS_PLAYBACK_IDLE: TtsPlaybackState = {
  status: 'idle',
  ownerId: null,
};

export const TTS_SYNTHESIZE_KIND = 'tts-synthesize';

export type TtsSynthesizeRequestPayload = {
  text: string;
  lang: TtsLang;
  voice?: string;
};

export type TtsSynthesizeRequestMessage = {
  kind: typeof TTS_SYNTHESIZE_KIND;
  payload: TtsSynthesizeRequestPayload;
};

export type TtsSynthesizeSuccessResponse = {
  audioBase64: string;
  mimeType: string;
};

export type TtsSynthesizeErrorResponse = {
  error: string;
};

export type TtsSynthesizeResponse = TtsSynthesizeSuccessResponse | TtsSynthesizeErrorResponse;

export function isTtsSourceId(value: unknown): value is TtsSourceId {
  return typeof value === 'string' && value in SYSTEM_TTS_SOURCES;
}

export function isTtsSynthesizeRequestMessage(message: unknown): message is TtsSynthesizeRequestMessage {
  if (typeof message !== 'object' || message === null) {
    return false;
  }

  const candidate = message as Partial<TtsSynthesizeRequestMessage>;
  if (candidate.kind !== TTS_SYNTHESIZE_KIND) {
    return false;
  }

  const payload = candidate.payload;
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload.text === 'string' &&
    (payload.lang === 'zh' || payload.lang === 'en')
  );
}

export function isTtsSynthesizeSuccessResponse(response: unknown): response is TtsSynthesizeSuccessResponse {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const candidate = response as Partial<TtsSynthesizeSuccessResponse>;
  return typeof candidate.audioBase64 === 'string' && typeof candidate.mimeType === 'string';
}
