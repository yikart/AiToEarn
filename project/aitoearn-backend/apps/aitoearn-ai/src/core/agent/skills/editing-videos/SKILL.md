---
name: editing-videos
description: Video editing using Volcengine Track structure. Supports cutting, trimming, adding text, stickers, audio, filters, effects, transitions, multi-clip compositions, speed adjustment, watermark removal. 视频剪辑、裁剪视频、添加文字、添加水印、添加音频、视频滤镜、视频特效、视频转场、多片段拼接、调整速度、去水印。
---

# Video Editing with Track Structure

Performs video editing using the Volcengine cloud editing API with native Track structure.

## ⚠️ CRITICAL: ALL PosX/PosY Are Top-Left Coordinates

**ALL PosX/PosY values in this API are TOP-LEFT corner coordinates, NOT center point!**

This applies to ALL filters: transform, crop, delogo, etc.

**For full-screen video display, you MUST use:**
```json
{ "Type": "transform", "PosX": 0, "PosY": 0, "Width": <canvas_width>, "Height": <canvas_height> }
```

**NEVER use canvas center coordinates (like 640, 360) for PosX/PosY!**
- Using center coordinates will cause video to display off-canvas
- The coordinate (0, 0) is the top-left corner of the canvas

## When to Use

Use this skill when:

- Cutting or trimming video segments
- Adding text, watermarks, or stickers to videos
- Adding or replacing audio tracks
- Applying filters or visual effects
- Merging multiple video clips
- Adding transitions between clips
- Changing video playback speed
- Removing watermarks (logo blur)

## Workflow

### Step 1: Get Video Information (Required)

**ALWAYS call `uploadAndGetVid` first** to:

1. Upload video to Volcengine cloud
2. Get VID for video source reference (format: `vid://xxx`)
3. Get Duration for time calculations (in seconds)
4. Get Dimensions (width, height) for Canvas setup

If you only need metadata without editing (e.g., for display purposes), use `probeVideoMetadata` instead.

### Step 2: Build EditParam

Construct your `EditParam` following the structure below.

### Step 3: Submit Task

Call `submitDirectEditTask` with Canvas, Output (optional), and Track.

### Step 4: Poll for Results

1. First check: Wait **90 seconds** after submission
2. Subsequent checks: Wait **30 seconds** between polls
3. Call `getVideoEditTaskStatus` to check progress
4. **Maximum wait time: 20 minutes**

### Step 5: Return Results

On completion, return the output video URL to user.

## EditParam Structure

```json
{
  "Canvas": { "Width": 1920, "Height": 1080 },
  "Output": { "Fps": 30, "Codec": { "VideoCodec": "h264" } },
  "Track": [
    [{ "Type": "video", "Source": "vid://xxx", "TargetTime": [0, 5000] }],
    [{ "Type": "text", "Text": "Hello", "TargetTime": [0, 5000], "Extra": [] }]
  ]
}
```

**Canvas** (optional):
- If omitted, auto-detected from the primary video source dimensions
- If provided manually, MUST match getVideoInfo/uploadAndGetVid output
- Width = horizontal pixels, Height = vertical pixels
- Example: 1280x720 video → { Width: 1280, Height: 720 } — NOT { Width: 720, Height: 1280 }
```

**Time unit**: All time values are in **MILLISECONDS** (1 second = 1000 ms)

## Track Structure

Track is a **2D array** `Track[layerIndex][elementIndex]`:

- Outer array: Rendering layers (higher index = higher layer, renders on top)
- Inner array: Elements on the same track

## Element Types

### video

```json
{
  "Type": "video",
  "Source": "vid://your_vid",
  "TargetTime": [0, 5000],
  "Extra": [
    { "Type": "trim", "StartTime": 10000, "EndTime": 30000 }
  ]
}
```

### audio

```json
{
  "Type": "audio",
  "Source": "vid://your_audio_vid",
  "TargetTime": [0, 10000],
  "Extra": [
    { "Type": "a_volume", "Volume": 0.5 }
  ]
}
```

**When to use audio elements**:

- Adding background music to video
- Adding voiceover/narration
- Adjusting audio volume separately from video
- Replacing original audio with different audio

**When NOT to use audio elements**:

- Simple video concatenation - video elements already contain their audio tracks
- When you want to keep the original video audio unchanged

### image

```json
{
  "Type": "image",
  "Source": "mid://your_image_mid",
  "TargetTime": [0, 3000],
  "Extra": [
    { "Type": "transform", "PosX": 100, "PosY": 100, "Width": 200, "Height": 200 }
  ]
}
```

### text

```json
{
  "Type": "text",
  "Text": "Your Text Here",
  "TargetTime": [0, 5000],
  "FontType": "SY_Black",
  "FontSize": 120,
  "FontColor": "#FFFFFFFF",
  "AlignType": 1,
  "Extra": [
    { "Type": "transform", "PosX": 60, "PosY": 440, "Width": 1800, "Height": 200 }
  ]
}
```

### subtitle

```json
{
  "Type": "subtitle",
  "Text": "http://example.com/subtitle.srt",
  "TargetTime": [0, 20000],
  "FontType": "ALi_PuHui",
  "FontSize": 60,
  "Extra": [
    { "Type": "transform", "PosX": 40, "PosY": 550, "Width": 1200, "Height": 150 }
  ]
}
```

## Filter Types (Extra)

### transform - 2D Transform

Controls element position, size, rotation, and opacity on the canvas.

**IMPORTANT**:

- `PosX` and `PosY` are the **TOP-LEFT corner** coordinates of the element relative to the canvas top-left corner
- They are NOT center point coordinates
- Rotation is performed around the element's center point

**Parameters**:

- `PosX`: X coordinate of element's **top-left corner** (pixels)
- `PosY`: Y coordinate of element's **top-left corner** (pixels)
- `Width`: Element width on canvas (pixels)
- `Height`: Element height on canvas (pixels)
- `Rotation`: Rotation angle [-360, 360], clockwise is positive (optional)
- `Alpha`: Opacity [0,1], 0 is transparent (optional)

**Basic Example** (fill canvas):

```json
{ "Type": "transform", "PosX": 0, "PosY": 0, "Width": 1920, "Height": 1080 }
```

**Rotation Example** (rotate 1280x720 video 90° to fit 720x1280 canvas):

When rotating, the element rotates around its center. To fill a 720x1280 canvas with a 1280x720 video rotated 90°:

- After rotation, the video's display size becomes 720x1280
- The center should be at canvas center (360, 640)
- Calculate: PosX = 360 - 1280/2 = -280, PosY = 640 - 720/2 = 280

```json
{ "Type": "transform", "PosX": -280, "PosY": 280, "Width": 1280, "Height": 720, "Rotation": 90 }
```

**Centering Formula**:

- To center an element horizontally: `PosX = (CanvasWidth - ElementWidth) / 2`
- To center an element vertically: `PosY = (CanvasHeight - ElementHeight) / 2`

Example: Center a 600x60 subtitle on 720x1280 canvas:

- PosX = (720 - 600) / 2 = 60
- PosY = 1280 - 100 = 1180 (near bottom)

**Common Mistakes**:

- WRONG: Using canvas center (360, 640) or (640, 360) as PosX/PosY - this places the element's top-left at center, causing it to go off-canvas
- WRONG: Omitting transform for full-screen video elements - video may not display correctly without explicit positioning
- WRONG: Creating separate audio tracks for each video clip in simple concatenation - video elements already contain their audio
- CORRECT: Use (0, 0) for top-left alignment when video should fill the canvas
- CORRECT: Only add audio tracks when you need background music, voiceover, or volume adjustment

### trim - Time Trim

```json
{ "Type": "trim", "StartTime": 5000, "EndTime": 15000 }
```

### crop - Area Crop

```json
{ "Type": "crop", "PosX": 100, "PosY": 100, "Width": 800, "Height": 600 }
```

### speed - Playback Speed

```json
{ "Type": "speed", "Speed": 2.0 }
```

### transition - Transition Effect

```json
{ "Type": "transition", "Source": "1182376", "Duration": 1000 }
```

### lut_filter - Color Filter

```json
{ "Type": "lut_filter", "TargetTime": [0, 5000], "Source": "1184003", "Intensity": 0.8 }
```

### video_animation - Video Animation

```json
{ "Type": "video_animation", "AnimRes": "1180337", "AnimStartTime": 0, "AnimEndTime": 1000 }
```

### a_volume - Audio Volume

```json
{ "Type": "a_volume", "Volume": 0.5 }
```

### a_fade - Audio Fade

```json
{ "Type": "a_fade", "FadeIn": 2000, "FadeOut": 2000 }
```

### delogo - Logo Blur

```json
{ "Type": "delogo", "TargetTime": [0, 10000], "PosX": 1700, "PosY": 50, "Width": 200, "Height": 80, "Sigma": 30, "Radius": 30 }
```

## Resource IDs

### Filter IDs (lut_filter)

| ID      | Name      | Description |
| ------- | --------- | ----------- |
| 1184003 | Clear     | Enhanced clarity |
| 1184004 | Afternoon | Warm afternoon tone |
| 1183995 | Vintage   | Retro film look |
| 1183993 | Friends   | Friends TV show style |

### Transition IDs

| ID      | Name       | Description |
| ------- | ---------- | ----------- |
| 1182376 | CircleOpen | Circle wipe open |
| 1182360 | RotateZoom | Rotate and zoom |
| 1182370 | DoorOpen   | Door opening reveal |
| 1182379 | ClockWipe  | Clock sweep wipe |

### Video Animation IDs

| ID      | Name    | Type |
| ------- | ------- | ---- |
| 1180337 | FadeIn  | In   |
| 1180382 | FadeOut | Out  |
| 1180335 | Shrink  | In   |
| 1180338 | ZoomIn  | In   |

### Font IDs

| ID          | Name           |
| ----------- | -------------- |
| SY_Black    | Source Han Sans Black |
| ALi_PuHui   | Alibaba PuHuiTi |
| PM_ZhengDao | Pangmen Zhengdao Title |

## Examples

### Example 1: Simple Video Concatenation (Most Common)

```json
{
  "Canvas": { "Width": 1920, "Height": 1080 },
  "Track": [[
    {
      "Type": "video",
      "Source": "vid://video1",
      "TargetTime": [0, 5000],
      "Extra": [
        { "Type": "transform", "PosX": 0, "PosY": 0, "Width": 1920, "Height": 1080 }
      ]
    },
    {
      "Type": "video",
      "Source": "vid://video2",
      "TargetTime": [5000, 12000],
      "Extra": [
        { "Type": "transform", "PosX": 0, "PosY": 0, "Width": 1920, "Height": 1080 }
      ]
    },
    {
      "Type": "video",
      "Source": "vid://video3",
      "TargetTime": [12000, 20000],
      "Extra": [
        { "Type": "transform", "PosX": 0, "PosY": 0, "Width": 1920, "Height": 1080 }
      ]
    }
  ]]
}
```

**Key points for video concatenation**:

- Transform with `PosX: 0, PosY: 0` is REQUIRED for full-screen display
- NO separate audio tracks - video elements already contain their audio
- All video clips on the same track (single inner array)
- Sequential TargetTime: video2 starts where video1 ends

### Example 2: Concatenate Videos with Transition

```json
{
  "Canvas": { "Width": 1920, "Height": 1080 },
  "Track": [[
    {
      "Type": "video",
      "Source": "vid://video1",
      "TargetTime": [0, 5000],
      "Extra": [
        { "Type": "transform", "PosX": 0, "PosY": 0, "Width": 1920, "Height": 1080 },
        { "Type": "transition", "Source": "1182376", "Duration": 1000 }
      ]
    },
    {
      "Type": "video",
      "Source": "vid://video2",
      "TargetTime": [4000, 9000],
      "Extra": [
        { "Type": "transform", "PosX": 0, "PosY": 0, "Width": 1920, "Height": 1080 }
      ]
    }
  ]]
}
```

**Note**: With transitions, TargetTime values overlap (video2 starts at 4000, video1 ends at 5000).

### Example 3: Trim Video (10s to 30s)

```json
{
  "Canvas": { "Width": 1920, "Height": 1080 },
  "Track": [[
    {
      "Type": "video",
      "Source": "vid://xxx",
      "TargetTime": [0, 20000],
      "Extra": [
        { "Type": "trim", "StartTime": 10000, "EndTime": 30000 }
      ]
    }
  ]]
}
```

### Example 4: Add Text Watermark

```json
{
  "Canvas": { "Width": 1920, "Height": 1080 },
  "Track": [
    [{ "Type": "video", "Source": "vid://xxx", "TargetTime": [0, 10000] }],
    [{
      "Type": "text",
      "Text": "@MyChannel",
      "TargetTime": [0, 10000],
      "FontType": "SY_Black",
      "FontSize": 60,
      "FontColor": "#FFFFFFFF",
      "Extra": [
        { "Type": "transform", "PosX": 1700, "PosY": 50, "Width": 200, "Height": 60 }
      ]
    }]
  ]
}
```

### Example 5: Add Background Music

```json
{
  "Canvas": { "Width": 1920, "Height": 1080 },
  "Track": [
    [{ "Type": "video", "Source": "vid://video", "TargetTime": [0, 30000] }],
    [{
      "Type": "audio",
      "Source": "vid://music",
      "TargetTime": [0, 30000],
      "Extra": [
        { "Type": "a_volume", "Volume": 0.3 }
      ]
    }]
  ]
}
```

### Example 6: Apply Filter

```json
{
  "Canvas": { "Width": 1920, "Height": 1080 },
  "Track": [[
    {
      "Type": "video",
      "Source": "vid://xxx",
      "TargetTime": [0, 10000],
      "Extra": [
        { "Type": "lut_filter", "TargetTime": [0, 10000], "Source": "1183993", "Intensity": 0.8 }
      ]
    }
  ]]
}
```

### Example 7: Logo Blur (Watermark Removal)

```json
{
  "Canvas": { "Width": 1920, "Height": 1080 },
  "Track": [[
    {
      "Type": "video",
      "Source": "vid://xxx",
      "TargetTime": [0, 10000],
      "Extra": [
        { "Type": "delogo", "TargetTime": [0, 10000], "PosX": 1700, "PosY": 50, "Width": 200, "Height": 80, "Sigma": 30, "Radius": 30 }
      ]
    }
  ]]
}
```

### Example 8: Rotate Landscape Video to Portrait

Convert a 1280x720 (landscape) video to 720x1280 (portrait) canvas:

```json
{
  "Canvas": { "Width": 720, "Height": 1280 },
  "Track": [[
    {
      "Type": "video",
      "Source": "vid://xxx",
      "TargetTime": [0, 10000],
      "Extra": [
        {
          "Type": "transform",
          "PosX": -280,
          "PosY": 280,
          "Width": 1280,
          "Height": 720,
          "Rotation": 90
        }
      ]
    }
  ]]
}
```

**Calculation**:

- Original video: 1280x720, Canvas: 720x1280
- After 90° rotation, video displays as 720x1280
- Rotation center = (PosX + Width/2, PosY + Height/2) should equal canvas center (360, 640)
- PosX = 360 - 1280/2 = -280
- PosY = 640 - 720/2 = 280

## Important Notes

- **Always call uploadAndGetVid first** - Required for VID and dimensions
- **Time unit is milliseconds** - 1 second = 1000 ms
- **Track layers render bottom to top** - Track[0] is bottom, Track[1] is above it
- **Transition duration must < clip duration**
- **Subtitle tracks must be separate** - Each subtitle occupies one track, max 10 subtitle tracks
- **Maximum processing time: 20 minutes**
- **Full-screen video requires transform with PosX: 0, PosY: 0** - Do NOT use canvas center coordinates like (640, 360) or (360, 640)
- **Video elements already contain audio** - Do NOT create separate audio tracks for simple video concatenation; only use audio tracks for background music, voiceover, or volume adjustment
- **Canvas is optional** — omit it for auto-detection from video sources; only specify manually for custom canvas sizes
