export type UiDisplayLanguagePreference = 'system' | 'zh-CN' | 'en';

export type ResolvedUiDisplayLanguage = 'zh-CN' | 'en';

export type SettingsCopy = {
  pageTitle: string;
  pageSubtitle: string;
  scopeMeta: string;
  settingsGroupTitle: string;
  navOverview: string;
  navProviders: string;
  navPrompts: string;
  navTts: string;
  navThemes: string;
  navAdvanced: string;
  navCards: string;
  summaryTitle: string;
  summaryDescription: string;
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
  providersMeta: string;
  providersTitle: string;
  providersNote: string;
  providerSearchPlaceholder: string;
  addProvider: string;
  providerCoreFields: string;
  providerConnection: string;
  providerIdentity: string;
  fieldLabelName: string;
  fieldLabelModel: string;
  fieldLabelEndpoint: string;
  fieldLabelApiKey: string;
  fieldLabelTemperature: string;
  fieldLabelTopP: string;
  fieldLabelMaxTokens: string;
  fieldLabelProviderId: string;
  duplicate: string;
  testConnection: string;
  deleteAction: string;
  saveChanges: string;
  promptsMeta: string;
  promptsTitle: string;
  promptsNote: string;
  ttsMeta: string;
  ttsSourcesTitle: string;
  ttsNote: string;
  ttsSetDefault: string;
  ttsVoiceSection: string;
  ttsVoiceZhLabel: string;
  ttsVoiceEnLabel: string;
  ttsAzureSection: string;
  ttsAzureRegionLabel: string;
  ttsAzureVoiceZhLabel: string;
  ttsAzureVoiceEnLabel: string;
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
  dryRun: string;
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
  themePreviewSelected: string;
  themePreviewNeighbor: string;
  themePreviewPopover: string;
  cardsNote: string;
  cardSearchPlaceholder: string;
  cardCategoryFilterAll: string;
  cardPinnedFilterAll: string;
  cardPinnedFilterPinned: string;
  cardPinnedFilterUnpinned: string;
  fieldLabelCardTitle: string;
  fieldLabelCardNote: string;
  fieldLabelCardCategory: string;
  fieldLabelCardTags: string;
  fieldLabelCardTagsHint: string;
  fieldLabelCardPinned: string;
  saveCard: string;
  deleteCard: string;
  regenerateCover: string;
  cardSaved: string;
  cardSaveFailed: string;
  cardDeleted: string;
  cardDeleteFailed: string;
  coverRefreshed: string;
  coverRefreshFailed: string;
  cardDiscardSelect: string;
  cardDiscardDelete: string;
  cardEmptyState: string;
  cardSectionTitle: string;
  cardCategoryWord: string;
  cardCategoryPhrase: string;
  cardCategoryTerm: string;
  cardCategoryConcept: string;
  cardCategorySentence: string;
  cardCategoryGeneral: string;
  cardTagFilterAll: string;
  cardClearFilters: string;
  cardResultsSummary: string;
  cardResultsActiveFilters: string;
  cardEdit: string;
  cardOpen: string;
  cardPin: string;
  cardUnpin: string;
  cardDelete: string;
  cardInlineEditTitle: string;
  cardInlineEditCancel: string;
  cardInlineEditSave: string;
  cardEmptyGallery: string;
  cardEmptyTable: string;
  cardCoverAlt: string;
  cardTableHeaderCard: string;
  cardTableHeaderTags: string;
  cardTableHeaderActions: string;
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
      pageTitle: '小猹设置',
      pageSubtitle: '管理界面语言、AI 输出语言、服务商、Prompt 任务与主题。',
      scopeMeta: '小猹 · 设置',
      settingsGroupTitle: '设置',
      navOverview: '总览',
      navProviders: '服务商',
      navPrompts: 'Prompt 任务',
      navTts: '语音朗读',
      navThemes: '主题',
      navAdvanced: '高级',
      navCards: '卡片库',
      summaryTitle: '让小猹按你的方式工作',
      summaryDescription: '在这里调整界面与 AI 输出语言、管理服务商和 Prompt 任务、挑选主题。修改会自动保存，下次打开时生效。',
      metricProviders: '服务商',
      metricProvidersMeta: '已配置的 AI 服务商。',
      metricTasks: 'Prompt 任务',
      metricTasksMeta: '内置的解释任务。',
      metricThemes: '主题数',
      metricThemesMeta: '3 个免费，4 个高级。',
      metricTimeout: '默认超时',
      metricTimeoutMeta: '首块 2.5 秒，整体 30 秒。',
      defaultsTitle: '默认行为',
      displayLanguageLabel: '界面显示语言',
      displayLanguageDescription: '设置页面使用的语言，修改后立即生效。',
      outputLanguageLabel: 'AI 输出语言',
      outputLanguageDescription: '小猹给出解释时使用的语言。',
      currentThemeLabel: '当前默认主题',
      currentThemeDescription: '解释面板使用的主题，可在主题页预览并切换。',
      openThemeGallery: '挑选主题',
      providersMeta: 'AI 服务商',
      providersTitle: '管理服务商',
      providersNote: '维护服务商的接口地址与密钥；每个任务使用哪些服务商，在 Prompt 任务页设置。',
      providerSearchPlaceholder: '搜索服务商...',
      addProvider: '新增服务商',
      providerCoreFields: '核心字段',
      providerConnection: '连接信息',
      providerIdentity: '服务商标识',
      fieldLabelName: '名称',
      fieldLabelModel: '模型',
      fieldLabelEndpoint: '接口地址',
      fieldLabelApiKey: 'API Key',
      fieldLabelTemperature: 'Temperature',
      fieldLabelTopP: 'Top P',
      fieldLabelMaxTokens: 'Max Tokens',
      fieldLabelProviderId: 'Provider ID',
      duplicate: '复制',
      testConnection: '测试连接',
      deleteAction: '删除',
      saveChanges: '保存修改',
      promptsMeta: 'Prompt 任务',
      promptsTitle: '管理 Prompt 任务',
      promptsNote: '调整每个任务的名称、输出模式、Prompt 内容与服务商顺序，可随时恢复默认。',
      ttsMeta: 'TTS 语音源',
      ttsSourcesTitle: '语音来源',
      ttsNote: '选择解释结果的朗读声音；断网时智能默认会自动切到系统语音。',
      ttsSetDefault: '设为默认',
      ttsVoiceSection: '浏览器语音音色',
      ttsVoiceZhLabel: '中文音色',
      ttsVoiceEnLabel: '英文音色',
      ttsAzureSection: 'Azure 语音配置',
      ttsAzureRegionLabel: 'Region',
      ttsAzureVoiceZhLabel: '中文音色名',
      ttsAzureVoiceEnLabel: '英文音色名',
      promptSearchPlaceholder: '搜索 Prompt 任务...',
      addTask: '新建任务',
      taskMeta: '任务信息',
      taskProviderChain: '服务商顺序',
      taskTuning: '任务执行参数',
      taskPromptVariables: 'Prompt 变量',
      taskPromptBodies: 'Prompt 内容',
      fieldLabelTaskLabel: '任务名称',
      fieldLabelMode: '输出模式',
      fieldLabelSystemPrompt: 'System Prompt',
      fieldLabelUserPrompt: 'User Prompt',
      dryRun: '预演',
      themesMeta: '主题',
      themesTitle: '主题画廊',
      themesNote: '点击任意主题即可在上方预览效果。',
      advancedMeta: '高级',
      advancedTitle: '运行时超时',
      requestTimeoutLabel: '请求总超时',
      requestTimeoutDescription: '一次解释请求的最长等待时间。',
      firstChunkTimeoutLabel: '首块响应超时',
      firstChunkTimeoutDescription: '等待首个响应的最长时间，决定“多久开始有反应”。',
      executionSnapshotTitle: '当前执行方式',
      executionSnapshotNote: '查看超时设置与各任务当前的执行顺序。',
      fallbackStrategyTitle: '服务商回退顺序',
      fallbackStrategyDescription: '每个任务按顺序尝试服务商，失败时自动切换到下一个。',
      lazyTaskTitle: '按需加载',
      lazyTaskDescription: '词义与词源会立即加载，背景信息在打开对应标签时才请求。',
      themePreviewSelected: '当前选择',
      themePreviewNeighbor: '邻近主题',
      themePreviewPopover: 'Popover',
      cardsNote: '这里列出所有从 popover 中点赞保存的卡片。支持搜索、按分类/置顶筛选，以及编辑标题、备注、分类、标签和置顶状态。',
      cardSearchPlaceholder: '搜索卡片...',
      cardCategoryFilterAll: '全部分类',
      cardPinnedFilterAll: '全部状态',
      cardPinnedFilterPinned: '已置顶',
      cardPinnedFilterUnpinned: '未置顶',
      fieldLabelCardTitle: '标题',
      fieldLabelCardNote: '备注',
      fieldLabelCardCategory: '分类',
      fieldLabelCardTags: '标签',
      fieldLabelCardTagsHint: '用逗号分隔多个标签',
      fieldLabelCardPinned: '置顶',
      saveCard: '保存修改',
      deleteCard: '删除卡片',
      regenerateCover: '重新生成封面',
      cardSaved: '卡片已保存。',
      cardSaveFailed: '保存卡片失败。',
      cardDeleted: '卡片已删除。',
      cardDeleteFailed: '删除卡片失败。',
      coverRefreshed: '封面已重新生成。',
      coverRefreshFailed: '封面重新生成失败。',
      cardDiscardSelect: '当前卡片有未保存的修改，确定要切换到其他卡片吗？',
      cardDiscardDelete: '当前卡片有未保存的修改，确定要删除吗？',
      cardEmptyState: '暂无卡片。在网页上选中文本并使用小猹解释后，点击 👍 即可保存。',
      cardSectionTitle: 'AI 输出片段',
      cardCategoryWord: '单词',
      cardCategoryPhrase: '短语',
      cardCategoryTerm: '术语',
      cardCategoryConcept: '概念',
      cardCategorySentence: '句子',
      cardCategoryGeneral: '通用',
      cardTagFilterAll: '全部标签',
      cardClearFilters: '清除筛选',
      cardResultsSummary: '{{filtered}} / {{total}} 张',
      cardResultsActiveFilters: '{{count}} 个活跃筛选',
      cardEdit: '编辑',
      cardOpen: '打开来源页',
      cardPin: '置顶',
      cardUnpin: '取消置顶',
      cardDelete: '删除',
      cardInlineEditTitle: '编辑卡片元数据',
      cardInlineEditCancel: '取消',
      cardInlineEditSave: '保存',
      cardEmptyGallery: '没有符合条件的卡片。',
      cardEmptyTable: '暂无卡片。在网页上选中文本并使用小猹解释后，点击 👍 即可保存。',
      cardCoverAlt: '{{title}} 封面',
      cardTableHeaderCard: '卡片',
      cardTableHeaderTags: '标签',
      cardTableHeaderActions: '操作',
    },
  },
  en: {
    settings: {
      pageTitle: 'Xiaocha Settings',
      pageSubtitle: 'Manage display language, AI output language, providers, prompt tasks, and themes.',
      scopeMeta: 'Xiaocha · Settings',
      settingsGroupTitle: 'Settings',
      navOverview: 'Overview',
      navProviders: 'Providers',
      navPrompts: 'Prompt Tasks',
      navTts: 'Voice & TTS',
      navThemes: 'Themes',
      navAdvanced: 'Advanced',
      navCards: 'Library',
      summaryTitle: 'Make Xiaocha work your way',
      summaryDescription: 'Adjust display and AI output languages, manage providers and prompt tasks, and pick a theme. Changes save automatically and apply the next time you open this page.',
      metricProviders: 'Providers',
      metricProvidersMeta: 'Your configured AI providers.',
      metricTasks: 'Prompt Tasks',
      metricTasksMeta: 'Built-in explain tasks.',
      metricThemes: 'Themes',
      metricThemesMeta: '3 free, 4 premium.',
      metricTimeout: 'Default Timeout',
      metricTimeoutMeta: '2.5s first chunk, 30s overall.',
      defaultsTitle: 'Defaults',
      displayLanguageLabel: 'Display Language',
      displayLanguageDescription: 'The language used by the settings page. Applies immediately.',
      outputLanguageLabel: 'AI Output Language',
      outputLanguageDescription: 'The language Xiaocha uses for explanations.',
      currentThemeLabel: 'Current Theme',
      currentThemeDescription: 'The theme used by the explain popover. Preview and switch on the Themes page.',
      openThemeGallery: 'Browse Themes',
      providersMeta: 'AI Providers',
      providersTitle: 'Manage Providers',
      providersNote: 'Maintain provider endpoints and API keys here. Which providers each task uses is configured on the Prompt Tasks page.',
      providerSearchPlaceholder: 'Search providers...',
      addProvider: 'Add Provider',
      providerCoreFields: 'Basics',
      providerConnection: 'Connection',
      providerIdentity: 'Provider Identity',
      fieldLabelName: 'Name',
      fieldLabelModel: 'Model',
      fieldLabelEndpoint: 'Endpoint URL',
      fieldLabelApiKey: 'API Key',
      fieldLabelTemperature: 'Temperature',
      fieldLabelTopP: 'Top P',
      fieldLabelMaxTokens: 'Max Tokens',
      fieldLabelProviderId: 'Provider ID',
      duplicate: 'Duplicate',
      testConnection: 'Test Connection',
      deleteAction: 'Delete',
      saveChanges: 'Save Changes',
      promptsMeta: 'Prompt Tasks',
      promptsTitle: 'Manage Prompt Tasks',
      promptsNote: 'Adjust each task’s name, output mode, prompt content, and provider order. You can reset to defaults at any time.',
      ttsMeta: 'TTS Sources',
      ttsSourcesTitle: 'Voice Sources',
      ttsNote: 'Pick the read-aloud voice for explanations. Smart Default falls back to system voices when offline.',
      ttsSetDefault: 'Set as Default',
      ttsVoiceSection: 'Browser Voices',
      ttsVoiceZhLabel: 'Chinese Voice',
      ttsVoiceEnLabel: 'English Voice',
      ttsAzureSection: 'Azure Speech Setup',
      ttsAzureRegionLabel: 'Region',
      ttsAzureVoiceZhLabel: 'Chinese Voice Name',
      ttsAzureVoiceEnLabel: 'English Voice Name',
      promptSearchPlaceholder: 'Search prompt tasks...',
      addTask: 'New Task',
      taskMeta: 'Task Info',
      taskProviderChain: 'Provider Order',
      taskTuning: 'Task Execution Tuning',
      taskPromptVariables: 'Prompt Variables',
      taskPromptBodies: 'Prompt Content',
      fieldLabelTaskLabel: 'Task Name',
      fieldLabelMode: 'Output Mode',
      fieldLabelSystemPrompt: 'System Prompt',
      fieldLabelUserPrompt: 'User Prompt',
      dryRun: 'Dry Run',
      themesMeta: 'Themes',
      themesTitle: 'Theme Gallery',
      themesNote: 'Click any theme to preview it above.',
      advancedMeta: 'Advanced',
      advancedTitle: 'Runtime Timeouts',
      requestTimeoutLabel: 'Request Timeout',
      requestTimeoutDescription: 'The maximum wait for a full explain request.',
      firstChunkTimeoutLabel: 'First Chunk Timeout',
      firstChunkTimeoutDescription: 'The maximum wait for the first response, controlling how soon feedback appears.',
      executionSnapshotTitle: 'How It Runs',
      executionSnapshotNote: 'Review timeouts and how tasks currently run.',
      fallbackStrategyTitle: 'Provider Fallback Order',
      fallbackStrategyDescription: 'Each task tries providers in order and automatically moves to the next one on failure.',
      lazyTaskTitle: 'Lazy Loading',
      lazyTaskDescription: 'Lexical and etymology results load immediately; background information loads only when you open its tab.',
      themePreviewSelected: 'Selected',
      themePreviewNeighbor: 'Neighbor',
      themePreviewPopover: 'Popover',
      cardsNote: 'All cards saved by liking an explanation in the popover. Search, filter by category or pin status, and edit title, note, category, tags, and pinned state.',
      cardSearchPlaceholder: 'Search cards...',
      cardCategoryFilterAll: 'All categories',
      cardPinnedFilterAll: 'All statuses',
      cardPinnedFilterPinned: 'Pinned',
      cardPinnedFilterUnpinned: 'Unpinned',
      fieldLabelCardTitle: 'Title',
      fieldLabelCardNote: 'Note',
      fieldLabelCardCategory: 'Category',
      fieldLabelCardTags: 'Tags',
      fieldLabelCardTagsHint: 'Separate tags with commas',
      fieldLabelCardPinned: 'Pinned',
      saveCard: 'Save Changes',
      deleteCard: 'Delete Card',
      regenerateCover: 'Regenerate Cover',
      cardSaved: 'Card saved.',
      cardSaveFailed: 'Failed to save card.',
      cardDeleted: 'Card deleted.',
      cardDeleteFailed: 'Failed to delete card.',
      coverRefreshed: 'Cover regenerated.',
      coverRefreshFailed: 'Failed to regenerate cover.',
      cardDiscardSelect: 'You have unsaved changes. Switch to another card anyway?',
      cardDiscardDelete: 'You have unsaved changes. Delete this card anyway?',
      cardEmptyState: 'No cards yet. Select text on a page, ask Xiaocha to explain, and tap 👍 to save.',
      cardSectionTitle: 'AI Output Sections',
      cardCategoryWord: 'Word',
      cardCategoryPhrase: 'Phrase',
      cardCategoryTerm: 'Term',
      cardCategoryConcept: 'Concept',
      cardCategorySentence: 'Sentence',
      cardCategoryGeneral: 'General',
      cardTagFilterAll: 'All tags',
      cardClearFilters: 'Clear filters',
      cardResultsSummary: '{{filtered}} / {{total}} shown',
      cardResultsActiveFilters: '{{count}} active filters',
      cardEdit: 'Edit',
      cardOpen: 'Open source page',
      cardPin: 'Pin',
      cardUnpin: 'Unpin',
      cardDelete: 'Delete',
      cardInlineEditTitle: 'Edit card metadata',
      cardInlineEditCancel: 'Cancel',
      cardInlineEditSave: 'Save',
      cardEmptyGallery: 'No cards match the current filters.',
      cardEmptyTable: 'No cards yet. Select text on a page, ask Xiaocha to explain, and tap 👍 to save.',
      cardCoverAlt: '{{title}} cover',
      cardTableHeaderCard: 'Card',
      cardTableHeaderTags: 'Tags',
      cardTableHeaderActions: 'Actions',
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
