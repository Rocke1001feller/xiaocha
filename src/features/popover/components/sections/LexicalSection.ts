import type { ExplainTaskState, LexicalDefinition } from '../../../../../src/llm/types';
import { renderStaticMarkdown } from './MarkdownSection';

type LexicalSectionRenderer = {
  setLoadingVisible: (visible: boolean) => void;
  setErrorMessage?: (message: string) => void;
  setPhonetic: (value: string) => void;
  renderTranslation: (value?: string) => void;
  renderContextual: (value?: string) => void;
  renderDefinitions: (definitions: LexicalDefinition[]) => void;
};

export function renderLexicalState(state: ExplainTaskState, renderer: LexicalSectionRenderer) {
  renderer.setLoadingVisible(state.status === 'loading');
  renderer.setErrorMessage?.(state.status === 'error' ? state.errorMessage ?? 'Lexical analysis failed.' : '');
  renderer.setPhonetic(state.lexical?.phonetic ?? '');
  renderer.renderTranslation(state.lexical?.translation);
  renderer.renderContextual(state.lexical?.contextualAnalysis);
  renderer.renderDefinitions(state.lexical?.definitions ?? []);
}

export function replaceDefinitionList(
  container: HTMLUListElement,
  definitions: LexicalDefinition[],
  renderDefinition: (definition: LexicalDefinition) => HTMLLIElement,
) {
  container.replaceChildren(...definitions.map(renderDefinition));
}

export function renderDefinition(definition: LexicalDefinition) {
  const item = document.createElement('li');
  item.className = 'def-item';
  const posMeaning = document.createElement('div');
  posMeaning.className = 'pos-meaning';
  if (definition.pos) posMeaning.appendChild(Object.assign(document.createElement('span'), { className: 'pos', textContent: definition.pos }));
  const meaning = document.createElement('span');
  meaning.className = 'meaning';
  renderStaticMarkdown(meaning, definition.meaning ?? '');
  posMeaning.appendChild(meaning);
  item.appendChild(posMeaning);
  if (definition.example?.source || definition.example?.target) {
    const example = document.createElement('div');
    example.className = 'example';
    if (definition.example.source) {
      const source = document.createElement('span');
      source.className = 'src';
      renderStaticMarkdown(source, definition.example.source);
      example.appendChild(source);
    }
    if (definition.example.source && definition.example.target) {
      example.appendChild(Object.assign(document.createElement('span'), { className: 'arrow', textContent: ' → ' }));
    }
    if (definition.example.target) {
      const target = document.createElement('span');
      target.className = 'tgt';
      renderStaticMarkdown(target, definition.example.target);
      example.appendChild(target);
    }
    item.appendChild(example);
  }
  return item;
}