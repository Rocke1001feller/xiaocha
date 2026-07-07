import { storage } from '#imports';

import {
  TASK_PROVIDER_CHAIN_OVERLAY_FALLBACK,
  type TaskProviderChainOverlayV1,
} from '../events/TaskRegistryEvents';

export const taskProviderChainOverlayStorage = storage.defineItem<TaskProviderChainOverlayV1>(
  'local:task-provider-chain-overlay',
  {
    fallback: TASK_PROVIDER_CHAIN_OVERLAY_FALLBACK,
    version: 1,
  },
);