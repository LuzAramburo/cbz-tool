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

3. **Build and tag the Docker image**
   ```bash
   npm run build
   ```

4. **Push Docker image to registry**
   ```bash
   docker push luzaramburo/cbz-tool:<version>
   docker push luzaramburo/cbz-tool:latest
   ```

5. **Generate Electron installer**
   ```bash
   npm run package
   ```
   Installer output: `packages/desktop/release/`

6. **Commit the release**
   ```bash
   git add CHANGELOG.md packages/*/package.json
   git commit -m "chore(release): bump version to x.y.z"
   ```

7. **Tag and push**
   ```bash
   git tag vx.y.z
   git push origin master --tags
   ```
