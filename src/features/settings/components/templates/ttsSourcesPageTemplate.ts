export const TTS_PAGE_TEMPLATE = `
  <section class="page" id="page-tts">
    <header class="page-header">
      <div>
        <h1 class="page-title" data-copy="navTts"></h1>
        <p class="page-subtitle" data-copy="ttsNote"></p>
      </div>
      <div class="page-meta" data-copy="ttsMeta"></div>
    </header>

    <div class="page-stack">
      <section class="section-card">
        <div class="section-heading">
          <span class="accent-bar"></span>
          <h3 data-copy="ttsSourcesTitle"></h3>
        </div>

        <div class="editor-layout">
          <div class="collection-pane">
            <div class="data-list" id="tts-source-list"></div>
          </div>

          <article class="editor-card">
            <div class="editor-header">
              <div>
                <h2 class="editor-title" id="tts-editor-title"></h2>
                <p class="editor-subtitle" id="tts-editor-subtitle"></p>
              </div>
              <span class="mini-token" id="tts-editor-badge"></span>
            </div>

            <p class="field-hint tts-config-note" id="tts-config-note"></p>

            <section class="editor-section" id="tts-browser-fields" hidden>
              <h3 class="editor-section-title" data-copy="ttsVoiceSection"></h3>
              <div class="field-grid">
                <div class="input-shell">
                  <label data-copy="ttsVoiceZhLabel"></label>
                  <select id="tts-voice-zh"></select>
                </div>
                <div class="input-shell">
                  <label data-copy="ttsVoiceEnLabel"></label>
                  <select id="tts-voice-en"></select>
                </div>
              </div>
            </section>

            <section class="editor-section" id="tts-azure-fields" hidden>
              <h3 class="editor-section-title" data-copy="ttsAzureSection"></h3>
              <div class="field-grid single">
                <div class="input-shell">
                  <label data-copy="fieldLabelApiKey"></label>
                  <input id="tts-azure-api-key" type="password" />
                  <p class="field-hint" id="tts-azure-api-key-hint"></p>
                </div>
                <div class="input-shell">
                  <label data-copy="ttsAzureRegionLabel"></label>
                  <input id="tts-azure-region" type="text" />
                </div>
              </div>
              <div class="field-grid">
                <div class="input-shell">
                  <label data-copy="ttsAzureVoiceZhLabel"></label>
                  <input id="tts-azure-voice-zh" type="text" />
                </div>
                <div class="input-shell">
                  <label data-copy="ttsAzureVoiceEnLabel"></label>
                  <input id="tts-azure-voice-en" type="text" />
                </div>
              </div>
            </section>

            <div class="editor-feedback" id="tts-feedback" hidden></div>

            <div class="editor-actions">
              <div class="action-group">
                <button class="pill-button" id="tts-set-default-button" type="button" data-copy="ttsSetDefault"></button>
                <button class="pill-button" id="tts-test-button" type="button" data-copy="testConnection" hidden></button>
              </div>
              <div class="action-group">
                <button class="pill-button" id="tts-save-button" type="button" data-copy="saveChanges"></button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
`;
