import { describe, expect, it } from "vitest";
import { classifyDisclosure, groupOamItems, isSameEvent, oamCardUrl, resolveSourcePath, routeSourceItem, looksLikeDeal } from "../../supabase/functions/_shared/announcements";
import { formatDealAmount } from "@/lib/announcements";

describe("routing association news", () => {
  it("sends a CCCI trade forum to Business News, not deal review", () => {
    const r = routeSourceItem("ccci", "Cyprus–Egypt Business Forum and trade mission to Cairo", "The Chamber organises a business delegation with B2B meetings.");
    expect(r).toEqual(expect.objectContaining({ vertical: "general", dealReview: false }));
  });
  it("flags a CCCI named investment project for deal review", () => {
    const r = routeSourceItem("ccci", "€120 million investment project for new Limassol logistics hub", "Company X will invest €120 million in a new facility.");
    expect(r?.dealReview).toBe(true);
  });
  it("sends an ICPAC circular to ComplianceHub", () => {
    expect(routeSourceItem("icpac", "Circular 12/2026: EU sanctions update and AML obligations")?.vertical).toBe("compliance");
  });
  it("sends a Bar Association notice to ComplianceHub", () => {
    expect(routeSourceItem("cybar", "Announcement on FATF high-risk jurisdictions for administrative service providers")?.vertical).toBe("compliance");
  });
  it("sends CITEA partnerships to Technology News and funding rounds to deal review", () => {
    expect(routeSourceItem("citea", "CITEA signs MoU with Greek tech association")).toEqual(expect.objectContaining({ vertical: "fintech", dealReview: false }));
    expect(routeSourceItem("citea", "Cyprus startup Acme raises €5m Series A")).toEqual(expect.objectContaining({ vertical: "fintech", dealReview: true }));
  });
  it("routes OEB SME updates to SME Resources and policy updates to Business News", () => {
    expect(routeSourceItem("oeb", "New grant scheme for SMEs opens")?.vertical).toBe("sme");
    expect(routeSourceItem("oeb", "Public consultation on the minimum wage bill")?.vertical).toBe("general");
  });
  it("keeps MoUs and expressions of interest out of deals unless an investment is confirmed", () => {
    expect(looksLikeDeal("Expression of interest for the Larnaca marina development")).toBe(false);
    expect(looksLikeDeal("Memorandum of understanding signed between the two chambers")).toBe(false);
  });
  it("makes the ICPAC archive year configurable", () => {
    expect(resolveSourcePath("/selk/en/news.aspx?year={year}", new Date("2027-02-01"))).toBe("/selk/en/news.aspx?year=2027");
    expect(resolveSourcePath("/selk/en/news.aspx?year=2025")).toBe("/selk/en/news.aspx?year=2025");
  });
});

describe("classifying listed-company disclosures", () => {
  it("covers results, dividends, buybacks, holdings, acquisitions and board changes", () => {
    expect(classifyDisclosure(54, "Group Financial Results for the nine months ended 30 September 2026")).toBe("financial_results");
    expect(classifyDisclosure(28, "Payment of Dividend of Demetra Holdings Plc")).toBe("dividend");
    expect(classifyDisclosure(49, "PURCHASE OF OWN SHARES")).toBe("buyback");
    expect(classifyDisclosure(null, "TR-1 Notification of Major Holdings – Eaton Vance")).toBe("shareholding");
    expect(classifyDisclosure(null, "Completion of the Acquisition of Performing Loans and Deposits of The Cyprus Development Bank")).toBe("acquisition");
    expect(classifyDisclosure(31, "Appointment of New Director")).toBe("board");
  });
  it("skips meeting notices, dispersion reports and director dealings", () => {
    expect(classifyDisclosure(54, "Date of announcement of the Bank of Cyprus Group Financial Results")).toBeNull();
    expect(classifyDisclosure(56, "Report of dispersion of share capital as at 30/09/2026")).toBeNull();
    expect(classifyDisclosure(46, "PDMR Notification of Transaction")).toBeNull();
  });
});

describe("grouping and de-duplication", () => {
  const greek = { id: 226136, translationId: 226140, referencedListingId: 0, name: "Οικονομικά Αποτελέσματα", nameEnglish: "Group Financial Results for the nine months", publicationTimestamp: 1794200000000, infoLanguagesNameEn: "Greek", informationCategoryId: 54 };
  const english = { id: 226140, translationId: 0, referencedListingId: 0, name: "Group Financial Results", nameEnglish: "Group Financial Results for the nine months", publicationTimestamp: 1794200300000, infoLanguagesNameEn: "English", informationCategoryId: 54 };
  const greekCopy = { id: 226141, translationId: 0, referencedListingId: 226136, name: "Οικονομικά Αποτελέσματα Συγκροτήματος", nameEnglish: "Οικονομικά Αποτελέσματα Συγκροτήματος", publicationTimestamp: 1794200400000, infoLanguagesNameEn: "Greek", informationCategoryId: 54 };

  it("groups the Greek and English versions of one filing into one event", () => {
    const groups = groupOamItems([greek, english, greekCopy]);
    expect(groups).toHaveLength(1);
    expect(groups[0].english.id).toBe(226140);
    expect(oamCardUrl(groups[0].original)).toBe("https://publicoam.cse.com.cy/card-details/226136/226140tr");
  });

  it("matches an issuer-page announcement to the exchange filing of the same event", () => {
    expect(isSameEvent(
      { companyKey: "logicom", type: "financial_results", date: "2026-09-16", title: "Interim Financial Report for the First Half of 2026" },
      { companyKey: "logicom", type: "financial_results", date: "2026-09-16", title: "Six-month results 2026" },
    )).toBe(true);
  });

  it("keeps daily buyback reports as separate events", () => {
    expect(isSameEvent(
      { companyKey: "eurobank", type: "buyback", date: "2026-08-17", title: "Purchase of own shares" },
      { companyKey: "eurobank", type: "buyback", date: "2026-08-18", title: "Purchase of own shares" },
    )).toBe(false);
  });

  it("never merges different companies", () => {
    expect(isSameEvent(
      { companyKey: "logicom", type: "dividend", date: "2026-09-16", title: "Dividend" },
      { companyKey: "demetra", type: "dividend", date: "2026-09-16", title: "Dividend" },
    )).toBe(false);
  });
});

describe("deal amounts", () => {
  it("shows 'Not disclosed' when no amount was announced", () => {
    expect(formatDealAmount(null, null)).toBe("Not disclosed");
  });
  it("keeps the original currency", () => {
    expect(formatDealAmount(12_500_000, "EUR")).toBe("€12.5m");
    expect(formatDealAmount(3_000_000, "USD")).toBe("$3m");
    expect(formatDealAmount(1_200_000_000, "GBP")).toBe("£1.2bn");
    expect(formatDealAmount(750_000, "CHF")).toBe("CHF 750k");
  });
});
