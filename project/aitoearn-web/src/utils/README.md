# Utils 工具函数文档

本目录包含项目通用的工具函数和封装库。

## 文件列表

| 文件                    | 描述                                             |
| ----------------------- | ------------------------------------------------ |
| `index.ts`              | 通用工具函数（UUID、时间格式化、文件解析等）     |
| `format.ts`             | 数字/日期格式化工具                              |
| `general.ts`            | 页面标题与 SEO Metadata 生成                     |
| `oss.ts`                | OSS 资源 URL 处理                                |
| `auth.ts`               | 登录跳转工具                                     |
| `route.ts`              | 路由工具（公开页面判断）                         |
| `regulars.ts`           | 常用正则表达式                                   |
| `agent-asset.ts`        | Agent 素材类型判断与转换                         |
| `request.ts`            | 主 API 请求封装（get/post/put/delete/patch）     |
| `otherRequest.ts`       | 第三方/平台 API 请求封装                         |
| `storage.ts`            | LocalStorage 封装（SSR 安全）                    |
| `storageIndexedDb.ts`   | IndexedDB 封装（SSR 安全，自动降级）             |
| `createPersistStore.ts` | Zustand 持久化 Store 工厂函数                    |
| `appLaunch.ts`          | App 唤起工具（多策略：iframe + href + 超时降级） |
| `geoData.ts`            | 地理数据工具（国家/省/市三级联动数据源）         |
| `download.ts`           | 带进度回调的文件下载工具（fetchWithProgress）    |
| `FetchService/`         | 底层 Fetch 请求封装类                            |
| `detectPlatform.ts`     | URL 自动识别社交平台（`detectPlatformFromUrl`）  |
| `settlement.ts`         | CPM/CPE 预估计算（互动分、预估金额）             |

---

## index.ts - 通用工具函数

### 导入方式

```typescript
import {
  generateUUID,
  sleep,
  getFilePathName,
  formatTime,
  formatSeconds,
  describeNumber,
  parseTopicString,
  dataURLToBlob,
} from '@/utils'
```

### API

| 函数                        | 说明                                      | 参数                                          | 返回值                      |
| --------------------------- | ----------------------------------------- | --------------------------------------------- | --------------------------- |
| `generateUUID()`            | 生成 UUID v4 格式唯一 ID                  | -                                             | `string`                    |
| `sleep(ms)`                 | 等待指定毫秒                              | `ms: number`                                  | `Promise<void>`             |
| `getFilePathName(path)`     | 从文件路径中提取文件名和后缀              | `path: string`                                | `{ filename, suffix }`      |
| `formatTime(time, format?)` | 基于 dayjs 格式化时间                     | `time`, `format` 默认 `'YYYY-MM-DD HH:mm:ss'` | `string`                    |
| `formatSeconds(seconds)`    | 秒数转 `hh:mm:ss` 格式                    | `seconds: number`                             | `string`                    |
| `describeNumber(value)`     | 数值转中文简写（k/w）                     | `value: number`                               | `string`                    |
| `parseTopicString(input)`   | 提取字符串中的 `#话题` 并返回清理后的文本 | `input: string`                               | `{ topics, cleanedString }` |
| `dataURLToBlob(dataURL)`    | Base64 DataURL 转 Blob                    | `dataURL: string`                             | `Blob`                      |

### 使用示例

```typescript
// UUID
const id = generateUUID()

// 等待
await sleep(1000)

// 文件名解析
const { filename, suffix } = getFilePathName('path/to/file.png')
// => { filename: 'file.png', suffix: 'png' }

// 时间格式化
formatTime(new Date(), 'YYYY-MM-DD') // => '2024-01-01'

// 秒数格式化
formatSeconds(3661) // => '01:01:01'

// 数值简写
describeNumber(12345) // => '1.23w'
describeNumber(1500) // => '1.5k'

// 话题提取
parseTopicString('Hello #topic1 world #topic2')
// => { topics: ['topic1', 'topic2'], cleanedString: 'Hello world' }
```

---

## format.ts - 格式化工具

### 导入方式

```typescript
import { formatNumber, formatDate } from '@/utils/format'
```

### API

| 函数                        | 说明                               | 参数                                       | 返回值   |
| --------------------------- | ---------------------------------- | ------------------------------------------ | -------- |
| `formatNumber(value)`       | 大数字转 k/w 形式（保留 1 位小数） | `value: number`                            | `string` |
| `formatDate(date, format?)` | 基于 dayjs 格式化日期              | `date`, `format` 默认 `'YYYY-MM-DD HH:mm'` | `string` |

### 使用示例

```typescript
formatNumber(1234) // => '1.2k'
formatNumber(12345) // => '1.2w'

formatDate('2024-01-01') // => '2024-01-01 00:00'
formatDate(Date.now(), 'YYYY/MM/DD') // => '2024/01/01'
```

---

## currency.ts - 货币工具

### 导入方式

```typescript
import { appCurrency, appCurrencySymbol } from '@/utils/currency'
```

### API

| 导出                           | 类型                  | 说明                                             |
| ------------------------------ | --------------------- | ------------------------------------------------ |
| `appCurrency`                  | `'CNY' \| 'USD'`      | 当前环境对应的货币代码（国内 CNY / 海外 USD）    |
| `appCurrencySymbol`            | `'¥' \| '$'`          | 当前环境对应的货币符号                           |
| `getCurrencySymbol(currency?)` | `(string?) => string` | 根据货币代码获取符号，未知货币回退到当前环境符号 |
| `formatCents(cents)`           | `(number) => string`  | 分转元，格式化为两位小数（如 `500` → `'5.00'`）  |

### 使用示例

```tsx
;<span>
  {appCurrencySymbol}
  {amount.toFixed(2)} {appCurrency}
</span>
// 国内 => ¥100.00 CNY
// 海外 => $100.00 USD

// 根据具体货币代码获取符号
getCurrencySymbol('CNY') // => '¥'
getCurrencySymbol('USD') // => '$'
getCurrencySymbol() // => 当前环境符号

// 分转元（API 返回金额单位为分）
formatCents(500) // => '5.00'
formatCents(1299) // => '12.99'
```

---

## general.ts - 页面标题与 SEO

### 导入方式

```typescript
import { getPageTitle, getMetadata } from '@/utils/general'
```

### API

| 函数                             | 说明                                                     | 参数                                              | 返回值              |
| -------------------------------- | -------------------------------------------------------- | ------------------------------------------------- | ------------------- |
| `getPageTitle(name, lng)`        | 生成页面标题 `name —— AiToEarn`                          | `name: string`, `lng: string`                     | `Promise<string>`   |
| `getMetadata(props, lng, path?)` | 生成完整的 SEO Metadata（含 OG、Twitter Card、hreflang） | `props: Metadata`, `lng: string`, `path?: string` | `Promise<Metadata>` |

### 使用示例

```typescript
// 在 page.tsx 中使用
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>
}): Promise<Metadata> {
  const { lng } = await params
  return getMetadata({ title: '定价', description: '查看我们的定价方案' }, lng, '/pricing')
}
```

### 注意事项

- ⚠️ **禁止自己拼接 title**，统一使用 `getMetadata`

---

## oss.ts - OSS 资源 URL 处理

### 导入方式

```typescript
import { getOssUrl } from '@/utils/oss'
```

### API

| 函数               | 说明                                                 | 参数            | 返回值   |
| ------------------ | ---------------------------------------------------- | --------------- | -------- |
| `getOssUrl(path?)` | 将 OSS 路径拼接为完整 URL（已为完整 URL 则直接返回） | `path?: string` | `string` |

### 使用示例

```typescript
getOssUrl('https://example.com/images/avatar.png')
// => 'https://example.com/images/avatar.png'
```

---

## auth.ts - 登录跳转

### 导入方式

```typescript
import { navigateToLogin } from '@/utils/auth'
```

### API

| 函数                         | 说明                                                     | 参数                | 返回值 |
| ---------------------------- | -------------------------------------------------------- | ------------------- | ------ |
| `navigateToLogin(redirect?)` | 跳转到登录页，登录成功后重定向到指定 URL（默认当前页面） | `redirect?: string` | `void` |

### 使用示例

```typescript
// 跳转登录（登录后回到当前页面）
navigateToLogin()

// 指定登录后的目标页面
navigateToLogin('/dashboard')
```

---

## route.ts - 路由工具

### 导入方式

```typescript
import { isPublicPage } from '@/utils/route'
```

### API

| 函数                     | 说明                                 | 参数               | 返回值    |
| ------------------------ | ------------------------------------ | ------------------ | --------- |
| `isPublicPage(pathname)` | 判断路径是否为公开页面（不需要登录） | `pathname: string` | `boolean` |

### 公开页面白名单

`/auth`、`/websit`、`/blog`、`/chat`、`/promo`、`/welcome`、`/pricing` 以及首页 `/`。

### 使用示例

```typescript
isPublicPage('/en/pricing') // => true
isPublicPage('/zh-CN/dashboard') // => false
isPublicPage('/') // => true
```

---

## regulars.ts - 常用正则表达式

### 导入方式

```typescript
import { idNumberReg, phoneReg, emailReg, urlReg } from '@/utils/regulars'
```

### API

| 导出          | 说明                                                          |
| ------------- | ------------------------------------------------------------- |
| `idNumberReg` | 中国大陆身份证号校验（15/18 位）                              |
| `phoneReg`    | 中国大陆手机号校验（支持 +86 前缀）                           |
| `emailReg`    | 邮箱格式校验                                                  |
| `urlReg`      | URL 链接校验（要求 http/https 协议，支持 `@` 等合法路径字符） |

### 使用示例

```typescript
emailReg.test('user@example.com') // => true
phoneReg.test('13800138000') // => true
urlReg.test('https://example.com') // => true
```

---

## agent-asset.ts - Agent 素材工具

提供 Agent 素材的类型判断和数据转换功能。

### 导入方式

```typescript
import {
  isVideoAssetType,
  isImageAssetType,
  convertAssetToMediaItem,
  convertAssetsToMediaItems,
  filterAssetsByMediaType,
  filterAndConvertAssets,
  getAssetThumbUrl,
  getAssetMediaType,
} from '@/utils/agent-asset'
```

### API

| 函数                                          | 说明                          | 返回值             |
| --------------------------------------------- | ----------------------------- | ------------------ |
| `isVideoAssetType(type)`                      | 判断是否为视频类型            | `boolean`          |
| `isImageAssetType(type)`                      | 判断是否为图片类型            | `boolean`          |
| `convertAssetToMediaItem(asset)`              | 将 `AssetVo` 转为 `MediaItem` | `MediaItem`        |
| `convertAssetsToMediaItems(assets)`           | 批量转换                      | `MediaItem[]`      |
| `filterAssetsByMediaType(assets, mediaTypes)` | 按媒体类型过滤                | `AssetVo[]`        |
| `filterAndConvertAssets(assets, mediaTypes)`  | 过滤并转换为 `MediaItem`      | `MediaItem[]`      |
| `getAssetThumbUrl(asset)`                     | 获取素材缩略图 URL            | `string`           |
| `getAssetMediaType(asset)`                    | 获取素材媒体类型              | `'video' \| 'img'` |

### 使用示例

```typescript
// 过滤出所有图片并转换
const images = filterAndConvertAssets(assets, 'img')

// 获取缩略图
const thumb = getAssetThumbUrl(asset)
```

---

## request.ts - 主 API 请求封装

基于 `FetchService` 封装的项目主 API 请求工具，内置 Token 注入、语言头、错误提示和 401 拦截。

### 导入方式

```typescript
import request from '@/utils/request'
```

### API

| 方法                                     | 说明        | 参数                                          |
| ---------------------------------------- | ----------- | --------------------------------------------- |
| `request.get<T>(url, data?, silent?)`    | GET 请求    | `url`, `data`(query 参数), `silent`(静默错误) |
| `request.post<T>(url, data?, silent?)`   | POST 请求   | `url`, `data`(body), `silent`                 |
| `request.put<T>(url, data?, silent?)`    | PUT 请求    | `url`, `data`(body), `silent`                 |
| `request.delete<T>(url, data?, silent?)` | DELETE 请求 | `url`, `data`(body), `silent`                 |
| `request.patch<T>(url, data?, silent?)`  | PATCH 请求  | `url`, `data`(body), `silent`                 |

### 使用示例

```typescript
// GET 请求
const res = await request.get<UserInfo>('user/info')

// POST 请求
const res = await request.post<void>('user/update', { name: '新名称' })

// 静默模式（不弹错误提示，自行处理）
const res = await request.get<Data>('some/api', null, true)
```

### 注意事项

- Token 和语言头自动注入，无需手动添加
- 非 `silent` 模式下，非 0 响应码会自动弹出通知
- 401 会自动调用 `logout()`

---

## otherRequest.ts - 第三方/平台 API 请求

### 导入方式

```typescript
import { requestPlatApi } from '@/utils/otherRequest'
```

### API

| 函数                        | 说明                               | 参数                    | 返回值       |
| --------------------------- | ---------------------------------- | ----------------------- | ------------ |
| `requestPlatApi<T>(params)` | 平台 API 请求（无 Token/错误拦截） | `params: RequestParams` | `Promise<T>` |

### 使用示例

```typescript
const data = await requestPlatApi<SomeType>({
  url: 'https://api.platform.com/endpoint',
  method: 'POST',
  data: { key: 'value' },
})
```

---

## storage.ts - LocalStorage 封装

实现 Zustand `StateStorage` 接口的 LocalStorage 封装，SSR 安全。

### 导入方式

```typescript
import { appLocalStorage } from '@/utils/storage'
```

### API

| 方法                   | 说明                    |
| ---------------------- | ----------------------- |
| `getItem(name)`        | 获取值（SSR 返回 null） |
| `setItem(name, value)` | 设置值（SSR 时忽略）    |
| `removeItem(name)`     | 删除值（SSR 时忽略）    |

### 注意事项

- 一般不直接使用，由 `createPersistStore` 内部调用

---

## storageIndexedDb.ts - IndexedDB 封装

实现 Zustand `StateStorage` 接口的 IndexedDB 封装，SSR 安全，出错时自动降级到 LocalStorage。

### 导入方式

```typescript
import { indexedDBStorage } from '@/utils/storageIndexedDb'
```

### API

| 方法                   | 说明                                           |
| ---------------------- | ---------------------------------------------- |
| `getItem(name)`        | 获取值（SSR 返回 null，出错降级 localStorage） |
| `setItem(name, value)` | 设置值（跳过未 hydrate 的状态）                |
| `removeItem(name)`     | 删除值                                         |
| `clear()`              | 清空所有数据                                   |

### 注意事项

- 一般不直接使用，由 `createPersistStore` 内部调用
- 使用 `idb-keyval` 库操作 IndexedDB

---

## createPersistStore.ts - Zustand 持久化 Store 工厂

创建支持数据持久化的 Zustand Store，支持 LocalStorage 和 IndexedDB 两种存储方式。

### 导入方式

```typescript
import { createPersistStore } from '@/utils/createPersistStore'
```

### API

```typescript
function createPersistStore<T, M>(
  state: T, // 初始状态
  methods: (set, get) => M, // Store 方法
  persistOptions: PersistOptions, // 持久化配置（name 必填）
  type?: 'localStorage' | 'indexedDB' // 存储类型，默认 localStorage
)
```

### 内置方法

Store 自动注入以下方法：

| 方法                    | 说明                                 |
| ----------------------- | ------------------------------------ |
| `update(updater)`       | 深拷贝后更新状态（安全修改嵌套对象） |
| `markUpdate()`          | 标记更新时间                         |
| `setHasHydrated(state)` | 设置 hydration 状态                  |

### 使用示例

```typescript
const useMyStore = createPersistStore(
  { count: 0, name: '' },
  (set, get) => ({
    increment() {
      set({ count: get().count + 1 })
    },
  }),
  { name: 'my-store' },
  'localStorage'
)

// 使用 update 安全修改嵌套状态
useMyStore.getState().update((state) => {
  state.name = '新名称'
})
```

---

## FetchService/ - 底层 Fetch 封装

基于原生 `fetch` 的请求服务类，支持请求/响应拦截器、自动参数处理。

### 导入方式

```typescript
import FetchService from '@/utils/FetchService/FetchService'
import type { RequestParams, IFetchServiceConfig } from '@/utils/FetchService/types'
```

### 类型定义

```typescript
interface RequestParams extends RequestInit {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: Dictionary // body 数据（自动 JSON 序列化，支持 FormData）
  params?: Dictionary // query 参数（自动拼接 URL）
}

interface IFetchServiceConfig<T = Response> {
  baseURL: string
  requestInterceptor?: (requestParams: RequestParams) => RequestParams | void | null
  responseInterceptor?: (response: Response) => T
}
```

### 使用示例

```typescript
const service = new FetchService({
  baseURL: 'https://api.example.com/',
  requestInterceptor(params) {
    params.headers = { ...params.headers, Authorization: 'Bearer xxx' }
    return params
  },
  responseInterceptor(response) {
    return response
  },
})

const res = await service.request({
  url: 'users',
  method: 'GET',
  params: { page: 1 },
})
```

### 注意事项

- 一般不直接使用，由 `request.ts` 和 `otherRequest.ts` 内部调用
- 支持 `FormData` 上传（自动跳过 JSON 序列化）
- `data` 中值为 `undefined` 的字段会被自动过滤

---

## media.ts - 媒体文件工具函数

### 导入方式

```typescript
import { getVideoDuration, getVideoInfo, formatVideoDuration } from '@/utils/media'
```

### API

| 函数                           | 说明                                                     | 参数              | 返回值                                            |
| ------------------------------ | -------------------------------------------------------- | ----------------- | ------------------------------------------------- |
| `getVideoDuration(file)`       | 获取视频文件时长（秒），通过临时 video 元素读取 metadata | `file: File`      | `Promise<number>`                                 |
| `getVideoInfo(file)`           | 从本地视频文件提取封面（data URL）和时长                 | `file: File`      | `Promise<{ coverUrl: string; duration: number }>` |
| `formatVideoDuration(seconds)` | 格式化视频时长为 `M:SS` 格式                             | `seconds: number` | `string`                                          |

### 使用示例

```typescript
const duration = await getVideoDuration(videoFile)
// => 15.3

const info = await getVideoInfo(videoFile)
// => { coverUrl: 'data:image/jpeg;base64,...', duration: 15.3 }

formatVideoDuration(65) // => '1:05'
formatVideoDuration(7) // => '0:07'
```

---

## geoData.ts - 地理数据工具（国家/省/市）

### 导入方式

```typescript
import {
  getCountryOptions,
  getStateOptions,
  getCityOptions,
  getCountryDisplayName,
} from '@/utils/geoData'
```

### API

| 函数                                      | 说明                                    | 参数                                            | 返回值            |
| ----------------------------------------- | --------------------------------------- | ----------------------------------------------- | ----------------- |
| `getCountryOptions(lng)`                  | 获取所有国家列表，中文环境显示中文名    | `lng: string`                                   | `CountryOption[]` |
| `getStateOptions(countryCode)`            | 获取某国家的省/州列表，空数组表示无数据 | `countryCode: string`                           | `StateOption[]`   |
| `getCityOptions(countryCode, stateCode)`  | 获取某省/州的城市列表                   | `countryCode: string, stateCode: string`        | `CityOption[]`    |
| `getCountryDisplayName(countryCode, lng)` | 通过 ISO code 获取国家显示名            | `countryCode: string \| undefined, lng: string` | `string`          |

### 使用示例

```typescript
// 获取国家列表
const countries = getCountryOptions('zh-CN') // => [{ value: 'CN', label: '中国' }, ...]

// 获取省/州（空数组 → UI 降级文本输入）
const states = getStateOptions('US') // => [{ value: 'CA', label: 'California' }, ...]

// 获取城市
const cities = getCityOptions('US', 'CA') // => [{ value: 'Los Angeles', label: 'Los Angeles' }, ...]

// 获取国家显示名（用于展示）
getCountryDisplayName('US', 'zh-CN') // => '美国'
getCountryDisplayName('US', 'en') // => 'United States'
```

### 注意事项

- 数据源：`country-state-city` npm 包 + `src/data/countries_alpha2.json`（中文名映射）
- 某些小国可能无省/市数据，UI 需做降级处理

---

## appLaunch.ts - App 唤起工具

### 导入方式

```typescript
import { openApp } from '@/utils/appLaunch'
```

### API

| 函数                        | 说明                                              | 参数                                     | 返回值 |
| --------------------------- | ------------------------------------------------- | ---------------------------------------- | ------ |
| `openApp(apiUrl, onFailed)` | 通过多策略唤起 App（API 302 重定向到 scheme URL） | `apiUrl: string`, `onFailed: () => void` | `void` |

### 唤起策略

1. **iframe 唤起**：创建隐藏 iframe，浏览器跟随 302 重定向到 scheme URL
2. **location.href 备选**：延迟 200ms，给 iframe 优先机会
3. **超时降级**：2.5s 后通过 `visibilitychange` 判断是否唤起成功，失败则回调 `onFailed`

### 使用示例

```typescript
openApp('https://api.example.com/redirect', () => {
  console.log('唤起失败')
})
```

---

## download.ts - 下载工具

### 导入方式

```typescript
import { fetchWithProgress } from '@/utils/download'
```

### API

| 函数                                  | 说明                                                        | 参数                                                     | 返回值          |
| ------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------- | --------------- |
| `fetchWithProgress(url, onProgress?)` | 带进度回调的 fetch 下载，通过 ReadableStream 实时计算百分比 | `url: string`, `onProgress?: (progress: number) => void` | `Promise<Blob>` |

### 使用示例

```typescript
// 带进度回调下载
const blob = await fetchWithProgress('https://example.com/file.zip', (progress) => {
  console.log(`${progress}%`) // 0-100
})

// 不需要进度时
const blob = await fetchWithProgress('https://example.com/file.zip')
```

### 注意事项

- 无 `Content-Length` 响应头时降级为无进度下载（直接返回 blob，回调 100%）
- 进度值为 0-100 的整数

---

## settlement.ts - CPM/CPE 预估计算

### 导入方式

```typescript
import {
  ENGAGEMENT_WEIGHTS,
  calculateEngagementScore,
  calculateEstimatedAmount,
} from '@/utils/settlement'
```

### API

| 函数/常量                                              | 说明                                           | 参数                                                                         | 返回值   |
| ------------------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| `ENGAGEMENT_WEIGHTS`                                   | CPE 互动分权重（LIKE=1, COLLECT=3, COMMENT=5） | -                                                                            | `object` |
| `calculateEngagementScore(likes, favorites, comments)` | 计算互动分                                     | `likes, favorites, comments: number`                                         | `number` |
| `calculateEstimatedAmount(count, pricePerThousand)`    | 计算预估金额（分）                             | `count: number` (播放量/互动分), `pricePerThousand: number` (每千次单价，分) | `number` |

### 使用示例

```typescript
// 互动分 = 234×1 + 89×3 + 56×5 = 781
const score = calculateEngagementScore(234, 89, 56)

// CPM 预估 = (12345 / 1000) × 100 = 1235 分
const cpmAmount = calculateEstimatedAmount(12345, 100)

// CPE 预估 = (781 / 1000) × 500 = 391 分
const cpeAmount = calculateEstimatedAmount(score, 500)
```

---

## 新增工具函数规范

在添加新的工具函数前，请：

1. 检查本文档和 `src/lib/README.md`，确认是否已存在类似功能
2. 确认是否属于通用工具（非业务逻辑）
3. 添加完整的 JSDoc 注释
4. 更新本文档
