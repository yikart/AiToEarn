import type { z } from 'zod'
import { ZodRealError } from 'zod'

export class ZodErrorWithInput extends ZodRealError {
  constructor(issues: z.core.$ZodIssue[], public readonly input: unknown) {
    super(issues)
    this.name = 'ZodErrorWithInput'
  }
}
