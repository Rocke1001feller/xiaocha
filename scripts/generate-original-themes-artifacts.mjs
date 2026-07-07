#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ALLOWED_CATEGORIES = ['tokens', 'trigger', 'panels', 'effects'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const stylesDir = path.join(repoRoot, 'src', 'features', 'popover', 'styles');
const sourceRoot = path.join(stylesDir, 'original-themes');
const sourceManifestPath = path.join(sourceRoot, 'manifest.json');
const generatedOrderPath = path.join(sourceRoot, 'order.txt');
const generatedModulePath = path.join(stylesDir, 'original-themes.generated.ts');

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function toPosix(value) {
  return value.replaceAll(path.sep, '/');
}

function collectCssFiles(dir, base = dir) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectCssFiles(fullPath, base));
      continue;
    }

    if (path.extname(entry.name) === '.css') {
      files.push(toPosix(path.relative(base, fullPath)));
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function formatSlicePath(prefix, partFile) {
  assert(/^part-\d+\.css$/.test(partFile), `Invalid slice file name: ${partFile}`);
  return `${prefix}/${partFile}`;
}

function readSourceManifest() {
  const raw = readFileSync(sourceManifestPath, 'utf8');
  const parsed = JSON.parse(raw);

  assert(parsed && typeof parsed === 'object', 'Original themes source manifest must be an object.');
  assert(parsed.schemaVersion === 1, `Unsupported original themes source manifest schema: ${parsed.schemaVersion}`);
  assert(Array.isArray(parsed.shared) && parsed.shared.length > 0, 'Original themes source manifest must declare shared slices.');
  assert(Array.isArray(parsed.themes) && parsed.themes.length > 0, 'Original themes source manifest must declare themes.');

  return {
    manifest: parsed,
    raw,
  };
}

function expandSourceManifest(sourceManifest) {
  const sharedSliceFiles = sourceManifest.shared.map((partFile) => formatSlicePath('shared', partFile));
  const themeIds = [];
  const seenThemes = new Set();
  const themeCategoryOrder = {};
  const themeSliceFiles = {};
  const sliceFiles = [...sharedSliceFiles];

  for (const theme of sourceManifest.themes) {
    assert(theme && typeof theme === 'object', 'Each original themes manifest theme entry must be an object.');
    assert(typeof theme.id === 'string' && theme.id.length > 0, 'Each original themes manifest theme must have an id.');
    assert(!seenThemes.has(theme.id), `Duplicate original themes manifest theme id: ${theme.id}`);
    assert(Array.isArray(theme.sequence) && theme.sequence.length > 0, `Theme ${theme.id} must declare a non-empty sequence.`);

    seenThemes.add(theme.id);
    themeIds.push(theme.id);

    const categoryOrder = [];
    const filesForTheme = [];
    const categoriesForTheme = new Set();

    for (const segment of theme.sequence) {
      assert(segment && typeof segment === 'object', `Theme ${theme.id} has an invalid sequence segment.`);
      assert(typeof segment.category === 'string', `Theme ${theme.id} has a sequence segment without category.`);
      assert(ALLOWED_CATEGORIES.includes(segment.category), `Theme ${theme.id} uses unsupported category ${segment.category}.`);
      assert(Array.isArray(segment.parts) && segment.parts.length > 0, `Theme ${theme.id} category ${segment.category} must declare at least one part.`);

      categoryOrder.push(segment.category);
      categoriesForTheme.add(segment.category);

      for (const partFile of segment.parts) {
        const relativePath = formatSlicePath(`themes/${theme.id}/${segment.category}`, partFile);
        filesForTheme.push(relativePath);
        sliceFiles.push(relativePath);
      }
    }

    for (const category of ALLOWED_CATEGORIES) {
      assert(categoriesForTheme.has(category), `Theme ${theme.id} must declare category ${category}.`);
    }

    themeCategoryOrder[theme.id] = categoryOrder;
    themeSliceFiles[theme.id] = filesForTheme;
  }

  const duplicateSliceFiles = [];
  const seenSliceFiles = new Set();
  for (const relativePath of sliceFiles) {
    if (seenSliceFiles.has(relativePath)) {
      duplicateSliceFiles.push(relativePath);
      continue;
    }
    seenSliceFiles.add(relativePath);
  }

  assert(duplicateSliceFiles.length === 0, `Original themes source manifest expands to duplicate slices:\n${duplicateSliceFiles.join('\n')}`);

  return {
    sharedSliceFiles,
    themeIds,
    themeCategoryOrder,
    themeSliceFiles,
    sliceFiles,
  };
}

function validateFilesystem(sliceFiles) {
  const missingFiles = sliceFiles.filter((relativePath) => !existsSync(path.join(sourceRoot, relativePath)));
  assert(missingFiles.length === 0, `Original themes source manifest references missing files:\n${missingFiles.join('\n')}`);

  const actualCssFiles = collectCssFiles(sourceRoot);
  const expectedCssFiles = new Set(sliceFiles);
  const extraFiles = actualCssFiles.filter((relativePath) => !expectedCssFiles.has(relativePath));

  assert(extraFiles.length === 0, `Original themes CSS files missing from source manifest:\n${extraFiles.join('\n')}`);
}

function writeGeneratedArtifacts({
  manifestHash,
  sharedSliceFiles,
  themeIds,
  themeCategoryOrder,
  themeSliceFiles,
  sliceFiles,
}) {
  const orderOutput = `${sliceFiles.join('\n')}\n`;
  writeFileSync(generatedOrderPath, orderOutput, 'utf8');

  const generatedModule = `/* This file is auto-generated by scripts/generate-original-themes-artifacts.mjs. */\n\nexport const ORIGINAL_THEMES_SOURCE_MANIFEST_FILE = ${JSON.stringify(toPosix(path.relative(repoRoot, sourceManifestPath)))} as const;\nexport const ORIGINAL_THEMES_SOURCE_MANIFEST_SHA256 = ${JSON.stringify(manifestHash)} as const;\n\nexport const ORIGINAL_THEMES_THEME_ORDER = ${JSON.stringify(themeIds, null, 2)} as const;\n\nexport const ORIGINAL_THEMES_SHARED_SLICE_FILES = ${JSON.stringify(sharedSliceFiles, null, 2)} as const;\n\nexport const ORIGINAL_THEMES_THEME_CATEGORY_ORDER = ${JSON.stringify(themeCategoryOrder, null, 2)} as const;\n\nexport const ORIGINAL_THEMES_THEME_SLICE_FILES = ${JSON.stringify(themeSliceFiles, null, 2)} as const;\n\nexport const ORIGINAL_THEME_SLICE_FILES = ${JSON.stringify(sliceFiles, null, 2)} as const;\n\nexport type OriginalThemesThemeId = (typeof ORIGINAL_THEMES_THEME_ORDER)[number];\nexport type OriginalThemesCategory = (typeof ORIGINAL_THEMES_THEME_CATEGORY_ORDER)[OriginalThemesThemeId][number];\n`;

  writeFileSync(generatedModulePath, generatedModule, 'utf8');
}

const { manifest: sourceManifest, raw: sourceManifestRaw } = readSourceManifest();
const expandedManifest = expandSourceManifest(sourceManifest);

validateFilesystem(expandedManifest.sliceFiles);

writeGeneratedArtifacts({
  manifestHash: sha256(sourceManifestRaw),
  ...expandedManifest,
});

console.log('Original themes generated artifacts updated.');
console.log(`Source manifest: ${toPosix(path.relative(repoRoot, sourceManifestPath))}`);
console.log(`Generated order: ${toPosix(path.relative(repoRoot, generatedOrderPath))}`);
console.log(`Generated module: ${toPosix(path.relative(repoRoot, generatedModulePath))}`);
console.log(`Runtime slices: ${expandedManifest.sliceFiles.length}`);