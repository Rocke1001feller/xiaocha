import { storage } from '#imports';

import { TTS_SECRETS_FALLBACK, type TtsSecretsV1 } from '../events/TtsEvents';

export const ttsSecretsStorage = storage.defineItem<TtsSecretsV1>(
  'local:tts-secrets',
  {
    fallback: TTS_SECRETS_FALLBACK,
    version: 1,
  },
);
