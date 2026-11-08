# UCIMS Input Validation Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `test-driven-development` while implementing every task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure UCIMS forms reject malformed structured data in the browser and on the server, with readable field-level guidance and no database or visual redesign.

**Architecture:** Reuse Laravel `InputRules` as the server-side source of truth for structured data. Add a small framework-free JavaScript validation/formatting module for masks and numeric constraints, then apply it only to clinical, account, registration, and staff fields whose formats are objectively defined; narrative clinical fields remain unrestricted text.

**Tech Stack:** Laravel Form Requests, Pest/PHPUnit feature tests, React/Inertia, JavaScript modules, Vite.

**Spec:** User request from 2026-11-08.

## Global Constraints

- Do not change existing UI design, page layout, workflows, routes, or database schema.
- Validate on the client for fast feedback and on the server for security.
- Patient email addresses must use `@usep.edu.ph`.
- Preserve existing valid stored formats such as staff IDs (`N-001`) and patient IDs (`2024-00001`).
- Never force a number-only constraint on free-form medical notes, diagnoses, medicine names, dosage, or instructions.

---

### Task 1: Shared browser formatting and validation helpers

**Files:**
- Create: `resources/js/lib/input-validation.mjs`
- Create: `tests/frontend/input-validation.test.mjs`

**Interfaces:**
- Produces `formatPhilippineMobile(value)`, `formatClinicId(value, kind)`, `formatBloodPressure(value)`, `numericInput(value, { min, max, decimals })`, and `usepEmailError(value)`.

- [ ] Write Node tests for valid and malformed mobile, Clinic ID, blood-pressure, numeric, and USeP email values.
- [ ] Run `node --test tests/frontend/input-validation.test.mjs` and confirm the tests fail because the module does not yet exist.
- [ ] Implement only the helper functions required by the tests.
- [ ] Re-run the Node tests and confirm they pass.

### Task 2: Client-side validation for structured primary forms

**Files:**
- Modify: `resources/js/components/registration/StepPersonal.jsx`
- Modify: `resources/js/components/registration/StepHealth.jsx`
- Modify: `resources/js/components/registration/StepFemale.jsx`
- Modify: `resources/js/components/registration/StepAccount.jsx`
- Modify: `resources/js/pages/auth/Login.tsx`
- Modify: `resources/js/pages/Nurse/Dashboard.jsx`
- Modify: `resources/js/pages/Admin/Analytics.jsx`

**Interfaces:**
- Consumes helpers from `resources/js/lib/input-validation.mjs`.
- Produces masked structured input, native numeric constraints, and present inline feedback without touching design classes.

- [ ] Apply mobile and Clinic-ID masks with `inputMode`, `pattern`, and `maxLength`.
- [ ] Apply a blood-pressure mask and numerical min/max/step constraints to vital measurements.
- [ ] Apply USeP email client validation to patient and staff account entry.
- [ ] Add concise inline error text alongside existing submit feedback for nurse triage and admin staff forms.
- [ ] Run `npm run types:check` and confirm it passes.

### Task 3: Server-side parity and regression tests

**Files:**
- Modify: `app/Http/Requests/Concerns/InputRules.php`
- Modify: `app/Http/Requests/StoreStaffProfileRequest.php`
- Modify: `app/Http/Requests/UpdateStaffProfileRequest.php`
- Modify: `app/Http/Controllers/RecordController.php`
- Modify: `tests/Feature/PriorityValidationTest.php`
- Modify: `tests/Feature/PriorityInlineValidationTest.php`

**Interfaces:**
- Server accepts all correctly formatted values from Task 2 and returns `422` validation errors for malformed values.

- [ ] Write failing Feature tests for non-USeP staff email, malformed staff Clinic ID, and out-of-range triage vitals.
- [ ] Run the focused Pest tests and confirm the new assertions fail for the missing rules.
- [ ] Add server rules that match the browser formats while preserving valid legacy staff IDs.
- [ ] Run focused tests, then the project validation suite.

### Task 4: Build verification

**Files:**
- No production changes expected.

- [ ] Run `npm run types:check`.
- [ ] Run the production Vite build with the Herd PHP path.
- [ ] Run focused Laravel/Pest validation tests and report any unrelated existing failures separately.
