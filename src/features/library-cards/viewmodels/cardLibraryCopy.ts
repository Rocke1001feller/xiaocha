import type { ResolvedUiDisplayLanguage } from '../../../shared/ui-language';
import { getUiCopy } from '../../../shared/ui-language';

export type CardLibraryCopy = {
  cardSaved: string;
  cardSaveFailed: string;
  cardDeleted: string;
  cardDeleteFailed: string;
  coverRefreshed: string;
  coverRefreshFailed: string;
  cardDiscardSelect: string;
  cardDiscardDelete: string;
  saveCard: string;
  deleteCard: string;
  regenerateCover: string;
  cardEmptyState: string;
  cardSectionTitle: string;
  cardTagFilterAll: string;
  cardClearFilters: string;
  cardResultsSummary: string;
  cardResultsActiveFilters: string;
  cardEdit: string;
  cardOpen: string;
  cardPin: string;
  cardUnpin: string;
  cardDelete: string;
  cardInlineEditTitle: string;
  cardInlineEditCancel: string;
  cardInlineEditSave: string;
  cardEmptyGallery: string;
  cardEmptyTable: string;
  cardCoverAlt: string;
  cardTableHeaderCard: string;
  cardTableHeaderTags: string;
  cardTableHeaderActions: string;
  categoryLabels: Record<
    'word' | 'phrase' | 'term' | 'concept' | 'sentence' | 'general',
    string
  >;
};

export function getCardLibraryCopy(language: ResolvedUiDisplayLanguage): CardLibraryCopy {
  const copy = getUiCopy(language).settings;

  return {
    cardSaved: copy.cardSaved,
    cardSaveFailed: copy.cardSaveFailed,
    cardDeleted: copy.cardDeleted,
    cardDeleteFailed: copy.cardDeleteFailed,
    coverRefreshed: copy.coverRefreshed,
    coverRefreshFailed: copy.coverRefreshFailed,
    cardDiscardSelect: copy.cardDiscardSelect,
    cardDiscardDelete: copy.cardDiscardDelete,
    saveCard: copy.saveCard,
    deleteCard: copy.deleteCard,
    regenerateCover: copy.regenerateCover,
    cardEmptyState: copy.cardEmptyState,
    cardSectionTitle: copy.cardSectionTitle,
    cardTagFilterAll: copy.cardTagFilterAll,
    cardClearFilters: copy.cardClearFilters,
    cardResultsSummary: copy.cardResultsSummary,
    cardResultsActiveFilters: copy.cardResultsActiveFilters,
    cardEdit: copy.cardEdit,
    cardOpen: copy.cardOpen,
    cardPin: copy.cardPin,
    cardUnpin: copy.cardUnpin,
    cardDelete: copy.cardDelete,
    cardInlineEditTitle: copy.cardInlineEditTitle,
    cardInlineEditCancel: copy.cardInlineEditCancel,
    cardInlineEditSave: copy.cardInlineEditSave,
    cardEmptyGallery: copy.cardEmptyGallery,
    cardEmptyTable: copy.cardEmptyTable,
    cardCoverAlt: copy.cardCoverAlt,
    cardTableHeaderCard: copy.cardTableHeaderCard,
    cardTableHeaderTags: copy.cardTableHeaderTags,
    cardTableHeaderActions: copy.cardTableHeaderActions,
    categoryLabels: {
      word: copy.cardCategoryWord,
      phrase: copy.cardCategoryPhrase,
      term: copy.cardCategoryTerm,
      concept: copy.cardCategoryConcept,
      sentence: copy.cardCategorySentence,
      general: copy.cardCategoryGeneral,
    },
  };
}
