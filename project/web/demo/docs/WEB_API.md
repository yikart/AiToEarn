# Web API 使用文档

## 简介

AIToEarn浏览器插件Web API，允许您的Web应用直接调用插件功能，实现**登录**和**发布**操作，无需打开插件界面。

## 特性

- ✅ **简单易用** - 仅需几行代码即可集成
- ✅ **类型安全** - 完整的TypeScript类型支持
- ✅ **实时进度** - 发布过程实时反馈
- ✅ **支持多平台** - 抖音、小红书等主流平台
- ✅ **文件灵活** - 支持File对象和URL两种方式
- ✅ **Promise API** - 现代化的异步编程体验

## 快速开始

### 1. 确保插件已安装

确保用户已安装AIToEarn浏览器插件，插件会自动注入`window.AIToEarnPlugin`对象到您的页面。

### 2. 检测插件是否可用

```javascript
if (window.AIToEarnPlugin) {
  console.log('插件已就绪');
} else {
  console.error('请先安装AIToEarn插件');
}
```

### 3. 调用API

```javascript
// 登录
const accountInfo = await window.AIToEarnPlugin.login('douyin');
console.log('登录成功:', accountInfo);

// 发布视频
const result = await window.AIToEarnPlugin.publish({
  platform: 'douyin',
  type: 'video',
  title: '我的视频标题',
  desc: '视频描述',
  video: videoFile, // File对象或URL
  cover: coverFile, // 封面图
  topics: ['话题1', '话题2'],
}, (progress) => {
  console.log(`进度: ${progress.progress}%`);
});

console.log('发布成功:', result);
```

## API 参考

### window.AIToEarnPlugin

全局API对象，提供登录和发布功能。

---

### login(platform)

登录到指定平台，获取账号信息。

**参数：**

- `platform`: `PlatType` - 平台类型（枚举值）
  - `PlatType.Douyin` 或 `'douyin'` - 抖音
  - `PlatType.Xhs` 或 `'xhs'` - 小红书

**返回值：** `Promise<PlatAccountInfo>`

**PlatAccountInfo 接口：**

```typescript
interface PlatAccountInfo {
  type: string;           // 平台类型
  loginCookie: string;    // 登录Cookie（JSON字符串）
  uid: string;            // 用户ID
  account: string;        // 账号
  avatar: string;         // 头像URL
  nickname: string;       // 昵称
  fansCount?: number;     // 粉丝数
}
```

**示例：**

```javascript
try {
  const accountInfo = await window.AIToEarnPlugin.login('douyin');
  console.log('登录成功:', {
    昵称: accountInfo.nickname,
    粉丝: accountInfo.fansCount,
  });
} catch (error) {
  console.error('登录失败:', error.message);
}
```

---

### publish(params, onProgress?)

发布内容到指定平台。

**参数：**

- `params`: `PublishParams` - 发布参数（见下方详细说明）
- `onProgress`: `(event: ProgressEvent) => void` - 可选的进度回调函数

**返回值：** `Promise<PublishResult>`

**PublishResult 接口：**

```typescript
interface PublishResult {
  success: boolean;       // 是否成功
  workId?: string;        // 作品ID
  shareLink?: string;     // 分享链接
  publishTime?: number;   // 发布时间戳
  failReason?: string;    // 失败原因（失败时）
  errorCode?: string;     // 错误代码（失败时）
}
```

**ProgressEvent 接口：**

```typescript
interface ProgressEvent {
  stage: 'download' | 'upload' | 'publish' | 'complete' | 'error';
  progress: number;       // 进度百分比 (0-100)
  message?: string;       // 进度消息
  data?: any;            // 附加数据
  timestamp?: number;    // 时间戳
}
```

**示例：**

```javascript
try {
  const result = await window.AIToEarnPlugin.publish({
    platform: 'xhs',
    type: 'video',
    title: '标题',
    desc: '描述',
    video: videoFile,
    cover: coverFile,
  }, (progress) => {
    console.log(`${progress.stage}: ${progress.progress}%`);
  });
  
  console.log('发布成功!');
  console.log('作品ID:', result.workId);
  console.log('分享链接:', result.shareLink);
} catch (error) {
  console.error('发布失败:', error.message);
}
```

---

## PublishParams 参数详解

### 必需参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `platform` | `PlatType` | 平台类型（'douyin' \| 'xhs'） |
| `type` | `'video' \| 'image'` | 发布类型 |

### 内容参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 标题（可选） |
| `desc` | `string` | 描述/正文（可选） |

### 媒体文件参数

**视频发布 (`type: 'video'`)：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `video` | `File \| string` | ✅ | 视频文件或URL |
| `cover` | `File \| string` | ✅ | 封面图片文件或URL |

**图文发布 (`type: 'image'`)：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `images` | `(File \| string)[]` | ✅ | 图片数组，最多9张 |

### 其他参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `topics` | `string[]` | 话题标签数组 |
| `visibility` | `'public' \| 'private' \| 'friends'` | 可见性（默认public） |
| `location` | `LocationInfo` | 位置信息（小红书支持） |
| `mentionedUsers` | `MentionUserInfo[]` | @的用户（小红书支持） |
| `scheduledTime` | `number` | 定时发布时间戳（毫秒） |

**LocationInfo 接口：**

```typescript
interface LocationInfo {
  id: string;
  name: string;
  poiType?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
}
```

**MentionUserInfo 接口：**

```typescript
interface MentionUserInfo {
  id: string;
  nickname: string;
}
```

---

## 完整示例

### 示例1：发布视频（使用File对象）

```html
<!DOCTYPE html>
<html>
<head>
  <title>发布视频示例</title>
</head>
<body>
  <h1>发布视频到抖音</h1>
  
  <input type="file" id="videoFile" accept="video/*">
  <input type="file" id="coverFile" accept="image/*">
  <input type="text" id="title" placeholder="标题">
  <button onclick="publishVideo()">发布</button>
  
  <div id="progress"></div>
  <div id="result"></div>

  <script>
    async function publishVideo() {
      const videoFile = document.getElementById('videoFile').files[0];
      const coverFile = document.getElementById('coverFile').files[0];
      const title = document.getElementById('title').value;
      
      if (!videoFile || !coverFile || !title) {
        alert('请填写完整信息');
        return;
      }
      
      try {
        const result = await window.AIToEarnPlugin.publish({
          platform: 'douyin',
          type: 'video',
          title: title,
          video: videoFile,
          cover: coverFile,
          topics: ['生活', '记录'],
        }, (progress) => {
          document.getElementById('progress').innerHTML = 
            `${progress.stage}: ${progress.progress}%`;
        });
        
        document.getElementById('result').innerHTML = 
          `发布成功！<br>作品ID: ${result.workId}<br>分享链接: ${result.shareLink}`;
      } catch (error) {
        alert('发布失败: ' + error.message);
      }
    }
  </script>
</body>
</html>
```

### 示例2：发布图文（使用URL）

```javascript
async function publishImages() {
  try {
    const result = await window.AIToEarnPlugin.publish({
      platform: 'xhs',
      type: 'image',
      title: '今日分享',
      desc: '这是一篇图文笔记 #美食 #旅行',
      images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ],
      topics: ['美食', '旅行'],
      visibility: 'public',
    }, (progress) => {
      console.log(`${progress.stage}: ${progress.progress}%`);
    });
    
    console.log('发布成功!', result);
  } catch (error) {
    console.error('发布失败:', error);
  }
}
```

### 示例3：混合使用File和URL

```javascript
async function publishMixed() {
  const fileInput = document.getElementById('imageFile');
  const localFile = fileInput.files[0];
  
  const result = await window.AIToEarnPlugin.publish({
    platform: 'xhs',
    type: 'image',
    title: '混合示例',
    images: [
      localFile,  // File对象
      'https://example.com/image2.jpg',  // URL
      'https://example.com/image3.jpg',  // URL
    ],
  });
  
  console.log('发布成功!', result);
}
```

### 示例4：带进度条的发布

```html
<!DOCTYPE html>
<html>
<head>
  <title>带进度条的发布</title>
  <style>
    .progress-bar {
      width: 100%;
      height: 30px;
      background: #f0f0f0;
      border-radius: 5px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: #4CAF50;
      transition: width 0.3s;
    }
  </style>
</head>
<body>
  <h1>发布视频</h1>
  
  <div class="progress-bar">
    <div class="progress-fill" id="progressFill" style="width: 0%"></div>
  </div>
  <div id="progressText">等待开始...</div>
  
  <button onclick="startPublish()">开始发布</button>

  <script>
    async function startPublish() {
      try {
        const result = await window.AIToEarnPlugin.publish({
          platform: 'douyin',
          type: 'video',
          title: '测试视频',
          video: 'https://example.com/video.mp4',
          cover: 'https://example.com/cover.jpg',
        }, (progress) => {
          // 更新进度条
          document.getElementById('progressFill').style.width = 
            progress.progress + '%';
          document.getElementById('progressText').innerText = 
            `${progress.stage}: ${progress.message || ''}`;
        });
        
        alert('发布成功！分享链接: ' + result.shareLink);
      } catch (error) {
        alert('发布失败: ' + error.message);
      }
    }
  </script>
</body>
</html>
```

---

## 进度阶段说明

发布过程分为以下阶段：

| 阶段 | 进度范围 | 说明 |
|------|---------|------|
| `download` | 0-20% | 下载资源（当使用URL时） |
| `upload` | 20-80% | 上传媒体文件到平台 |
| `publish` | 80-95% | 提交发布请求 |
| `complete` | 100% | 发布完成 |
| `error` | - | 发生错误 |

---

## 错误处理

### 捕获错误

```javascript
try {
  const result = await window.AIToEarnPlugin.publish(params);
} catch (error) {
  console.error('错误:', error.message);
  // 处理错误
}
```

### 常见错误

| 错误信息 | 原因 | 解决方法 |
|---------|------|---------|
| `登录失败` | Cookie过期或无效 | 重新登录平台 |
| `请先安装AIToEarn插件` | 插件未安装 | 安装浏览器插件 |
| `发布请求超时` | 网络问题或文件过大 | 检查网络，减小文件大小 |
| `参数错误` | 缺少必需参数 | 检查发布参数是否完整 |

---

## 平台差异

### 抖音

- 支持视频和图文发布
- 使用浏览器自动化技术
- 不需要手动提供Cookie（自动获取）
- 支持File对象和URL

### 小红书

- 支持视频和图文发布
- 使用API直接调用
- 需要有效的Cookie
- 支持位置、@用户等高级功能
- 支持File对象和URL
- 返回完整的分享链接（带xsec_token参数）

---

## TypeScript 支持

如果您使用TypeScript，可以添加类型定义：

```typescript
import { PlatType } from '@/config/accountConfig';

declare global {
  interface Window {
    AIToEarnPlugin?: {
      login(platform: PlatType): Promise<PlatAccountInfo>;
      publish(
        params: PublishParams,
        onProgress?: (event: ProgressEvent) => void
      ): Promise<PublishResult>;
    };
  }
}
```

---

## 常见问题

### Q: 如何检测插件是否已安装？

```javascript
if (window.AIToEarnPlugin) {
  console.log('插件已安装');
} else {
  console.log('插件未安装');
}
```

### Q: 支持哪些文件格式？

- 视频：MP4, MOV, AVI等常见格式
- 图片：JPG, PNG, GIF, WEBP等

### Q: 文件大小限制？

- 视频：建议不超过500MB
- 图片：建议每张不超过10MB
- 图文：最多9张图片

### Q: 如何取消正在进行的发布？

目前不支持取消，请等待发布完成或超时。

### Q: 支持批量发布吗？

可以通过循环调用`publish`方法实现批量发布，但建议间隔一定时间避免触发平台限流。

### Q: 如何处理网络错误？

建议添加重试逻辑：

```javascript
async function publishWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await window.AIToEarnPlugin.publish(params);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`重试 ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
```

---

## 注意事项

1. **安全性**：请勿在不受信任的网站上使用插件功能
2. **Cookie管理**：登录信息会自动管理，无需手动处理
3. **文件大小**：上传大文件时请确保网络稳定
4. **平台限制**：遵守各平台的发布规则和频率限制
5. **浏览器兼容**：推荐使用Chrome、Edge等现代浏览器

---

## 更新日志

### v1.0.0 (2024-11)

- ✅ 初始版本
- ✅ 支持抖音、小红书登录
- ✅ 支持视频、图文发布
- ✅ 支持实时进度反馈
- ✅ 支持File对象和URL

---

## 技术支持

如有问题或建议，请联系技术支持团队。

---

## 许可证

参见项目根目录的LICENSE文件。

