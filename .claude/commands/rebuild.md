# rebuild

Rebuild the rack3d-visualizer library and hot-swap it into the React app — the full edit→build→pack→reinstall→restart cycle described in CLAUDE.md.

Run these steps in order:

1. Kill any running Vite dev server:
   ```bash
   pkill -f "vite" 2>/dev/null; pkill -f "node.*dev" 2>/dev/null; true
   ```

2. Build the library from `/home/hasib/my-app/rack3d-npm/rack3d-visualizer-1.0.0/package/`:
   ```bash
   cd /home/hasib/my-app/rack3d-npm/rack3d-visualizer-1.0.0/package && npm run build 2>&1
   ```
   If the build fails, stop here and report the TypeScript/Rollup errors — do not proceed.

3. Pack and reinstall into the React app:
   ```bash
   npm pack --quiet && mv rack3d-visualizer-1.0.0.tgz /home/hasib/my-app/ && cd /home/hasib/my-app && npm uninstall rack3d-visualizer --silent && npm install ./rack3d-visualizer-1.0.0.tgz --silent
   ```

4. Restart the Vite dev server with cache busting:
   ```bash
   npm run dev -- --port 5173 --force > /tmp/vite.log 2>&1 &
   ```

5. Confirm the server started by checking the log:
   ```bash
   sleep 2 && grep -E "Local|ready|error" /tmp/vite.log | head -5
   ```

Report: whether the build succeeded, any build errors, and whether the dev server is running.

$ARGUMENTS
