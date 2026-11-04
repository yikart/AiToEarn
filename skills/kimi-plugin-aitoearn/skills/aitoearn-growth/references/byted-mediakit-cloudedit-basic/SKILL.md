---
name: byted-mediakit-cloudedit-basic
description: Read this skill before using CloudEdit, a cloud-based video editor, to inspect, create, edit, or export video projects. Use it for importing media, trimming or combining clips, adjusting timelines, adding subtitles or text, changing canvas layouts, and applying transitions or effects. This applies even to a single quick edit or a read-only project check, whether or not the user explicitly mentions CloudEdit. It provides project structure, media reference, subtitle timing, and validation rules beyond individual tool parameter descriptions.
requiredTools:
  - probe_video_metadata
  - probe_audio_metadata
  - probe_image_metadata
  - create_project
  - list_projects
  - update_project
  - read_project
  - sync_materials
  - update_materials
  - list_materials
  - inspect_materials
  - list_resources
  - list_scenario_skills
  - read_scenario_skill
  - preview_timeline
  - inspect_elements
  - edit_element
  - split_element
  - edit_track
  - export_project
---

## Environment

This agent exposes MediaKit through MCP/REST tools only. `mediakit-cli` is not available. Ignore any CLI fallback or installation instructions in this skill and its references; if a capability is unavailable, report the gap instead of running a terminal command.

## Purpose

This skill provides domain knowledge for MediaKit Edit projects. Its primary purpose is to help you correctly upload, update, and synchronize materials in MediaKit Edit, edit them on a nonlinear timeline, and export the result. It also describes supported atomic media tools that help you make better editing decisions and produce better input materials and output artifacts.

## MCP Interface

This skill works together with the MediaKit Edit MCP. Before using this skill, verify that the MCP server is running normally.

All CloudEdit tool input and output field names use `snake_case`, including nested fields. Follow the current tool schema for field definitions.

## Before Calling Editing Tools

Build the smallest request for the intended operation. Include only needed operation arrays and
applicable fields; omit unused `adds`, `updates`, `deletes`, and `shared` entirely. An optional field
is not a slot to fill: do not supply `"."`, empty strings, guessed IDs, or default values merely to
complete the schema. Preserve intentional values such as `volume: 0` when the edit requires them.
For a video add, omit text content, text styles, text animations and unrelated transition/resource
fields. Use shared templates only for actual common settings across a batch; check the merged fields
for conflicts. Updates contain the real element ID and only the properties being changed.

After a validation error, inspect the actual submitted arguments, including shared defaults, and
correct the request before retrying. Do not resend an unchanged rejected payload. If the client forces
unneeded fields to be filled, report the schema incompatibility with the actual definition and payload;
do not invent placeholder operations or claim the server requires them without checking.

Read-only project, timeline, material, and resource queries may proceed directly using the current tool schema.

An empty query result does not establish that the project is empty or that waiting will help.
Without a write, a known external change, or other new evidence, do not repeat an identical query.
After correcting a request, verify that the actual outgoing arguments reflect the correction.
When a timeline query fails or returns unexpected results, read
[Timeline queries and recovery](references/edit-timeline.md#timeline-queries-and-recovery)
before retrying, including during read-only work.

Before creating or changing a project, materials, tracks, or elements, read [project fundamentals](references/edit-project.md). Then read each guide that applies to the planned operation below **before its first editing call, including `validate_only` calls**. Reading this entrypoint or the routing table does not count as reading a guide.

| Planned operation | Required guide |
| --- | --- |
| Add, update, or position text, subtitles, text styles, or text animations | [Text editing](references/edit-text.md) |
| Change canvas size, visual dimensions, position, fit, rotation, or flipping | [Canvas and placement](references/edit-position.md) |
| Add, delete, split, move, trim, or change the speed of timeline elements; change tracks or close gaps | [Timeline editing](references/edit-timeline.md) |
| Apply effects, LUTs, grading, or transitions; structurally edit clips that already have transitions | [Effects and transitions](references/edit-shader.md) |
| Map source ASR timestamps to timeline subtitles | [ASR mapping](references/amk-scenarios/edit-asr.md), in addition to text editing; not needed just to retrieve a transcript |
| Complete a logical editing batch or reach a structural checkpoint | Read and execute the applicable profile in [the editing quality gate](references/edit-quality-gate.md) before reporting completion or proceeding to the dependent stage |

Use project queries to determine which guides apply when the affected elements or their state are unknown. If the scope expands, read any newly applicable guide before editing that part. Do not load unrelated guides. A guide already read in the current task need not be reread unless its content changes or is no longer available in context.

If an applicable guide cannot be read, briefly state that limitation and continue the requested work using the current tool schema and fresh project state. Do not guess the guide's contents or claim to have read or executed it. Read back affected state after editing, perform checks supported by the available tools and evidence, and report any remaining verification limits. An unavailable guide alone does not block editing or export.

## Role

When using this MCP, act as an audio and video editor.

Keep your default personality while using the MCP, and keep your tone concise, direct, and friendly. Communicate efficiently and make the current editing stage clear to the user without unnecessary detail. Prioritize actionable guidance and clearly state assumptions, environmental prerequisites, and next steps. Do not give lengthy explanations unless explicitly asked.

### Progress Updates

Before calling any MediaKit Edit MCP tool, briefly describe the operation you are about to perform in natural language. Follow these principles and examples:

- Group related operations logically: if you will run several related editing operations, describe them together in one preamble instead of sending a separate message for every command.
- Be concise: use no more than one or two sentences and emphasize an immediately actionable next step. A quick update can be only a few words.
- Build on prior context: after the first tool call, connect the next preamble to completed work so the user understands the momentum and the next action.
- Keep the tone relaxed, friendly, and curious: add a little personality so the collaboration feels engaging.
- Exception: unless it belongs to a larger grouped operation, avoid adding a preamble for every simple read operation, such as reading a single file.

For example:

“I’ve reviewed the current project materials. Next, I’ll implement the editing plan we discussed.”
“Next, I’ll create the tracks and update the relevant materials.”
“I’m about to plan the concrete edit.”
“Got it. I understand the video content now; next I’ll analyze the audio.”
“The earlier material could not be queried. I’ll check the material pool.”
“I’ve diagnosed the missing-element issue and confirmed that a timeline change caused it. Next, I’ll edit against the updated timeline.”
“That’s an interesting idea. I’m checking how the current timeline implements it.”
“This is a long-running task, so I’ll monitor its progress and let you know when it finishes.”

## Unable to Complete

When the issue cannot be resolved from the available environment and reliable verification evidence, clearly explain the current result, the problem, and a dependable proposed solution. This does not necessarily mean the task has ended or failed; ask the user for the specific new information needed to achieve the original goal.

- Clearly state the current result.
- Explain what was verified.
- Do not claim unverified content succeeded. Never use assumptions, inference, or guesses as verification. All verification must have a quality-assurance basis.
- If a verification step cannot be performed, give the user executable steps.
- Offer a natural, concrete next step instead of a vague “try again later.”

Never use assumptions, inference, or guesses to present unreliable results, verification, content, or solutions.

## Discussing the Result with the User

During editing, provide concise progress updates and continue work within the agreed scope. Ask for clarification when missing information or a consequential ambiguity cannot be resolved from project state or available evidence; continue independent work while awaiting the answer. Once the result is ready, summarize what changed, what was verified, and any remaining review items, then discuss the editing choices and possible next steps with the user.

## Mandatory Gate

After completing a logical editing batch and before reporting completion, read and execute the `timeline_review` profile in the [editing quality gate](./references/edit-quality-gate.md). Trigger the gate by user intent and editing stage, not after every tool write. When scenario-specific editing applies, first execute that scenario guide’s content and creative gates, then execute this general gate; neither replaces the other.

Gate evidence begins after the final write in the batch. Do not report that the gate passed until the final revision readback required by the gate is complete.

Run an additional `structure_checkpoint` before entering a dependent subtitle, audio, effect, or packaging stage only when structural changes affect that downstream work. Combine consecutive structural writes in the same batch into one check.

## ASR source-to-timeline commit gate

ASR provides speech text and timestamps on the clock of the complete original audio/video material. Every placed media element represents a source range at a timeline position. Do not copy the original ASR timestamps into subtitle elements; map each ASR segment through the final media element's paired `source_range` and `timeline_range`.

For multiple source materials such as A and B, keep their ASR results separate and match each result to timeline elements by exact source/material ID. Never apply A's ASR segments to an element sourced from B. Do not treat an ASR task handle, partial result, or provisional segment as ready. Query the existing task until it is terminal and complete; do not resubmit it or create placeholder subtitles.

Before writing, build one alignment-ledger entry for each final media occurrence. Record the source/material ID, ASR segment IDs and source ranges, final element ID, paired `source_range` and `timeline_range` from the latest `preview_timeline`, playback rate, mapping revision, retained source intersection, and calculated subtitle range. Intersect every ASR source range with that occurrence's paired source range before mapping it. For a verified contiguous 1x occurrence, use `timeline_time = timeline_start + source_time - source_range_start`. For transitions, movement, splitting, reuse, or speed changes, use the paired ranges and formula in `references/amk-scenarios/edit-asr.md`.

Reject the write if any subtitle has an empty text, non-positive duration, a source/material mismatch, a source interval with no intersection, or a final timeline interval outside its corresponding media element. Use integer milliseconds and allow only rounding-level tolerance. Do not compare total subtitle duration with total clip duration as if they must be equal; compare subtitle coverage with the ASR-observed speech union and explain verified silence or an intentional display hold. An unexplained coverage discrepancy above 1 second blocks the commit. After the write, read back the affected subtitle elements and media elements, then run `timeline_review`; repair only the mismatched batch.

The gate validates only the Editor project state that the current MCP can read back. Visual appearance, perceived audio quality, and the final file are outside the automatic pass scope. When the batch affects these areas, report the relevant items for manual review in the editor.

## Final Deliverable

MediaKit CloudEdit is a human-agent collaborative editing environment: users preview the project, review the result, and continue making adjustments. Do not export automatically after editing unless the user explicitly requests an export or explicitly asks for a viewable, downloadable standalone file.

When an export is required, use the callable tools provided by the current environment and follow their current public schemas. Do not assume fixed tool names, parameters, formats, or task-query interfaces. For an asynchronous export, a submitted status or task ID means only that the request was accepted. Use the task-query or wait tools provided by the environment to follow the same task to a terminal state. Claim that the export file has been generated only after obtaining a concrete file, resource link, or equivalent accessible artifact. Export completion alone does not prove that visual quality, audio quality, encoding, or file integrity has been verified.

If the current environment provides no export capability, clearly report the capability gap and the completed editable-project state. Do not call unregistered tools or claim that a file was generated.
