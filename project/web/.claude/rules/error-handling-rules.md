---
paths: "**/app/error.tsx"
---

# Next.js 14 错误处理规则

## error.tsx 文件格式

在 Next.js 14 中,使用 error.tsx 文件处理错误:

```tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>出错了!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  )
}
```

## 关键要点

- error.tsx 必须是客户端组件(使用 `'use client'`)
- 接收 `error` 和 `reset` 两个参数
- `error` 对象可能包含 `digest` 属性用于错误追踪
- `reset` 函数用于重新渲染错误边界内的内容
