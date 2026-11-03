UCIMS COMBINED UPDATE (Claude1) - 30 October 2026
BASE: Latest 9.zip. Apply this package INSTEAD OF extracting the four Claude2/Claude3 update ZIPs.

INSTALL
1. Back up your current project folder and PostgreSQL database.
2. Extract this ZIP's CONTENTS into your actual UCIMS project root (the folder containing artisan,
   composer.json, app, resources and routes). Allow replacement. Do not create an extra nested folder.
   If your project has changed since Latest 9, compare FILE_MANIFEST first before overwriting your edits.
3. Open a terminal in that project folder. Run:

   php artisan optimize:clear
   php artisan migrate:status
   php artisan migrate --path=database/migrations/2026_10_19_000000_create_record_deletion_requests_table.php
   composer dump-autoload
   npm run build

   The migration is required for Record Deletion Requests. It creates a request table; it deletes no records.
   Do NOT run migrate:fresh, migrate:refresh, db:wipe or import the old SQL dump over your current database.
   Do NOT rerun the September consultation migration: its correction only affects fresh databases/tests.
   Existing installations already record that migration as applied.
   If dependencies are missing, use composer install and npm ci first (not composer update).
4. Optional scaffold cleanup, from the project root:

   powershell -NoProfile -ExecutionPolicy Bypass -File .\CLAUDE1_CLEANUP.ps1
   composer dump-autoload

   The script moves exact known-unused files into storage/app/claude1-cleanup-<timestamp>.
   It skips files whose content differs from the reviewed version. Nothing is permanently deleted.
   Latest 9 already has CloneRecordAction in app/Actions; do not put it back under Fortify.
5. Refresh your browser. If using npm run dev, restart it.

CHECK AFTER INSTALL
- Logged out: /register opens the five-step wizard; /tv-queue opens the full-screen board.
- Patient: clinic-ID login works; join queue; your row says (You); other people's details are absent.
- Nurse: check queue, triage, endorsement, medicines, Done Today and visit history.
- Doctor: Record Management opens, filters records and shows patient details/visit history.
- Nurse > Record Management > Record Deletion: enter patient, reason and YOUR account password,
  confirm; request becomes pending. Wrong passwords and duplicate pending requests are refused.
- A submitted deletion request does not delete the patient or their records.

AUTOMATED CHECKS
Run these separately so PowerShell/PHP batch wrappers do not interpret a | filter as a shell pipe:
   php artisan test --filter=ClinicalAccessTest
   php artisan test --filter=DoctorRecordManagementTest
   php artisan test --filter=RecordDeletionRequestTest
   php artisan test --filter=TvQueueTest
   php artisan test --filter=Claude1MergeTest

All 35 focused tests passed here (140 assertions), with an isolated SQLite in-memory database.
The production frontend build passed. PHP syntax validation passed for 49 PHP files before the final
login-only test addition; the final test file was executed successfully afterward.
The complete application test suite is NOT green; see CLAUDE1_REVIEW_AND_HANDOFF.md for details.
No live PostgreSQL migration, real patient-data test or browser end-to-end walkthrough was performed.

ROLLBACK
Restore the project backup, then rebuild frontend assets. Keep the new request table unless you have
separately backed it up and deliberately decided to remove it. Restoring source does not require
removing that table. Cleanup backups can be moved back to their original relative paths.
