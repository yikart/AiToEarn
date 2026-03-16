---
name: generating-videos
description: Generates videos using Grok (preferred) and Google Veo 3.1 models. Supports text-to-video, image-to-video, first-last-frame, video extension, and reference images. AI视频生成、文生视频、图生视频、首尾帧生成、视频拓展。
---

# Video Generation

Generates videos using **Grok** (preferred) and **Google Veo 3.1** models.

## Model Selection Strategy

**CRITICAL**: Always prefer Grok unless the task requires Veo-specific features.

| Scenario | Use Model | Reason |
|----------|-----------|--------|
| Video ≤ 15s (text-to-video / image-to-video) | **Grok** (preferred) | Grok supports 1-15s directly, faster and cost-effective |
| Video 16-36s (continuous) | **Veo** | Requires Video Extension, Grok max is 15s |
| First-last-frame storyboard | **Veo** | Grok does not support first-last-frame |
| Reference images (style consistency) | **Veo** (generate-preview) | Grok does not support reference images |
| User explicitly requests Veo | **Veo** | User preference |
| User explicitly requests Grok | **Grok** | User preference |

## Language Rule

**CRITICAL**: Video prompts MUST be generated in:

1. **User's language** - If user writes in Chinese, generate Chinese prompts; if in English, generate English prompts
2. **User-specified language** - If user explicitly requests a specific language, use that language

---

## Grok Video Models (Preferred)

| Model | Speed | Quality | Max Duration | Use Case |
|-------|-------|---------|--------------|----------|
| grok-imagine-video | Fast | Good | 15s | Default - Most use cases |

### Grok Parameters

| Parameter   | Values                                          | Default | Description |
|-------------|-------------------------------------------------|---------|-------------|
| duration    | 1-15                                            | -       | Video duration in seconds |
| resolution  | 480p, 720p                                      | 720p    | Video resolution |
| aspectRatio | 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3           | 9:16    | Video aspect ratio |
| imageUrl    | string                                          | -       | Reference image URL for image-to-video |

### Grok Generation Modes

| Mode | Parameters | Description |
|------|-----------|-------------|
| Text-to-video | prompt only | Generate video from text description |
| Image-to-video | prompt + imageUrl | Generate video using a reference image |

### Grok Workflow

1. Call `generateVideoWithGrok` with prompt and optional parameters
2. Poll `getGrokVideoStatus` every 30 seconds
3. Maximum wait: 5 minutes

---

## Veo 3.1 Models (Advanced Features)

Use Veo when you need: video extension, first-last-frame, or reference images.

| Model                         | Speed | Quality | Video Extension | Reference Images | Use Case                         |
| ----------------------------- | ----- | ------- | --------------- | ---------------- | -------------------------------- |
| veo-3.1-fast-generate-preview | Fast  | Good    | Yes             | No               | Default Veo - Most use cases     |
| veo-3.1-generate-preview      | Slow  | Better  | Yes             | Yes (max 3)      | Best quality + all features      |
| veo-3.1-fast-generate-001     | Fast  | Good    | No              | No               | Simple generation (no extension) |
| veo-3.1-generate-001          | Slow  | Better  | No              | No               | Higher quality (no extension)    |

**Veo Model Selection**:

- **Default Veo**: Use `veo-3.1-fast-generate-preview` (supports video extension)
- **Use non-preview models when**: User explicitly requests and doesn't need video extension
- **Use non-fast models when**: User explicitly requests higher quality

### Veo Parameters

| Parameter      | Values            | Default | Description                              |
| -------------- | ----------------- | ------- | ---------------------------------------- |
| duration       | 4, 6, 8           | 8       | Video duration in seconds                |
| resolution     | 720p, 1080p, 4000 | 720p    | Video resolution (1080p/4K takes longer) |
| aspectRatio    | 16:9, 9:16        | 9:16    | Video aspect ratio (vertical by default for social media) |
| negativePrompt | string            | -       | What to exclude from the video           |
| seed           | number            | -       | Random seed for reproducibility          |

**Notes**:

- Video extension only supports 720p
- Reference images require 8-second duration

---

## Prompt Guide (applies to both Grok and Veo)

### Prompt Structure

`[Subject & Background] + [Action] + [Style] + [Camera] + [Atmosphere] + [Audio]`

### 1. Subject & Background (主题与背景)

Specify your main focus (object, person, animal) and environmental context.

**Examples**:

- "A young woman with long black hair wearing a red dress" / "一位长发黑发、身穿红裙的年轻女子"
- "White concrete apartment building with organic shapes and lush greenery" / "白色混凝土公寓楼，有机形状，绿植茂盛"

### 2. Action (动作)

Describe what the subject is doing—walking, running, transforming, etc.

**Examples**:

- "walks slowly towards the camera" / "缓缓走向镜头"
- "transforms from liquid to solid" / "从液态变为固态"

### 3. Style (风格)

Add aesthetic direction using keywords.

**Common Styles**:

- Film noir / 黑色电影
- Surrealism / 超现实主义
- Cyberpunk / 赛博朋克
- 3D cartoon animation / 3D卡通动画
- Cinematic documentary / 电影纪录片
- Japanese anime / 日系动漫

### 4. Camera Work (镜头)

Control perspective and movement.

**Camera Angles**:

- Aerial shot / 航拍镜头
- POV (Point of View) / 第一人称视角
- Close-up / 特写
- Wide angle / 广角
- Low angle / 低角度
- Bird's eye view / 鸟瞰

**Camera Movements**:

- Tracking shot / 跟踪镜头
- Pan left/right / 左右平移
- Dolly in/out / 推拉镜头
- Static shot / 固定镜头

### 5. Atmosphere (氛围)

Specify lighting and color mood.

**Examples**:

- "warm golden hour lighting" / "温暖的黄金时段光线"
- "cool blue tones" / "冷蓝色调"
- "neon-lit cyberpunk atmosphere" / "霓虹灯赛博朋克氛围"
- "foggy moonlight" / "雾蒙蒙的月光"

---

## Audio Generation Guide

Veo 3.1 natively generates synchronized audio. Include audio descriptions in your prompt.

### 1. Dialogue (对话)

Use **quotation marks** for specific speech.

**Example**:

```
A man in a suit stands at a podium, speaking confidently: "Welcome to the future of technology."
一位穿西装的男子站在讲台上，自信地说："欢迎来到科技的未来。"
```

### 2. Sound Effects (音效)

Describe sounds explicitly.

**Examples**:

- "screeching tires" / "轮胎尖叫声"
- "crackling fire" / "噼啪作响的火焰"
- "thunder rumbling in the distance" / "远处雷声隆隆"
- "footsteps echoing in the hallway" / "走廊里回响的脚步声"

### 3. Ambient Noise (环境音)

Describe environmental soundscapes.

**Examples**:

- "busy city street with traffic and chatter" / "繁忙的城市街道，车流和人声"
- "peaceful forest with birds chirping" / "宁静的森林，鸟鸣声"
- "ocean waves crashing on the shore" / "海浪拍打海岸"

- "busy city street with traffic and chatter" / "繁忙的城市街道，车流和人声"
- "peaceful forest with birds chirping" / "宁静的森林，鸟鸣声"
- "ocean waves crashing on the shore" / "海浪拍打海岸"

## Generation Modes

Modes are auto-detected based on parameters:

| Mode             | Parameters                 | Models Supported              |
| ---------------- | -------------------------- | ----------------------------- |
| Text-to-video    | prompt only                | All                           |
| Image-to-video   | prompt + image             | All                           |
| First-last-frame | prompt + image + lastFrame | All                           |
| Video extension  | prompt + video             | Preview models only           |
| Reference images | prompt + referenceImages   | veo-3.1-generate-preview only |

---

## Video Extension

Extend existing Veo-generated videos.

**IMPORTANT**: Each extension returns a **COMPLETE video** (initial + all extensions combined). NO concatenation needed - the API automatically merges the extended content into a single video file.

### Limitations

- **Models**: Only preview models (`veo-3.1-generate-preview`, `veo-3.1-fast-generate-preview`)
- **Extension length**: ~7 seconds per extension
- **Max extensions**: 4 times
- **Max total duration**: 36 seconds (8s initial + 4×7s extensions)
- **Resolution**: 720p only
- **Aspect ratio**: 16:9 or 9:16 only

### Workflow

1. Generate initial video with preview model
2. Call `generateVideoWithVeo` with `video` parameter (prefer GCS URI `gs://bucket/path` for efficiency)
3. Repeat up to 4 times to reach 36 seconds max

**Note**: When extending videos, prefer using GCS URI over HTTP URL for better performance (no download/base64 conversion needed).

- **Models**: Only preview models (`veo-3.1-generate-preview`, `veo-3.1-fast-generate-preview`)
- **Extension length**: ~7 seconds per extension
- **Max extensions**: five times
- **Max total duration**: 37 seconds
- **Resolution**: 720p only
- **Aspect ratio**: 16:9 or 9:16 only

## Workflow

### Grok Video Generation (Preferred)

1. Call `generateVideoWithGrok` with prompt and optional parameters
2. Poll `getGrokVideoStatus` every 30 seconds
3. Maximum wait: 5 minutes

### Veo Video Generation

1. Call `generateVideoWithVeo` with prompt and optional parameters
2. Poll `getVeoVideoStatus` every 30 seconds
3. Maximum wait: 10 minutes

### First-Last-Frame Generation (Veo only)

1. Generate keyframes with `generateImage`
2. Call `generateVideoWithVeo` with `image` (first frame) and `lastFrame`
3. Poll `getVeoVideoStatus` until completed

---

## Duration-Based Model Selection Strategy

**CRITICAL**: For videos ≤ 15 seconds, ALWAYS prefer **Grok direct generation**. Only use Veo Extension for videos longer than 15 seconds.

### When to Use Each Approach

| Target Duration | Recommended Approach                     |
| --------------- | ---------------------------------------- |
| ≤ 15 seconds    | **Grok direct generation** (preferred, faster and cost-effective) |
| 16-36 seconds   | Veo Video Extension (dynamic initial + N extensions) |
| > 36 seconds    | First-Last-Frame Storyboard              |

### Why Grok for ≤ 15s?

- **Faster**: Grok generates directly without extension polling
- **Cost-effective**: Single generation call vs initial + extensions
- **Simpler workflow**: No multi-step extension process needed
- **Full duration support**: Grok supports 1-15 seconds natively

### Veo Extension (for 16-36s only)

**Dynamic Initial Duration Calculation**:

**Parameters**:
- Initial duration options: 4s, 6s, 8s
- Each extension adds: ~7 seconds
- Maximum extensions: 4 times
- Maximum total duration: 36 seconds (8s + 4×7s)

**Calculation Formula**:

1. Extension count `n` = ⌈(target - 8) / 7⌉
2. Initial duration = target - (n × 7)
3. If initial < 4, then n += 1, recalculate initial

**Reference Table**:

| Target | Initial | Extensions | Actual |
|--------|---------|------------|--------|
| 18s    | 4s      | 2          | 18s    |
| 22s    | 8s      | 2          | 22s    |
| 27s    | 6s      | 3          | 27s    |
| 29s    | 8s      | 3          | 29s    |
| 36s    | 8s      | 4          | 36s    |

### Extension Workflow

1. Calculate optimal initial duration using the formula above
2. Generate initial video with preview model (720p) using calculated duration
3. Extend N times with `generateVideoWithVeo(video=<previous_video_gcs_uri_or_url>)`
4. Each extension returns a **COMPLETE accumulated video** (no concatenation needed)

**IMPORTANT**: The Gemini video extension API returns a complete video file containing the initial video plus all extensions merged together. You do NOT need to concatenate segments - just use the final extended video directly.

**Note**: Prefer using GCS URI (`gs://bucket/path`) for video extension - it's more efficient than HTTP URL.

**Example**: Target 22 seconds
- n = ⌈(22 - 8) / 7⌉ = 2
- Initial = 22 - (2 × 7) = 8s
- Result: 8s initial + 2 extensions = 22s ✓

**Note**: Extension uses the video URL directly - no need to call `uploadAndGetVid`.

---

## Long Videos Strategy

### Approach 1: First-Last-Frame Storyboard

**CRITICAL**: This workflow has strict sequential dependencies. Do NOT skip steps.

Use Veo's first-last-frame for precise visual control in multi-segment videos.

**Frame Sharing Principle**: `N video segments require N+1 keyframes`

**Workflow** (MUST follow in order):

**Step 1: Generate ALL keyframes FIRST**

- Generate N+1 keyframes with `generateImage`
- Pass previous frames as `imageUrls` for style consistency
- Example: 6 videos need 7 keyframes (frame1 to frame7)

**Step 2: Generate videos with shared frames**

- Video 1: `generateVideoWithVeo(image=frame1, lastFrame=frame2)`
- Video 2: `generateVideoWithVeo(image=frame2, lastFrame=frame3)` ← frame2 shared!
- ... continue for all segments
- Videos CAN be generated in parallel AFTER all keyframes are ready

**Step 3: Concatenate**

- Load `editing-videos` skill, then use `submitDirectEditTask` to combine all segments
- **CRITICAL: NO transitions** - shared keyframes ensure seamless visual continuity

### Approach 2: Video Extension

For continuous long videos without cuts.

**Workflow**:

1. Generate initial 8-second video with preview model (720p)
2. Extend with `generateVideoWithVeo(video=<previous_video_gcs_uri_or_url>)`
3. Repeat up to 4 times (max 36 seconds total)

**Note**: Prefer using GCS URI (`gs://bucket/path`) for video extension - it's more efficient than HTTP URL.

**Limitations**:

- 720p only
- 16:9 or 9:16 only
- Must use preview models

---

## Video Concatenation Guide

When concatenating multiple generated video segments, use `submitDirectEditTask` with the Track structure.

### Prerequisites

1. Load the `editing-videos` skill first
2. Upload each video segment using `uploadAndGetVid` to get VID

### Concatenation Workflow

**Step 1**: Upload all video segments

```
For each segment URL:
  uploadAndGetVid(url) → vid://segment_N, duration_N, width, height
```

**Step 2**: Build Track structure

**CRITICAL**: Choose the correct method based on how videos were generated:

#### For First-Last-Frame Videos - NO TRANSITIONS

⚠️ **MUST use direct concatenation. DO NOT add transitions.**

When videos are generated using Veo first-last-frame with shared keyframes:

```json
{
  "Canvas": { "Width": 1920, "Height": 1080 },
  "Track": [[
    { "Type": "video", "Source": "vid://segment_1", "TargetTime": [0, 8000] },
    { "Type": "video", "Source": "vid://segment_2", "TargetTime": [8000, 16000] },
    { "Type": "video", "Source": "vid://segment_3", "TargetTime": [16000, 24000] }
  ]]
}
```

**Why no transitions?** The shared keyframes between segments already ensure seamless visual continuity.

#### For Independent Segments - Optional Transitions

When videos are independently generated (not using shared keyframes), transitions can help smooth the connection:

```json
{
  "Canvas": { "Width": 1920, "Height": 1080 },
  "Track": [[
    {
      "Type": "video",
      "Source": "vid://segment_1",
      "TargetTime": [0, 8000],
      "Extra": [{ "Type": "transition", "Source": "1182376", "Duration": 500 }]
    },
    {
      "Type": "video",
      "Source": "vid://segment_2",
      "TargetTime": [7500, 15500],
      "Extra": [{ "Type": "transition", "Source": "1182376", "Duration": 500 }]
    },
    { "Type": "video", "Source": "vid://segment_3", "TargetTime": [15000, 23000] }
  ]]
}
```

**Key Points**:

- Time unit is **milliseconds** (1s = 1000ms)
- For transitions, overlap TargetTime by the transition Duration
- Last segment does NOT need a transition
- **First-last-frame videos MUST use direct concatenation (no transitions)**

**Step 3**: Submit and poll

```
submitDirectEditTask(Canvas, Track) → taskId
wait 90 seconds
poll getVideoEditTaskStatus(taskId) every 30 seconds until completed
```

---

## Output Requirements

**MANDATORY**: After generating videos, you MUST output ALL video URLs clearly.

### Single Video Output

```
**Generated Video**:
![Video](url)

Video URL: url
```

### Multiple Videos Output (Batch/Storyboard)

```
All N video segments completed!

| # | Status | Preview | URL |
|---|--------|---------|-----|
| 1 | ✅ | ![Segment 1](url1) | url1 |
| 2 | ✅ | ![Segment 2](url2) | url2 |
| ... | ... | ... | ... |

**All Video URLs**:
1. url1
2. url2
...
```

### After Concatenation

```
**Final Video** (concatenated from N segments):
![Final Video](final_url)

Final Video URL: final_url
```

**IMPORTANT**: Never end a video generation task without explicitly listing all video URLs.
