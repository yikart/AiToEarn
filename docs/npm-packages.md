# 对外 npm 包（aitoearn-sdk）

AiToEarn 对外发布的 npm 包已经从后端 Nx workspace 抽离到**独立仓库** `yikart/aitoearn-sdk`，
并以 `@airongrong` scope 发布到 npm（`@aitoearn` scope 属组织账号，当前账号无发布权限）：

| 包 | 当前版本 | 说明 |
| --- | --- | --- |
| `@airongrong/plugin-api` | 1.0.0-beta.0 | 插件 SDK：清单 schema、适配器契约、宿主服务类型、错误码 |
| `@airongrong/capability` | 1.0.0-beta.0 | `capability.yaml` 单一事实源 + 五表面生成器 |
| `@airongrong/plugin-cli` | 1.0.0-beta.0 | `aitoearn-plugin` CLI：new / verify / pack / sign / cap |

## 为什么拆走

- 这三个包零 `@yikart/*`、零 NestJS 依赖，放在私有后端 workspace 里只会被内部依赖污染。
- 发版节奏不同：SDK 跟着插件作者与 Agent 集成方，后端跟着服务部署。
- 插件作者需要公开读源码、提 issue、看 CHANGELOG。

## 宿主怎么依赖

`apps/aitoearn-server` 按 registry 版本号依赖（不再是 `workspace:*`，也不再需要软链接）：

```json
{
  "dependencies": { "@airongrong/plugin-api": "1.0.0-beta.0" },
  "devDependencies": { "@airongrong/capability": "1.0.0-beta.0" }
}
```

`tsconfig.base.json` 里对应的 `paths` 已删除，全部走 `node_modules` 解析；
`eslint.config.mjs` 的 `enforce-module-boundaries` 已把 `^@airongrong/` 列为外部 SDK 白名单。

## 升级 SDK 版本

1. `aitoearn-sdk` 仓发版（changesets）后，改 `apps/aitoearn-server/package.json` 里的版本号；
2. 本仓 `pnpm install`（lockfile 随之更新，CI `--frozen-lockfile` 保持可用）；
3. 跑 `nx build aitoearn-server` + server 全量测试确认契约兼容。

## 本地联调（SDK 未发布改动）

SDK 仓 `pnpm build` 后，在后端用官方 link 方式临时顶替 registry 版本：

```bash
cd <aitoearn-sdk>/packages/plugin-api && pnpm link --global
cd project/aitoearn-backend && pnpm link --global @airongrong/plugin-api
```

联调结束 `pnpm unlink` 并重新 `pnpm install` 回到 registry 版本。

## 发布 checklist（已完成 ✅，后续复用）

1. 在 `aitoearn-sdk` 仓：`pnpm changeset` → 合并 Version PR → CI 自动 `changeset publish`（需配置 `NPM_TOKEN` secret，granular token + bypass 2FA）。
2. 回到本仓：更新版本号 + `pnpm install`。
3. 手动发布参考：`npm publish --access public`（scoped 包必须显式 public）。

## 版本联动

三个包在 `.changeset/config.json` 里配置 `fixed`，永远同版本号发布；
`HOST_API_VERSION` 与 SDK 主版本绑定，宿主加载插件时用 `isApiCompatible()` 做门禁，
breaking change 必须升主版本。
