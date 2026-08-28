Atlas — Web Hosting Deployment Guide

This guide covers deploying the static Atlas build to common static hosts (GitHub Pages, Netlify, any static file host).

Files included in the release ZIP:
- index.html
- *.js (domain and UI bundles)
- manifest.webmanifest
- service-worker.js
- app-version.json
- assets/ (branding, images, other static assets)
- icons/ (PWA icons)

Pre-release checklist
1. Run tests: npm test  (all tests should pass)
2. Bump version in app-version.json and package.json if needed.
3. Update service-worker.js CACHE name to a unique value (e.g., connecta-app-vX.Y.Z-YYYYMMDD). This repo currently uses a dated cache key; update it when releasing.
4. Confirm manifest.webmanifest content (name, start_url, icons, display, scope).
5. Ensure all assets referenced from index.html are present in the release ZIP and paths are relative.

Deploy to GitHub Pages (recommended for simple hosting)
1. Create a gh-pages branch or use repository settings to serve from the repo's / (root) or /docs folder.
2. If serving from gh-pages branch:
   - Extract the release ZIP and copy contents to the branch root.
   - Commit and push.
3. In repo Settings > Pages, set the source branch and root directory. Wait for the site to be published.

Deploy to Netlify
1. Create a Netlify site and connect the repository or drag-and-drop the release ZIP contents into the Netlify dashboard.
2. If building from the repo, configure a build command (none needed for static) and set the publish directory to the repo root (or the folder containing index.html).
3. Enable or configure redirects if needed (e.g., SPA rewrite to index.html).

Deploy to any static host (S3, Azure Blob, Google Cloud Storage)
1. Upload the files to the bucket/container.
2. Set the content-type (MIME) correctly: .html -> text/html, .js -> application/javascript, .json -> application/json, .webmanifest -> application/manifest+json (or application/json), images to image/*.
3. Configure caching headers: recommend long cache for assets that are content-hashed; service-worker handles caching for offline assets. When updating, update the service-worker CACHE name and deploy both service-worker.js and index.html together to avoid cache confusion.

PWA and Service Worker notes
- The Service Worker uses a CACHE constant in service-worker.js. Always update that string when creating a new release to force clients to refresh caches.
- The manifest.webmanifest must reference valid icon files present in /icons.

Security and privacy
- The app is local-first and handles private notes consent-first. Confirm privacy statements on the public site and ensure no analytics or external reporting is enabled without explicit user consent.

Post-deploy verification
1. Open the site in an incognito window and verify the PWA prompts and offline behavior.
2. Check console for errors, 404s, or failed asset loads.
3. Test the service worker lifecycle: unregister previous SWs, reload, and ensure assets are cached.

If you'd like, next actions can include:
- Creating a versioned release tag and updating changelog
- Creating an automated GitHub Action or Netlify pipeline to deploy releases from a release branch
- Generating gzipped assets and setting proper Content-Encoding on the host

Contact for help: add details or next steps and I can implement them (CI, automated version bump, packaging for other platforms, installer, etc.).