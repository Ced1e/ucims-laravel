# Pagination coverage

All record views use the shared 20-record paginator. Search/filter/grouping happens before the render boundary; full collections remain available for totals, charts and exports. Each list has independent Previous/Next controls, displayed range, total and page count. Membership/order changes reset list pages; deletion clamps pages. Status/name/count polling edits preserve the page. TV panels automatically rotate every ten seconds and retain every ticket.

- pages/Nurse/Dashboard.jsx: filtered (table)
- pages/Nurse/Dashboard.jsx: visits (table)
- pages/Nurse/Dashboard.jsx: filtered (table)
- pages/Nurse/Dashboard.jsx: filtered (table)
- pages/Nurse/Dashboard.jsx: rx
- pages/Nurse/Dashboard.jsx: meds
- pages/Nurse/Dashboard.jsx: patients (table)
- pages/Nurse/Dashboard.jsx: doctorRx (table)
- pages/Nurse/Dashboard.jsx: list
- pages/Nurse/Dashboard.jsx: certs (table)
- pages/Nurse/Dashboard.jsx: active
- pages/Doctor/Consultation.jsx: groups (table)
- pages/Doctor/Consultation.jsx: filtered (table)
- pages/Doctor/Consultation.jsx: certs (table)
- pages/Doctor/Consultation.jsx: active (table)
- pages/Admin/Analytics.jsx: table (table)
- pages/Admin/Analytics.jsx: staff (table)
- pages/Admin/Analytics.jsx: patients (table)
- pages/Patient/Portal.jsx: active (table)
- components/doctor-record-management.jsx: filtered (table)
- components/doctor-record-management.jsx: visits (table)
- pages/TvQueue.jsx: entries (automatic rotation)
- pages/TvQueue.jsx: board.done (automatic rotation)
- pages/Nurse/Services.jsx: queues
- pages/Nurse/Services.jsx: medicines (table)
- pages/Nurse/RecordDeletionRequests.jsx: requests (table)
- pages/Nurse/Queue.jsx: queues (table)
- pages/Nurse/MedCerts.jsx: certificates (table)
- pages/ClinicQueue/Index.jsx: clinicQueues (table)
- pages/Consultations/Index.jsx: consultations (table)
- pages/Endorsed/Index.jsx: endorsedItems (table)
- pages/LabRequests/Index.jsx: requests (table)
- pages/MedicalCertificates/Index.jsx: certificates (table)
- pages/MedicineIssuances/Index.jsx: issuances (table)
- pages/PatientAuth/Index.jsx: auths (table)
- pages/PprDemographics/Index.jsx: demographics (table)
- pages/PprHealthQuestionnaires/Index.jsx: questionnaires (table)
- pages/PprHealthRecords/Index.jsx: records (table)
- pages/PprPermanents/Index.jsx: permanents (table)
- pages/Prescriptions/Index.jsx: prescriptions (table)
- pages/Staff/Index.jsx: staff (table)
- pages/TriageRecord/Index.jsx: records (table)
- pages/TriageRecords/Index.jsx: triageRecords (table)

- components/manage-passkeys.tsx: registered passkey records (settings page).

## Deliberate exclusions from record pagination

- Nurse/Doctor/Admin navigation groups and links: fixed navigation, not history records.
- Nurse and Doctor vital rows, Patient detail fields: fixed clinical fields for a single encounter.
- Dropdown options (colleges, years, patient types, staff/doctors/patient selectors, roles, medication routes): selection controls; pagination would hide valid choices from a native select.
- Doctor prescription editor rows and laboratory attachment input rows: editable fields in one encounter, kept together so validation and saving remain visible. Lab group summaries and prescription summary strings transform a single record rather than render lists of records.
- Analytics chart dates, weekday buckets, distinct filter values, permission matrices and grouping transformations: calculations/configuration retain all data. Only the final grouped table is paginated.
- Patient portal workflow steps and consultation-type buttons: fixed workflow choices. This version exposes a current queue list rather than a separate patient history; its current queue is paginated.
- Registration questionnaire/health-system choices, welcome service cards, global navigation, breadcrumbs, appearance tabs, error messages, two-factor recovery codes: fixed UI/form/security content, not clinical records.
- API payload maps, state updates, date parsing and batch persistence maps: data processing, not rendered history lists; unchanged.

TV panels use four tickets per page (below the maximum20) with automatic ten-second rotation; completed cards wrap instead of clipping overflow. Identical polling responses retain the current page; changes to regular list membership/order reset to page1 and every page is clamped. No API response contracts or backend queries were changed.

## Verification

- Before implementation: node --test tests/pagination.test.mjs failed with ERR_MODULE_NOT_FOUND for the not-yet-created pagination utility.
- After implementation: node --test tests/pagination.test.mjs tests/pagination-render.test.mjs: 10 passed. Covers empty/20/21/41, invalid pages/deletions, filtering before paging, complete TV rotation coverage, the maximum cap, actual20-row table output, spanning pagination cell, accessible navigation and disabled empty controls.
- TypeScript check passed: npx tsc --noEmit --pretty false. All 27 pagination-containing JSX/TSX files parsed with no syntax errors.



## Interaction verification (synthetic records only)

- node tests/pagination-browser.mjs: PASS in real headless Chromium with45 synthetic records. Verified maximum20 rendered records, next/back/last-page boundaries and disabled buttons, filtering before paging and reset, deletion from the last page, independent lists, and page preservation after status polling updates. No browser page errors.
- Fixture: tests/browser/pagination.html + pagination-fixture.jsx. Runner uses existing bundled Playwright and a temporary Chrome context; loopback-only Vite server is closed afterward. No backend endpoints, user browser profile, actual patient records or database access.
- Ordered record IDs (id, key, queueNumber and *_id fields) now determine reset identity. Content-only edits preserve page. Membership/order changes reset to page1; this deliberately treats a newly arriving record like a changed result set, while every page remains clamped. Keyless records use value identity as a fallback. Filter changes yielding exactly the same ordered records retain the current page because the visible result set is unchanged.
