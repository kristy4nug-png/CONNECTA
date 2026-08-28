# Atlas release plan

Status at 4 August 2026: v0.4.1 Free Beta baseline; **not a release candidate**.

## Milestones and gates

1. **Release integrity and data preservation (in progress)** — introduce a versioned storage envelope/migrations, scoped deletion, validated export/restore, correct version metadata and hash-verified installer upgrade. Gate: fresh-install and v0.4.1 migration tests pass.
2. **Free v1 usability and safety** — complete first-run journey, validation/recovery states, offline state, responsive and keyboard/screen-reader work, urgent-help review, no dead links, and performance baseline. Gate: WCAG checklist, E2E/PWA/offline and mobile evidence pass.
3. **Release documentation** — draft policies, accessibility statement, safety/crisis policy, user guide, test evidence, SBOM, threat model, data flow, incident/DR plans and launch checklist. Gate: all drafts labelled and owner fields complete.
4. **Commercial foundations (test only)** — central pricing configuration, entitlement boundary, mocked billing/webhook/cancellation/refund tests. Gate: free records survive expiry and no client secrets exist. No live billing without Chris’s express approval and business/payment details.
5. **Organisation discovery and secure build** — independent backend/admin project and security architecture. Gate: automated tenant/RBAC boundary tests, DPIA/safety/security reviews, DPA and hosting decisions before any pilot data.
6. **External release gates** — legal review, independent penetration test, clinical-safety applicability assessment, accessibility audit, insurance/accounts/store registrations, production hosting/monitoring and current urgent-support verification.

No critical or high issue may remain open when declaring a v1.0 release candidate.

## Immediate first implementation milestone

Create a `CONNECTA_STORAGE` schema module and tests. It will detect legacy standalone local-storage keys, preserve unknown keys, record the migration only after validation, and provide scoped deletion and restore validation. This is intentionally free-only and does not introduce payment, accounts, cloud sync, tracking, or branding changes.

## Required release evidence

Record exact test command, environment, pass/fail/skip totals, asset hashes, migration fixtures, manual accessibility checklist, browser/device matrix and reviewer/date. Keep all external review reports separate from claims in product copy.

