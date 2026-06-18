# Utils 全局工具目录

`src/utils` 是项目唯一的全局工具目录。这里只放跨页面、跨业务复用的纯工具函数、稳定基础设施封装和低业务耦合的工具能力；单页面、单布局、单 store 或单 hook 使用的逻辑必须下沉到对应局部目录。

## 准入标准

- 功能被多个页面、布局、组件域或 API 模块复用，才能放入 `src/utils`。
- 单一调用方、单一 store、单一 hook 的工具必须放在调用方目录下，例如 `src/store/user/utils/`。
- Agent、请求、存储、UI、社交账号等有明确模块归属的工具必须归入对应一级子目录，不要散落在根目录。
- 禁止重新新增 `src/lib` 作为工具目录；历史 `lib` 能力应迁移到 `src/utils`、`src/api`、`src/app/i18n` 或局部目录。
- 新增、迁移、删除任意 utils 文件时，必须同步更新本文件和目标子目录 README。

## 一级目录

| 目录       | 作用                        | 覆盖范围                                      |
| ---------- | --------------------------- | --------------------------------------------- |
| `agent/`   | Agent 业务共享工具          | Agent 素材类型判断、筛选和素材转换            |
| `region/`  | 区域与域名工具              | 国内/国际域名切换、区域限制确认跳转           |
| `request/` | 客户端请求基础设施          | `request`、默认 `http`、请求参数类型          |
| `social/`  | 社交账号工具                | 社交账号粉丝统计、同步提示判断                |
| `storage/` | 浏览器存储与 zustand 持久化 | localStorage、IndexedDB、`createPersistStore` |
| `ui/`      | 命令式 UI 工具              | `confirm`、`toast`、`notification`            |

每个一级子目录必须维护自己的 `README.md`，记录文件清单、导出方法和新增规则。

## 根目录文件

| 文件           | 说明                                                                               |
| -------------- | ---------------------------------------------------------------------------------- |
| `common.ts`    | UUID、sleep、文件名解析、话题提取等跨业务基础工具。                                |
| `metadata.ts`  | `getMetadata`，页面 SEO Metadata 生成。                                            |
| `title.ts`     | `getPageTitle`，页面标题生成。                                                     |
| `className.ts` | `cn`，合并 `clsx` 与 `tailwind-merge`，供 UI className 组合使用。                  |
| `format.ts`    | 数字、日期、秒数、推荐分、相对时间和简写数值格式化。                               |
| `oss.ts`       | OSS/R2 URL、代理 URL、缩略图处理。                                                 |
| `currency.ts`  | 应用币种、货币符号与金额格式化。                                                   |
| `auth.ts`      | 登录跳转与鉴权相关通用跳转工具。                                                   |
| `browser.ts`   | 跨页面浏览器/WebView 判断；设备上报识别已下沉到 `src/store/user/utils/device.ts`。 |
| `media.ts`     | 媒体类型识别、上传 accept、媒体元信息读取。                                        |
| `download.ts`  | 带进度回调的下载工具。                                                             |
| `appLaunch.ts` | App 唤起与降级跳转。                                                               |

## README 维护规则

- 新增根目录工具：更新本文件“根目录文件”。
- 新增子目录工具：更新本文件“一级目录”，并同步更新对应 `src/utils/<dir>/README.md`。
- 迁移工具：同时更新迁出目录、迁入目录 README，并删除旧路径说明。
- 删除工具：删除文件后必须从 README 文件清单移除，并用 `rg` 确认无旧路径引用。
- API、i18n、store、hook 私有能力不写入 `src/utils` README，应写入各自目录文档。

## 常用导入

```ts
import { cn } from '@/utils/className'
import { formatDate, formatRelativeTime } from '@/utils/format'
import { getMetadata } from '@/utils/metadata'
import { confirm } from '@/utils/ui/confirm'
import { toast } from '@/utils/ui/toast'
import http, { request } from '@/utils/request'
```
