# Voice input and preset selection

The bundled catalog contains all 445 entries in the two Doubao TTS 2.0 tables captured on 2026-09-20 (source page updated 2026-09-15). Read or search the relevant local table on demand; external documentation is not required.

| Local catalog | Coverage | Entries |
| --- | --- | --- |
| [General and character voices](voices-tts2-general.md) | Shared TTS 2.0 / S2S-O2.0 / full-duplex table; Chinese and English, character roles, narration, customer service | 294 |
| [Multilingual voices](voices-tts2-multilingual.md) | TTS 2.0 foreign-language table, including language labels, inference modes, and original restrictions | 151 |

The general voice table starts with 23 recommended voices with supplementary characteristics, descriptions, and style tags. After honoring explicit voice requirements and filtering for compatibility, consider these first when matching the brief and source material; if none fits, use the other general or multilingual entries. Recommendation reflects metadata completeness, not verified audio quality. The supplementary descriptions are name-matched selection clues, not verified backend-ID equivalence or Seed Audio capability declarations.

## Choose the voice input first

1. Honor the user's explicit voice ID or recording choice and preserve established character or series continuity. If these requirements conflict, clarify rather than silently prioritizing one. Check compatibility before submission.
2. When a recording is explicitly supplied as the desired voice or speaking style, prefer Seed Audio's audio input through `references[].audio_url`; do not search for a similar preset. Validate the recording against [audio-api.md](audio-api.md), obtain an accessible URL through an authorized route, and bind its intended role in the prompt. This does not create a persistent cloned voice or imply the same reference mechanism works in TTS 2.0.
3. Audio supplied only for pacing, background music, or source context does not automatically authorize using its voice. If the recording's intended role is ambiguous, clarify before using it as a voice reference. Honor an explicit request to use a recording only for analysis and reconstruct its qualities through text; in that case, do not attach it to generation. If a required input is incompatible, explain the conflict instead of silently substituting a preset.
4. Without a specified voice, generation reference, or established identity to preserve, describe the target voice and delivery directly in `text_prompt`; omit `references` and `@音频` markers. Qualities such as a clear female voice or brisk narration do not by themselves require a preset. Use the request/material and gender principles below to form the description. Text descriptions guide qualities but do not guarantee the same voice identity across separately generated clips; select and retain a compatible preset or authorized recording when continuity requires it.

## Match a preset to the request and source material

Filter by model compatibility and required language/dialect before ranking candidates. Catalog coverage does not establish model support; check [audio-api.md](audio-api.md) separately. For pure English delivery, prefer a dedicated English voice.

Select before generating, in this priority order:

1. **Explicit voice requirements.** Treat user-specified male/female voice, accent, and other required qualities as constraints. For character dialogue, follow the established character setting. For narration without such requirements, consider both male and female voices; do not infer gender from genre or mood, such as male for martial arts or female for warmth. An off-screen narrator need not match the age or gender of someone shown on screen.
2. **Purpose and inspected material.** Identify who the voice represents and form a target sound description without naming a preset. Combine the intended audience, script intent, character role, atmosphere, pacing, and duration with evidence from the supplied material:

   | Material | Relevant selection evidence |
   | --- | --- |
   | Script or dialogue | Language, intent, character relationships, and emotional progression |
   | Images or video | Explicit character design, realistic or cartoon presentation, and overall atmosphere |
   | Original audio or reference recording | Established voice identity, accent, delivery, and continuity |
   | Editing rhythm or music | Required vocal energy, pacing, and restraint |

   Use only information actually inspected or explicitly supplied. Do not infer accent or personality from appearance, or claim to have heard a recording from its filename or metadata. If a material cannot be inspected, use the available brief and state material uncertainty when it affects the choice. Ask only when the missing information prevents a useful selection.
3. **Actual voice characteristics.** Match the target sound against reliable descriptions or existing audition material: register, fullness, brightness, breathiness, articulation, accent, and expressive range. Clearly distinguish catalog descriptions from qualities verified by listening. Unspecified gender is at most a secondary consideration among otherwise suitable candidates; clarity, delivery, and material fit take precedence. Do not invent acoustic qualities when evidence is missing.
4. **Voice name, last.** Use names and scene/product tags only as search clues or a final tie-breaker. A name containing "narration" does not establish suitability for every narration task. Names cannot override requirements or characteristic evidence; ID fragments such as `uranus` do not describe vocal style. When only a name is available, acknowledge limited selection evidence instead of deriving acoustic qualities from it.

Choose one voice per speaker and briefly explain the choice using the target sound and supporting brief/material evidence, not name similarity. For example, an informal first-person story calls for an approachable conversational candidate; being a video alone does not establish a need for a broadcast-style voice.

Do not generate audition variants or require user listening approval by default. Compare variants only when requested; reconsider a selected voice when a concrete output problem or user feedback warrants it. For multiple speakers, preserve each character's identity while choosing distinguishable voices within the supported reference limit.

Material used to inform selection is not automatically a generation input. A supplied image can inform preset selection without being attached to the request. Image-conditioned generation cannot include a preset speaker or audio reference, and video is not a supported generation input. If both image conditioning and a specific voice are required, resolve that mode conflict before submission.

## Bind the selected voice

1. Search the local tables for the requested name, language, dialect, or role. Preserve an exact user-supplied ID and check its entry. Do not replace a requested voice with a familiar default.
2. Check the model language list in [audio-api.md](audio-api.md) separately. Catalog coverage is broader: Arabic and Indonesian entries do not establish Seed Audio support for those languages.
3. Copy the exact `voice_type` into **`references[].speaker`**, not a field named `voice_type`. Preserve case, hyphens, and underscores. Do not derive IDs by replacing suffixes.
4. Bind entries in order using `@音频1`, `@音频2`, and `@音频3` in `text_prompt`. Do not combine speaker references with image references.
5. Express emotion, accent, pace, and acting in the prompt. Catalog labels such as QA, Context, instruction following, and one-way streaming describe the source TTS interface; they are not Seed Audio request parameters. Retaining these labels does not verify identical restrictions or capabilities through Seed Audio.

When preset selection is needed, apply the selection order above and disclose the choice. 小何 2.0 and 云舟 2.0 are general Chinese fallback candidates, not defaults for every scene; Tim and Dacey are American English candidates. Read exact IDs and language labels from the table.

Catalog inclusion is not a guarantee of account access or live Seed Audio acceptance. Claims about pronunciation, dialect, and voice fidelity require actual audio review; metadata or a successful request does not establish them. If audio perception is unavailable, disclose that listening quality was not verified without making user audition a prerequisite. For a name absent from the snapshot, use an exact compatible ID supplied by the user or explain the gap; never invent an ID. Existing compatible cloned voice IDs are also supported even though personal clones are not listed here.

## Other model families

The source page also contains separate TTS 1.0 and S2S-O / SC-2.0 tables. Those are outside this TTS 2.0 selection and are not bundled as Seed Audio choices. Jupiter and Saturn IDs are not interchangeable with Uranus IDs. The shared TTS 2.0 / S2S-O2.0 table above is included because it explicitly lists TTS 2.0 compatibility; it must not be confused with the separate S2S-only table.
