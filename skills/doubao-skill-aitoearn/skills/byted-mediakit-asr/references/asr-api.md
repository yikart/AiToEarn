# Doubao recording recognition business fields

Submit the native business body through the model proxy with `api=doubao.asr`. Follow `mcp.md` for MCP argument mapping. Do not wrap the body in a native HTTP envelope or add authentication headers, resource IDs, request IDs or provider query instructions as body fields. The proxy controls service access; `model_name=bigmodel` alone does not select model generation 1.0 versus 2.0.

## Default request

```json
{
  "audio": {
    "url": "https://example.com/separated-voice.wav",
    "format": "wav"
  },
  "request": {
    "model_name": "bigmodel",
    "enable_itn": true,
    "enable_punc": true,
    "enable_ddc": false,
    "show_utterances": true
  }
}
```

Replace the example URL with the actual separation output. No top-level `model`, `prompt`, `text`, `speaker` or `user.uid` is required by this request contract.

## Audio fields

| Field | Rule |
| --- | --- |
| `audio.url` | Required accessible HTTP(S) URL to the separated voice file; never Base64 or a local path |
| `audio.format` | Required actual format: `wav`, `mp3`, `ogg`, `spx`, `amr`, `aac`, or `m4a` |
| `audio.language` | Optional supported language code; leave unset for the documented Chinese/English/dialect recognition mode |
| `audio.codec` | Optional `raw` or `opus`; only set from known encoding |
| `audio.rate` | Optional sample rate; native default 16000, not evidence about a particular file |
| `audio.bits` | Optional bit depth; native default 16 |
| `audio.channel` | Optional 1 or 2; native default 1 |

Use WAV separation output to stay within the formats explicitly supported in both the endpoint overview and its parameter table. The overview names WAV/MP3/OGG, while the field table lists additional formats; do not broaden the default based on that discrepancy. The recognition limit is 512 MB and five hours for the submitted file.

Language codes listed by the submission documentation include `zh-CN`, `en-US`, `ja-JP`, `id-ID`, `es-MX`, `pt-BR`, `de-DE`, `fr-FR`, `ko-KR`, `fil-PH`, `ms-MY`, `th-TH`, `ar-SA`, `it-IT`, `bn-BD`, `el-GR`, `nl-NL`, `ru-RU`, `tr-TR`, `vi-VN`, `pl-PL`, `ne-NP`, `uk-UA`, and `yue-CN`. The Romanian code is inconsistent between the explicit-language and automatic-language tables; do not guess a forced code when it has not been confirmed. Unset language covers Chinese, English, Shanghainese, Minnan, Sichuan, Shaanxi and Cantonese; it does not imply unrestricted automatic language detection.

## Recognition options

| `request` field | Usage |
| --- | --- |
| `model_name` | Required `bigmodel` |
| `show_utterances` | Set true to obtain available utterance/word/timing details; provider default false |
| `enable_punc` | Punctuation, default true |
| `enable_itn` | Normalize spoken numbers, money and dates, default true; disable for literal number wording |
| `enable_ddc` | Semantic smoothing, default false; leave false to avoid intentional removal/correction of fillers and repetitions |
| `enable_speaker_info` | Optional diarization, default false; requires show_utterances and language unset or zh-CN |
| `ssd_version` | Optional diarization model: `200` for non-meeting scenarios (suggested at most five speakers), `300` for long multi-speaker meetings; requires speaker and utterance options |
| `ssd_mode` | Only version 200: 0 ordinary short audio, 1 clustering for longer non-meeting audio |
| `enable_channel_split` | Optional stereo-channel recognition, default false; not interchangeable with speaker diarization; use only if the separated file retains meaningful channels |
| `enable_auto_lang` | Optional broader automatic language recognition, default false; incompatible with corpus/context configuration |
| `corpus.context` | Optional JSON-serialized string containing supplied hotwords or context; not a nested object |

Add only requested or task-relevant options. Do not automatically infer age, gender, emotion, or turn on content filters. For user-supplied hotwords, an example is `"corpus":{"context":"{\"hotwords\":[{\"word\":\"MediaKit\"}]}"}` under `request`. Total hotwords are limited to 5000, and context to 500 tokens. Hotwords guide recognition; they do not justify inserting inaudible words. Do not enable auto-language alongside corpus.

## Recognition result

The native successful query example contains `audio_info.duration` and a `result` object with `text` and optional `utterances`. Each utterance can include `text`, `start_time`, `end_time`, `words`, and `additions`; speaker/channel labels, when enabled, appear in additions. Word entries may contain text, timings and confidence. Preserve actual values instead of assuming every field is present.

Durations and start/end times in this response are milliseconds. Missing word timings are not an error if sentence-level output suffices. Missing utterances mean timed subtitles cannot be promised. Speaker labels are task-local identifiers.

Native success is represented by status `20000000` when surfaced, but the proxy's response may expose status differently. Inspect the actual service result and transcript rather than requiring undocumented wrapper fields or treating HTTP/outer success as recognition success. Do not parse a submission acknowledgment as a query result.
