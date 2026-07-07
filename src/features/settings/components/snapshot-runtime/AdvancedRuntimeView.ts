import type { SettingsViewModel } from '../../viewmodels/SettingsViewModel';

export type AdvancedRuntimeViewRefs = {
  requestTimeoutValue: HTMLElement;
  firstChunkTimeoutValue: HTMLElement;
  fallbackChain: HTMLElement;
};

export class AdvancedRuntimeView {
  constructor(
    private readonly viewModel: SettingsViewModel,
    private readonly refs: AdvancedRuntimeViewRefs,
  ) {}

  renderRequestTimeoutValue(value: number) {
    this.refs.requestTimeoutValue.textContent = `${value.toLocaleString()} ms`;
  }

  renderFirstChunkTimeoutValue(value: number) {
    this.refs.firstChunkTimeoutValue.textContent = `${value.toLocaleString()} ms`;
  }

  renderFallbackChain() {
    this.refs.fallbackChain.innerHTML = this.viewModel.snapshotRuntime.advancedFallbackChain.value
      .map((providerLabel, index) => `<span class="token">${index + 1} · ${providerLabel}</span>`)
      .join('');
  }
}