import {
  CardLifecycleService,
  DefaultCardCoverResolver,
  DefaultCardSearchIndexResolver,
  DefaultCardTaxonomyResolver,
  ExtensionCardRepository,
} from '../../src/features/card';
import { CardLibraryController } from '../../src/features/library-cards/viewmodels/CardLibraryController';
import { getCardLibraryCopy } from '../../src/features/library-cards/viewmodels/cardLibraryCopy';
import { getUiCopy, resolveUiDisplayLanguage } from '../../src/shared/ui-language';
import { LibraryCardsPage } from '../../src/features/library-cards/components/LibraryCardsPage';

function resolvePageLanguage(): 'zh-CN' | 'en' {
  return resolveUiDisplayLanguage('system', globalThis.navigator?.language ?? 'en');
}

function createCardLibraryController(language: 'zh-CN' | 'en') {
  const repository = new ExtensionCardRepository();
  const lifecycle = new CardLifecycleService(
    repository,
    new DefaultCardTaxonomyResolver(),
    new DefaultCardCoverResolver(),
    new DefaultCardSearchIndexResolver(),
  );

  return new CardLibraryController(
    repository,
    lifecycle,
    new DefaultCardSearchIndexResolver(),
    {
      getCopy: () => getCardLibraryCopy(language),
    },
  );
}

function main() {
  const app = document.querySelector<HTMLElement>('#app');
  if (!app) {
    throw new Error('Missing #app mount node for library cards page.');
  }

  const language = resolvePageLanguage();
  const controller = createCardLibraryController(language);

  const page = new LibraryCardsPage(app, controller, {
    getCopy: () => getUiCopy(language).settings,
    onOpenSettings: () => {
      const settingsUrl = new URL('/options.html', globalThis.location.href).href;
      globalThis.open(settingsUrl, '_blank');
    },
  });

  void controller.seedSampleCardsIfEmpty();

  globalThis.addEventListener('beforeunload', () => {
    page.destroy();
    controller.dispose();
  });
}

main();
