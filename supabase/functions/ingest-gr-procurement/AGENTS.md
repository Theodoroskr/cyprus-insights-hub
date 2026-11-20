# Greek public procurement (KIMDIS)

- Source: KIMDIS Open Data API (`notice` = tenders, `auction` = awards), no key; daily schedules for tenders, awards, then the saved-search digest. Rules in `_shared/kimdis.ts`, shared with the site. Why: one rule set for the page and the digest.
- Only focus areas are stored (IT, cybersecurity, compliance, professional services: CPV prefixes + title keywords in `focusOf`). Why: keep the list relevant and small.
- One row per ADAM reference (upsert); an amendment marks the notice it amends `superseded_by`; KIMDIS times are Athens local time. Why: reruns and amendments never duplicate a notice.
- "Open Tenders" = tender, not cancelled/superseded, future `deadline_at`; missing fields stay null and show as unavailable. Why: no guessed status.
- A failed run keeps stored notices and records the error on the `kimdis-procurement` row of `open_data_sources`; scheduled runs continue past the time budget in a fresh call. Why: no silent gaps.
