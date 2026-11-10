import { useEffect, useState } from "react";

export type AcademyStatus = "draft" | "review" | "published" | "archived";
export type Programme = { id: string; slug: string; code: string; title_en: string; title_el: string; summary_en: string; summary_el: string; audience_en: string; audience_el: string; level: string; objectives_en: string[]; objectives_el: string[]; notice_en: string | null; notice_el: string | null; status: AcademyStatus; publish_at: string | null; sort_order: number };
export type Lesson = { id: string; programme_id: string; slug: string; title_en: string; title_el: string; summary_en: string; summary_el: string; body_en: string; body_el: string; objectives_en: string[]; objectives_el: string[]; level: string; minutes: number; calculator: string | null; stat_codes: string[]; resource_url: string | null; status: AcademyStatus; publish_at: string | null; sort_order: number; updated_at?: string };

export type Lang = "en" | "el";
const KEY = "bh-academy-lang";
export function useAcademyLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>(() => (typeof window !== "undefined" && localStorage.getItem(KEY) === "el" ? "el" : "en"));
  useEffect(() => { try { localStorage.setItem(KEY, lang); } catch { /* ignore */ } document.documentElement.lang = lang; return () => { document.documentElement.lang = "en"; }; }, [lang]);
  return [lang, setLang];
}

/** Pick the Greek field when chosen and filled; otherwise English. */
export function pick<T extends Record<string, unknown>>(row: T, field: string, lang: Lang): string {
  const el = row[`${field}_el`]; const en = row[`${field}_en`];
  return (lang === "el" && typeof el === "string" && el.trim() ? el : (en as string)) ?? "";
}
export const hasGreek = (row: Record<string, unknown>, field: string) => typeof row[`${field}_el`] === "string" && (row[`${field}_el`] as string).trim().length > 0;

/** Mirrors the database rule: visible when published and its publish date has passed. */
export function isLive(row: { status: string; publish_at: string | null }, now = new Date()): boolean {
  return row.status === "published" && (!row.publish_at || new Date(row.publish_at) <= now);
}

export const LEVEL_LABEL: Record<string, { en: string; el: string }> = {
  beginner: { en: "Beginner", el: "Αρχάριο" }, intermediate: { en: "Intermediate", el: "Μεσαίο" }, advanced: { en: "Advanced", el: "Προχωρημένο" },
};
export const T = {
  academy: { en: "Financial Literacy Academy", el: "Ακαδημία Χρηματοοικονομικού Αλφαβητισμού" },
  lessons: { en: "lessons", el: "μαθήματα" },
  minutes: { en: "min", el: "λεπτά" },
  audience: { en: "For", el: "Για" },
  objectives: { en: "You will learn to", el: "Θα μάθετε να" },
  start: { en: "Start programme", el: "Έναρξη προγράμματος" },
  next: { en: "Next lesson", el: "Επόμενο μάθημα" },
  prev: { en: "Previous", el: "Προηγούμενο" },
  back: { en: "All programmes", el: "Όλα τα προγράμματα" },
  greekPending: { en: "", el: "Η ελληνική μετάφραση αυτού του μαθήματος ετοιμάζεται. Εμφανίζεται το αγγλικό κείμενο." },
  free: { en: "Free · no sign-up needed", el: "Δωρεάν · χωρίς εγγραφή" },
  official: { en: "Official figures", el: "Επίσημα στοιχεία" },
  empty: { en: "The first programmes are being reviewed and will appear here soon.", el: "Τα πρώτα προγράμματα ελέγχονται και θα εμφανιστούν σύντομα." },
} as const;
