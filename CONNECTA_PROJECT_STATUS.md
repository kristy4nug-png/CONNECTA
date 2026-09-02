# Atlas Project Status

> Current release-preparation note (2 September 2026): the active checkout is still `Documents\CONNECTA`, while the project rules require `Documents\Atlas`; the attempted move is held by the local Ollama process. The local web/PWA suite is green and a free Android TWA test APK/AAB now builds, but paid entitlements, production signing and store/compliance gates are not complete.

**App Version:** 1.3.0 (release preparation)
**Last Updated:** 2 September 2026
**Canonical Directory:** `C:\Users\Chris Nugent\Documents\Atlas`

---

## 1. Project Structure
```
Atlas/
├── assets/
│   ├── branding/
│   │   └── connecta-final-logo.png   (Untouched Brand Master)
│   ├── connecta-logo-lockup.png
│   └── connecta-app-icon-master.png
├── icons/
│   ├── Atlas.ico
│   ├── connecta-icon-192.png
│   └── connecta-icon-512.png
├── index.html
├── meeting-domain.js                  (Meeting rules and migration)
├── meeting-ui.js                      (Meeting interface controller)
├── recovery-bridge-domain.js           (First-72-hour planning and passport rules)
├── recovery-bridge-ui.js               (Recovery Bridge interface controller)
├── manifest.webmanifest
├── service-worker.js
├── Start-Atlas.ps1                (Local launcher on port 8765)
├── Install-Atlas.ps1              (Desktop shortcut installer)
├── app-version.json
├── AGENTS.md
├── CONNECTA_PROJECT_STATUS.md
├── CONNECTA_ROADMAP.md
├── CONNECTA_CLEANUP_REPORT.md
└── You are now the lead developer, tec.txt
```

---

## 2. Working Features
1. **Three-Level Safety Check:** Steady, Struggling, Unsafe check-in with urgent support modal.
2. **"Get Me Through 20 Minutes":** Calming timer flow and step-by-step guidance.
3. **One-Task Mode:** Focus on the next single manageable action.
4. **Daily Recovery Reflections:** Daily prompt reading, private note-taking, emotional check-in.
5. **Recovery Fellowship Finder & Calendar:** Official AA, NA and ACA links; four-tab Personal Meeting manager; weekly/one-off recurrence; seven-day calendar; local reminders; archives; migration; and export/import support.
6. **Guided Meditations:** Official YouTube embedded Lavendaire meditation playlists.
7. **Coffee-Shop Finder:** Nearby Overpass/OSM café search with walking directions and privacy-preserving fallback.
8. **Coping Toolbox:** Grounding exercises, HALT check, urge management.
9. **Support Ladder:** Ordered trusted contacts with call action.
10. **Service-Promise Tracker:** Track commitments, owners, due dates, and completion.
11. **Transition Checklist:** Pre-release/resettlement essentials tracker.
12. **Privacy Controls:** Data export (`connecta-recovery-export.json`), local storage reset.
13. **PWA & Offline Support:** Versioned Service Worker cache and manifest.
14. **Recovery Bridge:** My First 72 Hours plan, four transition windows, practical information, task progress, green/amber/red check-ins, and consent-controlled Recovery Passport.

---

## 3. Improvements Made in Current Session
- Consolidated all code builds into single canonical directory `Documents\Atlas`.
- Installed `connecta-final-logo.png` into `assets\branding\`.
- Repaired header logo centring using CSS flex container and `object-fit: contain`.
- Removed versioned header badge ("NEW BUILD v4") and obsolete promo cards.
- Sanitized `Start-Atlas.ps1` launcher (removed legacy "Bridge" branding).
- Fixed data export file naming.
- Established project status, agents, cleanup, and roadmap markdown files.
- Upgraded the Recovery Fellowship Finder without copying fellowship directories.
- Added automatic migration of existing locally saved meetings.
- Added Personal Meeting drafts, editing, recurrence, reminders, read-only archives, validated import and meeting-only privacy deletion.
- Added tested meeting domain and interface modules to the offline PWA cache.
- Added Recovery Bridge inside My Plan without removing the existing Transition Checklist.
- Added local first-72-hour progress, dignified risk check-ins, and explicit-consent passport preview, download and print.
- Enforced exclusion of private notes from every Recovery Passport.

---

## 4. Security & Privacy Limitations
- Local storage only (no cloud sync or authentication).
- No clinical or identifiable medical/institutional records stored.
- Geolocation requested on-demand only; coordinates never retained.

---

## 5. Recommended Next Steps
- Validate version 0.3.0 PWA offline operation on the target Windows device.
- Perform audit cleanup of superseded version folders (`CONNECTA_v4`, `CONNECTA_Extracted`, `RecoverySafetyNet`).
