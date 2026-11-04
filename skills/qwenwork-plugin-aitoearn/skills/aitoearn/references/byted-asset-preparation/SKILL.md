---
name: byted-asset-preparation
description: >-
  Determine how to make media suitable for a planned use: retain it,
  extract components, separate mixed sound, remove unsuitable burned-in
  captions, adapt its format, or source replacement or additional media
  through search or generation. Use when these needs arise during planning
  or editing, even without an explicit processing request. Route execution
  to relevant specialist skills. Skip routine timeline edits and audio fades
  or level balancing that require no asset preparation; an already selected,
  suitable specialist workflow can be followed directly.
requiredTools:
  - separate_voice
  - erase_video_subtitle_pro
  - matte_greenscreen_video
  - erase_image
  - remove_image_background
---

## Environment

This agent exposes MediaKit through MCP/REST tools only. `mediakit-cli` is not available. Ignore any CLI fallback or installation instructions in this skill and its references; if a capability is unavailable, report the gap instead of running a terminal command.

# Asset Preparation

Prepare only what the current task needs. Decide which content to retain and which treatment can make it usable, then follow the appropriate specialist guidance. These are alternative or complementary choices, not a mandatory processing sequence. Suitable material needs no additional treatment.

## Identify the intended use

Establish the asset's role, required content, usable source range, format, and relationship to the edit. Distinguish essential requirements from flexible preferences. Identify the picture, speech, music, ambience, effects, and embedded text that matter for this use; do not assume every component must be retained or removed.

Use the material and information supplied for the task without requiring a library scan or a particular upload workflow. Inspect only relevant sources and affected uses. Follow existing authorization and exclusions; a plan-only request does not authorize production. Ask only when missing information, scope, or cost requires a decision.

## Choose the treatment

| Need or condition | Direction |
| --- | --- |
| Material already meets the intended use | Retain it without processing. |
| Only the picture is needed | Mute audio in the relevant clip use; no separation is needed. Do not change other uses of the source. |
| The complete existing soundtrack is needed as a separate asset | Extract the audio track. Extraction preserves its mixture; it does not isolate speech or music. |
| Wanted components already have separate tracks | Select the required tracks directly. |
| Retain speech but remove music mixed with it | Select separation that actually outputs the wanted speech. Do not mute the whole mixture. |
| Reuse BGM or ambience from a mixture | Select a method that can isolate the required component. Speech enhancement alone does not establish music or ambience extraction capability. |
| Only unwanted BGM remains, or none of the source sound has a role | Mute it in the affected use. Rely on project music only if music is already planned. |
| The existing mixture is suitable | Keep it; use relevant mixing guidance for levels and overlap with the edit. |
| Burned-in captions conflict with the intended use | Consider supported subtitle removal, preserving required picture detail. Editable caption layers can be adjusted or removed directly in the edit. |
| Content is suitable but its format or framing is not | Select a supported conversion or adaptation that preserves required detail and timing. |
| Additional or replacement content is needed | Choose search, generation, or a revised plan according to the constraints below. |

For supplied ASR captions, compare meaning and key details with source text or speech when accessible; do not assume matching wording proves correctness. This workflow does not create transcripts. Do not remove meaningful on-screen text merely because it resembles a caption.

## Decide when to source additional or replacement media

Source media when the user requests an addition or replacement, a planned picture or sound is missing, or the relevant material cannot meet essential content, usable-duration, or quality requirements through suitable supported treatment. Identify the gap from the current brief and known material; no full-library scan or sequence of processing attempts is required.

Keep additions tied to the authorized plan. Do not add music, narration, or shots simply because they might enrich the edit. Respect supplied-material-only restrictions. If suitable material already fulfills the need, continue without sourcing more.

## Choose between search and generation

Prefer search for common, readily available material that can serve the intended role without substantial customization. Prefer generation when the asset needs to be made to order or closely bound to specific creative content. Apply these defaults to each asset need rather than choosing one method for the entire project.

| Requirement | Preferred route |
| --- | --- |
| Generic, interchangeable content such as city traffic, a forest aerial, a common ambience, or a standard sound effect | Search for suitable existing media through a skill that supports the required medium and sources. |
| Exact original dialogue, a particular fictional action or scene, a custom sound sequence, or a visual closely tied to the script | Generate with relevant specialist guidance when the brief permits it and the capability supports the requirements. |
| A consistent invented character, product reference, or specific visual style across new shots | Consider reference-guided generation; confirm that required identity and details can be preserved and checked. |
| A real event, an actual statement, or evidence of a product's demonstrated performance | Search for verifiable existing material or request the necessary source. Specificity does not make generated evidence acceptable. |

An exact real-world subject is not automatically a generation need: footage of a named building may be searchable, while a scripted fictional action at that building may require generation. Reference-guided product imagery is acceptable only when permitted and sufficiently faithful; it cannot establish that a real demonstration occurred.

Honor an already specified, feasible approach. When both routes fit, prefer the one likely to meet the requirements with less cost and delay. A creative overall style alone does not require every asset to be generated, and a clearly custom asset does not require an unsuccessful search first.

If search cannot meet necessary custom constraints, consider generation only when it remains within the brief. If generation cannot preserve essential details, consider suitable existing material or revise the plan. Failed search does not authorize fabrication, and failed generation does not justify unrelated stock. After choosing a route, read the corresponding specialist guidance before execution.

## Select and read specialist guidance

Match the required operation, input medium, and expected output against descriptions in the available skill catalog. Read the selected instructions before executing, including references required for that branch. Reuse instructions still available in context. Discover guidance by capability rather than relying on a fixed skill name or a guessed path.

Leave query construction, generation prompts, model selection, command syntax, and technical recovery to the selected guidance. Follow its limits. A video-search workflow may return only candidate links; an audio-generation workflow may support speech and effects but not music. Confirm the actual output contract before relying on it.

If suitable guidance is unavailable, use a documented tool directly only when its operation and limits are clear. A missing skill does not imply a missing capability, and a skill's presence does not prove that its required tools are operational.

## Confirm executable capability

Use only tools exposed by this environment:

1. **Retain** the original when it already fits.
2. **Separate voice / background** with `separate_voice`.
3. **Remove burned-in captions** with `erase_video_subtitle_pro`.
4. **Matte green-screen video** with `matte_greenscreen_video`.
5. **Erase image text / icons / regions** with `erase_image`.
6. **Remove image background** with `remove_image_background`.
7. **Generate or source additional media** through the relevant generation skill.

Do not install or run local FFmpeg, `mediakit-cli`, or other external tools. If an exposed tool cannot support the required operation, report the gap and preserve the usable original.

Check operations independently: cropping, trimming, muting, separation, subtitle removal, matting, and format conversion are distinct. Do not invent parameters or silently change the deliverable to fit a tool. Inspect the actual output before accepting it.

## Check the result and return to the edit

Compare the actual output with the intended use. For separation, check retained words or sounds, unwanted leakage, musical damage, and unnatural ambience. For subtitle removal or picture adaptation, check required detail, residual text, and temporal artifacts. For searched or generated replacements, check content and factual requirements as well as format and usable duration. Follow specialist guidance for the inspection method; report unavailable playback checks as unverified.

Keep sources recoverable. Retain the derived asset's source identifier, source range, processing applied, provenance and relevant use conditions, and any timing offset needed to preserve synchronization. Check whether duration, speed, or channel layout changed. Replace only intended uses and preserve unrelated edits.

Distinguish candidate links, pending jobs, available assets, and applied timeline clips. Hand off an accessible result and its remaining limitations; if file processing is unnecessary, a source identifier and usable range may suffice. Do not claim a derivative or placement that has not been produced.

Return prepared material to the ongoing task. For audible cut boundaries and source-to-BGM balance, read relevant audio-continuity or mixing guidance and check the affected edit after replacement. Keep those timing and mix decisions in their own workflow; asset preparation does not imply a new export or approval checkpoint.
