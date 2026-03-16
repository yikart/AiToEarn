---
name: managing-content
description: Manages media files, drafts, and content organization. Use when user needs to upload media, create drafts, organize content, save to library, or manage media groups. 内容管理、媒体管理、保存媒体、创建草稿、素材管理、上传视频、保存到素材库。
---

# Content Management

Manages media files, drafts, and content organization.

## When to Use

Use this skill when:

- Saving generated media to library
- Creating drafts for later publishing
- Organizing content into groups
- Managing media files

## Workflow

### Step 1: Get Target Group

Call `getMediaGroupInfoByName` or `getDraftGroupInfoByName` to find the target group.

### Step 2: Create Content

**For Media:**
Call `createMedia` with media details.

**For Drafts:**
Call `createDraft` with content details.

### Step 3: Return Results

Return the created media ID or draft ID.

## Examples

### Example 1: Save Generated Video

```
1. getMediaGroupInfoByName:
   - title: "My Videos"
2. createMedia:
   - groupId: from step 1
   - type: "VIDEO"
   - url: generated video URL
   - title: "My Generated Video"
3. Return media ID
```

### Example 2: Create Draft for Publishing

```
1. getDraftGroupInfoByName:
   - title: "Drafts"
2. createDraft:
   - groupId: from step 1
   - title: "Video Title"
   - type: "VIDEO"
   - mediaList: [{ url: "video.mp4", type: "VIDEO" }]
3. Return draft ID
```

## Media Types

| Type  | Description            |
| ----- | ---------------------- |
| VIDEO | Video files (MP4, MOV) |
| IMAGE | Image files (JPG, PNG) |
| AUDIO | Audio files (MP3, WAV) |

## Material Types

| Type    | Description          |
| ------- | -------------------- |
| VIDEO   | Video-based content  |
| IMAGE   | Image-based content  |
| ARTICLE | Text/article content |

## Important Notes

- Falls back to default group if specified group not found
- Media and draft IDs are returned for reference
- Content is organized by groups for easy management
