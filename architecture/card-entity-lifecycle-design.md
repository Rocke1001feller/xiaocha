# 小猹 Card 实体全生命周期架构与接口设计

> 阶段：Phase 2 — 业务逻辑抽象与接口设计  
> 目标：把「选中 → 解释 → Like/Dislike → 收藏 → 管理」这一完整用户旅程抽象成稳定、可扩展的 Card 实体体系，用于指导后续实现。  
> 方法：`settings-entity-scrud` 的 `Entity + Scope + Resolution + Persistence + Consumer + Operations + Capability Boundary`。

---

## 1. Surface And Goal

- **Surface under review**: 小猹主交互流程（content script popover → background LLM 流式解释 → options 自定义 task → 收藏与管理）以及未来的 popup / options 卡片库页面。
- **User goal**: 在任意网页遇到不认识的单词或术语，选中后立刻获得多维度 AI 解释；若内容有价值，一键收藏为可回顾、可检索、可管理的 Card；若不满意可重试；同时支持用户自定义解释任务。
- **Product scope**: Card 实体的创建、读取、更新、删除、搜索、分类、封面、Like/Dislike/Retry 语义、跨上下文同步。
- **Out-of-scope**: 本次设计不涉及 Card 的具体 UI 实现、具体封面 AI 生成模型、第三方同步/导出、付费 tier 限制。

---

## 2. Real Entities In Code

只列出代码中已经真实存在的实体。

| Entity | Type | Scope | Persistence | Primary Consumers | Operations | Current State |
|---|---|---|---|---|---|---|
| `PopoverSelectionData` / `ExplainSelection` | transport envelope | session / ephemeral | 无持久化 | `PopoverFeature`, `PopoverViewModel`, `RuntimePopoverRepository`, background `runExplainTask` | 内部 `R`（读取页面选择） | 已存在，稳定 |
| `ExplainTaskResult` / `ExplainTaskState` | transport envelope + UI state | session | 内存 | `PopoverViewModel`, `OriginalPopoverView` | 内部 `CR`（流式更新） | 已存在，稳定 |
| `ProviderConfig` / 自定义 Provider | policy/profile | global | `local:provider-configs` + `local:provider-secrets` | `ProviderRegistryService`, `TaskRegistryService`, LLM client | `SCRUD` + disable/reset/test | 已存在，完整 |
| `TaskConfig` / 自定义 Task | policy/profile | global | `local:task-configs` | `TaskRegistryService`, `RuntimePopoverRepository` | `SCRUD` + provider chain resolution | 已存在，完整 |
| `ui-display-language` / `ai-output-language` | scalar preference | global | `local:...` / `localStorage` fallback | 选项页、LLM prompt | `R/U` | 已存在，完整 |
| `PopoverThemeId` | scalar preference | global/session | 当前仅在内存 | `PopoverViewModel` | `R/U` | 存在但尚未持久化 |

---

## 3. Missing Or Implied Entities

产品语言里已经存在、但代码尚未干净建模的概念。

| Implied Entity | Why It Is Needed | Missing Layer | Risk If Ignored |
|---|---|---|---|
| `SavedCard`（收藏卡片） | 用户主动 Like 后需要一个可持久化、可检索、可 reopen 的知识资产 | 独立的 record/library 层 | 会把临时 transport state 错当成用户资产，导致无法搜索、无法跨页复用 |
| `CardSection`（卡片内容切片） | 一个 Card 由「选中原文 + 多个 task 输出」组成，每个 task 输出都是独立切片 | 卡片内部子实体 / 快照 | 后续 task 被删除/改名后，已收藏卡片的内容来源会丢失 |
| `CardCover` / `CoverSpec`（封面） | 产品明确要求 Card 有封面；封面策略会变化（纯色/渐变/AI图/用户上传） | 封面生成抽象层 | 把封面实现和 Card 存储耦合，导致后续换策略要改 Card schema |
| `CardCategory` + `SubjectTag`（类别与学科标签） | 支持后续分类浏览、筛选、推荐 | 分类/标签模型与解析服务 | 直接用无结构字符串会导致筛选口径不一致 |
| `CardFeedback` / `DislikeSignal`（Like/Dislike 反馈） | Dislike 不仅是「关闭」，而是「这次解释不满意，重试」；Like 是「提升为 Card」 | 反馈/重试会话实体 | Like/Dislike 语义混乱会让用户动作与数据状态错位 |
| `CardSearchIndex`（搜索索引投影） | 选项页需要按标题、原文、标签、内容片段搜索 | 存储层预计算投影 | 搜索逻辑散落在 UI，性能差且不可测试 |
| `CardDraft`（当前 popover 会话草稿） | Retry 时需要保留原文和已尝试的 task/provider 路径，避免重复 | session/transport 层 | 重试时丢失上下文，用户体验断裂 |

---

## 4. Entity Matrix

把语义契约显式化。核心实体是 `SavedCard`；其它实体围绕它协作。

| Entity | Semantic Meaning | Mutable Fields | Immutable Fields | Identifier Strategy | Notes |
|---|---|---|---|---|---|
| `SavedCard` | 用户确认收藏后的知识资产：原文 + 多 task 输出快照 + 元数据 + 封面 | `title`, `note`, `category`, `subjectTags`, `cover`, `pinned`, `updatedAt` | `id`, `createdAt`, `source`（来源页快照）, `selectionText`, `sections[]` | `card:${uuid}` / nanoid | 真正的 library entity |
| `CardSection` | 某一次解释输出的快照 | 无（只读快照） | `taskId`, `taskLabelSnapshot`, `mode`, `content`, `providerLabelSnapshot`, `generatedAt` | 复合：`${cardId}#${taskId}` | 与运行时 TaskConfig 解耦 |
| `CardSource` | 卡片来源的页面上下文快照 | 无 | `url`, `hostname`, `pageTitle`, `selectionRect`, `surroundingContext` | 内嵌于 Card | 用于 reopen 与来源追溯 |
| `CardCover` | 封面表达：可能是生成的 SVG data URL、用户上传 data URL、外部 URL、或生成参数 | `uri`, `type`, `alt` | `createdAt` | 内嵌于 Card | 通过 `ICardCoverResolver` 抽象生成 |
| `CardCategory` | 单张卡片的分类（如 word/phrase/concept/term） | `value` | 受控词表 | 字符串，受 `CardTaxonomy` 约束 | 默认可自动推断 |
| `SubjectTag` | 学科/主题标签（如 cs/physics/history） | 用户自由增删 | 无 | 字符串数组 | 与 category 分开 |
| `CardFeedback` | 一次 Like/Dislike 动作记录 | 无 | `cardId`, `kind`, `taskId`, `reason`, `createdAt` | `feedback:${uuid}` | Dislike 触发 Retry，不直接删 Card |
| `CardDraft` | 当前 popover 会话的临时状态 | `attemptedTaskIds`, `dislikedTaskIds` | `selection` | session key | 仅在 popover 打开期间存在 |
| `CardSearchIndex` | 用于前端过滤/搜索的预计算投影 | `text` | `cardId` | `search-index:${cardId}` | 可随 Card 写入同步更新 |

---

## 5. Scope And Resolution Chain

### Scope 划分

| Scope | 说明 | 代表实体 |
|---|---|---|
| **Product Default** | 产品硬编码默认值 | 默认 category 词表、默认 cover 配色、默认排序 |
| **Global** | 用户级长期偏好/策略 | AI output language、display language、默认 Card 排序、自定义 Provider/Task |
| **Record** | 单张 Card 自身数据 | `SavedCard` 全部字段 |
| **Session** | 当前 popover 会话 | `CardDraft`、当前重试上下文 |

### 推荐生效链

```text
record value > global preference > product default
```

- 单张 Card 的 `category`、`tags`、`cover`、`pinned` 是最高优先级。
- 全局偏好只影响「创建时的默认值」和「列表默认排序」。
- 不引入 session override 到 Card 持久字段，避免用户搞不清楚哪些修改会被保存。

### Resolver Owner

- `CardTaxonomyResolver`：负责 category 词表校验与自动推断。
- `CardCoverResolver`：负责根据 Card 数据生成/解析封面。
- `CardSearchIndexResolver`：负责把 Card 投影为可搜索文本。

---

## 6. Persistence And Consumer Map

| Entity | Storage Layer | Lifetime | Write Path | Read Path | Consumers |
|---|---|---|---|---|---|
| `SavedCard` | `local:cards`（WXT `storage.defineItem` 对象 map） | 长期 | Popover Like、Options 编辑保存 | Options 卡片库、Popup、Background 搜索 | OptionsPage、Popup、 future LibrarySurface |
| `CardSection[]` | 内嵌于 `SavedCard` | 长期 | 同 Card | 同 Card | CardDetailView、ReopenFlow |
| `CardSearchIndex` | 内嵌于 `SavedCard.searchIndexText` 或独立 `local:card-search-index` | 长期 | CardRepository 写入时更新 | Options 搜索过滤 | OptionsPage filters |
| `CardCover` | 内嵌于 `SavedCard.cover`（小型 data URL / 生成参数） | 长期 | CoverResolver 生成后写入 | Gallery/Table 封面展示 | CardGallery、CardTable |
| `CardDraft` | in-memory Observable in `PopoverViewModel` | 当前 popover 会话 | PopoverFeature 打开选择时创建 | PopoverViewModel 重试逻辑 | PopoverFeature、PopoverViewModel |
| `CardFeedback` | 当前不持久化；未来可进入 `local:card-feedback` 或遥测 | 当前会话/长期 | Like/Dislike 动作 | Retry 决策、未来推荐 | PopoverViewModel |

### 存储结构设计

```ts
// 推荐：cards 存储为以 card id 为 key 的 object map
// storage.defineItem<Record<CardId, SavedCard>>('local:cards')
// 便于单条读写、监听变化、未来迁移到 indexedDB 时不改 consumer 接口。
```

---

## 7. Capability Boundary Notes

1. **First-class semantic entities**：
   - `SavedCard`、`CardSection`、`CardSource`、`CardCover`、`CardCategory`、`SubjectTag`、`CardDraft`、`CardFeedback`。
2. **Rendering/formatting byproducts only**：
   - Gallery 中的左/中/右布局、table 行高亮、封面圆角——这些是 UI 渲染产物，不应进入实体。
   - `searchIndexText` 是派生投影，不属于用户语义，但属于存储契约。
3. **Fake if exposed today**：
   - AI 生成封面图片：当前可以先做「基于 category 的确定性渐变/几何封面」，把接口留好，后续替换实现即可。
   - 自动学科分类：当前可以做简单启发式，复杂 NLP 分类走后续插件实现。
   - 卡片导入/导出：不在本次 scope。

---

## 8. Naming And IA Risks

- **Misleading names**：
  - `saved-chats-static.html` 借用了 "Saved Chats" 名词，但小猹的实体不是 chat，而是 "Card"。建议后续页面标题用 **Saved Cards / 我的卡片**。
  - 不要把 `PopoverSelectionData` 直接改名为 Card；它是 transport envelope。
- **Placeholder surfaces**：
  - 当前 `popup.html` 只是占位；未来 popup 才是真正的卡片库轻量入口。
- **Dead settings with no consumer**：
  - `PopoverThemeId` 目前只在内存中循环；如果后续 theme 需要持久化，应进入 scalar preference 层。
- **Concepts that should move between options/popup/page-level UI**：
  - Provider/Task 管理：保留在 options。
  - Card 库管理：主表面在 options，popup 只提供最近/收藏快捷入口。
  - Like/Dislike/Retry：属于 popover 动作，数据进入 Card/Feedback 层。

---

## 9. Recommended Schema / Model Changes

### 9.1 核心类型定义（TypeScript）

```ts
// --- 标识符 ---
export type CardId = `card:${string}`;
export type FeedbackId = `feedback:${string}`;

// --- 来源快照 ---
export type CardSource = {
  url: string;
  hostname: string;
  pageTitle?: string;
  selectionText: string;
  surroundingContext: string;
  trigger: 'text-selection' | 'block-click';
  rect?: ViewportRect;
  savedAt: number;
};

// --- 内容切片 ---
export type CardSection = {
  taskId: TaskId;
  taskLabelSnapshot: string;          // 防止自定义任务后续改名/删除后无法展示
  mode: 'json' | 'markdown';
  content: string;
  reasoning: string;
  providerLabelSnapshot: string;
  generatedAt: number;
};

// --- 封面 ---
export type CardCoverType = 'generated-gradient' | 'generated-svg' | 'data-url' | 'external-url';

export type CardCover = {
  type: CardCoverType;
  uri: string;                        // data URL 或外部 URL
  alt: string;
  generatedAt: number;
};

// --- 分类与标签 ---
export type CardCategory =
  | 'word'          // 单词
  | 'phrase'        // 短语
  | 'term'          // 术语
  | 'concept'       // 概念
  | 'sentence'      // 句子
  | 'general';      // 通用

export type SubjectTag = string;

// --- 主实体：SavedCard ---
export type SavedCard = {
  id: CardId;
  version: 1;                         // schema 版本，便于迁移

  title: string;                      // 默认 = selectionText 截断，用户可改
  note: string;                       // 用户备注

  source: CardSource;
  sections: CardSection[];

  category: CardCategory;
  subjectTags: SubjectTag[];

  cover: CardCover;
  pinned: boolean;

  searchIndexText: string;            // 预计算搜索投影

  createdAt: number;
  updatedAt: number;
};

// --- 创建/更新 DTO（显式区分可写字段） ---
export type CreateCardInput = {
  source: CardSource;
  sections: CardSection[];
};

export type UpdateCardInput = {
  title?: string;
  note?: string;
  category?: CardCategory;
  subjectTags?: SubjectTag[];
  cover?: CardCover;
  pinned?: boolean;
};
```

### 9.2 Repository 接口（OCP / 稳定契约）

```ts
export interface ICardRepository {
  // SCRUD
  create(input: CreateCardInput): Promise<SavedCard>;
  list(): Promise<SavedCard[]>;
  read(id: CardId): Promise<SavedCard | null>;
  update(id: CardId, input: UpdateCardInput): Promise<SavedCard>;
  delete(id: CardId): Promise<void>;

  // Search / Filter（可在 repository 层预过滤，减少 UI 负担）
  search(query: string, filters?: CardFilter): Promise<SavedCard[]>;

  // 变化监听（跨上下文同步关键）
  onChanged(callback: (cards: SavedCard[]) => void): () => void;
}

export type CardFilter = {
  category?: CardCategory;
  tag?: SubjectTag;
  pinned?: boolean;
};
```

### 9.3 封面与分类抽象（变化速率隔离）

```ts
// 封面生成策略接口：稳定契约，实现可替换
export interface ICardCoverResolver {
  resolve(card: SavedCard | CreateCardInput): Promise<CardCover>;
}

// 分类推断与校验：稳定契约，策略可替换
export interface ICardTaxonomyResolver {
  inferCategory(input: CreateCardInput): Promise<CardCategory>;
  inferSubjectTags(input: CreateCardInput): Promise<SubjectTag[]>;
  isValidCategory(value: string): value is CardCategory;
}

// 搜索投影生成
export interface ICardSearchIndexResolver {
  buildIndexText(card: SavedCard): string;
}
```

### 9.4 Card 工厂 / Service（编排创建流程）

```ts
export interface ICardLifecycleService {
  // 由 PopoverViewModel 在 Like 时调用
  saveFromPopover(
    selection: PopoverSelectionData,
    taskResults: Record<TaskId, ExplainTaskResult>,
  ): Promise<SavedCard>;

  // 重试：基于已有 Card 或 Draft 重新执行某个 task
  retryTask(cardId: CardId, taskId: TaskId): Promise<CardSection>;

  // 生成/刷新封面
  refreshCover(cardId: CardId): Promise<SavedCard>;
}
```

### 9.5 Like / Dislike / Retry 语义

| 动作 | 业务含义 | 数据影响 | 下一步 |
|---|---|---|---|
| **Like** | 用户认为这次解释有价值，希望保存 | 把当前 `CardDraft` 提升为 `SavedCard`；写入持久化；生成封面/分类/索引 | 展示「已保存」提示；可跳转到 options 卡片库 |
| **Dislike** | 用户对当前某个 task 输出不满意 | 记录 `CardFeedback`（kind='dislike'，关联 taskId）；不删 Card（若已保存） | 触发 Retry：重跑该 task 或下一个 provider，替换/追加 section |
| **Retry** | 基于已有上下文重新生成 | 保留原文和已成功 section；仅重跑被 dislike 的 task | 更新 section snapshot；如果来自未保存 draft，draft 继续存在 |
| **Delete** | 用户从卡片库移除 Card | 硬删除 `SavedCard`；同步清理搜索投影 | UI 刷新 |

> **关键原则**：Like 是 Create 的唯一业务事件；Dislike 不是 Delete，而是 Feedback + Retry 的触发器。

---

## 10. Integration Points With Existing Architecture

### 10.1 与 PopoverFeature / PopoverViewModel 的集成

- `PopoverViewModel` 在收到所有 streaming `completed` 事件后，把 `taskResults` 收集到 `CardDraft`。
- Like 按钮回调调用 `ICardLifecycleService.saveFromPopover()`。
- Dislike 按钮回调：
  - 如果 Card 还没保存（最常见）：把当前 task 标记为 `dislikedTaskIds`，调用 retry。
  - 如果 Card 已保存：写 `CardFeedback`，然后 retry 并 update Card。

### 10.2 与 TaskRegistry / ProviderRegistry 的集成

- `CardSection` 必须对 TaskConfig 做 **快照**：保存时复制 `taskLabel`、`providerLabel`，避免后续用户改名/删除自定义任务后已收藏卡片无法展示。
- Retry 时重新走 `TaskRegistryService` 解析当前 task 的 provider chain，而不是读取 snapshot。

### 10.3 跨上下文同步

- 使用 WXT `storage.defineItem('local:cards', { version: 1 })`。
- 在 options page 和 popup 中通过 `storage.watch` / `onChanged` 监听变化，实现：
  - 在 content script 中 Like 一张卡片 → options page 列表自动更新。
  - 在 options page 删除卡片 → popup 列表自动更新。
- `ICardRepository.onChanged()` 封装这一机制。

---

## 11. Implementation Order

按照 `settings-entity-scrud` 推荐的系统优先顺序：

1. **Define entity/schema changes**
   - 创建 `src/features/card/types.ts`：Card、CardSection、CardSource、CardCover、CardCategory、CRUD DTO。
   - 创建 `src/features/card/interfaces/ICardRepository.ts`、`ICardCoverResolver.ts`、`ICardTaxonomyResolver.ts`、`ICardSearchIndexResolver.ts`、`ICardLifecycleService.ts`。

2. **Define persistence boundaries**
   - 创建 `src/features/card/storage/cardStorage.ts`：使用 `storage.defineItem('local:cards')`。
   - 定义 schema version 与 migration stub。

3. **Implement resolver / precedence logic**
   - 实现 `DefaultCardCoverResolver`：基于 category 生成确定性渐变 SVG data URL。
   - 实现 `DefaultCardTaxonomyResolver`：基于 selection text 长度、task 类型做简单推断。
   - 实现 `DefaultCardSearchIndexResolver`：合并 title、note、tags、source text、section content。

4. **Wire real consumers**
   - 实现 `ExtensionCardRepository`。
   - 实现 `CardLifecycleService`。
   - 在 `PopoverViewModel` 中注入 `ICardLifecycleService`，增加 `like()` / `dislike(taskId)` / `retry(taskId)` 方法。
   - 在 `OriginalPopoverView` 中绑定 Like/Dislike 按钮（预留事件）。

5. **Add UI surfaces**
   - 在 options page 增加 Card 库页面（参考 `saved-chats-static.html`）。
   - 在 popup 中增加最近卡片入口。

6. **Add migration and regression protection**
   - schema default 测试、repository CRUD 测试、resolver 测试、搜索过滤测试。

---

## 12. Test And Migration Plan

- **Schema/default tests**：验证 `SavedCard` 的必填字段、默认值、`version` 存在。
- **Repository CRUD tests**：验证创建、读取、更新、删除、列表、搜索行为；验证单条写入不会破坏其它卡片。
- **Resolver tests**：
  - `CardCoverResolver`：相同输入产生稳定输出。
  - `CardTaxonomyResolver`：短单词 → word，长句 → sentence，术语 → term。
  - `CardSearchIndexResolver`：包含 title、tags、section content。
- **Consumer integration tests**：模拟 Like 流程，验证 `CardLifecycleService.saveFromPopover` 产出正确 Card。
- **Cross-context sync tests**：模拟 storage 变化事件，验证 `onChanged` 回调触发。
- **Migration/backward-compat tests**：未来 schema 升级时，旧数据通过 migration 函数无损升级。

---

## 13. Residual Risks

- **Product ambiguity still unresolved**：
  - Dislike 后 Retry 的具体策略：是换 provider、换 model，还是同一 provider 重新生成？建议由 `TaskRegistry` 的 provider chain 决定，Retry 时尝试链中下一个可用 provider。
  - 封面是否允许用户上传？当前接口已预留 `data-url` 类型，可后续实现。
  - Category 词表是否开放用户自定义？当前建议先受控词表，未来通过插件扩展。
- **Technical debt intentionally deferred**：
  - 封面 AI 生成：先用确定性渐变，后期替换 `ICardCoverResolver` 实现。
  - 大数据量性能：当前用 `local:cards` object map；若卡片数 > 数千，应迁移到 IndexedDB 但保持 `ICardRepository` 契约不变。
- **Potential naming drift**：
  - "Card" vs "Saved Chat" vs "Favorite"：建议统一使用 **Card / 卡片**。
- **Future scale concerns**：
  - `searchIndexText` 随 Card 写入预计算，若 section content 很长会占用存储。可后续截断或分词索引。

---

## 14. 架构原则总结

1. **变化速率隔离**：Card 实体契约（`SavedCard`、`ICardRepository`）是慢变的；封面策略、分类策略、搜索索引是快变的，通过接口抽象实现「增加代码而非修改代码」。
2. **快照解耦**：CardSection 保存 task/provider 标签快照，避免自定义任务后续变化污染历史卡片。
3. **单一 Create 事件**：Like 是 Card 创建的唯一业务事件；Dislike 是 Feedback + Retry。
4. **跨上下文同步**：WXT storage + `onChanged` 实现 content / options / popup 三端状态一致。
5. **UI 最后**：先定义 schema、repository、resolver，再绑 options/popup UI。

---

*文档版本：1.0*  
*对应代码基线：xiaocha v1.2.1，branch k26*
