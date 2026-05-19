# Coding Style

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate:

```javascript
// WRONG: Mutation
function updateUser(user, name) {
  user.name = name  // MUTATION!
  return user
}

// CORRECT: Immutability
function updateUser(user, name) {
  return {
    ...user,
    name
  }
}
```

## File Organization

MANY SMALL FILES > FEW LARGE FILES:
- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Extract utilities from large components
- Organize by feature/domain, not by type

## Error Handling

Business errors use `AppException + ResponseCode`, while protocol-layer errors may use standard `HttpException`. Do NOT wrap business logic with try-catch.

```typescript
// WRONG: try-catch + console + throw new Error
try {
  const order = await this.orderService.getById(id)
} catch (error) {
  console.error('Failed:', error)       // ❌ console prohibited
  throw new Error('Order not found')    // ❌ use AppException
}

// CORRECT: Let the framework handle exceptions
const order = await this.orderRepository.getById(id)
if (!order) {
  throw new AppException(ResponseCode.OrderNotFound)
}
```

Only use try-catch for infrastructure-level operations (external API calls, file I/O), and log with `this.logger.error()` instead of `console`.

## Input Validation

ALWAYS validate user input:

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

## Logger Error Format

Error must be the first argument, message the second as a plain string:

```typescript
// CORRECT
this.logger.error(error, `Failed to process order ${orderId}`)
this.logger.warn(error, `Inventory check failed for product ${productId}`)

// WRONG — error nested in object
this.logger.error({ path: 'xxx', message: 'yyy', error: err })

// WRONG — error interpolated into string template
this.logger.error(`Failed to process: ${error}`)

// WRONG — message as object
this.logger.error(error, { context: 'xxx' })
```

Promise catch follows the same rule:
```typescript
// CORRECT
promise.catch((err: Error) => this.logger.error(err, 'Failed to send notification'))

// WRONG
promise.catch((err: unknown) => this.logger.error({ message: 'xxx', error: err }))
```

## Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No console usage (use Logger instance)
- [ ] No hardcoded values
- [ ] No mutation (immutable patterns used)
