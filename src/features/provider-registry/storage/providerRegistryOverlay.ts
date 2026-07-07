import { storage } from '#imports';

import {
  PROVIDER_REGISTRY_OVERLAY_FALLBACK,
  type ProviderRegistryOverlayV1,
} from '../events/ProviderRegistryEvents';

export const providerRegistryOverlayStorage = storage.defineItem<ProviderRegistryOverlayV1>(
  'local:provider-registry-overlay',
  {
    fallback: PROVIDER_REGISTRY_OVERLAY_FALLBACK,
    version: 1,
  },
);