import { ProviderRegistryService } from '../../provider-registry/services/ProviderRegistryService';
import { TaskRegistryService } from './TaskRegistryService';

export function createRegistryServiceBundle() {
  const providerRegistryService = new ProviderRegistryService();
  const taskRegistryService = new TaskRegistryService(providerRegistryService);

  providerRegistryService.attachTaskProviderReferenceReader(taskRegistryService);

  return {
    providerRegistryService,
    taskRegistryService,
  };
}