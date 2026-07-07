export const OVERVIEW_PAGE_TEMPLATE = `
  <section class="page is-active" id="page-overview">
    <header class="page-header">
      <div>
        <h1 class="page-title" data-copy="pageTitle"></h1>
        <p class="page-subtitle" data-copy="pageSubtitle"></p>
      </div>
      <div class="page-meta" data-copy="scopeMeta"></div>
    </header>

    <div class="page-stack">
      <section class="summary-card">
        <div class="summary-grid">
          <div class="summary-copy">
            <h2 data-copy="summaryTitle"></h2>
            <p data-copy="summaryDescription"></p>
            <div class="summary-tags">
              <span class="summary-tag"><span class="material-symbols-outlined" style="font-size:16px">language</span><span data-copy="summaryTagLanguages"></span></span>
              <span class="summary-tag"><span class="material-symbols-outlined" style="font-size:16px">cloud</span><span data-copy="summaryTagProviders"></span></span>
              <span class="summary-tag"><span class="material-symbols-outlined" style="font-size:16px">chat</span><span data-copy="summaryTagPrompts"></span></span>
              <span class="summary-tag"><span class="material-symbols-outlined" style="font-size:16px">palette</span><span data-copy="summaryTagThemes"></span></span>
              <span class="summary-tag"><span class="material-symbols-outlined" style="font-size:16px">tune</span><span data-copy="summaryTagTimeouts"></span></span>
            </div>
          </div>
          <div class="summary-metrics" id="metrics-grid"></div>
        </div>
      </section>

      <section class="section-card">
        <div class="section-heading">
          <span class="accent-bar"></span>
          <h3 data-copy="defaultsTitle"></h3>
        </div>
        <div class="settings-grid">
          <div class="setting-row">
            <div class="setting-copy">
              <label for="display-language-select" data-copy="displayLanguageLabel"></label>
              <p data-copy="displayLanguageDescription"></p>
            </div>
            <div class="select-shell">
              <select id="display-language-select" aria-label="Display language"></select>
              <span class="material-symbols-outlined">expand_more</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="setting-row">
            <div class="setting-copy">
              <label for="output-language-select" data-copy="outputLanguageLabel"></label>
              <p data-copy="outputLanguageDescription"></p>
            </div>
            <div class="select-shell">
              <select id="output-language-select" aria-label="Target language"></select>
              <span class="material-symbols-outlined">expand_more</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="setting-row spread">
            <div class="setting-copy">
              <h4 data-copy="currentThemeLabel"></h4>
              <p data-copy="currentThemeDescription"></p>
            </div>
            <div class="pill-row">
              <span class="token" id="current-theme-chip"></span>
              <button class="pill-button" id="jump-themes-button" type="button" data-copy="openThemeGallery"></button>
            </div>
          </div>
        </div>
      </section>

      <section class="support-note">
        <div class="support-block">
          <strong data-copy="supportTruthTitle"></strong>
          <p data-copy="supportTruthBody"></p>
        </div>
        <div class="support-block">
          <strong data-copy="supportBorrowingTitle"></strong>
          <p data-copy="supportBorrowingBody"></p>
        </div>
        <div class="support-block">
          <strong data-copy="supportIntegrationTitle"></strong>
          <p data-copy="supportIntegrationBody"></p>
        </div>
      </section>
    </div>
  </section>
`;