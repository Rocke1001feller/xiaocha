export const LIBRARY_CARDS_PAGE_TEMPLATE = `
  <div class="library-page">
    <header class="library-header">
      <div class="library-brand">
        <div class="library-logo">
          <img src="/icon/display-96.png" alt="" />
        </div>
        <span class="library-name">小猹</span>
      </div>
      <div class="library-header-actions">
        <button class="library-settings" type="button" data-action="open-settings" title="Settings">
          <span class="material-symbols-outlined">tune</span>
        </button>
      </div>
    </header>

    <section class="library-hero" aria-labelledby="library-title">
      <h1 id="library-title" class="library-title" data-copy="navCards"></h1>
      <p class="library-subtitle" data-copy="cardsNote"></p>
    </section>

    <section class="library-gallery" aria-label="Card gallery">
      <div class="cards-wrapper">
        <ul class="cards" id="cards-gallery-list"></ul>
      </div>
    </section>

    <section class="library-controls">
      <div class="search-block">
        <label class="visually-hidden" for="card-search">Search cards</label>
        <div class="search-shell">
          <span class="material-symbols-outlined">search</span>
          <input id="card-search" type="text" data-copy-placeholder="cardSearchPlaceholder" />
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-select">
          <select id="card-category-filter" aria-label="Category"></select>
          <span class="material-symbols-outlined">expand_more</span>
        </div>

        <div class="filter-select">
          <select id="card-tag-filter" aria-label="Tag"></select>
          <span class="material-symbols-outlined">expand_more</span>
        </div>

        <div class="filter-select">
          <select id="card-pinned-filter" aria-label="Pin status"></select>
          <span class="material-symbols-outlined">expand_more</span>
        </div>

        <button id="card-clear-filters" class="clear-filters-button" type="button" data-copy="cardClearFilters"></button>
      </div>

      <div id="card-results-summary" class="results-summary"></div>

      <div class="table-card">
        <div class="table-header">
          <div data-copy="cardTableHeaderCard"></div>
          <div data-copy="cardTableHeaderTags"></div>
          <div style="text-align: right;" data-copy="cardTableHeaderActions"></div>
        </div>
        <div id="card-table-body" class="table-body"></div>
      </div>
    </section>

    <span id="nav-cards-count" class="visually-hidden"></span>
  </div>
`;
