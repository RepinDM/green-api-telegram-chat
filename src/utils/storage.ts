type StorageName = 'localStorage' | 'sessionStorage';

export function getWebStorage(name: StorageName): Storage | null {
  try {
    return window[name];
  } catch (error) {
    console.error('Web Storage is not available:', error);
    return null;
  }
}

export function readStorageItem<T>(
  storage: Storage | null,
  key: string,
  isValid: (value: unknown) => value is T,
): T | null {
  if (!storage) {
    return null;
  }

  let storedValue: string | null;

  try {
    storedValue = storage.getItem(key);
  } catch (error) {
    console.error('Failed to read persisted data:', error);
    return null;
  }

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (isValid(parsedValue)) {
      return parsedValue;
    }
  } catch (error) {
    console.error('Failed to parse persisted data:', error);
  }

  removeStorageItem(storage, key);

  return null;
}

export function writeStorageItem<T>(
  storage: Storage | null,
  key: string,
  value: T | null,
): boolean {
  if (!storage) {
    return false;
  }

  if (value === null) {
    return removeStorageItem(storage, key);
  }

  let serializedValue: string;

  try {
    serializedValue = JSON.stringify(value);
  } catch (error) {
    console.error('Failed to serialize persisted data:', error);
    return false;
  }

  try {
    storage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error('Failed to write persisted data:', error);
    return false;
  }
}

export function removeStorageItem(
  storage: Storage | null,
  key: string,
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to remove persisted data:', error);
    return false;
  }
}
