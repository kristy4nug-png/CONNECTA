# Atlas Android test build

Atlas now includes a free Trusted Web Activity wrapper for testing the live PWA.

- Package ID: `io.github.kristy4nug.atlas`
- App version: `1.3.0` (version code `13001`)
- Start URL: `https://kristy4nug-png.github.io/CONNECTA/`
- Billing: disabled in this test build
- Location delegation: enabled for the app's optional location features

The generated `android/app-release-signed.apk` is a sideloadable test artifact. It is signed with a local test-only keystore outside the repository and is not the production Play signing key. APK/AAB outputs and signing files are ignored by Git.

To rebuild on Windows after Bubblewrap is installed/configured:

```powershell
$env:TEMP = 'C:\jtmp'
$env:TMP = 'C:\jtmp'
npx --yes @bubblewrap/cli build
```

Bubblewrap will prompt for the keystore password. Do not commit a keystore or passwords. A future Play release still needs a production signing decision, Digital Asset Links, Play Billing/backend verification, and store policy/data-safety completion.
