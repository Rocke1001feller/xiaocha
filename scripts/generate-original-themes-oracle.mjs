#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const legacySourcePath = path.join(repoRoot, 'src', 'features', 'popover', 'styles', 'original-themes.css');
const sourceEntryPath = path.join(repoRoot, 'src', 'features', 'popover', 'styles', 'original-themes.ts');
const sourceGeneratedPath = path.join(repoRoot, 'src', 'features', 'popover', 'styles', 'original-themes.generated.ts');
const sourceSlicesDir = path.join(repoRoot, 'src', 'features', 'popover', 'styles', 'original-themes');
const sourceManifestPath = path.join(sourceSlicesDir, 'manifest.json');
const sourceOrderPath = path.join(sourceSlicesDir, 'order.txt');
const oracleDir = path.join(repoRoot, 'tests', 'original-themes', 'oracle');
const baselineDir = path.join(oracleDir, 'baseline');
const manifestPath = path.join(oracleDir, 'manifest.json');
const maxLinesPerSlice = 400;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function countLinesBefore(text, index) {
  if (index <= 0) {
    return 1;
  }

  return text.slice(0, index).split('\n').length;
}

function extractThemeSections(cssText, totalLines) {
  const matches = [...cssText.matchAll(/Origin of Words - ([A-Za-z]+) Theme/g)];

  return matches.map((match, index) => {
    const startLine = countLinesBefore(cssText, match.index ?? 0);
    const nextLine = index + 1 < matches.length
      ? countLinesBefore(cssText, matches[index + 1].index ?? 0)
      : totalLines + 1;

    return {
      id: match[1].toLowerCase(),
      label: match[1],
      startLine,
      endLine: nextLine - 1,
      lineCount: nextLine - startLine,
    };
  });
}

function extractKeyframes(cssText) {
  return [...cssText.matchAll(/@keyframes\s+([A-Za-z0-9_-]+)/g)].map((match) => ({
    name: match[1],
    line: countLinesBefore(cssText, match.index ?? 0),
  }));
}

function getOrderedSourceSliceFiles() {
  if (existsSync(sourceOrderPath)) {
    return readFileSync(sourceOrderPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (!existsSync(sourceSlicesDir)) {
    return [];
  }

  return readdirSync(sourceSlicesDir)
    .filter((file) => /^slice-\d+\.css$/.test(file))
    .sort((left, right) => left.localeCompare(right));
}

function readCurrentSourceBundle() {
  const sourceSliceFiles = getOrderedSourceSliceFiles();

  if (sourceSliceFiles.length > 0) {
    return {
      cssText: sourceSliceFiles
        .map((file) => readFileSync(path.join(sourceSlicesDir, file), 'utf8'))
        .join(''),
      sourceFile: path.relative(repoRoot, sourceEntryPath).replaceAll(path.sep, '/'),
      sourceGeneratedFile: existsSync(sourceGeneratedPath)
        ? path.relative(repoRoot, sourceGeneratedPath).replaceAll(path.sep, '/')
        : null,
      sourceManifestFile: existsSync(sourceManifestPath)
        ? path.relative(repoRoot, sourceManifestPath).replaceAll(path.sep, '/')
        : null,
      sourceSlicesDir: path.relative(repoRoot, sourceSlicesDir).replaceAll(path.sep, '/'),
      sourceOrderFile: existsSync(sourceOrderPath)
        ? path.relative(repoRoot, sourceOrderPath).replaceAll(path.sep, '/')
        : null,
      sourceSliceFiles,
    };
  }

  return {
    cssText: readFileSync(legacySourcePath, 'utf8'),
    sourceFile: path.relative(repoRoot, legacySourcePath).replaceAll(path.sep, '/'),
    sourceGeneratedFile: null,
    sourceManifestFile: null,
    sourceSlicesDir: null,
    sourceOrderFile: null,
    sourceSliceFiles: [],
  };
}

const {
  cssText,
  sourceFile,
  sourceGeneratedFile,
  sourceManifestFile,
  sourceSlicesDir: manifestSourceSlicesDir,
  sourceOrderFile,
  sourceSliceFiles,
} = readCurrentSourceBundle();
const lineRecords = cssText.match(/[^\n]*\n|[^\n]+$/g) ?? [];
const totalLines = lineRecords.length;

rmSync(baselineDir, { recursive: true, force: true });
mkdirSync(baselineDir, { recursive: true });

const slices = [];
for (let startIndex = 0; startIndex < lineRecords.length; startIndex += maxLinesPerSlice) {
  const sliceIndex = slices.length + 1;
  const sliceRecords = lineRecords.slice(startIndex, startIndex + maxLinesPerSlice);
  const fileName = `slice-${String(sliceIndex).padStart(2, '0')}.css`;
  const content = sliceRecords.join('');
  const startLine = startIndex + 1;
  const endLine = startIndex + sliceRecords.length;

  writeFileSync(path.join(baselineDir, fileName), content, 'utf8');

  slices.push({
    file: fileName,
    startLine,
    endLine,
    lineCount: sliceRecords.length,
    sha256: sha256(content),
  });
}

const manifest = {
  schemaVersion: 2,
  sourceFile,
  sourceGeneratedFile,
  sourceManifestFile,
  sourceSlicesDir: manifestSourceSlicesDir,
  sourceOrderFile,
  sourceSliceFiles,
  totalLines,
  totalSlices: slices.length,
  maxLinesPerSlice,
  fullSha256: sha256(cssText),
  themeSections: extractThemeSections(cssText, totalLines),
  keyframes: extractKeyframes(cssText),
  slices,
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Original themes oracle updated.`);
console.log(`Source: ${manifest.sourceFile}`);
if (manifest.sourceGeneratedFile) {
  console.log(`Source generated: ${manifest.sourceGeneratedFile}`);
}
if (manifest.sourceManifestFile) {
  console.log(`Source manifest: ${manifest.sourceManifestFile}`);
}
if (manifest.sourceSlicesDir) {
  console.log(`Source slices: ${manifest.sourceSlicesDir} (${manifest.sourceSliceFiles.length} files)`);
}
if (manifest.sourceOrderFile) {
  console.log(`Source order: ${manifest.sourceOrderFile}`);
}
console.log(`Lines: ${manifest.totalLines}`);
console.log(`Slices: ${manifest.totalSlices} (max ${manifest.maxLinesPerSlice} lines each)`);
console.log(`Manifest: ${path.relative(repoRoot, manifestPath)}`);