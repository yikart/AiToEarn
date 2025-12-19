# 项目主题色

1. 项目使用shadcnui 默认的中性灰色系即可,不需要其它主题色。
2. 注意项目要实现主题色 深色/浅色 切换,不要使用硬编码的颜色类(如 text-gray-900、bg-white),要使用shadcn/ui 的语义化颜色变量,全局css `/src/app/globals.css`。
3. 不要使用 `/src/app/var.css` 中的颜色,我现在在过渡阶段,项目中所有用到 var.css 的地方我都会逐渐全改了。

# 测试和文档规则

1. **测试文件**:
   - 除非用户明确要求编写测试,否则不要创建测试文件(`*.test.ts`, `*.test.tsx`, `*.spec.ts` 等)。
   - 不要自动创建 `__tests__` 目录。
   - 只在用户明确说"写测试"、"添加测试"、"需要测试"等时才创建测试文件。

2. **文档文件**:
   - 对于小的功能修改或 bug 修复,不要自动创建或更新 markdown 文档。
   - 只在以下情况下创建/更新文档:
     - 用户明确要求("写文档"、"更新文档"等)
     - 添加新的重大功能或模块(结构性变动)
     - 添加新的公共组件到 `src/components`
     - 添加新的工具函数到 `src/lib`
   - 不要创建 `IMPLEMENTATION_SUMMARY.md`, `CHANGELOG.md` 等总结性文档,除非用户明确要求。

# 注意事项

1. 目前项目正在从 ant-design 迁移到 shadcnui,之前使用 ant-design 的地方,碰到就改一下,然后新做的功能,都使用 shadcnui开发页面。

# Tailwind CSS v4 语法规范

项目使用 **Tailwind CSS v4**,引用 CSS 变量时必须使用新语法:

```tsx
// ✅ 正确写法(Tailwind CSS v4)
<div className="bg-(--primary-color) text-(--text-color) border-(--border-color)" />

// ❌ 错误写法(旧语法,会触发警告)
<div className="bg-[var(--primary-color)] text-[var(--text-color)] border-[var(--border-color)]" />
```

**规则说明:**
- 使用 `(--xxx)` 替代 `[var(--xxx)]`
- 不需要 `var()` 包裹
- 不需要方括号 `[]`
- 适用于所有 Tailwind 属性:`bg-`, `text-`, `border-`, `ring-`, `shadow-` 等

# 必须遵守

1. **开发之前,先查阅 `src/lib/README.md` 文档**,确认是否已存在相同或类似的工具方法,避免重复造轮子。

2. **在 `src/lib` 下添加新方法时,必须同步更新 `src/lib/README.md` 文档**。

3. **开发组件之前,先查阅 `src/components/README.md` 文档**,确认是否已存在相同或类似的组件,避免重复开发。

4. **在 `src/components` 下添加新组件时,必须同步更新 `src/components/README.md` 文档**。

# 代码质量要求

1. 尽量复用已有类型,不要写相同的重复类型。
2. 一定要复用已有的组件,不能重复造轮子,先去 src/components 目录下找。
3. 代码必须符合组件库的设计规范,不能随意更改样式。
4. 代码必须符合 lint 规范,不能有 lint 错误。
5. 代码必须符合 prettier 规范,不能有 prettier 错误。
6. 代码必须符合 typescript 规范,不能有 typescript 错误。
7. 代码必须符合最佳实践,不能有性能问题。
8. 代码必须符合安全规范,不能有安全漏洞。
9. 代码必须符合可维护性规范,不能有难以维护的代码。
10. 代码必须符合可读性规范,不能有难以阅读的代码,代码注释要全。
11. 页面顶部要有注释,包含组件名称、功能描述,其它信息就没必要了。
12. 所有涉及到API的操作,必须加loading,最典型的案例,一个弹框,填一些表单,点击创建按钮调用API创建数据,这时按钮一定要loading。
13. 所有涉及UI的开发,必须添加骨架屏loading状态,让用户体验更好。
14. 项目中所有 oss url的资源,都要包一层 getOssUrl做兼容,代码:`/src/utils/oss.ts`。
15. 一个文件别放太多代码,一个文件代码太多一定要拆出来,代码一定要易于扩展。
16. 按钮必须加上样式:`cursor: pointer;`。

# 目录规范

一个页面要包含多个组件,只有这个页面用到的私有组件就放到这个页面的文件夹下面,如:

- pages
  - dashboard
    - index.tsx
    - components
      - chart
        - index.tsx
      - stats
        - index.tsx

如果一个组件是多个页面公用的,就放到 src/components 目录下,如:
- components
  - button
    - index.tsx
  - modal
    - index.tsx

如果一个页面或者组件,功能比较多,需要跨多个组件共享状态,那么一定到创建要给store来管理组件的状态,如:
- chat // chat组件或页面
  -- components // chat 组件私有组件
     - message-list
       -- index.tsx
     - message-input
       -- index.tsx
  -- index.tsx // chat 组件或页面主文件
  -- chatStore // 存放 chat 相关的 store
     - index.ts // chatStore 主文件
     - chatStore.utils.ts // chatStore 工具函数
     - chatStore.types.ts // chatStore 类型定义
     - chatStore.constants.ts // chatStore 常量定义

# store

## 普通 store

方法不需要写类型,只有属性写类型即可,然后方法写到 methods 里面。
这样方法类型可以自动推断,然后也可以在内部使用 methods.fn() 互相调用,并且类型安全。

```ts
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

export interface IAccountStore {
  ...
}

const store: IAccountStore = {
  ...
}

function getStore() {
  return lodash.cloneDeep(store)
}

// 视频发布所有组件的共享状态和方法
export const useAccountStore = create(
  combine(
    {
      ...getStore(),
    },
    (set, get) => {
      const methods = {
        ...
      }
      return methods
    },
  ),
)
```

## 持久化 store

可以用封装的工具函数来创建持久化store:

/src/lib/store.ts

用法:

```ts
import { createPersistStore } from '@/lib/store'

export interface IUserStore {
  ...
}

const state: IUserStore = {
  ...
}

export const useUserStore = createPersistStore(
  {
    ...state,
  },
  (set, _get) => {
    const methods = {
      ...
    }

    return methods
  },
  {
    name: 'User',
  },
)
```

注意事项,注意,持久化的store使用了的 indexedDB,读取数据是异步的,需要通过_hasHydrated 来同步

```tsx
const {
  _hasHydrated,
} = usePublishDialogStorageStore(
  useShallow(state => ({
    _hasHydrated: state._hasHydrated,
  })),
)

useEffect(() => {
  if (_hasHydrated) {
    console.log('持久化数据同步完成')
  }
}, [_hasHydrated]);

```

## store 使用

使用useShallow,用于优化


```tsx
const {
  _hasHydrated,
} = usePublishDialogStorageStore(
  useShallow(state => ({
    _hasHydrated: state._hasHydrated,
  })),
)

```

# 国际化

页面上的所有文本必须做国际化处理。

国际化目录 `/src/app/i18n`

语法:

```tsx
function Chat() {
  return (
    <>
      t('media.uploadFailed')
    </>
  )
}
```

# SEO 元数据规范

页面的 SEO 元数据必须使用 `getMetadata` 方法,**不要自己拼接 title**:

```tsx
import { getMetadata } from '@/utils/general'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  let { lng } = await params
  if (!languages.includes(lng)) lng = fallbackLng
  const { t } = await useTranslation(lng, 'namespace')

  // ✅ 正确写法:使用 getMetadata,title 只传页面名称
  return getMetadata(
    {
      title: t('page.title'),  // 只传页面标题,不要拼接 "| AiToEarn"
      description: t('page.description'),
      keywords: 'keyword1, keyword2',
    },
    lng,
  )

  // ❌ 错误写法:自己拼接 title
  // return {
  //   title: `${t('page.title')} | AiToEarn`,
  //   ...
  // }
}
```

**规则说明:**
- `getMetadata` 方法内部会自动拼接 title 格式为 `{页面标题} —— AiToEarn`
- 不需要手动添加 openGraph 和 twitter 的 title(除非有特殊需求)
- 方法位置:`/src/utils/general.ts`

# 页面跳转链接规范

页面内部跳转链接**不需要指定语言前缀 `lng`**,系统会自动重定向到当前语言:

```tsx
// ✅ 正确写法:不需要语言前缀
<Link href="/pricing">定价</Link>
<a href="/accounts">账户</a>
router.push('/tasks')

// ❌ 错误写法:手动拼接语言前缀
<Link href={`/${lng}/pricing`}>定价</Link>
<a href={`/${lng}/accounts`}>账户</a>
router.push(`/${lng}/tasks`)
```

**规则说明:**
- 项目使用 Next.js 国际化路由,中间件会自动处理语言重定向
- 直接使用不带语言前缀的路径即可,如 `/pricing`、`/accounts`
- 系统会根据用户当前语言自动重定向到正确的路径
