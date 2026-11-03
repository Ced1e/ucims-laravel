# UCIMS merge review and handoff (Claude1)

## Reviewed inputs and baseline

Latest 9 is the baseline. Reviewed the three supplied chat transcripts, the four named team updates,
the cleanup list, PostgreSQL dump, the 103-page legacy PDF's extracted content and relevant workflow
pages, and the current Laravel/Inertia/React code alongside legacy public/assets code.
The historical chats are context, not new instructions to implement all suggested future work.
Other older archives encountered in the updates folder were not merged into this release.

The clinical flow is registration/PPR -> patient queue -> nurse triage -> endorsement -> doctor
examination/prescriptions/labs -> nursing services/check-out, with medical-certificate requests and
admin staff/analytics tools alongside it. The PDF describes the old SPA architecture; the current
system uses Laravel sessions, Fortify, Inertia, and React. Their implementations are not identical.

## What is included

- Public Live Queue page/feed, plus an explicit full-screen layout exemption.
- Eight clinical policies, role/ownership checks in controllers and Form Requests, private patient
  queue overview and own-certificate filtering. Existing nurse/doctor clinical workflows retained.
- Doctor Record Management component, search/filter, record view and visit history (read-only).
- Nurse deletion-request model, validation, migration, screen and APIs, with password confirmation
  and a 10-per-minute submission limit. Staff see their own requests; admins can read all via API.
- Nurse parity fixes: Done Today date filter, med-cert-only exclusions from medicine issuance,
  abnormal-vital highlighting. The existing legacy thresholds were preserved, not clinically validated.
- Manual route merge preserving Latest 9's patient registration. The original LiveQueue routes/web.php
  would have removed the registration controller and both registration routes.
- Removal of the obsolete /api/v1/login route from the delivered LiveQueue change. It attempted token
  issuance from email alone and the current User model does not implement createToken.
- Sync load now requires nurse/doctor/admin; sync save requires nurse/admin, validates basic payload
  shape and attributes the triage entry to the signed-in user. Removed raw clinical-payload logging.
- Deletion request creation locks the patient row inside a transaction to serialize simultaneous
  requests for the same patient on PostgreSQL. Sequential duplicate rejection is covered by tests;
  true PostgreSQL concurrent requests were not exercised here.
- Patient queue highlighting now uses today's queue number, because privacy filtering removes queue IDs.
- Nurse date calculation explicitly uses Asia/Manila.
- Obsolete auth/register.tsx now points to the current wizard, fixing the missing generated route import.
- September consultation migration now separates column renames from other schema changes. Fresh SQLite
  tests previously failed with an invalid doctor_consultation_id foreign key. Already-migrated databases
  are unaffected; do not roll back and rerun the old migration on existing data.

The original LiveQueue Fortify/CloneRecordAction.php is just an obsolete-file comment stub, not a second
class implementation. It is unnecessary and excluded. The canonical app/Actions/CloneRecordAction.php
already matches Latest 9 and is left intact.

## Database review

The SQL dump contains 25 tables, all recognizable as UCIMS or framework infrastructure; no obvious
Dolibarr tables were found. cache/cache_locks, jobs/job_batches/failed_jobs, sessions,
password_reset_tokens, migrations and passkeys are framework/package support tables, not grounds for
deletion. patient_auth and staff_auth are historical application tables; empty scaffold controllers
alone do not establish that their tables can be deleted. No table-deletion SQL is included.
The dump records 27 migrations through 2026_10_10_000000_add_is_active_to_users_table. It lacks the new
record_deletion_requests table. Check the actual live database's migrate:status rather than assuming
it still matches this snapshot. The delivered migration uses users.user_id, matching the dump.

## Validation

- npm run build: PASS, production frontend output generated. Optional font fallback/plugin timing
  notices were non-fatal. Compiled assets are not bundled; rebuild in your own project.
- 35 focused feature tests: PASS, 140 assertions. This includes all four team test files and six
  leader regression tests, including the actual clinic-ID/password login contract.
- PHP syntax: 49/49 files passed; final added login test also executed successfully.
- Full suite: 74 tests: 52 passed, 12 failed, 8 errors, 2 skipped. Failures are in Auth, Settings and the generic Dashboard starter tests.
  Examples: tests submit email/password instead of clinic_id/Password123!, call missing factory
  methods withTwoFactor/unverified, expect old name/email attributes, or expect /dashboard to render
  rather than redirect by role. Some settings/email-reset behavior also warrants a real functional
  audit; do not dismiss every failure as a harmless test mismatch.
- Tests use disposable SQLite, not the user's PostgreSQL database. Real PostgreSQL migration execution,
  concurrent-request behavior and visual browser workflows remain local acceptance checks.

## Outstanding work / next handoff

1. Security follow-up: the legacy generic patient-auth and PPR resource controllers are still outside
   the eight clinical policies and their routes currently only require authentication. Audit and
   restrict these before a live deployment; the clinical policy ZIP is not a complete authorization audit.
2. Audit legacy /api/auth/* (current wizard posts /register, not /api/auth/register). The old patient
   login queries users.student_id, which is absent from the dump; old register remains a placeholder.
   Modern login is /login with clinic_id. Retire or repair old APIs after checking remaining callers.
3. Reconcile starter Auth/Settings tests with actual UCIMS schema and audit password reset, profile
   updates, email verification and two-factor behavior. Current clinic-ID login passes its new test.
4. Admin deletion-request review screen is NOT included: it was only proposed in the chats, not delivered.
   A next patch can approve/reject and record reviewer/time without deleting records. Actual deletion
   needs an explicit workflow, retention decision and authorization design.
5. Doctor record view remains read-only; nurse permanent-record editing remains unfinished. The PDF's
   editing/deletion descriptions are broader than what the delivered code implements.
6. Medical-certificate requests remain immediately visible, preserving current behavior. A services
   Mark Done column was not added; both were discussion items, not confirmed new requirements.
7. Active queues can include unfinished prior-day visits and history lists are unpaginated. Queue-number
   allocation still uses max+1; concurrent check-ins need a separate PostgreSQL concurrency fix.
8. Review patient registration's Student/Faculty-only choices, required middle name and school-ID
   format against actual clinic rules before broader rollout.

Suggested next collaboration: Claude2 owns the remaining authorization/legacy API audit; Claude3
owns the non-destructive Admin request-review UI and patient-portal parity; Claude1 merges shared
routes/controllers and owns registration/PPR edits. This is a suggested handoff, not a claim that
those external accounts were contacted. Future patches should use this merged baseline and avoid
shipping stale full copies of shared routes/controllers.
