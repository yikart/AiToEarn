import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { Observable } from 'rxjs'
import type { Locale } from '../i18n/messages'
import { AsyncLocalStorage } from 'node:async_hooks'
import { Injectable } from '@nestjs/common'
import acceptLanguageParser from 'accept-language-parser'

interface RequestContextStore {
  locale: Locale
}

export const requestContext = new AsyncLocalStorage<RequestContextStore>()

const SUPPORTED_LANGUAGES: Locale[] = ['en-US', 'zh-CN']

export function getLocale(): Locale {
  return requestContext.getStore()?.locale || 'en-US'
}

export function getRequestContext(): RequestContextStore | undefined {
  return requestContext.getStore()
}

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const locale = this.parseLocale(context)
    return requestContext.run({ locale }, () => next.handle())
  }

  private parseLocale(context: ExecutionContext): Locale {
    const type = context.getType()

    if (type === 'http')
      return this.parseHttpLocale(context)

    if (type === 'ws')
      return this.parseWsLocale(context)

    return 'en-US'
  }

  private parseHttpLocale(context: ExecutionContext): Locale {
    const request = context.switchToHttp().getRequest()
    const acceptLanguage = request.headers['accept-language']
    return this.matchLocale(acceptLanguage)
  }

  private parseWsLocale(context: ExecutionContext): Locale {
    const socket = context.switchToWs().getClient()
    const acceptLanguage = socket.handshake?.headers?.['accept-language']
    return this.matchLocale(acceptLanguage)
  }

  private matchLocale(acceptLanguage: string | undefined): Locale {
    if (!acceptLanguage)
      return 'en-US'

    const matched = acceptLanguageParser.pick(SUPPORTED_LANGUAGES, acceptLanguage, { loose: true })
    return (matched as Locale) || 'en-US'
  }
}
