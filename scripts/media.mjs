import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
const require = createRequire(import.meta.url);

export function binary(name) {
  const override = process.env[name === 'ffmpeg' ? 'FFMPEG_PATH' : 'FFPROBE_PATH'];
  if (override) return override;
  try {
    const bundled = name === 'ffmpeg' ? require('ffmpeg-static') : require('@ffprobe-installer/ffprobe').path;
    if (bundled) return bundled;
  } catch { /* Optional binary downloads can fail; use an existing installation. */ }
  return name;
}

export function run(command, args, {capture = true} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'});
    let stdout = '', stderr = '';
    // Bound logs while allowing long extraction jobs.
    child.stdout?.on('data', b => { stdout = (stdout + b).slice(-16_000_000); });
    child.stderr?.on('data', b => { stderr = (stderr + b).slice(-16_000_000); });
    child.on('error', e => reject(new Error(`${command}: ${e.message}. Run npm run doctor.`)));
    child.on('close', code => code === 0 ? resolve({stdout, stderr}) : reject(new Error(`${command} exited ${code}\n${stderr.slice(-4000)}`)));
  });
}

export const ffmpeg = args => run(binary('ffmpeg'), ['-hide_banner', '-nostdin', ...args]);
export const probe = async path => JSON.parse((await run(binary('ffprobe'), ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', path])).stdout);
export const timestamps = log => [...log.matchAll(/\bpts_time:([\d.eE+-]+)/g)].map(m => Number(m[1]));
export const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
