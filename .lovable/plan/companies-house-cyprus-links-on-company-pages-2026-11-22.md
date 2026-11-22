# Companies House Cyprus links on company pages

## What changes
- On every company page (/directory/company/...), the free "Request KYB Report" box is removed and replaced by an "Official certificates & reports" box in the same place.
- The box has three buttons, all opening Companies House Cyprus in a new tab:
  - Certificate of Good Standing
  - Cyprus Company Profile
  - Cyprus Credit Report
- Plus an "All certificates" link to the company's page there.
- In the company search results, each result gets a small "Get official documents on Companies House Cyprus" link (new tab).

## Link rules
- With a registration number: `https://companieshousecyprus.com/company/{PREFIX}{registration_no}` and `?product=certificate-of-good-standing`, `?product=cyprus-company-profile`, `?product=cyprus-credit-report`; "All certificates" has no `?product`.
- PREFIX: HE for limited companies (the default, which covers all 61,025 "Company" records), AE for overseas companies, B for business names.
- No registration number, or a partnership: `https://companieshousecyprus.com/search?q={company name}`, with all buttons going there.
- Registration numbers that already include a prefix (for example "HE123") are not given a second one.

## Technical details
- New `src/lib/companiesHouseCyprus.ts`: `chcPrefix()`, `chcCompanyUrl(company, product?)`, picking the prefix from `organisation_type`/`organisation_sub_type` (overseas/αλλοδαπή → AE, business name/εμπορική επωνυμία → B, partnership/συνεταιρισμός → search).
- `RegistryCompanyPage.tsx`: replace `KYBReportCard` + `KYBPurchaseModal` with `OfficialDocumentsCard`. The KYB success/cancel pages stay, so old links still work.
- Search results (`RegistryDirectoryPage.tsx` / `SearchPage.tsx` company rows): add the link with `target="_blank" rel="noopener noreferrer"` and stop the click from also opening the row.
- Tests for prefix choice, product URLs, the search fallback and partnerships.
- Add a rule to AGENTS.md: official documents come only through these Companies House Cyprus links.
