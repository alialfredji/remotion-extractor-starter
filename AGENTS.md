# Video Rebuild

Turn reference videos into evidence-based, editable videos for any product. Keep commands and explanations simple. Read README.md for the available commands.

## Skills

- Analyze a reference: read `.agents/skills/analyze-video/SKILL.md`.
- Rebuild or adapt it: read `.agents/skills/rebuild-video/SKILL.md`.
- These skills are project-local. Run `npm run agents` to install matching copies for Claude Code and Cursor. Do not change global agent configuration.

## Working contract

1. Run `npm run doctor`. Extract first, then inspect the actual frame images. Metadata alone is not visual analysis.
2. Preserve evidence: record frame paths, time ranges and confidence in `work/<job>/analysis.md`. Separate facts from estimates. If you cannot inspect images/audio, say so and prepare a handoff; never fabricate analysis.
3. Use `focus` around motion and transitions. One frame per second is an overview, not enough to determine easing or fast edits.
4. Translate findings into editable components in `src/` and parameters in `config/video.json`. Do not silently replace the reference with a generic template.
5. Store reusable clips/images/fonts in `public/assets/`. Keep local input, evidence and renders out of git. Never put API keys in code.
6. Keep this provider-independent. No external upload, paid generation or API call is built in. Use the user's chosen AI tool. Add a provider only when requested; report what media it receives and expected cost before running paid jobs.
7. Render, inspect the result, and compare matching frames at the same dimensions. Verify timing at normal playback speed. Report material mismatches; don't promise exact source recovery.
8. Run `npm run check` and `npm test` for changes to extraction/render logic. Keep all Remotion packages on the same exact version.

Input video cannot generally reveal original editable layers, hidden pixels, original fonts, or original software settings. Reconstruct what is observable and label inferred choices.
