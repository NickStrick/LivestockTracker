"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * A set of string ids persisted in localStorage, shared across components and tabs.
 * Built on useSyncExternalStore so server HTML and the first client render agree
 * (`ready` is false until the browser value is available). With a backend, swap the
 * read/write for per-user server state.
 */
const SERVER = "__server__";
const listeners = new Map<string, Set<() => void>>();

const read = (key: string) => {
  try {
    return localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
};
const notify = (key: string) => listeners.get(key)?.forEach((l) => l());

export function useLocalSet(key: string) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const set = listeners.get(key) ?? new Set<() => void>();
      set.add(cb);
      listeners.set(key, set);
      window.addEventListener("storage", cb);
      return () => {
        set.delete(cb);
        window.removeEventListener("storage", cb);
      };
    },
    [key],
  );
  const raw = useSyncExternalStore(subscribe, () => read(key), () => SERVER);
  const ready = raw !== SERVER;
  const items = useMemo(() => new Set<string>(ready ? (JSON.parse(raw) as string[]) : []), [raw, ready]);

  const add = useCallback(
    (...ids: string[]) => {
      const next = new Set([...items, ...ids]);
      if (next.size === items.size) return;
      try {
        localStorage.setItem(key, JSON.stringify([...next]));
      } catch {
        /* storage unavailable (private mode): state simply won't persist */
      }
      notify(key);
    },
    [items, key],
  );

  const has = useCallback((id: string) => items.has(id), [items]);

  return { ready, items, has, add };
}
