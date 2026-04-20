# 8th Wall Image Target Experience

## Project Structure
- `index.html`: Main entry point with premium UI.
- `main.js`: XR configuration and Three.js logic.
- `style.css`: Modern glassmorphic styling.
- `*.json`: Target metadata files.
- `image-targets/`: Processed images for tracking.

## How to Run
1. **Engine Setup**: Place the `xr.js` file (downloaded from the 8th Wall engine release) in the root directory.
2. **Web Server**: Run a local server to avoid CORS issues when loading JSON files.
   ```bash
   npx serve .
   ```
3. **Open Browser**: Go to `http://localhost:3000` (or the port provided).
4. **AR Session**: Click "EXPERIENCE AR" and point your camera at your images (Clock, Bell, etc.).

## Notes
- Ensure you are using HTTPS if testing on a physical device.
- The 8th Wall engine requires camera permissions.
