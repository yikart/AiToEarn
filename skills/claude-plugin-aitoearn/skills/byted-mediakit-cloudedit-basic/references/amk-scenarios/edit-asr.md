# Aligning ASR Subtitles with the Editing Timeline

Read this guide when ASR returns speech times from a complete source video or audio file and subtitles must be placed over media elements that use all or part of that source. This guide explains how to convert source timestamps into final timeline timestamps after source-range selection, trimming, splitting, moving, changing speed, reusing material, or adding transitions. Subtitle style and layout follow the [text editing guide](../edit-text.md). Do not read this guide when only retrieving transcript text.

## Core Constraints

- ASR timestamps belong to **source time**, measured from the start of the complete original material.
- Subtitle `from_time_ms` and `duration_ms` belong to **timeline time**, measured from the start of the edited project.
- Source time and timeline time are different clocks. Never copy a raw ASR timestamp directly into a subtitle element.
- Run ASR once for each complete original material. When the project contains materials A and B, keep their ASR results separate. Match each result to timeline elements by exact source/material ID, not by file order, similar content, or timestamp.
- Mapping must use `preview_timeline` after the final structural edit. Its `timeline_range` and `source_range` are a paired logical projection from the same call. When transitions exist, never combine a preview time range directly with the raw source range from `inspect_elements`.
- The formulas in this guide calculate only the source-time-to-logical-time relationship within one element. Do not use them to predict timeline changes caused by transitions, ripple, absorb, or movement.
- Complete all structural edits that change dialogue positions before generating subtitles. If later structural changes are still required, execute the `structure_checkpoint` in the [editing quality gate](../edit-quality-gate.md).
- Add subtitles only for dialogue that is actually audible in the final edit. For muted media, replacement audio, or a video’s embedded audio coexisting with extracted audio, use the element that actually produces sound and avoid duplicate subtitles. Spatial cropping, scaling, and positioning do not affect subtitle timing.

## Time Ranges

Use half-open ranges `[start, end)` throughout. The start is included and the end is excluded. For each final media occurrence, keep these ranges distinct:

- ASR range `[A0, A1)`: where one recognized utterance occurs in the complete original material;
- element source range `[S0, S1)`: the source content represented by the final timeline element;
- element timeline range `[T0, T1)`: where that element appears in the edited project.

The ASR result answers "what is spoken, and when, in the complete source." The element's paired source and timeline ranges answer "which part of that source is present, and where it appears in the final edit."

## Result Readiness and Alignment Ledger

Require a terminal, completed ASR result for the complete original material before creating subtitles. `submitted`, `queued`, `processing`, partial, timed-out, or failed is not ready. Query the existing task until it finishes; do not resubmit it. Never invent subtitle text or distribute subtitles evenly while the result is unresolved.

Before mapping, record one alignment ledger for each final media occurrence:

- exact source/material ID;
- completed whole-source ASR result ID and each candidate segment's ID, text, and source range `[A0, A1)`;
- final media element ID;
- latest `preview_timeline` revision, paired source range `[S0, S1)`, paired timeline range `[T0, T1)`, and playback rate `R`;
- retained intersection `[I0, I1)` and calculated subtitle timeline range.

Only the completed whole-source ASR result supplies subtitle text and source timestamps. A title, summary, score, OCR result, filename, or progress message cannot replace it.

## Source-to-Timeline Workflow

Follow this order for every source material:

1. Run ASR on the complete original audio/video. Keep every returned text segment attached to that source ID and its source-time range.
2. Complete the timeline structure before placing subtitles.
3. Call `preview_timeline` and read the final paired `source_range` and `timeline_range` for each media occurrence.
4. For each occurrence, select only ASR segments from the same source/material ID, intersect them with the element's source range, then map the retained intersection to timeline time.
5. Write subtitles only after every pending entry passes the checks in this guide.

Do not run one combined mapping across A and B. Process each final occurrence independently. The same source may be transcribed once and used in several occurrences, but each occurrence needs its own intersection and timeline mapping.

## Establishing Element Mapping Ranges

Use the element ID to associate two kinds of facts for the same media element:

- `preview_timeline`: the final logical range `[T0, T1)` and, when present, its paired projected source range `[S0, S1)`;
- `inspect_elements`: the material ID, raw `from_time_ms`/`duration_ms`, explicit `source_start_ms`/`source_end_ms`, `playback_rate`, and audio state.

If `playback_rate` is absent, treat it as `1`. The ASR input must correspond to the source material actually referenced by the element. When the same material appears multiple times, it may be transcribed once, but each element instance must be mapped separately.

Prefer the `[T0, T1)` and `[S0, S1)` pair from the same `preview_timeline` item. If that item has no `source_range`, complete the source range paired with the preview range as follows:

1. Obtain the raw logical range `[U0, U1)` and playback rate `R` from `inspect_elements`.
2. If an explicit source range exists, set `[B0, B1)` to `source_start_ms`/`source_end_ms`. Otherwise, obtain material duration `D` from `inspect_materials` and set `[B0, B1) = [0, D)`.
3. Project the source range using the boundary differences returned by the preview; do not infer it from transition parameters:

```text
S0 = B0 + (T0 - U0) × R
S1 = B1 + (T1 - U1) × R
```

Before continuing, confirm that `S0 >= B0`, `S1 <= B1`, and `S0 < S1`, and that `(S1 - S0)` matches `(T1 - T0) × R` within integer-millisecond rounding error. If complete facts are unavailable or the relationship is inconsistent, stop mapping and first read back or correct the element state.

## Mapping ASR Segments

Calculate in milliseconds throughout. If ASR returns seconds, multiply by `1000`; round to integer milliseconds only when generating the pending subtitle entries.

For an ASR segment `[A0, A1)` and the final element source range `[S0, S1)`, calculate the retained source interval:

```text
I0 = max(A0, S0)
I1 = min(A1, S1)
```

If `I0 >= I1`, that utterance is not present in this final occurrence, so do not create a subtitle. If `I0 < I1`, map only the retained interval:

```text
subtitle from_time_ms = T0 + (I0 - S0) / R
subtitle end_time_ms  = T0 + (I1 - S0) / R
subtitle duration_ms = subtitle end_time_ms - subtitle from_time_ms
```

### Example: material A

ASR analyzes complete material A and returns:

```text
A [1000, 3000): "sub1"
A [7000, 9000): "sub2"
```

The final 1x element uses source range `A [5000, 11000)` and appears on timeline `[1000, 7000)`.

- `"sub1"` has no intersection with `[5000, 11000)`, so no subtitle is created.
- `"sub2"` intersects the retained source at `[7000, 9000)`.
- The source point `7000ms` is `2000ms` after the element's source start. Because the element starts at timeline `1000ms`, the subtitle starts at `1000 + 2000 = 3000ms`.
- The source point `9000ms` maps to timeline `5000ms`.

The resulting subtitle is:

```text
text: "sub2"
from_time_ms: 3000
duration_ms: 2000
```

If the same source range instead starts at timeline `0ms`, the ASR segment maps to `[2000, 4000)`, not `[3000, 5000)`. Always include `T0`; do not infer the answer from the source range alone.

### Example: playback speed

If an ASR segment occupies `[12000, 14000)` in the source, the element's paired source range is `[10000, 16000)`, its timeline start is `30000ms`, and `R = 2`, the subtitle occupies `[31000, 32000)` on the timeline.

For trimming, splitting, and material reuse, calculate intersections separately for every preview element instance. For positional changes caused by movement, transitions, ripple, or absorb, use only the latest preview result. Handle speed-up or slowdown through `R` in the formula.

For a verified contiguous 1x element, the equivalent shortcut is `timeline_time = T0 + source_time - S0`. Use it only after reading back the final structure. Do not use this shortcut when transitions, speed changes, movement, splitting, or reuse change the final paired ranges.

## Trimming into the Middle of a Sentence

A time intersection proves only that part of the speech remains; it does not determine which words should remain:

- If word-level timestamps are available, retain only the words actually audible within the intersection and use their real start and end times.
- If only sentence-level timestamps are available, re-run recognition on the retained range when tool capabilities allow, or segment the sentence again from evidence that can be listened to.
- If the remaining fragment cannot be determined reliably, do not truncate text proportionally by duration and do not complete or retain an entire sentence that is no longer audible. Add it as a manual-review item.

Correct subtitle text only when audio or reliable context supports the recognition correction. Do not polish, rewrite, or invent dialogue.

## Writing Subtitles

Sort subtitles by their final timeline positions before writing. Every item must record the media element ID, subtitle text, intersected source range, and target timeline range. When trimming occurs, a material is reused, or recognition is abnormal, also record the ASR segment ID and a handling note. If a scenario-specific guide requires a more complete pending-subtitle list, follow that guide.

- Create separate `text` elements for consecutive sentences. Each element’s `from_time_ms` and `duration_ms` must cover only the actual speech for that sentence.
- When one utterance spans multiple retained elements, intersect it with each element separately. Write separate text only when the words belonging to each part can be determined.
- If rounding makes adjacent subtitles overlap, tighten them to the true speech boundary. Do not write a segment whose rounded end time is not greater than its start time.
- Prefer reusing an existing ASR subtitle track. If no recognizable dialogue exists, do not create an empty track. Let the applicable scenario guide decide how to display simultaneous speakers.
- Follow the [text editing guide](../edit-text.md), or a more specific scenario guide, for subtitle visual parameters.

## Alignment Checks

After writing, read back the subtitles from this batch and their corresponding media elements, and confirm that:

- the ASR result and final media element refer to the same source/material ID;
- each retained source range equals the intersection of its ASR range and final element source range;
- subtitle text, element ID, and final timing match the pending entry;
- every subtitle lies within `[T0, T1)` of its corresponding preview element and is mapped from the paired `[S0, S1)` using the playback rate;
- there are no duplicate subtitles, unintended overlaps, empty text, or subtitles covering content that was trimmed out;
- the recorded alignment ledger matches the read-back element IDs, source ranges, timeline ranges, and mapping revision.

Then execute the `timeline_review` profile in the [editing quality gate](../edit-quality-gate.md). Do not repeat the general revision, track, and text-parameter checks here. Existing MCP readback can validate only project-parameter relationships; real perceived synchronization must still be checked by playing the edit in the editor.

If later edits trim, split, move, delete, change speed, or modify transitions again, remap and read back only the affected elements from the latest `preview_timeline`. Never guess using a uniform offset.
