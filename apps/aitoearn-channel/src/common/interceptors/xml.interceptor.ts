import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import * as xml2js from 'xml2js'

@Injectable()
export class XmlParseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()

    return new Observable((subscriber) => {
      xml2js.parseString(
        request.body,
        { explicitArray: false },
        (err, result) => {
          if (err)
            return subscriber.error(err)
          request.body = result.xml || {}
          subscriber.next(request)
          subscriber.complete()
        },
      )
    }).pipe(
      switchMap(() => next.handle()), // 正确串联后续处理
    )
  }
}
