---
name: video-generation
description: Generate, edit, or extend videos with Seedance models via list_video_generation_models and generate_video; optimizes prompts per model's conventions. Use when user asks to create, edit, extend, or storyboard a video, or mentions seedance / text-to-video / image-to-video / video-to-video.
requiredTools:
  - list_video_generation_models
  - generate_video
  - probe_video_metadata
  - probe_audio_metadata
  - probe_image_metadata
---

# Video Generation

Generate, edit, or extend videos with `list_video_generation_models` and `generate_video`.

The catalog is the source of truth for every video model. For Seedance families, use `references/seedance-2-0-guide.md` (default model is Seedance 2.0 Mini at 480p); use `references/seedance-2-5-guide.md` only when routed to 2.5. For other families, use only catalog capabilities and the user's intent; do not transfer Seedance-only prompt conventions.

## Tools

- `list_video_generation_models`: call first — before routing. Select the returned `id`; inspect `family`, `modes`, `input.frames`, `input.references`, `output`, and `billing`. The metadata fields are flat; there is no nested `metadata` object. The preferred default is `doubao-seedance-2-0-mini-260615` with `output.resolution: '480p'` and `output.duration: 4` (4 seconds) when listed.
- `generate_video` (v2): `prompt` required; `model` optional (omit to use `doubao-seedance-2-0-mini-260615`; its `output.resolution` defaults to `480p` and `output.duration` defaults to `4`); `mode` is `generate`, `edit`, or `extend`; optional `frames: {first, last}`, `references: {images, videos, audios}`, `output: {resolution, aspectRatio, duration, outputFormat, seed, watermark}`, `options`, and `groupId`.
  - `frames.first` / `frames.last` are first/last frame anchors (not ordinary references); `references.images` are ordinary reference images. Do not mix anchors with references.
  - `output.duration: -1` lets the model choose the duration. Use it only when the catalog shows `supportsAutoDuration`.
  - `output.outputFormat` accepts `mp4` or `mov`; send it only for Seedance 2.5.
  - `options.omniReferenceTaskType` accepts `auto`, `reference`, `edit`, or `extend`; send it only for Seedance 2.5. If omitted, the adapter derives `edit` / `extend` from `mode` and `reference` when reference media is present.
  - Seedance 2.5 `edit`: require at least one reference video, `output.aspectRatio: 'adaptive'`, and `output.duration: -1`.
  - Seedance 2.5 `extend`: require at least one reference video and `output.aspectRatio: 'adaptive'`.
  - Seedance 2.5 first-frame / first-last-frame: require `output.aspectRatio: 'adaptive'`.
  - Async tool: `submit` creates the task, `resolveResult` polls `status` / `videoUrl` / `coverUrl`. Wait for completion before reporting.
  - Credit estimate runs automatically; if the user must confirm, wait. Do not retry a rejected cost.

Do not call other video APIs, CLIs, or local scripts.

## When to use

- Text-to-video, image-to-video, multi-reference video generation
- Video editing (replace / add / remove elements or sound)
- Video extension (forward / backward continuation)
- First-frame / first-last-frame controlled generation, keyframe / storyboard generation

## When not to use

- Static image generation — use `image-creation` instead
- SVG / vector icons, diagrams, or deterministic code-native output
- Polling task status outside the `generate_video` async lifecycle

## Decision tree

1. **Intent**: generation / editing / extension / first-last-frame? Editing keywords: `编辑/修改/替换/增加/删除`; extension keywords: `延长/延续/续写/向前/向后`. Replication keywords: `复制/仿拍/同款` — route to reference-based generation (`mode: generate`, uploaded video in `references.videos`), never `edit` / `extend`; if what "复制" means stays ambiguous (remake the content vs only reuse motion/pace), ask one merged clarifying question per the guide's 最少澄清 rule.
2. **Model routing**: choose from the complete catalog. Default to Seedance 2.0 Mini (`doubao-seedance-2-0-mini-260615`) at 480p (cheapest; multi-image ≤9 / multi-video ≤3 / multi-audio ≤3 references, first/last frames). If the catalog does not list Mini, use another Seedance 2.0 Mini at 480p or the cheapest available 480p model. Keep Mini at 720p when the user requests 720p. Need 1080p / 4K → Seedance 2.0 standard. Duration > 15s, references beyond 2.0 limits (图 >9 / 视频 >3 / 音频 >3), timestamps, precise edit / seamless extend / keyframes / storyboard / whitebox / multi-view → 2.5. For edit / extend, select a model whose catalog `modes` includes the requested mode; do not assume the default Mini supports it. See `references/model-comparison.md`. **Default-confirmation rule**: the default config is Seedance 2.0 Mini at 480p with duration 4s; use it directly whenever it fits the request. Whenever the routing above would select a non-default model, resolution, aspect ratio, or duration, first tell the user in one or two sentences why the default cannot serve their request and which model/config you plan to use, then wait for their explicit confirmation; never switch to a non-default config silently. If the user already specified that model/config in their own request, their choice stands and no extra confirmation is needed. If the user declines, fall back to the closest default-compatible option or ask what they prefer.
3. **Input state**: classify per the Seedance guide (2.0 Mini at 480p by default, 2.5 when escalated) — 纯文生 / 需要参考但未提供素材 / 素材可读取 / 无法读取 / 规格预检. Hard limits (30 图, 10 视频/30s, 10 音频/30s, 合计 50) are 2.5 ceilings; for 2.0 Mini use the model's own `input` limits from the catalog (图 9 / 视频 3 / 音频 3, 视频音频总 15s). Use `probe_video_metadata`, `probe_audio_metadata`, or `probe_image_metadata` only when exact resolution/duration is needed to route the model or enforce limits before submission; `generate_video` validates the same input server-side, so do not probe again just to pre-check a submission the tool will validate. These probes are billed per call and video/audio probes are async; wait for the result and reuse it.
4. **Roles**: label every input media per the guide's `建立素材职责和主体映射` — image: first-frame / last-frame / reference; video: edit master / extend base / reference; audio: BGM / dialogue / SFX.

## Workflow

1. Call `list_video_generation_models` and pick `model` from `id`, plus a supported `mode` and `output` (`resolution`/`aspectRatio`/`duration`/`outputFormat`). When the user has no model or resolution preference, use the default Seedance 2.0 Mini at 480p. When the user has no duration preference, set `duration: 4`; use `duration: -1` only when the model metadata shows `supportsAutoDuration`; use `outputFormat: 'mov'` only for Seedance 2.5 when the user needs a professional intermediate. Frame capability is indicated by `input.frames`; ordinary media limits live under `input.references`.
2. Collect prompt, constraints / avoid list, and input media URLs. Label every image / video / audio role; enforce hard limits from `input` constraints; note stability guidance (1–8 img subjects, 1–5 av subjects 5–10 s). When you need to check provided material against the hard limits yourself, use the matching Volcengine probe once (video: `probe_video_metadata`; audio-only: `probe_audio_metadata`; image: `probe_image_metadata`). Do not probe the same URL twice; `generate_video` also validates input server-side.
3. Run the 8-step workflow per `seedance-2-0-guide.md` (default; `镜头1/2/3` instead of timestamps) or per `seedance-2-5-guide.md` when routed to 2.5 (timestamp control, free aspect ratio, multi-view): ① parse goal (story contract + dialogue ledger + required-entity list) → ② compile long text → ③ two-pass material understanding → ④ duty mapping + `【未采用素材】` → ⑤ confidence routing → ⑥ sole task + aspect-ratio gate (`请注意这不是视频编辑。` only on gate trigger) → ⑦ param rules → ⑧ template purification.
4. Select template family: base / reference / multi-material / long-video / editing (sole master + range closure + motion-slot) / extension (boundary anchoring + single continuous instance) / keyframe (`@图片N作为首帧。` verbatim) / storyboard (≤15) / whitebox / emotion-camera-audio.
5. Compose the prompt per template — replace all `<占位符>`. Do not write `output.aspectRatio` / `output.duration` / `output.resolution` into the prompt. Do not auto-add quality/watermark/subtitle constraints unless user requested. For `复制/仿拍/同款` requests, use the guide's 带参考素材的生成 template: state the uploaded video's duty (动作、运镜或节奏) with 不采用 clauses, and tell the user the output is a content/pace remake, not a frame-level identical copy.
6. Call `generate_video` once per requested video. Pass anchors in `frames: {first, last}` and ordinary references in `references: {images, videos, audios}`.
7. Wait for the async task to complete, verify `videoUrl` / `coverUrl` and check subject, style, and motion quality.
8. Iterate with one targeted change if needed. Re-apply invariants on every retry.
9. Report every completed `videoUrl` from this task, not only the latest one: one list item per video with a short label and the exact URL. If some tasks failed, list them separately with the error. Also report the final prompt, model, and params.

## References

- `references/seedance-2-0-guide.md` — default methodology guide: 11 principles, 5 input states, 8-step workflow, all templates, output contract, 26-point self-check; `镜头1/2/3` instead of timestamps, fixed 6 ratios, single-view, text generation patches (1080p/4K is 2.0 standard-only; Mini/Fast are 480p/720p)
- `references/seedance-2-5-guide.md` — same methodology; use when routed to 2.5 (timestamps, >15s, larger reference sets, precise editing, keyframes/storyboard/whitebox, multi-view)
- `references/model-comparison.md` — 2.0 Mini (default) / 2.0 Fast / 2.0 standard / 2.5 capability table and routing decision tree
