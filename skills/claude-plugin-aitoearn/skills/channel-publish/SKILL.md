---
name: channel-publish
description: Publish content to the user's bound Channel Accounts, schedule or change Publish At, cancel an unfinished Publish Task, or update already published content. Use when the user wants to post, schedule, cancel, or update social content on a connected platform.
allowed-tools:
  - list_channel_accounts
  - list_channel_platforms
  - get_channel_platform
  - get_channel_publish_record
---

# Channel Publish

Publish through Channel Accounts. Limits come from `get_channel_platform`, not from this file.

## Environment

Some domestic platforms are not available on this edition — treat `list_channel_platforms` as the source of truth and never promise an unlisted platform. When the user asks to publish to a platform that is not listed, say it is not supported here and guide them to the domestic edition.

## Tools

- `list_channel_accounts` / `get_channel_account`: pick `accountId` and platform. Account `status`: `1` usable, `0` offline (authorization lost) — only `status: 1` accounts can publish. Not required for plugin publish (`xhs / wxSph`, see Workflow step 1).
- `list_channel_platforms`: directory of publish support and assembled tool ids. For `authType==='plugin'` platforms (`xhs / wxSph`) `assembledToolIds` is empty — `create_rednote/wechat_channels_publish_flow` does not exist and is not searchable via `toolSearch`.
- `get_channel_platform`: required before create. Follow the returned text for title, body, media count/format/duration, cover, topics, and publish mode. For `xhs / wxSph` it returns “不支持服务端发布，请使用浏览器插件发布（guide_{slug}_plugin_publish）”.
- `list_channel_publish_records` / `get_channel_publish_record`: inspect flows and tasks. Use `flowId` / `taskId` to get `ChannelPublishRecord.id(recordId)` when you need a `recordId`.
- `guide_user_action`: channel auth guidance only. Input is `{ kind:'channel_auth', platform }`. Guide signal with empty output (`z.object({})`); frontend renders from the input. Do not add extra output fields. Not used for `xhs / wxSph` plugin publish even when `list_channel_accounts` is empty.
- `guide_{slug}_plugin_publish`: browser plugin publish guidance — the ONLY publish method for `authType==='plugin'` platforms. Each plugin platform has its own independent tool (auto-generated, no union). No bound account required; `accountIds` is optional.
  - `guide_rednote_plugin_publish` (小红书 `xhs`): input `title?/body?/mediaUrls?/coverUrl?/publishAt?/accountIds?` + `originalStatement?: boolean` (声明原创) + `userDeclarationBind?: '1'|'2'|'3'` (1 虚拟演绎仅供娱乐 2 笔记含 AI 合成内容 3 内容包含营销广告)
  - `guide_wechat_channels_plugin_publish` (微信视频号 `wxSph`): input `title?/body?/mediaUrls?/coverUrl?/publishAt?/accountIds?` + `postFlag?: '0'|'1'` (声明原创，1 勾选 0 不勾选)
  Each tool has no `platform` discriminator and no union — base content fields plus platform-specific options only. Output is an empty guide signal (`z.object({})`); frontend renders from the input.
- `extract_video_frame`: extract a single frame from a video (`videoUrl`, optional `timeInSeconds`, default 2s) and upload it as a cover image. Returns `{ coverUrl }`. Use it before plugin publish when the platform requires a cover for video content (e.g. xhs video notes, `coverRequired`); you may pass the returned `coverUrl` to `generate_image` as a reference to design a styled cover first.
- `probe_video_metadata` / `probe_audio_metadata` / `probe_image_metadata` (auxiliary): probe a media URL's duration / resolution / size to pre-check material against the `get_channel_platform` limits before creating a publish flow — fewer `success:false` validation round-trips. Each probe is billed per call; video/audio probes are async, so wait for the result and do not probe the same URL twice.
- `get_channel_publish_user_action`: Douyin `WaitingForUserAction` only. Input is `recordId` only — resolve it via `get_channel_publish_record { flowId | taskId }` first. Output contains `shareId/schemeUrl/shortLink/expiresAt/qrImageUrl(httpUrl)`; `qrImageUrl` is an httpUrl produced by agent-side `qrcode` + `AssetsService.uploadFromBuffer`, frontend renders it. Do NOT use raw `qrText`.
- `publish_channel_task_now` / `update_channel_publish_at` / `cancel_channel_publish_task` / `request_channel_publish_update`: task commands. Search them when needed.

Do not invent platform limits. Do not dump option schema into the user reply.

## Publish modes

- Platforms with publish modes (e.g. Facebook, Instagram) expose **one create tool per mode**: `create_{slug}_{mode}_publish_flow` (e.g. `create_facebook_post_publish_flow` / `create_facebook_reel_publish_flow` / `create_facebook_story_publish_flow`). The mode option field (e.g. `content_category`) is filled by the tool automatically — never pass it yourself.
- Pick the tool that matches the media type: video content → the video/reel mode tool; image or text content → the post/image mode tool. `get_channel_platform` lists each mode's limits and create tool id under `## 发布模式` / `## 工具`.
- If a create tool fails with a validation error indicating the media type does not match the publish mode, retry with the matching publish mode's create tool (corrected-parameter retries are fine; unchanged retries are not).

## AI content label

When publishing AI-generated media, default to declaring it via the platform's AI label option; omit it only when the user explicitly says not to label it. It is an optional option field on the create tool: `is_ai_generated` (Facebook, reel mode only), `is_aigc` (TikTok), `made_with_ai` (Twitter), `containsSyntheticMedia` (YouTube). Platforms or modes without such a field simply do not send one.

## Topics and body

- `create_*_publish_flow` tools have **no `topics` field**. Topics are carried only as `#hashtag` inside `body`. Server extracts them via `/#([\w\p{Script=Han}]+)/gu` (`parseTopicsFromBody`) and for `nativeField:true` platforms strips them from body (`stripTopicsFromBody`) into the native topic field.
- When `get_channel_platform` shows `## 话题` as “支持话题”: if the user gave topics (list or “带上 #AI”), normalize each to `#` + trimmed non-empty tag, dedupe, and **insert into `body` as `#hashtag`** (e.g. `正文 #AI #旅行` or inline within the body). If no topics were given, do not invent any. Respect `maxCount` / `maxTotalLength` — truncate or ask the user to choose. `request_channel_publish_update` follows the same rule.
- When `## 话题` says “不要带话题”: do not insert hashtags. If the user insists, warn and strip them.
- `guide_{slug}_plugin_publish` follows the same base content contract as publish (`title/body/mediaUrls/coverUrl/publishAt/accountIds` same field names as `FlatCreatePublishInput` / `COMMON_CREATE_PROPERTIES`) plus platform-specific options (`rednote: originalStatement/userDeclarationBind`, `wechat_channels: postFlag`). For plugin publish `accountIds` is optional — omit it when the user has no bound account.

## Defaults — do not interrogate the user

Complete a publish request in the same turn; never ask the user to supply copy or optional settings first:

- Write `title` and `body` yourself based on the content being published — never ask the user for copy.
- Do not ask about optional settings: omit `publishAt` to publish immediately, default originality/AI-label flags per the sections above (e.g. `postFlag` / `originalStatement` unchecked unless the user asks), and skip optional decorations.
- Produce required fields yourself — when a cover is required, call `extract_video_frame` (optionally restyle the frame via `generate_image`) instead of asking the user for a URL.
- Ask only when a decision truly blocks the call: which account to use among several usable ones (Workflow step 1), or the media to publish is missing entirely.

## Failure and browser boundary

> [!CAUTION]
> For any platform where `publish.supported=true` and a `create_*_publish_flow` tool exists, **never** use `browser_goto` / `browser_act` / `browser_observe` / `browser_extract` / `browser_screenshot` / `start_cloud_space` as a fallback when the publish tool fails.
> - `success:false` (validation failure): read `issues[].path` and `issues[].message`, fix the pinpointed field, then retry with corrected parameters. If the failure is a media type / publish mode mismatch, retry with the matching publish mode's create tool. Do not retry without changes.
> - `isError:true` caused by authorization (account offline / token expired / auth failure): do **not** retry and do not switch to browser automation — call `guide_user_action { kind:'channel_auth', platform }`, tell the user to re-authorize the account, and stop.
> - `isError:true` (non-authorization failure) or approval rejected: explain what is blocked and stop. Do not switch to browser automation.
> For `xhs / wxSph` `create_*_publish_flow` does not exist and is not searchable. If it appears in tool listings, do not call it — use the corresponding `guide_{slug}_plugin_publish` and report the platform constraint.

Only when the platform reports “不支持服务端发布” **and** the user explicitly asks for browser/web operation may you switch to `browser-operations`, after telling the user the platform has no server-side publish capability.

## Douyin WaitingForUserAction — two-step query and QR

Douyin uses `CompletionStrategy.UserHandoff`. After publish, a task may enter `WaitingForUserAction`. You must do a **two-step query**:

1. `get_channel_publish_record` with `{ flowId }` (or `{ taskId }`) from the `ChannelPublishFlow` result to obtain `ChannelPublishRecord.id` as `recordId`. The publish tools return `flowId` + `tasks[].id(taskId)` only — `recordId` is not returned directly.
2. `get_channel_publish_user_action { recordId }` to fetch `schemeUrl/shortLink/expiresAt/qrImageUrl`. The QR image is generated and uploaded agent-side (`qrcode` + `AssetsService.uploadFromBuffer` → `qrImageUrl` httpUrl) for frontend rendering. Never render raw `qrText`. Internal endpoint is `POST /internal/channels/publish/records/user-action` (`@Internal()`, `data: { userId, recordId }`), not `GET /v2 + x-user-id`.

After step 2, **echo the QR URL in the conversation** as clickable `shortLink` + `schemeUrl` text plus `expiresAt`, and let frontend render `qrImageUrl`. Tell the user to scan with the Douyin App or tap the link before expiry. Continue polling `get_channel_publish_record` until `Published` / `Failed`.

## Workflow

1. Determine platform first. If platform is `xhs` or `wxSph` → skip account gating: do NOT call `list_channel_accounts` as a gate and do NOT emit `guide_user_action` when unbound. Plugin publish does not require a bound account; `accountIds` is optional. Go to step 2. Otherwise: `list_channel_accounts` for that platform. If empty, or all accounts on that platform have `status: 0` (offline) → `guide_user_action { kind:'channel_auth', platform }` and stop — result is an empty guide signal rendered by frontend. If the platform has **multiple** usable accounts (`status: 1`) and the user did not specify which one, list the accounts and **ask the user which account to publish to** before continuing — do not pick one yourself and do not publish to all of them unconfirmed. Only proceed directly when the user named the target account(s) or exactly one usable account exists. Do not proceed to `get_channel_platform` or create flow with an offline account.
2. Call `get_channel_platform` for that platform. Shape title, body, media, cover, topics, and mode from that text. If `## 话题` supports topics and the user gave topics, insert them into `body` as `#hashtag` (see Topics and body).
3. For `xhs / wxSph` use `guide_{slug}_plugin_publish` (no need to search for `create_*_publish_flow` — it does not exist / not searchable). For other platforms: `toolSearch` the create / option tool ids from the platform result. Fill dynamic options with `list_*` / `search_*` / `create_*` first.
4. If platform is `xhs` → video notes require a cover: if no `coverUrl`, call `extract_video_frame` first (optionally restyle the returned frame via `generate_image` with it as reference) and pass the result as `coverUrl`. Then always use `guide_rednote_plugin_publish { title?, body?, mediaUrls?, coverUrl?, publishAt?, accountIds?, originalStatement?, userDeclarationBind? }` (no `platform` field, no union; `accountIds` optional). If platform is `wxSph` → always use `guide_wechat_channels_plugin_publish { title?, body?, mediaUrls?, coverUrl?, publishAt?, accountIds?, postFlag? }`. Output is an empty guide signal; frontend renders from the input — do not repeat manual publishing steps in your reply. Examples:
   - 小红书视频笔记: 先 `extract_video_frame { videoUrl:'https://...mp4' }` → `guide_rednote_plugin_publish { body:'正文 #AI', mediaUrls:['https://...mp4'], coverUrl:'https://...(截帧返回的 coverUrl)', originalStatement:true }`
   - 小红书图文笔记（无绑定）: `guide_rednote_plugin_publish { body:'正文 #AI', mediaUrls:['https://...'], originalStatement:true }`
   - 小红书（已绑定）: `guide_rednote_plugin_publish { body:'正文 #AI', mediaUrls:['https://...'], accountIds:['...'], originalStatement:true, userDeclarationBind:'2' }`
   - 视频号（无绑定）: `guide_wechat_channels_plugin_publish { body:'正文', mediaUrls:['https://...'], postFlag:'1' }`
   - 视频号（已绑定）: `guide_wechat_channels_plugin_publish { body:'正文', mediaUrls:['https://...'], accountIds:['...'], postFlag:'1' }`
   If other platform has no direct publish tool (`publish.supported=false`), likewise use its `guide_{slug}_plugin_publish` if it is a plugin platform.
5. Otherwise call the publish mode's `create_{slug}_{mode}_publish_flow` (see Publish modes; single-mode platforms use `create_{slug}_publish_flow`). If it returns `success: false`, read `issues[].path` and `issues[].message` to pinpoint the failing field and fix it before retrying; if the failure indicates a media type / publish mode mismatch, switch to the matching publish mode's create tool; do not retry the same call without changes. If it returns `isError: true`, check whether the cause is authorization (account offline / token expired) — if so, call `guide_user_action { kind:'channel_auth', platform }`, tell the user to re-authorize, and stop. **Never fall back to browser tools on failure** (see Failure and browser boundary).
6. Use record and task tools only to inspect, publish now, change Publish At, cancel, or update already published content.
7. Douyin `WaitingForUserAction`: `get_channel_publish_record { flowId }` → `recordId`, then `get_channel_publish_user_action { recordId }` → echo `shortLink/schemeUrl` + `expiresAt` and let frontend render `qrImageUrl`. See Douyin WaitingForUserAction — two-step query and QR.

Failed or canceled Publish Tasks are not retried. Create a new Publish Flow to publish again.
