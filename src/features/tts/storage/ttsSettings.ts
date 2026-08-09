import { storage } from '#imports';

import { TTS_SETTINGS_FALLBACK, type TtsSettingsV1 } from '../events/TtsEvents';

export const ttsSettingsStorage = storage.defineItem<TtsSettingsV1>(
  'local:tts-settings',
  {
    fallback: TTS_SETTINGS_FALLBACK,
    version: 1,
  },
);
