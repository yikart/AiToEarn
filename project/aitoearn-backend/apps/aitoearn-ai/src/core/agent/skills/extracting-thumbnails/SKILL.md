---
name: extracting-thumbnails
description: Extracts thumbnails from video URLs. Use when publishing video content that requires a cover image, when the user does not provide a cover/thumbnail, or before publishing to platforms that require cover images (Kwai, Bilibili, YouTube). 提取封面、视频封面、生成封面、缩略图提取、视频缩略图、截取封面。
---

# Thumbnail Extraction

Extracts thumbnails from video URLs for use as cover images.

## When to Use

Use this skill when:

- Publishing video content that requires a cover image
- User doesn't provide a cover/thumbnail for video content
- Before publishing to platforms that require cover images (Kwai, Bilibili)

## Platform Cover Requirements

| Platform | Cover Required | Notes                            |
| -------- | -------------- | -------------------------------- |
| Kwai     | Yes            | Mandatory for all videos         |
| Bilibili | Recommended    | Improves click-through rate      |
| YouTube  | Recommended    | Custom thumbnails increase views |
| TikTok   | Optional       | Auto-generated if not provided   |
| Facebook | Optional       | Recommended for better display   |

## Workflow

### Step 1: Check if Thumbnail Needed

Determine if the target platform requires a cover image.

### Step 2: Submit Extraction Task

Call `createThumbnailTask` with video URL.

### Step 3: Poll for Results

1. First check: Wait **15 seconds** after submission
2. Subsequent checks: Wait **10 seconds** between polls
3. Call `getThumbnailTaskStatus` to check progress

### Step 4: Return Results

On success, return the thumbnail URL for use as coverUrl.

## Examples

### Example 1: Extract for Publishing

**User wants to publish video to Kwai without cover**

```
1. createThumbnailTask:
   - url: "https://example.com/video.mp4"
2. Wait 15 seconds
3. Poll getThumbnailTaskStatus until success
4. Use returned thumbnail URL as coverUrl
5. Proceed with publishPostToKwai
```

### Example 2: Generate Cover Before Publishing

```
1. User provides video URL, title, description
2. Check if coverUrl is provided
3. If no coverUrl:
   a. createThumbnailTask with videoUrl
   b. Poll getThumbnailTaskStatus
   c. Use returned thumbnail as coverUrl
4. Proceed with publishing
```

## Task Status Values

| Status     | Description                           |
| ---------- | ------------------------------------- |
| pending    | Task created, waiting to start        |
| processing | Task is actively extracting thumbnail |
| success    | Thumbnail extracted successfully      |
| failed     | Task failed with error                |

## Important Notes

- Thumbnail extraction typically takes 10-15 seconds
- Always generate thumbnails for platforms that require covers (Kwai)
- Handle failures gracefully - inform user or use platform default
- Generated thumbnails can be used directly as coverUrl in publish tools
