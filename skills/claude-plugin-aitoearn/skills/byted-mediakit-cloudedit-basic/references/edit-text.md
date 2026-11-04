# Text

Text editing includes content, position, size, style, orientation, and animation. Treat the MCP contract
below as hard input and readback requirements. Treat the later editorial guidance as quality guidance that
the MCP does not necessarily enforce.

## MCP Text Contract

### Field Placement

Place `content`, `offset_x`, and `offset_y` at the root of each text Add or Update item. Apply the same
rule to `shared.add` and `shared.update`. Do not place these fields inside `text_style`; `text_style`
only carries typography, appearance, orientation, text-box alignment, and text animation.

`content` accepts at most 10,000 characters. `offset_x` and `offset_y` must be integers. These fields
apply only to text elements.

### Adding Text

Every text Add must provide both `horizon` and `vertical`. Use `left`, `center`, or `right` for
`horizon`, and `top`, `center`, or `bottom` for `vertical`. Text does not support `pos_x` or `pos_y`.

Do not provide `width` or `height` when adding text. New horizontal text uses 80% of the canvas width
and derives its height from the rendered content. New vertical text uses 80% of the canvas height and
derives its width from the rendered content. Always provide meaningful `content`; otherwise the editor's
placeholder text may remain.

Use concrete values in tool calls rather than enum-like expressions such as `"center" | "left"`.
For example, the following `edit_element` argument fragment adds one text element; include `project_id` when required by the current schema:

```json
{
  "adds": [
    {
      "type": "text",
      "from_time_ms": 0,
      "duration_ms": 3000,
      "horizon": "center",
      "vertical": "bottom",
      "content": "Hello World",
      "offset_y": -100,
      "text_style": {
        "font_size": 40,
        "text_align": "center"
      }
    }
  ]
}
```

Omit `track_id` to use automatic track selection. Provide an existing compatible text-track ID only when
the text must be placed on that specific track.

### Updating Text Size

For existing horizontal text, only `width` may be updated; do not provide `height`. For existing vertical
text, only `height` may be updated; do not provide `width`. Use `text_style.font_size` to change glyph size.

`font_size` must be an integer from 1 to 1000 and uses the same pixel coordinate scale as the canvas.

### Text Orientation and Alignment

Use `text_style.text_align` for horizontal text, with `left`, `center`, or `right`. Use
`text_style.alignment` for vertical text, with `top`, `center`, or `bottom`. Do not provide both fields
in the same item. Setting either field also selects the corresponding horizontal or vertical orientation.

These fields are alternative writing orientations, not two independent positioning axes. Even
`{"text_align": "center", "alignment": "center"}` is invalid. To center horizontal text on the canvas,
use root-level `horizon: "center"` and `vertical: "center"`, with only `text_style.text_align: "center"`
for alignment inside the text box. Omit both style alignment fields when an update should preserve the
existing orientation and alignment.

For horizontal text, `\n` starts a new row. For vertical text, `\n` starts a new column.

### Text Positioning

Use `horizon` and `vertical` for semantic nine-grid placement. Reserve root-level `offset_x` and `offset_y`
for fine adjustment and collision avoidance. A positive `offset_x` moves text right, and a negative value
moves it left. A positive `offset_y` moves text down, and a negative value moves it up.

The MCP keeps text within a 10-pixel safe inset on every canvas edge. Offsets are clamped to that safe
area. If the rendered text itself is larger than the available safe area, the entire edit batch is rejected.
Reduce the font size, shorten the content, or, when updating existing text, adjust the supported fixed axis.

### Text Style

`text_style` supports `text_res`, `font_type`, `font_size`, `font_color`, `bold`, `italic`, `underline`,
`background_color`, `background_border_size`, `border`, `text_align`, `alignment`, and `text_animation`.

Use the editor's `#RRGGBBAA` format for colors. `background_border_size` must be a non-negative integer
in canvas pixels and expands the background equally on all four sides. A value of `0` keeps the background
at the rendered text bounds.

Use `list_resources` to obtain `font_type` and `text_res` IDs. The default font is `思源黑体 Bold`.
The public MCP contract does not expose text shadows, rich-text spans, or multiple colors inside one text
element. When individual words require different styles, use separate text elements and position them
explicitly.

### Text Animation Contract

`text_style.text_animation` may contain `in`, `out`, and `loop`, and must contain at least one stage.
Each stage must provide both `resource_id` and an integer `duration_ms` of at least 100 milliseconds.

Use `list_resources` to obtain the matching resource category:

- `in`: `enter_animation`
- `out`: `out_animation`
- `loop`: `loop_animation`

The MCP validates the animation structure and minimum stage duration. It does not verify that the combined
animation duration leaves enough time to read the text.

### Shared Text Defaults

In `shared.add` and `shared.update`, keep `content`, `offset_x`, and `offset_y` at the template root and
place styling fields inside `text_style`. Each shared template must declare `type: "text"`. An individual
Add or Update item overrides the corresponding shared value; nested style objects are merged.

Check the merged style as well as each individual item: `shared.update.text_style.text_align` plus an
item's `text_style.alignment` still supplies both fields and is rejected (the same applies to adds).
For a batch mixing horizontal and vertical text, omit alignment fields from the shared template and
set the appropriate one per item. When correcting this error, check both shared and item styles;
retain only the field for the intended orientation. Do not copy an entire readback style into an update
when only a few properties need changing.

### Verification

After adding or updating text, call `inspect_elements` for the affected element IDs. Read `content`,
`offset_x`, and `offset_y` from the element root. Read typography, appearance, orientation, alignment, and
animation from `text_style`.

Text inspection does not expose `pos_x` or `pos_y`. Use `horizon`, `vertical`, `offset_x`, and `offset_y`
as the public positioning contract. Read back the final values instead of treating a successful write as
proof that the requested layout was preserved.

## Editorial Guidance

### Text Size

Derive a visually appropriate integer `font_size` from the canvas. For ordinary subtitles, start around
3.75% of the long edge. As editorial guidance, text intended for normal viewing should generally remain
between 1.5% and 12% of the long edge, depending on its role and viewing context.

Recommended proportions for common text types, using a canvas long edge of 1920:

| Text type | Recommended long-edge ratio | Default | At 1920 long edge |
|---|---:|---:|---:|
| Standard film/documentary subtitles | 3.5%–4.2% | 3.75% | 72 |
| Landscape talking-head subtitles | 3.8%–4.5% | 4.1% | 79 |
| Portrait mobile subtitles | 4.2%–5.0% | 4.5% | 86 |
| Emphasis subtitles for short video | 4.8%–6.0% | 5.4% | 104 |
| Large opening hook | 6%–9% | 7.5% | 144 |
| Main video title | 5.5%–8% | 6.5% | 125 |
| Chapter/transition title | 4%–5.5% | 4.5% | 86 |
| Quote/key point | 3.8%–5.5% | 4.5% | 86 |
| Informational text | 2.6%–3.6% | 3% | 58 |
| Lower-third primary name | 2.5%–3.2% | 2.8% | 54 |
| Lower-third role/description | 1.8%–2.4% | 2.1% | 40 |
| Label/corner badge | 2%–2.8% | 2.4% | 46 |
| CTA text | 3.2%–4.5% | 3.8% | 73 |
| Price/data/countdown | 7%–12% | 9% | 173 |
| Watermark/account | 1.2%–1.8% | 1.5% | 29 |
| Source/note | 1.5%–2.2% | 1.8% | 35 |
| Disclaimer | 1.8%–2.5% | 2.1% | 40 |
| End-card title | 6%–9% | 7% | 134 |
| End-card description | 2.8%–3.8% | 3.2% | 61 |
| Credits | 2.2%–3.2% | 2.6% | 50 |

### Text Style

Basic text styling includes font, decorative text, color, bold, italic, underline, background, and border.
Decorative text is generally suitable for short titles, but not recommended for subtitles, body text, or
explanatory text. Bold and underline are for emphasis. Unless the request or visual context calls for them,
prefer the default font and avoid unnecessary decorative text, bold, italic, or underline styling.

### Text Animation

The following timing rules are editorial quality guidance, not MCP validation rules. Keep the combined
entrance and exit duration within the text display duration, and keep a loop cycle within that duration.
Leave enough stable display time after the entrance animation for the viewer to read the text. As a starting
point, keep stable reading time at least 1.5 times the entrance-animation duration.

### Scene-Aware Text

Determine the role of the text before choosing its position and style. Subtitles make dialogue readable,
informational text identifies people, places, or steps, and display titles create mood and memorable
moments. Do not use all three to repeat the same information. Leave the frame free of text when the
visuals already communicate the intended message.

#### Position

- Place dialogue subtitles at the bottom center by default and limit them to two lines. In landscape video,
  keep the bottom of the text about 6%–10% above the bottom edge of the canvas.
- For portrait video on short-form platforms, move subtitles into the lower-middle region to avoid controls
  on the right and titles or progress indicators at the bottom. Inspect representative frames to ensure the
  text does not cover important gestures, people, or objects.
- Use a lower-left or lower-right information block for names and roles. Place locations, chapter titles,
  and opening keywords in the center or in negative space beside the subject.
- Keep labels near the person, product, or action they describe, but never cover faces, important actions,
  product details, or existing on-screen text.
- Use the nine-grid values to express semantic placement. Reserve `offset_x` and `offset_y` for collision
  avoidance and fine adjustment. The MCP's 10 px inset prevents overflow; it is not a recommended visual
  margin.

#### Color

- Use white or near-white for ordinary subtitles. Add a dark stroke or translucent background when
  needed to preserve readability across both bright and dark shots.
- `text_style.background_color` uses a `#RRGGBBAA` color string. `text_style.background_border_size`
  uses a non-negative integer in Canvas pixels to expand the background equally on all four sides of
  the text; `0` makes the background fit the text's rendered bounds.
- Use color only when it carries meaning, such as identifying a keyword, number, product name, brand,
  correct or incorrect state, or speaker. Because one text element has one `font_color`, split words that
  require distinct colors into separate text elements and position them explicitly.
- Keep one primary accent color throughout a video and add at most one status color when necessary. The same
  color should always communicate the same meaning, so decorative color does not compete with information.
- Color does not replace contrast. If colored text blends into the footage, add a stroke or background, or
  move the text to a clearer region.

#### Decorative Text

- Use decorative text for opening titles, location reveals, chapter cards, brand slogans, festive moments,
  and a small number of key quotes. Keep it brief; Chinese display text should usually contain 2–8 characters.
- Use a clear standard typeface for dialogue subtitles, explanatory body text, instructions, specifications,
  prices, and disclaimers.
- Match the typeface, texture, and animation to the video's tone, and keep the treatment consistent throughout
  the video. Do not add decorative text merely because a resource is available.
- Reduce decoration, or switch to standard text on a background panel, when the footage is visually busy,
  moves quickly, or requires the viewer to follow an important action.

#### Common Choices

| Scenario | Position | Color and style |
| --- | --- | --- |
| Film or documentary dialogue | Bottom center | White standard typeface with a dark stroke or translucent background; no decorative text |
| Talking-head or educational short | Lower-middle region | White body text with a small number of keywords in one accent color |
| Vlog or cinematic location reveal | Center or negative space | Larger type in white, a theme color, or context-appropriate decorative text |
| Person's name and role | Lower left or lower right | Larger name and smaller role; reserve brand color for a small label or bar |
| Promotional benefit, price, or slogan | Center or beside the subject | One key message per shot; use a brand or high-contrast color; short phrases may use decorative text |
| Tutorial annotation or product callout | Near the referenced object | Give colors consistent category meanings; add an arrow or background when needed |
