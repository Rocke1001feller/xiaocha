import {
  isCustomProviderId,
  type CreateCustomProviderInput,
  type ProviderId,
  type TestProviderConnectionInput,
  type TestProviderConnectionResult,
  type UpdateProviderInput,
} from '../../../provider-registry/events/ProviderRegistryEvents';
import type { SettingsProviderRecord } from '../../events/SettingsEvents';
import type { ProviderEditorCopy } from './providerEditorCopy';
import type { ProviderDraft, ProviderEditorMode } from './providerEditorTypes';

export type ProviderDiscardAction = 'select' | 'create' | 'duplicate';

export type ProviderListViewState = {
  items: SettingsProviderRecord[];
  selectedProviderId: ProviderId | null;
  isCreating: boolean;
  isConnectionTestRunning: boolean;
  hasUnsavedChanges: boolean;
  discardMessages: Record<ProviderDiscardAction, string>;
};

export type ProviderEditorViewState = {
  selectedProvider: SettingsProviderRecord | null;
  draft: ProviderDraft;
  isCreating: boolean;
  hasEditorTarget: boolean;
  isBusy: boolean;
  title: string;
  subtitle: string;
  badge: string;
  idValue: string;
  apiKeyPlaceholder: string;
  idFieldLabel: string;
  apiKeyHint: string;
  utilityActionLabel: string;
  canRunUtilityAction: boolean;
  testActionLabel: string;
  canRunConnectionTest: boolean;
  dangerActionLabel: string;
  canRunDangerAction: boolean;
  primaryActionLabel: string;
  canSave: boolean;
  utilityConfirmMessage: string | null;
  dangerConfirmMessage: string | null;
};

export function getSelectedProvider(
  providers: readonly SettingsProviderRecord[],
  selectedProviderId: ProviderId | null,
): SettingsProviderRecord | null {
  return providers.find((provider) => provider.id === selectedProviderId) ?? null;
}

export function getVisibleProviders(
  providers: readonly SettingsProviderRecord[],
  query: string,
): SettingsProviderRecord[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [...providers];
  }

  return providers.filter((provider) => {
    const haystack = [provider.label, provider.endpoint, provider.model, provider.id, ...provider.tags]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function hasUnsavedProviderChanges(
  mode: ProviderEditorMode,
  isDirty: boolean,
  draft: ProviderDraft,
): boolean {
  if (isDirty) {
    return true;
  }

  return mode === 'create' && !isProviderDraftEmpty(draft);
}

export function createProviderDraftFromRecord(provider: SettingsProviderRecord): ProviderDraft {
  return {
    slug: isCustomProviderId(provider.id) ? provider.id.slice('custom:'.length) : createSuggestedSlug(provider.label),
    label: provider.label,
    endpoint: provider.endpoint,
    apiKey: '',
    model: provider.model,
  };
}

export function createDuplicateProviderDraft(
  provider: SettingsProviderRecord,
  providers: readonly SettingsProviderRecord[],
  copy: ProviderEditorCopy,
): ProviderDraft {
  return {
    ...createProviderDraftFromRecord(provider),
    slug: createUniqueCustomSlug(`${provider.label} Copy`, providers),
    label: copy.formatDuplicateLabel(provider.label),
    apiKey: '',
  };
}

export function buildCreateProviderInput(draft: ProviderDraft): CreateCustomProviderInput {
  return {
    slug: draft.slug,
    label: draft.label,
    endpoint: draft.endpoint,
    apiKey: draft.apiKey,
    model: draft.model,
  };
}

export function buildUpdateProviderInput(
  provider: SettingsProviderRecord,
  draft: ProviderDraft,
): UpdateProviderInput {
  return {
    id: provider.id,
    label: draft.label,
    endpoint: draft.endpoint,
    apiKey: draft.apiKey.trim() ? draft.apiKey : undefined,
    model: draft.model,
  };
}

export function buildTestProviderConnectionInput(
  draft: ProviderDraft,
  provider: SettingsProviderRecord | null,
  mode: ProviderEditorMode,
): TestProviderConnectionInput {
  return {
    providerId: mode === 'create' ? null : provider?.id ?? null,
    label: draft.label,
    endpoint: draft.endpoint,
    apiKey: draft.apiKey.trim() ? draft.apiKey : null,
    model: draft.model,
  };
}

export function formatProviderConnectionSuccessMessage(
  result: TestProviderConnectionResult,
  copy: ProviderEditorCopy,
): string {
  const preview = buildProviderResponsePreview(result.content || result.reasoning);

  if (!preview) {
    return copy.formatConnectionSuccessWithoutPreview(result.providerLabel);
  }

  return copy.formatConnectionSuccess(result.providerLabel, preview);
}

export function buildProviderListViewState(input: {
  providers: readonly SettingsProviderRecord[];
  selectedProviderId: ProviderId | null;
  query: string;
  mode: ProviderEditorMode;
  isDirty: boolean;
  draft: ProviderDraft;
  isConnectionTestRunning: boolean;
  copy: ProviderEditorCopy;
}): ProviderListViewState {
  return {
    items: getVisibleProviders(input.providers, input.query),
    selectedProviderId: input.selectedProviderId,
    isCreating: input.mode === 'create',
    isConnectionTestRunning: input.isConnectionTestRunning,
    hasUnsavedChanges: hasUnsavedProviderChanges(input.mode, input.isDirty, input.draft),
    discardMessages: {
      select: input.copy.formatDiscardMessage('select'),
      create: input.copy.formatDiscardMessage('create'),
      duplicate: input.copy.formatDiscardMessage('duplicate'),
    },
  };
}

export function buildProviderEditorViewState(input: {
  providers: readonly SettingsProviderRecord[];
  selectedProviderId: ProviderId | null;
  mode: ProviderEditorMode;
  draft: ProviderDraft;
  isDirty: boolean;
  isSaving: boolean;
  isConnectionTestRunning: boolean;
  copy: ProviderEditorCopy;
  testActionLabel: string;
}): ProviderEditorViewState {
  const selectedProvider = getSelectedProvider(input.providers, input.selectedProviderId);
  const isCreating = input.mode === 'create';
  const hasEditorTarget = isCreating || selectedProvider != null;
  const isBusy = input.isSaving || input.isConnectionTestRunning;
  const hasUnsavedChanges = hasUnsavedProviderChanges(input.mode, input.isDirty, input.draft);
  const canRunUtilityAction = !isBusy && (isCreating || selectedProvider != null);
  const canRunDangerAction = !isBusy && (isCreating || selectedProvider != null);
  const canRunConnectionTest = input.isConnectionTestRunning || (!input.isSaving && (isCreating || selectedProvider != null));
  const canSave = isCreating ? !isProviderDraftEmpty(input.draft) : selectedProvider != null && !isBusy;

  return {
    selectedProvider,
    draft: input.draft,
    isCreating,
    hasEditorTarget,
    isBusy,
    title: isCreating ? input.draft.label.trim() || input.copy.newProvider : selectedProvider?.label ?? '',
    subtitle: isCreating
      ? buildDraftSummary(input.draft.endpoint, input.draft.model) || input.copy.createSubtitle
      : selectedProvider?.summary ?? '',
    badge: isCreating
      ? input.copy.newProvider
      : selectedProvider?.source === 'system'
        ? input.copy.systemProvider
        : selectedProvider != null
          ? input.copy.customProvider
          : '',
    idValue: isCreating ? input.draft.slug : selectedProvider?.id ?? '',
    apiKeyPlaceholder: isCreating ? '' : selectedProvider?.apiKeyMasked ?? '',
    idFieldLabel: isCreating ? input.copy.providerSlug : input.copy.providerId,
    apiKeyHint: isCreating ? input.copy.newProviderApiKeyHint : input.copy.keepSecretApiKeyHint,
    utilityActionLabel: isCreating || selectedProvider?.source !== 'system' ? input.copy.duplicate : input.copy.reset,
    canRunUtilityAction,
    testActionLabel: input.testActionLabel,
    canRunConnectionTest,
    dangerActionLabel: isCreating
      ? input.copy.cancel
      : selectedProvider?.source === 'system'
        ? input.copy.disable
        : input.copy.delete,
    canRunDangerAction,
    primaryActionLabel: isCreating ? input.copy.createProvider : input.copy.saveChanges,
    canSave,
    utilityConfirmMessage:
      !isCreating && selectedProvider?.source === 'system'
        ? input.copy.formatResetConfirm(selectedProvider.label)
        : null,
    dangerConfirmMessage: isCreating
      ? hasUnsavedChanges
        ? input.copy.discardCurrentProviderDraft
        : null
      : selectedProvider == null
        ? null
        : selectedProvider.source === 'system'
          ? input.copy.formatSystemDisableConfirm(selectedProvider.label)
          : input.copy.formatCustomDeleteConfirm(selectedProvider.label),
  };
}

function isProviderDraftEmpty(draft: ProviderDraft): boolean {
  return (
    draft.slug.trim().length === 0 &&
    draft.label.trim().length === 0 &&
    draft.endpoint.trim().length === 0 &&
    draft.apiKey.trim().length === 0 &&
    draft.model.trim().length === 0
  );
}

function buildDraftSummary(endpoint: string, model: string): string {
  if (!model.trim()) {
    return '';
  }

  try {
    return `${new URL(endpoint).hostname} · ${model}`;
  } catch {
    return model;
  }
}

function buildProviderResponsePreview(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '';
  }

  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
}

function createSuggestedSlug(label: string): string {
  const normalizedSlug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48);

  if (normalizedSlug.length >= 3) {
    return normalizedSlug;
  }

  return 'custom-provider';
}

function createUniqueCustomSlug(
  label: string,
  providers: readonly SettingsProviderRecord[],
): string {
  const baseSlug = createSuggestedSlug(label);
  let candidate = baseSlug;
  let suffix = 2;

  while (providers.some((provider) => provider.id === `custom:${candidate}`)) {
    const suffixLabel = `-${suffix}`;
    const truncatedBase = baseSlug.slice(0, Math.max(3, 48 - suffixLabel.length));
    candidate = `${truncatedBase}${suffixLabel}`;
    suffix += 1;
  }

  return candidate;
}