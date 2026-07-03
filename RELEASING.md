# Release Checklist

## Steps

1. **Update `CHANGELOG.md`**
   - Move all entries under `[Unreleased]` to a new versioned section
   - Set the date: `## [x.y.z] - YYYY-MM-DD`
   - Leave an empty `[Unreleased]` section at the top

2. **Bump version** in all three packages (must stay in sync):
   - `packages/desktop/package.json`
   - `packages/server/package.json`
   - `packages/ui/package.json`

3. **Generate Electron installer**
   ```bash
   npm run package
   ```
   Installer output: `packages/desktop/release/`

4. **Verify the Docker build locally**
   ```bash
   docker build -t cbz-tool-local .
   ```
   Tagging pushes straight to the `docker-publish` workflow (step 6), so catch build failures here — before a tag exists — rather than after.

5. **Commit the release** (on your release branch)
   ```bash
   git add CHANGELOG.md packages/*/package.json
   git commit -m "chore(release): bump version to x.y.z"
   ```

6. **Open a PR and merge to `master`**
   - Push the branch, open a PR, get it reviewed, and merge into `master`.
   - Don't tag yet — `master` must contain the release commit before the tag is created.

7. **Tag `master` and push**
   ```bash
   git checkout master
   git pull origin master
   git tag vx.y.z
   git push origin vx.y.z
   ```
   > The `v*.*.*` tag triggers the [`docker-publish`](.github/workflows/docker-publish.yml) GitHub Actions workflow, which builds and pushes `luzaramburo/cbz-tool:<version>` and `luzaramburo/cbz-tool:latest` to Docker Hub automatically. Tagging only `master` (after merge) guarantees the published image always matches what's actually on `master`.
