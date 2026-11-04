# Processing and Source Lineage

For each operation, identify the observed problem, the decision or deliverable it blocks, the smallest sufficient operation, and its verification. These describe goals, not guaranteed tool names:

| Need | Possible operation | Verification |
| --- | --- | --- |
| An analysis tool cannot accept the input | Extract audio, sample frames, or convert format | Compatibility, offsets, retained modality; extraction alone is not understanding |
| Required speech is obscured by interfering sound | Available separation or cleanup where necessary | Compare affected sound, preserve words and synchronization, report artifacts or limits |
| A required asset cannot be imported | Supported transcoding or resizing | Readiness, duration, dimensions, audio presence, content preservation |
| A requested crop risks losing subjects or text | Editable fitting/crop, or necessary prepared variant | Relevant subject/text remains visible without invented reconstruction |

Do not process because a tool exists. Avoid replacement generation, retouching, watermark removal, or blanket enhancement without relevant user intent. If a capability or essential input is unavailable, retain the dependency and continue independent work.

Inspect the actual contract for input and retrieval. Preserve the original and produce a separate derivative. Keep source, operation, and task handle until terminal results. A submission, timeout, or filename does not establish success. Do not resubmit pending tasks or bypass permission denial.

Record necessary lineage: original/derived references, operation/status, covered source range, changes to duration/speed/offset/sound/geometry, verified temporal mapping, evidence still valid, output checks, and synchronization still needed.

For an extracted source interval 12–20 s at 1x, derived 0–8 s maps back by adding 12 s only if extraction preserves timing without extra offset. If timing changes, use a verified mapping or obtain new timing evidence on the derivative. Original ASR words may remain usable while timestamps do not. A crop invalidates geometry-based safe regions; sound replacement changes which transcript is audible. Reinspect affected content, not necessarily every source.

Before project use, give basic the actual derivative and metadata. Follow its explicit material synchronization rules and use the returned real material ID. Never treat a tool URL as already imported or silently substitute an original for a failed required derivative.
