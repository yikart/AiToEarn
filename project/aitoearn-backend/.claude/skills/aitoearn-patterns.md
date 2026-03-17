---
name: aitoearn-patterns
description: Coding patterns extracted from aitoearn-monorepo
version: 1.0.0
source: local-git-analysis
analyzed_commits: 200
---

# Aitoearn Monorepo Patterns

## Commit Conventions

This project uses **Conventional Commits** (86% compliance):

| Prefix | Usage |
|--------|-------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `refactor:` | Code refactoring |
| `chore:` | Maintenance tasks |
| `docs:` | Documentation updates |
| `test:` | Test additions/changes |

### Scope Convention
Use parentheses for module scope: `feat(content):`, `fix(tiktok):`, `refactor(mongodb):`

### Examples from Repository
```
feat: 品牌资料库文档标签
feat(login): 更新登录控制器中的注释和文档为中文
refactor(mongodb): 移除materialGroup.repository中多余的type参数
fix: 草稿箱创建缺失平台字段
chore: add vitest setup and MCP unit tests
```

## Code Architecture

### Monorepo Structure (Nx)
```
aitoearn-monorepo/
├── apps/                          # Application services
│   ├── aitoearn-admin-server/     # Admin backend
│   ├── aitoearn-ai/               # AI service (MCP, agents)
│   ├── aitoearn-channel/          # Channel integrations
│   ├── aitoearn-payment/          # Payment processing
│   ├── aitoearn-server/           # Main API server
│   ├── aitoearn-task/             # Task management
│   └── browser-automation-worker/ # Browser automation
├── libs/                          # Shared libraries
│   ├── common/                    # Common utilities, DTOs, enums
│   ├── mongodb/                   # MongoDB schemas & repositories
│   ├── task-db/                   # Task database layer
│   ├── channel-db/                # Channel database layer
│   ├── statistics-db/             # Statistics database
│   ├── payment-db/                # Payment database
│   ├── helpers/                   # Business helpers
│   └── aitoearn-*-client/         # Inter-service clients
└── CLAUDE.md                      # Development standards
```

### NestJS Layered Architecture

```
Controller (路由/参数绑定/响应转换)
    ↓
Service (业务编排/权限过滤)
    ↓
Repository (数据访问)
```

**Rules:**
- Controller: Only routing, parameter binding, VO transformation
- Service: Business logic, permission filtering, entity mapping
- Repository: Data access only, no business logic or permissions

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Controller | `*.controller.ts` | `material.controller.ts` |
| Service | `*.service.ts` | `material.service.ts` |
| Module | `*.module.ts` | `content.module.ts` |
| DTO | `*.dto.ts` | `material.dto.ts` |
| VO | `*.vo.ts` | `material.vo.ts` |
| Repository | `*.repository.ts` | `material.repository.ts` |
| Schema | `*.schema.ts` | `material.schema.ts` |
| Test | `*.spec.ts` | `media.mcp.spec.ts` |

## DTO/VO Patterns

### DTO (Input) - Zod Schema First
```typescript
import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { z } from 'zod'

export const CreateOrderDtoSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
  returnTo: z.url().optional(),
})
export class CreateOrderDto extends createZodDto(CreateOrderDtoSchema, 'CreateOrderDto') {}
```

### VO (Output) - Stable External Fields
```typescript
import { createPaginationVo, createZodDto } from '@yikart/common'
import { z } from 'zod'

export const OrderDetailVoSchema = z.object({
  id: z.string(),
  amount: z.number(),
  createdAt: z.date()
})
export class OrderDetailVo extends createZodDto(OrderDetailVoSchema, 'OrderDetailVo') {}
export class OrderListVo extends createPaginationVo(OrderDetailVoSchema, 'OrderListVo') {}
```

### Controller Usage
```typescript
// Regular VO
return OrderDetailVo.create(data)

// Pagination VO
return new OrderListVo({ page, pageSize, total, totalPages, list })
```

## Repository Method Naming

### Required Prefixes
| Prefix | Returns | Example |
|--------|---------|---------|
| `get` | Single value | `getById`, `getByUserId` |
| `list` | Array | `listByUserId`, `listByStatus` |
| `create` | Created entity | `create`, `createMany` |
| `update` | Updated entity | `updateById`, `updateManyByIds` |
| `delete` | Deleted entity | `deleteById`, `deleteManyByIds` |
| `count` | Number | `countByUserId`, `countByStatus` |
| `aggregate` | Aggregation | `aggregateByDate` |

### Pagination Methods
Must end with `WithPagination`: `listWithPagination`

### Forbidden Prefixes
❌ `find` → ✅ `get` / `list`
❌ `del` → ✅ `delete`
❌ `add` → ✅ `create`
❌ `set` → ✅ `update`
❌ `check` → ✅ `get` + business logic in Service

## Exception Handling

### AppException Pattern
```typescript
import { AppException, ResponseCode } from '@yikart/common'

// Only use code or code + data
throw new AppException(ResponseCode.PaymentPriceNotFound)
throw new AppException(ResponseCode.PaymentPriceNotFound, { priceId: 'price_xxx' })
```

### ResponseCode Rules
- Success: `Success = 0`
- Business errors: Start from `10000`, allocated by module
- Naming: PascalCase, specific resource (e.g., `ContractNotFound`)
- Forbidden: Generic names like `Unauthorized`, `AccessDenied`

## Testing Patterns

### Framework
- **Vitest** for unit tests
- Test files: `*.spec.ts`

### Test Location
```
apps/aitoearn-ai/src/core/agent/mcp/
├── media.mcp.ts
├── media.mcp.spec.ts
├── mcp.utils.ts
└── mcp.utils.spec.ts
```

## Build & Development

### Nx Commands
```bash
# Serve application
pnpm nx serve <project>

# Build application
pnpm nx build <project>

# Run linting
pnpm lint -w
```

### Build Verification
- Always use `pnpm nx build <project>` to verify
- Never use `tsc` directly
- After renaming methods, run build to ensure all references updated

## Frequently Changed Files

Based on git history, these files change most often:
1. `libs/common/src/i18n/messages.ts` - i18n messages
2. `libs/common/src/enums/response-code.enum.ts` - Response codes
3. `libs/aitoearn-channel-client/src/interfaces/publishing.interface.ts`
4. `libs/task-db/src/schemas/user-task.schema.ts`
5. `libs/mongodb/src/schemas/publishRecord.schema.ts`

## Co-Change Patterns

Files that typically change together:
- `response-code.enum.ts` ↔ `messages.ts` (new error codes)
- `*.schema.ts` ↔ `*.repository.ts` (schema changes)
- `*.dto.ts` ↔ `*.controller.ts` ↔ `*.service.ts` (API changes)
