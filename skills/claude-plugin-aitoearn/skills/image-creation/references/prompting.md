# Prompting best practices

Prompt structure, specificity, and iteration for `generate_image`.
Pick `model`, `size`, `quality`, and `style` from `list_image_models`. Do not invent those values here. When the user has no model preference, prefer `gpt-image-2.5-sunburst` if the catalog lists it.

Copy/paste recipes: `references/sample-prompts.md`.

## Structure

- Order: scene/backdrop -> subject -> key details -> constraints -> output intent.
- Include intended use (ad, UI mock, infographic) to set polish.
- For complex requests, use short labeled lines instead of one long paragraph.
- When the user names a target device, format, or aspect (landscape/portrait, poster, phone screen), say so in the prompt and pick a matching `size` from the model catalog.

## Specificity policy

- If the user prompt is already specific, normalize it. Do not add creative requirements.
- If the prompt is generic, add tasteful detail only when it materially improves the output.
- Treat `sample-prompts.md` as fully-authored recipes, not the default amount of augmentation.
- For photorealism, include `photorealistic` plus real texture: pores, wrinkles, fabric wear, material grain, everyday imperfect detail.

## Allowed and disallowed augmentation

Allowed for generic prompts:

- composition and framing cues
- intended-use or polish-level hints
- practical layout guidance
- reasonable scene concreteness that supports the request

Do not add:

- extra characters, props, or objects that are not implied
- brand palettes, slogans, or story beats that are not implied
- arbitrary side-specific placement unless the surrounding layout supports it

## Composition and layout

- Specify framing and viewpoint only when it materially helps.
- Call out negative space if the asset needs room for UI or copy.
- Avoid left/right layout decisions unless the user or surrounding layout supports them.
- For people, describe body framing, scale, gaze, and object interactions when they matter.

## Constraints and invariants

- State what must not change (`keep background unchanged`).
- For edits: `change only X; keep Y unchanged`. Repeat invariants on every iteration.

## Text in images

- Put literal text in quotes or ALL CAPS. Specify typography, size, color, and placement.
- Spell uncommon words letter-by-letter if accuracy matters.
- Require verbatim rendering and no extra characters.
- Prefer a catalog quality meant for dense text when the model exposes quality options.

## Input images and references

- Images the user provided with the request must be passed in `generate_image.images`. Silently ignoring them and generating from scratch is a failure mode; only skip them when the user explicitly says they are irrelevant or inspiration-only.
- Inspect each provided image first and describe what is actually in it — subject, visible text and its language, colors, layout. Do not replace its real content with invented content.
- Do not assume every provided image is an edit target.
- Label each image by index and role (`Image 1: edit target`, `Image 2: style reference`, `Image 1: adaptation base`).
- Grounded redesign/adaptation: preserve the image's real content — original text, language, palette, key layout — and prompt only the requested change; list preserved items as constraints/invariants.
- Style/composition/mood references without a request to modify them → generation with `images`.
- Preserve an existing image while changing specific parts → edit with `images`.
- For compositing, describe how the images interact (`place the subject from Image 2 into Image 1`).
- Pass image URLs in `generate_image.images`. Stay within `maxInputImages`.

## Iterate deliberately

- Start with a clean base prompt, then make small single-change edits.
- Re-specify critical constraints when you iterate.
- Prefer one targeted follow-up over rewriting the whole prompt.

## Transparent images

There is no alpha or local cutout tool. If the user wants a cutout, prompt a flat solid chroma-key background (`#00ff00`, or `#ff00ff` for green subjects), forbid shadows/gradients/floor/reflections, and tell the user the result is a keyed image URL.

## Use-case tips

Generate:

- photorealistic-natural: photography language; real texture; avoid over-stylized polish unless requested.
- product-mockup: product/packaging and materials; clean silhouette; verbatim labels if text is required.
- ui-mockup: state fidelity first (shippable mockup or low-fi wireframe); layout and hierarchy, not concept art.
- infographic-diagram: audience, layout flow, explicit labels, verbatim text.
- logo-brand: simple, scalable, strong silhouette, balanced negative space.
- ads-marketing: creative brief — brand position, audience, vibe, scene, exact tagline.
- productivity-visual: name the artifact, canvas, hierarchy, real labels/data, readable type.
- scientific-educational: audience, lesson objective, required labels, scientific constraints.
- illustration-story: panels or scene beats; keep each action concrete.
- stylized-concept: style cues, material finish, rendering approach; do not invent story.
- historical-scene: location/date and period accuracy; constrain clothing, props, environment.

Edit:

- text-localization: change only the text; preserve layout and typography.
- identity-preserve: lock face, body, pose, hair, expression; change only the specified elements.
- precise-object-edit: specify exactly what to remove/replace; keep everything else unchanged.
- lighting-weather: change only light, atmosphere, weather; keep geometry and identity.
- background-extraction: flat chroma-key background; crisp silhouette; generous padding; no restyling.
- style-transfer: preserve palette/texture/brushwork; add `no extra elements`.
- compositing: reference inputs by index; match lighting, perspective, and scale.
- sketch-to-render: preserve layout, proportions, and perspective; do not add new elements.
