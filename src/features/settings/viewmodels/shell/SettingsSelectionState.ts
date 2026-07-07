import type {
  SettingsProviderRecord,
  SettingsTaskRecord,
  SettingsThemeRecord,
} from '../../events/SettingsEvents';

export type SettingsSelectionState = {
  providerId: SettingsProviderRecord['id'] | null;
  taskId: SettingsTaskRecord['id'] | null;
  themeId: SettingsThemeRecord['id'];
  providerEditorMode: 'existing' | 'create';
  taskEditorMode: 'existing' | 'create';
};