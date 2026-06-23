# ai API

## 模块边界

AI 会话、Agent 任务、草稿生成与模型定价。

## 文件清单

- `ai.api.ts`
- `ai.constants.ts`
- `ai.types.ts`

## 接口清单

| 方法                           | 请求                                      | 说明                                                             |
| ------------------------------ | ----------------------------------------- | ---------------------------------------------------------------- |
| `agentApi.abortTask`           | `POST agent/tasks/{param}/abort`          | 中断内容生成任务                                                 |
| `agentApi.createPublicShare`   | `POST agent/tasks/{param}/share`          | Create a public share token for a task                           |
| `agentApi.createRating`        | `POST agent/tasks/{param}/rating`         | 为任务创建或更新评分                                             |
| `agentApi.createTask`          | `POST agent/tasks`                        | 创建AI生成任务（旧方法，保留兼容性）                             |
| `agentApi.createTaskWithSSE`   | `前端封装`                                | 创建AI生成任务并通过 SSE 接收实时消息                            |
| `agentApi.deleteTask`          | `DELETE agent/tasks/{param}`              | 删除任务                                                         |
| `agentApi.favoriteTask`        | `POST agent/tasks/{param}/favorite`       | 收藏任务                                                         |
| `agentApi.getTaskByShareToken` | `GET agent/tasks/shared/{param}`          | Get task by public share token (no authentication required)      |
| `agentApi.getTaskDetail`       | `GET agent/tasks/{param}`                 | 获取任务详情                                                     |
| `agentApi.getTaskList`         | `GET agent/tasks`                         | 获取任务列表                                                     |
| `agentApi.getTaskMessages`     | `GET agent/tasks/{param}/messages`        | 获取任务消息（增量）                                             |
| `agentApi.getTaskRating`       | `GET agent/tasks/{param}/rating`          | 获取任务评分                                                     |
| `agentApi.stopTask`            | `DELETE agent/tasks/{param}`              | 停止/取消任务                                                    |
| `agentApi.submitTaskRating`    | `POST agent/tasks/{param}/rating`         | 提交或更新任务评分                                               |
| `agentApi.unfavoriteTask`      | `DELETE agent/tasks/{param}/favorite`     | 取消收藏任务                                                     |
| `agentApi.updateTaskTitle`     | `PATCH agent/tasks/{param}`               | 更新任务标题                                                     |
| `aiChatStream`                 | `前端封装`                                | AI聊天接口 - 支持流式和非流式响应                                |
| `apiCreateDraftFromVideoUrl`   | `POST ai/draft-generation/from-video-url` | 根据视频 URL 生成草稿                                            |
| `apiCreateDraftGeneration`     | `POST ai/draft-generation/v2`             | 创建 AI 批量生成草稿任务                                         |
| `apiCreateImageTextDraft`      | `POST ai/draft-generation/image-text`     | 创建 AI 图文草稿生成任务                                         |
| `apiGetDraftGenerationList`    | `GET ai/draft-generation`                 | 获取生成任务列表（分页）                                         |
| `apiGetDraftGenerationPricing` | `GET ai/draft-generation/pricing`         | 获取图片模型定价信息                                             |
| `apiGetDraftGenerationStats`   | `GET ai/draft-generation/stats`           | 获取生成中任务数量统计（轮询用，静默模式不弹错误提示）           |
| `apiQueryDraftGenerationTasks` | `POST ai/draft-generation/query`          | 根据任务 ID 批量查询生成任务状态（轮询用，静默模式不弹错误提示） |
| `getAgentAssets`               | `GET ai/assets`                           | 获取 Agent 生成的素材列表                                        |
| `getChatModels`                | `GET ai/models/chat`                      | Get Chat Model Parameters                                        |
| `getLogs`                      | `GET ai/logs`                             | 获取用户 AI 活动日志                                             |
| `getVideoGenerations`          | `GET ai/video/generations`                | List Video Tasks                                                 |

## 类型清单

| 名称                                   | 类型        | 说明                                  |
| -------------------------------------- | ----------- | ------------------------------------- |
| `AdaptPlatform`                        | `type`      | AdaptPlatform 类型。                  |
| `AgentTaskRatingData`                  | `interface` | Agent 任务评分数据。                  |
| `AgentTaskRatingResponse`              | `interface` | Agent 任务评分响应。                  |
| `AgentTaskShareVo`                     | `interface` | Agent 任务公开分享响应。              |
| `AiChatMessage`                        | `interface` | AI 聊天消息。                         |
| `AiChatStreamParams`                   | `interface` | AI 聊天请求参数。                     |
| `AiLogListParams`                      | `interface` | AI 日志查询参数。                     |
| `AiPaginationParams`                   | `interface` | AI 分页查询参数。                     |
| `ChatModel`                            | `interface` | ChatModel 类型。                      |
| `ChatModelFixedImagePricing`           | `interface` | ChatModelFixedImagePricing 类型。     |
| `ChatModelPricing`                     | `interface` | ChatModelPricing 类型。               |
| `ChatModelPricingTier`                 | `interface` | ChatModelPricingTier 类型。           |
| `CreateAgentTaskParams`                | `interface` | CreateAgentTaskParams 请求参数。      |
| `CreateDraftFromVideoUrlDto`           | `interface` | CreateDraftFromVideoUrlDto 请求参数。 |
| `CreateDraftFromVideoUrlVo`            | `interface` | CreateDraftFromVideoUrlVo 响应数据。  |
| `CreateDraftGenerationVo`              | `interface` | CreateDraftGenerationVo 响应数据。    |
| `CreateImageTextDraftGenerationParams` | `interface` | AI 图文草稿批量生成请求参数。         |
| `CreateTaskResponse`                   | `interface` | CreateTaskResponse 响应数据。         |
| `CreateVideoDraftGenerationParams`     | `interface` | AI 视频草稿批量生成请求参数。         |
| `DraftContentType`                     | `type`      | DraftContentType 类型。               |
| `DraftGenerationPricingVo`             | `interface` | DraftGenerationPricingVo 响应数据。   |
| `DraftGenerationQueue`                 | `interface` | DraftGenerationQueue 类型。           |
| `DraftGenerationRequest`               | `interface` | DraftGenerationRequest 请求参数。     |
| `DraftGenerationResponse`              | `interface` | DraftGenerationResponse 响应数据。    |
| `DraftGenerationStats`                 | `interface` | DraftGenerationStats 数据结构。       |
| `DraftGenerationTask`                  | `interface` | DraftGenerationTask 类型。            |
| `DraftGenerationTaskListVo`            | `interface` | DraftGenerationTaskListVo 响应数据。  |
| `DraftTaskStatus`                      | `type`      | 草稿生成任务状态。                    |
| `GetTaskListParams`                    | `interface` | GetTaskListParams 请求参数。          |
| `ImageModelInfo`                       | `interface` | ImageModelInfo 数据结构。             |
| `ImageModelPricing`                    | `interface` | ImageModelPricing 类型。              |
| `ImageModelType`                       | `type`      | ImageModelType 类型。                 |
| `ImageTextDraftType`                   | `type`      | ImageTextDraftType 类型。             |
| `Media`                                | `interface` | Media 类型。                          |
| `Platform`                             | `type`      | Platform 类型。                       |
| `ResultAction`                         | `type`      | ResultAction 类型。                   |
| `ResultData`                           | `interface` | ResultData 数据结构。                 |
| `ResultMessage`                        | `interface` | ResultMessage 类型。                  |
| `ResultType`                           | `type`      | ResultType 类型。                     |
| `SSEMessage`                           | `interface` | SSEMessage 类型。                     |
| `StreamEvent`                          | `interface` | StreamEvent 类型。                    |
| `SubmitAgentTaskRatingPayload`         | `interface` | 提交 Agent 任务评分请求参数。         |
| `TaskDetail`                           | `interface` | TaskDetail 数据结构。                 |
| `TaskListItem`                         | `interface` | TaskListItem 数据结构。               |
| `TaskListResponse`                     | `interface` | TaskListResponse 响应数据。           |
| `TaskMessage`                          | `interface` | TaskMessage 类型。                    |
| `TaskMessagesVo`                       | `interface` | TaskMessagesVo 响应数据。             |
| `VideoDraftType`                       | `type`      | VideoDraftType 类型。                 |
| `VideoGenerationHistoryItem`           | `interface` | 视频生成历史记录项。                  |
| `VideoGenerationHistoryListVo`         | `interface` | 视频生成历史列表响应数据。            |
| `VideoGenerationTimestamp`             | `type`      | 视频生成历史时间戳。                  |
| `VideoModelInfo`                       | `interface` | VideoModelInfo 数据结构。             |
| `VideoModelInputConstraint`            | `interface` | VideoModelInputConstraint 类型。      |
| `VideoModelInputConstraints`           | `interface` | VideoModelInputConstraints 类型。     |
| `VideoModelPricing`                    | `interface` | VideoModelPricing 类型。              |
| `VideoModelType`                       | `type`      | 视频生成模型类型标识。                |

## 常量清单

| 名称              | 类型   | 说明                   |
| ----------------- | ------ | ---------------------- |
| `AgentTaskStatus` | `enum` | AgentTaskStatus 枚举。 |
| `MediaType`       | `enum` | MediaType 枚举。       |
