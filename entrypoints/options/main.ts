import { SettingsView } from '../../src/features/settings/components/SettingsView';
import { createTtsPreviewRuntime } from '../../src/features/settings/components/tts-sources/ttsPreviewRuntime';
import { ExtensionSettingsRepository } from '../../src/features/settings/repositories/ExtensionSettingsRepository';
import { SettingsProviderRepository } from '../../src/features/settings/repositories/SettingsProviderRepository';
import { SettingsTaskRepository } from '../../src/features/settings/repositories/SettingsTaskRepository';
import { SettingsTtsRepository } from '../../src/features/settings/repositories/SettingsTtsRepository';
import { SettingsViewModel } from '../../src/features/settings/viewmodels/SettingsViewModel';

const app = document.querySelector<HTMLElement>('#app');

if (!app) {
  throw new Error('Missing #app mount node for options page.');
}

const settingsProviderRepository = new SettingsProviderRepository();
const settingsTaskRepository = new SettingsTaskRepository();
const settingsTtsRepository = new SettingsTtsRepository();
const viewModel = new SettingsViewModel(
  new ExtensionSettingsRepository(settingsProviderRepository, settingsTaskRepository),
  settingsProviderRepository,
  settingsTaskRepository,
  settingsTtsRepository,
  undefined,
  { ttsPreviewRuntime: createTtsPreviewRuntime() },
);
new SettingsView(app, viewModel);
void viewModel.initialize();

globalThis.addEventListener('beforeunload', () => {
  viewModel.dispose();
});
