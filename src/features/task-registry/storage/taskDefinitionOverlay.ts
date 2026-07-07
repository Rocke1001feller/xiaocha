import { storage } from '#imports';

import {
  TASK_REGISTRY_OVERLAY_FALLBACK,
  type TaskRegistryOverlayV1,
} from '../events/TaskRegistryEvents';

export const taskDefinitionOverlayStorage = storage.defineItem<TaskRegistryOverlayV1>(
  'local:task-registry-overlay',
  {
    fallback: TASK_REGISTRY_OVERLAY_FALLBACK,
    version: 1,
  },
);