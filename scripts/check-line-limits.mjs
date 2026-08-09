#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { extname, join, relative } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const POPOVER = join(ROOT, 'src/features/popover/components');
const POPOVER_STYLES = join(ROOT, 'src/features/popover/styles');
const PROVIDER_REGISTRY = join(ROOT, 'src/features/provider-registry');
const SETTINGS = join(ROOT, 'src/features/settings');
const TASK_REGISTRY = join(ROOT, 'src/features/task-registry');
const TTS = join(ROOT, 'src/features/tts');

const TARGETS = [
  { root: POPOVER, prefix: 'src/features/popover/components', extensions: new Set(['.ts']) },
  { root: POPOVER_STYLES, prefix: 'src/features/popover/styles', extensions: new Set(['.ts', '.css']) },
  { root: PROVIDER_REGISTRY, prefix: 'src/features/provider-registry', extensions: new Set(['.ts']) },
  { root: SETTINGS, prefix: 'src/features/settings', extensions: new Set(['.ts', '.css']) },
  { root: TASK_REGISTRY, prefix: 'src/features/task-registry', extensions: new Set(['.ts']) },
  { root: TTS, prefix: 'src/features/tts', extensions: new Set(['.ts']) },
];

const RULES = [
  { root: POPOVER, label: 'components/*.ts', limit: 200, match: (f) => /^[^/]+\.ts$/.test(f) },
  { root: POPOVER, label: 'components/sections/*.ts', limit: 150, match: (f) => /^sections\/[^/]+\.ts$/.test(f) },
  { root: PROVIDER_REGISTRY, label: 'services/ProviderRegistryService.ts (facade)', limit: 380, match: (f) => f === 'services/ProviderRegistryService.ts' },
  { root: PROVIDER_REGISTRY, label: 'services/ProviderRuntimeResolver.ts', limit: 140, match: (f) => f === 'services/ProviderRuntimeResolver.ts' },
  { root: PROVIDER_REGISTRY, label: 'services/provider-registry/*.ts', limit: 180, match: (f) => /^services\/provider-registry\/[^/]+\.ts$/.test(f) },
  { root: PROVIDER_REGISTRY, label: 'interfaces/*.ts', limit: 50, match: (f) => /^interfaces\/[^/]+\.ts$/.test(f) },
  { root: PROVIDER_REGISTRY, label: 'events/*.ts', limit: 220, match: (f) => /^events\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'components/SettingsView.ts (facade)', limit: 800, match: (f) => f === 'components/SettingsView.ts' },
  { root: SETTINGS, label: 'components/overview/*.ts', limit: 150, match: (f) => /^components\/overview\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'components/provider-editor/*.ts', limit: 220, match: (f) => /^components\/provider-editor\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'components/task-editor/*.ts', limit: 400, match: (f) => /^components\/task-editor\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'components/snapshot-runtime/*.ts', limit: 120, match: (f) => /^components\/snapshot-runtime\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'viewmodels/SettingsViewModel.ts (facade)', limit: 560, match: (f) => f === 'viewmodels/SettingsViewModel.ts' },
  { root: SETTINGS, label: 'viewmodels/language-preferences/*.ts', limit: 180, match: (f) => /^viewmodels\/language-preferences\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'viewmodels/provider-editor/*.ts', limit: 800, match: (f) => /^viewmodels\/provider-editor\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'viewmodels/task-editor/*.ts', limit: 725, match: (f) => /^viewmodels\/task-editor\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'viewmodels/task-dry-run/*.ts', limit: 320, match: (f) => /^viewmodels\/task-dry-run\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'viewmodels/shell/*.ts', limit: 150, match: (f) => /^viewmodels\/shell\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'viewmodels/snapshot-runtime/*.ts', limit: 120, match: (f) => /^viewmodels\/snapshot-runtime\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'events/*.ts', limit: 420, match: (f) => /^events\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'repositories/*.ts', limit: 150, match: (f) => /^repositories\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'interfaces/*.ts', limit: 50, match: (f) => /^interfaces\/[^/]+\.ts$/.test(f) },
  { root: SETTINGS, label: 'styles/index.css', limit: 400, match: (f) => f === 'styles/index.css' },
  { root: SETTINGS, label: 'styles/shell.css', limit: 320, match: (f) => f === 'styles/shell.css' },
  { root: SETTINGS, label: 'styles/overview.css', limit: 120, match: (f) => f === 'styles/overview.css' },
  { root: SETTINGS, label: 'styles/provider-editor.css', limit: 220, match: (f) => f === 'styles/provider-editor.css' },
  { root: SETTINGS, label: 'styles/task-editor.css', limit: 220, match: (f) => f === 'styles/task-editor.css' },
  { root: SETTINGS, label: 'styles/snapshot-runtime.css', limit: 200, match: (f) => f === 'styles/snapshot-runtime.css' },
  { root: SETTINGS, label: 'styles/*.css', limit: 180, match: (f) => /^styles\/[^/]+\.css$/.test(f) },
  { root: TASK_REGISTRY, label: 'services/TaskRegistryService.ts (facade)', limit: 450, match: (f) => f === 'services/TaskRegistryService.ts' },
  { root: TASK_REGISTRY, label: 'services/createRegistryServiceBundle.ts', limit: 40, match: (f) => f === 'services/createRegistryServiceBundle.ts' },
  { root: TASK_REGISTRY, label: 'services/task-registry/*.ts', limit: 180, match: (f) => /^services\/task-registry\/[^/]+\.ts$/.test(f) },
  { root: TASK_REGISTRY, label: 'interfaces/*.ts', limit: 50, match: (f) => /^interfaces\/[^/]+\.ts$/.test(f) },
  { root: TASK_REGISTRY, label: 'events/*.ts', limit: 420, match: (f) => /^events\/[^/]+\.ts$/.test(f) },
  { root: TTS, label: 'index.ts', limit: 50, match: (f) => f === 'index.ts' },
  { root: TTS, label: 'services/TtsRegistryService.ts (facade)', limit: 140, match: (f) => f === 'services/TtsRegistryService.ts' },
  { root: TTS, label: 'services/TtsService.ts (facade)', limit: 240, match: (f) => f === 'services/TtsService.ts' },
  { root: TTS, label: 'services/tts-registry/*.ts', limit: 120, match: (f) => /^services\/tts-registry\/[^/]+\.ts$/.test(f) },
  { root: TTS, label: 'engines/*.ts', limit: 180, match: (f) => /^engines\/[^/]+\.ts$/.test(f) },
  { root: TTS, label: 'utils/*.ts', limit: 120, match: (f) => /^utils\/[^/]+\.ts$/.test(f) },
  { root: TTS, label: 'events/*.ts', limit: 160, match: (f) => /^events\/[^/]+\.ts$/.test(f) },
];

function* walkFiles(dir, allowedExts, base = dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* walkFiles(full, allowedExts, base);
      continue;
    }
    if (allowedExts.has(extname(full))) yield relative(base, full);
  }
}

function countLines(absPath) {
  const content = readFileSync(absPath, 'utf8');
  if (!content) return 0;
  return content.endsWith('\n') ? content.slice(0, -1).split('\n').length : content.split('\n').length;
}

let violations = 0;
let warnings = 0;

for (const target of TARGETS) {
  for (const rel of walkFiles(target.root, target.extensions)) {
    const normalized = rel.replaceAll('\\', '/');
    const display = `${target.prefix}/${normalized}`;

    for (const rule of RULES) {
      if (rule.root !== target.root || !rule.match(normalized)) continue;

      const lines = countLines(join(target.root, normalized));
      const over = lines - rule.limit;
      if (over > 0) {
        if (rule.warn) {
          console.warn(`⚠️  WARN  ${display}  ${lines} lines  (limit ${rule.limit}, over by ${over})  [${rule.label}]`);
          warnings += 1;
        } else {
          console.error(`❌ FAIL  ${display}  ${lines} lines  (limit ${rule.limit}, over by ${over})  [${rule.label}]`);
          violations += 1;
        }
      } else {
        console.log(`✅       ${display}  ${lines} lines  (limit ${rule.limit})  [${rule.label}]`);
      }
      break;
    }
  }
}

if (warnings > 0) console.warn(`\n${warnings} warning(s) detected.`);

if (violations > 0) {
  console.error(`\n${violations} line-budget violation(s). Fix before merging.`);
  process.exit(1);
}

console.log('\nAll line budgets within limits.');
