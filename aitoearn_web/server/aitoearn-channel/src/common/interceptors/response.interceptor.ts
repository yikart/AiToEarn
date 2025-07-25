import type { Response } from 'express'
import {
  CallHandler,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common'
import { map } from 'rxjs'
import { ExceptionCode } from '../enums/exception-code.enum'
import { CommonResponse } from '../interfaces'

@Injectable()
export class OrgGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    request.is_org = true
    return true
  }
}

export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name)
  intercept(context: ExecutionContext, next: CallHandler) {
    const type = context.getType()
    if (type === 'http') {
      const res = context.switchToHttp().getResponse<Response>()
      const req = context.switchToHttp().getRequest()

      res.status(200)

      return next.handle().pipe(
        map((data) => {
          if (data instanceof StreamableFile) {
            return data
          }

          if (req.is_org)
            return data

          return {
            data,
            code: ExceptionCode.Success,
            message: '请求成功',
          }
        }),
      )
    }
    else if (type === 'rpc') {
      const startAt = Date.now()

      const ctx = context.switchToRpc()
      const req = ctx.getContext<{ args: string[] }>()
      const url = req.args[0] || ''
      const rpcData = ctx.getData()
      this.logger.debug(rpcData, `-- ${startAt}-- [${url}]  rpcData ----: `)

      return next.handle().pipe(
        map((data: unknown): CommonResponse<unknown> => {
          const reqTime = Date.now() - startAt
          if (reqTime >= 50) {
            this.logger.verbose(`${url}::${reqTime}ms`)
          }

          return {
            data,
            code: ExceptionCode.Success,
            message: '请求成功',
          }
        }),
      )
    }
    else {
      return next.handle()
    }
  }
}
