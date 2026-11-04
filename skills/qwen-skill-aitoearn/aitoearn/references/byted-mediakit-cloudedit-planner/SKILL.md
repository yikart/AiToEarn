---
name: byted-mediakit-cloudedit-planner
description: Turn editing intent and video, audio, or image sources into an evidence-backed, executable CloudEdit plan. Use whenever an edit needs decisions about selection, story, ordering, pacing, sound, composition, or necessary media processing, even when the user simply says to make a video. Understand intent, obtain sufficient content and timing evidence, prepare needed assets, and hand the concrete plan to byted-mediakit-cloudedit-basic for requested project production. Plan-only requests stop at the plan. Exact mechanical edits, import-only, export-only, and isolated parameter changes can use basic directly.
requiredTools:
  - probe_video_metadata
  - probe_audio_metadata
  - probe_image_metadata
  - extract_frames
  - media_understanding
  - asr_subtitles
  - separate_voice
---

## Environment

This agent exposes MediaKit through MCP/REST tools only. `mediakit-cli` is not available. Ignore any CLI fallback or installation instructions in this skill and its references; if a capability is unavailable, report the gap instead of running a terminal command.

# From Editing Intent to an Executable Project Plan

Own the editorial decisions from the request through a plan that another editor can implement without guessing content, sources, timing, or treatments. Define the evidence needed and use [byted-mediakit-media-understand](../byted-mediakit-media-understand/SKILL.md) to obtain it. That skill owns understanding tool selection and execution; this skill owns editorial evidence requirements and planning. [byted-mediakit-cloudedit-basic](../byted-mediakit-cloudedit-basic/SKILL.md) owns project operations and remains independently usable.

## 1. Establish the Intended Result

Reuse the conversation and project context. Identify what the audience should understand or experience, the intended use, and the deliverable: one sequence, independent cuts, or alternative versions. Separate binding requirements from preferences and choices left to editorial judgment. Preserve exact supplied ranges, order, duration bounds, aspect ratio, required/excluded content, sound, and text requirements.

Determine whether the user wants analysis, a plan, or production. Analysis and plan-only requests do not authorize project writes. For production, continue through basic and its verification; do not stop at a proposal when execution is already authorized. Export only on request.

Ask only about gaps that materially change the result and cannot be resolved from sources or project state: conflicting mandatory duration and content, an ambiguous target project, or an unspecified deliverable that changes selection. State reasonable minor assumptions and continue independent work. Do not require a questionnaire or another approval after direction or end-to-end execution is established.

For existing projects, use basic's reading rules to identify materials, affected clips/tracks, and neighboring boundaries. Check the material pool before asking for a missing upload. Preserve unrelated content and account for synchronized downstream elements in structural revisions.

## 2. Inventory Sources and Define Evidence Needs

Keep a lightweight record of source identity/access, media type, usable technical properties, existing content evidence and coverage, and remaining gaps. Distinguish originals from derivatives. IDs come from actual results; filenames are hints, not facts about content, chronology, or emotion.

Include standalone audio and images as well as video and its audio. Import success or metadata establishes no subjects, readable text, dialogue, musical mood, beats, or sound events. Reuse adequate source-linked results and specific user-provided facts rather than analyzing everything again.

Before choosing tools, separate each source's content question from its technical checks. For every source being considered for a content-dependent use, identify either sufficient existing content evidence or the understanding work still needed. A planned or completed probe does not close that content question. Do not reduce an image's analysis to transparency or dimensions because it appears to be a logo, overlay, cover, or decorative asset; deciding that role also needs evidence. No new understanding is needed when the task is purely technical or the user's exact instructions and existing evidence leave no content decision unresolved.

If the user requests analysis of all supplied materials, inventory every file and obtain adequate understanding for each before claiming complete analysis or deciding it is irrelevant. Mark pending/unavailable files individually. Otherwise scope analysis to decisions: broad candidate coverage for selection, affected ranges and continuity boundaries for local edits, and no new semantic analysis for fully specified mechanical operations.

Turn the intent into questions about the material: what deserves attention, what the audience needs to understand it, which relationships are supported, and what visual or audible details determine a usable cut. Consult [Media Evidence Models](references/media-evidence-models.md) only for questions that need more precision. Choose evidence by the decision it supports, without classifying the task into a scenario or assigning a preset sequence.

Treat labels such as “Vlog,” “cinematic,” or “highlights” as clues to clarify through the rest of the request and actual content. The same sources may support very different edits. Neither a label nor an available tool determines what the finished piece should say or how it should unfold.

## 3. Obtain Sufficient Understanding

Before obtaining new semantic evidence, read and follow [byted-mediakit-media-understand](../byted-mediakit-media-understand/SKILL.md). It owns modality routing, capability discovery, MCP/REST tool selection, input preparation, sampling, concurrency, task retrieval, failures and tool boundaries. Read [Editorial Evidence Requirements](references/media-understanding.md) for evidence needed to make editing decisions.

Apply that workflow to the identified gaps; an editing request does not create an exception to its direct-video-input restrictions or prohibited workflows. Install external tools/models only with explicit consent. Technical probes may accompany this work but cannot replace content understanding.

Request evidence around decisions: complete semantic/action units and boundaries, subjects and crop safety, narrative prerequisites and outcomes, music phrases/sound events, or quality problems affecting usability. Obtain available ASR for dialogue-dependent decisions even without subtitles. Reuse adequate source-linked ASR with established provenance and combine it with relevant visual or sound evidence; a speech-only question does not require a separate media-understanding call.

Make selections from the acquired evidence and the user's criteria. Reuse accepted source-linked selections when sufficient; check source ranges, coverage, ordering semantics, and per-deliverable budgets. Tool scores and suggested segments in existing results are inputs to judgment, not automatic proof of relevance or a finished edit. Do not launch a prohibited understanding workflow as a retrieval or selection shortcut. Unavailable or invalid evidence leaves a gap rather than permission to invent replacements.

Keep observed visual facts, recognized speech, and inference distinct. Retain original source times and coverage. Do not fill partial or failed results with imagined scenes, words, chronology, beats, or precise cut points.

Evidence is sufficient when:

- Each selected source has accessible identity and the content/timing evidence its use needs; broad selections have adequate candidate coverage.
- Each content-dependent image or audio use has its own adequate content evidence; metadata-only results remain technical checks, not completed understanding.
- Retained speech, actions, steps, and story references remain intelligible at proposed boundaries.
- Requested audio alignment, text, crop, and connections have their own supporting evidence.
- Required analysis coverage is reconciled against the inventory, including excluded files when all-file analysis was requested.

For a gap, obtain a focused result, choose a supported alternative within the user's constraints, or leave the decision explicitly unresolved. Continue independent portions, but do not label dependent planning executable while required evidence is pending. Sufficient evidence is decision-specific, not exhaustive transcription or frame-by-frame cataloging.

## 4. Prepare Only Necessary Materials

Read [Processing and Source Lineage](references/processing-and-lineage.md) when a technical/content-quality obstacle blocks the edit, an analysis tool requires derived input, or the user requests processing. Choose tools by outcome and live schema, not a routine enhancement pipeline.

Prefer editable timeline operations for trims, placement, speed, gain, and crop. Use atomic processing when a required result cannot be achieved adequately on the timeline, such as necessary format conversion or separation of interfering sound. Do not invent available cleanup, generation, or repair capabilities.

Retrieve completed processing results, verify properties and affected content, and preserve original-to-derived time/geometry mappings. Invalidate only affected evidence. A returned URL is not a project material ID; give basic ready external assets for explicit synchronization before timeline references.

For plan-only work, perform analysis prerequisites within authorized scope, but describe production processing as pending unless also requested. Required pending output keeps the dependent plan conditional; do not claim a derivative exists.

## 5. Design and Check the Edit

Form an editorial idea before filling a timeline: state what the piece should communicate or make the audience experience, and how the available material can achieve that. This is a working hypothesis, not a slogan or a genre template. Revise it when source evidence contradicts it.

Develop the idea through the decisions that matter for this request:

- Identify the material carrying the central meaning or experience, and what context makes it understandable. Distinguish indispensable content from supporting, redundant, or distracting material.
- Find supported connections among those pieces: what changes, what answers another piece, what contrasts, or what creates a meaningful visual or audible association. Choose an order for those reasons; upload order and assumed chronology are not evidence.
- Set emphasis and pacing around the time needed to understand, observe, hear, or feel each piece. Decide what should be brief, sustained, omitted, or intentionally repeated rather than allocating equal slots or a fixed stage budget.
- Decide how picture, sound, silence, and any requested text contribute together. Use processing or stylistic treatments only when they solve a problem or serve a specific expressive purpose supported by the user's intent.

When materially different approaches fit the evidence, compare their effect on the user's priorities and select the strongest supported one. Do not require multiple proposals for every task or ask the user to make routine editorial decisions. Explain the chosen idea concisely before the detailed source-to-timeline mapping.

Check whether the idea survives its concrete selections and boundaries: whether meaning remains complete, claimed relationships are supported, and each treatment earns its place. Revisit weak decisions or gather focused evidence. A hook, staged progression, music, subtitles, transitions, and a closing message are choices, not required components. Autonomy includes leaving an effective passage simple.

Read [Editing Plan Mechanics](references/editing-plan.md) to map the idea to timeline uses and check duration and continuity. Keep source in/out separate from placement; account for speeds, holds, transitions, and repeated occurrences. Independent cuts and alternatives have separate placements/budgets, not one concatenated timeline. Total duration is the final timeline end, not the sum of concurrent tracks. Resolve strict duration conflicts without silently changing mandatory content or asserting unproven minima.

For text, read [Subtitle Timing and Display Units](references/subtitle-timing.md). Distinguish verified dialogue from editorial titles. Map source speech to every audible edited occurrence; muted/replaced sound does not automatically contribute subtitles. Recheck synchronization after structural changes.

Before handoff, read basic's [Project Fundamentals](../byted-mediakit-cloudedit-basic/references/edit-project.md) and applicable operation references. Confirm treatments can be represented by available capabilities. Keep editorial timing explicit; basic translates it to its current schema and integer-millisecond conventions. Resolve unsupported required operations rather than silently dropping them.

## 6. Hand Off and Deliver

Use [Executable Handoff](references/executable-handoff.md) as a completeness guide. Simple sequences need concise source/range/order instructions; complex edits need explicit layer/occurrence timing. This is an editorial contract, not a new tool schema.

For plan-only work, deliver the plan, reasons, and unresolved dependencies, then stop. For production, pass the same plan/evidence to basic and continue to synchronize materials, apply changes, and run its quality gate. Basic resolves real resource IDs and operation parameters without reopening settled creative decisions. If execution is unavailable, retain the usable plan and state what remains unapplied.

After implementation, compare actual source trims, placements, canvas, treatments, and duration with the plan in addition to basic's structural gate. Read back after the final write. On partial failure, inspect current state and repair only missing/wrong changes; recheck affected dependencies rather than rebuilding everything.

Report what was planned, processing completed, project changes read back, and whether a composed audiovisual preview was inspected. A structural snapshot does not prove visual appearance or perceived audio quality. Return a real project/editor reference when available; never invent preview/export URLs. Identify remaining manual review and blocked work without claiming audiovisual validation.
