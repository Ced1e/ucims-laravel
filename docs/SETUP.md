# UCIMS — Setup Guide

Works for **Windows**, **macOS**, and **Linux**. See the section that matches your situation:

1. [Fresh clone (never set it up before)](#1-fresh-clone-never-set-it-up-before)
2. [Already cloned, new push (e.g. `prescription_id` errors)](#2-already-cloned-new-push)

---

## 0. Requirements

| Tool | Version |
| --- | --- |
| PHP | 8.2+ (with `pdo_sqlite` or `pdo_pgsql`) |
| Composer | 2.x |
| Node.js | 20+ (LTS recommended) |
| npm | ships with Node |

The app runs fine on **SQLite** (default, zero configuration) or **PostgreSQL** if you prefer. You do **not** need to commit or copy the database file — schema comes from migrations, demo data from seeders.

---

## 1. Fresh clone (never set it up before)

```bash
git clone https://github.com/Ced1e/ucims-laravel.git
cd ucims-laravel

composer setup   # installs PHP deps, creates .env, generates APP_KEY,
                 # touches database/database.sqlite (SQLite), runs migrations,
                 # installs JS deps, builds the front-end

php artisan db:seed   # demo users + PPR (demographics, permanent, questionnaire, health record)
php artisan serve     # http://127.0.0.1:8000
```

Front-end only changes? You can skip `composer setup` pieces you already have; what always matters is:

```bash
composer install
cp .env.example .env      # if .env doesn't exist yet
php artisan key:generate  # if APP_KEY is empty
php artisan migrate
php artisan db:seed
npm install && npm run build
```

### Test accounts (created by `db:seed`)

| Role | Clinic ID | Password |
| --- | --- | --- |
| Admin | `A-001` | `Password123!` |
| Doctor | `D-001` | `Password123!` |
| Nurse | `N-001` | `Password123!` |
| Patient (Maria Santos) | `P-001` | `Password123!` |

---

## 2. Already cloned, got a new push (your classmate's situation)

If the app suddenly errors with something like:

```
SQLSTATE[42703]: Undefined column: 7 ERROR: column "prescription_id" does not exist
```

**the code is newer than your local database.** The fix is one command:

```bash
git pull origin Espaldon
composer install
npm install && npm run build   # public/build is gitignored, so assets must be rebuilt
php artisan migrate            # applies only the migrations you're missing
php artisan db:seed            # optional — refreshes the demo accounts/PPR data (safe to re-run)
```

If your local database is already broken or out of sync and you don't care about local data:

```bash
php artisan migrate:fresh --seed   # DROPS ALL TABLES and re-seeds — dev only!
```

> **Rule of thumb:** after every pull that includes a `database/migrations/` change, run `php artisan migrate`. After every pull that includes seeder changes you want locally, run `php artisan db:seed`.

### Front-end changes not showing up?

`public/build` is gitignored, so `npm run build` (or `npm run dev`) is required after pulling. On Windows PowerShell:

```powershell
npm run build
```

### Working on the login/JS live?

```bash
npm run dev   # Vite dev server; recreates public/hot automatically
```

---

## Notes & rules

- **Never commit** `.env`, `database/database.sqlite`, or anything under `public/build/` — they are gitignored for a reason (secrets, local data, build noise).
- **Never** edit an already-pushed migration. Add a new one (`php artisan make:migration ...`) so every machine can `migrate` cleanly.
- If you use **PostgreSQL** instead of SQLite, set `DB_CONNECTION=pgsql` (and `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) in `.env` before the first `php artisan migrate`.
- Queue/cache/session tables (`CACHE_STORE=database`, `SESSION_DRIVER=database`) are created by the same `php artisan migrate` run; no extra steps needed.
- If `php artisan migrate` asks *"The database 'database/database.sqlite' does not exist. Create it?"* — answer `yes`, or `touch database/database.sqlite` yourself.
