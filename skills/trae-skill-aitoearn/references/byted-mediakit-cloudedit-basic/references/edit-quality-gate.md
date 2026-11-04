# MediaKit Edit Editing Quality Gate

## Purpose and Current Boundaries

After a logical editing batch completes, this gate reads back the real Editor state through the current MediaKit Edit MCP and checks the verifiable project structure and parameters affected by the batch. It does not replace checks required by the applicable scenario guide.

The current Editing API provides access only to projects, project materials, preset resources, and one Editor document. An Editor `PUT` fully replaces the document with an optional revision. Current MCP write tools first read the Editor, then atomically write back the full document using the retrieved revision while preserving unknown fields.

This gate does not perform viewer playback, timeline rendering, source-material frame extraction, timeline transcription, or final-file inspection. The current environment may provide separate export and task-query tools, but those tools are outside this Editor project gate. Therefore, this gate can automatically pass only the **Editor project structure**, not final composite pixels, perceived audio quality, or encoded-file quality.

There is currently no general “write result” check: the gate does not separately verify that every add, update, or delete in the batch was persisted. It also does not check Canvas dimensions or background color. Other applicable checks may still read back the existing element state they require.

## Available Tools and Evidence

| Tool | How the gate uses it | What it cannot establish |
| --- | --- | --- |
| `read_project` | Obtain the revision, total project duration, source-material counts, and track directory | `materials` contains only total and per-type counts from the Materials API, not material entries or statuses; contains no viewer; this gate does not check the Canvas |
| `preview_timeline` | Read elements, explicit gaps, revision, and pagination by track and time window | Returns a read-only projection; ordinary same-track overlaps are projected at their midpoint, so it cannot prove that the raw document has no overlaps; does not return material sources, a viewer, or transcripts |
| `inspect_elements` | Read back time, track, material, transform, audio parameters, text style, grading, and transitions in batches using current element IDs | Does not return a revision or prove actual rendered appearance |
| `list_materials` | Obtain material IDs, optionally filtered by `media_types` and `status` arrays | No timeline-usage filter; list items do not include the `status` value itself; call `inspect_materials` to confirm material details in batches |
| `inspect_materials` | Confirm material existence, `status`, duration, dimensions, and allowlisted technical properties | Does not return source imagery, transcript, or rights status |
| `edit_element` / `split_element` / `edit_track` | Repair deterministic local issues; use `validate_only=true` before writing when layout is uncertain | `validate_only` proves only that a request can be submitted, not that it was written; IDs created during validation cannot be reused |

The Studio API may return HTTP 200 for both successful requests and business errors on recognized routes. Through MCP, the client checks the mutually exclusive `data` / `error` envelope and converts business errors into tool failures. Do not bypass the MCP to perform a partial `PUT` directly against the Editor.

## Trigger Timing

| Profile | Trigger | Scope |
| --- | --- | --- |
| `structure_checkpoint` | A batch of structural writes that changes downstream timing has completed, and subtitles, audio, effects, or packaging will be generated next | Affected tracks, from the earliest changed point through the end of the dependent range, plus known dependent elements |
| `timeline_review` | The current logical editing batch is complete, before reporting the result to the user | A final readback proportionate to the risk of the changes |

- Trigger the gate by logical editing batch, not MCP call count. Combine consecutive writes for the same user intent and affected range into one batch.
- Determine editing state from the current editing plan: use `in_progress` while planned video, images, subtitles, or packaging within the range are still missing; use `review_ready` when the agent is ready to deliver the range as the current completed result and no known visual work remains.
- For a change only to one element’s text, volume, style, or position, read back that element and only the necessary adjacent window; do not scan the entire timeline.
- For a fixed-position add, delete, move, or trim, check the affected track and neighboring elements before and after the change point.
- For `ripple`, `absorb`, `tighten_track`, track reordering, or batch speed changes, check from the earliest change point to the end of that track. Check dependent tracks only when cross-track dependent elements are known.
- Fully paginate every relevant track only for full-video assembly, whole-track tightening, or an explicit user request to inspect the entire video.
- Do not trigger the gate when a write fails and project state remains unchanged. If the user explicitly requests step-by-step previews, run it at their requested checkpoints.

## Execution Procedure

1. From the batch editing plan, record affected tracks, time ranges, known dependent elements, and applicable checks. Do not create a general persistence checklist of adds, updates, and deletes.
2. Call `read_project` and record `gate_revision` and the track directory.
3. Call `preview_timeline` for the scope determined above. Pass `pagination.next_offset` as the next request's `offset` until the target range is complete. Its revision must equal `gate_revision`.
4. Call `inspect_elements` only for existing target elements and known dependent IDs required by applicable checks, with at most 100 per batch; split larger sets into batches.
5. Collect material IDs newly referenced or replaced in the batch, plus those needed to verify
   trimmed video/audio duration. Call `inspect_materials` with `material_ids` arrays of up to 100 IDs.
   Match `materials[]` entries by `id` and reuse each result for its referencing elements.
   `missing_material_ids` identifies unresolved materials: their checks cannot pass, but valid
   results remain usable and do not need to be queried again merely because another ID is missing.
6. Call `read_project` again. If its revision differs from `gate_revision`, the project changed during gate readback. Rerun the gate once from the latest revision. If it changes again, return `blocked`, report concurrent editing, and do not combine evidence from different revisions.
7. Run each applicable check. If a hard check fails, repair only the relevant element, track, or time window, then rerun the gate for the invalidated scope. Do not automatically repair visual-coverage warnings.

## Automatically Executable Checks

| Code | Pass condition | Tool evidence | Failure handling |
| --- | --- | --- | --- |
| `REVISION_UNSTABLE` | Both `read_project.revision` values and `preview_timeline.revision` are equal | `read_project`, `preview_timeline` | Retry once from the latest revision; if it changes again, stop and report concurrent editing |
| `TRACK_STATE_INVALID` | The main video track, track order, and track types satisfy current structural constraints; tracks represent actual non-empty tracks | `read_project.tracks`; `edit_track` with `actions: [{"action":"list_tracks"}]` if needed | Restore the relevant track action; do not infer a general write result from element counts |
| `AFFECTED_WINDOW_INVALID` | The target window is fully readable, contains no `PREVIEW_OVERLAP_UNRESOLVABLE`, and orders adjacent elements according to plan | Target `preview_timeline` window and pagination | Repair ordering or abnormal nested overlap; do not treat the read-only projection as proof that the raw document has no overlaps |
| `VISUAL_COVERAGE_WARNING` | Emit a weak warning for a global visual-coverage hole in the affected visual window, distinguishing `in_progress` from `review_ready` | Fully paginated `preview_timeline` without `tracks` or `elements` filters; current batch editing plan | Do not block or auto-repair. If the agent confirms the hole is an intermediate area awaiting content or intentional black/blank space, mark it `acknowledged` and continue |
| `MATERIAL_UNRESOLVED` | Every newly or newly-referenced material can be read exactly, has `status=complete`, and matches the element type | `inspect_materials`; material IDs from `list_materials` | Wait for completion, use a valid material, or stop and explain the gap |
| `SOURCE_RANGE_INVALID` | For trimmed video/audio, `source_start_ms >= 0`, `source_end_ms > source_start_ms`, and the end does not exceed the matching `inspect_materials.materials[].duration_ms`; display duration and `playback_rate` for all changed media are valid positive values | `inspect_elements`, `inspect_materials` | Adjust source in-point, duration, or speed and check again |
| `DEPENDENT_TIME_STATE_INVALID` | Known dependent elements still satisfy planned time relationships, such as subtitle ranges, audio boundaries, or effect coverage windows | `inspect_elements`; dependency IDs and relationships from the batch plan | Reorder only identified dependent elements; the MCP cannot discover semantic dependencies automatically |
| `TEXT_STATE_INVALID` | Actual values for changed text—including content, time, font, size, color, bold, alignment, animation, and transform—match the request | Root `content`, `offset_x`, and `offset_y`; `inspect_elements.elements[].text_style`; and transform fields | Correct divergent fields and read them back again |
| `AUDIO_STATE_INVALID` | Time, `volume`, `muted`, fades, and `playback_rate` of changed audio/video elements match the request; if the plan defines a video end, known audio does not extend beyond it | `inspect_elements`, `preview_timeline` | Correct time or audio parameters; do not infer loudness or perceived quality |
| `TRANSITION_STATE_INVALID` | Planned adjacent main-track boundaries have the correct outgoing/incoming IDs, resource ID, and duration; boundaries that need no transition have none | `preview_timeline.tracks[].elements[].has_transition`, `inspect_elements.elements[].transition` | Repair only the relevant main-track boundary |

Execute only checks relevant to the current batch. The gate does not require discovering or changing unrelated elements merely to fill a checklist.

### Determining Timeline Gaps

`preview_timeline` returns gaps per track. An empty interval on one track does not mean other visual tracks have no image, so never report a single-track gap as a “black frame” or “possible black frame.”

Run `VISUAL_COVERAGE_WARNING` when the batch changes visual structure and a visual review window can be identified:

1. Call `preview_timeline` for the window without `tracks` or `elements` filters, and follow `next_offset` through every page.
2. Collect `timeline_range` for every item on every track where `kind=item` and `type != audio`, then take the union of those intervals. Do not directly merge per-track gap records.
3. Subtract that union from the review window. Only the remaining intervals are “global visual-coverage holes.” Do not infer the review window automatically from project `duration_ms`, because audio or effects may outlast the main visual content.
4. Determine whether the range is `in_progress` or `review_ready` from the current editing plan. Do not assume editing is finished merely because the gate is running.
5. `in_progress`: if a later step will add imagery, subtitles, or packaging, the agent may confirm the hole as an intermediate editing state, record why it remains, mark it `acknowledged`, and continue editing.
6. `review_ready`: record `warning` by default. The agent may still confirm intentional black or blank space from an explicit user request, an approved editing plan, or a black/blank interval deliberately arranged by the agent in this batch; record the reason and mark it `acknowledged`.

The agent’s judgment must come from current user intent or an established editing plan. Never claim “intentional black” without evidence merely to pass the gate. Neither `warning` nor `acknowledged` blocks the gate, and neither should trigger automatic filling.

A visual-coverage warning never changes overall status to `needs_repair` or `blocked`. It proves only that the interval structurally contains no non-audio element. It does not inspect the Canvas and is not pixel evidence; it cannot detect black frames inside a visual element, decoding failure, transparent elements, or elements outside the Canvas.

## Items Currently Requiring Editor Review

The existing MCP and Editing API cannot automatically verify the following, so do not mark them automatically as `passed`:

- final composite pixels, black frames within visual elements, subject integrity after cropping, actual layer occlusion, or subtitle safe areas;
- cut-off actions, jump-cut quality, visual repetition, actual transition appearance, or scene continuity;
- dialogue clarity, BGM masking speech, clipping, background noise, unintended silence, loudness, or actual audio/video synchronization;
- copy accuracy, material copyright, or reference-footage usage rights unless the current task provides explicit external evidence;
- exported-file decoding, resolution, frame rate, audio/video stream coverage, or file integrity, unless the current environment provides a tool that directly verifies those properties and returns reliable evidence. Export submission or task completion alone does not verify them.

When a batch affects visuals, text, audio, or transitions, include the corresponding `manual_review` item in the result and ask the user to play the edit in the editor. Do not present `manual_review` as automated evidence that already ran.

## Status and Output

- `passed`: all applicable hard checks for the batch passed. Non-blocking `warning` or `acknowledged` items may also be present. This means only that the Editor project gate passed.
- `needs_repair`: at least one automated check failed and can be repaired locally.
- `blocked`: materials, permissions, or a stable revision are unavailable, so consistent evidence cannot be formed.

```json
{
  "scope": "editor_structure",
  "profile": "timeline_review",
  "edit_state": "in_progress",
  "project_revision": 12,
  "status": "passed",
  "checked_range": {
    "track_ids": ["video-track-id"],
    "from_time_ms": 4000,
    "to_time_ms": 9000
  },
  "checks": [
    {
      "code": "AFFECTED_WINDOW_INVALID",
      "status": "passed"
    }
  ],
  "warnings": [
    {
      "code": "VISUAL_COVERAGE_WARNING",
      "status": "acknowledged",
      "from_time_ms": 6200,
      "to_time_ms": 6500,
      "reason": "A title card will be added during the later packaging stage"
    }
  ],
  "manual_review": [
    "Play 4–9 seconds in the editor and confirm the actual cut and transition appearance"
  ]
}
```

When reporting to the user, state the actual checked scope, any failures or repairs, and the visual or audio qualities that still require confirmation in the editor. Do not describe an `editor_structure` pass as passing final-video quality.
