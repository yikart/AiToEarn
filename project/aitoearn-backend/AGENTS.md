# Repository Guidelines

## Project Structure & Module Organization
This repository is an Nx + pnpm monorepo. Runtime services live in `apps/`, shared domain packages in `libs/`, and internal generators in `tools/`. End-to-end coverage is under `e2e/`, docs under `docs/`, build output under `dist/`, and MongoDB shell migrations under `migrations/`.

## Build, Test, and Development Commands
Use workspace commands from the repo root:

- `pnpm install`: install dependencies.
- `pnpm lint`: lint the workspace with Nx.
- `pnpm server:serve`, `pnpm ai:serve`, `pnpm payment:serve`, `pnpm task:serve`, `pnpm admin:serve`: run a service with local config.
- `pnpm nx build <project>`: build one target, for example `pnpm nx build aitoearn-server`.
- `pnpm nx test <project>`: run unit tests for projects that expose a `test` target.
- `pnpm nx affected -t test`: run tests only for affected projects.
- `pnpm nx run e2e:e2e`: run end-to-end tests.
- `docker compose -f e2e/docker-compose.e2e.yml up -d --wait`: start local e2e dependencies.
- `docker compose -f e2e/docker-compose.e2e.yml down -v`: stop and clean e2e dependencies.

If Nx hangs in a restricted shell or sandbox, run it with daemon and plugin isolation disabled, for example:
`env CI=1 NX_DAEMON=false NX_TUI=false NX_NO_CLOUD=true NX_ISOLATE_PLUGINS=false NX_WORKSPACE_DATA_DIRECTORY=/tmp/nx-wsdata ./node_modules/.bin/nx test aitoearn-ai`.
Do not add `NX_CACHE_PROJECT_GRAPH=false`; it breaks some builds in this workspace.

## Architecture, Style & Naming
Follow the Nest layering enforced by the existing Claude rules: Controller for routing and VO transformation only, Service for business orchestration and permission filtering, Repository for data access only. Do not inject repositories into controllers or `@nestjs/mongoose` models/connections into services.

Use TypeScript with the existing formatter output: 2-space indentation, single quotes, no semicolons, `PascalCase` for types/classes, `camelCase` for values, and `kebab-case` for filenames. Standard suffixes are required: `*.controller.ts`, `*.service.ts`, `*.module.ts`, `*.dto.ts`, `*.vo.ts`, `*.repository.ts`. Do not use `*.types.ts` filenames in this project.

Repository methods must use strict prefixes such as `getByXxx`, `listByXxx`, `create`, `updateByXxx`, `deleteByXxx`, `countByXxx`; pagination methods end with `WithPagination`. Avoid `find*`, `add*`, `del*`, or business-verb prefixes. Repository method names must describe data access and filters, not business intent or workflow semantics. If a method has too many filter parameters to name individually, use only relatively neutral wording or the primary filter strategy, for example `listByFilters` or `listByCursor`, instead of business-specific names.

Use real TypeScript `enum` declarations for enum-like values. Do not create pseudo-enums from `const` objects, `as const`, or `typeof`/indexed-access unions.

Avoid over-encapsulation. Do not add trivial one-line wrappers or private helpers that only rename a single property check, cast, or direct pass-through; inline them unless they remove meaningful duplication or hide real complexity.

Do not define constants for values that are used only once. Inline one-off values unless naming removes real complexity or the value is shared by multiple call sites.

Do not name methods after implementation mechanics such as `InTransaction`, `WithLock`, or similar wrappers. Put transaction/lock behavior on the real domain method when it is needed.

Do not add compatibility aliases, placeholder `undefined` fields, one-off catch blocks, or duplicate-key helper methods unless the user explicitly asks for that behavior. If a contract is wrong, update the affected producer, consumer, schema, and tests together.

Do not use conditional object spreads just to omit `undefined` fields, and do not add defensive `typeof` / `Number.isFinite` checks around values that are already typed as `number` or `number | undefined`. Normalize nullable platform values at the boundary where they are mapped into the local contract.

DTOs and VOs must be defined from Zod schemas via `createZodDto` / `createPaginationVo`. Every controller needs `@ApiTags`, every endpoint needs `@ApiDoc`, and every DTO/VO field needs `.describe()`. Use `AppException + ResponseCode` for business errors. Do not use `console`, static `Logger.*`, or direct `process.env` reads outside config modules.

Prefer built-in Zod schema APIs and options over `.refine()`. Do not use `.refine()` unless the constraint cannot be expressed directly with Zod's native APIs or must validate cross-field or semantic rules.

## Working Tree Safety
Treat any tracked or untracked changes that were not made for the currently approved task as user-owned work. Do not restore, checkout, reset, delete, reverse-patch, format, or otherwise rewrite those files without explicit user approval, even if the changes look unrelated, out of scope, or accidental. If a clean diff is needed, first ask the user and list the exact files and operation; otherwise leave user-owned changes intact and work around them.

## Testing Guidelines
Vitest is the standard test runner. Keep unit tests as colocated `*.spec.ts` or `*.test.ts`; keep e2e tests as `e2e/specs/**/*.e2e-spec.ts`. The Claude rules target 80% minimum coverage and expect unit, integration, and critical-flow e2e coverage for changed behavior.

## Commit & Pull Request Guidelines
Use Conventional Commits such as `feat(ai): ...` or `fix: ...`, and prefer branch names like `feat/user-auth` or `fix/login-bug`. Keep history linear: rebase before merge and prefer squash merge. PRs should follow `.github/pull_request_template.md`: link the issue, summarize changes, provide a test plan, note API doc or DTO/VO updates, include migration notes when relevant, and address review comments before merging.
