# 更新日志

## v2.0.0 (2025-12-02)

### ✨ 新功能

#### 1. 发布任务列表管理

- **发布任务持久化**: 使用 zustand persist 中间件，自动保存发布任务到 localStorage
- **任务状态管理**: 
  - 支持多平台任务管理（一次发布可包含多个平台）
  - 实时更新平台任务状态和进度
  - 自动计算整体任务状态
- **任务配置**: 
  - 可配置最大任务数（默认100）
  - 支持自动清理已完成任务
  - 可自定义清理时间

#### 2. 发布列表弹框组件 (PublishListModal)

- 展示所有发布任务列表
- 显示任务状态（待发布、发布中、已完成、失败）
- 显示包含的平台标签
- 支持点击查看详情
- 表格分页展示
- 响应式设计，适配移动端

#### 3. 发布详情弹框组件 (PublishDetailModal)

- 显示任务基本信息（标题、描述、创建时间）
- 展示每个平台的详细进度
- 实时显示发布状态（进度条 + 消息）
- 显示发布结果（作品ID、分享链接）
- 显示错误信息
- 支持两种使用方式：
  - 传入 task 对象
  - 传入 taskId（自动从 store 获取）
- 美观的卡片式设计
- 完整的时间信息展示

#### 4. 完整的国际化支持

- **中文 (zh-CN)**: 完整的中文文案
- **英文 (en)**: 完整的英文文案
- **国际化覆盖**:
  - 插件状态文本
  - 发布阶段文本
  - 错误消息
  - 组件界面文本
  - 按钮和操作文本

#### 5. 新增 Store 方法

```typescript
// 添加发布任务
addPublishTask(task): string

// 更新平台任务
updatePlatformTask(taskId, platform, updates): void

// 删除发布任务
deletePublishTask(taskId): void

// 清空所有任务
clearPublishTasks(): void

// 获取任务详情
getPublishTask(taskId): PublishTask | undefined

// 更新任务列表配置
updateTaskListConfig(config): void
```

### 📦 新增文件

```
src/store/plugin/
├── locales/                          # 国际化文件
│   ├── zh-CN.json                   # 中文
│   └── en.json                      # 英文
├── types/
│   └── publishTask.baseTypes.ts         # 发布任务类型定义
├── components/                       # 组件目录
│   ├── PublishListModal.tsx         # 发布列表弹框
│   ├── PublishListModal.module.scss # 样式
│   ├── PublishDetailModal.tsx       # 发布详情弹框
│   ├── PublishDetailModal.module.scss # 样式
│   ├── index.ts                     # 组件导出
│   ├── example.tsx                  # 使用示例
│   └── README.md                    # 组件文档
├── QUICK_START.md                   # 快速开始文档
└── CHANGELOG.md                     # 本文件
```

### 🔄 变更

- **store.ts**: 扩展为支持任务列表管理的 ExtendedPluginStore
- **baseTypes.ts**: 添加任务相关类型定义
- **constants.ts**: 添加国际化 key 映射
- **index.ts**: 导出新增的组件和类型

### 🎨 样式优化

- 使用 CSS 变量，支持主题定制
- BEM 命名规范（修改为单下划线）
- SCSS Module 模块化
- 响应式设计

### 📚 文档

- ✅ 组件使用文档 (`components/README.md`)
- ✅ 快速开始指南 (`QUICK_START.md`)
- ✅ 完整示例代码 (`components/example.tsx`)
- ✅ 类型定义说明
- ✅ 国际化配置说明

### 🔧 技术栈

- **zustand**: 状态管理
- **zustand/middleware**: persist 中间件（任务持久化）
- **react-i18next**: 国际化
- **ant-design**: UI 组件库
- **dayjs**: 时间格式化
- **TypeScript**: 类型支持

### 💡 使用场景

1. **单次发布多个平台**: 一次性发布到抖音、小红书等多个平台
2. **实时进度追踪**: 查看每个平台的发布进度和状态
3. **历史记录查看**: 查看所有发布历史记录
4. **发布结果管理**: 统一管理所有平台的发布结果

### 🚀 快速开始

```tsx
import { 
  usePluginStore,
  PublishListModal,
  PublishDetailModal,
  PlatformTaskStatus,
} from '@/store/plugin'

// 创建任务
const taskId = addPublishTask({
  title: '我的视频',
  platformTasks: [...]
})

// 更新进度
updatePlatformTask(taskId, 'douyin', {
  status: PlatformTaskStatus.PUBLISHING,
  progress: { stage: 'upload', progress: 50 }
})

// 显示列表和详情
<PublishListModal visible={true} />
<PublishDetailModal taskId={taskId} />
```

### 📝 迁移指南

#### 从 v1.x 迁移

v2.0 完全向后兼容 v1.x 版本，无需修改现有代码。

新功能为可选功能：
- 不使用任务列表功能，行为与 v1.x 完全一致
- 可选择性地使用新组件和功能

### ⚠️ 注意事项

1. **localStorage 大小**: 任务列表持久化在 localStorage，注意存储空间限制
2. **最大任务数**: 默认保存最多 100 个任务，可通过配置调整
3. **国际化配置**: 需要项目已配置 react-i18next
4. **类型兼容**: 某些 Store 方法为可选方法，使用时需检查是否存在

### 🎯 下一步计划

- [ ] 支持任务导出（JSON、CSV）
- [ ] 支持任务筛选和搜索
- [ ] 添加任务统计图表
- [ ] 支持任务分组管理
- [ ] 添加任务备注功能

---

**完整文档**: [README.md](./README.md)  
**快速开始**: [QUICK_START.md](./QUICK_START.md)  
**组件文档**: [components/README.md](./components/README.md)

