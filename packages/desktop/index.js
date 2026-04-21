import { app, BrowserWindow, Menu, protocol } from 'electron';
import { fileURLToPath } from 'url';
import { join, dirname, extname } from 'path';
import { config } from 'dotenv';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import os from 'os';
import http from 'http';
import fsp from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

const isDev = process.env.NODE_ENV === 'development';
const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

// Named pipe (Windows) or Unix socket (Mac/Linux) — no TCP port used in production
const socketPath =
  process.platform === 'win32'
    ? `\\\\.\\pipe\\cbz-tool-${randomUUID()}`
    : join(os.tmpdir(), `cbz-tool-${randomUUID()}.sock`);

// Resolve public/ relative to @cbz-tool/server's entry point — works in both workspace and packaged app
const serverEntry = fileURLToPath(import.meta.resolve('@cbz-tool/server'));
const publicDir = join(dirname(serverEntry), '..', 'public');

// Must run before app.ready
if (!isDev) {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'cbz', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
  ]);
}

const MIME_MAP = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
};

async function serveStatic(urlPath) {
  let filePath = join(publicDir, urlPath === '/' ? 'index.html' : urlPath);
  try {
    await fsp.access(filePath);
  } catch {
    filePath = join(publicDir, 'index.html'); // SPA fallback for client-side routes
  }
  try {
    const body = await fsp.readFile(filePath);
    return new Response(body, {
      headers: { 'Content-Type': MIME_MAP[extname(filePath)] ?? 'application/octet-stream' },
    });
  } catch (err) {
    console.error('[serveStatic] failed to read', filePath, err);
    return new Response('Not found', { status: 404 });
  }
}

async function proxyToSocket(request) {
  const url = new URL(request.url);
  const bodyBuffer = request.body ? Buffer.from(await request.arrayBuffer()) : null;
  const headers = Object.fromEntries(request.headers.entries());
  if (bodyBuffer) headers['content-length'] = String(bodyBuffer.length);

  return new Promise((resolve) => {
    const proxyReq = http.request(
      { socketPath, method: request.method, path: url.pathname + url.search, headers },
      (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', (c) => chunks.push(c));
        proxyRes.on('end', () => {
          const nullBodyStatus = proxyRes.statusCode === 101 || proxyRes.statusCode === 204 || proxyRes.statusCode === 205;
          resolve(
            new Response(nullBodyStatus ? null : Buffer.concat(chunks), {
              status: proxyRes.statusCode,
              headers: proxyRes.headers,
            }),
          );
        },
        );
      },
    );
    proxyReq.on('error', (err) =>
      resolve(
        new Response(JSON.stringify({ error: err.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    if (bodyBuffer) proxyReq.write(bodyBuffer);
    proxyReq.end();
  });
}

const dataDir = process.env['DATA_DIR'] ?? join(app.getPath('userData'), 'cbz-data');
let server;

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

  const { initStore, start } = await import('@cbz-tool/server');
  initStore(dataDir);

  if (!isDev) {
    protocol.handle('cbz', async (request) => {
      const { pathname } = new URL(request.url);
      return pathname.startsWith('/api/') ? proxyToSocket(request) : serveStatic(pathname);
    });
    server = start(socketPath);
  } else {
    server = start(PORT);
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: join(__dirname, '../ui/public/favicon.ico'),
  });

  server.on('listening', () => {
    win.loadURL(isDev ? 'http://localhost:5173' : 'cbz://localhost/');
  });
});

app.on('before-quit', () => server?.close());
