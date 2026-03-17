import { HttpException, HttpStatus } from '@nestjs/common'
import { getLocale } from '../interceptors/request-context.interceptor'
import { getCodeMessage } from '../utils'

export class AppException extends HttpException {
  readonly code: number
  constructor(code: number)
  constructor(code: number, message: string)
  constructor(code: number, data: unknown)
  constructor(code: number, message: string, data: unknown)
  constructor(code: number, message?: string | object, data?: unknown) {
    if (typeof message === 'object') {
      if (data) {
        throw new Error('invalid AppException')
      }

      data = message
      message = undefined
    }

    if (message === undefined) {
      const locale = getLocale()
      message = getCodeMessage(code, data, locale)
    }

    const payload = {
      code,
      message,
      data,
    }

    super(
      HttpException.createBody(payload),
      HttpStatus.BAD_REQUEST,
    )
    this.code = code
  }
}
