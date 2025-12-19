---
paths: "**/app/**/*.tsx"
---

# Next.js 14 数据获取规则

## 服务端组件数据获取

在服务端组件中使用 fetch API 进行数据获取:

```tsx
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }
  })

  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }

  return res.json()
}

export default async function Page() {
  const data = await getData()

  // 使用数据渲染组件
  return <div>{/* 渲染逻辑 */}</div>
}
```

## 关键要点

- 服务端组件可以是 async 函数
- 使用 `fetch` API 的 `next` 选项配置缓存和重新验证
- 适当处理错误情况
- 数据获取在服务器端完成,减少客户端负担
