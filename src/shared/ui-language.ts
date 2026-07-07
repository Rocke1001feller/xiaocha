export type UiDisplayLanguagePreference = 'system' | 'zh-CN' | 'en';

export type ResolvedUiDisplayLanguage = 'zh-CN' | 'en';

export type SettingsCopy = {
  pageTitle: string;
  pageSubtitle: string;
  scopeMeta: string;
  settingsGroupTitle: string;
  foundationsGroupTitle: string;
  navOverview: string;
  navProviders: string;
  navPrompts: string;
  navThemes: string;
  navAdvanced: string;
  foundationBaseline: string;
  foundationSource: string;
  sidebarFooter: string;
  overviewMeta: string;
  summaryTitle: string;
  summaryDescription: string;
  summaryTagLanguages: string;
  summaryTagProviders: string;
  summaryTagPrompts: string;
  summaryTagThemes: string;
  summaryTagTimeouts: string;
  metricProviders: string;
  metricProvidersMeta: string;
  metricTasks: string;
  metricTasksMeta: string;
  metricThemes: string;
  metricThemesMeta: string;
  metricTimeout: string;
  metricTimeoutMeta: string;
  defaultsTitle: string;
  displayLanguageLabel: string;
  displayLanguageDescription: string;
  outputLanguageLabel: string;
  outputLanguageDescription: string;
  currentThemeLabel: string;
  currentThemeDescription: string;
  openThemeGallery: string;
  supportTruthTitle: string;
  supportTruthBody: string;
  supportBorrowingTitle: string;
  supportBorrowingBody: string;
  supportIntegrationTitle: string;
  supportIntegrationBody: string;
  providersMeta: string;
  providersTitle: string;
  providersNote: string;
  providerSearchPlaceholder: string;
  addProvider: string;
  providerCoreFields: string;
  providerConnection: string;
  providerParams: string;
  providerIdentity: string;
  fieldLabelName: string;
  fieldLabelModel: string;
  fieldLabelEndpoint: string;
  fieldLabelApiKey: string;
  fieldLabelTemperature: string;
  fieldLabelTopP: string;
  fieldLabelMaxTokens: string;
  fieldLabelProviderId: string;
  previewOnly: string;
  duplicate: string;
  testConnection: string;
  deleteAction: string;
  saveChanges: string;
  promptsMeta: string;
  promptsTitle: string;
  promptsNote: string;
  promptSearchPlaceholder: string;
  addTask: string;
  taskMeta: string;
  taskProviderChain: string;
  taskTuning: string;
  taskPromptVariables: string;
  taskPromptBodies: string;
  fieldLabelTaskLabel: string;
  fieldLabelMode: string;
  fieldLabelSystemPrompt: string;
  fieldLabelUserPrompt: string;
  duplicateTask: string;
  dryRun: string;
  saveTask: string;
  themesMeta: string;
  themesTitle: string;
  themesNote: string;
  advancedMeta: string;
  advancedTitle: string;
  requestTimeoutLabel: string;
  requestTimeoutDescription: string;
  firstChunkTimeoutLabel: string;
  firstChunkTimeoutDescription: string;
  executionSnapshotTitle: string;
  executionSnapshotNote: string;
  fallbackStrategyTitle: string;
  fallbackStrategyDescription: string;
  lazyTaskTitle: string;
  lazyTaskDescription: string;
  displayLanguageOptionLabel: string;
  themeGalleryButtonLabel: string;
  themePreviewSelected: string;
  themePreviewNeighbor: string;
  themePreviewPopover: string;
};

export type UiCopyBundle = {
  settings: SettingsCopy;
};

export type UiDisplayLanguageOption = {
  id: UiDisplayLanguagePreference;
  label: string;
};

const UI_COPY: Record<ResolvedUiDisplayLanguage, UiCopyBundle> = {
  'zh-CN': {
    settings: {
      pageTitle: '网页解释设置',
      pageSubtitle: '以你认可的最终设计稿为蓝本，把 4.1 网页选中文本解释流程中的真实实体翻译成可运行的 WXT options 页面。当前版本已经接通“界面显示语言”“AI 输出语言”、Providers SCRUD 与 Prompt Tasks Phase 1，其余区域继续展示代码真相并保留后续扩展位。',
      scopeMeta: '范围 · 4.1 Webpage Selection Explain',
      settingsGroupTitle: 'Settings',
      foundationsGroupTitle: 'Foundations',
      navOverview: '总览',
      navProviders: '服务商',
      navPrompts: 'Prompt 任务',
      navThemes: '主题',
      navAdvanced: '高级',
      foundationBaseline: 'UI 基线',
      foundationSource: '实体来源',
      sidebarFooter: 'Settings Options · MVVM Slice',
      overviewMeta: '实体 · 总览',
      summaryTitle: '一份真正接到扩展里的 Settings 面板',
      summaryDescription: '这不是单纯把设计稿塞进 HTML，而是按 WXT MVVM slice 的方式，把 options surface、共享设置存储 seam 和页面内状态拆开。界面显示语言、AI 输出语言、Providers 和 Prompt Tasks 的 Phase 1 覆盖现在都会真实持久化并在重新打开页面后恢复。',
      summaryTagLanguages: '界面语言',
      summaryTagProviders: 'Provider 注册表',
      summaryTagPrompts: 'Prompt 任务编辑器',
      summaryTagThemes: 'Popover 主题画廊',
      summaryTagTimeouts: '运行时超时',
      metricProviders: '服务商',
      metricProvidersMeta: '来自实际 `PROVIDERS` 配置记录。',
      metricTasks: 'Prompt 任务',
      metricTasksMeta: 'Lexical / Etymology / Information。',
      metricThemes: '主题数',
      metricThemesMeta: '3 个 Free，4 个 Premium。',
      metricTimeout: '默认超时',
      metricTimeoutMeta: '首块等待 2.5 秒，总体 30 秒。',
      defaultsTitle: '默认行为',
      displayLanguageLabel: '界面显示语言',
      displayLanguageDescription: '这是本期真正接通的数据层设置。修改后会立即重绘当前 options 页面，并在下次打开时恢复。',
      outputLanguageLabel: 'AI 输出语言',
      outputLanguageDescription: '这是一条真实接通的数据层设置。修改后，后续 explain 请求会把所选语言注入 `{{lang}}` prompt 变量，并在下次打开时恢复。',
      currentThemeLabel: '当前默认主题',
      currentThemeDescription: 'Theme 画廊页支持本地预览切换；当前生产默认仍来自 4.1 popover 的真实默认值。',
      openThemeGallery: '打开 Theme Gallery',
      supportTruthTitle: '代码真相',
      supportTruthBody: 'Providers、Tasks、Themes 和 Timeouts 都从真实代码配置映射而来，不是设计稿自说自话。',
      supportBorrowingTitle: '视觉继承',
      supportBorrowingBody: '侧边栏、玻璃卡片、冷白底色与绿色主强调直接承接你指定的 UI 基线。',
      supportIntegrationTitle: '当前接入范围',
      supportIntegrationBody: '本轮已接通“界面显示语言”“AI 输出语言”、Providers 面板与 Prompt Tasks Phase 1 的真实读写路径；Themes 仍保持当前阶段的本地预览边界。',
      providersMeta: '实体 · Providers · SCRUD',
      providersTitle: '管理 Providers',
      providersNote: '左侧是 live Provider Registry，右侧是可写编辑器。Provider 页现在只维护 Provider 自身的元数据与 secret；任务关系改由 Prompt Tasks 页统一维护。',
      providerSearchPlaceholder: '搜索 Provider...',
      addProvider: '新增 Provider',
      providerCoreFields: '核心字段',
      providerConnection: '连接信息',
      providerParams: '采样参数',
      providerIdentity: 'Provider 标识',
      fieldLabelName: '名称',
      fieldLabelModel: '模型',
      fieldLabelEndpoint: '接口地址',
      fieldLabelApiKey: 'API Key',
      fieldLabelTemperature: 'Temperature',
      fieldLabelTopP: 'Top P',
      fieldLabelMaxTokens: 'Max Tokens',
      fieldLabelProviderId: 'Provider ID',
      previewOnly: '只读预览',
      duplicate: '复制',
      testConnection: '测试连接',
      deleteAction: '删除',
      saveChanges: '保存修改',
      promptsMeta: '实体 · Prompt Tasks · SCRUD',
      promptsTitle: '管理 Prompt 任务',
      promptsNote: '任务清单映射到 live task registry overlay。当前阶段可编辑系统任务的名称、输出模式、Prompt 正文、显式 fallback provider 顺序，以及每个 provider 在该任务下的执行参数，并可随时重置回默认。',
      promptSearchPlaceholder: '搜索 Prompt 任务...',
      addTask: '新建任务',
      taskMeta: '任务元数据',
      taskProviderChain: 'Fallback Providers',
      taskTuning: '任务执行参数',
      taskPromptVariables: 'Prompt 变量',
      taskPromptBodies: 'Prompt 正文',
      fieldLabelTaskLabel: '任务名称',
      fieldLabelMode: '输出模式',
      fieldLabelSystemPrompt: 'System Prompt',
      fieldLabelUserPrompt: 'User Prompt',
      duplicateTask: '复制任务',
      dryRun: '预演',
      saveTask: '保存任务',
      themesMeta: '实体 · Theme · R/U',
      themesTitle: 'Theme Gallery',
      themesNote: '这里保留你最喜欢的主卡 + 邻近卡 + 缩略选择结构。点击下方主题只会更新当前页面预览，不改写生产默认主题。',
      advancedMeta: '实体 · Timeouts · R/U',
      advancedTitle: '运行时超时',
      requestTimeoutLabel: 'REQUEST_TIMEOUT_MS',
      requestTimeoutDescription: '整次 explain 请求的总超时。当前真实值来自共享 LLM runtime 配置。',
      firstChunkTimeoutLabel: 'FIRST_CHUNK_TIMEOUT_MS',
      firstChunkTimeoutDescription: '等待首个流式块的时间上限。它决定“多久开始有响应”的感知。',
      executionSnapshotTitle: '执行快照',
      executionSnapshotNote: '高级页除了数值，还展示当前 4.1 运行方式，帮助理解这些设置的上下文。',
      fallbackStrategyTitle: 'Provider 回退策略',
      fallbackStrategyDescription: '当前 3 个任务都先尝试 `zhipu_glm4_flash`，失败后退到 `siliconflow_glm4_9b`。',
      lazyTaskTitle: 'Information 懒加载',
      lazyTaskDescription: 'Lexical 与 Etymology 会立即启动，Information 只有在对应标签被激活时才请求。',
      displayLanguageOptionLabel: '显示语言选项',
      themeGalleryButtonLabel: '打开主题页',
      themePreviewSelected: '当前选择',
      themePreviewNeighbor: '邻近主题',
      themePreviewPopover: 'Popover',
    },
  },
  en: {
    settings: {
      pageTitle: 'Webpage Explain Settings',
      pageSubtitle: 'This WXT options page translates the approved final design into a real MVVM surface for the 4.1 webpage selection explain flow. This phase fully wires UI display language, AI output language, Providers SCRUD, and Prompt Tasks Phase 1; the remaining sections keep rendering code-truth snapshots and future seams.',
      scopeMeta: 'Scope · 4.1 Webpage Selection Explain',
      settingsGroupTitle: 'Settings',
      foundationsGroupTitle: 'Foundations',
      navOverview: 'Overview',
      navProviders: 'Providers',
      navPrompts: 'Prompt Tasks',
      navThemes: 'Themes',
      navAdvanced: 'Advanced',
      foundationBaseline: 'UI Baseline',
      foundationSource: 'Entity Source',
      sidebarFooter: 'Settings Options · MVVM Slice',
      overviewMeta: 'Entity · Overview',
      summaryTitle: 'A real Settings surface wired into the extension',
      summaryDescription: 'This is not just a copied mockup. The options surface, the shared settings storage seam, and the page state are split along MVVM boundaries. UI display language, AI output language, Providers, and Prompt Tasks Phase 1 overrides now persist for real and restore on the next open.',
      summaryTagLanguages: 'Display Language',
      summaryTagProviders: 'Provider Registry',
      summaryTagPrompts: 'Prompt Task Editor',
      summaryTagThemes: 'Popover Theme Gallery',
      summaryTagTimeouts: 'Runtime Timeouts',
      metricProviders: 'Providers',
      metricProvidersMeta: 'Mapped from the real `PROVIDERS` config record.',
      metricTasks: 'Prompt Tasks',
      metricTasksMeta: 'Lexical / Etymology / Information.',
      metricThemes: 'Themes',
      metricThemesMeta: '3 free presets and 4 premium presets.',
      metricTimeout: 'Default Timeout',
      metricTimeoutMeta: '2.5s for first chunk, 30s overall.',
      defaultsTitle: 'Default Behavior',
      displayLanguageLabel: 'UI Display Language',
      displayLanguageDescription: 'This is the live setting wired in this phase. Changing it immediately re-renders the current options page and restores on the next open.',
      outputLanguageLabel: 'AI Output Language',
      outputLanguageDescription: 'This is now a live shared setting. Changing it updates the `{{lang}}` prompt variable used by future explain requests and restores on the next open.',
      currentThemeLabel: 'Current Default Theme',
      currentThemeDescription: 'The gallery below supports local preview switching. The production default still reflects the real 4.1 popover default.',
      openThemeGallery: 'Open Theme Gallery',
      supportTruthTitle: 'Code Truth',
      supportTruthBody: 'Providers, Tasks, Themes, and Timeouts are mapped from real code configuration rather than invented by the design layer.',
      supportBorrowingTitle: 'Visual Inheritance',
      supportBorrowingBody: 'The sidebar, glass cards, pale background, and green primary accent carry over directly from your chosen UI baseline.',
      supportIntegrationTitle: 'Current Integration Scope',
      supportIntegrationBody: 'This phase wires UI display language, AI output language, the Providers panel, and Prompt Tasks Phase 1 into live read/write paths. Themes keep their current local-preview boundary.',
      providersMeta: 'Entity · Providers · SCRUD',
      providersTitle: 'Manage Providers',
      providersNote: 'The left side renders the live provider registry. The right side is a writable editor. The Providers page now manages provider metadata and secrets only; task relationships are owned by Prompt Tasks.',
      providerSearchPlaceholder: 'Search providers...',
      addProvider: 'Add Provider',
      providerCoreFields: 'Core Fields',
      providerConnection: 'Connection',
      providerParams: 'Sampling Parameters',
      providerIdentity: 'Provider Identity',
      fieldLabelName: 'Label',
      fieldLabelModel: 'Model',
      fieldLabelEndpoint: 'Endpoint URL',
      fieldLabelApiKey: 'API Key',
      fieldLabelTemperature: 'Temperature',
      fieldLabelTopP: 'Top P',
      fieldLabelMaxTokens: 'Max Tokens',
      fieldLabelProviderId: 'Provider ID',
      previewOnly: 'Preview only',
      duplicate: 'Duplicate',
      testConnection: 'Test Connection',
      deleteAction: 'Delete',
      saveChanges: 'Save Changes',
      promptsMeta: 'Entity · Prompt Tasks · SCRUD',
      promptsTitle: 'Manage Prompt Tasks',
      promptsNote: 'The task list maps to the live task-registry overlay. This phase lets you edit system-task labels, output mode, prompt bodies, explicit fallback provider order, and per-provider execution tuning, then reset everything back to defaults at any time.',
      promptSearchPlaceholder: 'Search prompt tasks...',
      addTask: 'New Task',
      taskMeta: 'Task Meta',
      taskProviderChain: 'Fallback Providers',
      taskTuning: 'Task Execution Tuning',
      taskPromptVariables: 'Prompt Variables',
      taskPromptBodies: 'Prompt Bodies',
      fieldLabelTaskLabel: 'Task Label',
      fieldLabelMode: 'Mode',
      fieldLabelSystemPrompt: 'System Prompt',
      fieldLabelUserPrompt: 'User Prompt',
      duplicateTask: 'Duplicate Task',
      dryRun: 'Dry Run',
      saveTask: 'Save Task',
      themesMeta: 'Entity · Theme · R/U',
      themesTitle: 'Theme Gallery',
      themesNote: 'This keeps the preview structure you liked most: center hero card, neighboring cards, and a chip strip below. Clicking a theme only updates local preview in this phase.',
      advancedMeta: 'Entity · Timeouts · R/U',
      advancedTitle: 'Runtime Timeouts',
      requestTimeoutLabel: 'REQUEST_TIMEOUT_MS',
      requestTimeoutDescription: 'The total timeout for a full explain request. The current value comes from shared runtime config.',
      firstChunkTimeoutLabel: 'FIRST_CHUNK_TIMEOUT_MS',
      firstChunkTimeoutDescription: 'The limit for waiting on the first streamed chunk. It controls perceived response start.',
      executionSnapshotTitle: 'Execution Snapshot',
      executionSnapshotNote: 'The advanced page includes behavioral context, not only raw numbers, so users can understand how 4.1 currently runs.',
      fallbackStrategyTitle: 'Provider Fallback Strategy',
      fallbackStrategyDescription: 'All three tasks currently try `zhipu_glm4_flash` first, then fall back to `siliconflow_glm4_9b`.',
      lazyTaskTitle: 'Information Lazy Loading',
      lazyTaskDescription: 'Lexical and Etymology start immediately. Information starts only when its tab becomes active.',
      displayLanguageOptionLabel: 'Display language option',
      themeGalleryButtonLabel: 'Open theme page',
      themePreviewSelected: 'Selected',
      themePreviewNeighbor: 'Neighbor',
      themePreviewPopover: 'Popover',
    },
  },
};

export function resolveUiDisplayLanguage(
  preference: UiDisplayLanguagePreference,
  navigatorLanguage = 'en',
): ResolvedUiDisplayLanguage {
  if (preference === 'zh-CN' || preference === 'en') {
    return preference;
  }

  return navigatorLanguage.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

export function getUiCopy(language: ResolvedUiDisplayLanguage): UiCopyBundle {
  return UI_COPY[language];
}

export function getUiDisplayLanguageOptions(
  language: ResolvedUiDisplayLanguage,
): readonly UiDisplayLanguageOption[] {
  return language === 'zh-CN'
    ? [
        { id: 'system', label: '跟随系统' },
        { id: 'zh-CN', label: '简体中文' },
        { id: 'en', label: 'English' },
      ]
    : [
        { id: 'system', label: 'Follow system' },
        { id: 'zh-CN', label: '简体中文' },
        { id: 'en', label: 'English' },
      ];
}