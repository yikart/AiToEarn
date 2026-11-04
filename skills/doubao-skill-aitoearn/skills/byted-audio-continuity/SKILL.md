---
name: byted-audio-continuity
description: >-
  Check and repair audio continuity after trimming, splitting, reordering,
  or retiming audible clips, when cuts produce clicks, abrupt noise changes,
  or distracting gaps, or when source audio overlaps background music and
  needs balancing. Use for affected audio boundaries even when smoothing
  was not explicitly requested. Use the cloud editing controls exposed by
  the current project environment. Skip visual-only changes with unchanged
  audio. Does not cover general denoising, music selection,
  source separation, or visual transitions.
requiredTools:
  - inspect_elements
  - edit_element
  - preview_timeline
---

## Environment

This agent exposes MediaKit through MCP/REST tools only. `mediakit-cli` is not available. Ignore any CLI fallback or installation instructions in this skill and its references; if a capability is unavailable, report the gap instead of running a terminal command.

# Audio Continuity

Keep sound natural across edited boundaries and balance source audio against background music according to the scene. Preserve the intended pacing, words, synchronization, and deliberate silence. Inspection can lead to no change.

## Preserve the edit

Change audio levels and envelopes only. Keep every picture frame, cut position, clip order, source in/out range, timeline position, playback rate, gap, and total duration unchanged. Preserve audio event timing and channel layout. This applies even when a structural change would be difficult to notice.

Do not move a cut to a zero crossing, extend into source handles, introduce a J/L cut, overlap previously adjacent clips, stretch audio, or pad/trim the result to conceal a timing change. Do not generate or insert replacement sound. A crossfade is allowed only within an overlap already present in the edit, with both source mappings unchanged.

If smoothing would weaken a wanted word, transient, or intentional pause, shorten or omit the treatment and report what remains. Audio-only processing can still affect meaning and emphasis; preserving the picture alone is not sufficient.

## Choose the execution path

Use the cloud editing tools that own the current project. Do not switch to local FFmpeg rendering.

Read [cloud-editing.md](references/cloud-editing.md).

## Inspect the affected sound

Work from the latest cut structure. Identify the changed clips, their audible neighbors, and any exposed start or end created by the edit. Include sound attached to video, separate dialogue, music, and ambience only where the change affects them. Also inspect sections where source audio and background music overlap after placement or level changes. A visual cut over continuous, unchanged audio needs no boundary treatment.

Inspect existing fades, automation, transitions, track roles, locks, mutes, source ranges, playback rates. Listen around each candidate boundary in the combined mix when playback is available. Distinguish a waveform discontinuity from a change of speaker, background noise, intentional stop, or deliberate gap. A waveform measurement alone cannot establish perceptual quality.

## Balance source audio and background music

When a clip's sound overlaps background music, identify which should lead in that section based on the brief, the scene, and what the viewer needs to hear. Listen to the combined mix when playback is available; gain settings alone do not establish relative loudness.

- When dialogue, narration, a demonstration sound, or meaningful ambience carries the scene, keep it clear and reduce the competing BGM as needed.
- When music carries a montage or mood-led passage, let the BGM lead and reduce distracting source sound. Retain useful scene details at a supporting level; mute source sound only when it has no intended role.
- When their roles change within a clip, adjust levels over the relevant intervals and make the changes gradual enough to avoid distracting pumping. Restore the intended balance after the foreground event.
- If the source already contains music, check whether it competes with the project BGM. Keep the music bed that serves the scene. Do not mute wanted speech mixed with unwanted music. If gain adjustments cannot produce a suitable balance because wanted and unwanted components are mixed, follow relevant asset-preparation guidance to assess separation within the agreed task. Separation is outside this continuity pass; preserve the current edit and resume balance and boundary checks after suitable material is available. Do not add an approval checkpoint when existing authorization already covers the treatment.

Use the available clip gain, volume automation, or ducking controls. Do not apply a fixed source-to-BGM ratio across all scenes. Check intelligibility, useful ambience, musical impact, and combined peaks; avoid raising the foreground so far that the mix clips. Judge balance across the overlap, not just at its boundaries, and preserve unrelated sections of the BGM.

## Choose the smallest useful treatment

| Condition | Treatment |
| --- | --- |
| Boundary already sounds natural or has a suitable transition | Keep it; do not stack another fade. |
| Click at a hard join or exposed edge | Try a brief in-place gain fade; keep words and transients intact. |
| Abrupt ambience or noise-floor change | Adjust gain within the existing ranges; shape an overlap only if it already exists. Leave unresolved changes rather than moving a cut. |
| Intentional impact, music stop, or silence | Preserve it unless the request calls for changing it. |
| Wanted speech would be attenuated or overlapped | Use a shorter treatment, leave the boundary unchanged, or report the unresolved issue. |

Choose duration and curve for the content, following the selected environment reference. Keep fade regions within existing clip ranges and their combined extent within each clip. Do not use normalization or limiting to conceal an unsuitable mix or transition.

## Apply and verify

Apply changes after the affected cut structure is settled. Prefer editable parameters in an editable project. Keep sources recoverable and record affected clip identifiers or file paths, boundary times, and treatment settings so a repeated pass does not compound processing.

Check the resulting boundaries and the surrounding mix. Verify duration, alignment, audible words, intentional transients, source-to-BGM balance, level changes, and the absence of new clicks or distracting dips. Compare the protected edit state before and after. If any protected timing or content changed, discard the candidate and rebuild from the original. Recheck affected boundaries and mix intervals after subsequent changes.

If playback is unavailable, verify structure and measurable signal properties where possible, and leave perceptual quality explicitly unverified. If suitable audio controls are unavailable, report the specific limitation rather than applying an unrelated workaround.

Return the updated project or media reference, affected boundaries, checks performed, and unresolved issues to the ongoing editing task. Continue the agreed workflow; this local repair does not imply a separate export or a new approval checkpoint.
