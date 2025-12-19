---
paths: "**/app/**/*.tsx"
---

# Next.js 14 元数据规则

## 元数据定义

在 Next.js 14 页面组件中定义元数据用于 SEO 优化:

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
}
```

## 动态元数据生成

对于需要动态生成的元数据,使用 `generateMetadata` 函数:

```tsx
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  // 根据 params 获取数据
  const data = await fetchData(id)

  return {
    title: data.title,
    description: data.description,
  }
}
```

## 关键要点

- 使用 Next.js 的 Metadata 类型确保类型安全
- 静态元数据使用 `export const metadata`
- 动态元数据使用 `generateMetadata` 函数
- 元数据会自动注入到页面的 `<head>` 标签中
