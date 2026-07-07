import { dedupeProviderIds, type ProviderId } from '../../provider-registry/events/ProviderRegistryEvents';
import type { IProviderRegistryReader } from '../../provider-registry/interfaces/IProviderRegistryReader';
import { taskDefinitionOverlayStorage } from '../storage/taskDefinitionOverlay';
import { taskProviderChainOverlayStorage } from '../storage/taskProviderChainOverlay';
import type {
  CreateCustomTaskInput,
  CustomTaskId,
  CustomTaskRecord,
  ResolvedTaskDefinition,
  SystemTaskId,
  TaskId,
  TaskProviderChainOverlayV1,
  TaskProviderChainRule,
  SystemTaskOverride,
  TaskProviderRequestMap,
  TaskRegistryOverlayV1,
  TaskRegistryRecord,
  UpdateTaskInput,
} from '../events/TaskRegistryEvents';
import type { ITaskProviderReferenceReader } from '../interfaces/ITaskProviderReferenceReader';

import {
  SYSTEM_TASK_DEFINITIONS,
  SYSTEM_TASK_PROVIDER_CHAINS,
  SYSTEM_TASKS,
  isCustomTaskId,
} from '../events/TaskRegistryEvents';
import {
  buildCustomTaskRecord,
  buildSystemTaskOverride,
  buildSystemTaskRecord,
  resolveTaskDefinition,
} from './task-registry/taskRegistryDefinitions';
import {
  assertCustomTaskProvidersAreValid,
  assertSystemTaskExists,
  assertTaskChainIsValid,
  buildTaskChainRule,
  createUniqueCustomTaskId,
  resolveTaskProviderIds,
} from './task-registry/taskRegistryProviderChain';
import {
  cloneTaskProviderChainOverlay,
  cloneTaskRegistryOverlay,
} from './task-registry/taskRegistryState';
import {
  cloneTaskProviderRequestMap,
  normalizePromptBody,
  normalizeTaskLabel,
  normalizeTaskMode,
  normalizeTaskProviderRequestMap,
  TaskRegistryValidationError,
} from './task-registry/taskRegistryValidation';

export class TaskRegistryService implements ITaskProviderReferenceReader {
  private readonly providerRegistryReader: IProviderRegistryReader;

  constructor(providerRegistryReader: IProviderRegistryReader) {
    this.providerRegistryReader = providerRegistryReader;
  }

  async getTaskRecords(): Promise<TaskRegistryRecord[]> {
    const [overlay, providerViews] = await Promise.all([
      taskDefinitionOverlayStorage.getValue(),
      this.providerRegistryReader.getProviderViews(),
    ]);
    const providerLabelMap = new Map(providerViews.map((provider) => [provider.id, provider.label]));

    const systemTaskRecords = await Promise.all(
      SYSTEM_TASKS.map(async (task) => this.buildTaskRecord(task, overlay, providerLabelMap)),
    );

    const customTaskRecords = Object.values(overlay.customTasks)
      .filter((task): task is CustomTaskRecord => task != null)
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((task) => buildCustomTaskRecord(task, providerLabelMap));

    return [...systemTaskRecords, ...customTaskRecords];
  }

  async getTaskRecord(task: TaskId): Promise<TaskRegistryRecord | null> {
    const [overlay, providerViews] = await Promise.all([
      taskDefinitionOverlayStorage.getValue(),
      this.providerRegistryReader.getProviderViews(),
    ]);
    const providerLabelMap = new Map(providerViews.map((provider) => [provider.id, provider.label]));

    if (isCustomTaskId(task)) {
      const customTask = overlay.customTasks[task];
      return customTask ? buildCustomTaskRecord(customTask, providerLabelMap) : null;
    }

    if (!SYSTEM_TASKS.includes(task)) {
      return null;
    }

    return this.buildTaskRecord(task, overlay, providerLabelMap);
  }

  async getResolvedTaskDefinition(task: SystemTaskId): Promise<ResolvedTaskDefinition> {
    assertSystemTaskExists(task);
    const overlay = await taskDefinitionOverlayStorage.getValue();

    return resolveTaskDefinition(task, overlay);
  }

  async getResolvedTaskProviderIds(
    task: SystemTaskId,
    activeProviderIds?: readonly ProviderId[],
  ): Promise<ProviderId[]> {
    assertSystemTaskExists(task);

    const taskChainOverlay = await taskProviderChainOverlayStorage.getValue();
    const activeProviderIdSet = activeProviderIds
      ? new Set(activeProviderIds)
      : await this.getActiveProviderIdSet();

    return resolveTaskProviderIds(task, taskChainOverlay, activeProviderIdSet);
  }

  async getTaskProviderChainRule(task: SystemTaskId): Promise<TaskProviderChainRule | null> {
    assertSystemTaskExists(task);

    const taskChainOverlay = await taskProviderChainOverlayStorage.getValue();
    const rule = taskChainOverlay.tasks[task];

    if (!rule) {
      return null;
    }

    return {
      ...rule,
      providerIds: [...rule.providerIds],
    };
  }

  async getProviderReferenceTasks(providerId: ProviderId): Promise<TaskId[]> {
    const taskChainOverlay = await taskProviderChainOverlayStorage.getValue();
    const taskRegistryOverlay = await taskDefinitionOverlayStorage.getValue();
    const referencedTasks: TaskId[] = [];

    for (const task of SYSTEM_TASKS) {
      const rule = taskChainOverlay.tasks[task];
      if (rule?.providerIds.includes(providerId)) {
        referencedTasks.push(task);
      }
    }

    for (const customTask of Object.values(taskRegistryOverlay.customTasks)) {
      if (customTask?.providerIds.includes(providerId)) {
        referencedTasks.push(customTask.id);
      }
    }

    return referencedTasks;
  }

  async assertTasksRetainExecutableProviders(
    activeProviderIds: readonly ProviderId[],
    executableProviderIds: readonly ProviderId[],
  ): Promise<void> {
    const taskChainOverlay = await taskProviderChainOverlayStorage.getValue();
    const overlay = await taskDefinitionOverlayStorage.getValue();
    const activeProviderIdSet = new Set(activeProviderIds);
    const executableProviderIdSet = new Set(executableProviderIds);

    for (const task of SYSTEM_TASKS) {
      const resolvedProviderIds = resolveTaskProviderIds(task, taskChainOverlay, activeProviderIdSet);
      const hasExecutableProvider = resolvedProviderIds.some((providerId) => executableProviderIdSet.has(providerId));

      if (!hasExecutableProvider) {
        throw new TaskRegistryValidationError(
          `Task "${SYSTEM_TASK_DEFINITIONS[task].label}" must keep at least one executable provider.`,
        );
      }
    }

    for (const customTask of Object.values(overlay.customTasks)) {
      if (!customTask) {
        continue;
      }

      const resolvedProviderIds = dedupeProviderIds(customTask.providerIds).filter((providerId) => activeProviderIdSet.has(providerId));
      const hasExecutableProvider = resolvedProviderIds.some((providerId) => executableProviderIdSet.has(providerId));

      if (!hasExecutableProvider) {
        throw new TaskRegistryValidationError(
          `Task "${customTask.label}" must keep at least one executable provider.`,
        );
      }
    }
  }

  watchTaskRecords(callback: (tasks: TaskRegistryRecord[]) => void): () => void {
    let disposed = false;

    const emit = async () => {
      if (disposed) {
        return;
      }

      callback(await this.getTaskRecords());
    };

    void emit();

    const stopOverlayWatch = taskDefinitionOverlayStorage.watch(() => {
      void emit();
    });
    const stopTaskChainWatch = taskProviderChainOverlayStorage.watch(() => {
      void emit();
    });
    const stopProviderWatch = this.providerRegistryReader.watchMergedProviders(() => {
      void emit();
    });

    return () => {
      disposed = true;
      stopOverlayWatch();
      stopTaskChainWatch();
      stopProviderWatch();
    };
  }

  async createCustomTask(input: CreateCustomTaskInput): Promise<CustomTaskId> {
    const now = Date.now();
    const overlay = cloneTaskRegistryOverlay(await taskDefinitionOverlayStorage.getValue());
    const normalizedTask = await this.normalizeCustomTaskInput(input, overlay, now);

    overlay.customTasks[normalizedTask.id] = normalizedTask;

    await taskDefinitionOverlayStorage.setValue(overlay);

    return normalizedTask.id;
  }

  async updateTask(input: UpdateTaskInput): Promise<void> {
    if (isCustomTaskId(input.id)) {
      await this.updateCustomTask(input.id, input);
      return;
    }

    await this.updateSystemTask(input);
  }

  async updateSystemTask(input: UpdateTaskInput): Promise<void> {
    assertSystemTaskExists(input.id);

    const now = Date.now();
    const overlay = cloneTaskRegistryOverlay(await taskDefinitionOverlayStorage.getValue());
    const taskChainOverlay = cloneTaskProviderChainOverlay(await taskProviderChainOverlayStorage.getValue());
    const normalizedLabel = normalizeTaskLabel(input.label);
    const normalizedMode = normalizeTaskMode(input.mode);
    const normalizedSystemPrompt = normalizePromptBody(input.systemPrompt, 'System Prompt');
    const normalizedUserPrompt = normalizePromptBody(input.userPrompt, 'User Prompt');
    const normalizedProviderRequestParams = normalizeTaskProviderRequestMap(
      input.providerRequestParams,
      input.providerIds,
    );
    const nextRule = buildTaskChainRule(input, now);
    const providerViews = await this.providerRegistryReader.getProviderViews();

    assertTaskChainIsValid(input.id, nextRule, providerViews);

    if (nextRule) {
      taskChainOverlay.tasks[input.id] = {
        mode: nextRule.mode,
        insertPosition: nextRule.mode === 'inherit' ? nextRule.insertPosition ?? 'tail' : undefined,
        providerIds: [...nextRule.providerIds],
        updatedAt: nextRule.updatedAt,
      };
    } else {
      delete taskChainOverlay.tasks[input.id];
    }

    const nextOverride = buildSystemTaskOverride(
      input.id,
      normalizedLabel,
      normalizedMode,
      normalizedSystemPrompt,
      normalizedUserPrompt,
      normalizedProviderRequestParams,
      now,
    );

    if (nextOverride) {
      overlay.systemOverrides[input.id] = nextOverride;
    } else {
      delete overlay.systemOverrides[input.id];
    }

    await Promise.all([
      taskDefinitionOverlayStorage.setValue(overlay),
      taskProviderChainOverlayStorage.setValue(taskChainOverlay),
    ]);
  }

  async deleteCustomTask(taskId: CustomTaskId): Promise<void> {
    const overlay = cloneTaskRegistryOverlay(await taskDefinitionOverlayStorage.getValue());

    if (!overlay.customTasks[taskId]) {
      throw new TaskRegistryValidationError(`Custom task "${taskId}" does not exist.`);
    }

    delete overlay.customTasks[taskId];
    await taskDefinitionOverlayStorage.setValue(overlay);
  }

  async resetSystemTask(task: SystemTaskId): Promise<void> {
    assertSystemTaskExists(task);

    const overlay = cloneTaskRegistryOverlay(await taskDefinitionOverlayStorage.getValue());
    const taskChainOverlay = cloneTaskProviderChainOverlay(await taskProviderChainOverlayStorage.getValue());
    delete taskChainOverlay.tasks[task];
    delete overlay.systemOverrides[task];
    await Promise.all([
      taskDefinitionOverlayStorage.setValue(overlay),
      taskProviderChainOverlayStorage.setValue(taskChainOverlay),
    ]);
  }

  private async updateCustomTask(taskId: CustomTaskId, input: UpdateTaskInput): Promise<void> {
    const now = Date.now();
    const overlay = cloneTaskRegistryOverlay(await taskDefinitionOverlayStorage.getValue());
    const existingTask = overlay.customTasks[taskId];

    if (!existingTask) {
      throw new TaskRegistryValidationError(`Custom task "${taskId}" does not exist.`);
    }

    const normalizedTask = await this.normalizeExistingCustomTaskInput(existingTask, input, now);
    overlay.customTasks[taskId] = normalizedTask;

    await taskDefinitionOverlayStorage.setValue(overlay);
  }

  private async buildTaskRecord(
    task: SystemTaskId,
    overlay: TaskRegistryOverlayV1,
    providerLabelMap: ReadonlyMap<string, string>,
  ): Promise<TaskRegistryRecord> {
    const [chainRule, providerChainIds] = await Promise.all([
      this.getTaskProviderChainRule(task),
      this.getResolvedTaskProviderIds(task),
    ]);
    return buildSystemTaskRecord(task, overlay, providerLabelMap, chainRule, providerChainIds);
  }

  private async getActiveProviderIdSet(): Promise<Set<ProviderId>> {
    const providerViews = await this.providerRegistryReader.getProviderViews();
    return new Set(
      providerViews
        .filter((provider) => provider.status === 'active')
        .map((provider) => provider.id),
    );
  }

  private async normalizeCustomTaskInput(
    input: CreateCustomTaskInput,
    overlay: TaskRegistryOverlayV1,
    timestamp: number,
  ): Promise<CustomTaskRecord> {
    const label = normalizeTaskLabel(input.label);
    const mode = normalizeTaskMode(input.mode);
    const systemPrompt = normalizePromptBody(input.systemPrompt, 'System Prompt');
    const userPrompt = normalizePromptBody(input.userPrompt, 'User Prompt');
    const providerIds = dedupeProviderIds(input.providerIds);
    const providerRequestParams = normalizeTaskProviderRequestMap(input.providerRequestParams, providerIds);
    const providerViews = await this.providerRegistryReader.getProviderViews();

    assertCustomTaskProvidersAreValid(providerIds, label, providerViews);

    return {
      id: createUniqueCustomTaskId(label, overlay),
      label,
      mode,
      systemPrompt,
      userPrompt,
      providerRequestParams,
      providerIds,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  private async normalizeExistingCustomTaskInput(
    existingTask: CustomTaskRecord,
    input: UpdateTaskInput,
    timestamp: number,
  ): Promise<CustomTaskRecord> {
    const label = normalizeTaskLabel(input.label);
    const mode = normalizeTaskMode(input.mode);
    const systemPrompt = normalizePromptBody(input.systemPrompt, 'System Prompt');
    const userPrompt = normalizePromptBody(input.userPrompt, 'User Prompt');
    const providerIds = dedupeProviderIds(input.providerIds);
    const providerRequestParams = normalizeTaskProviderRequestMap(input.providerRequestParams, providerIds);
    const providerViews = await this.providerRegistryReader.getProviderViews();

    assertCustomTaskProvidersAreValid(providerIds, label, providerViews);

    return {
      ...existingTask,
      label,
      mode,
      systemPrompt,
      userPrompt,
      providerRequestParams,
      providerIds,
      updatedAt: timestamp,
    };
  }

}