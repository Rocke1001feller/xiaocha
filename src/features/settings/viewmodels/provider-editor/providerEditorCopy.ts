import type { ResolvedUiDisplayLanguage } from '../../../../shared/ui-language';

type ProviderDiscardAction = 'select' | 'create' | 'duplicate';

export type ProviderEditorCopy = {
  providerCreated: string;
  noSelectedProvider: string;
  providerSaved: string;
  systemProviderDisabled: string;
  customProviderDeleted: string;
  systemProviderReset: string;
  cancelTest: string;
  testConnection: string;
  currentProviderLabel: string;
  connectionTestCancelled: string;
  newProvider: string;
  systemProvider: string;
  customProvider: string;
  createSubtitle: string;
  duplicate: string;
  reset: string;
  cancel: string;
  disable: string;
  delete: string;
  createProvider: string;
  saveChanges: string;
  providerSlug: string;
  providerId: string;
  newProviderApiKeyHint: string;
  keepSecretApiKeyHint: string;
  discardCurrentProviderDraft: string;
  formatTestingConnection: (label: string) => string;
  formatConnectionSuccess: (providerLabel: string, preview: string) => string;
  formatConnectionSuccessWithoutPreview: (providerLabel: string) => string;
  formatDiscardMessage: (nextAction: ProviderDiscardAction) => string;
  formatSystemDisableConfirm: (providerLabel: string) => string;
  formatCustomDeleteConfirm: (providerLabel: string) => string;
  formatResetConfirm: (providerLabel: string) => string;
  formatDuplicateLabel: (providerLabel: string) => string;
};

const PROVIDER_EDITOR_COPY: Record<ResolvedUiDisplayLanguage, ProviderEditorCopy> = {
  'zh-CN': {
    providerCreated: 'Provider 已创建。',
    noSelectedProvider: '没有可保存的 Provider。',
    providerSaved: 'Provider 已保存。',
    systemProviderDisabled: '系统 Provider 已禁用。',
    customProviderDeleted: '自定义 Provider 已删除。',
    systemProviderReset: '系统 Provider 已重置为默认值。',
    cancelTest: '取消测试',
    testConnection: '测试连接',
    currentProviderLabel: '当前 Provider',
    connectionTestCancelled: '连接测试已取消。',
    newProvider: '新建 Provider',
    systemProvider: '系统 Provider',
    customProvider: '自定义 Provider',
    createSubtitle: '填写字段后即可保存到真实 Provider Registry。',
    duplicate: '复制',
    reset: '重置',
    cancel: '取消',
    disable: '禁用',
    delete: '删除',
    createProvider: '创建 Provider',
    saveChanges: '保存修改',
    providerSlug: 'Provider Slug',
    providerId: 'Provider ID',
    newProviderApiKeyHint: '新建 Provider 需要填写 API Key。',
    keepSecretApiKeyHint: '留空表示保留当前密钥。',
    discardCurrentProviderDraft: '确认放弃当前未保存的 Provider 草稿吗？',
    formatTestingConnection: (label) => `正在测试「${label}」的连接…`,
    formatConnectionSuccess: (providerLabel, preview) => `连接测试成功。「${providerLabel}」返回：${preview}`,
    formatConnectionSuccessWithoutPreview: (providerLabel) => `连接测试成功。「${providerLabel}」已返回响应。`,
    formatDiscardMessage: (nextAction) => {
      if (nextAction === 'select') {
        return '当前 Provider 编辑器里有未保存的改动，确认切换并丢弃这些改动吗？';
      }

      if (nextAction === 'duplicate') {
        return '当前 Provider 编辑器里有未保存的改动，确认开始复制并丢弃这些改动吗？';
      }

      return '当前 Provider 编辑器里有未保存的改动，确认新建并丢弃这些改动吗？';
    },
    formatSystemDisableConfirm: (providerLabel) =>
      `确认禁用系统 Provider「${providerLabel}」吗？如果它是某个任务唯一可执行的 Provider，保存会被底层校验阻止。`,
    formatCustomDeleteConfirm: (providerLabel) =>
      `确认删除自定义 Provider「${providerLabel}」吗？如果它仍然挂接在任务上，底层校验会阻止删除。`,
    formatResetConfirm: (providerLabel) => `确认把系统 Provider「${providerLabel}」重置为默认值吗？`,
    formatDuplicateLabel: (providerLabel) => `${providerLabel} 副本`,
  },
  en: {
    providerCreated: 'Provider created.',
    noSelectedProvider: 'No provider is selected.',
    providerSaved: 'Provider saved.',
    systemProviderDisabled: 'System provider disabled.',
    customProviderDeleted: 'Custom provider deleted.',
    systemProviderReset: 'System provider reset to defaults.',
    cancelTest: 'Cancel Test',
    testConnection: 'Test Connection',
    currentProviderLabel: 'Current provider',
    connectionTestCancelled: 'Connection test cancelled.',
    newProvider: 'New Provider',
    systemProvider: 'System Provider',
    customProvider: 'Custom Provider',
    createSubtitle: 'Fill in the fields to save into the live provider registry.',
    duplicate: 'Duplicate',
    reset: 'Reset',
    cancel: 'Cancel',
    disable: 'Disable',
    delete: 'Delete',
    createProvider: 'Create Provider',
    saveChanges: 'Save Changes',
    providerSlug: 'Provider Slug',
    providerId: 'Provider ID',
    newProviderApiKeyHint: 'New providers require an API key.',
    keepSecretApiKeyHint: 'Leave blank to keep the current secret.',
    discardCurrentProviderDraft: 'Discard the current unsaved provider draft?',
    formatTestingConnection: (label) => `Testing the connection for "${label}"…`,
    formatConnectionSuccess: (providerLabel, preview) => `Connection successful. "${providerLabel}" replied: ${preview}`,
    formatConnectionSuccessWithoutPreview: (providerLabel) =>
      `Connection successful. "${providerLabel}" responded successfully.`,
    formatDiscardMessage: (nextAction) => {
      if (nextAction === 'select') {
        return 'The provider editor has unsaved changes. Switch providers and discard them?';
      }

      if (nextAction === 'duplicate') {
        return 'The provider editor has unsaved changes. Start duplicating and discard them?';
      }

      return 'The provider editor has unsaved changes. Start a new provider draft and discard them?';
    },
    formatSystemDisableConfirm: (providerLabel) =>
      `Disable the system provider "${providerLabel}"? The shared validation layer will block this if it leaves a task without an executable provider.`,
    formatCustomDeleteConfirm: (providerLabel) =>
      `Delete the custom provider "${providerLabel}"? The shared validation layer will block this if it is still attached to tasks.`,
    formatResetConfirm: (providerLabel) => `Reset the system provider "${providerLabel}" to defaults?`,
    formatDuplicateLabel: (providerLabel) => `${providerLabel} Copy`,
  },
};

export function getProviderEditorCopy(
  language: ResolvedUiDisplayLanguage,
): ProviderEditorCopy {
  return PROVIDER_EDITOR_COPY[language];
}