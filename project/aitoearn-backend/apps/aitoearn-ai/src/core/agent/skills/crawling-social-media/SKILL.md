---
name: crawling-social-media
description: Downloads and extracts content from social media platforms. Use when user wants to crawl, download, or extract videos/content from Bilibili, YouTube, TikTok, Douyin, Instagram, Twitter, Xiaohongshu. 下载视频、抓取视频、爬取内容、提取视频、下载B站视频、下载抖音视频、下载YouTube视频、视频采集。
---

# Social Media Crawling

Downloads and extracts content from social media platforms.

## Supported Platforms and URL Patterns

| Platform    | URL Pattern Examples                                 |
| ----------- | ---------------------------------------------------- |
| Bilibili    | `bilibili.com/video/BVxxxx`, `b23.tv/xxxxx`          |
| YouTube     | `youtube.com/watch?v=xxx`, `youtu.be/xxx`            |
| TikTok      | `tiktok.com/@user/video/xxx`, `vm.tiktok.com/xxx`    |
| Douyin      | `douyin.com/video/xxx`, `v.douyin.com/xxx`           |
| Xiaohongshu | `xiaohongshu.com/explore/xxx`, `xhslink.com/xxx`     |
| Kuaishou    | `kuaishou.com/short-video/xxx`, `v.kuaishou.com/xxx` |

## Supported Content Types

- **Videos**: Short videos, long videos from all platforms
- **Images**: Xiaohongshu image posts, Douyin image posts
- **Metadata**: Title, description, tags, cover image

## When to Use

Use this skill when user:

- Provides a social media URL matching the patterns above
- Wants to download/save videos from social platforms
- Wants to extract content for re-publishing
- Needs video metadata (title, description, tags)
- Mentions keywords like: download, save, crawl, extract, 下载, 抓取, 爬取

**Do NOT use** when:

- User only wants to view/preview content (no download needed)
- URL is not from a supported platform

## Workflow

### Step 1: Get Social Media URL

Obtain the post URL from user.

### Step 2: Submit Crawl Task

Call `createCrawlTask` with the link.

### Step 3: Poll for Results

1. Wait **30 seconds** between status checks
2. Call `getCrawlTaskStatus` to check progress

### Step 4: Return Results

On success, return:

- Video/media URLs
- Title
- Description
- Tags

## Examples

### Example 1: Download Bilibili Video

**User request**: "Download this Bilibili video: https://www.bilibili.com/video/BV1xx..."

```
1. createCrawlTask:
   - link: "https://www.bilibili.com/video/BV1xx..."
2. Wait 30 seconds
3. Poll getCrawlTaskStatus until success
4. Return video URL, title, description, tags
```

### Example 2: Download from Short Link

**User request**: "下载这个视频 https://v.douyin.com/xxx"

```
1. createCrawlTask:
   - link: "https://v.douyin.com/xxx"
2. Wait 30 seconds
3. Poll getCrawlTaskStatus until success
4. Return video URL, title, description, tags
```

### Example 3: Extract for Re-publishing

```
1. createCrawlTask with source URL
2. Poll getCrawlTaskStatus until completed
3. Extract media URLs, title, description, tags
4. Use content skill to save media
5. Use publish skill to publish to target platforms
```

## Task Status Values

| Status  | Description                    |
| ------- | ------------------------------ |
| pending | Task created, waiting to start |
| running | Task is actively processing    |
| success | Task completed successfully    |
| failed  | Task failed with error         |

## Important Notes

- Processing time varies by platform and content size
- Large videos may take longer to download
- Some platforms may have rate limits
- Media URLs are temporary - save to content library for permanent storage
