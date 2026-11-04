## Element Position and Canvas

Non-text visual elements use `pos_x` and `pos_y` for precise placement on the canvas, where `(0, 0)` starts at the top-left corner. Text uses `horizon`, `vertical`, and root-level `offset_x`/`offset_y` instead.

- `flip_x` mirrors horizontally and `flip_y` mirrors vertically, as defined by the current tool schema.

## Canvas Size

### Initializing the Canvas

Use `create_project` and `update_project` to initialize or change the canvas size.

- When calling `create_project`, pass `canvas` only if the user explicitly specifies a canvas size. Otherwise, do not initialize the canvas size proactively.
- A user-specified canvas size takes precedence over scenario constraints and material dimensions. Do not override it because a scenario or material differs unless the user requests a change.

### Inferring the Canvas from Context

Before formal editing, if the user did not specify a canvas size, `update_project` may update the canvas based on context. Apply this priority order:

1. If a scenario guide specifies how to set the canvas, determine the canvas from that constraint and the dimensions of the user’s materials.
2. If no scenario constraint applies and all materials are landscape or all are portrait, default to `16:9` or `9:16`, respectively.

If only an orientation or aspect ratio is known, with no exact dimensions, refer to [Standard Canvas Sizes](#standard-canvas-sizes). If orientations are mixed and no applicable rule exists, do not force a canvas size; preserve the editor’s behavior of inferring it from added elements.

After setting a context-derived canvas, tell the user the selected dimensions and rationale in the final response.

Changing the canvas size does not resize elements. After the change, use `inspect_elements` to read element sizes, positions, and text styles. For video/image elements, use `fit` to adapt them to the canvas. The following is an `edit_element` argument fragment; supply `project_id` when required by the current schema:

```json
{
  "updates": [
    {
      "id": "video-or-image-element-id",
      "fit": "contain"
    }
  ]
}
```

### Standard Canvas Sizes

The following dimensions are expressed as width × height. Landscape is `16:9`; portrait is `9:16`:

- 720P: 1280 × 720 or 720 × 1280.
- 1080P: 1920 × 1080 or 1080 × 1920.
- 4K: 3840 × 2160 or 2160 × 3840.

## Vertical and Horizon

`vertical` is mutually exclusive with `pos_y`, and `horizon` is mutually exclusive with `pos_x`. Use `vertical` and `horizon` for nine-grid layouts. Except for text elements, their calculation depends on both the element dimensions and canvas dimensions.

New text requires both `horizon` and `vertical`; do not pass `width` or `height` when adding text.
New horizontal text uses 80% of the canvas width; new vertical text uses 80% of the canvas height.
Updates do not reapply these defaults; follow the [text guide](edit-text.md) for supported size changes.
Semantic text placement automatically keeps a
10 px safe inset on every Canvas edge, and offsets cannot move the result out of bounds. Non-text
elements continue to use the full Canvas for placement calculations.

## Canvas Placement with `fit`

- `fit` applies only to video/image elements. Do not pass it for text, audio, effects, LUTs, or transitions.

`fit` places video/image elements according to the canvas and source material dimensions. Use `contain` to show the complete source or `cover` to fill the canvas with cropping. New video/image elements default to `contain` when no dimensions, position, or alignment are supplied. Do not combine `fit` with `width`, `height`, `pos_x`, `pos_y`, `horizon`, or `vertical`.

## Rotation

`rotation` uses degrees in the range -360 to 360; positive values rotate clockwise around the element center.
