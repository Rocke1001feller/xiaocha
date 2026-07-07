import { storage } from '#imports';

import {
  PROVIDER_SECRET_STORE_FALLBACK,
  type ProviderSecretStoreV1,
} from '../events/ProviderRegistryEvents';

export const providerSecretsStorage = storage.defineItem<ProviderSecretStoreV1>(
  'local:provider-secrets',
  {
    fallback: PROVIDER_SECRET_STORE_FALLBACK,
    version: 1,
  },
);