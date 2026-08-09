import { PROVIDERS, TASKS } from '../../../../src/llm/config';
import { FIRST_CHUNK_TIMEOUT_MS, REQUEST_TIMEOUT_MS } from '../../../../src/llm/runtime-config';
import type {
  ProviderId,
  ProviderViewRecord,
} from '../../provider-registry/events/ProviderRegistryEvents';
import { POPOVER_THEMES, type PopoverThemeId } from '../../popover/events/PopoverEvents';
import type { SystemTaskId, TaskId, TaskRegistryRecord } from '../../task-registry/events/TaskRegistryEvents';
import type { SystemTtsSourceDefinition, TtsSourceId } from '../../tts/events/TtsEvents';
import type { ResolvedUiDisplayLanguage } from '../../../shared/ui-language';

export type SettingsPageTab = 'overview' | 'providers' | 'prompts' | 'tts' | 'themes' | 'advanced';

export type SettingsMetric = {
  label: string;
  value: string;
  meta: string;
};

export type SettingsProviderRecord = {
  id: ProviderViewRecord['id'];
  source: ProviderViewRecord['source'];
  status: ProviderViewRecord['status'];
  mutability: ProviderViewRecord['mutability'];
  hasSecret: ProviderViewRecord['hasSecret'];
  isRuntimeReachable: ProviderViewRecord['isRuntimeReachable'];
  label: string;
  endpoint: string;
  model: string;
  apiKeyMasked: string;
  summary: string;
  tags: string[];
  tone: 'green' | 'violet';
  icon: string;
};

export type SettingsTaskRecord = {
  id: TaskId;
  source: TaskRegistryRecord['source'];
  status: TaskRegistryRecord['status'];
  mutability: TaskRegistryRecord['mutability'];
  label: string;
  mode: 'json' | 'markdown';
  summary: string;
  providers: string[];
  providerChainIds: ProviderId[];
  systemPrompt: string;
  userPrompt: string;
  providerRequestParams?: TaskRegistryRecord['providerRequestParams'];
  hasOverride: boolean;
  tone: 'green' | 'violet' | 'amber';
  icon: string;
};

export type SettingsThemeRecord = {
  id: PopoverThemeId;
  label: string;
  tier: 'free' | 'premium';
  tierLabel: string;
  description: string;
  accent: string;
  background: string;
  panel: string;
  sample: string;
};

export type SettingsTtsSourceRecord = {
  id: TtsSourceId;
  isOnline: boolean;
  requiresApiKey: boolean;
  label: string;
  summary: string;
  tags: string[];
  tone: 'green' | 'violet' | 'amber';
  icon: string;
};

const TTS_SOURCE_META: Record<TtsSourceId, Pick<SettingsTtsSourceRecord, 'tone' | 'icon'>> = {
  auto: { tone: 'green', icon: 'auto_awesome' },
  'browser-speech': { tone: 'amber', icon: 'record_voice_over' },
  'google-translate': { tone: 'violet', icon: 'cloud' },
  'azure-speech': { tone: 'violet', icon: 'key' },
};

export function createSettingsTtsSourceRecord(
  source: SystemTtsSourceDefinition,
  localized: { label: string; summary: string },
): SettingsTtsSourceRecord {
  return {
    ...TTS_SOURCE_META[source.id],
    id: source.id,
    isOnline: source.isOnline,
    requiresApiKey: source.requiresApiKey,
    label: localized.label,
    summary: localized.summary,
    tags: source.id === 'auto'
      ? ['smart']
      : [source.isOnline ? 'online' : 'offline', ...(source.requiresApiKey ? ['byok'] : [])],
  };
}

export type SettingsSnapshot = {
  metrics: SettingsMetric[];
  providers: SettingsProviderRecord[];
  tasks: SettingsTaskRecord[];
  themes: SettingsThemeRecord[];
  requestTimeoutMs: number;
  firstChunkTimeoutMs: number;
  selectedThemeId: PopoverThemeId;
};

const TASK_SUMMARIES: Record<ResolvedUiDisplayLanguage, Record<SystemTaskId, string>> = {
  'zh-CN': {
    lexical: '翻译与词典输出，强调结构化 JSON。',
    etymology: '词源与演化解释，适合更长的 Markdown 叙述。',
    information: '文本背景与深层信息分析，按标签懒加载。',
  },
  en: {
    lexical: 'Translation and lexical output with structured JSON emphasis.',
    etymology: 'Etymology and evolution, designed for longer markdown explanation.',
    information: 'Background and deeper information analysis, lazily requested by tab.',
  },
};

const THEME_DESCRIPTIONS: Record<ResolvedUiDisplayLanguage, Record<PopoverThemeId, string>> = {
  'zh-CN': {
    basic: '冷白纸面，最克制也最清爽。',
    pro: '深色专业面板，是当前默认路线。',
    creative: '暖调编辑感，更适合教学与创意文本。',
    galaxy: '深空紫蓝层次，强调知识舱氛围。',
    neon: '荧光绿对比，适合强调高亮与术语。',
    cyberpunk: '黑底洋红高反差，视觉戏剧性最强。',
    aurora: '冷青蓝高级感，兼顾未来感与稳重。',
  },
  en: {
    basic: 'Cool paper tones with the most restrained, readable surface.',
    pro: 'A focused dark workspace and the current production default.',
    creative: 'Warm editorial color for education and expressive content.',
    galaxy: 'Deep indigo space layers with a knowledge-capsule mood.',
    neon: 'Signal green contrast for highlights and key terms.',
    cyberpunk: 'Dark magenta contrast with the strongest dramatic tension.',
    aurora: 'Cold cyan elegance that balances future feel and calm clarity.',
  },
};

const THEME_SAMPLES: Record<ResolvedUiDisplayLanguage, Record<PopoverThemeId, string>> = {
  'zh-CN': {
    basic: '最轻量、最易读的基础表面。',
    pro: '更像专业分析器的默认观感。',
    creative: '让解释结果更有设计感和亲和力。',
    galaxy: '把解释面板做成带纵深的知识舱。',
    neon: '高能荧光感，会让重点信息很抢眼。',
    cyberpunk: '适合带戏剧性的技术内容演绎。',
    aurora: '平衡精致与稳定的高级蓝调。',
  },
  en: {
    basic: 'The lightest and most readable baseline surface.',
    pro: 'A default look closer to a professional analysis tool.',
    creative: 'Makes explanations feel more expressive and editorial.',
    galaxy: 'Turns the panel into a layered knowledge capsule.',
    neon: 'High-energy contrast for spotlighting key information.',
    cyberpunk: 'Great for more dramatic and futuristic technical content.',
    aurora: 'A polished blue atmosphere balancing calm and premium feel.',
  },
};

function maskApiKey(value: string): string {
  if (value.length <= 8) {
    return '••••••••';
  }

  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
}

function formatProviderSummary(endpoint: string, model: string): string {
  try {
    const hostname = new URL(endpoint).hostname;
    return `${hostname} · ${model}`;
  } catch {
    return model;
  }
}

function buildProviderTags(provider: ProviderViewRecord): string[] {
  return [...new Set([
    provider.source === 'system' ? 'system' : 'custom',
    provider.status,
    provider.mutability === 'override-only' ? 'default' : 'editable',
    provider.hasSecret ? 'secret' : 'missing-secret',
    provider.isRuntimeReachable ? 'reachable' : 'inactive',
  ])];
}

function buildProviderTone(provider: ProviderViewRecord): SettingsProviderRecord['tone'] {
  return provider.source === 'system' ? 'green' : 'violet';
}

function buildProviderIcon(provider: ProviderViewRecord): string {
  return provider.source === 'system' ? 'bolt' : 'hub';
}

function createDefaultTaskRecords(providers: SettingsProviderRecord[]): TaskRegistryRecord[] {
  const providerLabelMap = new Map(providers.map((provider) => [provider.id, provider.label]));

  return (Object.entries(TASKS) as [SystemTaskId, (typeof TASKS)[SystemTaskId]][]).map(([taskId, taskConfig]) => ({
    id: taskId,
    source: 'system',
    status: 'active',
    mutability: 'override-only',
    label: taskConfig.label,
    mode: taskConfig.mode,
    systemPrompt: taskConfig.systemPrompt,
    userPrompt: taskConfig.userPrompt,
    providerRequestParams: taskConfig.providerRequestParams,
    providerChainIds: [...taskConfig.providers],
    providerChainLabels: taskConfig.providers.map(
      (providerId) => providerLabelMap.get(providerId) ?? PROVIDERS[providerId].label,
    ),
    hasDefinitionOverride: false,
    hasProviderChainOverride: false,
    hasOverride: false,
    updatedAt: 0,
  }));
}

function buildTaskSummary(task: TaskRegistryRecord, language: ResolvedUiDisplayLanguage): string {
  if (task.source === 'system' && task.id in TASK_SUMMARIES[language]) {
    return TASK_SUMMARIES[language][task.id as SystemTaskId];
  }

  const promptPreview = task.userPrompt.trim() || task.systemPrompt.trim();
  if (!promptPreview) {
    return language === 'zh-CN' ? '自定义 Prompt Task。' : 'Custom prompt task.';
  }

  return promptPreview.length > 96 ? `${promptPreview.slice(0, 93)}...` : promptPreview;
}

function buildTaskTone(task: TaskRegistryRecord): SettingsTaskRecord['tone'] {
  if (task.source === 'user') {
    return 'violet';
  }

  const taskId = task.id as SystemTaskId;
  if (taskId === 'lexical') {
    return 'green';
  }

  return taskId === 'etymology' ? 'violet' : 'amber';
}

function buildTaskIcon(task: TaskRegistryRecord): string {
  if (task.source === 'user') {
    return 'edit_note';
  }

  const taskId = task.id as SystemTaskId;
  if (taskId === 'lexical') {
    return 'dictionary';
  }

  return taskId === 'etymology' ? 'history_edu' : 'auto_awesome';
}

function createSettingsTaskRecord(
  task: TaskRegistryRecord,
  language: ResolvedUiDisplayLanguage,
): SettingsTaskRecord {
  return {
    id: task.id,
    source: task.source,
    status: task.status,
    mutability: task.mutability,
    label: task.label,
    mode: task.mode,
    summary: buildTaskSummary(task, language),
    providers: [...task.providerChainLabels],
    providerChainIds: [...task.providerChainIds],
    systemPrompt: task.systemPrompt,
    userPrompt: task.userPrompt,
    providerRequestParams: task.providerRequestParams,
    hasOverride: task.hasOverride,
    tone: buildTaskTone(task),
    icon: buildTaskIcon(task),
  };
}

function createDefaultSettingsProviders(): SettingsProviderRecord[] {
  return Object.values(PROVIDERS).map((provider) => ({
    id: provider.id,
    source: 'system',
    status: 'active',
    mutability: 'override-only',
    hasSecret: Boolean(provider.apiKey),
    isRuntimeReachable: Boolean(provider.apiKey),
    label: provider.label,
    endpoint: provider.url,
    model: provider.model,
    apiKeyMasked: provider.apiKey ? maskApiKey(provider.apiKey) : '—',
    summary: formatProviderSummary(provider.url, provider.model),
    tags: provider.id === 'zhipu_glm4_flash' ? ['primary', 'flash', 'json'] : ['fallback', '9b', 'markdown'],
    tone: provider.id === 'zhipu_glm4_flash' ? ('green' as const) : ('violet' as const),
    icon: provider.id === 'zhipu_glm4_flash' ? 'bolt' : 'memory',
  }));
}

export function createSettingsProviderRecord(provider: ProviderViewRecord): SettingsProviderRecord {
  return {
    id: provider.id,
    source: provider.source,
    status: provider.status,
    mutability: provider.mutability,
    hasSecret: provider.hasSecret,
    isRuntimeReachable: provider.isRuntimeReachable,
    label: provider.label,
    endpoint: provider.endpoint,
    model: provider.model,
    apiKeyMasked: provider.secretMask ?? '—',
    summary: formatProviderSummary(provider.endpoint, provider.model),
    tags: buildProviderTags(provider),
    tone: buildProviderTone(provider),
    icon: buildProviderIcon(provider),
  };
}

function buildThemeBackground(themeId: PopoverThemeId): string {
  switch (themeId) {
    case 'basic':
      return 'linear-gradient(180deg, #ffffff 0%, #e7eef8 100%)';
    case 'pro':
      return 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)';
    case 'creative':
      return 'linear-gradient(135deg, #fb7185 0%, #f59e0b 100%)';
    case 'galaxy':
      return 'linear-gradient(160deg, #111827 0%, #312e81 60%, #7c3aed 100%)';
    case 'neon':
      return 'linear-gradient(180deg, #052e16 0%, #022c22 100%)';
    case 'cyberpunk':
      return 'linear-gradient(180deg, #18181b 0%, #831843 100%)';
    case 'aurora':
      return 'linear-gradient(180deg, #083344 0%, #164e63 100%)';
  }
}

function buildThemePanel(themeId: PopoverThemeId): string {
  return themeId === 'basic' ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.08)';
}

function buildThemeAccent(themeId: PopoverThemeId): string {
  switch (themeId) {
    case 'basic':
      return '#0f172a';
    case 'pro':
    case 'galaxy':
    case 'creative':
      return '#f8fafc';
    case 'neon':
      return '#d9f99d';
    case 'cyberpunk':
      return '#fdf2f8';
    case 'aurora':
      return '#ecfeff';
  }
}

export function createSettingsSnapshot(
  language: ResolvedUiDisplayLanguage,
  providers: SettingsProviderRecord[] = createDefaultSettingsProviders(),
  tasks: TaskRegistryRecord[] = createDefaultTaskRecords(providers),
): SettingsSnapshot {
  const taskRecords = tasks.map((task) => createSettingsTaskRecord(task, language));

  const themes = POPOVER_THEMES.map((theme) => ({
    id: theme.id,
    label: theme.name,
    tier: theme.tier,
    tierLabel: theme.tier === 'free' ? (language === 'zh-CN' ? '免费' : 'Free') : language === 'zh-CN' ? '高级' : 'Premium',
    description: THEME_DESCRIPTIONS[language][theme.id],
    accent: buildThemeAccent(theme.id),
    background: buildThemeBackground(theme.id),
    panel: buildThemePanel(theme.id),
    sample: THEME_SAMPLES[language][theme.id],
  }));

  return {
    metrics: [
      {
        label: language === 'zh-CN' ? '服务商' : 'Providers',
        value: String(providers.length),
        meta: language === 'zh-CN' ? '已配置的 AI 服务商。' : 'Your configured AI providers.',
      },
      {
        label: language === 'zh-CN' ? 'Prompt 任务' : 'Prompt Tasks',
        value: String(taskRecords.length),
        meta: language === 'zh-CN' ? '内置的解释任务。' : 'Built-in explain tasks.',
      },
      {
        label: language === 'zh-CN' ? '主题数' : 'Themes',
        value: String(themes.length),
        meta: language === 'zh-CN' ? '3 个免费，4 个高级。' : '3 free, 4 premium.',
      },
      {
        label: language === 'zh-CN' ? '默认超时' : 'Default Timeout',
        value: language === 'zh-CN' ? '30 秒' : '30s',
        meta: language === 'zh-CN' ? '首块 2.5 秒，整体 30 秒。' : '2.5s first chunk, 30s overall.',
      },
    ],
    providers,
    tasks: taskRecords,
    themes,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
    firstChunkTimeoutMs: FIRST_CHUNK_TIMEOUT_MS,
    selectedThemeId: 'pro',
  };
}