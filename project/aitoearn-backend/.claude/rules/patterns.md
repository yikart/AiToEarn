# Common Patterns

## Unified Response Format

All API responses are wrapped by `ResponseInterceptor` into:

```typescript
{
  data: T       // Business data
  code: number  // 0 = success, 10000+ = business error
  message: string
}
```

Do not define custom response wrappers. Use `AppException + ResponseCode` to trigger error responses.

## Repository Pattern

Based on `BaseRepository` (`libs/mongodb/src/repositories/base.repository.ts`):

```typescript
// Public methods (exposed to Service)
getById(id: string): Promise<LeanDoc<T> | null>
create(data: Partial<T>): Promise<LeanDoc<T>>
createMany(data: Partial<T>[]): Promise<LeanDoc<T>[]>
updateById(id: string, update: UpdateQuery<T>): Promise<LeanDoc<T> | null>
deleteById(id: string): Promise<LeanDoc<T> | null>

// Protected methods (used within Repository subclasses)
findOne(filter: FilterQuery<T>): Promise<LeanDoc<T> | null>
find(filter: FilterQuery<T>): Promise<LeanDoc<T>[]>
findWithPagination(params: PaginationParams<T>): Promise<[LeanDoc<T>[], number]>
count(filter: FilterQuery<T>): Promise<number>
exists(filter: FilterQuery<T>): Promise<boolean>
```

Subclass repositories expose domain-specific public methods following naming conventions:
- `getByXxx` / `listByXxx` / `countByXxx` / `listWithPagination`
- See `project-standards.md` for full naming rules.

## Skeleton Projects

When implementing new functionality:
1. Search for battle-tested skeleton projects
2. Use parallel agents to evaluate options:
   - Security assessment
   - Extensibility analysis
   - Relevance scoring
   - Implementation planning
3. Clone best match as foundation
4. Iterate within proven structure
