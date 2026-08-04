# CONNECTA market-readiness audit

Audit date: 4 August 2026. Scope: the local CONNECTA project at the canonical project path. This is an engineering audit, not legal, clinical-safety, penetration-test, accessibility-certification, or procurement approval.

## Verified current state

The pre-audit browser build identified itself as **v0.4.1**, built 3 August 2026. The requested v0.5.0 baseline was not found. Package metadata and two component test scripts still said v0.3.0: this was a release-integrity defect. The first implementation milestone has now reconciled the project at **v0.4.2** (4 August 2026); v0.5.0 still was not found.

The app is a static Vanilla JavaScript PWA served locally by PowerShell 7. It has five primary navigation controls, local browser storage, a service worker, locked logo asset, no application backend, and no payment or organisation tenant. It contains daily check-ins, reflections/journal, support contacts, recovery-capital reviews, Recovery Bridge, appointments, Worker Handover, meeting records, accessibility preferences, Privacy Lock, data export, and location search that says it does not persist coordinates.

## Evidence collected

| Check | Result |
| --- | --- |
| Node version | v25.9.0 |
| PowerShell version | 7.6.3 |
| `npm test` after lockfile restore | 22 passed, 0 failed |
| Installed-file hash verifier | passed for v0.4.2 |
| Meeting component PowerShell test | passed |
| Recovery Bridge PowerShell test | passed |
| Primary navigation | exactly five buttons |
| Git repository | none present at this project path |

`npm ci` restored 39 locked packages and reported 0 vulnerabilities; it noted one deprecated transitive package (`whatwg-encoding`). Full tests were then rerun successfully.

## What already supports the v1 direction

- Free, local-first core functionality exists and the visible safety language is non-shaming.
- The logo asset is present and the header uses the required contained responsive image treatment.
- Privacy Lock uses WebCrypto PBKDF2 rather than storing the PIN itself.
- Recovery Passport and Worker Handover deliberately exclude selected private fields and require fresh handover consent.
- The PWA manifest, icons and service worker exist; core files are precached.
- Tests exist for meeting domain logic and Recovery Bridge privacy boundaries.
- External fellowship readings are linked to official sites rather than copied.

## Release blockers

### Critical

1. **No release evidence for sensitive-data processing.** A public/organisation release needs a completed DPIA, lawful-basis/Article 9 analysis, privacy notices, retention policy, controller/processor allocation, and accountable owner. The current app carries recovery/health-related data in unencrypted browser local storage.
2. **No organisation-safe architecture.** A static browser app cannot deliver tenant isolation, RBAC, audit trails, secure staff identity, revocable consent records, data-subject workflows or safe cross-device sync.
3. **No clinical safety case or qualified review.** The app contains urgent-support and recovery guidance; NHS deployment cannot be claimed without determining DTAC/DCB0129/DCB0160 applicability with a Clinical Safety Officer.

### High

1. The pre-audit version/test mismatch is fixed in v0.4.2, and a basic versioned storage foundation now preserves legacy records. Full fixture coverage for every historic release is still needed.
2. Validated whole-app restore and scoped deletion now exist, but encrypted export, restore UX accessibility testing and real-browser failure testing remain needed.
3. The installer deletes the existing target recursively before copying the package. It does not validate the full payload first, does not provide rollback, and can leave a half-installed app.
4. Tests are incomplete: no PWA/offline, accessibility automation/manual evidence, performance, security, subscription or tenant-isolation tests.
5. No public privacy policy, terms, safeguarding/crisis policy, accessibility statement, support contact or release documentation exists.

### Medium

- Several controls need a formal WCAG 2.2 AA audit; static review found unlabeled form controls and dynamically generated HTML that needs complete keyboard/screen-reader verification.
- Offline fallback currently returns `index.html` for any failed GET, including non-navigation requests; runtime external service availability and offline UI states are not fully modelled.
- The local PowerShell launcher is suitable for private/local use but is not a public HTTPS hosting solution.
- No SBOM/licence report or dependency security scan is committed.

### Low

- Product wording, manifest name and README still say “Free Beta”.
- The project has no source-control history at this location, reducing traceability.

## Regulatory and safety research (accessed 4 August 2026)

- [ICO: special category data and DPIAs](https://ico.org.uk/media/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr-1-1.pdf) says a UK GDPR Article 6 lawful basis and Article 9 condition are both needed, and high-risk processing requires a DPIA.
- [GOV.UK accessibility requirements](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps) states public-sector websites/apps must meet WCAG 2.2 AA and publish an accessibility statement. Applicability to a specific purchaser still requires advice.
- [NHS England digital clinical safety assurance](https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/) describes DCB0129 for manufacturers and DCB0160 for deploying care organisations. [NHS England DTAC context](https://www.england.nhs.uk/long-read/digital-clinical-safety-strategy/) identifies DTAC as a baseline for NHS/social-care digital technologies.

These sources establish review work, not CONNECTA compliance. PECR, consumer-law/refund/VAT presentation, ICO registration, MHRA classification, Cyber Essentials, Apple and Google requirements require a release-time, qualified review and evidence pack.

## Recommended architecture

Keep Free as a local-first PWA with an explicit, versioned client data envelope and user-controlled encrypted export/restore. Do not add cloud sync to its static code path.

Build Plus and Organisation as a separately deployed service: HTTPS API, UK/approved-region managed database with per-tenant isolation enforced in the data layer, separate admin UI, OIDC/SAML-capable identity provider, server-side entitlement/billing webhook handler, encrypted backups, append-only audit events, secret manager, rate limits and monitoring that records metadata rather than journal content. Use capability checks on every request, not UI-only restrictions. A practitioner-to-service-user link must be a revocable, recorded consent record and all private journals/check-ins remain excluded by default.
