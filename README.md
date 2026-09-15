# Camera Wizard — X-M5 edition

A mobile-first photographic shooting assistant. Choose your subject, estimated light and lens to get a practical starting setup. It never meters the scene. No account, API key, dependencies or build is needed. All deployable files are in `dist/`.

## Run locally

1. Extract the complete ZIP.
2. Install Node.js if needed.
3. Open a terminal in this folder and run `node server.cjs`.
4. Open http://localhost:4173 in your browser. Keep the terminal open; Ctrl+C stops the server.

Alternatively run `python -m http.server 4173 --directory dist --bind 127.0.0.1` with Python installed. Use a web server: opening HTML directly does not provide the complete PWA experience.

## Use it

Simple asks about the photograph. Choose a subject, light, lens, movement and desired result, then tap Get my settings. Quick Shoot uses subject defaults and saved equipment/preferences for fewer decisions. Advanced exposes the camera profile, EV estimate, aperture, depth priority, shutter constraints and fixed/Auto ISO.

The recommendation includes shutter, aperture, ISO, shooting mode, compensation, AF, detection, drive and an explanation. Expand advice for alternatives, conditional white balance/flash guidance and camera setup steps. Take a test shot and check sharpness and histogram.

Equipment, maximum ISO, support, RAW and other preferences are saved on this device. Simple opens by default. Reset all settings restores defaults.

## Deploy as a static webpage

Upload the contents of `dist/` to a static website host. For repository-based hosting choose `dist` as the publish/output directory and leave the build command empty. No backend, environment variables or SPA rewrite is required. Keep all files together; relative URLs support subfolder hosting.

Use HTTPS. Serve `.js` as JavaScript and `.webmanifest` as `application/manifest+json`. Avoid long-lived caching of `sw.js`. After deployment, expand Install on iPhone & use offline and wait for the offline-ready message.

On iPhone, open the HTTPS site in Safari, tap Share → Add to Home Screen → Add (enable Open as Web App if offered). A desktop localhost address is only for that computer; ordinary LAN HTTP does not enable iPhone PWA installation. Use the deployed HTTPS address on the phone.

The first online visit caches the app and calculation/profile data. No photos are captured or transmitted. Browser storage may be removed by the device. For releases, increment CACHE in `dist/sw.js` and upload all files together. The app offers Load available update in install help when an update is ready.

## Data and assumptions

- X-M5: approximate 1.5× crop, no IBIS, native ISO 160–12800, mechanical 1/4000 s, electronic 1/32000 s, timed exposure to 900 s. Electronic shutter has motion/banding limitations and cannot fire flash. Assumes DR100 and D Range Priority Off.
- 26 Fujifilm and 5 third-party lenses, plus Other/manual. Exact versions and manufacturer sources are in SOURCES.md and the offline sources page.
- Variable zoom aperture endpoints are verified. Exact intermediate transition curves are not: the app uses the slower telephoto endpoint between endpoints and labels this conservative assumption. The lens may open wider; no exact curve is invented.
- OIS benefits and subject speeds are guidelines, not guarantees. Body IBIS is never added. OIS does not freeze subjects. Viltrox OIS absence is not independently confirmed; no OIS allowance is applied.
- Light descriptions estimate EV with uncertainty, typically 1–2 stops or more. Aperture targets are depth heuristics; actual depth needs subject distance. Macro light loss, flash output and lens transmission are not modelled.
- RAW changes advice only. Crop affects shake/angle-of-view guidance, never exposure aperture. Extended ISO is excluded. Flash guidance requires an external unit.

The preserved engine uses `required ISO = 100 × aperture² / (shutter seconds × 2^(EV100 − compensation))`. Insufficient light is reported rather than silently removing motion/depth constraints. Alternatives show calculated exposure and trade-offs.

## Development and verification

Run `node --test tests/engine.test.cjs tests/advisor.test.cjs` (or `npm test`). Run `node build-docs.cjs` after profile edits to regenerate the offline sources page.

`dist/engine.js` retains the original generic interface, extended with optional hardware bounds. `profiles.js` holds equipment data, `advisor.js` photographic decisions and `app.js` UI/state. Future bodies can supply their profile limits to the engine.

See REVISION-NOTES.md for changes and validation, and SOURCES.md for the specification audit.
