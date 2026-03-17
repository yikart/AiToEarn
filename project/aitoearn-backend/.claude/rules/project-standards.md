# Project Development Standards

## General Principles

- Type safety with input/output separation: Use DTOs only for request validation and transformation; use VOs only for response encapsulation.
- Clear layer responsibilities: Controller handles routing/parameter binding/response transformation only; Service handles business orchestration and permission filtering; Repository handles data access only, without business logic or permission checks.
- Unified exceptions: Throw business errors only via AppException + ResponseCode; global filter ensures unified 200 response format.

## Naming & Files

- Classes/Interfaces/Enums use PascalCase; variables/functions use camelCase; constants use UPPER_SNAKE_CASE.
- File suffixes: `*.controller.ts` / `*.service.ts` / `*.module.ts` / `*.dto.ts` / `*.vo.ts` / `*.repository.ts`.
- File names must use kebab-case; camelCase is prohibited: `platform-rules.constants.ts`, not `platformRules.config.ts`.
- `*.config.ts` files are only for zod configuration; not allowed for constants, utils, or interfaces.
- Do not arbitrarily nest folders like `dto/`; create `*.dto.ts` files directly in the module root directory.

## Repository Method Naming

- Methods must start with these prefixes: `get` / `list` / `create` / `update` / `delete` / `count`
- Aggregation methods may start with aggregation keywords: `aggregate` / `sum` / `avg` etc.
- Batch operations use `createMany` / `updateMany` / `deleteMany` format
- Methods returning a single value must start with `get`, format: `getByXxx`
- Methods returning arrays must start with `list`, format: `listByXxx`
- Methods returning counts must start with `count`, format: `countByXxx`
- Pagination methods must end with `WithPagination`, e.g., `listWithPagination`
- Non-standard prefixes are prohibited: `find` / `del` / `add` / `set` / `check` etc.
- Business verbs as prefixes are prohibited: `recharge` / `deduct` / `withdraw` / `verify` / `mark` etc.

### Examples

- ✅ `getById` / `getByUserId` / `getByIdAndStatus`
- ✅ `listByUserId` / `listWithPagination` / `listByStatus`
- ✅ `create` / `createMany` / `createByUser`
- ✅ `updateById` / `updateByStatus` / `updateManyByIds`
- ✅ `deleteById` / `deleteByUserId` / `deleteManyByIds`
- ✅ `countByUserId` / `countByStatus` / `aggregateByDate`
- ❌ `findById` → `getById`
- ❌ `findList` → `listWithPagination`
- ❌ `delOne` → `deleteById`
- ❌ `addUseCount` → `updateUseCountById`
- ❌ `recharge` → `updateRechargeById`
- ❌ `markAsRead` → `updateAsReadByIds`

## DTO (Input)

- Write zod schema first, then use `createZodDto(schema, 'IdString')` to generate DTO; using entities as input is prohibited.
- Pagination input must use `PaginationDtoSchema` (page ≥1, pageSize ∈[1,1000], string numbers auto-convert).

```ts
import { createZodDto, PaginationDtoSchema } from '@yikart/common';
import { z } from 'zod';

export const CreateOrderDtoSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
  returnTo: z.url().optional(),
});
export class CreateOrderDto extends createZodDto(CreateOrderDtoSchema, 'CreateOrderDto') {}
```

## VO (Output)

- VOs expose only stable external fields; mapping is done in Service, Controller outputs using `VoClass.create(data)` (regular VO); returning database entities directly is prohibited.
- Pagination responses must use `createPaginationVo` (pagination VO instantiation uses `new`), with fields: page, pageSize, totalPages, total, list.

```ts
import { createPaginationVo, createZodDto } from '@yikart/common';
import { z } from 'zod';

export const OrderDetailVoSchema = z.object({ id: z.string(), amount: z.number(), createdAt: z.date() });
export class OrderDetailVo extends createZodDto(OrderDetailVoSchema, 'OrderDetailVo') {}
export class OrderListVo extends createPaginationVo(OrderDetailVoSchema, 'OrderListVo') {}
```

## API Documentation (Swagger)

- Every Controller must have `@ApiTags('Category/Module')` decorator for grouping
- Every Controller method must have `@ApiDoc` decorator for documentation
- DTO/VO schema fields must use `.describe('description')` for field documentation

### Controller Documentation

```ts
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@yikart/common'

@ApiTags('AI/Material-Adaptation')
@Controller('/material-adaptation')
export class MaterialAdaptationController {

  @ApiDoc({
    summary: '适配素材到多个平台',
    description: '使用 AI 将素材内容适配到指定的社交媒体平台',
    body: AdaptMaterialDtoSchema,
    response: [MaterialAdaptationVo],
  })
  @Post('/')
  async adaptMaterial(...): Promise<MaterialAdaptationVo[]> { ... }
}
```

### DTO/VO Field Documentation

```ts
export const CreateOrderDtoSchema = z.object({
  productId: z.string().describe('产品 ID'),
  quantity: z.number().int().positive().default(1).describe('购买数量'),
  returnTo: z.url().optional().describe('回调地址'),
});

export const OrderDetailVoSchema = z.object({
  id: z.string().describe('订单 ID'),
  amount: z.number().describe('订单金额'),
  createdAt: z.date().describe('创建时间'),
});
```

### ApiDoc Options

- `summary` (required): Brief description of the endpoint
- `description` (optional): Detailed description
- `body` (optional): Request body Zod schema (use `XxxDtoSchema`, not the class)
- `query` (optional): Query parameters Zod schema
- `response` (optional): Response VO class or `[VoClass]` for array response

## Exceptions & Error Codes

- Only allowed: `new AppException(code)` or `new AppException(code, data)`; messages are generated from code→message mapping, custom overrides are prohibited.

```ts
import { AppException, ResponseCode } from '@yikart/common';

throw new AppException(ResponseCode.PaymentPriceNotFound, { priceId: 'price_xxx' });
```

## ResponseCode Standards

- Success code is fixed at `Success = 0`; business error codes start from `10000` and are allocated by module range, cross-module reuse is prohibited.
- Naming uses PascalCase and must specify the concrete resource: e.g., `ContractNotFound`, `CommentNotFound`; generic permission names (`Unauthorized`/`AccessDenied` etc.) are prohibited.
- Define and export only in the common package; all services reference the same source to avoid scattered definitions.
- Must maintain code→default message mapping; use "Unknown error" for unmatched codes.
- Collaboration with AppException: pass only `code` or `code+data`, custom messages are not allowed (messages are generated from mapping).
- Addition workflow: Add constant to `ResponseCode` → Add default message to message mapping → Use in business code.

## Permissions & Data Access

- Permissions are filtered through query conditions; prefer specific resource NotFound over generic permission exceptions; permission logic belongs in Service layer.
- Repository only accesses its own data model; cross-model operations, permission checks, and extra existence queries are prohibited (existence checks are done by Service first).

## Logging & Lint

- Using console is prohibited; use dependency-injected Logger instance (e.g., `this.logger.log()`).
- Strictly follow ESLint (root `eslint.config.mjs`); must pass `pnpm lint -w` and type checking before commit.

## Mandatory Rules (Hard Requirements)

- Controller handles routing/parameter binding/response transformation only; Service handles business orchestration and permission filtering; Repository handles data access only.
- Controller output must use VOs uniformly (regular VO uses `VoClass.create(data)`; pagination VO uses `new`); Service returns entity data, Controller converts to VO, not the reverse.
- DTO/VO must be defined with zod schema and generated using `createZodDto` / `createPaginationVo`.
- Pagination: input uses `PaginationDtoSchema`; output fields are fixed as page, pageSize, totalPages, total, list.
- AppException is constructed only with code or code+data, messages come from mapping.
- Permissions are filtered through query conditions; unmatched results are represented as specific resource NotFound; permission logic is in Service layer.
- Prefer soft delete (`deletedAt`); state transitions are handled in Service layer; avoid complex state enums.
- Statistics/counts are implemented at database layer, application-layer iteration aggregation is prohibited.
- HTTP decorator paths must start with `/`, empty parameters are prohibited; methods with pagination must end with `WithPagination`.
- Every Controller must have `@ApiTags` decorator; every Controller method must have `@ApiDoc` decorator.
- All DTO/VO schema fields must have `.describe()` for API documentation.

## Prohibited Practices (Hard Requirements)

- Writing business logic in Controller or directly accessing database; returning database entities directly; skipping DTO/VO.
- Injecting Repository in Controller; data must be accessed through Service layer; Controller must not contain complex logic.
- Performing permission checks, cross-model operations, or extra existence queries in Repository; Repository methods containing unnecessary parameters.
- Using generic permission exception names (Unauthorized/PermissionDenied/AccessDenied) instead of specific resource NotFound.
- Overriding AppException default messages or creating custom business exception types; customizing HTTP status codes in business code.
- Using `throw new Error()` instead of `AppException + ResponseCode`; must use the project's unified error handling mechanism.
- Using Logger static methods or `console`; reading environment variables directly (must go through config module).
- Using `as any` or explicitly bypassing type checking; disabling/ignoring Lint during development.
- Using `z.nativeEnum`; must use `z.enum` and explicitly list enum values.
- Arbitrarily wrapping business logic with try-catch; exceptions should be handled uniformly by the framework.
- Delete operations returning meaningless objects like `{ success: true }`; should return `void`.
- Using wrong HTTP methods: delete uses `@Delete()` not `@Put()`; update uses `@Patch()` not `@Put()`.
- Designing complex state enums; doing statistics/aggregation iteration at application layer; pagination methods not following naming conventions.
- HTTP decorators not starting with `/` or being empty; Controller methods not following naming conventions.
- Writing redundant comments; code should be self-explanatory, avoid unnecessary comments explaining obvious logic.
- Creating Controller methods without `@ApiDoc` decorator; creating DTO/VO schema fields without `.describe()`.
- Writing data migration logic as NestJS Service/Controller; migrations must be pure MongoDB shell scripts placed in `migrations/` directory, executed via `mongosh`.
- Using `@InjectModel` or `@InjectConnection` in Service files; data access must go through Repository layer.

## Build Verification

- Must use `pnpm nx build <project>` to verify builds
- Using `tsc` directly for compilation is prohibited
- After renaming methods, must run `pnpm nx build` to ensure all references are updated

## Git Workflow

- Feature branches must be rebased onto target branch before merging: `git rebase <target-branch>`
- Use squash merge to combine all commits into one: `git merge --squash <feature-branch>`
- Merge commits are prohibited; keep commit history linear and clean
- Branch naming convention: `<type>/<description>`, e.g., `feat/user-auth`, `fix/login-bug`, `refactor/rename-files`
- Commit message format: `<type>: <description>`, types include: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`
- Before merging, ensure all builds pass: `pnpm nx run-many --target=build --all`
