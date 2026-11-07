import { describe, expect, it } from "vitest";
import { strToU8, unzipSync, zipSync } from "fflate";
import {
  CBC_LISTS, cbcFlagsFor, cleanCbcName, findRegisterLinks, mapCbcStatus, parseCreditInstitutions, parsePaymentWorkbooks, wantedCbcSheet,
} from "../../supabase/functions/_shared/cbcRegister";
import { readXlsxSheets } from "../../supabase/functions/_shared/xlsxReader";

const banksHtml = `
<p><b>1.&nbsp;LOCAL AUTHORISED CREDIT INSTITUTIONS</b></p>
<ol><li><a href="http://www.bankofcyprus.com/"><span>Bank of Cyprus Public Company Ltd</span></a></li></ol>
<p><b>&nbsp; A. SUBSIDIARIES OF FOREIGN CREDIT INSTITUTIONS</b></p>
<ol><li><a href="http://www.eurobank.cy"><span>Eurobank Limited</span></a>&nbsp;(previous name: Hellenic Bank Public Company Limited)</li>
<li><a href="http://www.nbg.com.cy/"><span>National Bank of Greece (Cyprus) Limited</span></a></li></ol>
<p><strong>B. BRANCHES OF FOREIGN CREDIT INSTITUTIONS</strong></p>
<p><strong>&nbsp;&nbsp;&nbsp; I. BRANCHES OF FOREIGN&nbsp;CREDIT INSTITUTIONS FROM E.U. MEMBER STATES</strong></p>
<ol><li><a href="https://privatbank.com.cy"><span>Joint Stock Company Commercial Bank &quot;Privatbank&quot;</span></a>&nbsp;*</li></ol>
<div>* Following the amendment of the licence … the said branch is not permitted to engage in any banking business, other than …</div>
<p><strong>&nbsp;3. REPRESENTATIVE OFFICES</strong></p>
<ol><li><a href="https://www.efginternational.com/"><span>EFG Private Bank Limited</span></a></li></ol>
<p><a href="/x.pdf">National Identification Codes of Authorised Credit Institutions</a></p>`;

describe("parseCreditInstitutions", () => {
  const out = parseCreditInstitutions(banksHtml);
  it("reads every bank with its section", () => {
    expect(out.map((x) => [x.entry.entity_name, x.list.licenseType])).toEqual([
      ["Bank of Cyprus Public Company Ltd", "Credit Institution"],
      ["Eurobank Limited", "Credit Institution"],
      ["National Bank of Greece (Cyprus) Limited", "Credit Institution"],
      ['Joint Stock Company Commercial Bank "Privatbank"', "Credit Institution (branch of foreign bank)"],
      ["EFG Private Bank Limited", "Bank Representative Office"],
    ]);
  });
  it("keeps the previous name and marks the restricted branch", () => {
    expect(out[1].entry.former_names).toEqual(["Hellenic Bank Public Company Limited"]);
    expect(out[3].entry.status).toBe("Restricted");
    expect(out[4].entry.status).toBe("Representative office");
    expect(out[0].entry.website).toBe("http://www.bankofcyprus.com");
  });
});

describe("cleanCbcName / mapCbcStatus", () => {
  it("keeps short legal brackets, drops notes", () => {
    expect(cleanCbcName("Quickpay Tech (Cy) Ltd\n(the operations shall commence upon approval granted by the CBC)")).toBe("Quickpay Tech (Cy) Ltd");
    expect(cleanCbcName('Sibilla Solutions Limited\n(Operating under the trading name "Profee")')).toBe("Sibilla Solutions Limited");
    expect(cleanCbcName("WEEZZO LTD (licence withdrawn on 05/08/2020)")).toBe("WEEZZO LTD");
  });
  it("maps CBC notes to statuses", () => {
    expect(mapCbcStatus("Nec Pay Limited\n(the operations shall commence upon approval granted by the CBC)", "emi")).toBe("Licensed – not yet operating");
    expect(mapCbcStatus("Koronapay Europe Limited\n* The EMI decided to terminate its operations.", "emi")).toBe("Withdrawal in progress");
    expect(mapCbcStatus("Payabl. Cy Limited (… By the time its licence as an EMI gets activated, …)", "emi")).toBe("Licence not yet activated");
    expect(mapCbcStatus("Payabl. Cy Limited (… By the time its licence as an EMI gets activated, …)", "pi")).toBe("Active");
  });
});

describe("findRegisterLinks", () => {
  it("picks the CBC-authorised registers, not the incoming passport lists", () => {
    const html = `<a href="https://www.centralbank.cy/images/media/redirectfile/Payment%20Institutions/PI-register-22102026.xlsx">a</a>
      <a href="https://www.centralbank.cy/images/media/redirectfile/Payment%20Institutions/PI-incom-passp-register-22102026.xlsx">b</a>
      <a href="https://www.centralbank.cy/images/media/redirectfile/Electronic%20Money%20Institutions/EMI-REGISTER-27102026.xlsx">c</a>
      <a href="https://www.centralbank.cy/images/media/redirectfile/Electronic%20Money%20Institutions/emi-incom-passp-register-22102026.xlsx">d</a>`;
    const l = findRegisterLinks(html);
    expect(l.pi).toContain("PI-register-22102026");
    expect(l.emi).toContain("EMI-REGISTER-27102026");
  });
});

// A tiny workbook in the same layout as the CBC's EMI register
function workbook(sheets: Record<string, string[][]>) {
  const strings: string[] = [];
  const si = (s: string) => (strings.includes(s) ? strings.indexOf(s) : strings.push(s) - 1);
  const files: Record<string, Uint8Array> = {};
  const names = Object.keys(sheets);
  names.forEach((name, i) => {
    const rows = sheets[name].map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => v === "" ? "" : /^\d+$/.test(v)
      ? `<c r="${String.fromCharCode(65 + ci)}${ri + 1}"><v>${v}</v></c>`
      : `<c r="${String.fromCharCode(65 + ci)}${ri + 1}" t="s"><v>${si(v)}</v></c>`).join("")}</row>`).join("");
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(`<worksheet><sheetData>${rows}</sheetData></worksheet>`);
  });
  files["xl/workbook.xml"] = strToU8(`<workbook><sheets>${names.map((n, i) => `<sheet name="${n}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`);
  files["xl/_rels/workbook.xml.rels"] = strToU8(`<Relationships>${names.map((_, i) => `<Relationship Id="rId${i + 1}" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}</Relationships>`);
  files["xl/sharedStrings.xml"] = strToU8(`<sst>${strings.map((s) => `<si><t xml:space="preserve">${s.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}</t></si>`).join("")}</sst>`);
  return unzipSync(zipSync(files));
}

describe("EMI / PI workbooks", () => {
  const emi = readXlsxSheets(workbook({
    "EMIs": [
      ["Public Register of Electronic Money Institutions"],
      ["Names of licensed EMIs", "Licence \nno.", "LEI code", "Registr. No.", "Date of authorisation"],
      ["Nuvei Limited \n(formerly Safecharge Limited)", "115.1.3.9/2018", "98450092FC6781F74S30", "HE129880", "Current Lic. Date: 19/07/2018"],
      ["Sureswipe E.M.I. PLC\n(Operating under the trading name \"Revsto\")", "115.1.3.26", "2138007T3HU9R2V9SY68", "HE375602", "43270"],
      ["", "", "", "", ""],
    ],
    "EMIs-licence withdrawn": [
      ["Licence no.", "Names of licensed EMI"],
      ["115.1.3.12", "ATLAS PAY LIMITED"],
      ["", "The licence of Atlas Pay Ltd is no longer valid as this institution has not made use of that licence"],
      ["115.1.3.11", "Ezeewallet Ltd\n(licence withdrawn on 13/02/2019)"],
    ],
    "Agents - Distrib EMIs CY": [["Oktopay_Limited_Sureswipe_CY"]],
  }), wantedCbcSheet);
  const out = parsePaymentWorkbooks(emi, []);

  it("only reads the licence sheets", () => {
    expect(emi.map((s) => s.name)).toEqual(["EMIs", "EMIs-licence withdrawn"]);
  });
  it("reads licence number, registration number, LEI, date and names", () => {
    expect(out[0].list).toBe(CBC_LISTS.emi);
    expect(out[0].entry).toMatchObject({
      entity_name: "Nuvei Limited", license_number: "115.1.3.9/2018", registration_no: "129880",
      lei: "98450092FC6781F74S30", license_date: "2018-07-19", status: "Active", former_names: ["Safecharge Limited"],
    });
    expect(out[1].entry).toMatchObject({ entity_name: "Sureswipe E.M.I. PLC", license_date: "2018-06-19", trade_names: ["Revsto"] });
  });
  it("reads withdrawn and lapsed licences as former", () => {
    expect(out.slice(2).map((x) => [x.entry.entity_name, x.entry.status, x.entry.termination_date, x.list.former])).toEqual([
      ["ATLAS PAY LIMITED", "Lapsed", null, true],
      ["Ezeewallet Ltd", "Withdrawn", "2019-02-13", true],
    ]);
  });
});

describe("cbcFlagsFor", () => {
  it("shows the active licence when a firm also holds a not-yet-active one", () => {
    const f = cbcFlagsFor([
      { status: "Licence not yet activated", license_type: "Electronic Money Institution (EMI)", license_number: "115.1.3.36", priority: 3 },
      { status: "Active", license_type: "Payment Institution (PI)", license_number: "115.1.2.9/2018", priority: 4 },
    ]);
    expect(f).toEqual({ cbc_supervised: true, cbc_license_type: "Payment Institution (PI)", cbc_license_number: "115.1.2.9/2018", cbc_status: "Active" });
  });
  it("a withdrawn licence alone is not supervised", () => {
    expect(cbcFlagsFor([{ status: "Withdrawn", license_type: "Payment Institution (PI)", license_number: "115.1.2.20", priority: 14 }]).cbc_supervised).toBe(false);
    expect(cbcFlagsFor([]).cbc_supervised).toBe(false);
  });
});
