---
name: rebuild-video
description: Reconstruct and adapt an analyzed reference video as editable Remotion scenes, reuse selected media and compare the rendered result. Use when asked to create a product video from a reference, reproduce motion or modify a video template.
---

# Rebuild Video

1. Read AGENTS.md and the evidence folder's analysis.md and manifest.json. Inspect cited frames. If analysis is missing, run analyze-video first. Write a short adaptation brief with output dimensions, scene timing, product copy, brand colors, media and audio plan.
2. Use config/video.json for scene durations (frames), text and asset references. Use src/Root.tsx as a starter, then create specific components for the reference's composition, transitions and movement. Preserve editable text. Avoid leaving generic starter animations when reference behavior is known.
3. Convert seconds to output frames with rounding at the chosen fps. Account for different input/output frame rates. Animate from useCurrentFrame; Sequence resets the local frame. Use interpolate or spring deterministically; never use wall-clock time or unseeded randomness.
4. Put selected footage in public/assets/: `npm run clip -- "input/reference.mp4" --start 1 --end 3 --out public/assets/demo.mp4`. Reference it as `{ "type": "video", "src": "assets/demo.mp4" }`; images use type image. Clip extraction re-encodes and refuses to overwrite an existing file. Use the user's product assets when replacing reference material.
5. For audio, add explicit Remotion audio components and timing if needed. The starter has no separate music/voiceover track; embedded clip audio plays with its clip. Do not invent a transcript or pretend mixed audio is isolated speech/music.
6. Run npm run check, npm test, npm run studio, and npm run render. Inspect representative rendered stills and playback. For matching-size frame images, run `npm run compare -- reference.png rendered.png --out out/difference.png`. Differences are evidence, not a perceptual quality score. Compare motion and sound in playback too. Fix major mismatches.
7. Report what was recreated, what was changed for the product and remaining estimates. Save evidence and renders locally, source changes in git. Never claim original source recovery.

Keep Remotion package versions aligned. No paid provider is required. If the user later chooses Hix, Higgsfield or another generation tool, first clarify which service; keep its credentials outside git and its output behind the same asset/timeline contract. Do not invent a provider integration that is not implemented.
