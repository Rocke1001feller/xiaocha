type StorageItem<T> = {
  getValue: () => Promise<T>;
  setValue: (value: T) => Promise<void>;
  watch: (callback: (value: T) => void) => () => void;
};

const createStorageItem = <T, >(fallback: T): StorageItem<T> => {
  let value = fallback;
  const watchers = new Set<(value: T) => void>();

  return {
    getValue: async () => value,
    setValue: async (next) => {
      value = next;
      watchers.forEach((watcher) => watcher(next));
    },
    watch: (callback) => {
      watchers.add(callback);
      callback(value);
      return () => {
        watchers.delete(callback);
      };
    },
  };
};

export const storage = {
  defineItem: <T, >(_key: string, options?: { fallback?: T; version?: number }) =>
    createStorageItem<T>((options?.fallback ?? {}) as T),
};

export const browser = {
  runtime: {
    onMessage: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
};
