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

5. **Commit the release**
   ```bash
   git add CHANGELOG.md packages/*/package.json
   git commit -m "chore(release): bump version to x.y.z"
   ```

6. **Tag and push**
   ```bash
   git tag vx.y.z
   git push origin master --tags
   ```
   > The `v*.*.*` tag triggers the [`docker-publish`](.github/workflows/docker-publish.yml) GitHub Actions workflow, which builds and pushes `luzaramburo/cbz-tool:<version>` and `luzaramburo/cbz-tool:latest` to Docker Hub automatically.
