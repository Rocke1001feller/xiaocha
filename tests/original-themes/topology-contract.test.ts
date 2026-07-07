import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ORIGINAL_THEME_SLICE_FILES,
  ORIGINAL_THEMES_SOURCE_MANIFEST_FILE,
  ORIGINAL_THEMES_SOURCE_MANIFEST_SHA256,
  ORIGINAL_THEMES_THEME_SLICE_FILES,
} from '../../src/features/popover/styles/original-themes.generated';
import { countLines, readRuntimeOriginalThemesSliceFiles } from './helpers/oracle';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stylesRoot = path.join(repoRoot, 'src', 'features', 'popover', 'styles', 'original-themes');

describe('original themes Phase 4 manifest topology contract', () => {
  it('keeps generated artifacts synced with the source manifest', () => {
    const sourceManifest = readFileSync(path.join(repoRoot, ORIGINAL_THEMES_SOURCE_MANIFEST_FILE), 'utf8');
    const sourceManifestHash = createHash('sha256').update(sourceManifest).digest('hex');

    expect(sourceManifestHash).toBe(ORIGINAL_THEMES_SOURCE_MANIFEST_SHA256);
    expect(readRuntimeOriginalThemesSliceFiles()).toEqual([...ORIGINAL_THEME_SLICE_FILES]);
  });

  it('keeps every runtime slice under the hard 500 line budget', () => {
    const sliceFiles = readRuntimeOriginalThemesSliceFiles();

    expect(sliceFiles.length).toBeGreaterThan(0);
    for (const relativePath of sliceFiles) {
      const content = readFileSync(path.join(stylesRoot, relativePath), 'utf8');
      expect(countLines(content)).toBeLessThanOrEqual(500);
    }
  });

  it('stores theme slices only inside tokens trigger panels and effects categories', () => {
    const themeFiles = readRuntimeOriginalThemesSliceFiles().filter((file) => file.startsWith('themes/'));
    const categoriesByTheme = new Map<string, Set<string>>();

    expect(themeFiles.length).toBeGreaterThan(0);

    for (const relativePath of themeFiles) {
      const match = relativePath.match(/^themes\/([^/]+)\/(tokens|trigger|panels|effects)\/part-\d+\.css$/);
      expect(match).not.toBeNull();

      const [, theme, category] = match as RegExpMatchArray;
      if (!categoriesByTheme.has(theme)) {
        categoriesByTheme.set(theme, new Set());
      }
      categoriesByTheme.get(theme)?.add(category);
    }

    expect([...categoriesByTheme.keys()].sort()).toEqual(Object.keys(ORIGINAL_THEMES_THEME_SLICE_FILES).sort());
    for (const theme of Object.keys(ORIGINAL_THEMES_THEME_SLICE_FILES)) {
      expect([...categoriesByTheme.get(theme) ?? []].sort()).toEqual(['effects', 'panels', 'tokens', 'trigger']);
    }
  });

  it('keeps each theme on the manifest-declared slice order in order.txt', () => {
    const themeFiles = readRuntimeOriginalThemesSliceFiles().filter((file) => file.startsWith('themes/'));
    const orderByTheme = new Map<string, string[]>();

    for (const relativePath of themeFiles) {
      const match = relativePath.match(/^themes\/([^/]+)\/([^/]+)\/part-\d+\.css$/);
      expect(match).not.toBeNull();

      const [, theme] = match as RegExpMatchArray;
      if (!orderByTheme.has(theme)) {
        orderByTheme.set(theme, []);
      }
      orderByTheme.get(theme)?.push(relativePath);
    }

    for (const [theme, expectedOrder] of Object.entries(ORIGINAL_THEMES_THEME_SLICE_FILES)) {
      expect(orderByTheme.get(theme)).toEqual(expectedOrder);
    }
  });
});