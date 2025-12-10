/**
 * 平台交互模块
 *
 * 目录结构:
 * plats/
 *   ├── types.ts      # 统一类型定义
 *   ├── manager.ts    # 统一管理器
 *   ├── xhs/          # 小红书
 *   │   └── index.ts
 *   ├── douyin/       # 抖音
 *   │   └── index.ts
 *   └── index.ts
 *
 * 使用方式:
 *
 * 1. 通过管理器调用（推荐）:
 *    import { platformManager } from '@/store/plugin/plats'
 *    await platformManager.likeWork(PlatType.Xhs, workId, true)
 *
 * 2. 直接使用平台实例:
 *    import { xhsInteraction } from '@/store/plugin/plats'
 *    await xhsInteraction.likeWork(workId, true)
 *
 * 扩展新平台:
 * 1. 创建 plats/[platform]/index.ts，实现 IPlatformInteraction 接口
 * 2. 在 manager.ts 中 register 新平台
 * 3. 在 types.ts 中添加到 SupportedPlatformType
 * 4. 在此文件中导出
 */

// 类型导出
export type {
  BaseResult,
  CommentParams,
  CommentResult,
  FavoriteResult,
  IPlatformInteraction,
  LikeResult,
  SupportedPlatformType,
} from './types'

// 管理器
export { platformManager } from './manager'

// 平台实例
export { xhsInteraction } from './xhs'
export { douyinInteraction } from './douyin'
