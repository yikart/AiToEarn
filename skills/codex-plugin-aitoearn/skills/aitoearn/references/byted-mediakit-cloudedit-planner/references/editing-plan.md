# Editing Plan Mechanics

## Scope

Choose structure and treatments from the user's goal and source content, without imposing a fixed template.

When working with an existing project, read its current timeline and identify whether the request calls for appending content, replacing a sequence, or modifying specific clips. Derive the affected range and tracks from the request and project context. Preserve unrelated content; clarify only if the target or scope remains ambiguous. Account for ripple changes to later clips and synchronized audio or subtitles before applying a duration change.

Identify whether the output is one sequence, several independent cuts, or alternative versions. Maintain separate placements, duration budgets, and checks for independent deliverables; concatenate only when a montage is requested. For a local revision, reuse the established plan and inspect the affected sources and neighboring boundaries instead of restarting full-source selection.

## Preserve the Editorial Idea

Carry the source-backed editorial idea from the main skill into concrete selections and placements. Use these mechanics to check feasibility, not to decide a finished structure in advance. Presentation order does not establish event chronology or causal relationships.

## Select Material and Fill Evidence Gaps

Check whether each candidate serves the goal, communicates clearly, and preserves necessary meaning or action results at its cut points. Request further understanding only for unresolved questions: semantic and audio boundaries for dialogue, steps and state changes for processes, or direction, framing, and subject position for visual connections.

Reuse adequate descriptions, transcripts, or precise user-supplied ranges. Request only evidence needed for a decision, without requiring a fixed set of fields or numerical confidence scores.

Distinguish redundant content, multiple views of the same event, and purposeful repetition. Remove repetition only when it adds no information and serves no purpose. Reuse is valid for recap, comparison, callbacks, or replay. Matching filenames or people alone do not establish duplication.

## Arrange and Treat the Material

- Allocate duration according to content and the user's target. Preserve complete meaning in dialogue and key steps in operations; allow enough time to read and view images. Do not truncate content to fit arbitrary shot lengths.
- Make adjacent clips connect through information, visuals, or sound. A hard cut is usually sufficient; use transitions for a clear purpose, allow the required source handles, and account for overlap in total duration.
- Use speed changes, freezes, and cropping for a specific expressive purpose. Check their effect on action comprehension, sound, and key information. Keep source time separate from timeline time.
- Preserve informative dialogue and source sound. When music is supplied or requested, balance it against important audio. Music is optional, and the edit need not match a whole track's length.
- Add subtitles or text only when requested or needed for communication. Follow [Subtitle Timing and Display Units](subtitle-timing.md): reuse verified text, map it to edited occurrences, and fill only missing or unreliable evidence. A summary is not a verbatim transcript. Do not present summary titles as quotations. Create no subtitle track when text is unnecessary.
- Orient the audience at the opening and end in a way that serves the goal.

## Resolve Duration Conflicts

Distinguish a strict duration limit from an approximate target. If the edit is too long, first remove expendable waits and redundancy while preserving intentional pauses and purposeful repetition. Then omit lower-priority complete units, checking that remaining statements, steps, and outcomes still make sense. Preserve user-required content, order, and ranges.

Use faster playback only when it serves the content and remains intelligible. If required material still exceeds a strict limit, explain the conflict and identify the constraint that would need to change. Give an exact feasible duration only when source ranges, playback speeds, and overlaps are established. Otherwise provide an estimate or range with its assumptions, and identify missing timing evidence; do not claim a proven minimum. Ask which requirement can yield before executing an incompatible edit. For a plan-only request, present the conflict and feasible alternatives. If the material is shorter than the target, avoid padding with unsupported content or arbitrary repetition; report the achievable duration when meaningful holds or pacing adjustments are insufficient.

## Map Sources to the Timeline

Use a concise list or table with each selected source, its source in/out range or image hold duration, its sequence or timeline placement, and any necessary treatment. For an existing project, identify the affected clips or sequence and the intended operation. Add fields only when needed to execute the edit; no fixed schema is required.

For a simple sequence, order and resulting clip durations may be enough. When speed changes, overlaps, replay, or synchronization affect placement, state timeline start/end positions and distinguish them from source times. At constant speed, playback duration is source duration divided by the speed multiplier; add holds and account for actual transition overlaps. Derive total duration from the timeline's end, rather than summing concurrent audio, video, and text tracks.

For example, source `action.mp4` at 10–14 seconds plays for 4 seconds at 1x. Replaying the same range at 0.5x adds 8 seconds: with no gap or overlap, the two timeline placements are 0–4 and 4–12 seconds. Align any retained audio or captions with their respective edited occurrences, not with the original source timestamps.

## Plan and Acceptance Checks

Let the material guide unspecified minor choices, and explain choices that materially affect the result. Ask the user only when a critical gap prevents a decision.

Before delivering a plan, check that:

- Selection and structure serve the goal and preserve specified order, ranges, and audio requirements.
- Selected content is supported by evidence; content, chronology, and outcomes have not been invented.
- Timeline placement accounts for speed changes, image holds, and transition overlaps; duration conflicts, required resources, and gaps are explicit.

After execution, also check that:

- Actual project clips, order, and duration match the plan.
- Changes stay within the intended scope; unrelated content is preserved and affected downstream clips, audio, and subtitles remain correctly placed.
- There are no accidental gaps, black frames, out-of-bounds trims, truncated dialogue, competing audio, or misaligned subtitles; intentional pauses, silence, black frames, and reuse remain intact.
- Subtitles, music, and effects that were used have been verified. Unused treatments introduce no extra production or validation requirements.

After a correction, verify the changed values and dependent boundaries, not every unrelated source. Selection, order, or duration changes may require broader content and synchronization checks; a style-only change does not. If a write failed or a readback value differs, inspect current elements and IDs before retrying to avoid duplicate additions. Treat unconfirmed writes and unpreviewed audiovisual behavior as incomplete verification.
