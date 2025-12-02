# 浏览器插件模块

## 📁 文件结构

```
src/store/plugin/
├── index.ts              # 统一导出
├── store.ts              # Zustand Store 状态管理
├── hooks.ts              # 自定义 Hooks
├── types.ts              # TypeScript 类型定义
├── constants.ts          # 常量定义
├── utils.ts              # 工具函数
├── README.md             # 本文档
└── examples/             # 使用示例
    ├── basic.example.tsx
    └── advanced.example.tsx
```

## 🚀 快速开始

### 1. 基础使用

```typescript
import { usePlugin } from '@/store/plugin';

export function MyComponent() {
  // 自动轮询插件状态，每2秒检测一次
  const { isConnected, status } = usePlugin(true, 2000);
  
  return (
    <div>
      状态: {isConnected ? '已连接' : '未连接'}
    </div>
  );
}
```

### 2. 登录功能

```typescript
import { usePluginLogin } from '@/store/plugin';

export function LoginButton() {
  const { login } = usePluginLogin();
  
  const handleLogin = async () => {
    const result = await login('douyin');
    if (result.success) {
      console.log('登录成功:', result.data?.nickname);
    }
  };
  
  return <button onClick={handleLogin}>登录抖音</button>;
}
```

### 3. 发布视频

```typescript
import { usePluginPublish } from '@/store/plugin';

export function PublishVideo() {
  const { publishVideo, isPublishing, publishProgress } = usePluginPublish();
  
  const handlePublish = async (videoFile: File, coverFile: File) => {
    const result = await publishVideo(
      'douyin',
      videoFile,
      coverFile,
      { title: '我的视频', desc: '描述' },
      (progress) => console.log(`进度: ${progress.progress}%`)
    );
    
    if (result.success) {
      alert('发布成功！');
    }
  };
  
  return (
    <div>
      <button onClick={() => handlePublish(...)} disabled={isPublishing}>
        {isPublishing ? '发布中...' : '发布视频'}
      </button>
      {publishProgress && <div>进度: {publishProgress.progress}%</div>}
    </div>
  );
}
```

### 4. 完整工作流

```typescript
import { usePluginWorkflow } from '@/store/plugin';

export function OneClickPublish() {
  const { loginAndPublishVideo } = usePluginWorkflow();
  
  const handleOneClick = async (videoFile: File, coverFile: File) => {
    // 自动登录 + 发布
    const result = await loginAndPublishVideo(
      'douyin',
      videoFile,
      coverFile,
      { title: '标题' }
    );
    
    if (result.success) {
      alert('发布成功！');
    }
  };
  
  return <button onClick={() => handleOneClick(...)}>一键发布</button>;
}
```

## 📚 API 文档

### Hooks

#### `usePlugin(autoPolling?, pollingInterval?)`

基础插件状态和方法

**参数:**
- `autoPolling` - 是否自动轮询，默认 `true`
- `pollingInterval` - 轮询间隔（毫秒），默认 `2000`

**返回:**
```typescript
{
  status: PluginStatus;
  isConnected: boolean;
  isNotInstalled: boolean;
  isChecking: boolean;
  isPublishing: boolean;
  publishProgress: ProgressEvent | null;
  checkPlugin: () => boolean;
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
  login: (platform: PlatformType) => Promise<PlatAccountInfo>;
  publish: (params: PublishParams, onProgress?) => Promise<PublishResult>;
  resetPublishState: () => void;
}
```

#### `usePluginLogin()`

登录功能

**返回:**
```typescript
{
  login: (platform: PlatformType) => Promise<OperationResult<PlatAccountInfo>>;
}
```

#### `usePluginPublish()`

发布功能

**返回:**
```typescript
{
  publish: (params: PublishParams, onProgress?) => Promise<OperationResult>;
  publishVideo: (platform, video, cover, options?, onProgress?) => Promise<OperationResult>;
  publishImages: (platform, images, options?, onProgress?) => Promise<OperationResult>;
  isPublishing: boolean;
  publishProgress: ProgressEvent | null;
  resetPublishState: () => void;
}
```

#### `usePluginWorkflow()`

完整工作流（登录+发布）

**返回:**
```typescript
{
  isConnected: boolean;
  loginAndPublishVideo: (...) => Promise<OperationResult>;
  loginAndPublishImages: (...) => Promise<OperationResult>;
}
```

### 工具函数

```typescript
// 状态文本
getPluginStatusText(status: PluginStatus): string;
getPublishStageText(stage: ProgressEvent['stage']): string;

// 状态判断
isPluginConnected(status: PluginStatus): boolean;
isPluginNotInstalled(status: PluginStatus): boolean;

// 格式化
formatProgress(progress: number): string;
formatFileSize(bytes: number): string;

// 文件验证
validateFileType(file: File, acceptTypes: string[]): boolean;
isValidVideoFile(file: File): boolean;
isValidImageFile(file: File): boolean;
validateFileSize(file: File, maxSize: number): boolean;

// 重试机制
withRetry<T>(fn: () => Promise<T>, maxRetries?, delay?): () => Promise<T>;
```

### 类型定义

```typescript
// 插件状态
enum PluginStatus {
  UNKNOWN = 'UNKNOWN',
  CHECKING = 'CHECKING',
  CONNECTED = 'CONNECTED',
  NOT_INSTALLED = 'NOT_INSTALLED',
}

// 平台类型
type PlatformType = 'douyin' | 'xhs' | 'kwai' | 'bilibili';

// 发布参数
interface PublishParams {
  platform: PlatformType;
  type: 'video' | 'image';
  title?: string;
  desc?: string;
  video?: File | string;
  cover?: File | string;
  images?: (File | string)[];
  topics?: string[];
  visibility?: 'public' | 'private' | 'friends';
  // ...更多字段
}

// 操作结果
interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### 常量

```typescript
// 默认轮询间隔（2秒）
DEFAULT_POLLING_INTERVAL = 2000

// 插件状态文本
PLUGIN_STATUS_TEXT = {
  UNKNOWN: '未检测',
  CHECKING: '检测中...',
  CONNECTED: '已连接',
  NOT_INSTALLED: '未安装',
}

// 发布阶段文本
PUBLISH_STAGE_TEXT = {
  download: '下载资源',
  upload: '上传文件',
  publish: '发布中',
  complete: '完成',
  error: '错误',
}

// 错误消息
ERROR_MESSAGES = {
  PLUGIN_NOT_INSTALLED: '请先安装 AIToEarn 浏览器插件',
  PUBLISHING_IN_PROGRESS: '当前正在发布中，请稍后再试',
  LOGIN_FAILED: '登录失败',
  PUBLISH_FAILED: '发布失败',
}
```

## 💡 使用示例

### 示例 1: 插件状态显示

```typescript
import { usePlugin, getPluginStatusText } from '@/store/plugin';

export function PluginStatus() {
  const { status } = usePlugin();
  
  return (
    <div>
      插件状态: {getPluginStatusText(status)}
    </div>
  );
}
```

### 示例 2: 文件验证

```typescript
import { isValidVideoFile, validateFileSize } from '@/store/plugin';

function handleFileSelect(file: File) {
  if (!isValidVideoFile(file)) {
    alert('请选择有效的视频文件');
    return;
  }
  
  if (!validateFileSize(file, 500 * 1024 * 1024)) {
    alert('视频文件不能超过 500MB');
    return;
  }
  
  // 处理文件...
}
```

### 示例 3: 带重试的发布

```typescript
import { usePluginPublish, withRetry } from '@/store/plugin';

export function PublishWithRetry() {
  const { publish } = usePluginPublish();
  
  const handlePublish = async (params: PublishParams) => {
    // 最多重试 3 次，每次延迟 2 秒
    const publishWithRetry = withRetry(
      () => publish(params),
      3,
      2000
    );
    
    try {
      const result = await publishWithRetry();
      console.log('发布成功:', result);
    } catch (error) {
      console.error('重试后仍然失败:', error);
    }
  };
  
  return <button onClick={() => handlePublish(...)}>发布</button>;
}
```

### 示例 4: 进度展示

```typescript
import { usePluginPublish, formatProgress, getPublishStageText } from '@/store/plugin';
import { Progress } from 'antd';

export function PublishWithProgress() {
  const { publishVideo, publishProgress } = usePluginPublish();
  
  return (
    <div>
      {publishProgress && (
        <>
          <Progress percent={publishProgress.progress} />
          <p>
            {getPublishStageText(publishProgress.stage)}: {formatProgress(publishProgress.progress)}
          </p>
        </>
      )}
    </div>
  );
}
```

## 📝 注意事项

1. **轮询管理**
   - 使用 `usePlugin` 时会自动管理轮询
   - 组件卸载时会自动清理定时器
   - 无需手动调用 `stopPolling()`

2. **错误处理**
   - Hooks 返回的方法都使用 `OperationResult` 格式
   - 包含 `success`、`data` 和 `error` 字段
   - 建议使用这种方式而不是 try-catch

3. **文件大小限制**
   - 视频: 建议 ≤ 500MB
   - 图片: 建议每张 ≤ 10MB
   - 图文: 最多 9 张

4. **并发限制**
   - 同一时间只能有一个发布任务
   - `isPublishing` 为 `true` 时无法开始新发布

5. **平台差异**
   - 不同平台支持的功能可能不同
   - 参考各平台的具体文档

## 🔗 相关链接

- [Web API 文档](../../../demo/docs/WEB_API.md)
- [类型定义](../../../demo/PublishType/)
- [示例代码](./examples/)

## 📞 技术支持

如有问题或建议，请联系技术支持团队。

---

**版本**: 1.0.0  
**最后更新**: 2025-12-01

