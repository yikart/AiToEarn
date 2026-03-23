# Security Guidelines

## Mandatory Security Checks

Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated (Zod DTOs at controller boundary)
- [ ] MongoDB injection prevention (validate query parameters, avoid `$where`, sanitize `$regex` inputs)
- [ ] XSS prevention (sanitized HTML)
- [ ] Authentication/authorization verified
- [ ] Rate limiting on public endpoints
- [ ] Error messages don't leak sensitive data

## Secret Management

```typescript
// NEVER: Hardcoded secrets or direct process.env
const apiKey = "sk-proj-xxxxx"              // ❌
const apiKey = process.env.OPENAI_API_KEY   // ❌ must go through config module

// ALWAYS: Use zod config schema + selectConfig
// Define in config.ts with zod schema, access via injected config object
const apiKey = this.config.openai.apiKey
```

## MongoDB-Specific Security

- Validate ObjectId format on all ID parameters before querying
- Use `lean()` queries to avoid returning Mongoose document methods
- Never expose raw `_id` in API responses — transform via VO
- Sanitize string inputs used in `$regex` queries

## NestJS Security

- Use Guards for authentication, not middleware
- Use `@GetToken()` decorator from `@yikart/aitoearn-auth` for extracting auth info
- Filter permissions via query conditions in Service layer (not Controller)

## Security Response Protocol

If security issue found:
1. STOP immediately
2. Use **security-reviewer** agent
3. Fix CRITICAL issues before continuing
4. Rotate any exposed secrets
5. Review entire codebase for similar issues
