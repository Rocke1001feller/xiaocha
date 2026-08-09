export const ADVANCED_PAGE_TEMPLATE = `
  <section class="page" id="page-advanced">
    <header class="page-header">
      <div>
        <h1 class="page-title" data-copy="navAdvanced"></h1>
        <p class="page-subtitle" data-copy="executionSnapshotNote"></p>
      </div>
      <div class="page-meta" data-copy="advancedMeta"></div>
    </header>

    <div class="page-stack">
      <section class="section-card">
        <div class="section-heading">
          <span class="accent-bar"></span>
          <h3 data-copy="advancedTitle"></h3>
        </div>

        <div class="settings-grid">
          <div class="setting-row">
            <div class="setting-copy">
              <label data-copy="requestTimeoutLabel"></label>
              <p data-copy="requestTimeoutDescription"></p>
            </div>
            <div class="token" id="request-timeout-value"></div>
          </div>

          <div class="divider"></div>

          <div class="setting-row">
            <div class="setting-copy">
              <label data-copy="firstChunkTimeoutLabel"></label>
              <p data-copy="firstChunkTimeoutDescription"></p>
            </div>
            <div class="token" id="first-chunk-timeout-value"></div>
          </div>
        </div>
      </section>

      <section class="section-card">
        <div class="section-heading">
          <span class="accent-bar"></span>
          <h3 data-copy="executionSnapshotTitle"></h3>
        </div>

        <div class="settings-grid">
          <div class="setting-row spread">
            <div class="setting-copy">
              <h4 data-copy="fallbackStrategyTitle"></h4>
              <p data-copy="fallbackStrategyDescription"></p>
            </div>
            <div class="token-row" id="advanced-fallback-chain"></div>
          </div>

          <div class="divider"></div>

          <div class="setting-row spread">
            <div class="setting-copy">
              <h4 data-copy="lazyTaskTitle"></h4>
              <p data-copy="lazyTaskDescription"></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>
`;