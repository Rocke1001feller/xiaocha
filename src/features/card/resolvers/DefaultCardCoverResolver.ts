import type { CreateCardInput, SavedCard, CardCover, CardCategory } from '../types';
import type { ICardCoverResolver } from '../interfaces/ICardCoverResolver';

const CATEGORY_PALETTES: Record<CardCategory, readonly [string, string]> = {
  word: ['#6366f1', '#8b5cf6'],
  phrase: ['#0ea5e9', '#22d3ee'],
  term: ['#10b981', '#34d399'],
  concept: ['#f59e0b', '#fbbf24'],
  sentence: ['#ec4899', '#f472b6'],
  general: ['#64748b', '#94a3b8'],
};

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '?';
  const parts = cleaned.split(' ');
  if (parts.length === 1) {
    return cleaned.slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export class DefaultCardCoverResolver implements ICardCoverResolver {
  resolve(card: SavedCard | CreateCardInput): Promise<CardCover> {
    const category = ('category' in card ? card.category : 'general') ?? 'general';
    const title = ('title' in card ? card.title : card.source.selectionText) || 'Card';
    const palette = CATEGORY_PALETTES[category] ?? CATEGORY_PALETTES.general;
    const seed = hashString(title);
    const angle = 135 + (seed % 90);
    const initials = getInitials(title);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle} 150 150)">
      <stop offset="0%" stop-color="${palette[0]}"/>
      <stop offset="100%" stop-color="${palette[1]}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" rx="28" fill="url(#g)"/>
  <text x="150" y="170" font-family="system-ui, sans-serif" font-size="72" font-weight="800" fill="white" text-anchor="middle" opacity="0.95">${initials}</text>
</svg>`;

    const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

    return Promise.resolve({
      type: 'generated-svg',
      uri,
      alt: `${title} cover`,
      generatedAt: Date.now(),
    });
  }
}
