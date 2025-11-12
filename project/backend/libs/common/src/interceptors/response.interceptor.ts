import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common'
import type { Response } from 'express'
import type { CommonResponse } from '../interfaces'
import {
  Logger,
  StreamableFile,
} from '@nestjs/common'
import { RENDER_METADATA } from '@nestjs/common/constants'
import { map } from 'rxjs'
import { ResponseCode } from '../enums'

export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name)
  intercept(context: ExecutionContext, next: CallHandler) {
    const type = context.getType()

    const isRender = Reflect.hasMetadata(RENDER_METADATA, context.getHandler())

    if (type === 'http') {
      const res = context.switchToHttp().getResponse<Response>()

      res.status(200)

      return next.handle().pipe(
        map((data) => {
          if (data instanceof StreamableFile || isRender) {
            return data
          }

          return {
            data,
            code: ResponseCode.Success,
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
            code: ResponseCode.Success,
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
