import { start } from '@cbz-tool/server';
import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

const isDev = process.env.NODE_ENV === 'development';
const PORT = 3000;
let server;

app.whenReady().then(() => {
  server = start(PORT);
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: join(__dirname, '../ui/public/favicon.ico'),
  });

  server.on('listening', () => {
    // Dev: load Vite for hot reload. Prod: load Express, which serves built files.
    win.loadURL(isDev ? 'http://localhost:5173' : `http://localhost:${PORT}`);
  });
});

app.on('before-quit', () => server?.close());
