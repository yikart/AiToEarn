# AI内容生成功能实现文档

## 功能概述

在首页输入框输入创作提示词，AI将自动生成完整的作品内容（标题、描述、标签和媒体文件），完成后自动跳转到accounts页面并打开发布弹窗填充数据。

## 实现内容

### 1. API接口 (`src/api/agent.ts`)

- **创建任务**: `POST /agent/tasks`
  - 请求: `{ prompt: string }`
  - 响应: `{ id: string }`

- **查询任务**: `GET /agent/tasks/{taskId}`
  - 返回任务详情，包括status、title、description、tags、medias等

- **任务状态枚举**:
  - `THINKING`: 思考中
  - `WAITING`: 等待
  - `GENERATING_CONTENT`: 内容生成中
  - `GENERATING_IMAGE`: 图片生成中
  - `GENERATING_VIDEO`: 视频生成中
  - `GENERATING_TEXT`: 文本生成中
  - `COMPLETED`: 完成
  - `FAILED`: 失败
  - `CANCELLED`: 已取消

### 2. 首页Hero组件 (`src/app/[lng]/page.tsx`)

#### 功能特性

1. **输入框**:
   - 替换原来的h1标题
   - 支持Enter键快捷生成
   - 禁用状态在生成过程中

2. **进度显示**:
   - 使用打字机效果逐字显示进度信息
   - 固定高度（200px）的可滚动区域
   - 状态变化时累计展示，不会覆盖之前的信息
   - description只显示一次

3. **状态轮询**:
   - 每2秒轮询一次任务状态
   - 最大轮询时间10分钟
   - 状态变化时即时更新显示

4. **完成跳转**:
   - 任务完成后自动跳转到accounts页面
   - 携带参数: taskId, title, description, tags, medias

### 3. Accounts页面 (`src/app/[lng]/accounts/accountCore.tsx`)

#### 功能特性

1. **参数接收**:
   - 监听URL参数 `aiGenerated=true`
   - 解析AI生成的数据（tags、medias等）

2. **自动打开发布弹窗**:
   - 等待账户列表加载完成
   - 默认选中第一个账户
   - 延迟500ms后打开弹窗

3. **数据填充**:
   - 标题填充到title字段
   - 描述+tags（以#开头）填充到des字段
   - tags追加格式: `\n\n#tag1 #tag2 #tag3`
   - 媒体文件处理:
     - VIDEO类型: 填充到video字段，清空images
     - IMAGE类型: 填充到images数组，支持多张图片
   - 延迟1秒后填充，确保PublishDialog完全初始化
   - 如果pubList未初始化，1秒后自动重试

### 4. 发布弹窗修复 (`src/components/PublishDialog/index.tsx`)

#### 修复问题

**问题**: 关闭发布弹窗后再打开无法选择账户

**原因**: 在弹窗关闭时调用了`clear()`方法，清空了所有数据包括`pubList`

**解决方案**:
- 弹窗关闭时不调用`clear()`
- 只清除选中状态(`pubListChoosed`)和步骤(`step`)
- 保留`pubList`以便下次打开时可以选择账户

### 5. 样式优化 (`src/app/[lng]/styles/difyHome.module.scss`)

添加光标闪烁动画:
```scss
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

## 使用流程

1. **用户输入**: 在首页输入框输入创作提示词，如"创建一个关于火星的科普视频"

2. **任务创建**: 点击"生成作品"按钮，系统创建AI生成任务

3. **进度展示**: 
   ```
   💭 AI思考中...
   ✍️ 文本生成中...
   🎬 视频生成中...
   📄 你知道火星上曾经有液态水流淌吗...
   ✅ 生成完成！
   ```

4. **自动跳转**: 任务完成后自动跳转到accounts页面

5. **弹窗填充**:
   - 自动打开发布弹窗
   - 默认选中第一个账户
   - 填充标题、描述、标签和媒体文件

6. **发布作品**: 用户可以进一步编辑或直接发布

## 数据流转

```
首页输入 
  → 创建任务(POST /agent/tasks)
  → 轮询状态(GET /agent/tasks/{taskId})
  → 进度展示(打字机效果)
  → 完成跳转(携带参数)
  → Accounts页面接收参数
  → 打开发布弹窗
  → 填充数据
  → 用户发布
```

## 关键技术点

1. **打字机效果**: 使用字符索引和setTimeout实现逐字显示
2. **状态轮询**: 递归调用setTimeout，避免固定间隔的setInterval
3. **数据填充延迟**: 使用setTimeout确保PublishDialog完全初始化
4. **重试机制**: pubList未初始化时自动重试
5. **状态管理**: 区分清除数据和重置状态，避免过度清除

## 注意事项

1. tags需要以`#`开头追加到description后面
2. medias是数组，需要区分VIDEO和IMAGE类型
3. 发布弹窗关闭时不能清空pubList
4. AI生成的媒体文件已有ossUrl，不需要再次上传
5. 需要等待账户列表加载完成后再处理AI生成数据

## 测试建议

1. 测试输入框的禁用和启用状态
2. 测试进度信息的打字机效果
3. 测试不同状态的正确显示
4. 测试失败和超时的错误处理
5. 测试多个媒体文件的正确填充
6. 测试弹窗关闭后再打开的账户选择功能

