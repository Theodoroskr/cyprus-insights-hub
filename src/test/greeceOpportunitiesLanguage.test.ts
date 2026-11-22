import { describe, expect, it } from "vitest";
import { kimdisTerm, matchesSearch, noticeText } from "../../supabase/functions/_shared/kimdis";
import { grEnHref, langFromSearch } from "@/lib/edition";

const notice = { title: "Παροχή υπηρεσιών λογισμικού", title_en: "Provision of software services", authority_name: "ΔΗΜΟΣ ΜΕΓΙΣΤΗΣ", authority_name_en: "Municipality of Megisti" };

describe("Greece Opportunities language", () => {
  it("English readers see the English title and authority; Greek readers the official Greek", () => {
    expect(noticeText(notice, "en")).toMatchObject({ title: "Provision of software services", authority: "Municipality of Megisti", titleLang: "en", translated: true });
    expect(noticeText(notice, "el")).toMatchObject({ title: "Παροχή υπηρεσιών λογισμικού", authority: "ΔΗΜΟΣ ΜΕΓΙΣΤΗΣ", titleLang: "el" });
  });
  it("an untranslated notice falls back to the Greek original, marked as Greek", () => {
    expect(noticeText({ ...notice, title_en: null, authority_name_en: null }, "en")).toMatchObject({ title: "Παροχή υπηρεσιών λογισμικού", titleLang: "el", authorityLang: "el", translated: false });
  });
  it("procedure and contract types read in English, unknown terms stay as published", () => {
    expect(kimdisTerm("Απευθείας ανάθεση", "en")).toBe("Direct award");
    expect(kimdisTerm("Πρόσκληση", "en")).toBe("Invitation to tender");
    expect(kimdisTerm("Απευθείας ανάθεση", "el")).toBe("Απευθείας ανάθεση");
    expect(kimdisTerm("Νέος όρος", "en")).toBe("Νέος όρος");
  });
  it("keyword search matches the English translation as well as the Greek", () => {
    const n = { ...notice, kind: "tender" as const, focus: ["it"], value_without_vat: 1000, published_at: "2026-11-19T08:00:00Z", deadline_at: "2026-12-01T10:00:00Z", cancelled: false };
    const now = new Date("2026-11-20T00:00:00Z");
    expect(matchesSearch(n, { q: "software" }, now)).toBe(true);
    expect(matchesSearch(n, { q: "λογισμικού" }, now)).toBe(true);
    expect(matchesSearch(n, { authority: "megisti" }, now)).toBe(true);
    expect(matchesSearch(n, { q: "hospital" }, now)).toBe(false);
  });
  it("links from English pages open the Greece edition in English", () => {
    expect(grEnHref("/greece/opportunities", false)).toBe("/greece/opportunities?lang=en");
    expect(langFromSearch("?lang=en")).toBe("en");
    expect(langFromSearch("lang=el&tab=awards")).toBe("el");
    expect(langFromSearch("?lang=fr")).toBeNull();
  });
});
