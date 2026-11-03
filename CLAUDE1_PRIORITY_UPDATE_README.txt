UCIMS PRIORITY UPDATE (Claude1) - November 2, 2026

INSTALLATION
1. Back up your entire C:\xampp\htdocs\UCIMS-USeP folder before replacing files.
2. Stop the frontend development server. Extract the CONTENTS of this ZIP directly
   into C:\xampp\htdocs\UCIMS-USeP. Allow replacement of matching files.
   The ZIP has app, resources and tests at its root; do not put them in a new subfolder.
3. Open a terminal in that project folder and run:
     composer dump-autoload
     php artisan optimize:clear
     npm run build
4. Restart your usual application/dev server as needed and hard-refresh the browser
   (Ctrl+Shift+R). If you normally use npm run dev, restart it after the build.

No SQL import, database migration, new dependency, .env replacement or data cleanup
is required. Keep your existing database and configuration. This patch was built
against the current installed project, not an untouched Latest 9 archive. If you
have edited files since this update was prepared, compare the manifest and merge
those changes before replacement. The manifest contains before/after SHA-256 hashes.

CHANGES
- Homepage: one Register button on the left and one Login button on the right.
- Login: university maroon/gold decorative left panel, right-side form, mobile
  stacked layout, password visibility toggle, labels and autocomplete. Login still
  uses Clinic ID for both staff and patients; email authentication was not added.
- Shared pagination across 44 collection surfaces: up to 20 visible records per
  page, independent controls, filter resets and stable pages during status polling.
  Live TV panels show four tickets per page and rotate every ten seconds.
  Full collections still feed counts/charts/exports. This is display pagination;
  the API still fetches full collections. Selectors and editable form rows are not
  paginated. See the included coverage document for the exact surfaces.
- Input validation: registration/staff names and lengths, real calendar dates,
  phone formats, conditional registration data, triage numeric formats, certificate
  date order/release requirements, role-appropriate references and actor preservation.
  Clinical forms surface server field errors. Prescription entries are checked
  before the existing replacement sequence begins. Offline triage batches validate
  before writes and preserve omitted fields within a transaction.
- Existing registered height/weight values with cm/kg remain accepted. Medicine
  quantities remain text (for example, 10 tabs). No new clinical thresholds were
  invented. Existing registration ranges and dropdown choices are preserved.
- Corrected generic list model identifiers/props and edit paths encountered while
  applying pagination. Fixed compiled asset loading for the public entry pages.

VERIFICATION
All execution used the isolated copy and disposable SQLite/synthetic browser data.
No live source or database was modified. All 495 captured live baseline files were
verified unchanged when packaging. PHP syntax checked for every shipped PHP file.
- Focused Priority backend tests: 18 passed, 110 assertions (after final correction).
- Frontend validation/pagination/resource-list tests: 33 passed.
- Production frontend build and TypeScript check passed.
- Browser: desktop split login, mobile layout/no overflow, one homepage button of
  each kind, password visibility, registration rendering and no JavaScript errors.
- Pagination browser fixture with 45 synthetic records: navigation, last page,
  filtering, deletion, independent lists and polling preservation passed.
- Broader suite BEFORE the final unit-format correction: 69 passed, 12 failures,
  8 errors and 2 skipped (91 tests). Existing auth/settings/factory expectations
  remain unresolved; this is not a claim that the full application suite is green.
  The final correction was verified with the focused suite, not a full-suite rerun.

LIMITATIONS / REMAINING WORK
Not verified: live PostgreSQL execution, real-account end-to-end workflows, every
authenticated screen in a browser, and your local deployment after extraction.
Existing malformed records are not rewritten and may need correction on editing.
This is the requested priority update, not completion of every audit/DTR item.
Outstanding audit concerns include password/settings storage and access controls,
clone-password behavior, prescription/issuance consistency and retry atomicity,
print escaping, and legacy generic Create/Update field contracts. The generic
ClinicQueue Index component remains dormant because its index endpoint returns JSON.
Clinical ranges, some status transitions and unclear business rules need agreement
before further restrictions are introduced. Consult the earlier audit for details.

LOCAL CHECKS AFTER INSTALLATION
Use a test database or disposable records for submission tests; do not run the test
suite against your live database. Confirm phpunit.xml selects SQLite :memory:.
     php artisan test --filter=Priority
     node --test tests/frontend/*.test.mjs tests/pagination.test.mjs tests/pagination-render.test.mjs tests/resource-index-render.test.mjs
The optional browser fixture needs Playwright and Chrome tooling; it is not an
application dependency. Its runner supports PLAYWRIGHT_ENTRY and CHROME_PATH.
Manually check landing/login, a list with more than 20 records, searching from a
later page, invalid dates/blank required fields and a valid disposable submission.

ROLLBACK
Restore backed-up versions of files listed in the manifest; remove files whose
before_sha256 is null (new files in this patch), then run optimize:clear and build
again. No database rollback is needed because this patch contains no migrations.
