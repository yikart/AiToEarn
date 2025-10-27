import type { ZodError } from 'zod'
import {
  BadRequestException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common'
import { z } from 'zod'

export class ZodValidationException extends BadRequestException {
  constructor(private error: ZodError) {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      errors: z.treeifyError(error),
    })
  }

  public getZodError() {
    return this.error
  }
}

export class ZodSerializationException extends InternalServerErrorException {
  // eslint-disable-next-line node/handle-callback-err
  constructor(private error: ZodError) {
    super()
  }

  public getZodError() {
    return this.error
  }
}

export type ZodExceptionCreator = (error: ZodError) => Error

export const createZodValidationException: ZodExceptionCreator = (error) => {
  return new ZodValidationException(error)
}

export const createZodSerializationException: ZodExceptionCreator = (error) => {
  return new ZodSerializationException(error)
}
