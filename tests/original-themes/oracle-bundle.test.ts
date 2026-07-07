import { ORIGINAL_THEME_SLICE_FILES } from '../../src/features/popover/styles/original-themes.generated';
import {
  countLines,
  extractOrderedKeyframes,
  extractThemeSections,
  readOracleBundle,
  readOracleManifest,
  readRuntimeOriginalThemesSliceFiles,
  readRuntimeOriginalThemesSource,
  sha256,
} from './helpers/oracle';
import { describe, expect, it } from 'vitest';

describe('original themes Phase 0 bundle oracle', () => {
  it('reassembles the exact golden CSS bundle', () => {
    const manifest = readOracleManifest();
    const oracleBundle = readOracleBundle();
    const runtimeSource = readRuntimeOriginalThemesSource();

    expect(oracleBundle).toBe(runtimeSource);
    expect(sha256(oracleBundle)).toBe(manifest.fullSha256);
    expect(countLines(oracleBundle)).toBe(manifest.totalLines);
  });

  it('keeps every oracle slice under the hard line budget', () => {
    const manifest = readOracleManifest();

    expect(manifest.totalSlices).toBeGreaterThan(1);
    for (const slice of manifest.slices) {
      expect(slice.lineCount).toBeLessThanOrEqual(500);
      expect(slice.lineCount).toBeLessThanOrEqual(manifest.maxLinesPerSlice);
    }
  });

  it('assembles the runtime source from ordered physical slice files', () => {
    const manifest = readOracleManifest();
    const sliceFiles = readRuntimeOriginalThemesSliceFiles();

    expect(sliceFiles).toEqual([...ORIGINAL_THEME_SLICE_FILES]);
    expect(manifest.sourceSliceFiles).toEqual([...ORIGINAL_THEME_SLICE_FILES]);
  });

  it('preserves theme section order and line ranges', () => {
    const manifest = readOracleManifest();
    const runtimeSource = readRuntimeOriginalThemesSource();

    expect(extractThemeSections(runtimeSource)).toEqual(manifest.themeSections);
  });

  it('preserves the ordered keyframe inventory', () => {
    const manifest = readOracleManifest();
    const runtimeSource = readRuntimeOriginalThemesSource();

    expect(extractOrderedKeyframes(runtimeSource)).toEqual(manifest.keyframes);
  });
});