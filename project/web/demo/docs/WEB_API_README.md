# Web API 快速使用指南

## 概述

AIToEarn浏览器插件提供了Web API，允许您的Web应用直接调用插件功能，实现登录和发布操作。

## 特点

- 🚀 **零配置** - 插件安装后自动注入API
- 📦 **支持File和URL** - 文件上传支持本地File对象和远程URL
- ⚡ **实时进度** - 发布过程实时反馈，支持进度回调
- 🎯 **类型安全** - 完整的TypeScript类型定义
- 🔒 **安全可靠** - Cookie自动管理，无需手动处理

## 快速开始

### 1. 检测插件

```javascript
if (window.AIToEarnPlugin) {
  console.log('插件已就绪');
} else {
  alert('请先安装AIToEarn浏览器插件');
}
```

### 2. 登录平台

```javascript
// 使用字符串值（对应 PlatType 枚举）
// 'douyin' = PlatType.Douyin
// 'xhs' = PlatType.Xhs
const accountInfo = await window.AIToEarnPlugin.login('douyin');
console.log('登录成功:', accountInfo.nickname);
```

### 3. 发布内容

```javascript
const result = await window.AIToEarnPlugin.publish({
  platform: 'douyin',
  type: 'video',
  title: '我的视频',
  video: videoFile,
  cover: coverFile,
}, (progress) => {
  console.log(`进度: ${progress.progress}%`);
});

console.log('发布成功:', result.shareLink);
```

## 在线Demo

访问 `public/demo.html` 查看完整的交互式示例。

## API文档

详细的API文档请参见 [docs/WEB_API.md](./WEB_API.md)

## 支持的平台

- ✅ 抖音 (`PlatType.Douyin` / `'douyin'`)
- ✅ 小红书 (`PlatType.Xhs` / `'xhs'`)

**注意**: 所有平台类型统一使用 `PlatType` 枚举（来自 `src/config/accountConfig.ts`）

## 技术架构

```
Web页面
   ↓ (postMessage)
Content Script (content_script_home.tsx)
   ↓ (调用)
登录/发布核心逻辑
   ↓ (postMessage)
Web页面 (接收结果)
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `src/homeInject/WebAPI.ts` | Web API SDK实现 |
| `src/homeInject/content_script_home.tsx` | Content Script通信层 |
| `src/homeInject/baseTypes.ts` | 类型定义 |
| `docs/WEB_API.md` | 完整API文档 |
| `public/demo.html` | 交互式Demo |

## 开发者指南

### 本地开发

1. 修改代码后运行 `npm run build`
2. 在Chrome中加载解压的扩展程序
3. 访问 `chrome-extension://YOUR_EXTENSION_ID/demo.html` 测试

### 注入到自己的网站

在 `public/manifest.json` 中配置Content Script：

```json
{
  "content_scripts": [
    {
      "matches": ["https://your-domain.com/*"],
      "js": ["js/vendor.js", "js/content_script_home.js"]
    }
  ]
}
```

## 常见问题

### Q: 如何在TypeScript项目中使用？

添加类型声明：

```typescript
/// <reference path="path/to/aitoearn-cookie/src/homeInject/types.d.ts" />
```

或手动声明：

```typescript
declare global {
  interface Window {
    AIToEarnPlugin?: {
      login(platform: 'douyin' | 'xhs'): Promise<any>;
      publish(params: any, onProgress?: (e: any) => void): Promise<any>;
    };
  }
}
```

### Q: 支持哪些文件格式？

- 视频：MP4, MOV, AVI等
- 图片：JPG, PNG, GIF, WEBP等

### Q: 文件大小限制？

- 视频：建议 ≤ 500MB
- 图片：建议每张 ≤ 10MB

### Q: 如何处理错误？

使用try-catch捕获：

```javascript
try {
  await window.AIToEarnPlugin.publish(params);
} catch (error) {
  console.error('发布失败:', error.message);
}
```

## 更多帮助

- 完整文档: [WEB_API.md](./WEB_API.md)
- 示例代码: `public/demo.html`
- 发布系统文档: [../src/coreLogic/publish/README.md](../src/coreLogic/publish/README.md)

## 许可证

参见项目根目录的LICENSE文件。

