# Deploy Camera Wizard to GitHub Pages

Repository: `ElliotA821/camera-wizard`

Target: https://elliota821.github.io/camera-wizard/

## Files to upload

Upload these paths relative to the existing GitHub repository root:

- `.github/workflows/pages.yml` — new deployment workflow.
- `dist/app.js` — explicit relative service-worker scope.
- `dist/sw.js` — versioned caches isolated to this installation's scope.
- `GITHUB-PAGES.md` — these instructions (optional for deployment).
- `tests/pages.test.cjs` — deployment regression checks (optional for deployment).

The existing complete `dist/` folder must remain in the repository. Do not add an extra `camera-assistant/` folder around these files. If the browser hides `.github`, use GitHub's Add file → Create new file and enter `.github/workflows/pages.yml`, then paste the workflow contents. Commit to the repository's default branch.

## GitHub settings

1. Open https://github.com/ElliotA821/camera-wizard/settings/pages.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Do not select Deploy from a branch, `/docs`, or `/dist` in Settings. The workflow uploads `./dist` as the Pages artifact. No custom domain or CNAME is needed.
4. Open **Actions → Deploy Camera Wizard to GitHub Pages → Run workflow**. Select the default branch and run it (useful if the upload happened before enabling Pages). Subsequent pushes to the default branch deploy automatically.
5. Wait for the deployment job to succeed, then open https://elliota821.github.io/camera-wizard/. If HTTPS enforcement is shown, leave it enabled.

The workflow supports either `main` or another default-branch name automatically. Runs on other branches are skipped. It uses the `github-pages` environment and the built-in GitHub token; no personal token or secret is required. If repository rules require environment approval, approve that deployment under Actions. Avoid retaining another workflow that also deploys Pages.

## Subpath and offline behavior

The artifact contains the contents of `dist/`, so the home page is `/camera-wizard/index.html`, not `/camera-wizard/dist/index.html`. Existing HTML, scripts, styles, manifest and icon links are relative and need no changes.

The manifest's `id`, `start_url` and `scope` remain `./`, resolving to `/camera-wizard/`. Icons resolve beside the manifest. Registration of `./sw.js` with scope `./` gives the worker `/camera-wizard/` scope. Cached URLs resolve beside the worker; its fetch handler ignores other subpaths and origins. Cache names include the full registration scope so activating this app does not delete caches belonging to another app on the same GitHub Pages origin. Old unscoped caches are deliberately left alone because their owner cannot be determined safely.

After the first successful online load, expand Install on iPhone & use offline and wait for Ready for offline use. Reload with internet disconnected and change a subject or light setting. Also check the offline specifications page. On iPhone use Safari → Share → Add to Home Screen.

For future app releases, increment the version suffix in `dist/sw.js` whenever a cached asset changes. Upload all changed assets in the same commit. Existing users can choose Load available update, or close and reopen all app windows. Browser storage retention is device-dependent.

## Local checks

Run `node --test tests/pages.test.cjs tests/engine.test.cjs tests/advisor.test.cjs`.

The deployment tests exercise asset/manifest URL resolution at the exact Pages base URL and service-worker installation, offline responses, scope boundaries and cache cleanup. GitHub deployment itself must still be run after uploading these files and choosing GitHub Actions as the Pages source.
