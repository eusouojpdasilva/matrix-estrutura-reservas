// Compatibility entrypoint. Cloudflare publishes committed code from Git.
import { spawnSync } from 'node:child_process';
if (process.argv.includes('--push')) {
  console.error('Revise e faça commit dos arquivos desejados; o push para main dispara o Cloudflare. Consulte DEPLOY.md.');
  process.exit(1);
}
const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
  cwd: new URL('.', import.meta.url), stdio: 'inherit', shell: process.platform === 'win32',
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
