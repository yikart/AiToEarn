# Subtitle Timing and Display Units

Use this reference only when subtitles or transcript-based text are requested or needed. It defines text reuse, time mapping, and overlapping speech; scenario styling remains in the selected recipe. Do not create a track when subtitles are excluded.

## Reuse Text Before Requesting ASR

Keep verified source utterances with their speaker, exact text, original start/end, and verification provenance. Reuse corrected captions or transcripts when they cover the selected audible ranges. A tool summary, OCR, or an unverified ASR guess is not verified dialogue.

Map each retained occurrence to the planned timeline. With constant speed `r`, source trim start `s0`, and timeline start `t0`, a source instant `s` maps to `t0 + (s - s0) / r`. Split mapping across different speed intervals. Replays require distinct timeline occurrences; source time alone cannot identify which one is being captioned. Clip, overlap, and audibility boundaries may affect the retained utterance range. Do not silently drop spoken words when a trim intersects them.

Obtain ASR or focused alignment only for missing text, unreliable boundaries, changed audible content, or a transformation that cannot be mapped reliably. Planning can use source evidence without writing an assembled project first. After execution, check the actual audible intervals and update affected mappings. New full-film ASR is not a prerequisite for verifying reliable reused captions.

## Separate Utterances from Display Units

An **utterance** is a verified spoken sentence or clause with its own speaker, text, and audible interval. Keep consecutive sentences distinct even when they belong to one speaker or one ASR result.

A **display unit** is one subtitle element showing the active utterance or utterances during one interval. Ordinary nonoverlapping speech uses one unit per retained utterance. Automatic line wrapping does not create a new timing unit. For overlapping speech, one utterance can map to several display units and one unit can contain several utterances.

Build overlapping units from the sorted unique start/end times of the retained utterances. For each interval, show only the utterances audible in that interval, one readable line per speaker where needed. Preserve their verified text; splitting display time does not authorize splitting words at invented word-level timings. Keep a stable speaker order. Omit intervals with no active speech and do not merge different consecutive sentences into one long caption.

Example, already on the final timeline:

| Source utterance | Audible interval | Text |
| --- | --- | --- |
| A | 0–3 s | Wait here. |
| B | 2–4 s | I will return. |
| C | 4–5 s | All right. |

| Display unit | Interval | Active text | Utterance links |
| --- | --- | --- | --- |
| U1 | 0–2 s | Wait here. | A |
| U2 | 2–3 s | Wait here. / I will return. (separate lines) | A, B |
| U3 | 3–4 s | I will return. | B |
| U4 | 4–5 s | All right. | C |

The units do not overlap; A and B each remain visible over exactly their own full audible interval. Repeated text across adjacent units maintains an ongoing utterance, rather than duplicating dialogue or merging sequential sentences. If two utterances have exactly the same interval, one multiline unit is sufficient. If simultaneous text cannot remain readable, report the layout/content conflict or use an authorized alternative; do not silently omit a speaker or extend text outside its audible interval.

## Handoff and Readback

Maintain an utterance list and a display-unit list. Each unit records its utterance IDs, text lines, timeline interval, and eventual element ID. This mapping may be many-to-many for overlaps and repeated source occurrences; do not require one element ID per source clause in those cases.

Validate that:

- Every retained audible utterance is covered by the union of its linked units, with no missing or extra interval.
- Every displayed line has verified text and an active utterance during that unit; omitted speech has an explicit supported reason.
- Consecutive utterances remain distinct; simultaneous lines and continuing text across units use the overlap exception above.
- Units are ordered and nonoverlapping within the subtitle track. Reuse an existing track in the affected range; no empty track is created for absent speech.
- Actual element IDs, text, timing, and requested style match the unit list. Correct only mismatched units and their dependencies, then read back and check the affected audible range.

Subtitle text/timing verification does not imply final visual legibility or actual project writes. State which checks remain planned or unavailable.
