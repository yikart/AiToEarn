# Lib 工具库文档

本目录包含项目通用的工具函数和封装库。

## 文件列表

| 文件 | 描述 |
|------|------|
| `toast.ts` | Toast 消息提示工具，替代 antd message |
| `confirm.tsx` | 命令式确认弹窗工具，替代 antd Modal.confirm |
| `utils.ts` | 通用工具函数 |

---

## toast.ts - 消息提示工具

基于 [sonner](https://sonner.emilkowal.ski/) 封装的 Toast 消息提示工具，**用于替代 antd 的 `message` 组件**。

### 导入方式

```typescript
import { toast } from '@/lib/toast'
// 或
import toast from '@/lib/toast'
```

### API

| 方法 | 说明 | 参数 |
|------|------|------|
| `toast.success(content, options?)` | 成功消息（绿色） | `content`: 消息内容 |
| `toast.error(content, options?)` | 错误消息（红色） | `content`: 消息内容 |
| `toast.warning(content, options?)` | 警告消息（黄色） | `content`: 消息内容 |
| `toast.info(content, options?)` | 信息消息（蓝色） | `content`: 消息内容 |
| `toast.loading(content, options?)` | 加载消息（带 loading 图标） | `content`: 消息内容 |
| `toast.open(options)` | 自定义类型消息（兼容 antd） | 见下方 |
| `toast.destroy(key?)` | 关闭指定/所有消息 | `key`: 消息 ID |
| `toast.dismiss(key?)` | 关闭指定/所有消息（别名） | `key`: 消息 ID |
| `toast.dismissAll()` | 关闭所有消息 | - |

### Options 参数

```typescript
type ToastOptions = {
  key?: string      // 消息唯一标识（用于更新/关闭）
  id?: string       // 同 key
  duration?: number // 显示时长（秒），loading 默认 Infinity
  content?: React.ReactNode // 消息内容（用于对象形式调用）
}
```

### 使用示例

```typescript
// 基本用法
toast.success('保存成功')
toast.error('操作失败')
toast.warning('请注意')
toast.info('提示信息')

// 带 options
toast.success('保存成功', { duration: 5 })

// loading 状态
const toastId = toast.loading('加载中...')
// 完成后关闭
toast.dismiss(toastId)

// 兼容 antd message.open 写法
toast.open({
  type: 'success',
  content: '操作成功',
  key: 'unique-key',
  duration: 3
})
```

### 注意事项

- ⚠️ **禁止使用 antd 的 `message` 组件**，统一使用此工具
- `duration` 参数单位为**秒**（内部会转换为毫秒）
- `loading` 类型默认不会自动关闭，需手动调用 `dismiss`

---

## confirm.tsx - 命令式确认弹窗

基于 [shadcn/ui AlertDialog](https://ui.shadcn.com/docs/components/alert-dialog) 封装的命令式确认弹窗，**用于替代 antd 的 `Modal.confirm` 方法**。

### 导入方式

```typescript
import { confirm } from '@/lib/confirm'
```

### API

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `title` | 标题 | `React.ReactNode` | `"Confirm"` |
| `content` | 内容描述 | `React.ReactNode` | - |
| `okText` | 确认按钮文本 | `React.ReactNode` | `"Confirm"` |
| `cancelText` | 取消按钮文本 | `React.ReactNode` | `"Cancel"` |
| `onOk` | 确认回调（支持异步） | `() => Promise<any> \| any` | - |
| `onCancel` | 取消回调（支持异步） | `() => Promise<any> \| any` | - |
| `okButtonProps` | 确认按钮属性 | `ButtonProps` | - |
| `cancelButtonProps` | 取消按钮属性 | `ButtonProps` | - |
| `icon` | 自定义图标 | `React.ReactNode` | 黄色警告图标 |

### 返回值

返回 `Promise<boolean>`：
- `true`：用户点击确认
- `false`：用户点击取消

### 使用示例

```typescript
// 基本用法
const result = await confirm({
  title: '删除确认',
  content: '确定要删除此项吗？此操作不可恢复。',
})

if (result) {
  // 用户确认
  await deleteItem()
}

// 带异步回调
await confirm({
  title: '提交确认',
  content: '确定要提交吗？',
  okText: '提交',
  cancelText: '取消',
  onOk: async () => {
    await submitData()
  },
})

// 自定义按钮样式
await confirm({
  title: '危险操作',
  content: '此操作将永久删除数据',
  okButtonProps: {
    className: 'bg-red-500 hover:bg-red-600',
  },
})
```

### 注意事项

- ⚠️ **禁止使用 antd 的 `Modal.confirm`**，统一使用此工具
- 此组件为命令式调用，会自动创建和销毁 DOM 节点
- `onOk` 回调执行期间会显示 loading 状态
- 如果 `onOk` 抛出异常，Promise 会 reject

---

## utils.ts - 通用工具函数

### cn - 类名合并工具

合并 Tailwind CSS 类名，自动处理冲突和条件类名。基于 `clsx` + `tailwind-merge`。

#### 导入方式

```typescript
import { cn } from '@/lib/utils'
```

#### 使用示例

```typescript
// 基本合并
cn('px-4 py-2', 'bg-blue-500')
// => 'px-4 py-2 bg-blue-500'

// 条件类名
cn('base-class', isActive && 'active-class')
// => 'base-class active-class' 或 'base-class'

// 对象语法
cn('base', { 'text-red-500': hasError, 'text-green-500': !hasError })

// 处理 Tailwind 类冲突
cn('px-4', 'px-6')
// => 'px-6' (后者覆盖前者)

// 在组件中使用
<div className={cn('default-styles', className, {
  'opacity-50': disabled
})}>
```

#### 为什么使用 cn？

1. **解决类名冲突**：`tailwind-merge` 会智能合并冲突的 Tailwind 类
2. **条件类名**：`clsx` 支持条件表达式、数组、对象等多种语法
3. **类型安全**：完整的 TypeScript 支持

---

## 新增工具方法规范

在添加新的工具方法前，请：

1. 检查本文档确认是否已存在类似功能
2. 确认是否属于通用工具（非业务逻辑）
3. 添加完整的 JSDoc 注释
4. 更新本文档

