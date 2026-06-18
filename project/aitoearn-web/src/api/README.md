# API 目录规范

本目录只维护开源版前端实际使用的服务端 API 封装。新增接口前必须先检查对应模块 README 和现有 `*.api.ts` / `*.types.ts`，避免重复封装同一路径、重复声明请求参数或响应类型。

## 目录规则

- 每个业务域使用独立子目录，接口方法放在 `*.api.ts`，类型放在同目录 `*.types.ts`，常量放在同目录 `*.constants.ts`。
- 禁止恢复 `src/api/types` 这种全局类型堆叠目录；跨模块通用类型只有确认多模块复用后才放到 `_shared`。
- API 文件只放请求函数和少量私有 helper，不放导出类型、导出枚举、导出常量。
- 新增接口必须先用接口路径搜索 `src/api`，如果已有同功能方法，复用或扩展原方法，不要新增重复 wrapper。
- 删除接口前必须确认没有任何业务导入，并运行 `npx tsc --noEmit`。
- 子目录 README 只维护模块边界、文件清单、接口清单、类型清单和常量清单；新增规则统一维护在本文件，子目录只保留引用。

## 模块索引

| 模块             | 边界                                               | README                    |
| ---------------- | -------------------------------------------------- | ------------------------- |
| `_server/`       | SSR/Metadata/Sitemap 使用的公开 API 请求基础设施。 | `_server/README.md`       |
| `_shared/`       | 跨 API 模块确认复用的基础类型。                    | `_shared/README.md`       |
| `accounts/`      | 渠道账号、账号分组与排序。                         | `accounts/README.md`      |
| `ai/`            | AI 会话、Agent 任务、草稿生成与模型定价。          | `ai/README.md`            |
| `analytics/`     | 发布流程中使用的统计辅助接口。                     | `analytics/README.md`     |
| `auth/`          | 登录、验证码与当前用户信息。                       | `auth/README.md`          |
| `channels/`      | 渠道平台元数据、渠道授权、发布流程与发布记录。     | `channels/README.md`      |
| `config-editor/` | 配置管理、配置校验、保存、服务重启与健康检查。     | `config-editor/README.md` |
| `materials/`     | OSS 上传、媒体库、草稿素材、素材组与公开素材查询。 | `materials/README.md`     |
| `platforms/`     | 平台专项能力，例如发布、互动、作品校验和平台参数。 | `platforms/README.md`     |
