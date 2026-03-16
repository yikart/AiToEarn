---
name: removing-subtitles
description: Removes hardcoded subtitles from videos using AI inpainting. Use when user wants to remove subtitles, erase text from video, clean video from captions, delete burned-in subtitles, remove video watermarks, clean hardcoded text, or strip embedded subtitles. 去字幕、去除字幕、删除字幕、清除字幕、去硬字幕、去水印、擦除字幕、移除字幕。
---

# Subtitle Removal

Removes hardcoded/burned-in subtitles from videos using OCR detection and AI inpainting.

## When to Use

Use this skill when:

- Removing hardcoded subtitles from videos
- Cleaning up videos with burned-in text
- Preparing videos for re-subtitling
- Removing unwanted text overlays
- Cleaning videos for repurposing

## How It Works

1. **OCR Detection**: AI detects subtitle regions using optical character recognition
2. **Region Masking**: Identifies areas containing text
3. **AI Inpainting**: Fills removed areas with reconstructed background content
4. **Output Generation**: Produces clean video without subtitles

## Workflow

### Step 1: Get Source Video

Obtain the video URL with hardcoded subtitles.

### Step 2: Submit Removal Task

Call `submitAideoTask` with:

- **prompt**: Request subtitle removal
- **multiInputs**: Array containing source video URL

### Step 3: Poll for Results

1. First check: Wait **210 seconds** after submission
2. Subsequent checks: Wait **30 seconds** between polls
3. Call `getAideoTaskStatus` to check progress

### Step 4: Timeout Handling

**Maximum wait time: 20 minutes**

If task exceeds 20 minutes, report as timeout failure.

### Step 5: Return Results

On completion, return the clean video URL.

## Examples

### Example 1: Remove Subtitles

**User request**: "Remove the subtitles from this video"

```
submitAideoTask:
  prompt: "Remove all hardcoded subtitles from this video"
  multiInputs: ["video_with_subtitles.mp4"]
```

### Example 2: Clean Video for Re-subtitling

**User request**: "I want to add my own subtitles, please remove the existing ones"

```
submitAideoTask:
  prompt: "Erase all burned-in subtitles from this video to prepare for new subtitles"
  multiInputs: ["original_video.mp4"]
```

### Example 3: Remove Text Overlays

**User request**: "Clean up this video by removing the text at the bottom"

```
submitAideoTask:
  prompt: "Remove the hardcoded text overlay at the bottom of this video"
  multiInputs: ["video_with_text.mp4"]
```

## Important Notes

- Uses OCR to detect subtitle regions automatically
- AI inpainting fills removed areas naturally
- Works best with subtitles on solid or simple backgrounds
- Complex backgrounds may have some artifacts
- Maximum wait time is 20 minutes
- Processing time: ~10 minutes per 1-minute video
