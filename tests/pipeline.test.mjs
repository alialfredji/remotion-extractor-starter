import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {ffmpeg,probe,run} from '../scripts/media.mjs';
import {extract} from '../scripts/video.mjs';

// Real media integration: no mocked decoding or fabricated timestamps.
test('extract, focus and clip work on audio and silent videos',async () => {
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'video-rebuild-'));
  const jobs=[];
  try {
    const source=path.join(tmp,'reference space.mp4');
    await ffmpeg(['-f','lavfi','-i','color=c=black:s=320x240:r=30:d=1','-f','lavfi','-i','color=c=white:s=320x240:r=30:d=1','-f','lavfi','-i','sine=frequency=440:duration=2','-filter_complex','[0:v][1:v]concat=n=2:v=1:a=0[v]','-map','[v]','-map','2:a','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',source]);
    const full=await extract(source,{fps:'2'});jobs.push(full.dir);
    assert.equal(full.manifest.frames.length,4);
    assert.deepEqual(full.manifest.frames.map(f=>f.time),[0,0.5,1,1.5]);
    assert.ok(full.manifest.sceneCandidates.some(t=>Math.abs(t-1)<0.05));
    assert.equal(full.manifest.audio,'audio.wav');
    assert.ok((await fs.stat(path.join(full.dir,'audio.wav'))).size>1000);
    const limited=await extract(source,{duration:'0.5',fps:'2'});jobs.push(limited.dir);
    assert.equal(limited.manifest.truncated,true);
    assert.equal(limited.manifest.frames.length,1);
    const silent=path.join(tmp,'silent.mp4');
    await ffmpeg(['-i',source,'-an','-c:v','copy',silent]);
    const noAudio=await extract(silent);jobs.push(noAudio.dir);
    assert.equal(noAudio.manifest.audio,null);
    const focus=path.join(tmp,'focus');
    await run(process.execPath,['scripts/video.mjs','focus',source,'--start','0.5','--end','1.5','--fps','12','--out',focus]);
    const dense=JSON.parse(await fs.readFile(path.join(focus,'manifest.json'),'utf8'));
    assert.equal(dense.frames.length,12);
    assert.equal(dense.frames[0].time,0.5);
    assert.ok(Math.abs(dense.frames.at(-1).time-(0.5+11/12))<0.0001);
    const clip=path.join(tmp,'clip.mp4');
    await run(process.execPath,['scripts/video.mjs','clip',source,'--start','0.5','--end','1.5','--out',clip]);
    assert.ok(Math.abs(Number((await probe(clip)).format.duration)-1)<0.1);
    await assert.rejects(run(process.execPath,['scripts/video.mjs','clip',source,'--start','0','--end','1','--out',clip]));
    await assert.rejects(extract(silent,{fps:'0'}),/fps must/);
    const ref=path.join(full.dir,full.manifest.frames[0].file);
    const diff=path.join(tmp,'difference.png');
    await run(process.execPath,['scripts/video.mjs','compare',ref,ref,'--out',diff]);
    assert.ok((await fs.stat(diff)).size>0);
  } finally {
    await fs.rm(tmp,{recursive:true,force:true});
    for (const dir of jobs) await fs.rm(dir,{recursive:true,force:true});
  }
});
