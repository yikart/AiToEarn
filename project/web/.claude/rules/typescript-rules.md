---
paths: "**/*.tsx"
---

# TypeScript 代码生成规则

## 基本原则

- 始终使用 TypeScript 确保类型安全。提供适当的类型定义和接口。
- 将组件实现为函数式组件,在需要状态管理时使用 hooks。
- 提供清晰、简洁的注释,解释复杂的逻辑或设计决策。
- 建议遵循与 Next.js 14 最佳实践一致的文件结构和命名约定。
- 仅在创建客户端组件时使用 `'use client'` 指令。

## 组件定义语法

在 .tsx 文件中使用以下组件定义语法,让 TypeScript 推断返回类型:

```tsx
const ComponentName = () => {
  // 组件逻辑
};
```

## Props 定义

使用接口定义 props:

```tsx
interface ComponentNameProps {
  // Props 定义
}

const ComponentName = ({ prop1, prop2 }: ComponentNameProps) => {
  // 组件逻辑
};
```

## 导出规范

### 命名导出

.tsx 文件中的组件使用命名导出:

```tsx
export const ComponentName = () => {
  // 组件逻辑
};
```

### 默认导出

页面组件在 .tsx 文件中使用默认导出:

```tsx
const Page = () => {
  // 页面组件逻辑
};

export default Page;
```

## 显式类型标注

如果需要显式类型标注,首选 `React.FC` 或 `React.ReactNode`:

```tsx
import React from 'react';

const ComponentName: React.FC = () => {
  // 组件逻辑
};

// 或者
const ComponentName = (): React.ReactNode => {
  // 组件逻辑
};
```

## 类型推断原则

- 定义 React 组件时,避免不必要的类型标注,尽可能让 TypeScript 推断类型。
- 仅在必要时使用 `React.FC` 或 `React.ReactNode` 进行显式类型标注,避免使用 `JSX.Element`。
- 编写简洁的组件定义,不要添加冗余的类型标注。
