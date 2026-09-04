import { useCallback, useState } from 'react';

/** A boolean flag persisted to localStorage (per-viewer UI preference). */
export function useLocalStorageBoolean(
  key: string,
  initial = false,
): [boolean, (next?: boolean) => void] {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : raw === '1';
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next?: boolean) => {
      setValue((prev) => {
        const resolved = next ?? !prev;
        try {
          localStorage.setItem(key, resolved ? '1' : '0');
        } catch {
          // storage unavailable — keep the in-memory value only
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set];
}
