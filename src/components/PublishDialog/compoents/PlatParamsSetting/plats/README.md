# TikTokParams 组件

## 概述

TikTokParams 组件是专门为 TikTok 平台设计的发布参数设置组件，完全符合 TikTok 的 Content Posting API 开发指南要求。

## 功能特性

### 1. 创作者信息显示
- 自动调用 `/api/plat/tiktok/creator/info/{tiktok_account_id}` API
- 显示创作者头像、昵称和用户名
- 根据 API 返回的 `max_video_post_duration_sec` 验证视频时长

### 2. 隐私级别设置
- 支持从 API 返回的 `privacy_level_options` 中选择
- 选项包括：
  - `PUBLIC_TO_EVERYONE` - 公开
  - `MUTUAL_FOLLOW_FRIENDS` - 朋友
  - `SELF_ONLY` - 仅自己
- 用户必须手动选择，无默认值

### 3. 用户交互权限
- **评论权限** (`comment_disabled`)
- **合拍权限** (`duet_disabled`) 
- **拼接权限** (`stitch_disabled`)
- 根据 API 返回的禁用状态自动禁用相应选项
- 用户必须手动开启，无默认选中

### 4. 商业内容披露
- 商业内容披露开关
- 两个选项：
  - **您的品牌** (`brand_organic_toggle`) - 推广自己或自己的业务
  - **品牌内容** (`brand_content_toggle`) - 推广其他品牌或第三方
- 至少选择一个选项才能发布

### 5. 合规声明
根据选择的商业内容类型显示不同的合规声明：

- **默认情况**：发布即表示您同意 TikTok 的音乐使用确认
- **仅选择"您的品牌"**：发布即表示您同意 TikTok 的音乐使用确认
- **仅选择"品牌内容"**：发布即表示您同意 TikTok 的品牌内容政策音乐使用确认
- **同时选择两者**：发布即表示您同意 TikTok 的品牌内容政策音乐使用确认

## API 接口

### 获取创作者信息
```
GET /api/plat/tiktok/creator/info/{tiktok_account_id}
```

**响应格式：**
```json
{
  "data": {
    "max_video_post_duration_sec": 3600,
    "privacy_level_options": ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"],
    "stitch_disabled": false,
    "comment_disabled": false,
    "creator_avatar_url": "https://...",
    "creator_nickname": "straydog",
    "creator_username": "__straydog__",
    "duet_disabled": false
  },
  "code": 0,
  "message": "请求成功"
}
```

## 多语言支持

组件支持中英文双语：

### 中文 (zh-CN)
- 创作者信息
- 谁可以观看此视频
- 允许用户
- 披露视频内容
- 合规声明

### 英文 (en)
- Creator Info
- Who can view this video
- Allow users to
- Disclose video content
- Compliance declarations

## 使用方法

```tsx
import TikTokParams from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/TikTokParams';

<TikTokParams pubItem={pubItem} />
```

## 参数结构

```typescript
interface TikTokOption {
  privacy_level: string;
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
  brand_organic_toggle: boolean;
  brand_content_toggle: boolean;
}
```

## 符合 TikTok 开发指南

本组件完全符合 [TikTok Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines#required_ux_implementation_in_your_app) 的要求：

1. ✅ 显示创作者昵称和头像
2. ✅ 检查创作者发布限制
3. ✅ 验证视频时长限制
4. ✅ 隐私级别手动选择
5. ✅ 交互权限手动设置
6. ✅ 商业内容披露功能
7. ✅ 合规声明显示
8. ✅ 无默认值设置
9. ✅ 用户完全控制发布内容

## 注意事项

1. 组件会自动初始化 TikTok 参数，如果不存在则创建默认值
2. API 调用失败时会静默处理，不影响组件正常使用
3. 所有用户交互都有相应的状态管理和参数更新
4. 组件支持响应式设计，适配不同屏幕尺寸
