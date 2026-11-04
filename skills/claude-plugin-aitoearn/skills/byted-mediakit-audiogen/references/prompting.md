# Prompting

## Describe audible results

For ordinary text/audio-reference requests, describe the audible scene from the user's goal and inspected material: who is speaking to whom, what they intend to communicate, language, overall delivery, any meaningful change in delivery, and the spoken lines. Scale detail to the task: a simple spoken message needs a compact brief; a dramatic scene may need a turn-by-turn sound script. Include effects, ambience, or timing only when relevant. These are planning cues, not mandatory fields to fill in every prompt. Separate spoken text from production directions so instructions are less likely to be read aloud; directions may sit immediately before the quoted line they affect.

Keep exact user text in quotation marks and state that it must be spoken verbatim when that is the requirement. Do not paraphrase names, numbers, slogans, or dialogue. For effects-only requests, explicitly state no speech and no music when appropriate.

## Speech and performance

Match the performance to the purpose; natural speech is not always casual, soft, or emotional. Use one clear overall direction and only the local changes needed by the content. Prefer a concrete intention such as reassuring a worried customer or explaining a contrast to a beginner over a list such as "natural, warm, expressive, professional, lively". Keep directions consistent with the words and selected voice; do not invent a dramatic backstory or force an emotion unsupported by the brief.

Turn broad requests such as "自然、有感情、不生硬" into actionable delivery directions grounded in the brief: what the speaker wants the listener to understand or feel, and how to deliver that message. When the text supports a change, anchor it to a specific phrase or discovery instead of assigning an emotion to the whole clip. For a simple spoken message, one or two direction sentences are usually enough. For storytelling or multi-turn dialogue, give each meaningful change the space it needs; do not impose that sentence limit on the whole scene or add a transition to neutral material merely to make it expressive. Keep these directions outside the spoken quotation and do not add an unsupported relationship, event, or claim.

Examples of replacing vague direction with specific intent (adapt only when supported by the request):

- Personal account: instead of "自然、生动、有感情", use "像向朋友讲述刚发生的事，开头平静交代经过，说到意外结果时略显惊讶。"
- Service reply: instead of "温柔、亲切、专业", use "先用平稳的语气让担心内容丢失的用户安心，再清楚地说明恢复操作。"
- Explanation: instead of "有感染力、重点突出", use "向初学者解释两种操作的区别，轻轻强调各自改变的对象，让对方听清差别。"

Use delivery instructions to guide the selected voice within its intended style. If they demand a conflicting voice identity, revisit selection using the user's requirements rather than stacking more adjectives; preserve an explicitly requested voice and explain a material conflict.

| Scene | Useful direction |
| --- | --- |
| Explanation or narration | Listener's knowledge, information hierarchy, and the key contrast or discovery |
| Personal account | Relationship to the listener and attitude toward the experience being shared |
| Service or assistant reply | The listener's situation and whether the response informs, reassures, or guides |
| Advertising | Brand tone and the intended benefit or call to action; energy need not remain high throughout |
| Character dialogue | Relationship, reaction to the preceding line, and any change in intention |
| Audiobook | Narrator versus character roles and continuity across passages |
| News or announcement | Clear information grouping, measured emphasis, and appropriate formality |

For dramatic dialogue, establish the characters from the supplied brief, then write each turn as speaker, intention or attitude, and quoted words. Put directions such as questioning, warning, or reluctantly explaining next to the relevant line. Let each response follow what was just said, and develop emotion across turns where the script supports it; a single scene-wide label such as "tense" does not replace these local directions. Describe audible delivery rather than visual acting alone. Expand characterization or plot only when the user has asked you to author them.

Treat accurate wording and fluent delivery as separate requirements: preserve the supplied lines while asking for connected phrases and pauses at meaningful boundaries when needed. Avoid directing equal emphasis on every word. Do not prescribe a pause after every sentence or routinely add breaths, laughter, fillers, or hesitation to simulate humanity; use them only when the requested performance calls for them.

When authoring text is part of the task, write speakable phrases and punctuation that support the intended rhythm. When the user supplies fixed text, preserve it; keep pronunciation guidance for ambiguous names, numbers, and abbreviations outside the spoken quotation. Ask about a materially ambiguous reading rather than silently changing its meaning. Do not rewrite fixed text merely to make it more conversational.

Use natural-language production directions supported by this interface. Do not import SSML, bracketed audio tags, `context_texts`, `emotion`, or stability settings from other TTS APIs. Their parsing and control behavior are not established for Seed Audio. Keep the complete `text_prompt` within 3000 characters. The image-conditioned exception below takes precedence over all speech-direction guidance.

## Choose speed, pitch, and loudness

Prefer `text_prompt` for qualitative voice characteristics, pace, register, and vocal energy. These instructions guide performance; they do not uniquely determine numeric controls. Omit optional `speech_rate`, `pitch_rate`, and `loudness_rate` unless the user specifies a value, the requirement has an unambiguous mapping supported by `audio-api.md`, or measured output provides a basis for adjustment. Do not routinely fill in zeros or translate adjectives into arbitrary values. Keep explicit user values unless a conflict needs their decision, and record the reason for each numeric adjustment. Format, sample rate, and subtitle settings are output requirements and can still be set independently.

- **Speed (`speech_rate`):** describe brisk, measured, or conversational delivery in the prompt first. A fixed visual window authorizes timing correction but does not by itself determine a numeric speed. After measuring a mismatch, adjust the supported control when warranted while preserving words and intelligibility. Keep prompt pacing consistent with the parameter.
- **Pitch (`pitch_rate`):** describe the desired register in the prompt first. Use a numeric control for an explicit setting or a diagnosed pitch adjustment, not as an automatic translation of "mature", "full", or "serious". Pitch is not a direct control for naturalness or emotional credibility.
- **Loudness (`loudness_rate`):** describe vocal energy in the prompt; it is distinct from output loudness. Use the control for an explicit setting or measured audibility/mix correction. Check peaks and clipping after an increase; this parameter is not a specified LUFS target or a substitute for dynamic-range processing.

Before the first generation, use the actual text, visual window, and relevant existing samples to choose a reasonable pace. Without reliable timing evidence, treat the choice as an estimate rather than an exact fit. After generation, measure the file. For the same existing clip, `measured duration / target duration` estimates the additional playback-speed factor needed: a 57.19-second clip needs about 1.19x speed to occupy 47.95 seconds. This is a relative factor, not a `speech_rate` value, and not a guarantee that regeneration will have that duration. Do not confuse it with the absolute speed setting or compound it blindly with an earlier adjustment.

When only overall duration needs correction and the existing performance is otherwise suitable, reuse the generated audio through a deterministic editing workflow only if the user's scope permits post-processing. If native output is required, correct the prompt or supported service control and regenerate instead. When phrase timing or performance itself is wrong, revise the affected prompt or supported control and generate only the necessary segment. In either case, remeasure duration and check articulation, pauses, voice identity, and expression when audio perception is available. Exact total length alone does not establish natural delivery or internal visual alignment.

## Voice and recording references

Bind every reference to its intended role using list order: `@音频1` is the first entry whether it contains a speaker ID or audio URL. State whether a recording supplies voice identity, performance, or acoustic character. Do not assume its speech should be copied unless requested.

Keep voice identity distinct from this clip's performance. With a selected speaker, describe how that speaker delivers the lines rather than repeatedly redefining age, timbre, and personality. For a recording used only as an identity reference, do not request its background noise or emotional delivery unless those are also part of the brief.

For multiple speakers, assign each line to one reference and distinguish delivery. At most three audio/voice entries are supported. Avoid conflicting voice descriptions that undermine the chosen references.

Example: `生成中文双人对话。出发前，@音频1向同伴确认：“准备好了吗？”@音频2听完后带着期待回应：“准备好了，我们出发！”两人语气轻松，第二句承接第一句。准确说出各自引号内的台词，不增删文字，无旁白、音乐或环境音。`

## Timing and scenes

Specify total length or major time ranges when the user or scene requires them, for example: `约8秒；0–2秒轻微风声，2–5秒金属门缓慢开启，5–8秒脚步声渐远。无人声，无音乐。` Do not invent a short duration for ordinary speech without a timing requirement. If fixed text and a requested duration appear incompatible, surface the tradeoff rather than silently cutting words or demanding rushed speech. Timing is a target; verify actual duration and event placement after generation.

For effects and ambience, describe the source, material, distance, acoustic space, and event progression only as needed. Use chronological events rather than speech-performance instructions. An isolated sound and a continuous ambience need different boundaries; specify a decay or sustained background when relevant to the brief.

For mixed scenes, specify foreground versus background and how events overlap. Keep dialogue intelligible by requesting quieter ambience or music. The result is a mixed clip; do not promise separate stems. For exact synchronization or strict duration, explain any additional deterministic editing needed and preserve the generated original.

Organize a sound script around what starts first, what continues underneath speech, and what follows the last line. Describe music through the relevant instruments, rhythm, and mood when requested. Event order is sufficient when no exact timing is required. Use "speech only" or "no music/ambience" for a clean voice asset when appropriate, not as a universal suffix that removes requested scene sounds.

## Speech for existing visuals

Apply these checks when speech is meant to accompany an existing video, timeline, slide sequence, or other timed visual target, even if the user did not explicitly say "sync". A reference image used for style or a standalone audio request does not by itself create a timing requirement. Visual inspection informs planning; do not attach video to this generation API or change the selected input mode.

1. Identify the intended visual asset or timeline range and inspect its content and timing using available viewing or analysis tools. Reuse a supplied storyboard or timing plan when it matches the current visuals. For each meaningful visual beat, record the observed start/end time, visible event or state, supporting frame/time evidence, assigned text, and intended audio start. Do not infer boundaries by equally dividing the total duration. If inspection is unavailable, report the gap rather than claiming verified alignment.
2. Before generation, compare the estimated speaking time with the available window and choose an appropriate speech speed. Split at natural phrase or scene boundaries when separate placement is needed; a continuous passage may span several shots when its meaning still matches them. Keep voice identity and delivery continuous across segments. Estimates help plan but do not prove fit. For fixed text and fixed visuals, plan speed adaptation first. Shorten text only when authoring or revising it is authorized; if the required pace would undermine intelligibility or the intended expression, surface that conflict instead of silently cutting words.
3. After generation, use the saved audio's measured duration to calculate its planned end: placement start plus measured duration. Compare against the visual window's end, including any required gap before the next line. Use the processed `duration`, not billing `original_duration`, when comparing the response with the file. A shorter clip need not fill the whole window; meaningful silence is acceptable. For speech spanning multiple visual beats, use returned word timestamps when available and playback to check internal alignment: fitting the total duration alone does not prove that each phrase matches the screen.
4. If the clip overruns or describes content that is not on screen at the intended moment, mark it as a mismatch before handing it off for placement. Adjust speed within the requested dubbing task as described above, without asking for approval for routine parameter tuning, and report the adjustment. Revise only affected segments. Do not cut fixed words, extend visuals, or overlap adjacent lines to force a fit. If fitting would conflict with an explicit speed setting or materially compromise intelligibility or the requested performance, explain the concrete tradeoff and ask for that decision. Save the original and measure any replacement or processed version again.
5. Deliver the segment map with actual durations and fit status to the editing workflow; this skill generates audio assets, not timeline edits. If the visual timing later changes, recheck affected windows against the current state. Only report final sync after the editing workflow has verified actual placement and representative playback. If placement or playback has not been checked, report the timing fit separately and state what remains unverified.

## Image-conditioned speech

Use only the exact text to speak in `text_prompt`; send one image in `references`. Do not append voice instructions, timestamps, or an `@音频` marker, and do not attach a preset speaker or recording. If the user requires both an image and a specific voice reference, resolve which supported mode meets their priority before generating.

## Targeted iteration

Before submission, check that directions agree with the text and references, dialogue is unchanged, timing is justified, and production directions are separate from spoken lines. Default to one generation per requested clip; do not create comparison variants as a routine prompt-validation step.

When audio perception is available, review omitted/repeated words, pronunciation, speaker swaps, rushed delivery, clipped endings, missing effects, and balance. Also assess whether emphasis follows meaning, pauses preserve phrase continuity, and the performance fits the scene. Metadata cannot establish these qualities; if audio perception is unavailable, report that limit without requiring user audition to proceed.

Revise only in response to an observed problem or user feedback. For choppy speech, inspect punctuation and excessive pause instructions; for flat delivery, clarify the important intent or transition; for overacting, reduce the performance intensity; for rushed speech, revisit the text/time constraint. These are diagnostic hypotheses, not guaranteed fixes. Do not silently remove required dialogue, override a hard duration, or change the selected voice to compensate for a prompt issue. Record attempts and what was actually checked.

## Basis and scope

The transferable principles above draw on [ElevenLabs voice and prompting guidance](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices), [Google's semantic alignment guidance](https://docs.cloud.google.com/text-to-speech/docs/gemini-tts#prompting_tips), and [Doubao voice-cloning guidance on context and reference performance](https://www.volcengine.com/docs/6561/2298705?lang=zh). These describe other interfaces or models; they do not establish Seed Audio support for their tags or parameters, nor prove an audible improvement here. Use the bundled API contract for requests. No external lookup is needed during ordinary generation.
