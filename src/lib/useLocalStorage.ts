"use client";

import { useSyncExternalStore, useCallback, useMemo } from "react";

const dispatchStorageEvent = (key: string, newValue: string | null) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
  }
};

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueString = useMemo(
    () => JSON.stringify(initialValue),
    [initialValue],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return initialValueString;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? item : initialValueString;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueString;
    }
  }, [key, initialValueString]);

  const subscribe = useCallback(
    (listener: () => void) => {
      if (typeof window === "undefined") return () => {};

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key) listener();
      };

      window.addEventListener("storage", handleStorageChange);
      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    },
    [key],
  );

  const storeValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => initialValueString,
  );

  const parsedValue = useMemo(() => {
    try {
      return JSON.parse(storeValue) as T;
    } catch {
      return initialValue;
    }
  }, [storeValue, initialValue]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(parsedValue) : value;

        const serializedValue = JSON.stringify(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, serializedValue);
          dispatchStorageEvent(key, serializedValue);
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, parsedValue],
  );

  return [parsedValue, setValue] as const;
}
