import { describe, expect, it } from "vitest";
import { canAutoPublish } from "../../supabase/functions/_shared/compliance";
import { MAX_AGE_DAYS, pickItem, shortMessage, slotAt, SLOT_HOURS, type PostItem, type PostRow } from "../../supabase/functions/_shared/compliancePosts";

const trusted = { auto_publish: true, status: "active" };
const drafted = { status: "review", is_test: false, reviewed_at: null, change_pending: false, title_en: "New CySEC circular", summary_en: "CySEC informs firms…" };

describe("ComplianceHub automatic publishing", () => {
  it("publishes a drafted record from an auto-publish source", () => {
    expect(canAutoPublish(drafted, trusted)).toBe(true);
  });
  it("never publishes from a source without auto-publish", () => {
    expect(canAutoPublish(drafted, { auto_publish: false, status: "active" })).toBe(false);
    expect(canAutoPublish(drafted, { auto_publish: true, status: "disabled" })).toBe(false);
  });
  it("waits for the English title and summary", () => {
    expect(canAutoPublish({ ...drafted, summary_en: null }, trusted)).toBe(false);
    expect(canAutoPublish({ ...drafted, title_en: "" }, trusted)).toBe(false);
  });
  it("never overrides an editor (unpublished, rejected) or a changed source", () => {
    expect(canAutoPublish({ ...drafted, reviewed_at: "2026-11-20T10:00:00Z" }, trusted)).toBe(false);
    expect(canAutoPublish({ ...drafted, status: "rejected" }, trusted)).toBe(false);
    expect(canAutoPublish({ ...drafted, change_pending: true }, trusted)).toBe(false);
    expect(canAutoPublish({ ...drafted, is_test: true }, trusted)).toBe(false);
  });
});

const item = (id: string, authority: string, publication_date: string, extra: Partial<PostItem> = {}): PostItem => ({
  id, slug: id, authority, title_en: `Title ${id}`, official_title: `Official ${id}`, summary_en: `Summary ${id}`,
  publication_date, deadline_date: null, topics: [], status: "published", ...extra,
});
const posted = (item_id: string, created_at: string): PostRow => ({ item_id, slot: "x", platform: "facebook", status: "posted", created_at });
const now = new Date("2026-11-23T08:00:00Z"); // 10:00 Cyprus time

describe("ComplianceHub social posts", () => {
  it("posts twice a day, at 10:00 and 16:00 Cyprus time", () => {
    expect(SLOT_HOURS).toEqual([10, 16]);
    expect(slotAt(new Date("2026-11-23T08:00:00Z"))).toBe("2026-11-23T10");
    expect(slotAt(new Date("2026-11-23T14:00:00Z"))).toBe("2026-11-23T16");
    expect(slotAt(new Date("2026-07-01T13:00:00Z"))).toBe("2026-07-01T16"); // summer time
    expect(slotAt(new Date("2026-11-23T09:00:00Z"))).toBeNull();
  });
  it("never posts the same update twice", () => {
    const items = [item("a", "CySEC", "2026-11-20"), item("b", "CySEC", "2026-11-18")];
    expect(pickItem(items, [posted("a", "2026-11-22T08:00:00Z")], now)?.id).toBe("b");
    expect(pickItem(items, [posted("a", "2026-11-22T08:00:00Z"), posted("b", "2026-11-22T14:00:00Z")], now)).toBeNull();
  });
  it("skips updates older than three weeks and unpublished ones", () => {
    expect(MAX_AGE_DAYS).toBe(21);
    expect(pickItem([item("old", "CySEC", "2026-10-20")], [], now)).toBeNull();
    expect(pickItem([item("r", "CySEC", "2026-11-22", { status: "review" })], [], now)).toBeNull();
  });
  it("prefers another authority than the previous post", () => {
    const items = [item("a", "CySEC", "2026-11-22"), item("b", "AMLA", "2026-11-19"), item("prev", "CySEC", "2026-11-15")];
    expect(pickItem(items, [posted("prev", "2026-11-22T14:00:00Z")], now)?.id).toBe("b");
  });
  it("keeps X posts within 280 characters", () => {
    const long = item("l", "Central Bank of Cyprus", "2026-11-22", { title_en: "x ".repeat(300) });
    const text = shortMessage(long);
    const counted = text.replace(/https:\/\/\S+/, "x".repeat(23));
    expect(counted.length).toBeLessThanOrEqual(280);
  });
});
