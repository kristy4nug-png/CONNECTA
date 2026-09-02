# Atlas Google Play release checklist

Status: release preparation. The web/PWA test suite is green; no Android release bundle has been built or submitted.

## Required implementation work

- Create a native Android wrapper around the existing vanilla JavaScript app.
- Choose and reserve a permanent application ID and signing-key process.
- Keep Atlas Free genuinely usable without payment.
- Implement Atlas Plus as a real entitlement, not a label: Google Play Billing in the Android app, secure purchase-token verification, acknowledgement, renewal/cancellation handling and server-side entitlement state.
- Do not unlock paid features from a client-controlled local-storage flag.
- Add Play purchase restore and account-change handling.
- Test offline, upgrade, restore, cancellation, pending payment and expired entitlement paths.

## Account and store work owned by the publisher

- Create and verify the Google Play developer account and payments profile.
- Supply the legal publisher name, address, support email, privacy email and target countries.
- Decide personal versus organisation account. A new personal account may need the official closed-test requirement before production access.
- Provide a public privacy-policy URL with a real controller/contact address; the current policy page still marks this as pending.
- Complete Data safety, app access, content rating, target-audience, ads, health-related, financial, government and other applicable Play Console declarations truthfully.
- Prepare store screenshots, feature graphic, short/full descriptions, support URL and review credentials if any feature requires login.

## Release gates

- Android release AAB is signed with a protected upload key and reproducibly built in CI.
- Current target API, Android permission use and Play Billing library meet Play requirements.
- Closed/internal testing evidence is recorded on real Android devices.
- Accessibility, security, privacy/DPIA and safety review are complete for the intended audience and claims.
- Urgent-support links and numbers are rechecked immediately before submission.
- No critical or high release issue remains open.

This checklist deliberately does not claim that the current web build is a medical, clinical, safeguarding or organisation-ready product.
