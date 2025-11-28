# AI内容生成功能文档

## 功能概述

这个功能允许用户在首页输入创作提示词，AI将自动生成完整的作品内容（包括标题、描述、标签和媒体文件），然后自动跳转到账号管理页面并打开发布弹窗，将生成的内容填充到发布表单中。

## 实现流程

### 1. 用户输入提示词（首页）

在首页 (`src/app/[lng]/page.tsx`) 的Hero区域，原来的h1标题已被替换为一个输入框：

```
用户操作：
1. 在输入框中输入创作提示词（例如："一个关于火星探索的科普视频"）
2. 点击"生成作品"按钮或按Enter键
```

### 2. 创建AI生成任务

调用API创建任务：

**接口**: `POST /agent/tasks`

**请求参数**:
```json
{
  "prompt": "用户输入的提示词"
}
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "id": "任务ID"
  }
}
```

### 3. 轮询任务状态

创建任务成功后，系统会每2秒轮询一次任务状态：

**接口**: `GET /agent/tasks/{taskId}`

**响应**:
```json
{
  "code": 0,
  "data": {
    "id": "任务ID",
    "userId": "用户ID",
    "prompt": "原始提示词",
    "title": "生成的标题",
    "description": "生成的描述",
    "tags": ["标签1", "标签2"],
    "status": "任务状态",
    "medias": [
      {
        "type": "VIDEO|IMAGE",
        "url": "媒体文件URL"
      }
    ],
    "errorMessage": "错误信息（如果失败）",
    "createdAt": "创建时间"
  }
}
```

### 4. 任务状态说明

| 状态 | 说明 | 显示文案 |
|------|------|----------|
| THINKING | AI思考中 | 思考中... |
| WAITING | 等待处理 | 等待中... |
| GENERATING_CONTENT | 生成内容中 | 内容生成中... |
| GENERATING_IMAGE | 生成图片中 | 图片生成中... |
| GENERATING_VIDEO | 生成视频中 | 视频生成中... |
| GENERATING_TEXT | 生成文本中 | 文本生成中... |
| COMPLETED | 完成 | 生成完成 |
| FAILED | 失败 | 生成失败 |
| CANCELLED | 已取消 | 已取消 |

### 5. 跳转到账号页面

当任务状态变为 `COMPLETED` 时，系统会自动跳转到账号管理页面：

```
跳转URL: /{lng}/accounts?generatedContent=true&taskId={taskId}&title={title}&description={description}&tags={tags}&mediaType={mediaType}&mediaUrl={mediaUrl}
```

### 6. 打开发布弹窗并填充内容

在账号管理页面 (`src/app/[lng]/accounts/accountCore.tsx`) 中：

1. 检测URL参数中的 `generatedContent=true`
2. 解析生成的内容数据
3. 自动打开发布弹窗（PublishDialog）
4. 延迟1.5秒后，将生成的内容填充到发布表单中：
   - 标题（title）
   - 描述（description）
   - 媒体文件（video或image）

## 文件结构

```
src/
├── api/
│   └── agent.ts                    # AI生成任务API接口
├── app/
│   └── [lng]/
│       ├── page.tsx                # 首页（包含输入框和任务创建逻辑）
│       ├── accounts/
│       │   └── accountCore.tsx     # 账号管理页面（接收数据并打开发布弹窗）
│       └── styles/
│           └── difyHome.module.scss # 样式文件（包含pulse动画）
└── components/
    └── PublishDialog/
        ├── index.tsx               # 发布弹窗组件
        └── usePublishDialog.ts     # 发布弹窗状态管理
```

## 关键代码位置

### API接口定义
- 文件: `src/api/agent.ts`
- 包含: TaskStatus枚举、接口类型定义、createTask和getTaskDetail方法

### 首页输入框和任务创建
- 文件: `src/app/[lng]/page.tsx`
- 组件: `Hero`函数
- 关键函数: `handleCreateTask`、`pollTaskStatus`

### 账号页面接收和填充
- 文件: `src/app/[lng]/accounts/accountCore.tsx`
- 关键逻辑: URL参数解析、PublishDialog打开、内容填充

## 使用流程示例

1. 用户在首页输入: "创建一个关于太空探索的短视频"
2. 系统创建任务，显示状态: "思考中..." → "内容生成中..." → "视频生成中..."
3. 任务完成后，自动跳转到账号页面
4. 发布弹窗自动打开，并填充:
   - 标题: "太空探索的奥秘"
   - 描述: "探索宇宙的无限可能，发现太空的神奇之处..."
   - 视频: AI生成的视频文件

## 错误处理

1. **输入验证**: 提示词不能为空
2. **创建失败**: 显示错误提示
3. **任务失败**: 显示失败原因（从errorMessage字段获取）
4. **超时处理**: 最长等待10分钟，超时后提示用户

## 注意事项

1. 轮询间隔设置为2秒，避免过于频繁的请求
2. 最大轮询时间为10分钟（600000ms）
3. 填充内容前会延迟1.5秒，确保PublishDialog完全初始化
4. AI生成的媒体文件已有ossUrl，不需要再次上传
5. 视频和图片不能同时存在，会根据mediaType自动处理

## 未来改进建议

1. 添加任务取消功能
2. 支持任务历史记录查看
3. 优化轮询机制（使用WebSocket）
4. 添加更多的状态提示和动画效果
5. 支持批量生成和一键发布到多个平台

