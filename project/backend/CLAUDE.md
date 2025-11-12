AI Prompt 开发规范

总原则

- 类型安全与输入输出分离：请求仅用 DTO 校验与转换，响应仅用 VO 封装。
- 分层职责清晰：Controller 只做路由/参数绑定/响应转换；Service 负业务编排与权限过滤；Repository 仅做数据访问，不含业务与权限判断。
- 统一异常：仅通过 AppException + ResponseCode 抛业务错误，由全局过滤器统一 200 响应格式。

命名与文件

- 类/接口/枚举 PascalCase；变量/函数 camelCase；常量 UPPER_SNAKE_CASE。
- 文件后缀：`*.controller.ts` / `*.service.ts` / `*.module.ts` / `*.dto.ts` / `*.vo.ts` / `*.repository.ts`。

DTO（输入）

- 先写 zod schema，再用 `createZodDto(schema, 'IdString')` 生成 DTO；禁止以实体充当输入。
- 分页入参统一使用 `PaginationDtoSchema`（page ≥1，pageSize ∈[1,1000]，字符串数字自动转换）。

```ts
import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { z } from 'zod'

export const CreateOrderDtoSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
  returnTo: z.string().url().optional(),
})
export class CreateOrderDto extends createZodDto(CreateOrderDtoSchema, 'CreateOrderDto') {}
```

VO（输出）

- VO 仅暴露稳定对外字段；Service 中做映射，Controller 使用 `VoClass.create(data)` 输出（普通 VO）；禁止直接返回数据库实体。
- 分页响应统一用 `createPaginationVo`（分页 VO 实例化使用 `new`），字段为：page、pageSize、totalPages、total、list。

```ts
import { createPaginationVo, createZodDto } from '@yikart/common'
import { z } from 'zod'

export const OrderDetailVoSchema = z.object({ id: z.string(), amount: z.number(), createdAt: z.date() })
export class OrderDetailVo extends createZodDto(OrderDetailVoSchema, 'OrderDetailVo') {}
export class OrderListVo extends createPaginationVo(OrderDetailVoSchema, 'OrderListVo') {}
```

异常与错误码

- 仅允许：`new AppException(code)` 或 `new AppException(code, data)`；消息由 code→文案映射生成，禁止自定义覆盖。

```ts
import { AppException, ResponseCode } from '@yikart/common'

throw new AppException(ResponseCode.PaymentPriceNotFound, { priceId: 'price_xxx' })
```

ResponseCode 规范

- 成功码固定 `Success = 0`；业务错误码从 `10000` 起按模块区间分配，禁止跨模块复用。
- 命名使用 PascalCase，必须指明具体资源：如 `ContractNotFound`、`CommentNotFound`；禁止通用权限名（`Unauthorized`/`AccessDenied` 等）。
- 仅在公共包集中定义并导出；所有服务引用同一来源，避免分散定义。
- 必须维护 code→默认文案的映射；未命中使用“未知错误”。
- 与 AppException 协作：仅传 `code` 或 `code+data`，不得传自定义 message（消息由映射生成）。
- 新增流程：在 `ResponseCode` 加常量 → 在消息映射处加默认文案 → 在业务中使用。

```ts
import { ResponseCode } from '@yikart/common'
// 示例：定义（公共包内）
// export enum ResponseCode { Success = 0, PaymentPriceNotFound = 15004 }
// 示例：业务抛错已见上文 AppException 示例
```

权限与数据访问

- 权限通过查询条件过滤；优先以具体资源 NotFound 替代通用权限异常；权限位于 Service 层。
- Repository 只访问自身数据模型；禁止跨模型、权限判断、额外存在性查询（存在性由 Service 先查）。

日志与 Lint

- 禁止使用 console；使用依赖注入的 Logger 实例（如 `this.logger.log()`）。
- 严格遵循 ESLint（根 `eslint.config.mjs`）；提交前需通过 `pnpm lint -w` 与类型检查。

必须遵循（硬性）

- Controller 仅路由/参数绑定/响应转换；Service 负业务编排与权限过滤；Repository 仅数据访问。
- Controller 输出必须统一用 VO（普通 VO 使用 `VoClass.create(data)`；分页 VO 使用 `new`）；Service 返回实体数据，由 Controller 转 VO，不反向。
- DTO/VO 必须以 zod schema 定义，并用 `createZodDto` / `createPaginationVo` 生成。
- 分页：入参用 `PaginationDtoSchema`；出参字段固定为 page、pageSize、totalPages、total、list。
- AppException 仅以 code 或 code+data 构造，消息来自映射。
- 权限通过查询条件过滤；未命中以具体资源 NotFound 表示；权限逻辑在 Service 层。
- 优先软删除（`deletedAt`）；状态转换在 Service 层处理；避免复杂状态枚举。
- 统计/计数在数据库层实现，禁止应用层遍历聚合。
- HTTP 装饰器路径必须以 `/` 开头，禁止空参数；含分页的方法名以 `WithPagination` 结尾。

禁止事项（硬性）

- 在 Controller 编写业务逻辑或直接访问数据库；直接返回数据库实体；跳过 DTO/VO。
- 在 Repository 执行权限判断、跨数据模型操作、或额外存在性查询；Repository 方法包含不必要参数。
- 使用通用权限异常名（Unauthorized/PermissionDenied/AccessDenied），而非具体资源 NotFound。
- 覆盖 AppException 默认消息或自定义业务异常类型；在业务代码中自定义 HTTP 状态码。
- 使用 Logger 静态方法或 `console`；直接读取环境变量（必须通过配置模块）。
- 使用 `as any` 或显式绕过类型检查；在开发中关闭/忽略 Lint。
- 设计复杂状态枚举；在应用层做统计/聚合遍历；分页方法不按规范命名。
- HTTP 装饰器不以 `/` 开头或为空；Controller 方法不按约定风格命名。

Nx 启动/构建（最小）

```bash
pnpm nx serve <project>
pnpm nx build <project>
```
