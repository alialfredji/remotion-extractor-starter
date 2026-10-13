import fs from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
import {binary, run, ffmpeg, probe, timestamps, escapeHtml} from './media.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const json = (file, value) => fs.writeFile(file, JSON.stringify(value, null, 2) + '\n');
async function refuseExisting(file) {
  try { await fs.access(file); } catch (e) { if (e.code==='ENOENT') return; throw e; }
  throw new Error(`Output already exists: ${file}. Choose a new --out path.`);
}
const number = (value, name, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${name} must be between ${min} and ${max}.`);
  return n;
};

async function gallery(dir, frames, title) {
  await fs.writeFile(path.join(dir, 'storyboard.html'), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title><style>body{background:#111;color:#eee;font:16px system-ui;margin:32px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}figure{margin:0}img{width:100%;max-height:480px;object-fit:contain;background:#222}figcaption{padding:8px}a{color:#82aaff}</style><h1>${escapeHtml(title)}</h1><p>Frame times are seconds from playback start. Open individual images in your AI tool.</p><main>${frames.map(f => `<figure><a href="${encodeURI(f.file)}"><img src="${encodeURI(f.file)}" loading="lazy"></a><figcaption>${f.time.toFixed(3)}s · ${escapeHtml(f.file)}</figcaption></figure>`).join('')}</main>`);
}

export async function extract(input, values = {}) {
  const source = path.resolve(input);
  const info = await probe(source);
  const stream = info.streams.find(s => s.codec_type === 'video' && !s.disposition?.attached_pic);
  if (!stream) throw new Error('Input has no video stream.');
  const duration = Number(info.format.duration ?? stream.duration);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Cannot determine video duration. Convert the input to MP4 first.');
  const fps = number(values.fps ?? 1, 'fps', 0.1, 10);
  const limit = number(values.duration ?? 120, 'duration', 0.1, 3600);
  const threshold = number(values.threshold ?? 0.3, 'threshold', 0.01, 0.99);
  const length = Math.min(duration, limit);
  const dir = path.resolve(root, 'work', `${path.basename(source, path.extname(source)).replace(/[^a-zA-Z0-9_-]/g, '-') || 'video'}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`);
  await fs.mkdir(path.join(dir, 'frames'), {recursive:true});
  await json(path.join(dir, 'metadata.json'), info);
  const selected = ['-map', `0:${stream.index}`];
  const result = await ffmpeg(['-t',String(length),'-i', source, ...selected, '-vf', `setpts=PTS-STARTPTS,fps=${fps},scale=960:960:force_original_aspect_ratio=decrease,showinfo`, '-fps_mode', 'vfr', path.join(dir,'frames','frame-%05d.jpg')]);
  const times = timestamps(result.stderr);
  const files = (await fs.readdir(path.join(dir, 'frames'))).sort();
  if (files.length !== times.length) throw new Error('Frame timestamp count mismatch. Reduce extraction duration or fps.');
  const frames = files.map((file,i) => ({file:`frames/${file}`, time:times[i]}));
  const scenes = await ffmpeg(['-t',String(length),'-i',source,'-map',`0:${stream.index}`,'-vf',`setpts=PTS-STARTPTS,select='gt(scene,${threshold})',showinfo`,'-an','-f','null','-']);
  let audio = null;
  if (info.streams.some(s => s.codec_type === 'audio')) {
    await ffmpeg(['-i',source,'-t',String(length),'-map','0:a:0','-vn','-ac','1','-ar','16000',path.join(dir,'audio.wav')]);
    audio = 'audio.wav';
  }
  const manifest = {version:1, source, duration, analyzedDuration:length, truncated:duration>length, fps, timestampBasis:'seconds from decoded playback start; sampled frames are resampled to the requested fps', frames, sceneCandidates:timestamps(scenes.stderr), sceneThreshold:threshold, audio, notes:['Scene detection is heuristic; inspect cuts and transitions visually.','Audio is the first mixed audio stream, not separated stems.','No AI inference or upload has run.']};
  await json(path.join(dir,'manifest.json'),manifest);
  await gallery(dir,frames,'Reference storyboard');
  await fs.writeFile(path.join(dir,'analysis.md'),'# Video analysis\n\nStatus: awaiting visual inspection by your AI tool.\n\n## Observed facts\n\n## Scene timeline\n\n| Start–end | Frame evidence | Layout/text | Motion/sound | Confidence |\n|---|---|---|---|---|\n\n## Inferred construction\n\n## Product adaptation\n\n## Assets to replace or reuse\n\n## Missing evidence\n');
  await fs.writeFile(path.join(dir,'AI-PROMPT.md'),`Read AGENTS.md and .agents/skills/analyze-video/SKILL.md. Analyze this evidence folder: ${dir}\nInspect manifest.json and the actual images in frames/. Use audio.wav if your tool supports audio; otherwise mark audio/transcript unknown. Read storyboard.html for human review. Write evidence-based findings to analysis.md. For motion, request dense samples with npm run focus. Do not infer editable layers or source code from encoded pixels. After analysis, use .agents/skills/rebuild-video/SKILL.md to adapt the construction to my product. Ask for missing product assets only when needed.\n`);
  console.log(`Ready: ${dir}\nOpen storyboard.html to review. Give AI-PROMPT.md and the actual frames to your AI tool.${manifest.truncated ? `\nAnalyzed the first ${length}s of ${duration}s; increase --duration for more.` : ''}`);
  return {dir,manifest};
}

async function main() {
  const {values,positionals} = parseArgs({allowPositionals:true,options:{fps:{type:'string'},duration:{type:'string'},threshold:{type:'string'},start:{type:'string'},end:{type:'string'},out:{type:'string'}}});
  const [command,input,second] = positionals;
  if (command === 'doctor') {
    for (const name of ['ffmpeg','ffprobe']) {
      const result = await run(binary(name),['-version']);
      console.log(`${name}: ${binary(name)}\n${result.stdout.split('\n')[0]}`);
    }
    console.log('Ready. Visual analysis requires an AI tool that can inspect images. Rendering uses a browser (Remotion downloads it on first render).');
    return;
  }
  if (!input) throw new Error('Usage: npm run extract -- input/reference.mp4 [--fps 1 --duration 120]\nOther commands: focus, clip, compare. See README.md.');
  if (command === 'extract') return extract(input,values);
  if (command === 'focus' || command === 'clip') {
    const start = number(values.start ?? 0,'start',0,86400);
    const end = number(values.end,'end',start+0.001,86400);
    const info = await probe(path.resolve(input));
    if (end > Number(info.format.duration)+0.05) throw new Error('end exceeds input duration.');
    const output = path.resolve(values.out ?? (command === 'clip' ? 'public/assets/clip.mp4' : 'work/focus-'+Date.now()));
    if (command === 'clip') {
      await refuseExisting(output);
      await fs.mkdir(path.dirname(output),{recursive:true});
      // -n protects an existing asset. Accurate decoded trim; output is re-encoded.
      await ffmpeg(['-n','-i',path.resolve(input),'-ss',String(start),'-t',String(end-start),'-map','0:v:0','-map','0:a:0?','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',output]);
    } else {
      const fps = number(values.fps ?? 12,'fps',1,60);
      if ((end-start)*fps > 600) throw new Error('Focus is limited to 600 frames; shorten the range or reduce fps.');
      await fs.mkdir(path.dirname(output),{recursive:true});
      await fs.mkdir(output); // Never mix new frames into an old folder.
      const r = await ffmpeg(['-t',String(end),'-i',path.resolve(input),'-vf',`setpts=PTS-STARTPTS,trim=start=${start}:end=${end},setpts=PTS-STARTPTS,fps=${fps},scale=960:960:force_original_aspect_ratio=decrease,showinfo`,'-fps_mode','vfr',path.join(output,'frame-%05d.jpg')]);
      const files = (await fs.readdir(output)).filter(f=>f.endsWith('.jpg')).sort();
      const ts = timestamps(r.stderr);
      if (ts.length!==files.length) throw new Error('Focus frame timestamp count mismatch.');
      const frames=files.map((file,i)=>({file,time:start+ts[i]}));
      await json(path.join(output,'manifest.json'),{source:path.resolve(input),start,end,fps,frames,timestampBasis:'source playback time: requested start + resampled frame timestamp'});
      await gallery(output,frames,'Motion detail');
    }
    console.log(`Ready: ${output}`);
    return;
  }
  if (command === 'compare') {
    if (!second) throw new Error('Usage: npm run compare -- reference.png rendered.png --out out/difference.png');
    const output=path.resolve(values.out ?? 'out/difference.png');
    await refuseExisting(output);
    await fs.mkdir(path.dirname(output),{recursive:true});
    await ffmpeg(['-n','-i',path.resolve(input),'-i',path.resolve(second),'-filter_complex','[0:v][1:v]blend=all_mode=difference','-frames:v','1',output]);
    console.log(`Difference: ${output}. Inputs must have equal dimensions; dark pixels match.`);
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e=>{console.error(e.message);process.exitCode=1;});
