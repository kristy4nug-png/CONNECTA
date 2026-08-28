# AGENTS.md — Development Instructions for Antigravity & AI Assistants

## Permanent Project Rules

1. **One Canonical Project Folder Only**
   - The project MUST always live at: `C:\Users\Chris Nugent\Documents\Atlas`
   - NEVER create versioned project folders like `Atlas_v5`, `Atlas_new`, etc.
   - Version numbers belong in `app-version.json` and internal records only.

2. **Final Logo Requirements**
   - Brand master location: `assets\branding\atlas-final-logo.png`
   - Never crop, distort, recolour, replace, or redesign the logo lockup.
   - Header logo must always use responsive, centred CSS (`object-fit: contain`).

3. **Technology Stack Constraints**
   - Core: Standard HTML5, CSS3, Vanilla JavaScript (Local-first, `localStorage`, PWA Service Worker).
   - Local Launcher: PowerShell script (`Start-Atlas.ps1`) hosting on port `8765`.
   - Free services only (OpenStreetMap/Overpass API, official YouTube embeds for Lavendaire, official recovery links).
   - No paid APIs, no React/Flutter conversion in initial stabilization phase.

4. **Safety & Privacy Rules**
   - Recovery safety app for human support, continuity, and resettlement.
   - Never use shame-based messaging ("streak broken", "you failed").
   - Local-first privacy: no external reporting of private journal notes or user state.
   - Handle location permissions gracefully; never store precise coordinates permanently.

5. **Versioning Workflow**
   - Update `app-version.json` on changes.
   - Update `service-worker.js` cache name (`CACHE = "connecta-app-vX.Y.Z-date"`) so stale PWA caches are purged upon update.

## Agent skills

### Issue tracker

Issues and development tickets are tracked using GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Atlas uses the five standard Matt Pocock triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

Atlas uses a single-context domain-documentation layout. See `docs/agents/domain.md`.