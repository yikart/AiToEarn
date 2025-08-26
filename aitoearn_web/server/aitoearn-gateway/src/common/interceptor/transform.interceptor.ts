/*
 * @Author: nevin
 * @Date: 2022-01-20 15:56:08
 * @LastEditors: nevin
 * @LastEditTime: 2025-02-25 00:28:07
 * @Description: 全局拦截器 慢日志打印
 */
import {
  CallHandler,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { HttpResult } from '../interfaces'

@Injectable()
export class OrgGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    request.is_org = true
    return true
  }
}

@Injectable()
export class TransformInterceptor<T>
implements NestInterceptor<T, HttpResult<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<HttpResult<T>> {
    const startTime = Date.parse(new Date().toString())

    const ctx = context.switchToHttp()
    // const response: Response<any> = ctx.getResponse();
    const request = ctx.getRequest()
    const reqUrl = request.originalUrl

    return next.handle().pipe(
      map((data: T): HttpResult<T> => {
        // --------- 慢日志打印警告 STR ---------
        const ruqTime = Date.parse(new Date().toString()) - startTime
        if (ruqTime >= 50) {
          Logger.verbose({
            level: 'verbose',
            message: `${reqUrl}::${ruqTime}ms`,
            mate: ruqTime,
          })
        }
        // --------- 慢日志打印警告 END ---------

        // 不进行封装的返回
        if (request.is_org)
          return data as any

        if ((data as unknown as number) !== 0 && !data && data !== false)
          return data as any

        // 封装
        return {
          data,
          code: 0,
          message: '请求成功',
          url: reqUrl,
        }
      }),
    )
  }
}
