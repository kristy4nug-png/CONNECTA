# Atlas | Recovery Safety Net
## Local-first recovery planning and continuity

This is a free, offline-capable Progressive Web App prototype.

### Included
- Three-level safety check
- “Get me through 20 minutes” flow and timer
- One-task mode
- Original daily recovery reflections
- Official AA, NA and ACA daily-reading links
- AA, NA and ACA official meeting-finder links
- Personal meeting calendar
- Lavendaire guided-meditation room using YouTube playback
- Live nearby coffee-shop finder using location and OpenStreetMap data
- Manual town/postcode café search
- Coping toolbox
- Support ladder
- Service promise tracker
- Transition checklist
- Local export and clear-data controls
- Optional, user-triggered Supabase account and cloud backup
- Installable PWA manifest and offline service worker

### Supabase setup

1. Run [`supabase-atlas-sync.sql`](supabase-atlas-sync.sql) in the Supabase SQL Editor.
2. The project URL and public publishable key are configured at the top of `api-client.js`.
3. Never put a Supabase service-role or secret key in this browser application.

Atlas remains local-first. It uploads the seven configured storage records only after a signed-in user explicitly chooses **Upload this device**.

### Paid plans and store billing

The current web build does not enable paid entitlements or in-app billing. Do not charge users for Atlas Plus until the Android package integrates Google Play Billing, verifies purchases on a secure backend, and the store policy/data-safety review is complete. GitHub is used for source code, release files and documentation; it is not the default checkout for a Play-distributed digital subscription.

### Important content rule
The app does not reproduce copyrighted AA, NA or ACA book text. It uses original reflections and opens official publisher pages for official daily readings.

### Run it using PowerShell
1. Clone the repository or extract the release ZIP.
2. Open PowerShell in the project folder.
3. Run:

```powershell
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File ".\Start-CONNECTA.ps1"
```

4. The app opens at `http://127.0.0.1:8765/`.
5. In a supported browser, use the **Install** button or browser install menu to add it like an app.

To use another port:

```powershell
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File ".\Start-CONNECTA.ps1" -Port 8090
```

### Prototype safety boundary
This version stores data in the current browser by default and can optionally copy supported records to Supabase. Do not use it for real clinical, prison, safeguarding or identifiable service-user records. A future pilot still needs governance, safeguarding procedures, security testing and data-protection review.

### Future build priorities
1. Live meeting data integrations with permission
2. Neutral/discreet notification system
3. User-controlled recovery passport
4. Staff portal with explicit consent scopes
5. Secure backend and UK hosting
6. Accessibility and lived-experience testing
7. Translation, read-aloud and low-literacy modes


### Lavendaire and YouTube
Meditation videos remain hosted and played by YouTube from Lavendaire's official channel.
The app does not copy, download, transcribe or rehost the creator's audio or video.
YouTube and the creator control availability, advertising and recommendations.

### Coffee-shop finder
The live nearby search uses browser geolocation for a single search and does not save
the coordinates. Café information comes from community-maintained OpenStreetMap data
through a public Overpass endpoint. Opening details can be missing or outdated, so users
should verify before travelling.
