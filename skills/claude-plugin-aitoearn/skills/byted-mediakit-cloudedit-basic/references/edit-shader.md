# MediaKit Edit Shaders

Use `list_resources` to obtain the exact `items[].id` of a Shader available to the project, then pass it as `resource_id`.

`list_resources` is the sole source of truth for built-in effects, built-in transitions, and project effect/transition resources. Built-in resources use stable global resource IDs rather than project material IDs, so they do not appear in `list_materials`.

Recommended catalog-browsing patterns:

```text
list_resources(resource_types: ["effect"])
list_resources(resource_types: ["effect"], offset: 10, limit: 10)
list_resources(resource_types: ["lut"])
```

Resource categories use the same names as element types: `effect` for effects and `lut` for filters. After querying filters, copy the returned resource ID unchanged into a `type: "lut"` element in `edit_element`:

```text
list_resources(resource_types: ["lut"])
edit_element(adds: [{"type": "lut", "resource_id": "<lut-resource-id>", "from_time_ms": 0, "duration_ms": 3000}])
```

## Effect Elements and Tracks

Effect elements include effects and filters. Effects provide visual changes such as repeated-picture grids and mirroring; filters provide complete color-grading presets. Effects and filters can be placed only on effect tracks, and every element has an explicit time range.

An effect element processes the final composited picture from all tracks during its own time range, including text and other overlays. It does not follow the upper/lower masking relationship of ordinary video tracks. Use `flip_x`/`flip_y` for flipping a single element. For multiple materials in separate screen regions, arrange the individual video elements by position and size; repeated-picture effects duplicate the composite rather than assign different materials to different regions.

## Transitions and Tracks

All examples in this section use the midpoint timeline returned by `preview_timeline`. `*` means the preceding element has an outgoing transition; `->` means an ordinary hard cut:

```text
A(0,200) * B(200,300) -> C(300,400)
```

Adding a transition between elements overlaps the tail of the outgoing time with the head of the incoming time.

A transition can connect only two chronologically adjacent `video` or `image` elements on the main video track. Adjacent means no other element lies between them. Add or replace it through `edit_element.adds` with `type: "transition"`, `resource_id` from the transition catalog, `outgoing_element_id`, `incoming_element_id`, and a positive integer `duration_ms`; both clips’ timeline durations must be at least as long as the transition. Do not use `updates` for transitions or provide track/position fields on a transition Add.

Do not construct the overlap manually. `edit_element` adjusts the incoming element and its successor chain to produce an overlap of the requested duration. Adding a transition to an ordinary hard cut shortens the total preview duration by one transition duration. The tool validates only the clips’ current timeline durations; it does not check for unused source headroom or tailroom and does not extend `trim` automatically.

After adding, replacing, or deleting a transition, call `preview_timeline` again. Never calculate the new timeline yourself.

**The time basis returned by `preview_timeline` is your sole operational foundation. You do not need to account for the transition overlap itself; the tool returns the most appropriate timeline and supports operations against that returned timeline.**

### Transition Read Semantics

The project stores overlapping time intervals. `preview_timeline` projects those overlaps into an end-to-end midpoint timeline and projects `source_range` consistently with `playback_rate`. **Base all later movement, trimming, and speed changes on this midpoint timeline.**

`inspect_elements` returns the stored overlapping time, full source range, and transition parameters. Do not use its stored intervals directly as midpoint trim times.

### Preserving Transitions After Editing

During a structural edit, `edit_element` first converts all existing transitions into midpoint hard cuts, performs the batch edit, and then restores transitions against the final timeline.

An existing transition is preserved or rebound only when all of the following are true:

- The original outgoing element still exists and remains on the main video track.
- The original outgoing element and its final successor are both `video` or `image`.
- The final midpoint timeline strictly satisfies `outgoing.end == incoming.start`.
- The original visible duration of both clips is at least the original transition duration.
- The batch did not explicitly delete or replace the transition on that outgoing element.

The incoming element may change. As long as the original outgoing element ends with an eligible adjacent successor, its original transition binds to that successor:

```text
Original timeline: A(0,200) * B(200,300) -> C(300,400)

1. Shorten A by 100ms and close successors with absorb; transition is preserved
A(0,100) * B(100,200) -> C(200,300)

2. Shorten A by 100ms without closing the gap; transition disappears implicitly
A(0,100) -> Gap(100,200) -> B(200,300) -> C(300,400)

3. Swap B and C; original transition rebinds between A and C
A(0,200) * C(200,300) -> B(300,400)

4. Insert D between A and B and reorder successors; original transition rebinds between A and D
A(0,200) * D(200,300) -> B(300,400) -> C(400,500)
```

If the elements remain strictly adjacent but either clip is shorter than the original transition duration, the entire batch fails and rolls back; the transition is not silently deleted.

### Implicit Disappearance and Explicit Deletion

When movement or trimming creates a Gap, the transition disappears implicitly. The midpoint hard-cut timing remains, and the full overlap time previously occupied by the transition is not restored.

Explicitly delete a transition with:

```text
edit_element(deletes: [{"id": "<outgoing-element-id>", "transition": true}])
```

Explicit deletion removes the transition from the outgoing element and shifts the incoming element and its successor chain right by the original overlap duration. Implicit disappearance and explicit deletion produce different timelines, so read `preview_timeline` again after either operation.

To delete an entire element, omit `transition`; never pass `transition: false`. Tool-call examples here show operation arguments; include `project_id` when required by the current schema.

Simple trimming or speed changes can be edited directly, using `absorb` as needed to preserve midpoint adjacency. For complex rearrangement, use the sequence “explicitly delete transition → read timeline again → edit elements → read timeline again → add transition.”

`split_element` does not preserve transitions before or after the split element. To restore them, record the transition parameters first, complete the split, and add them again using the new element IDs.

### Reserving Source-Material Headroom

By default, adding a transition consumes already displayed content on both sides and shortens the timeline. If the user wants to preserve the original cut points and content, first confirm that both materials have enough headroom. Then make room from the back of the timeline toward the front and extend the outgoing tail and incoming head. Each side normally needs half the transition duration. For example, if A plays for 300ms and B for 400ms, a 100ms transition requires 50ms of extra tail on A and 50ms of extra head on B. In special cases, reserve more or less on either side as needed to satisfy the 100ms transition and the user’s intent.

Throughout the process, operate only on the logical timeline returned by `preview_timeline` and keep same-track elements from overlapping. The MCP creates the actual overlap required by the transition. An existing transition is preserved automatically when the two edited segments remain adjacent and long enough; add a transition again only when creating or replacing it.

Run validation before committing the edit, then read the timeline again after completion. If there is insufficient source headroom, shorten the transition or keep the hard cut.

### Default Decision

When the user gives no explicit direction, close gaps and preserve transitions during speed changes, trimming, or movement.

## Transitions and Alignment

Transitions and their structural edits adjust only their main track. Subtitles, music, and other tracks do not follow automatically, so check cross-track alignment after every structural edit.
