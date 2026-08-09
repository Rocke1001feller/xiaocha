export { createTtsService, type TtsService, type TtsServiceDeps } from './services/TtsService';
export { TtsRegistryService } from './services/TtsRegistryService';
export {
  DEFAULT_TTS_SOURCE_ID,
  SYSTEM_TTS_SOURCES,
  TTS_SOURCE_IDS,
  type SystemTtsSourceDefinition,
  type TtsLang,
  type TtsPlaybackState,
  type TtsPlaybackStatus,
  type TtsSettingsV1,
  type TtsSourceConfig,
  type TtsSourceId,
} from './events/TtsEvents';
