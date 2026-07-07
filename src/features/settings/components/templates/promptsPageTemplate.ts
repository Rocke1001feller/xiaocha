export const PROMPTS_PAGE_TEMPLATE = `
  <section class="page" id="page-prompts">
    <header class="page-header">
      <div>
        <h1 class="page-title" data-copy="navPrompts"></h1>
        <p class="page-subtitle" data-copy="promptsNote"></p>
      </div>
      <div class="page-meta" data-copy="promptsMeta"></div>
    </header>

    <div class="page-stack">
      <section class="section-card">
        <div class="section-heading">
          <span class="accent-bar"></span>
          <h3 data-copy="promptsTitle"></h3>
        </div>
        <p class="section-note" data-copy="promptsNote"></p>

        <div class="editor-layout">
          <div class="collection-pane">
            <div class="collection-toolbar">
              <div class="search-shell">
                <span class="material-symbols-outlined">search</span>
                <input id="task-search" type="text" data-copy-placeholder="promptSearchPlaceholder" />
              </div>
              <div class="collection-actions">
                <button class="pill-button" id="task-add-button" type="button" disabled data-copy="addTask"></button>
              </div>
            </div>
            <div class="data-list" id="task-list"></div>
          </div>

          <article class="editor-card">
            <div class="editor-header">
              <div>
                <h2 class="editor-title" id="task-editor-title"></h2>
                <p class="editor-subtitle" id="task-editor-subtitle"></p>
              </div>
              <span class="mini-token" id="task-editor-mode"></span>
            </div>

            <section class="editor-section">
              <h3 class="editor-section-title" data-copy="taskMeta"></h3>
              <div class="field-grid">
                <div class="input-shell">
                  <label data-copy="fieldLabelTaskLabel"></label>
                  <input id="task-label" type="text" />
                </div>
                <div class="input-shell">
                  <label data-copy="fieldLabelMode"></label>
                  <select id="task-mode">
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </div>
              </div>
            </section>

            <section class="editor-section">
              <h3 class="editor-section-title" data-copy="taskProviderChain"></h3>
              <div class="task-chain-stack">
                <div>
                  <p class="editor-subtitle" id="task-selected-providers-label"></p>
                  <div class="task-chain-order" id="task-provider-order"></div>
                </div>

                <div>
                  <p class="editor-subtitle" id="task-provider-options-label"></p>
                  <div class="task-attachment-grid task-provider-picker" id="task-provider-options"></div>
                </div>
              </div>
            </section>

            <section class="editor-section">
              <h3 class="editor-section-title" data-copy="taskTuning"></h3>
              <div class="task-provider-tuning-grid" id="task-provider-tuning"></div>
            </section>

            <section class="editor-section">
              <h3 class="editor-section-title" data-copy="taskPromptVariables"></h3>
              <div class="token-row">
                <span class="token">{{lang}}</span>
                <span class="token">{{text}}</span>
                <span class="token">{{context}}</span>
              </div>
            </section>

            <section class="editor-section">
              <h3 class="editor-section-title" data-copy="taskPromptBodies"></h3>
              <div class="field-grid single">
                <div class="input-shell">
                  <label data-copy="fieldLabelSystemPrompt"></label>
                  <textarea id="task-system-prompt"></textarea>
                </div>
                <div class="input-shell">
                  <label data-copy="fieldLabelUserPrompt"></label>
                  <textarea id="task-user-prompt"></textarea>
                </div>
              </div>
            </section>

            <div class="editor-feedback" id="task-feedback" hidden></div>

            <section class="editor-section">
              <div class="task-dry-run-header">
                <h3 class="editor-section-title" id="task-dry-run-title"></h3>
                <div class="task-dry-run-meta">
                  <span class="mini-token" id="task-dry-run-status"></span>
                  <span class="mini-token" id="task-dry-run-provider"></span>
                </div>
              </div>

              <div class="field-grid single task-dry-run-grid">
                <div class="input-shell">
                  <label id="task-dry-run-sample-label"></label>
                  <textarea id="task-dry-run-sample" readonly></textarea>
                </div>
                <div class="input-shell">
                  <label id="task-dry-run-context-label"></label>
                  <textarea id="task-dry-run-context" readonly></textarea>
                </div>
                <div class="input-shell">
                  <label id="task-dry-run-output-label"></label>
                  <textarea id="task-dry-run-output" readonly></textarea>
                </div>
                <div class="input-shell" id="task-dry-run-reasoning-shell">
                  <label id="task-dry-run-reasoning-label"></label>
                  <textarea id="task-dry-run-reasoning" readonly></textarea>
                </div>
              </div>
            </section>

            <div class="editor-actions">
              <div class="action-group">
                <button class="pill-button" id="task-reset-button" type="button"></button>
                <button class="pill-button" id="task-dry-run-button" type="button" disabled data-copy="dryRun"></button>
              </div>
              <div class="action-group">
                <button class="pill-button" id="task-save-button" type="button"></button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
`;