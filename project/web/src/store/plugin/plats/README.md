# 平台交互模块 (plats)

平台交互模块提供统一的接口来实现各平台的点赞、评论、收藏等交互功能。

## 架构设计

```
flowchart TB
    subgraph WebApp[Web 应用]
        Manager[platformManager]
        DouyinPlat[douyin/index.ts]
        XhsPlat[xhs/index.ts]
    end
    
    subgraph Plugin[浏览器插件]
        HomeInject[homeInject]
        Background[background.ts]
        Services[Platform Services]
    end
    
    Manager --> DouyinPlat
    Manager --> XhsPlat
    DouyinPlat --> HomeInject
    XhsPlat --> HomeInject
    HomeInject --> Background
    Background --> Services
```

## 核心设计原则

1. **统一接口**：所有平台实现 `IPlatformInteraction` 接口，对外隐藏实现细节
2. **策略模式**：每个平台可自由选择 API 或自动化方案
3. **幂等操作**：操作前检测当前状态，避免重复操作
4. **易于扩展**：添加新平台只需实现接口并注册

## 目录结构

```
plats/
├── types.ts           # 统一类型定义
├── manager.ts         # 平台管理器
├── index.ts           # 模块导出
├── README.md          # 本文档
├── douyin/            # 抖音平台
│   └── index.ts
└── xhs/               # 小红书平台
    └── index.ts
```

## 接口定义

```typescript
interface IPlatformInteraction {
  readonly platformType: PlatType
  
  likeWork(workId: string, isLike: boolean): Promise<LikeResult>
  commentWork(params: CommentParams): Promise<CommentResult>
  favoriteWork(workId: string, isFavorite: boolean): Promise<FavoriteResult>
}
```

## 平台实现策略

| 平台 | 点赞 | 评论 | 收藏 |
|------|------|------|------|
| 抖音 | 自动化 | API | 自动化 |
| 小红书 | API | API | API |

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
```

### 方式二：直接使用平台实例

```typescript
import { douyinInteraction, xhsInteraction } from '@/store/plugin/plats'

await douyinInteraction.likeWork(workId, true)
await xhsInteraction.commentWork({ workId, content: '评论内容' })
```

## 扩展新平台

### 步骤 1：创建平台目录和实现

```typescript
// plats/kuaishou/index.ts
import { PlatType } from '@/app/config/platConfig'
import type { IPlatformInteraction, ... } from '../types'

class KuaishouPlatformInteraction implements IPlatformInteraction {
  readonly platformType = PlatType.KWAI
  
  async likeWork(workId: string, isLike: boolean): Promise<LikeResult> {
    // 实现点赞逻辑
  }
  
  async commentWork(params: CommentParams): Promise<CommentResult> {
    // 实现评论逻辑
  }
  
  async favoriteWork(workId: string, isFavorite: boolean): Promise<FavoriteResult> {
    // 实现收藏逻辑
  }
}

export const kuaishouInteraction = new KuaishouPlatformInteraction()
```

### 步骤 2：更新类型定义

```typescript
// plats/types.ts
export type SupportedPlatformType = PlatType.Xhs | PlatType.Douyin | PlatType.KWAI
```

### 步骤 3：注册到管理器

```typescript
// plats/manager.ts
import { kuaishouInteraction } from './kuaishou'

constructor() {
  this.platforms = new Map()
  this.platforms.set(PlatType.Xhs, xhsInteraction)
  this.platforms.set(PlatType.Douyin, douyinInteraction)
  this.platforms.set(PlatType.KWAI, kuaishouInteraction) // 新增
}
```

### 步骤 4：导出

```typescript
// plats/index.ts
export { kuaishouInteraction } from './kuaishou'
```

## 插件端实现

如果需要使用自动化方案，还需要在插件端实现对应的服务：

1. 创建 `XxxInteractionService.ts`
2. 更新 `homeInject/types.ts` 添加消息类型
3. 更新 `homeInject/constants.ts` 添加 Action
4. 更新 `homeInject/WebAPI.ts` 暴露方法
5. 更新 `content_script_home.tsx` 转发消息
6. 更新 `background.ts` 和 `HomeInjectBackgroundHandler.ts` 处理消息

