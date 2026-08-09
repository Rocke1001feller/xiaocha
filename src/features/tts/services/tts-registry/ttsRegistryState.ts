import type { TtsSecretsV1, TtsSettingsV1 } from '../../events/TtsEvents';
import { ttsSecretsStorage } from '../../storage/ttsSecrets';
import { ttsSettingsStorage } from '../../storage/ttsSettings';

export type TtsStorageState = {
  settings: TtsSettingsV1;
  secrets: TtsSecretsV1;
};

export async function loadTtsStorageState(): Promise<TtsStorageState> {
  const [settings, secrets] = await Promise.all([
    ttsSettingsStorage.getValue(),
    ttsSecretsStorage.getValue(),
  ]);

  return {
    settings,
    secrets,
  };
}

export async function persistTtsSettings(settings: TtsSettingsV1): Promise<void> {
  await ttsSettingsStorage.setValue(settings);
}

export async function persistTtsSecrets(secrets: TtsSecretsV1): Promise<void> {
  await ttsSecretsStorage.setValue(secrets);
}

export function watchTtsStorageState(callback: () => void): () => void {
  const unwatchSettings = ttsSettingsStorage.watch(callback);
  const unwatchSecrets = ttsSecretsStorage.watch(callback);

  return () => {
    unwatchSettings();
    unwatchSecrets();
  };
}
