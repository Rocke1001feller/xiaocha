import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { POPOVER_STYLE_SLICE_FILES } from '../../../src/features/popover/styles/popover.generated';

export type PopoverStyleOracleManifest = {
  schemaVersion: number;
  legacySourceFile: string;
  sourceFile: string;
  sourceOrderFile: string;
  sourceSlicesDir: string;
  sourceSliceFiles: string[];
  totalLines: number;
  fullSha256: string;
  maxLinesPerSlice: number;
  themeOrder: string[];
  mediaBlocks: string[];
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const oracleDir = path.join(repoRoot, 'tests', 'popover-styles', 'oracle');
const manifestPath = path.join(oracleDir, 'manifest.json');
const bundlePath = path.join(oracleDir, 'bundle.css');
const runtimeSlicesDir = path.join(repoRoot, 'src', 'features', 'popover', 'styles', 'popover');
const runtimeOrderPath = path.join(runtimeSlicesDir, 'order.txt');
const legacyRuntimeSourcePath = path.join(repoRoot, 'src', 'features', 'popover', 'styles', 'popover.css');

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function countLines(text: string) {
  const lineRecords = text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  return lineRecords.length;
}

export function extractThemeOrder(cssText: string) {
  return [...cssText.matchAll(/\.scanex-popover\[data-theme='([^']+)'\]/g)].map((match) => match[1]);
}

export function extractMediaBlocks(cssText: string) {
  return [...cssText.matchAll(/@media\s*\(([^)]+)\)/g)].map((match) => match[1]);
}

export function readOracleManifest() {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as PopoverStyleOracleManifest;
}

export function readOracleBundle() {
  return readFileSync(bundlePath, 'utf8');
}

export function readRuntimePopoverSliceFiles() {
  if (!existsSync(runtimeOrderPath)) {
    return [];
  }

  return readFileSync(runtimeOrderPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function readRuntimePopoverSource() {
  const sliceFiles = readRuntimePopoverSliceFiles();

  if (sliceFiles.length > 0) {
    return sliceFiles
      .map((file) => readFileSync(path.join(runtimeSlicesDir, file), 'utf8'))
      .join('\n');
  }

  if (existsSync(legacyRuntimeSourcePath)) {
    return readFileSync(legacyRuntimeSourcePath, 'utf8');
  }

  throw new Error('No popover style runtime source found.');
}

export function readDeclaredSliceFiles() {
  return [...POPOVER_STYLE_SLICE_FILES];
}