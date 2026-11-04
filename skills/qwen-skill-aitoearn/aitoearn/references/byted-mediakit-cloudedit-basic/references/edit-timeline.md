## Timeline

The timeline displays media playback order and ranges along linear time, while its Z-axis track stacking represents masking relationships.

- **Never predict the post-operation timeline from descriptions of how transitions, speed changes, `absorb`, or similar operations affect it. Operate only on the logical timeline returned by `preview_timeline`. Elements on the same logical track must not overlap.**

## Timeline Queries and Recovery

Use the current `preview_timeline` schema to select the intended scope. Follow the returned
`pagination.next_offset` as the next request's `offset`, keeping the same scope; its absence ends
that query. A page contains only the entries selected by its filters, time range, and offset, so an
empty page alone cannot establish that the project is empty.

If a query fails or expected content is missing:

1. Inspect the actual submitted arguments and any tool error. Correct the identified fields before
   retrying. Obtain current track IDs from `read_project` and placed element IDs from `preview_timeline`.
2. If the empty result remains unexplained, make one baseline query with `elements`, `tracks`,
   `track_type`, `from_time`, and `to_time` omitted and `offset: 0`. Follow pagination as needed to
   locate the expected content; it may be on a later page.
3. If the baseline still contradicts expectations, compare the project ID, revision, duration, and
   track directory with `read_project`. Report the remaining discrepancy rather than repeating the
   same query without new evidence.

## Track Types

A track must contain elements. When `edit_element` does not receive a `track_id`, it automatically finds the nearest suitable track by default. Use `create_new_track=true` to force creation of a new track.

The track with `order=0` is the “main track.” Only a video track can be the main track. The main track supports transitions; other tracks do not.

## Track Order

A well-formed track order ensures correct video stacking and masking relationships.

Track order is read from the highest numeric `order` down to `order=0`. By default, track types in that direction must be arranged as audio → effect → text → video. Therefore, whenever the timeline contains video tracks, `order=0` must remain a video track and serves as the main track.
Tracks of the same type must remain contiguous and must not be interleaved with other track types.
Change this default grouping only when the task explicitly specifies a special layer stack, mask, or parent-child relationship. When changing it, prioritize the requested rendering and masking relationship without moving a non-video track to `order=0`.

## Timeline Alignment

When aligning different tracks, use each element’s `timeline_range.from_time` and `timeline_range.end_time` from `preview_timeline`, in milliseconds. **`preview_timeline` is the sole time reference for alignment. Never calculate the structural effects of transitions, speed changes, `absorb`, or similar operations to align elements.**

For `split_element`, pass `splits` as an array of objects containing `id` and an `at_time_ms` array. Even a single cut uses an array, such as `{"id":"element-id","at_time_ms":[6000]}`. Cut points are absolute timeline integer milliseconds, strictly inside the element's range, not offsets from the element or source start.

## Edit Receipts

The `adds`, `deletes`, and `updates` fields returned by `edit_element` report operation receipts. Added items include their final track and millisecond timing. `deletes` may also include automatically removed transitions marked `implicit: true`; indirect ripple/absorb movements are not listed separately.
For updated items, `updated` contains the fields actually processed. Confirm indirect movements and automatic transition maintenance by reading the timeline back.
Reuse newly generated IDs from an `edit_element` receipt only when `committed: true`.
Obtain a new track ID from `adds[].track_id` or `updates[].updated.track_id` in that committed receipt.
With `validate_only: true`, the receipt has `committed: false`: `created_new_track` describes a plan,
and newly generated element and track IDs are temporary. Submit the edit before reading back its
result with `preview_timeline`; use the actual commit's IDs, which may differ from the preview.
