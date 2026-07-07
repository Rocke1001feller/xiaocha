import type {
  TaskChainSelectionItem,
  TaskProviderOption,
  TaskProviderTuningItem,
} from '../../viewmodels/task-editor/taskEditorTypes';

type ProviderTuningFieldLabels = {
  fieldLabelTemperature: string;
  fieldLabelTopP: string;
  fieldLabelMaxTokens: string;
};

export function renderSelectedProviders(
  container: HTMLElement,
  items: TaskChainSelectionItem[],
  isBusy: boolean,
  isChinese: boolean,
): void {
  if (items.length === 0) {
    container.innerHTML = `<div class="task-chain-empty">${isChinese ? '当前任务至少需要保留一个 Provider。' : 'Each task needs at least one provider in its fallback chain.'}</div>`;
    return;
  }

  container.innerHTML = items
    .map(
      (provider, index) => `
        <div class="task-chain-item">
          <div class="chain-pill">
            <span class="chain-index">${index + 1}</span>
            <span>${provider.label}</span>
          </div>
          <div class="task-chain-actions">
            <button class="chain-action-button" type="button" data-action="move-up" data-provider-id="${provider.id}" ${!provider.canMoveUp || isBusy ? 'disabled' : ''}>↑</button>
            <button class="chain-action-button" type="button" data-action="move-down" data-provider-id="${provider.id}" ${!provider.canMoveDown || isBusy ? 'disabled' : ''}>↓</button>
            <button class="chain-action-button" type="button" data-action="remove" data-provider-id="${provider.id}" ${isBusy ? 'disabled' : ''}>×</button>
          </div>
        </div>
      `,
    )
    .join('');
}

export function renderProviderOptions(
  container: HTMLElement,
  providerOptions: TaskProviderOption[],
  isBusy: boolean,
  isChinese: boolean,
): void {
  container.innerHTML = providerOptions
    .map(
      (provider) => `
        <label class="task-attachment-option ${provider.checked ? 'is-selected' : ''}">
          <input type="checkbox" data-provider-id="${provider.id}" ${provider.checked ? 'checked' : ''} ${provider.status !== 'active' || isBusy ? 'disabled' : ''} />
          <span>${provider.label}</span>
          <span class="mini-token">${provider.source === 'system' ? (isChinese ? 'system' : 'system') : isChinese ? 'custom' : 'custom'}</span>
        </label>
      `,
    )
    .join('');
}

export function renderProviderTuning(
  container: HTMLElement,
  items: TaskProviderTuningItem[],
  isBusy: boolean,
  isChinese: boolean,
  fieldLabels: ProviderTuningFieldLabels,
): void {
  if (items.length === 0) {
    container.innerHTML = `<div class="task-chain-empty">${isChinese ? '先在上方 Provider Chain 中保留至少一个 Provider，才能配置任务执行参数。' : 'Keep at least one provider in the chain before configuring task execution tuning.'}</div>`;
    return;
  }

  container.innerHTML = items
    .map(
      (provider, index) => `
        <article class="task-provider-tuning-card">
          <div class="task-provider-tuning-head">
            <div>
              <strong>${provider.label}</strong>
              <span>${isChinese ? '该任务在此 Provider 上的请求参数。' : 'Request tuning used when this task runs on this provider.'}</span>
            </div>
            <div class="list-tags">
              <span class="mini-token">${index + 1}</span>
              <span class="mini-token">${provider.source === 'system' ? 'system' : 'custom'}</span>
            </div>
          </div>
          <div class="field-grid three">
            <div class="input-shell">
              <label>${fieldLabels.fieldLabelTemperature}</label>
              <input type="text" data-provider-id="${provider.id}" data-param-field="temperature" value="${provider.requestParams.temperature}" ${isBusy ? 'disabled' : ''} />
            </div>
            <div class="input-shell">
              <label>${fieldLabels.fieldLabelTopP}</label>
              <input type="text" data-provider-id="${provider.id}" data-param-field="topP" value="${provider.requestParams.topP}" ${isBusy ? 'disabled' : ''} />
            </div>
            <div class="input-shell">
              <label>${fieldLabels.fieldLabelMaxTokens}</label>
              <input type="text" data-provider-id="${provider.id}" data-param-field="maxTokens" value="${provider.requestParams.maxTokens}" ${isBusy ? 'disabled' : ''} />
            </div>
          </div>
        </article>
      `,
    )
    .join('');
}
