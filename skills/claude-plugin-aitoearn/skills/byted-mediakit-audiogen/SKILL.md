---
name: byted-mediakit-audiogen
description: Generate audio with Seed Audio through MediaKit MCP. Use for speech, narration, character dialogue, sound effects, ambience, and audio scenes from text, preset voices, reference audio, or an image. Supports voice selection, delivery instructions, and optional word timestamps. Do not use for transcription or tasks requiring only deterministic audio editing, mixing, or transcoding. For pure narration or explainer TTS, use this skill with seed-audio-1.0.
allowed-tools:
  - call_maas_proxy
---

## Environment

This agent exposes MediaKit through MCP/REST tools only. `mediakit-cli` is not available. Ignore any CLI fallback or installation instructions in this skill and its references; if a capability is unavailable, report the gap instead of running a terminal command.

# Audio Generation

Use the available MediaKit MCP model proxy with `api=doubao.audio_generation`. MediaKit manages submission and asynchronous retrieval. Use the bundled references and the selected tool’s public schema; external documentation is not required.

## Generation modes

Use this skill for pure narration, explanatory voiceover, character dialogue, sound effects, ambience, and combined audio scenes. `byted-tts` is not available in this environment.

## Tools

Use `call_maas_proxy` with `api=doubao.audio_generation` and a typed `maas_params` object. Do not install or run `mediakit-cli`.

- Submit one task per requested clip or variant.
- The host resolves the submitted task and returns its completed result.
- If the proxy capability is unavailable, report the gap.

## Defaults and boundaries

- All reference media in model business requests must use accessible HTTP(S) URLs. Base64, data URLs and local paths are unsupported. Obtain URLs for local files through an authorized upload/hosting route before submitting. Preset/cloned `speaker` IDs remain voice selectors, not media payloads.

- Use `model=seed-audio-1.0`. Do not silently substitute a different model or generation service.
- Default to MP3 at 44100 Hz for convenient playback. Honor an explicitly supported format and sample rate; prefer WAV when the user requests an editing master.
- Preserve exact supplied dialogue. Prefer describing voice characteristics and delivery in `text_prompt` when no specific voice identity or recording is required; do not automatically select a preset. Preserve specified voices and established continuity. Pure effects and ambience do not need a speaker.
- Prefer `text_prompt` for qualitative pace, register, and vocal energy. Add `speech_rate`, `pitch_rate`, or `loudness_rate` only when supported by an explicit value, an unambiguous supported mapping, or measured evidence for an adjustment; otherwise omit these optional controls rather than filling in zeros. Video-aligned dubbing permits evidence-based speed adjustment without asking the user to supply a number, but a target duration alone does not determine that number. Follow [parameter guidance](references/prompting.md#choose-speed-pitch-and-loudness), preserve explicit user settings, and report material adjustments. Format, sample rate, and subtitles remain separate output requirements. Omit watermark configuration unless requested; the documented default disables watermarking.
- Use existing environment authentication. Missing `MEDIAKIT_API_KEY` is not a reason to block execution. Never expose credentials or internal authentication details.
- Submit one task per requested clip or variant. Save each attempt separately.

## Workflow

1. Identify the goal: exact speech, dialogue, effects/ambience, or a combined audio scene. Determine language, duration target, voice requirements, and deliverable format from the request. If audio is intended for existing visuals, follow the visual timing checks in [prompting.md](references/prompting.md#speech-for-existing-visuals) before drafting or submitting; a standalone audio asset does not require a visual sync map. Ask only for missing information that prevents a useful result.
2. Read [audio-api.md](references/audio-api.md). Inspect supplied references, including format, size, and audio duration. Preserve the user's inputs; record deliberate transformations.
3. Select one input mode: text only, text plus audio/preset voices, or text plus one image. Honor an explicitly selected voice or reference. When a recording is explicitly supplied as the desired voice or delivery, prefer audio input via `references[].audio_url` instead of searching for a similar preset. Audio supplied only for timing, music, or source context is not automatically a voice reference; clarify its role when ambiguous. Images cannot coexist with audio or speaker references. Resolve incompatible requirements before submitting.
4. Describe the target voice and delivery in `text_prompt` by default, based on explicit requirements and inspected material. Read [voices.md](references/voices.md) when resolving a voice/reference requirement or selecting a preset for identity continuity. When selecting a preset, match documented or heard characteristics and give voice names the lowest priority. Treat male/female voice requirements as constraints only when specified by the user or character setting, not inferred from genre. For presets, copy exact IDs into `references[].speaker`. Without a reference, omit `references` and `@音频` markers. Do not generate audition variants by default. An existing compatible cloned voice ID is supported; creating a clone is outside this skill.
5. Build `text_prompt` and choose supported `audio_config` controls using [prompting.md](references/prompting.md) and [sample-prompts.md](references/sample-prompts.md). Match delivery to the scene, listener, intent, and target timing; keep fixed dialogue separate from production directions. Keep pace instructions consistent with the selected speed. Bind audio references in order using `@音频1`, `@音频2`, and `@音频3`. For image-conditioned generation, the prompt must contain only the text to speak.
6. Save the request and reference-role mapping in a unique directory under `output/audiogen/`. Submit once with `call_maas_proxy` and wait for the async tool to return the completed result.
7. Inspect the business response for errors and actual audio. A task ID or outer success status alone is not a deliverable. Save the returned audio before its URL expires, following host media policies; save requested subtitles separately.
8. Probe the saved file for actual duration, codec, sample rate, and channels. For existing visuals, compare each clip's measured duration and intended placement against its current visual window before handing it off for placement. Completion of generation does not establish sync. Listen when evaluating pronunciation, voice consistency, timing, effects, or audible quality. Metadata alone does not establish these properties.
9. If the content misses the brief, revise only the relevant prompt or setting and save a new attempt. Query, download, or display failures are not reasons to regenerate.
10. Deliver a native audio preview and absolute local file links, plus selected model/voice, final prompt, measured duration, and material limitations. For existing visuals, include each segment's visual anchor, placement window, measured audio duration, fit status, and unresolved mismatch. Distinguish metadata verification from listening review; do not claim final timeline sync without placement verification by the editing workflow.

## Limits

- Original generated audio is at most 120 seconds. Longer content requires separate segments and explicit continuity/mixing decisions.
- Duration and event timings are prompt instructions, not exact sample guarantees. Do not invent a `duration` request field or silently trim, stretch, or pad the result.
- This interface does not document video input, separate stems, streaming, or sample-exact preservation of a reference recording.
- If a requested capability is absent from bundled rules and installed schema, state the gap rather than inventing parameters or automatically opening external documentation.

## Reference map

- [audio-api.md](references/audio-api.md): request fields, input limits, and response interpretation.
- [voices.md](references/voices.md): voice selection and an index to the complete bundled TTS 2.0 catalogs; load the relevant table on demand.
- [mcp.md](references/mcp.md): preferred MCP discovery, input mapping, and task handling.
- [mcp.md](references/mcp.md): MCP submission, polling, delivery, and recovery.
- [prompting.md](references/prompting.md): speech, reference binding, scene timing, and iteration.
- [sample-prompts.md](references/sample-prompts.md): complete business request examples.
