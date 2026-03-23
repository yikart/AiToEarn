# Testing Requirements

## Minimum Test Coverage: 80%

Test Types (ALL required):
1. **Unit Tests** - Individual functions, utilities, services
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Critical user flows

## Running Tests

```bash
# Run tests for a specific project
pnpm nx run <project>:test

# Run E2E tests
pnpm nx run e2e:e2e

# Run affected tests
pnpm nx affected -t test
```

## Test File Conventions

- Test files: `*.spec.ts`, colocated with source files
- Test runner: Vitest (via `@nx/vite:test`)
- E2E infrastructure: Docker Compose (`e2e/docker-compose.e2e.yml`)

## NestJS Testing Patterns

**Unit testing services:**
```typescript
const module = await Test.createTestingModule({
  providers: [
    OrderService,
    { provide: OrderRepository, useValue: mockOrderRepository },
  ],
}).compile()
```

**Unit testing controllers:** Mock services, verify routing and VO transformation.

**Repository tests:** Test in integration/E2E only (repositories are thin wrappers over Mongoose).

## Test-Driven Development

MANDATORY workflow:
1. Write test first (RED)
2. Run test - it should FAIL
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)

## Troubleshooting Test Failures

1. Use **tdd-guide** agent
2. Check test isolation
3. Verify mocks are correct
4. Fix implementation, not tests (unless tests are wrong)
