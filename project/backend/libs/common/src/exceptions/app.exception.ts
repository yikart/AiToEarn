import { HttpException, HttpStatus } from '@nestjs/common'
import { getLocale } from '../interceptors/request-context.interceptor'
import { getCodeMessage } from '../utils'

export class AppException extends HttpException {
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
      // 从请求上下文获取 locale，若不在请求上下文中（如定时任务），fallback 到 en-US
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
  }
}
