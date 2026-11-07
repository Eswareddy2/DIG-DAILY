import { useSyncExternalStore } from "react";

export type Lang = "en" | "hi";

const STORAGE_KEY = "viralsupermart-lang";
const listeners = new Set<() => void>();
let current: Lang = "en";
let hydrated = false;

function getLang(): Lang {
  if (typeof window === "undefined") return "en";
  if (!hydrated) {
    current =
      window.localStorage.getItem(STORAGE_KEY) === "hi" ||
      window.localStorage.getItem("digidaily-lang") === "hi"
        ? "hi"
        : "en";
    hydrated = true;
  }
  return current;
}

export function setLang(lang: Lang) {
  current = lang;
  hydrated = true;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, lang);
  listeners.forEach((listener) => listener());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    getLang,
    () => "en" as Lang,
  );
}

/** Picks the Hindi text when the reader chose Hindi and a translation exists. */
export function pickText<T extends { title: string; title_hi?: string | null; summary?: string | null; summary_hi?: string | null; content?: string | null; content_hi?: string | null }>(
  article: T,
  lang: Lang,
): { title: string; summary: string | null; content: string | null } {
  return {
    title: lang === "hi" && article.title_hi ? article.title_hi : article.title,
    summary: lang === "hi" && article.summary_hi ? article.summary_hi : (article.summary ?? null),
    content: lang === "hi" && article.content_hi ? article.content_hi : (article.content ?? null),
  };
}
