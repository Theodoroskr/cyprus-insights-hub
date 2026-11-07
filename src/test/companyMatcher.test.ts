import { describe, expect, it } from "vitest";
import {
  extractAlternateNames, foldHomoglyphs, matchKeys, normalizeCompanyName, normalizeRegNo, pickCandidate,
} from "../../supabase/functions/_shared/companyMatcher";

describe("normalizeCompanyName (mirror of the database function)", () => {
  it("drops legal suffixes, 'Cyprus' and bracketed parts", () => {
    expect(normalizeCompanyName("DELOITTE LIMITED")).toBe("deloitte");
    expect(normalizeCompanyName("ETORO (EUROPE) LIMITED")).toBe("etoro");
    expect(normalizeCompanyName("BANK OF CYPRUS PUBLIC COMPANY LIMITED")).toBe("bank of");
    expect(normalizeCompanyName("ERNST & YOUNG CYPRUS LIMITED")).toBe("ernst young");
  });
});

describe("matchKeys — suffix matcher", () => {
  it("'Deloitte Cyprus' reaches the same key as DELOITTE LIMITED", () => {
    expect(matchKeys("Deloitte Cyprus")[0]).toBe(normalizeCompanyName("DELOITTE LIMITED"));
  });
  it("'Cyta Limassol' also tries 'cyta' (the CYTA alias)", () => {
    expect(matchKeys("Cyta Limassol")).toEqual(["cyta limassol", "cyta"]);
  });
  it("'eToro' and 'eToro Europe Ltd' keep their full keys first", () => {
    expect(matchKeys("eToro")).toEqual(["etoro"]);
    expect(matchKeys("eToro Europe Ltd")[0]).toBe("etoro europe");
  });
  it("strips several trailing office words and possessives", () => {
    expect(matchKeys("KPMG's Nicosia office")).toEqual(["kpmg nicosia office", "kpmg nicosia", "kpmg"]);
    expect(matchKeys("KPMG in Cyprus")).toEqual(["kpmg in", "kpmg"]);
    expect(matchKeys("Bank of Cyprus Public Company Ltd")).toEqual(["bank of public", "bank of"]);
  });
  it("folds Greek look-alike letters in Latin names", () => {
    expect(foldHomoglyphs("Αlpha Bank")).toBe("Alpha Bank");
    expect(matchKeys("Αlpha Bank Cyprus Ltd")[0]).toBe("alpha bank");
    expect(foldHomoglyphs("Τράπεζα Κύπρου")).toBe("Τράπεζα Κύπρου");
  });
});

describe("normalizeRegNo", () => {
  it("stores registration numbers as digits", () => {
    expect(normalizeRegNo("HE143641")).toBe("143641");
    expect(normalizeRegNo("HE 1253")).toBe("1253");
    expect(normalizeRegNo("165")).toBe("165");
    expect(normalizeRegNo("n/a")).toBeNull();
  });
});

describe("pickCandidate", () => {
  const c = (id: string, reg: string | null, status = "Active") => ({ id, name_key: "x", company_name: id, registration_no: reg, organisation_status: status });
  it("never matches a company with a different registration number", () => {
    expect(pickCandidate([c("a", "111")], "222").pick).toBeNull();
  });
  it("ignores dissolved companies when one live company remains", () => {
    expect(pickCandidate([c("a", "1", "Dissolved"), c("b", "2")]).pick?.id).toBe("b");
  });
  it("prefers the registered record over unregistered placeholders", () => {
    const r = pickCandidate([c("p", null), c("a", "1")]);
    expect(r.pick?.id).toBe("a");
    expect(r.rest.map((x) => x.id)).toEqual(["p"]);
  });
  it("stays ambiguous for two live registered companies", () => {
    expect(pickCandidate([c("a", "1"), c("b", "2")]).pick).toBeNull();
  });
});

describe("extractAlternateNames", () => {
  it("reads former names, including nested brackets and 'previously'", () => {
    expect(extractAlternateNames("26 Degrees Global Markets (EU) Ltd (ex Invast Financial Services (EU) Ltd)").formerNames)
      .toEqual(["Invast Financial Services (EU) Ltd"]);
    expect(extractAlternateNames('Unlimit EU Ltd (formerly "Unlimint EU Ltd" and previously "CardPay Limited")\n(Commercial names: UNLIMIT, STABLE COM)'))
      .toEqual({ formerNames: ["Unlimint EU Ltd", "CardPay Limited"], tradeNames: ["UNLIMIT", "STABLE COM"] });
    expect(extractAlternateNames("Eurobank Limited (previous name: Hellenic Bank Public Company Limited)").formerNames)
      .toEqual(["Hellenic Bank Public Company Limited"]);
  });
  it("reads former names written in square brackets", () => {
    expect(extractAlternateNames("IQ EQ (Cyprus) Limited [ex First Names (Cyprus) Ltd]").formerNames).toEqual(["First Names (Cyprus) Ltd"]);
  });
  it("reads trading names", () => {
    expect(extractAlternateNames('Sureswipe E.M.I. PLC (Operating under the trading name "Revsto")').tradeNames).toEqual(["Revsto"]);
    expect(extractAlternateNames("IPS Solutions Ltd (Operating under the Trade Mark - Payz)").tradeNames).toEqual(["Payz"]);
  });
  it("ignores withdrawal notes", () => {
    expect(extractAlternateNames("Ezeewallet Ltd (licence withdrawn on 13/02/2019)")).toEqual({ formerNames: [], tradeNames: [] });
  });
});
