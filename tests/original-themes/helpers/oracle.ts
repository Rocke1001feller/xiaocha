import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type OracleThemeSection = {
  id: string;
  label: string;
  startLine: number;
  endLine: number;
  lineCount: number;
};

export type OracleKeyframe = {
  name: string;
  line: number;
};

export type OracleSlice = {
  file: string;
  startLine: number;
  endLine: number;
  lineCount: number;
  sha256: string;
};

export type OracleManifest = {
  schemaVersion: number;
  sourceFile: string;
  sourceGeneratedFile?: string | null;
  sourceManifestFile?: string | null;
  sourceOrderFile?: string | null;
  sourceSlicesDir?: string | null;
  sourceSliceFiles?: string[];
  totalLines: number;
  totalSlices: number;
  maxLinesPerSlice: number;
  fullSha256: string;
  themeSections: OracleThemeSection[];
  keyframes: OracleKeyframe[];
  slices: OracleSlice[];
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const oracleDir = path.join(repoRoot, 'tests', 'original-themes', 'oracle');
const manifestPath = path.join(oracleDir, 'manifest.json');
const baselineDir = path.join(oracleDir, 'baseline');
const runtimeSlicesDir = path.join(repoRoot, 'src', 'features', 'popover', 'styles', 'original-themes');
const runtimeOrderPath = path.join(runtimeSlicesDir, 'order.txt');
const legacyRuntimeSourcePath = path.join(repoRoot, 'src', 'features', 'popover', 'styles', 'original-themes.css');

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function countLinesBefore(text: string, index: number) {
  if (index <= 0) {
    return 1;
  }

  return text.slice(0, index).split('\n').length;
}

export function countLines(text: string) {
  const lineRecords = text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  return lineRecords.length;
}

export function readOracleManifest(): OracleManifest {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as OracleManifest;
}

export function readOracleBundle() {
  const manifest = readOracleManifest();
  return manifest.slices
    .map((slice) => readFileSync(path.join(baselineDir, slice.file), 'utf8'))
    .join('');
}

export function readRuntimeOriginalThemesSliceFiles() {
  if (existsSync(runtimeOrderPath)) {
    return readFileSync(runtimeOrderPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (!existsSync(runtimeSlicesDir)) {
    return [];
  }

  return readdirSync(runtimeSlicesDir)
    .filter((file) => /^slice-\d+\.css$/.test(file))
    .sort((left, right) => left.localeCompare(right));
}

export function readRuntimeOriginalThemesSource() {
  const sliceFiles = readRuntimeOriginalThemesSliceFiles();

  if (sliceFiles.length > 0) {
    return sliceFiles
      .map((file) => readFileSync(path.join(runtimeSlicesDir, file), 'utf8'))
      .join('');
  }

  return readFileSync(legacyRuntimeSourcePath, 'utf8');
}

export function extractThemeSections(cssText: string): OracleThemeSection[] {
  const matches = [...cssText.matchAll(/Origin of Words - ([A-Za-z]+) Theme/g)];
  const totalLines = countLines(cssText);

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

export function extractOrderedKeyframes(cssText: string): OracleKeyframe[] {
  return [...cssText.matchAll(/@keyframes\s+([A-Za-z0-9_-]+)/g)].map((match) => ({
    name: match[1],
    line: countLinesBefore(cssText, match.index ?? 0),
  }));
}