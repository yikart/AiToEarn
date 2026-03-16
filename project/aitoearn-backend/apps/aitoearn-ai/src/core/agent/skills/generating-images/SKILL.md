---
name: generating-images
description: Generates images using AI models (Gemini). AI图像生成、文生图、生成图片。
---

# Image Generation

Generates images using Gemini AI model (default: gemini-3.1-flash-image-preview, compatible: gemini-3-pro-image-preview).

## Parameters

### Required

- `prompt`: Creative description of the image

### Optional

- `imageUrls`: Reference image URLs for editing
- `imageSize`: Output resolution - "1K", "2K", "4K"
- `aspectRatio`: "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"

## Workflow

1. Call `generateImage` with prompt and optional parameters
2. Image generation is synchronous - returns URL immediately

## Multiple Images Strategy

- Call `generateImage` sequentially
- Display each image immediately with progress (e.g., "已生成 1/3")
- Use markdown `![desc](url)` format

## Prompt Writing Guide

### Core Principle

**Describe the scene, don't just list keywords.** Narrative descriptions always outperform keyword lists.

### Scene Strategies

#### 1. Photorealistic Scenes

Include photography terms: lens type, lighting, atmosphere

- Example: `A photorealistic close-up portrait of an elderly Japanese ceramicist with deep, sun-etched wrinkles and a warm, knowing smile. He is carefully inspecting a freshly glazed tea bowl.`

#### 2. Stylized Illustrations

Specify style, features, and background requirements

- Example: `A kawaii-style sticker of a happy red panda wearing a tiny bamboo hat. It's munching on a green bamboo leaf. The design features bold, clean outlines, simple cel-shading, and a vibrant color palette.`

#### 3. Text-Accurate Images

Specify font style, design approach, and color scheme

- Example: `Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'. The text should be in a clean, bold, sans-serif font. The color scheme is black and white.`

#### 4. Product Photography

Describe studio setup, lighting configuration, camera angle in detail

- Example: `A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug in matte black, presented on a polished concrete surface.`

#### 5. Minimalist Design

Subject positioning strategy, reserve negative space

- Example: `A minimalist composition featuring a single, delicate red maple leaf positioned in the bottom-right of the frame. The background is a vast, empty off-white canvas.`

#### 6. Sequential Art (Comics/Storyboards)

Emphasize character consistency and scene description

- Example: `Make a 3 panel comic in a gritty, noir art style with high-contrast black and white inks. Put the character in a humorous scene.`

#### 7. Search-Grounded Graphics

Combine with search tools to get current events/weather/trends for timely content

- Example: `Make a simple but stylish graphic of last night's Arsenal game in the Champion's League`

## Language Guidelines

Text in generated images MUST match user's language.

## Examples

### Photorealistic Scene

```
generateImage:
  prompt: "A photorealistic close-up portrait of an elderly Japanese ceramicist with deep, sun-etched wrinkles and a warm, knowing smile. He is carefully inspecting a freshly glazed tea bowl."
  aspectRatio: "3:4"
  imageSize: "2K"
```

### Stylized Illustration

```
generateImage:
  prompt: "A kawaii-style sticker of a happy red panda wearing a tiny bamboo hat. It's munching on a green bamboo leaf. The design features bold, clean outlines, simple cel-shading, and a vibrant color palette."
  aspectRatio: "1:1"
  imageSize: "1K"
```

### Product Photography

```
generateImage:
  prompt: "A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug in matte black, presented on a polished concrete surface."
  aspectRatio: "1:1"
  imageSize: "2K"
```

### Minimalist Design

```
generateImage:
  prompt: "A minimalist composition featuring a single, delicate red maple leaf positioned in the bottom-right of the frame. The background is a vast, empty off-white canvas."
  aspectRatio: "16:9"
  imageSize: "2K"
```

### Image Editing

```
generateImage:
  prompt: "Add a vibrant rainbow to the sky, keep all other elements unchanged"
  imageUrls: ["source.jpg"]
```
