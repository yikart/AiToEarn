---
name: image-edit
description: Edit an existing image with deterministic pixel operations via image_edit — rotate, flip, crop (free/ratio/circle), resize, compress/format-convert, adjust brightness/saturation/contrast, sharpen, blur, mosaic, rounded corners, negate, overlay, and image watermark. Use when the user asks to 裁剪/旋转/翻转/缩放/压缩/打码/马赛克/加水印/叠图/圆角/调亮/调暗/锐化/模糊 an existing image, convert format, or hit a file-size limit. For AI re-creation, restyle, or adding text, use image-creation instead.
requiredTools:
  - image_edit
  - probe_image_metadata
---

# Image Edit

Edit an existing image with `image_edit` — a local, deterministic pixel pipeline. No AI model and no credits for `image_edit` itself; the auxiliary `probe_image_metadata` call is billed per use. The result is pixel-exact and repeatable.

This is **fine-grained image editing**: unlike AI re-creation (`image-creation`), every operation is pixel-exact. Precision is the premise — free-crop regions, mosaic areas, watermark/overlay positions, and drawn shapes are source-image pixel coordinates, so always work from the real dimensions returned by `probe_image_metadata`, never from guesses.

## Tool

- `image_edit`: one call per image. Pass `url` (source image) plus `operations`, an ordered array of 1–20 operations applied in sequence.
- `probe_image_metadata` (auxiliary): read the source image's real width/height, format, and size with `info_type=metadata` (default). When transparency matters, use `info_type=alpha`; it also returns width/height/format, so do not call metadata first unless size is also required. Each probe is billed; do not call it again for the same URL.
- Output: `url` (edited image), `width`, `height`, `format`, `sizeBytes`.
- `compress` must be the **last** operation (it is the export step).
- Operations that introduce transparency (circle crop, rounded corners) output PNG with alpha.

Do not call other image CLIs, local scripts, or external image APIs.

## When to use

- Deterministic edits that must not alter content: crop to a ratio, resize for a platform, compress under a size limit, convert format
- 加水印 (logo), 叠图 (composite another image), 打码 (mosaic a region), 圆角, rotate/flip
- Adjust brightness/contrast/saturation, sharpen, blur, negate

## When not to use

- Change/restyle content, remove objects, generate variants → `image-creation` (`generate_image`)
- Add text or text watermarks → `generate_image` (AI image editing); this tool renders no text
- Background removal → not supported here; prompt a chroma-key background per `image-creation`, then (future) key it out
- The source is not an image URL the tool can download

## Operations quick reference

| operation | key params | default |
|---|---|---|
| `rotate` | `angle` (1–359, counter-clockwise), `background` | transparent fill |
| `flip` | `direction`: `horizontal` (左右镜像) / `vertical` (上下翻转) | — |
| `crop` | `mode`: `free` + `region{x,y,width,height}`; `ratio` + `ratio:"16:9"` + `position`; `circle` (inscribed circle) | — |
| `resize` | `width`/`height` (one or both), `fit`: cover/contain/fill/inside/outside, `background` | `inside` |
| `compress` | `format`: jpeg/png/webp, `quality` (1–100), `targetMaxBytes` | keep source format, quality 80 |
| `adjust` | `brightness`, `saturation`, `contrast` (multipliers, 1 = unchanged) | — |
| `sharpen` | `strength`: light/medium/strong | — |
| `blur` | `sigma` (0.3–100, higher = blurrier) | — |
| `mosaic` | `region` (default whole image), `pixelSize` (2–200) | — |
| `watermark` | `image.url` (+`width` or `scale`), `position` (9-grid), `margin`, `opacity`, `tile{spacingX,spacingY,rotate}` | bottom-right, opacity 1 |
| `overlay` | `url`, `position`/`margin`, `width`/`scale`, `opacity` | center |
| `draw` | `shapes`: rects (radius, fill), ellipses, lines, points, arrows — each with `color`/`lineWidth` | red, 4px line |
| `rounded-corners` | `radius` (px) | — |
| `negate` | — | — |

`position` is a 9-grid value: `top-left` … `center` … `bottom-right`.

## Workflow

1. Get the source image URL (user attachment, media library, or a previous generation result).
2. Call `probe_image_metadata` for the source dimensions (`info_type=metadata`; use `info_type=alpha` when transparency matters). Pixel-exact coordinates are the premise of fine-grained editing: free-crop regions, mosaic areas, and watermark/overlay placement must be computed from the real width/height — never guessed.
3. Decompose the request into ordered operations. Prefer one call with all steps over many calls; each call re-downloads and re-uploads.
   - Geometry first (crop → resize → rotate), then color (adjust/sharpen/blur), then composition (overlay/watermark), `compress` last.
4. Pick sensible defaults without asking: `compress` quality 80; watermark `margin` ≈ 2% of the shorter side; mosaic `pixelSize` ≈ image width / 30; blur sigma 2–8 for background softening.
5. Call `image_edit` once with the full pipeline.
6. Verify the output (`width`/`height`/`format`/`sizeBytes` match the request, e.g. size limit honored).
7. Iterate by re-running the whole pipeline from the original URL with adjusted params — do not chain edits on the edited output (avoids compounding loss).
8. Report the returned `url` and the final params.

## Recipes

```json
// 裁成 16:9 再加右下角 logo，最后压到 2MB 内
{ "url": "…", "operations": [
  { "operation": "crop", "mode": "ratio", "ratio": "16:9" },
  { "operation": "watermark", "image": { "url": "…", "scale": 0.2 }, "position": "bottom-right", "margin": 20, "opacity": 0.9 },
  { "operation": "compress", "format": "jpeg", "targetMaxBytes": 2000000 }
] }

// 圆形头像（png 透明底）
{ "url": "…", "operations": [
  { "operation": "crop", "mode": "circle" }
] }

// 指定区域打码
{ "url": "…", "operations": [
  { "operation": "mosaic", "region": { "x": 120, "y": 80, "width": 200, "height": 100 }, "pixelSize": 12 }
] }
```

## Errors

- 下载失败 / 超过 20MB → check the URL is a publicly readable image
- 无法压缩到目标体积 → raise `targetMaxBytes`, drop `format` conversion, or accept lower quality
- 区域越界 → coordinates are source-image pixels; call `probe_image_metadata` first to get dimensions
