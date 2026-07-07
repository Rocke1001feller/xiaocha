import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  POPOVER_STYLE_THEME_SLICE_FILES,
  POPOVER_STYLES_SOURCE_ORDER_FILE,
} from '../../src/features/popover/styles/popover.generated';
import {
  countLines,
  readDeclaredSliceFiles,
  readOracleManifest,
  readRuntimePopoverSliceFiles,
} from './helpers/oracle';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stylesRoot = path.join(repoRoot, 'src', 'features', 'popover', 'styles', 'popover');

describe('popover styles topology contract', () => {
  it('keeps order.txt synced with the runtime declaration', () => {
    const declaredSliceFiles = readDeclaredSliceFiles();
    const orderLines = readFileSync(path.join(repoRoot, POPOVER_STYLES_SOURCE_ORDER_FILE), 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    expect(orderLines).toEqual(declaredSliceFiles);
    expect(readRuntimePopoverSliceFiles()).toEqual(declaredSliceFiles);
  });

  it('keeps every runtime slice under the hard line budget', () => {
    const manifest = readOracleManifest();

    for (const relativePath of readRuntimePopoverSliceFiles()) {
      const content = readFileSync(path.join(stylesRoot, relativePath), 'utf8');
      expect(countLines(content)).toBeLessThanOrEqual(manifest.maxLinesPerSlice);
    }
  });

  it('stores slices only inside the declared landing zones', () => {
    for (const relativePath of readRuntimePopoverSliceFiles()) {
      expect(relativePath).toMatch(/^(foundation|chrome|content|themes|responsive)\/[a-z0-9-]+\.css$/);
    }
  });

  it('keeps one theme landing zone per supported theme', () => {
    const themeFiles = readRuntimePopoverSliceFiles().filter((file) => file.startsWith('themes/'));

    expect(themeFiles.sort()).toEqual(Object.values(POPOVER_STYLE_THEME_SLICE_FILES).sort());
  });
});