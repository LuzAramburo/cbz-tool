import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync('./packages/server/package.json', 'utf8'));
// eslint-disable-next-line no-undef
console.log(`Building Docker image: luzaramburo/cbz-tool:${version}`);
execSync(`docker build -t luzaramburo/cbz-tool:${version} -t luzaramburo/cbz-tool:latest .`, {
  stdio: 'inherit',
});
