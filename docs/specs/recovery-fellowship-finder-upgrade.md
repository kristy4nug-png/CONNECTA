# Recovery Fellowship Finder Upgrade

## Outcome

Upgrade CONNECTA's existing Recovery Fellowship Finder into one four-tab, local-first meeting area without creating a duplicate feature or copying fellowship meeting directories.

## Find a Meeting

- UK-first release.
- Open the official AA Great Britain, UKNA and ACA meeting finders in the normal browser.
- Display official fellowship contact information separately from urgent-safety support.
- State that CONNECTA is independent and meeting details are maintained by the relevant fellowship.
- If offline, explain that the official finder needs internet access and offer Try Again and Open My Meetings.
- Do not scrape or import meeting directories. Automatic Published Meeting syncing is deferred until an authorised data source exists.

## Personal Meetings

- Existing local `meetings` records migrate automatically without losing any field or private note.
- Require Fellowship and Meeting Name; all other fields are optional.
- Fields: fellowship, name, weekly or one-off recurrence, day/date, start time, in-person or online, venue address, postcode, online link, private note, accessibility information, and Open/Closed/Unknown attendance status.
- Support create and edit through an explicit Save action.
- Preserve interrupted create/edit forms as local drafts.
- Show compact cards with fellowship, name, next day/time, attendance mode and reminder status.
- Archive replaces removal. Archived meetings are view-only, cannot be restored and may be permanently deleted after confirmation.

## Calendar and reminders

- Show the next seven days beginning today.
- Use device UK local time and native GMT/BST handling.
- Support weekly and one-off Personal Meetings.
- In-app reminders only: off, one hour before, morning of, or one day before; default one hour.
- Reminder actions: Open Details, Snooze One Hour and Dismiss.

## Data controls

- Existing CONNECTA export includes Personal Meetings, archives, reminders and drafts through local storage.
- Add validated import with merge-by-default behaviour.
- Possible duplicate: same fellowship, meeting name, day/date and start time.
- Duplicate choices: Keep Existing, Use Imported or Keep Both.
- Add a separate confirmed Delete All Meeting Information action.
- Only valid HTTP/HTTPS online links are clickable; other values remain plain text.
- Everything remains local-first and offline-capable except external official finders.

## Interface

Use four tabs inside the existing Meetings view:

1. Find a Meeting
2. My Meetings
3. Reminders
4. Archived

Preserve CONNECTA's existing green-and-amber visual system, responsive layout, safety wording, logo and application navigation.

## Approved test seams

1. Legacy meeting migration preserves data.
2. Personal Meeting save, edit, archive and permanent delete behaviours.
3. Weekly/one-off next occurrence and reminder calculations.
4. Export/import merge and duplicate detection.
5. Official finder links and offline fallback behaviour.
