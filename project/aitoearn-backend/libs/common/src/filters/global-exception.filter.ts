import type { Response } from 'express'
import type { Observable } from 'rxjs'

import type { CommonResponse } from '../interfaces'
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { of } from 'rxjs'
import { AppException } from '../exceptions'
import { getExceptionPayload } from '../utils'

export interface GlobalExceptionFilterOptions {
  returnBadRequestDetails?: boolean
}

@Catch()
export class GlobalExceptionFilter<T> implements ExceptionFilter<T> {
  protected readonly logger = new Logger(GlobalExceptionFilter.name)
  constructor(private options: GlobalExceptionFilterOptions = {}) { }

  catch(exception: T, host: ArgumentsHost): void | Observable<CommonResponse<unknown> | void> {
    if (
      exception instanceof InternalServerErrorException
    ) {
      this.logger.fatal(exception)
    }
    else if (exception instanceof UnauthorizedException || exception instanceof AppException) {
      this.logger.warn(exception)
    }
    else if (exception instanceof HttpException) {
      this.logger.error(exception)
    }
    else {
      this.logger.fatal(exception)
    }

    const payload = getExceptionPayload(exception, this.options.returnBadRequestDetails)

    return this.handleError(host, {
      ...payload,
      timestamp: Date.now(),
    })
  }

  handleError(host: ArgumentsHost, payload: CommonResponse<unknown>) {
    const type = host.getType()

    if (type === 'rpc') {
      return this.handleRpcError(host, payload)
    }
    return this.handleHttpError(host, payload)
  }

  private handleRpcError(
    host: ArgumentsHost,
    payload: CommonResponse<unknown>,
  ) {
    return of(payload)
  }

  private handleHttpError(
    host: ArgumentsHost,
    payload: CommonResponse<unknown>,
  ) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    response.status(200).json(payload)
  }
}
