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
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { ErrHttpBackMap, ErrorHttpBack } from './httpException.code'

export interface HttpResult<T> {
  data?: T // 数据
  message: string // 信息
  code: number // 自定义code
  url: string // 错误的url地址
}

// 业务报错
export class AppHttpException extends HttpException {
  constructor(errCode: number, messgae?: string) {
    super(
      {
        errCode,
        message: messgae,
      },
      HttpStatus.OK,
    )
  }
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    const errData = exception.getResponse() as ErrorHttpBack // 获取的错误返回对象

    // 定义错误的返回对象
    const errorResponse: HttpResult<string | object> = {
      message: '请求出错',
      code: 1, // 自定义code
      url: request.originalUrl, // 错误的url地址
    }

    const codeInfo = ErrHttpBackMap.get(errData.errCode)

    if (!codeInfo) {
      if (errData.message)
        errorResponse.message = errData.message
    }
    else {
      errorResponse.message = errData.message || codeInfo.message || '未知错误'
      errorResponse.code = codeInfo.errCode
    }

    Logger.error(`${errorResponse.code}:${errorResponse.message}`)

    // 设置返回的状态码、请求头、发送错误信息
    response.status(
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR,
    )
    response.header('Content-Type', 'application/json; charset=utf-8')
    response.send(errorResponse)
  }
}
