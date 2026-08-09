export type TtsSourceDraft = {
  voiceZh: string;
  voiceEn: string;
  azureApiKey: string;
  azureRegion: string;
  azureVoiceZh: string;
  azureVoiceEn: string;
};

export type TtsSourcesFeedback = {
  tone: 'error' | 'info' | 'success';
  text: string;
} | null;

export const EMPTY_TTS_SOURCE_DRAFT: TtsSourceDraft = {
  voiceZh: '',
  voiceEn: '',
  azureApiKey: '',
  azureRegion: '',
  azureVoiceZh: '',
  azureVoiceEn: '',
};

export function cloneTtsSourceDraft(draft: TtsSourceDraft): TtsSourceDraft {
  return {
    ...draft,
  };
}

export function areTtsSourceDraftsEqual(left: TtsSourceDraft, right: TtsSourceDraft): boolean {
  return (
    left.voiceZh === right.voiceZh &&
    left.voiceEn === right.voiceEn &&
    left.azureApiKey === right.azureApiKey &&
    left.azureRegion === right.azureRegion &&
    left.azureVoiceZh === right.azureVoiceZh &&
    left.azureVoiceEn === right.azureVoiceEn
  );
}
