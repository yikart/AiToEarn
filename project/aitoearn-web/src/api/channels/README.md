# channels API

## 模块边界

渠道平台元数据、渠道授权、发布流程与发布记录。开源版只保留登录用户的渠道授权、发布 Flow、发布记录、发布任务操作和作品数据接口。

## 文件清单

- `channel.api.ts`
- `channel.constants.ts`
- `channel.types.ts`

## 接口清单

| 方法                               | 请求                                                   | 说明                     |
| ---------------------------------- | ------------------------------------------------------ | ------------------------ |
| `cancelChannelPublishTaskApi`      | `DELETE v2/channels/publish/tasks/{param}`             | 取消发布任务             |
| `createChannelPublishFlowApi`      | `POST v2/channels/publish/flows`                       | 创建发布 Flow            |
| `deleteChannelPublishRecordApi`    | `DELETE v2/channels/publish/records/{param}`           | 删除发布记录             |
| `getChannelAccountAuthStatusApi`   | `GET v2/channels/accounts/auth/{param}/status/{param}` | 查询授权状态             |
| `getChannelPlatformsApi`           | `GET v2/channels/platforms`                            | 获取所有平台元数据       |
| `getChannelPublicPublishRecordApi` | `GET v2/channels/publish/records/public/{param}`       | 公开查询发布记录         |
| `getChannelPublishFlowApi`         | `GET v2/channels/publish/flows/{param}`                | 获取 Flow 详情           |
| `getChannelPublishRecordApi`       | `GET v2/channels/publish/records/{param}`              | 获取发布记录详情         |
| `getChannelPublishRecordsApi`      | `GET v2/channels/publish/records`                      | 获取发布历史             |
| `getChannelPublishUserActionApi`   | `GET v2/channels/publish/records/{param}/user-action`  | 获取发布记录用户操作信息 |
| `getChannelWorkAnalyticsApi`       | `GET v2/channels/works/{param}/{param}/analytics`      | 获取作品数据             |
| `publishChannelTaskNowApi`         | `POST v2/channels/publish/tasks/{param}/publish-now`   | 立即发布                 |
| `retryChannelPublishTaskApi`       | `POST v2/channels/publish/tasks/{param}/retry`         | 重试发布任务             |
| `startChannelAccountAuthApi`       | `GET v2/channels/accounts/auth/{param}`                | 开始平台授权             |
| `startChannelOAuthLoginApi`        | `GET v2/channels/oauth/{param}`                        | 开始平台 OAuth 登录      |
| `updateChannelPublishAtApi`        | `PATCH v2/channels/publish/tasks/{param}/publish-at`   | 修改发布时间             |

## 类型清单

| 名称                              | 类型        | 说明                                       |
| --------------------------------- | ----------- | ------------------------------------------ |
| `ChannelAccountAuthStart`         | `interface` | ChannelAccountAuthStart 类型。             |
| `ChannelAccountAuthStatus`        | `interface` | ChannelAccountAuthStatus 类型。            |
| `ChannelAuthConnectedAccount`     | `interface` | ChannelAuthConnectedAccount 类型。         |
| `ChannelAuthSelectableAccount`    | `interface` | ChannelAuthSelectableAccount 类型。        |
| `ChannelAuthSessionStatus`        | `type`      | ChannelAuthSessionStatus 类型。            |
| `ChannelCreatePublishFlowItem`    | `interface` | ChannelCreatePublishFlowItem 数据结构。    |
| `ChannelCreatePublishFlowParams`  | `interface` | ChannelCreatePublishFlowParams 请求参数。  |
| `ChannelOAuthLoginStart`          | `interface` | ChannelOAuthLoginStart 类型。              |
| `ChannelPlatformListOptions`      | `interface` | Channel platform metadata list options.    |
| `ChannelPublicPublishRecordItem`  | `type`      | ChannelPublicPublishRecordItem 数据结构。  |
| `ChannelPublishContentInput`      | `interface` | ChannelPublishContentInput 数据结构。      |
| `ChannelPublishContentOverride`   | `interface` | ChannelPublishContentOverride 类型。       |
| `ChannelPublishCoverInput`        | `interface` | ChannelPublishCoverInput 数据结构。        |
| `ChannelPublishFlowContext`       | `interface` | ChannelPublishFlowContext 类型。           |
| `ChannelPublishFlowTaskVo`        | `interface` | ChannelPublishFlowTaskVo 响应数据。        |
| `ChannelPublishFlowVo`            | `interface` | ChannelPublishFlowVo 响应数据。            |
| `ChannelPublishMediaInput`        | `interface` | ChannelPublishMediaInput 数据结构。        |
| `ChannelPublishRecordEngagement`  | `interface` | ChannelPublishRecordEngagement 类型。      |
| `ChannelPublishRecordItem`        | `interface` | ChannelPublishRecordItem 数据结构。        |
| `ChannelPublishRecordListVo`      | `type`      | ChannelPublishRecordListVo 响应数据。      |
| `ChannelPublishRecordOption`      | `interface` | ChannelPublishRecordOption 数据结构。      |
| `ChannelPublishRecordQueryParams` | `interface` | ChannelPublishRecordQueryParams 请求参数。 |
| `ChannelPublishSource`            | `type`      | ChannelPublishSource 类型。                |
| `ChannelPublishTaskActionVo`      | `interface` | ChannelPublishTaskActionVo 响应数据。      |
| `ChannelPublishUserActionVo`      | `interface` | ChannelPublishUserActionVo 响应数据。      |
| `ChannelWorkAnalyticsVo`          | `interface` | ChannelWorkAnalyticsVo 响应数据。          |
| `ChannelWorkQueryParams`          | `interface` | ChannelWorkQueryParams 请求参数。          |
| `PlatformMetadataVo`              | `interface` | PlatformMetadataVo 数据结构。              |
| `StartChannelAccountAuthParams`   | `interface` | StartChannelAccountAuthParams 请求参数。   |
| `StartChannelOAuthLoginParams`    | `interface` | StartChannelOAuthLoginParams 请求参数。    |
