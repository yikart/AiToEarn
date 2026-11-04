---
name: image-creation
description: Generate or edit raster images for social posts, product shots, covers, mockups, and variants. Use when the user asks to create, edit, restyle, adapt, or redesign images based on provided images, or batch-generate bitmap images, or mentions posters, covers, product photos, illustrations, or reference-image generation.
allowed-tools:
  - list_image_models
  - generate_image
---

# Image Creation

Generate or edit raster images with `list_image_models` and `generate_image`.

Shared prompt guidance: `references/prompting.md`.
Copy/paste recipes: `references/sample-prompts.md`.

## Tools

- `list_image_models`: call first. Use only returned `name`, `sizes`, `qualities`, `styles`, `maxInputImages`, and pricing. Do not invent model ids or sizes.
- `generate_image`: `prompt` required; `model` optional (omit to use the default `gpt-image-2.5-sunburst`); optional `images`, `size`, `quality`, `style`.
  - Default model: `gpt-image-2.5-sunburst` when the catalog lists it; otherwise use another GPT Image 2.5 model or the closest available model.
  - Default size when the user has no size preference (1080p class): 16:9 -> `1536x864`, 9:16 -> `864x1536`, 1:1 -> `1024x1024`; otherwise pick the catalog size matching the requested aspect.
  - No `images` → new generation.
  - One or more `images` (URLs) → reference/edit generation. Do not exceed `maxInputImages`.
- Credit (积分) estimate runs automatically. If the user must confirm, wait. Do not retry a rejected cost.

Do not call other image APIs, CLIs, or local scripts.

## When to use

- New image: concept, product shot, cover, poster, social asset, mockup
- New image guided by reference images (style, composition, mood, subject)
- Adapt or redesign an image or design the user provided (change format, layout, device framing, restyle) while keeping its content
- Edit an existing image (object change, background, lighting, compositing, restyle)
- Many assets or variants for one request

## When not to use

- Matching an existing SVG/vector icon or logo system
- Simple shapes, diagrams, or icons that should be SVG, HTML/CSS, or canvas
- A small edit when the source is already an editable native file
- The user wants deterministic code-native output instead of a bitmap

## Decision tree

1. **Intent:** were images provided, and what role do they play?
2. **Execution:** one asset or many assets/variants?

Intent:

- User provided images with the request → the images MUST be passed in `images`. Generate from scratch without them only if the user explicitly says the images are irrelevant or inspiration-only. Ignoring provided images and inventing content is a failure mode.
  - User wants to change an existing image while keeping parts of it → **edit**. Pass those image URLs in `images` and list invariants in the prompt.
  - User gives images as style/composition/mood/subject references → **generate with references**. Still pass URLs in `images`, and label each role in the prompt.
  - User gives an image or design to adapt, redesign, or translate into another format/framing → **generate with references**, grounded in the image's real content (see Workflow step 2).
- No images → **generate**.

Execution:

- Distinct assets need distinct `generate_image` calls and distinct prompts.
- Variants of one prompt still use one call per variant, with a single targeted change in each prompt.

Assume a new image unless the user clearly asks to change an existing one.

## Workflow

1. Call `list_image_models` and pick `model` / `size` / `quality` / `style` from that catalog. When the user has no model preference, use `gpt-image-2.5-sunburst` if listed; otherwise use another GPT Image 2.5 model or the closest available model. If the user names a target device, format, or aspect (e.g. landscape, poster, phone), pick the size that matches it; otherwise use the default 1080p-class size (16:9 -> `1536x864`, 9:16 -> `864x1536`, 1:1 -> `1024x1024`). **Default-confirmation rule**: when the user has no preference, use these defaults directly. Before generating with any non-default model, size, quality, or style, briefly tell the user why the default is not suitable and which option you plan to use, then wait for their explicit confirmation; never switch silently. If the user already specified that model/size/quality/style in their request, their choice stands and no extra confirmation is needed.
2. Inspect every image the user provided: identify its actual subject, visible text and its language, colors, and layout. The prompt must describe what is really in the image — never substitute invented content for it.
3. Collect prompt, verbatim text, constraints/avoid list, and any input image URLs.
4. Label every input image role: edit target, style reference, compositing insert, or adaptation base.
5. If the request is a photo, illustration, sprite, product image, or other raster asset, use `generate_image`. If it should match repo-native SVG/vector/code, edit those instead.
6. Shape the prompt:
   - Specific user prompt → normalize, do not add creative requirements.
   - Generic prompt → add only detail that materially improves the result. See `references/prompting.md`.
   - Grounded on a user image → reproduce its real content faithfully (original text and language, palette, layout) and describe only the requested changes. List what must be preserved as invariants.
7. Call `generate_image` once per requested asset or variant.
8. Inspect the result: subject, style, composition, text accuracy, invariants.
9. Iterate with one targeted change. Repeat invariants on every edit.
10. Report: write the returned image URL(s) verbatim in your reply (the frontend renders them as previews), plus the final prompt, model, and size. Omitting the URL is a failed delivery. State briefly what came from the input images and what was changed; do not append generic advice unrelated to the images.

## Transparent images

This runtime has no alpha or background-removal tool. `generate_image` returns an image URL, not a local transparent PNG.

If the user asks for a cutout or transparent background:

1. Prompt a perfectly flat solid chroma-key background (`#00ff00` by default; `#ff00ff` for green subjects).
2. Require no shadows, gradients, floor, reflections, or key color inside the subject.
3. Tell the user the result is a keyed image URL they can cut out later. Do not claim a true alpha PNG.

## Prompt schema

```text
Use case: <taxonomy slug>
Asset type: <where the asset will be used>
Primary request: <user's main prompt>
Input images: <Image 1: role; Image 2: role> (optional)
Scene/backdrop: <environment>
Subject: <main subject>
Style/medium: <photo/illustration/3D/etc>
Composition/framing: <wide/close/top-down; placement>
Lighting/mood: <lighting + mood>
Color palette: <palette notes>
Materials/textures: <surface details>
Text (verbatim): "<exact text>"
Constraints: <must keep/must avoid>
Avoid: <negative constraints>
```

Use only the lines that help. For edits, list invariants: `change only X; keep Y unchanged`.

## Use-case taxonomy

Generate: `photorealistic-natural`, `product-mockup`, `ui-mockup`, `infographic-diagram`, `scientific-educational`, `ads-marketing`, `productivity-visual`, `logo-brand`, `illustration-story`, `stylized-concept`, `historical-scene`.

Edit: `text-localization`, `identity-preserve`, `precise-object-edit`, `lighting-weather`, `background-extraction`, `style-transfer`, `compositing`, `sketch-to-render`.

## Examples

### Generation

```text
Use case: product-mockup
Asset type: landing page hero
Primary request: a minimal hero image of a ceramic coffee mug
Style/medium: clean product photography
Composition/framing: wide composition with usable negative space for page copy if needed
Lighting/mood: soft studio lighting
Constraints: no logos, no text, no watermark
```

### Edit

```text
Use case: precise-object-edit
Asset type: product photo background replacement
Primary request: replace only the background with a warm sunset gradient
Input images: Image 1: edit target
Constraints: change only the background; keep the product and its edges unchanged; no text; no watermark
```
