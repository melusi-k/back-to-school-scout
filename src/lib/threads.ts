import { useCallback, useEffect, useState } from "react";
import type { UIMessage } from "ai";

export type ChecklistItem = {
  id: string;
  productId: string;
  label: string;
  note: string;
  category: string;
  price: number;
  done: boolean;
};

export type ChildThread = {
  id: string;
  childName: string;
  grade: string;
  updatedAt: number;
  messages: UIMessage[];
  checklist: ChecklistItem[];
};

const KEY = "satchel.threads.v1";

const isBrowser = () => typeof window !== "undefined";

export const newThreadId = () => Math.random().toString(36).slice(2, 10);

export const makeThread = (): ChildThread => ({
  id: newThreadId(),
  childName: "New child",
  grade: "",
  updatedAt: Date.now(),
  messages: [],
  checklist: [],
});

export const readThreads = (): ChildThread[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as ChildThread[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeThreads = (threads: ChildThread[]) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(threads));
  } catch {
    /* storage full or blocked — chat still works for this session */
  }
  window.dispatchEvent(new CustomEvent("satchel:threads"));
};

/** Idempotent: returns the existing threads, seeding one if the store is empty. */
export const ensureThreads = (): ChildThread[] => {
  const existing = readThreads();
  if (existing.length > 0) return existing;
  const seeded = [makeThread()];
  writeThreads(seeded);
  return seeded;
};

export function useThreads() {
  const [threads, setThreads] = useState<ChildThread[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setThreads(readThreads());
    setHydrated(true);
    const sync = () => setThreads(readThreads());
    window.addEventListener("satchel:threads", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("satchel:threads", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((id: string, patch: Partial<ChildThread>) => {
    const next = readThreads().map((t) =>
      t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t,
    );
    writeThreads(next);
  }, []);

  const create = useCallback(() => {
    const thread = makeThread();
    writeThreads([...readThreads(), thread]);
    return thread;
  }, []);

  const remove = useCallback((id: string) => {
    writeThreads(readThreads().filter((t) => t.id !== id));
  }, []);

  return { threads, hydrated, update, create, remove };
}
