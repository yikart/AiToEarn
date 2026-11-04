# Seed Audio request and response

## Request

Submit this business object through the model proxy with `api=doubao.audio_generation`. Follow `mcp.md` for MCP argument mapping. Do not include native-service authentication headers or an HTTP envelope.

| Field | Type | Rules |
| --- | --- | --- |
| `model` | string, required | `seed-audio-1.0` |
| `text_prompt` | string, required | At most 3000 characters; generation instructions or text to speak |
| `references` | object array | Optional; choose audio/voice references or one image |
| `audio_config` | object | Optional output and post-processing settings below |
| `watermark` | object | Optional; not a boolean |

Supported generation languages: Chinese, English, Japanese, Korean, Mexican Spanish, Spanish, German, French, Brazilian Portuguese, Thai, Vietnamese, Malay, Filipino, Italian, Russian, Dutch, Polish, and Turkish. Voice-catalog language coverage and model language coverage are different constraints; do not infer extra model languages from a voice name.

Specify total duration and speech/event time ranges in `text_prompt`. The maximum original generated duration is 120 seconds. There is no documented structured duration field.

## References

Audio mode accepts up to three references, each with exactly one of:

- `speaker`: a Doubao TTS 2.0 preset voice ID or an existing compatible cloned voice ID.
- `audio_url`: a complete accessible URL to a reference recording.

Each recording must be at most 30 seconds and 10 MB, in `wav`, `mp3`, `pcm`, or `ogg_opus`. Refer to entries in list order as `@音频1`, `@音频2`, and `@音频3`, including preset speaker entries.

Image mode accepts one reference with `image_url` set to an accessible HTTP(S) URL. Allowed formats: JPEG, PNG, WebP; maximum 10 MB. In this mode `text_prompt` must contain only the text to speak. The model conditions the delivery on the image.

Do not mix image references with recordings or speaker references anywhere in the same request. All media inputs in MediaKit model business requests require accessible HTTP(S) URLs; do not send `audio_data`, `image_data`, Base64, data URLs or local paths, regardless of size. Obtain URLs for local files through an authorized upload/hosting route. Preserve supplied signed URLs exactly. Preset/cloned `speaker` IDs are voice selectors and remain supported.

## Output configuration

| `audio_config` field | Values | Default |
| --- | --- | --- |
| `format` | `wav`, `mp3`, `pcm`, `ogg_opus` | `wav` |
| `sample_rate` | Format-dependent table below | Format-dependent |
| `speech_rate` | Integer -50 through 100; -50 is 0.5x, 100 is 2x | 0 |
| `loudness_rate` | Integer -50 through 100; -50 is 0.5x, 100 is 2x | 0 |
| `pitch_rate` | Integer -12 through 12 | 0 |
| `enable_subtitle` | Boolean; enables word timestamps | false |

These defaults are API fallback values, not mandatory request fields. Prefer prompt guidance for qualitative voice and delivery; omit speed, pitch, and loudness controls unless an explicit value, supported mapping, or measured correction justifies them. Follow [parameter guidance](prompting.md#choose-speed-pitch-and-loudness) and validate timing and audio quality after adjustment. Omission uses service defaults; it does not disable service processing or guarantee a particular delivery.

| Format | Allowed sample rates (Hz) | API default (Hz) |
| --- | --- | --- |
| WAV / PCM | 8000, 16000, 24000, 32000, 40000, 44100, 48000 | 40000 |
| MP3 | 8000, 16000, 24000, 32000, 44100, 48000 | 44100 |
| Ogg Opus | 48000 | 48000 |

The skill's convenient-delivery default is MP3/44100; the API's omitted-format default is WAV/40000. Do not request MP3/40000 or Opus at a different rate. Raw PCM has no self-describing container; do not guess sample format or channel layout when decoding it. Prefer WAV when these are unknown.

`watermark.aigc_watermark` is a boolean, default false, that adds an audible rhythmic ending when enabled. `watermark.aigc_metadata` accepts `enable` (boolean, default false) and optional strings `content_producer`, `produce_id`, `content_propagator`, `propagate_id`. Omission disables watermarking by default.

Do not add fields from other generation APIs, such as `prompt`, `text`, top-level `speaker`, `voice`, `duration`, `stream`, or `response_format`. TTS streaming mode, emotion enums, and resource IDs from other speech interfaces are not documented fields here; describe emotion in the prompt.

## Native response fields

Inspect the actual MediaKit business result returned by the task query.

| Field | Meaning |
| --- | --- |
| `audio` | Base64-encoded generated audio |
| `url` | Generated audio URL, valid for 2 hours |
| `duration` | Processed duration in seconds, after speed/post-processing |
| `original_duration` | Original model duration in seconds, billing basis; at most 120 |
| `subtitle` | Optional timestamp object when enabled |
| `code`, `message` | Optional status/error information; do not require an undocumented success code |

`subtitle` contains `text` and `sentences`. Each sentence contains `start_time`, `end_time`, `text`, and `words`; each word contains `start_time`, `end_time`, and `text`. All subtitle timestamps are **milliseconds**. Preserve the original JSON; convert to SRT/VTT only when requested, accounting for the units.

Save returned bytes without unnecessary transcoding. Compare decoded duration to `duration`, not to the billing value `original_duration`. Missing audio/URL, malformed Base64, or a provider error is not a successful delivery.
