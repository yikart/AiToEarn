# Editorial Evidence Requirements

Use [byted-mediakit-media-understand](../../byted-mediakit-media-understand/SKILL.md) for understanding tool routing and execution. This reference defines the evidence an editing decision needs; it does not define another tool priority or fallback route.

## Define the Content Question

Determine the evidence scope from the user's goal and decisions still open. Selecting a photo, protecting a subject during cropping, choosing a music excerpt, or aligning an impact needs evidence about that material's content. Include standalone images and audio as well as video. Reuse adequate source-linked findings rather than analyzing everything again.

Keep technical metadata separate from semantic evidence. Dimensions, format, alpha, average color and BlurHash do not identify an image's subjects, readable text or suitability as a cover. Duration, channels and sample rate do not establish musical character, phrase endings or sound events. A name, extension or presumed asset role does not justify skipping content evidence. Conversely, metadata is sufficient for a purely technical request, and no new semantic analysis is needed when exact instructions and existing evidence resolve the content decisions.

For each content-dependent use, identify the needed evidence: complete semantic/action units and boundaries, subjects and crop safety, narrative prerequisites and outcomes, music phrases/sound events, or quality problems affecting usability. If all-file analysis was requested, reconcile every supplied material against the inventory before claiming completion or excluding it.

## Dialogue and Timing

Dialogue-dependent decisions need adequate source-linked ASR when available, even without a subtitle request. Reuse results with established provenance and coverage; obtain only missing speech evidence through the shared workflow. Combine the transcript with visual or non-speech sound evidence when those modalities affect the decision. Do not require a separate model call merely to summarize verified speech.

Check wording and proposed cut boundaries against original sound and supported context when necessary. Neither ASR nor a model summary automatically overrides other evidence: correct only supported recognition errors and retain unclear words or overlapping speech as uncertain. Keep complete utterances, source offsets and supported speaker information. OCR and filenames are not verified dialogue. An empty transcript does not prove silence or describe non-speech sound.

For timing-sensitive edits, require source-linked evidence for the relevant event and boundary. Model timestamps alone do not establish exact action or sound alignment. Preserve uncertainty and original-to-derived mappings; use [Subtitle Timing and Display Units](subtitle-timing.md) for subtitle placement.

## Decide Whether Evidence Is Sufficient

Check that evidence covers the candidate range and the specific selection, ordering, crop, pacing or sound decision. Existing scores and suggested segments require editorial judgment; they are not proof of relevance or a finished edit. Keep observations, recognized speech and interpretation distinct.

If evidence is pending, empty, failed or insufficient, follow the shared workflow for retrieval and refinement. Preserve successful partial results and identify unresolved source/range questions. Continue independent planning, but keep dependent choices and the basic handoff conditional. Do not invent scenes, dialogue, beats or cut points.

For promptable tools, [Prompt Examples](understanding/prompt-contract.md) can help express an editorial question after the shared workflow has selected the input modality. These examples do not authorize a different tool or input route.
