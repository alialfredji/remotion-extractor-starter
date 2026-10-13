import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
for (const agent of ['.claude','.cursor']) {
  for (const name of ['analyze-video','rebuild-video']) {
    await fs.cp(`${root}.agents/skills/${name}`,`${root}${agent}/skills/${name}`,{recursive:true});
  }
}
console.log('Project skills ready for Codex (.agents), Claude Code (.claude), and Cursor (.cursor). Restart your agent if it was already open. Other agents: read AGENTS.md.');
