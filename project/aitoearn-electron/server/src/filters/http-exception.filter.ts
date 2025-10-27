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
  UnauthorizedException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { HttpResult } from '../global/interface/response.interface';

import { ErrHttpBackMap } from './http-exception.back-code';

const BASE_ERROR_CODE = '1';
const ARG_ERROR_CODE = '-1'; // 参数错误码

interface ExceptionResponseObj {
  message?: '';
  statusCode?: '';
  error?: '';
}

// 全部错误
@Catch(Error)
export class AppExceptionFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    console.log('---- Error ---', error);

    Logger.error({
      url: request.originalUrl,
      level: 'error',
      message: request.originalUrl,
      mate: error.stack,
      stack: error.stack,
    });

    const errorResponse: HttpResult<string> = {
      data: '',
      msg: '',
      code: BASE_ERROR_CODE, // 自定义code
      url: request.originalUrl, // 错误的url地址
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR);
    response.header('Content-Type', 'application/json; charset=utf-8');
    response.send(errorResponse);
  }
}

@Catch(BadRequestException)
export class BadExceptionFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    Logger.error({
      url: request.originalUrl,
      level: 'error',
      message: request.originalUrl,
      mate: error.stack,
      stack: error.stack,
    });

    const errorResponse: HttpResult<string> = {
      data: '',
      msg: error.message,
      code: ARG_ERROR_CODE, // 自定义code
      url: request.originalUrl, // 错误的url地址
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR);
    response.header('Content-Type', 'application/json; charset=utf-8');
    response.send(errorResponse);
  }
}

// 认证错误
@Catch(UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    Logger.error({
      url: request.originalUrl,
      level: 'error',
      message: request.originalUrl,
      mate: error.stack,
      stack: error.stack,
    });

    const errorResponse: HttpResult<string> = {
      data: '',
      msg: '',
      code: BASE_ERROR_CODE, // 自定义code
      url: request.originalUrl, // 错误的url地址
    };

    response.status(HttpStatus.UNAUTHORIZED);
    response.header('Content-Type', 'application/json; charset=utf-8');
    response.send(errorResponse);
  }
}

// 业务报错
export class AppHttpException extends HttpException {
  constructor(errKey: string) {
    super(errKey, HttpStatus.OK);
  }
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // 定义错误的返回对象
    const errorResponse: HttpResult<string | object> = {
      data: exception.getResponse(),
      msg: '',
      code: BASE_ERROR_CODE, // 自定义code
      url: request.originalUrl, // 错误的url地址
    };

    const defErrHttpBack = ErrHttpBackMap.get('fail');
    const errObj = exception.getResponse(); // 获取的错误返回对象

    if (typeof errObj === 'object') {
      errorResponse.msg =
        (<ExceptionResponseObj>errObj).message || defErrHttpBack.message;
      errorResponse.code =
        (<ExceptionResponseObj>errObj).error || defErrHttpBack.errCode;
      errorResponse.data = errObj;
    }

    if (typeof errObj === 'string') {
      const errBackObj =
        ErrHttpBackMap.get(exception.message) || defErrHttpBack;

      errorResponse.code = errBackObj.errCode;
      errorResponse.msg = errBackObj.message || errObj;
      errorResponse.data = '';
    }

    Logger.log(errorResponse.code + ':' + errorResponse.msg);

    // 设置返回的状态码、请求头、发送错误信息
    response.status(
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR,
    );
    response.header('Content-Type', 'application/json; charset=utf-8');
    response.send(errorResponse);
  }
}
