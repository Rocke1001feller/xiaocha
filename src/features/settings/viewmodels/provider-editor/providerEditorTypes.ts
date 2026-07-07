export type ProviderEditorMode = 'existing' | 'create';

export type ProviderEditorFeedback = {
  tone: 'error' | 'info' | 'success';
  text: string;
} | null;

export type ProviderDraft = {
  slug: string;
  label: string;
  endpoint: string;
  apiKey: string;
  model: string;
};

export const EMPTY_PROVIDER_DRAFT: ProviderDraft = {
  slug: '',
  label: '',
  endpoint: '',
  apiKey: '',
  model: '',
};

export function cloneProviderDraft(draft: ProviderDraft): ProviderDraft {
  return {
    ...draft,
  };
}

export function areProviderDraftsEqual(left: ProviderDraft, right: ProviderDraft): boolean {
  return (
    left.slug === right.slug &&
    left.label === right.label &&
    left.endpoint === right.endpoint &&
    left.apiKey === right.apiKey &&
    left.model === right.model
  );
}