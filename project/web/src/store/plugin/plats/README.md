# 平台交互模块 (plats)

平台交互模块提供统一的接口来实现各平台的点赞、评论、收藏、首页列表获取等交互功能。

## 目录结构

```
plats/
├── types.ts           # 统一类型定义
├── manager.ts         # 平台管理器
├── index.ts           # 模块导出
├── README.md          # 本文档
├── demo/              # 示例数据（用于开发参考）
├── douyin/            # 抖音平台
│   ├── index.ts       # 主类和导出入口
│   ├── types.ts       # 抖音特定类型定义
│   └── homeFeed.ts    # 首页列表功能模块
└── xhs/               # 小红书平台
    ├── index.ts       # 主类和导出入口
    ├── types.ts       # 小红书特定类型定义
    └── homeFeed.ts    # 首页列表功能模块
```

## 核心设计原则

1. **统一接口**：所有平台实现 `IPlatformInteraction` 接口，对外隐藏实现细节
2. **模块化设计**：每个平台的功能拆分为独立模块，便于维护和扩展
3. **策略模式**：每个平台可自由选择 API 或自动化方案
4. **幂等操作**：操作前检测当前状态，避免重复操作
5. **易于扩展**：添加新平台或新功能只需实现对应模块

## 接口定义

```typescript
interface IPlatformInteraction {
  readonly platformType: PlatType
  
  // 基础交互
  likeWork(workId: string, isLike: boolean): Promise<LikeResult>
  commentWork(params: CommentParams): Promise<CommentResult>
  favoriteWork(workId: string, isFavorite: boolean): Promise<FavoriteResult>
  
  // 可选功能
  sendDirectMessage?(params: DirectMessageParams): Promise<DirectMessageResult>
  
  // 列表获取
  getHomeFeedList(params: HomeFeedListParams): Promise<HomeFeedListResult>
}
```

## 平台功能支持

| 平台 | 点赞 | 评论 | 收藏 | 私信 | 首页列表 |
|------|------|------|------|------|----------|
| 小红书 | API | API | API | - | API |
| 抖音 | 自动化 | 自动化 | 自动化 | 自动化 | TODO |

### 策略选择依据

- **API 方案**：性能好、速度快，但可能受到风控限制
- **自动化方案**：模拟真实用户操作，风控较低，但速度稍慢

## 使用方式

### 方式一：通过管理器调用（推荐）

```typescript
import { platformManager } from '@/store/plugin/plats'
import { PlatType } from '@/app/config/platConfig'

// 点赞
await platformManager.likeWork(PlatType.Douyin, workId, true)

// 评论
await platformManager.commentWork(PlatType.Xhs, { workId, content: '评论内容' })

// 收藏
await platformManager.favoriteWork(PlatType.Douyin, workId, true)

// 获取首页列表
const result = await platformManager.getHomeFeedList(PlatType.Xhs, { page: 1, size: 20 })
if (result.success) {
  console.log('作品列表:', result.items)
}
```

### 方式二：直接使用平台实例

```typescript
import { douyinInteraction, xhsInteraction } from '@/store/plugin/plats'

await douyinInteraction.likeWork(workId, true)
await xhsInteraction.commentWork({ workId, content: '评论内容' })

// 获取首页列表
const result = await xhsInteraction.getHomeFeedList({ page: 1, size: 20 })
```

## 首页列表返回格式

```typescript
interface HomeFeedItem {
  workId: string        // 作品ID
  thumbnail: string     // 缩略图URL
  title: string         // 作品标题
  authorAvatar: string  // 作者头像
  authorName: string    // 作者名称
  authorId: string      // 作者ID
  likeCount: string     // 点赞数（可能含"万"）
  isVideo: boolean      // 是否为视频
  videoDuration?: number // 视频时长（秒）
  origin: any           // 平台原始数据
}
```

## 扩展新平台

### 步骤 1：创建平台目录结构

```
plats/kuaishou/
├── index.ts       # 主类和导出入口
├── types.ts       # 快手特定类型定义
└── homeFeed.ts    # 首页列表功能模块
```

### 步骤 2：定义平台特定类型

```typescript
// plats/kuaishou/types.ts

/** 快手首页列表响应类型 */
export interface KuaishouHomeFeedResponse {
  success: boolean
  data?: {
    items: KuaishouHomeFeedItem[]
    cursor?: string
  }
}

/** 快手首页列表项 */
export interface KuaishouHomeFeedItem {
  id: string
  // ... 其他字段
}
```

### 步骤 3：实现功能模块

```typescript
// plats/kuaishou/homeFeed.ts
import type { HomeFeedListParams, HomeFeedListResult } from '../types'

// 游标管理器
class HomeFeedCursorManager { /* ... */ }
export const homeFeedCursor = new HomeFeedCursorManager()

// 数据转换
export function transformToHomeFeedItem(item: KuaishouHomeFeedItem): HomeFeedItem {
  return { /* 转换逻辑 */ }
}

// 获取列表
export async function getHomeFeedList(params: HomeFeedListParams): Promise<HomeFeedListResult> {
  // 实现逻辑
}
```

### 步骤 4：创建主类

```typescript
// plats/kuaishou/index.ts
import { PlatType } from '@/app/config/platConfig'
import type { IPlatformInteraction, ... } from '../types'
import { getHomeFeedList, homeFeedCursor } from './homeFeed'

class KuaishouPlatformInteraction implements IPlatformInteraction {
  readonly platformType = PlatType.KWAI

  resetHomeFeedCursor(): void {
    homeFeedCursor.reset()
  }
  
  async likeWork(workId: string, isLike: boolean): Promise<LikeResult> {
    // 实现点赞逻辑
  }
  
  async commentWork(params: CommentParams): Promise<CommentResult> {
    // 实现评论逻辑
  }
  
  async favoriteWork(workId: string, isFavorite: boolean): Promise<FavoriteResult> {
    // 实现收藏逻辑
  }

  async getHomeFeedList(params: HomeFeedListParams): Promise<HomeFeedListResult> {
    return getHomeFeedList(params)
  }
}

export const kuaishouInteraction = new KuaishouPlatformInteraction()

// 导出类型
export type { KuaishouHomeFeedItem, KuaishouHomeFeedResponse } from './types'
```

### 步骤 5：更新类型定义

```typescript
// plats/types.ts
export type SupportedPlatformType = PlatType.Xhs | PlatType.Douyin | PlatType.KWAI
```

### 步骤 6：注册到管理器

```typescript
// plats/manager.ts
import { kuaishouInteraction } from './kuaishou'

constructor() {
  this.register(xhsInteraction)
  this.register(douyinInteraction)
  this.register(kuaishouInteraction) // 新增
}
```

### 步骤 7：导出

```typescript
// plats/index.ts
export { kuaishouInteraction } from './kuaishou'
export type { KuaishouHomeFeedItem, KuaishouHomeFeedResponse } from './kuaishou'
```

## 添加新功能模块

以添加「搜索」功能为例：

### 步骤 1：在 types.ts 添加统一类型

```typescript
// plats/types.ts
export interface SearchParams {
  keyword: string
  page: number
  size: number
}

export interface SearchResult extends BaseResult {
  items: HomeFeedItem[]
  hasMore: boolean
}
```

### 步骤 2：更新接口定义

```typescript
// plats/types.ts
export interface IPlatformInteraction {
  // ... 现有方法
  search?(params: SearchParams): Promise<SearchResult>
}
```

### 步骤 3：在平台目录创建功能模块

```typescript
// plats/xhs/search.ts
export async function search(params: SearchParams): Promise<SearchResult> {
  // 实现搜索逻辑
}
```

### 步骤 4：在主类中引入

```typescript
// plats/xhs/index.ts
import { search } from './search'

class XhsPlatformInteraction {
  async search(params: SearchParams): Promise<SearchResult> {
    return search(params)
  }
}
```

## 插件端实现

如果需要使用自动化方案，还需要在插件端实现对应的服务：

1. 创建 `XxxInteractionService.ts`
2. 更新 `homeInject/types.ts` 添加消息类型
3. 更新 `homeInject/constants.ts` 添加 Action
4. 更新 `homeInject/WebAPI.ts` 暴露方法
5. 更新 `content_script_home.tsx` 转发消息
6. 更新 `background.ts` 和 `HomeInjectBackgroundHandler.ts` 处理消息
