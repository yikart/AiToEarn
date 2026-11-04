# Sampling and time mapping

## Start with coverage

For an ordinary visual overview, approximately 24–48 frames across the requested interval is a starting budget, not an accuracy guarantee. Let duration and the question determine the interval. Short action clips need closer samples; long, mostly static footage can start sparsely. A request for all shots or every occurrence requires systematic coverage and refinement, not a capped overview presented as exhaustive.

With uniform interval I over duration D, reserve about `ceil(D / I) + 1` tile positions, accounting for endpoint behavior. With R rows and C columns, allocate at least `ceil(estimated_frames / (R * C))` sheets. In sprite mode, `snapshot_limit` counts sheets, not tiles. Check the actual returned coverage; the estimate alone does not prove that the ending was sampled. Obtain the last frame separately if needed.

Prefer readable sheets of about 4x4 tiles. Split larger batches rather than squeezing text and faces into one huge image. The service suggests sprite edges no larger than 16384 pixels, but being below that limit does not guarantee readability by the understanding model. Use independent images at source-appropriate resolution for small text or detailed poses.

For long sources, first map the whole requested range, then inspect relevant sections. For complete analysis, work through all sections in manageable batches. Reuse evidence instead of extracting the same frames for multiple questions.

## Keep time honest

- Prefer returned frame times or labels. Only calculate times after confirming the start, interval and layout order; do not assume blank padding tiles represent extra frames.
- Scene-change samples are nonuniform. Never calculate their times from tile indices and a fixed interval.
- For locally decoded media, retain actual frame presentation timestamps, especially for variable frame rate footage. Requested seek times are not automatically exact decoded-frame times.
- For a clip beginning at source time S, map clip-relative time t back to S+t; preserve any additional documented timing transformation or audio offset.
- If reliable mapping is unavailable, cite image/tile positions and say that source timing is unknown.

## Refine and stop

Around a relevant event, obtain before/during/after samples and narrow the interval only as needed. Inspect individual frames when exact visible state changes matter. For sound, analyze the corresponding audio interval; model timestamps and ASR segment boundaries remain estimates unless independently localized.

When estimating synchronization, carry the uncertainty of both event times into the comparison. If that uncertainty is larger than the discrepancy the user asks about, the evidence cannot establish synchronization or desynchronization. Do not substitute a video-model summary for this missing precision.

Stop once sufficient evidence supports the requested conclusion. Report remaining gaps rather than repeatedly increasing resolution or launching whole-video understanding. No fixed frame budget guarantees completeness, and no speed improvement is claimed without measuring a comparable task.
