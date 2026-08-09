import {
  isTtsSynthesizeSuccessResponse,
  TTS_SYNTHESIZE_KIND,
  type TtsSynthesizeRequestMessage,
  type TtsSynthesizeResponse,
} from '../../../tts/events/TtsEvents';
import { OnlineAudioPlayer } from '../../../tts/engines/onlineAudioPlayer';
import { SpeechSynthesisEngine } from '../../../tts/engines/speechSynthesisEngine';
import type { TtsPreviewRequest } from '../../viewmodels/tts-sources/TtsSourcesController';

export type TtsVoiceOption = {
  name: string;
  lang: string;
  local: boolean;
};

export type TtsPreviewRuntime = {
  preview: (request: TtsPreviewRequest) => Promise<void>;
  listVoices: () => TtsVoiceOption[];
  watchVoices: (callback: () => void) => () => void;
  stop: () => void;
};

type TtsPreviewRuntimeDeps = {
  speechEngine?: Pick<SpeechSynthesisEngine, 'isAvailable' | 'speak' | 'stop'>;
  player?: OnlineAudioPlayer;
  sendMessage?: (message: TtsSynthesizeRequestMessage) => Promise<TtsSynthesizeResponse>;
};

/**
 * Options-page preview runtime. Browser speech is spoken directly; online
 * sources go through the background's `tts-synthesize` message and the
 * returned MP3 is played from a Blob URL.
 */
export function createTtsPreviewRuntime(deps: TtsPreviewRuntimeDeps = {}): TtsPreviewRuntime {
  const speechEngine = deps.speechEngine ?? new SpeechSynthesisEngine();
  const player = deps.player ?? new OnlineAudioPlayer();
  const sendMessage = deps.sendMessage ?? defaultSendMessage;

  return {
    async preview(request) {
      const useBrowserSpeech =
        request.sourceId === 'browser-speech' ||
        (request.sourceId === 'auto' && typeof navigator !== 'undefined' && !navigator.onLine);

      if (useBrowserSpeech) {
        const voiceName = request.lang === 'zh' ? request.config.voiceZh : request.config.voiceEn;
        await speechEngine.speak(request.text, request.lang, voiceName);
        return;
      }

      const response = await sendMessage({
        kind: TTS_SYNTHESIZE_KIND,
        payload: {
          text: request.text,
          lang: request.lang,
        },
      });

      if (!isTtsSynthesizeSuccessResponse(response)) {
        throw new Error(response?.error || 'The TTS synthesis request failed.');
      }

      player.enqueueBase64(response.audioBase64, response.mimeType);
    },

    listVoices() {
      if (typeof speechSynthesis === 'undefined') {
        return [];
      }

      return speechSynthesis.getVoices().map((voice) => ({
        name: voice.name,
        lang: voice.lang,
        local: voice.localService,
      }));
    },

    watchVoices(callback) {
      if (typeof speechSynthesis === 'undefined') {
        return () => {};
      }

      speechSynthesis.addEventListener('voiceschanged', callback);
      return () => {
        speechSynthesis.removeEventListener('voiceschanged', callback);
      };
    },

    stop() {
      speechEngine.stop();
      player.stop();
    },
  };
}

function defaultSendMessage(message: TtsSynthesizeRequestMessage): Promise<TtsSynthesizeResponse> {
  return browser.runtime.sendMessage(message) as Promise<TtsSynthesizeResponse>;
}
