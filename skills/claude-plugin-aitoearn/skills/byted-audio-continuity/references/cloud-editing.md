# Cloud audio continuity

Use the current project's clip volume and fade controls. This workflow does not require a dedicated audio-smoothing tool. Check the documented controls and time units before applying edits; if they cannot express the needed adjustment, report that limitation.

Keep source ranges, clip positions, playback rates, existing overlaps, and all picture edits unchanged. If an audio-only adjustment cannot solve the issue, leave it unresolved rather than changing the edit.

## Balance overlapping sound

Follow the scene priorities in the main skill. Adjust source audio and BGM levels over the affected section using the available volume controls. Keep continuous BGM running across picture cuts unless the music itself needs a change; do not fade it at every source-clip boundary.

## Fade the two sides of a cut

Identify the problem before choosing fade duration:

- For a short click at a fixed join, try a brief in-place gain fade. A few milliseconds can be a starting experiment if the controls support that precision; check both click reduction and any new volume dip.
- For an abrupt ambience or sustained-sound change, consider a longer envelope only when the resulting level change suits the content. Do not use a long fade merely because the edit is in a cloud project.
- Near speech or distinct actions, preserve words, onsets, and transients. Shorten or omit treatment if it weakens wanted sound.

Check the tool's minimum duration and time resolution. If its shortest supported fade is too coarse for the problem, leave that boundary unresolved rather than applying a damaging fade.

For a boundary that benefits from two-sided fades:

1. Apply a volume fade-out within the end of the outgoing clip, from its intended level toward silence.
2. Apply a volume fade-in within the start of the incoming clip, from silence to its intended level.
3. Choose each duration and curve for the diagnosed problem, content, and supported controls. The two durations need not match; there is no universal duration range.

These are independent volume envelopes inside the existing clip ranges. Keep the cut position, clip lengths, total duration, and synchronization unchanged; no source overlap or additional handles are required.

Preserve existing suitable fades, locked or muted content, and intentional hard stops. Do not stack fades. If a clip is too short or treatment would weaken a wanted word or transient, shorten the fade or leave that boundary untreated. Keep combined fade lengths within the clip. Treat only the audible side when the other side is silent.

## Check the result

Confirm the applied levels and fade durations. Listen across the cut with BGM and other overlapping sound when playback is available; check for lost words, distracting volume dips, and an appropriate source-to-BGM balance. Adjust the treatment if needed. If playback is unavailable, report structural checks separately from unverified listening quality.

Keep the cloud project editable and continue the ongoing edit. Do not switch to local rendering merely because a dedicated smoothing tool is absent.
