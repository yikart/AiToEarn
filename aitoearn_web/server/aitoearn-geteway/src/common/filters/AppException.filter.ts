/*
 * @Author: nevin
 * @Date: 2022-01-20 16:05:23
 * @LastEditors: nevin
 * @LastEditTime: 2025-04-27 14:35:40
 * @Description: 全局错误处理
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { HttpResult } from './httpException.filter'

// 全部错误
@Catch(Error)
export class AppExceptionFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    Logger.error({
      url: request.originalUrl,
      level: 'error',
      message: `系统出错：${response.originalUrl}`,
      mate: error.stack,
      stack: error.stack,
    })

    const errorResponse: HttpResult<string> = {
      message: '系统出错：',
      code: 1, // 自定义code
      url: request.originalUrl, // 错误的url地址
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR)
    response.header('Content-Type', 'application/json; charset=utf-8')
    response.send(errorResponse)
  }
}
