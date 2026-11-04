# MCP reference

## Tool mapping

Use the MediaKit tools exposed by this environment. Do not install or run `mediakit-cli`.

| Capability | Tool and arguments |
| --- | --- |
| Frame extraction | `extract_frames` with `video_url` and sampling fields |
| Image / audio / video understanding | `media_understanding` with `media_url` and `prompt` |
| Speech evidence / subtitles | `asr_subtitles` |
| Full transcript | Follow `../../byted-mediakit-asr/SKILL.md` |
| Task status | The environment resolves submitted task IDs automatically |

If a capability is unavailable, report the gap. Do not substitute a prohibited high-level analysis workflow.

## Understanding

Submit one image, audio, or video asset per call. Submit video only when the user explicitly requests direct video understanding:

```json
{
  "media_url": "<reference accepted by the MCP schema>",
  "prompt": "<question and source evidence context>"
}
```

For image and audio inputs, omit `manual_option` and `scene`. For a contact sheet, provide the verified tile order, source timestamps, coverage gaps and question. Ask for visible findings tied to frames, with interpretations distinguished from observations. For audio, specify the relevant music, sound effects or ambience, source interval, and approximate time ranges; do not ask it to infer visual causes. Use `asr_subtitles` separately for exact speech.

Direct video input requires an explicit user request for direct video understanding; do not add it alongside extraction and ASR for speed, story context or highlight search. Tool support for video and `scene=editing` do not authorize this path or guarantee precise timestamps. For explicitly requested video sound analysis, use `manual_option.need_audio=true` when supported; omit `scene` for sound analysis.

## Extraction

Use typed JSON values. Example arguments:

```json
{
  "video_url": "<service-accessible video reference>",
  "snapshot_type": "TimeInterval",
  "time_interval": 3,
  "enable_sprite": true,
  "sprite_rows": 4,
  "sprite_cols": 4,
  "snapshot_limit": 3,
  "scale_long": 384
}
```

Choose values for the actual source; this example permits up to 48 tiles and does not guarantee complete coverage. Apply the shared sampling reference, including readable tiles and reliable time mapping. For refinement, use `snapshot_type=SpecifiedTime`, a numeric `specified_time` array and `enable_sprite=false` when supported. Send returned images to image understanding rather than resubmitting the original video.

## Inputs and task lifecycle

Use media references accepted by the MCP schema and runtime resolver. Do not send Base64, data URLs, local paths, or platform IDs as model parameters. If no suitable accessible reference is available, report the missing input capability.

Retain the actual task ID from submission and query the same task until terminal. If submission has no usable task ID, inspect the actual response and report the submission problem without inventing an ID or blindly retrying. A timeout or empty content is not a reason to submit the operation again. Keep source/modality associations, retain usable partial evidence, and report missing analysis. Only summarize content actually returned or inspected.
