import { describe, expect, it } from "vitest";
import {
  cleanEntityName, directoryFlagsFor, mapCysecStatus, parseCysecRegister, pickPrimaryLicence,
} from "../../supabase/functions/_shared/cysecRegister";

const card = (name: string, body: string, id = "1") => `
<div class="card-header"><a href="/en-GB/entities/investment-firms/cypriot/${id}/" class="card-title">${name}</a></div>
<div class="card-body">${body}</div>`;

const html = [
  card("26 Degrees Global Markets (EU) Ltd (ex Invast Financial Services (EU) Ltd)",
    `<div><strong>Licence Number</strong>: 435/23 </div><div><strong>Licence Date:</strong> 04/09/2023 </div>
     <div><strong>Company Registration Number</strong>: HE 427102 </div>
     <div><strong>E-Mail</strong>: <a href="mailto:compliance@26degrees.com.cy">compliance@26degrees.com.cy</a></div>`, "96061"),
  card("3D Global Financial Services Ltd",
    `<div><strong>Licence Number</strong>: 063/06 </div><div><strong>Company Registration Number</strong>: 86659 </div>`, "37722"),
  card("4XHUB EU Limited",
    `<div><strong>Licence Number</strong>: 437/23 <span style="color:#eb0000; font-weight:bold;"><span>(Under examination for voluntary renunciation of the authorisation)</span></span></div>
     <div><strong>Company Registration Number</strong>: 419115 </div>`, "95928"),
].join("");

describe("CySEC register parser", () => {
  const entries = parseCysecRegister(html, { former: false });

  it("reads licence number, registration number (with or without HE) and detail link", () => {
    expect(entries.map((e) => [e.license_number, e.registration_no])).toEqual([
      ["435/23", "427102"], ["063/06", "86659"], ["437/23", "419115"],
    ]);
    expect(entries[0].detail_url).toBe("https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/96061/");
    expect(entries[0].license_date).toBe("2023-09-04");
  });

  it("drops former-name notes from firm names", () => {
    expect(entries[0].entity_name).toBe("26 Degrees Global Markets (EU) Ltd");
    expect(cleanEntityName("Kronstadt Asset Management Ltd (revoke 09/03/2026)")).toBe("Kronstadt Asset Management Ltd");
  });

  it("maps CySEC wording to statuses", () => {
    expect(entries.map((e) => e.status)).toEqual(["Active", "Active", "Renunciation pending"]);
    expect(mapCysecStatus("Voluntary Suspension")).toBe("Voluntary suspension");
    expect(mapCysecStatus("Suspended")).toBe("Suspended");
    expect(mapCysecStatus("revoke 09/03/2026")).toBe("Revoked");
    expect(mapCysecStatus("Withdrawn", true)).toBe("Withdrawn");
    expect(mapCysecStatus(null, true)).toBe("Former licence");
  });
});

describe("company CySEC badge", () => {
  it("prefers a current licence over a revoked one", () => {
    const rows = [
      { status: "Revoked", license_type: "AIFM", license_number: "AIFM55/56/2013", priority: 13 },
      { status: "Active", license_type: "AIFM", license_number: "AIFM61/56/2013", priority: 3 },
    ];
    expect(pickPrimaryLicence(rows)?.license_number).toBe("AIFM61/56/2013");
    expect(directoryFlagsFor(rows).cysec_licensed).toBe(true);
  });

  it("marks firms with only former licences as not currently licensed", () => {
    const f = directoryFlagsFor([{ status: "Withdrawn", license_type: "CIF", license_number: "095/08" }]);
    expect(f).toMatchObject({ cysec_licensed: false, cysec_status: "Withdrawn", cysec_license_number: "095/08" });
  });

  it("keeps firms pending renunciation or suspended as licensed", () => {
    expect(directoryFlagsFor([{ status: "Renunciation pending", license_type: "CIF", license_number: "437/23" }]).cysec_licensed).toBe(true);
    expect(directoryFlagsFor([{ status: "Suspended", license_type: "CIF", license_number: "115/10" }]).cysec_licensed).toBe(true);
  });

  it("clears the badge when no licence rows remain", () => {
    expect(directoryFlagsFor([])).toMatchObject({ cysec_licensed: false, cysec_status: null });
  });
});
