# X-M5 revision report

Completed 15 September 2026. This revision extends the existing application and exposure engine; the original 11 engine tests remain in place and pass.

## Files changed or added

- Updated `dist/engine.js`: optional camera hardware bounds and photographic constraints; generic interface preserved.
- Added `dist/profiles.js`: X-M5 and 31 lens records with manufacturer links, plus manual lens support.
- Added `dist/advisor.js`: subject, movement, intent, AF/drive and exposure-alternative logic.
- Updated `dist/index.html`, `dist/style.css`, `dist/app.js`: mobile-first Simple, Quick Shoot and Advanced workflows, saved preferences and clear estimated-light results.
- Updated `dist/sw.js` and `dist/manifest.webmanifest`: offline caching, app identity and update handling. Existing icons retained.
- Added `dist/sources.html`, `build-docs.cjs`, `SOURCES.md`: accessible offline specifications and source audit.
- Added `tests/advisor.test.cjs`; updated package metadata and README. Local server and original tests retained.

## Features and equipment

16 subject categories, 13 light estimates, adaptive movement/intent, lens-specific zoom controls, native X-M5 constraints, lens-only OIS, tripod handling, Auto/fixed ISO, compensation, RAW guidance, focus/detection/drive recommendations, conditional WB/external flash advice, calculated alternatives and insufficient/excess-light warnings. Core settings are prominently displayed; supporting explanations expand on demand.

Includes 26 Fujifilm lens profiles (all requested families, with explicit current versions) and Sigma 30/1.4, 56/1.4, 18–50/2.8, Tamron 17–70/2.8 VC and Viltrox 27/1.2 Pro. Every record links to manufacturer documentation. The X-M5 profile uses manufacturer manual specifications and menus; no IBIS is assumed.

## Validation

- All 26 automated tests pass: original 11 plus 15 advisor tests.
- Catalogue sweep covers 31 lenses × 16 subjects × 13 light estimates (6,448 combinations), plus the original 300-scenario engine sweep.
- EV examples, compensation, RAW parity, ISO ceilings, hardware bounds, invalid inputs, variable-aperture endpoints/intermediate conservative bounds, OIS versus motion, static tripod, indoor people/children/pets, fast action, bright/low light and alternatives tested.
- Browser layouts inspected at 375×667, 390×844, 393×852 and 430×932; no horizontal overflow. Visible form text uses 16 px sizing. Mobile screenshots reviewed.
- Lens/zoom, maximum ISO and RAW preferences survived reload. Simple, Quick Shoot and Advanced controls checked.
- Latest service-worker update activated via the app button and retained preferences.
- Stopped the local server, reloaded the app and changed the light: a fresh calculated recommendation worked offline.
- Installation metadata and bundled icon assets checked. No application errors observed in the online browser check.

## Assumptions and remaining limitations

This is an ambient-light estimator, not a meter. Light ranges, motion thresholds, aperture/depth targets and OIS allowances are heuristics. Actual subject distance, movement and steadiness can change the result. RAW does not add sensitivity. Crop does not alter exposure f-number. DR100 and D Range Priority Off are assumed; extended ISO is excluded.

Exact intermediate maximum-aperture curves for variable zooms could not be verified. The app uses the slower endpoint at intermediate focal lengths, labels this conservative bound and acknowledges that the lens may open wider. Endpoints are verified. Viltrox OIS absence is not independently confirmed; no stabilisation benefit is applied. Published stabilisation ratings are not treated as guaranteed user performance.

Physical iPhone/Safari installation, device storage eviction and real-camera results have not been tested. Browser viewport checks are not physical-device certification. Flash output, macro light loss, measured depth of field, transmission and metering are not calculated. See SOURCES.md and the offline sources page for all primary references and uncertainty details.
