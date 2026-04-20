import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });

const dataDir = process.env['DATA_DIR'] ?? './data';
const { initStore } = await import('./services/cbzStore.js');
initStore(dataDir);

const { start } = await import('./index.js');
const port = parseInt(process.env['PORT'] ?? '3000', 10);
start(port);
