# CONNECTA Free Beta 0.4.1

CONNECTA is a free, private-first Windows recovery planning and continuity beta. It runs locally in your browser and keeps entries in that browser's local storage.

## Install on Windows

Run the single cumulative installer from PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
& "$env:USERPROFILE\Downloads\Install-CONNECTA-Free-Beta-v0.4.1.ps1"
```

The installer works on a clean computer or updates the existing per-user installation at `Documents\CONNECTA`. It validates every embedded file, preserves unknown files, creates the desktop shortcut, and opens CONNECTA.

## Free Beta features

- Safety check and 20-minute support flow
- Original reflections, private notes, one-task mode and coping tools
- Official AA, NA and ACA links plus Personal Meetings
- Recovery Bridge: My First 72 Hours and Recovery Passport
- Personal Appointments
- Recovery Capital Map with seven separate areas and no combined rating
- Consent-controlled Worker Handover
- Optional first-run setup, accessibility preference and Privacy Lock
- Offline Privacy, Terms, About and Support information
- Privacy-safe diagnostic download

## Important boundary

CONNECTA is not treatment, diagnosis, clinical decision support, a clinical/probation/prison record, or emergency care. Privacy Lock discourages casual access but is not full device or disk encryption. Protect your Windows account and any files you download.

## Uninstall

Run `Documents\CONNECTA\Uninstall-CONNECTA-Free-Beta.ps1`. It removes only known CONNECTA application files and its matching desktop shortcut. Browser data is separate; use CONNECTA's **Clear this device** control before uninstalling if you also want to remove entries from that browser profile.
