# Bridge | Recovery Safety Net
## First Build v2: Cafés and Lavendaire

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
- Installable PWA manifest and offline service worker

### Important content rule
The app does not reproduce copyrighted AA, NA or ACA book text. It uses original reflections and opens official publisher pages for official daily readings.

### Run it using PowerShell
1. Extract the ZIP.
2. Right-click inside the extracted folder and choose **Open in Terminal**, or open PowerShell in the folder.
3. Run:

```powershell
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File ".\Start-RecoverySafetyNet.ps1"
```

4. The app opens at `http://localhost:8080/`.
5. In a supported browser, use the **Install** button or browser install menu to add it like an app.

To use another port:

```powershell
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File ".\Start-RecoverySafetyNet.ps1" -Port 8090
```

### Prototype safety boundary
This version stores data in the current browser only. Do not use it for real clinical, prison, safeguarding or identifiable service-user records. A future pilot needs proper authentication, encryption, governance, safeguarding procedures, security testing and data-protection review.

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
