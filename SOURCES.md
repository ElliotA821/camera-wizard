# Camera Wizard specification audit

Checked 15 September 2026. Hardware facts below are distinct from photographic recommendations. The app uses official manufacturer specifications; no retailer availability or prices are encoded.

## Fujifilm X-M5

- [Owner’s manual: specifications](https://fujifilm-dsc.com/en/manual/x-m5/technical_notes/spec/): APS-C 23.5 × 15.6 mm; native ISO 160–12800; mechanical shutter to 1/4000 s; electronic to 1/32000 s; timed exposures to 15 minutes in M/S; normal flash sync 1/180 s. Extended ISO is documented but excluded from automated recommendations.
- [Product specifications](https://www.fujifilm-x.com/global/products/cameras/x-m5/specifications/): digital stabilisation applies only to movies, no body IBIS; shoe-mount flash; mechanical CH up to 8 fps and CL at 5/4/3 fps. Actual burst speed varies with conditions.
- [Sensitivity](https://fujifilm-dsc.com/en/manual/x-m5/taking_photo/iso/): AUTO1–3, default sensitivity 160–12800, maximum sensitivity 400–12800. The app selects M + Auto ISO, explicitly controlling shutter; it does not rely on Auto ISO’s minimum-shutter setting to hold motion in A mode.
- [AF/MF menu](https://fujifilm-dsc.com/en/manual/x-m5/menu_shooting/af_mf_setting/): AF-S/AF-C, Single Point/Zone, Face Detection On + Eye Auto, and separate Subject Detection. Enabling one detection family disables the other. Animal detection is documented for dogs/cats; birds, vehicles and other supported classes are separate choices.
- [Shooting menu](https://fujifilm-dsc.com/en/manual/x-m5/menu_shooting/shooting_setting/): mechanical/electronic shutter selection; electronic shutter has distortion/banding limitations and cannot use flash. Tripod IS off and 2-second timer guidance come from this manual.
- [Exposure compensation](https://fujifilm-dsc.com/en/manual/x-m5/taking_photo/exposure/): command-dial assignment in M. The app offers ±3 EV, a deliberate subset of the body’s range.
- [Image quality menu](https://fujifilm-dsc.com/en/manual/x-m5/menu_shooting/image_quality_setting/): DR200 needs ISO ≥320; DR400 needs ISO ≥640. Recommendations assume DR100 and D Range Priority Off. Auto/White Priority/custom white balance are documented options.

## Lens verification

Every catalogue entry in `dist/profiles.js` includes an individual manufacturer URL. The offline **Verified specifications & limitations** page lists these URLs beside all 31 entries, focal ranges, maximum/minimum apertures and stabilisation status.

The catalogue includes the 26 requested Fujifilm lens families with explicit versions. In ambiguous families, these are the current versions verified here: XF23mmF1.4 R LM WR, XF27mmF2.8 R WR, XF56mmF1.2 R WR, XF10-24mmF4 R OIS WR and XF16-55mmF2.8 R LM WR II. Older R/non-WR/first-generation versions are not silently presented as those lenses. Select Other/manual for a version not listed.

Additional autofocus X-mount entries:

- [Sigma 30mm F1.4 DC DN Contemporary](https://www.sigma-global.com/en/lenses/c016_30_14/) and [56mm F1.4 DC DN Contemporary](https://www.sigma-global.com/en/lenses/c018_56_14/): X-mount, f/1.4–16.
- [Sigma 18–50mm F2.8 DC DN Contemporary](https://www.sigma-global.com/en/lenses/c021_18_50_28/): X-mount, constant f/2.8, minimum f/22; no OS allowance. [Sigma 30mm manual](https://www.sigma-global.com/en/support/download/30mm_F14_DC_DN_C016.pdf) explicitly identifies absence of OS.
- [Tamron 17–70mm F/2.8 Di III-A VC RXD B070](https://www.tamron.com/global/consumer/lenses/b070/spec.html): X-mount, constant f/2.8, f/22 minimum, VC present. No numeric VC performance claim encoded.
- [Viltrox AF27/1.2 Pro XF](https://viltrox.com/pages/af-27-1-2-pro-xf), [official specification table](https://viltrox.com/en-ca/pages/viltrox-af-27mm-f1-2-pro-series): autofocus X-mount, f/1.2–16. No stabilisation benefit is applied; an explicit manufacturer OIS statement was not found in the inspected specification table, so this exclusion is conservative rather than a verified numeric stabilisation specification.

Verified manufacturer stop ratings stored separately from calculation assumptions:

- [XC15–45 overview](https://www.fujifilm-x.com/global/products/lenses/xc15-45mmf35-56-ois-pz/): 3-stop CIPA OIS claim.
- [XC13–33 global announcement](https://www.fujifilm.com/nz/en/news/hq/13019): 4-stop OIS claim. The US announcement has a malformed “0-stop” string; it was not used as a rating.

Other OIS lenses have optical stabilisation identified in the manufacturer product data; numeric performance is left unspecified in this revision. The calculator defaults to a **2-stop heuristic allowance**, adjustable in saved preferences. It is not a verified performance promise on an X-M5. Body IBIS always contributes zero.

## Explicit uncertainty: variable-aperture zooms

Manufacturer pages verify the maximum apertures at the wide and tele endpoints. They do not publish the exact transition focal lengths in the sources inspected. **This revision does not claim to know an exact intermediate maximum-aperture curve.**

At the exact wide endpoint, the wide aperture is used. At the tele endpoint, the tele aperture is used. At any intermediate focal length, the tele aperture is a conservative usable limit, clearly identified in the UI. This automatically changes with zoom position and prevents recommendations wider than the documented safe limit, but may sacrifice available light at intermediate focal lengths. No interpolated guesses are labelled verified. For an unlisted lens or a personally checked intermediate maximum, Other/manual allows user-supplied values.

Exact intermediate curves remain a limitation requiring measured or manufacturer-supported data. A future verified-node table can extend the structured lens data without UI special cases.

## Mathematical model versus heuristics

`engine.js` retains the original EV equation and generic API, adding optional camera bounds and intent overrides. Required ISO = 100 × f-number² / (shutter seconds × 2^(EV100 − compensation)). Sensor crop is never applied to aperture or the exposure equation.

`advisor.js` holds subject/movement/aperture choices and approximate EV ranges. Pose 1/125, gentle 1/160, walking 1/250, active 1/500, running 1/1000 and very fast 1/2000 are heuristics, not motion guarantees. The shake rule is 1/(1.5 × actual focal length × crop), relaxed by assumed lens OIS and one stop if braced. Tripod removes shake, never subject movement. Aperture depends on subject, intent, focal length and lens bounds; distance is not measured.

Exposure is rounded to camera-style values. Alternatives calculate actual required ISO and remaining error, cap native ISO at 12800, and distinguish feasible settings from requirements beyond that range. RAW changes advice only. Flash advice is conceptual and conditional: no flash-output calculation or guarantee of freezing action is made. Electronic shutter is optional Advanced mode with explicit restrictions. No astrophotography, hyperfocal, distance-based DOF or film-simulation engine is added.
