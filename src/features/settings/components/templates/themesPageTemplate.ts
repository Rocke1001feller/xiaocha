export const THEMES_PAGE_TEMPLATE = `
  <section class="page" id="page-themes">
    <header class="page-header">
      <div>
        <h1 class="page-title" data-copy="navThemes"></h1>
        <p class="page-subtitle" data-copy="themesNote"></p>
      </div>
      <div class="page-meta" data-copy="themesMeta"></div>
    </header>

    <div class="page-stack">
      <section class="theme-stage">
        <div class="section-heading">
          <span class="accent-bar"></span>
          <h3 data-copy="themesTitle"></h3>
        </div>

        <div class="theme-preview-shell">
          <article class="preview-card left" id="theme-preview-left"></article>
          <article class="preview-card center" id="theme-preview-center"></article>
          <article class="preview-card right" id="theme-preview-right"></article>
        </div>

        <div class="theme-chip-grid" id="theme-grid"></div>
      </section>
    </div>
  </section>
`;