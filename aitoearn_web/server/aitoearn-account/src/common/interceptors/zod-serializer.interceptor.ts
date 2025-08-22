import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common'
import * as _ from 'lodash'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { isZodDto } from '../utils'

/**
 * @publicApi
 */
@Injectable()
export class ZodSerializerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next
      .handle()
      .pipe(
        map((res: unknown | Array<unknown>) => {
          if (!_.isObject(res) || res instanceof StreamableFile) {
            return res
          }

          return Array.isArray(res)
            ? res.map(item => this.transformToPlain(item))
            : this.transformToPlain(res)
        }),
      )
  }

  transformToPlain(
    plainOrClass: unknown,
  ): unknown {
    if (isZodDto(plainOrClass)) {
      return plainOrClass.schema.parse(plainOrClass)
    }

    return plainOrClass
  }
}
