# Remotion Extractor Starter

Give your AI agent a reference video. Extract evidence, understand the construction, then create an editable version for your product.

**FFmpeg extracts. Your AI tool analyzes. Remotion rebuilds.** This project prepares local evidence; it does not automatically call a vision API or recover original editing files.

## Start

Requirements: Node.js 22+, npm, and an AI coding tool that can inspect images (for example your existing Codex, Claude Code or Cursor setup).

```bash
npm run setup
```

Setup installs project dependencies, FFmpeg/ffprobe binaries where supported, and project-local agent skills. `doctor` confirms the media tools actually run. Nothing is installed globally. If optional binary downloads fail, install FFmpeg with `brew install ffmpeg` on macOS, or your OS package manager, then rerun `npm run doctor`. `FFMPEG_PATH` and `FFPROBE_PATH` can select existing binaries.

Put a video in `input/`, then:

```bash
npm run extract -- "input/reference.mp4"
```

Open the printed `work/<job>/storyboard.html` in your browser. In your AI coding tool, say:

> Analyze this reference video using the project's analyze-video skill. Inspect the extracted images, describe how it is constructed, and rebuild it for my product using the rebuild-video skill. My product is [description]. Use [logo, screenshots, colors and copy].

Give the agent the printed evidence folder path. Chat-only tools need the actual selected images attached alongside AI-PROMPT.md; a text manifest alone is not visual evidence. Restart an already-open agent after setup so it discovers the local skills.

## What extraction produces

| File | Purpose |
|---|---|
| `manifest.json` | Timestamped frame paths, scene candidates and processing limits |
| `metadata.json` | Dimensions, codecs, frame rates and stream details |
| `frames/` | JPEGs for your AI tool to inspect |
| `audio.wav` | First audio stream, mono 16 kHz, when present |
| `storyboard.html` | Local visual overview for you |
| `analysis.md` | Evidence-based analysis for your agent to fill in |
| `AI-PROMPT.md` | Handoff prompt for your chosen AI tool |

Default: one frame per second, first 120 seconds, images fitted inside 960×960. Scene candidates use FFmpeg's heuristic detector. Increase coverage explicitly:

```bash
npm run extract -- "input/reference.mp4" --fps 2 --duration 300
```

Supported input: finite local video files decodable by FFmpeg. Direct platform download, live streams, automatic speech transcription, OCR and API-based visual analysis are not included. Your AI tool may perform those analysis steps if it has suitable capabilities. No API keys are required by this project and no media is uploaded by its scripts.

## Inspect motion and reuse material

Extract dense samples around a transition (maximum 600 frames per focus job):

```bash
npm run focus -- "input/reference.mp4" --start 1.2 --end 2.2 --fps 30
```

Extract a reusable clip into Remotion's asset folder:

```bash
npm run clip -- "input/reference.mp4" --start 1 --end 3 --out public/assets/demo.mp4
```

Clip extraction re-encodes; existing outputs are protected. You can also place your own screenshots, images and fonts in public/assets/. Use material you own or have permission to reuse.

## Preview and create a video

Edit `config/video.json`, or let your AI agent edit it and the components in `src/`:

```bash
npm run studio
npm run render
```

The result is `out/video.mp4`. Remotion downloads its rendering browser on first render if needed. Linux may require Chrome system libraries; the Remotion error message lists missing ones. The included 6-second portrait template is a working starting point, not an automatic reconstruction of your reference.

- `width`, `height`, `fps`: output format.
- `background`, `accent`: brand colors.
- `scenes[].duration`: duration **in frames**. At 30 fps, 90 frames = 3 seconds.
- `title`, `subtitle`: editable copy.
- `media`: null, or `{ "type": "video", "src": "assets/demo.mp4" }`; use `"image"` for stills. Paths are relative to public/.

The starter animates text and supports image/video assets. Reference-specific animations, audio tracks, captions and layouts are added by your agent in src/ after analysis. Clip audio is preserved; separate music/voiceover is not configured in the starter.

Compare equal-size stills from the reference and render:

```bash
npm run compare -- reference.png rendered.png --out out/difference.png
```

Dark areas match; bright areas differ. Review timing, motion and audio in playback too. This is not a guarantee of exact visual equivalence.

## Agent setup

Two included project skills: **analyze-video** and **rebuild-video**. Codex uses `.agents/skills/`. `npm run agents` copies these into `.claude/skills/` and `.cursor/skills/`; AGENTS.md, CLAUDE.md and a Cursor rule provide the entry points. Other tools can read the same skill files manually. These are project-local skills, not personal ChatGPT skill installations.

The workflow distinguishes observed evidence from guesses, requests more frames around motion and validates a rebuild against its reference. It cannot recover hidden layers, original font files, isolated audio stems or the original project from a flattened MP4.

Later generation tools can provide images or clips to public/assets/. No Hix/Higgsfield or other paid-service integration is included yet.

## Development

```bash
npm run check
npm test
```

Tests use real FFmpeg-generated media to check timestamped extraction, scene candidates, audio/no-audio behavior, dense samples and clip trimming. CI runs checks and a small Remotion render.

Initial validation: media integration tests, TypeScript checks, skill validation and Remotion bundling passed. Rendering could not be verified in the authoring environment because the downloaded browser exited with SIGTRAP. Run the render check on your machine or review GitHub Actions before relying on rendering.

Inputs, extracted evidence, private assets, API keys and renders are ignored by git. Source code and skills belong in the repository. Remotion and the distributed media binaries retain their own licenses; check [Remotion licensing](https://www.remotion.dev/license) for your intended commercial usage.
