# platforms API

## 模块边界

平台专项能力，例如发布、互动、作品校验和平台参数。开源版只保留当前页面和组件实际使用的发布、授权、平台参数与作品数据接口。

## 文件清单

- `bilibili.api.ts`
- `douyin.api.ts`
- `douyin.constants.ts`
- `douyin.types.ts`
- `instagram.api.ts`
- `instagram.types.ts`
- `pinterest.api.ts`
- `pinterest.constants.ts`
- `pinterest.types.ts`
- `publish.api.ts`
- `publish.constants.ts`
- `publish.types.ts`
- `threads.api.ts`
- `threads.types.ts`
- `tiktok.api.ts`
- `tiktok.types.ts`
- `work.api.ts`
- `work.types.ts`
- `youtube.api.ts`

## 接口清单

| 方法                                  | 请求                                                                  | 说明                                                   |
| ------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| `apiDouyinMiniAppChannelAuthComplete` | `POST plat/douyin/miniapp-auth/complete`                              | 完成抖音小程序渠道授权。                               |
| `apiDouyinMiniAppHomepageFansCount`   | `GET plat/douyin-miniapp/homepage-data/fans-count`                    | 获取抖音小程序首页粉丝数。                             |
| `apiGetBilibiliPartitions`            | `GET v2/channels/accounts/{param}/publish-options/tid/values`         | 获取 B 站分区列表。                                    |
| `apiGetInstagramNoUserAuthUrl`        | `POST plat/meta/auth/url/public`                                      | Instagram 公开授权接口（无需登录）。                   |
| `apiGetThreadsLocations`              | `GET v2/channels/accounts/{param}/publish-options/location_id/values` | 获取 Threads 位置列表。                                |
| `apiGetTikTokNoUserAuthUrl`           | `POST plat/tiktok/authUrl`                                            | 获取 TikTok 无账号授权链接。                           |
| `apiGetYouTubeCategories`             | `GET v2/channels/accounts/{param}/publish-options/categoryId/values`  | 获取账号平台动态发布选项取值。                         |
| `apiValidateWorkOwnership`            | `POST channel/work/validate`                                          | 校验作品归属。                                         |
| `createPinterestBoardApi`             | `POST v2/channels/accounts/{param}/publish-options/boardId/values`    | 创建 Pinterest Board。                                 |
| `getPinterestBoardListApi`            | `GET v2/channels/accounts/{param}/publish-options/boardId/values`     | 获取 Pinterest Board 列表。                            |
| `getPublishRecordDetail`              | 前端封装                                                              | 获取发布记录详情。                                     |
| `getPublishRecordDetailById`          | 前端封装                                                              | 根据记录 ID 获取发布记录详情（用于抖音 H5 发布轮询）。 |

## 类型清单

| 名称                                     | 类型        | 说明                                              |
| ---------------------------------------- | ----------- | ------------------------------------------------- |
| `DouyinMiniAppChannelAuthCompleteParams` | `interface` | DouyinMiniAppChannelAuthCompleteParams 请求参数。 |
| `DouyinMiniAppChannelAuthCompleteVo`     | `interface` | Douyin mini app channel auth completion response. |
| `DouyinMiniAppDataAuthStatus`            | `interface` | DouyinMiniAppDataAuthStatus 类型。                |
| `DouyinMiniAppFansCount`                 | `interface` | DouyinMiniAppFansCount 类型。                     |
| `DouyinMiniAppFansCountItem`             | `interface` | DouyinMiniAppFansCountItem 数据结构。             |
| `DouyinMiniAppQrLoginCreate`             | `interface` | DouyinMiniAppQrLoginCreate 类型。                 |
| `DouyinMiniAppSession`                   | `interface` | DouyinMiniAppSession 类型。                       |
| `InstagramNoUserAuthUrlParams`           | `interface` | InstagramNoUserAuthUrlParams 请求参数。           |
| `InstagramNoUserAuthUrlVo`               | `interface` | Instagram public auth URL response.               |
| `PinterestBoardCreateParams`             | `interface` | PinterestBoardCreateParams 请求参数。             |
| `PinterestBoardItem`                     | `interface` | PinterestBoardItem 数据结构。                     |
| `PinterestBoardPrivacy`                  | `type`      | PinterestBoardPrivacy 类型。                      |
| `PublishApiResponse`                     | `type`      | 发布接口响应包装。                                |
| `PublishRecordEngagement`                | `interface` | PublishRecordEngagement 类型。                    |
| `PublishRecordItem`                      | `interface` | PublishRecordItem 数据结构。                      |
| `ThreadsLocationItem`                    | `interface` | ThreadsLocationItem 数据结构。                    |
| `ThreadsLocationsResponse`               | `interface` | ThreadsLocationsResponse 响应数据。               |
| `TikTokNoUserAuthUrlParams`              | `interface` | TikTokNoUserAuthUrlParams 请求参数。              |
| `TikTokNoUserAuthUrlVo`                  | `interface` | TikTok public auth URL response.                  |
| `TikTokPrivacyLevel`                     | `type`      | TikTokPrivacyLevel 类型。                         |
| `ValidateWorkOwnershipDto`               | `interface` | ValidateWorkOwnershipDto 请求参数。               |
| `ValidateWorkOwnershipVo`                | `interface` | ValidateWorkOwnershipVo 响应数据。                |
| `ValidateWorkOwnershipWorkDetail`        | `interface` | ValidateWorkOwnershipWorkDetail 数据结构。        |

## 常量清单

| 名称                         | 类型    | 说明                              |
| ---------------------------- | ------- | --------------------------------- |
| `DouyinMiniAppDataAuthScope` | `enum`  | DouyinMiniAppDataAuthScope 枚举。 |
| `PublishStatus`              | `enum`  | PublishStatus 枚举。              |
| `PINTEREST_BOARD_FIELD`      | `const` | PINTEREST_BOARD_FIELD 常量。      |
