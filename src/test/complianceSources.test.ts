import { describe, expect, it } from "vitest";
import { classifyEurLex, docTypeFromTitle, isCbcRegulatory, parseEurLexSearch } from "../../supabase/functions/_shared/compliance";

describe("EUR-Lex classification", () => {
  it("routes a restrictive-measures amendment to EU sanctions with its regime and measure type", () => {
    const a = classifyEurLex("CELEX: 32026R2490: Commission Implementing Regulation (EU) 2026/2490 of 5 November 2026 amending Council Regulation (EC) No 881/2002 imposing certain specific restrictive measures directed against certain persons and entities associated with the ISIL (Da'esh) and Al-Qaida organisations")!;
    expect(a.celex).toBe("32026R2490");
    expect(a.sanctions).toBe(true);
    expect(a.measureType).toBe("amendment");
    expect(a.legalActRef).toBe("Commission Implementing Regulation (EU) 2026/2490");
    expect(a.topics).toContain("sanctions");
  });
  it("labels a corrigendum by its CELEX suffix", () => {
    const a = classifyEurLex("CELEX: 32026D0455R(02): Corrigendum to Council Decision (CFSP) 2026/455 of 20 February 2026 concerning restrictive measures to combat terrorism")!;
    expect(a.corrigendum).toBe(true);
    expect(a.measureType).toBe("corrigendum");
    expect(a.documentType).toBe("corrigendum");
  });
  it("ignores acts unrelated to sanctions or financial services", () => {
    const a = classifyEurLex("CELEX: 32026R1111: Commission Regulation (EU) 2026/1111 of 3 November 2026 on the classification of certain goods in the Combined Nomenclature")!;
    expect(a.sanctions).toBe(false);
    expect(a.financial).toBe(false);
  });
  it("reads the Official Journal date, not a date inside the act title", () => {
    const html = `<div class="SearchResult"><h2><a href="./legal-content/AUTO/?uri=CELEX:32026R2490&qid=1" class="title">Commission Implementing Regulation (EU) 2026/2490 of 5 November 2026</a></h2><div class="textUnderTitle"><i>OJ L, 2026/2490, 6.11.2026</i></div></div>`;
    expect(parseEurLexSearch(html)).toEqual([{ celex: "32026R2490", title: "Commission Implementing Regulation (EU) 2026/2490 of 5 November 2026", ojDate: "2026-11-06" }]);
  });
});

describe("Central Bank and document types", () => {
  it("keeps supervisory announcements and skips statistics releases", () => {
    expect(isCbcRegulatory("Decision on the systemic risk buffer")).toBe(true);
    expect(isCbcRegulatory("Monetary and financial statistics, September 2026")).toBe(false);
  });
  it("labels consultations and guidance from the official title", () => {
    expect(docTypeFromTitle("Public consultation on draft RTS on customer due diligence")).toBe("consultation");
    expect(docTypeFromTitle("Guidance on the reporting obligations")).toBe("guidance");
  });
});
