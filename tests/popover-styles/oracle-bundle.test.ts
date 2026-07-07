import {
  countLines,
  extractMediaBlocks,
  extractThemeOrder,
  readDeclaredSliceFiles,
  readOracleBundle,
  readOracleManifest,
  readRuntimePopoverSliceFiles,
  readRuntimePopoverSource,
  sha256,
} from './helpers/oracle';
import { describe, expect, it } from 'vitest';

describe('popover styles truth oracle', () => {
  it('reassembles the exact pre-refactor CSS bundle', () => {
    const manifest = readOracleManifest();
    const oracleBundle = readOracleBundle();
    const runtimeSource = readRuntimePopoverSource();

    expect(runtimeSource).toBe(oracleBundle);
    expect(sha256(runtimeSource)).toBe(manifest.fullSha256);
    expect(countLines(runtimeSource)).toBe(manifest.totalLines);
  });

  it('assembles the runtime source from the declared ordered slice files', () => {
    const manifest = readOracleManifest();
    const runtimeSliceFiles = readRuntimePopoverSliceFiles();
    const declaredSliceFiles = readDeclaredSliceFiles();

    expect(runtimeSliceFiles).toEqual(declaredSliceFiles);
    expect(runtimeSliceFiles).toEqual(manifest.sourceSliceFiles);
  });

  it('preserves theme order and responsive media blocks', () => {
    const manifest = readOracleManifest();
    const runtimeSource = readRuntimePopoverSource();

    expect(extractThemeOrder(runtimeSource)).toEqual(manifest.themeOrder);
    expect(extractMediaBlocks(runtimeSource)).toEqual(manifest.mediaBlocks);
  });
});