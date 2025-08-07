import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'

import { Response } from 'express'
import { Observable, of } from 'rxjs'
import { CommonResponse } from '../interfaces'
import { getExceptionPayload } from '../utils/exception.util'

export interface GlobalExceptionFilterOptions {
  returnBadRequestDetails?: boolean
}

@Catch()
export class GlobalExceptionFilter<T> implements ExceptionFilter<T> {
  protected readonly logger = new Logger(GlobalExceptionFilter.name)
  constructor(private options: GlobalExceptionFilterOptions = {}) { }

  catch(exception: T, host: ArgumentsHost): void | Observable<CommonResponse<unknown>> {
    if (
      !(exception instanceof HttpException)
      || exception instanceof InternalServerErrorException
    ) {
      this.logger.fatal(exception)
    }
    else {
      this.logger.error(exception)
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
