# Prompt Examples

Use these examples after [byted-mediakit-media-understand](../../../byted-mediakit-media-understand/SKILL.md) has selected the input modality and tool. They are optional editorial question patterns, not an interface contract or permission to submit video directly. Adapt each prompt to the actual image or audio evidence and its source-time mapping.

## Simple Summary

```text
Summarize the main content of <material> in <requested length or format>.
Describe only evidence available in this input modality. For sampled frames,
use the supplied frame-to-source-time mapping and mark coverage gaps. Mention
limitations when they affect the summary.
```

Adapt the modalities to the material: an audio-only task does not provide visual evidence, and a still image does not provide sound or a temporal sequence.

## Focused Analysis

```text
Analyze <materials and scope> to answer <user question>.
Find <relevant content> at <the level of detail needed for the task>.
Return <requested format>, with source references or original time positions
where needed to locate evidence. Explain missing evidence or uncertainty that
affects the answer; do not invent details or numerical confidence scores.
```

For event retrieval, request separate events and original timestamps with explicit units. For summaries or comparisons, group related observations when useful. Request spatial locations only when relevant to the question. Keep tool-provided confidence scores only when useful and with their meaning intact.
