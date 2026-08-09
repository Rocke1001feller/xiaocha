export const PROVIDERS_PAGE_TEMPLATE = `
  <section class="page" id="page-providers">
    <header class="page-header">
      <div>
        <h1 class="page-title" data-copy="navProviders"></h1>
        <p class="page-subtitle" data-copy="providersNote"></p>
      </div>
      <div class="page-meta" data-copy="providersMeta"></div>
    </header>

    <div class="page-stack">
      <section class="section-card">
        <div class="section-heading">
          <span class="accent-bar"></span>
          <h3 data-copy="providersTitle"></h3>
        </div>

        <div class="editor-layout">
          <div class="collection-pane">
            <div class="collection-toolbar">
              <div class="search-shell">
                <span class="material-symbols-outlined">search</span>
                <input id="provider-search" type="text" data-copy-placeholder="providerSearchPlaceholder" />
              </div>
              <div class="collection-actions">
                <button class="pill-button" id="provider-add-button" type="button" data-copy="addProvider"></button>
              </div>
            </div>
            <div class="data-list" id="provider-list"></div>
          </div>

          <article class="editor-card">
            <div class="editor-header">
              <div>
                <h2 class="editor-title" id="provider-editor-title"></h2>
                <p class="editor-subtitle" id="provider-editor-subtitle"></p>
              </div>
              <span class="mini-token" id="provider-editor-badge"></span>
            </div>

            <section class="editor-section">
              <h3 class="editor-section-title" data-copy="providerCoreFields"></h3>
              <div class="field-grid">
                <div class="input-shell">
                  <label data-copy="fieldLabelName"></label>
                  <input id="provider-label" type="text" />
                </div>
                <div class="input-shell">
                  <label data-copy="fieldLabelModel"></label>
                  <input id="provider-model" type="text" />
                </div>
              </div>
            </section>

            <section class="editor-section">
              <h3 class="editor-section-title" data-copy="providerConnection"></h3>
              <div class="field-grid single">
                <div class="input-shell">
                  <label data-copy="fieldLabelEndpoint"></label>
                  <input id="provider-endpoint" type="text" />
                </div>
                <div class="input-shell">
                  <label data-copy="fieldLabelApiKey"></label>
                  <input id="provider-api-key" type="password" />
                  <p class="field-hint" id="provider-api-key-hint"></p>
                </div>
              </div>
            </section>

            <section class="editor-section">
              <h3 class="editor-section-title" data-copy="providerIdentity"></h3>
              <div class="field-grid single">
                <div class="input-shell">
                  <label id="provider-id-label" data-copy="fieldLabelProviderId"></label>
                  <input id="provider-id" type="text" />
                </div>
              </div>
            </section>

            <div class="editor-feedback" id="provider-feedback" hidden></div>

            <div class="editor-actions">
              <div class="action-group">
                <button class="pill-button" id="provider-utility-button" type="button" data-copy="duplicate"></button>
                <button class="pill-button" id="provider-test-button" type="button" disabled data-copy="testConnection"></button>
              </div>
              <div class="action-group">
                <button class="pill-button" id="provider-danger-button" type="button" data-copy="deleteAction"></button>
                <button class="pill-button" id="provider-save-button" type="button" data-copy="saveChanges"></button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
`;