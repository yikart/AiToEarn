import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { Observable } from 'rxjs'
import type { Locale } from '../i18n/messages'
import { AsyncLocalStorage } from 'node:async_hooks'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import acceptLanguageParser from 'accept-language-parser'

export interface TokenInfo {
  readonly id: string
  readonly mail?: string
  readonly name?: string
  readonly exp?: number
}

interface RequestContextStore {
  locale: Locale
  user?: TokenInfo
}

export const requestContext = new AsyncLocalStorage<RequestContextStore>()

const SUPPORTED_LANGUAGES: Locale[] = ['en-US', 'zh-CN']

export function getLocale(): Locale {
  return requestContext.getStore()?.locale || 'en-US'
}

export function getRequestContext(): RequestContextStore | undefined {
  return requestContext.getStore()
}

/**
 * Get authenticated user from request context.
 * Throws UnauthorizedException if user is not authenticated.
 * Use this for protected endpoints that require authentication.
 */
export function getUser(): TokenInfo {
  const user = requestContext.getStore()?.user
  if (!user) {
    throw new UnauthorizedException()
  }
  return user
}

/**
 * Get authenticated user from request context, or undefined if not authenticated.
 * Does not throw. Use this for public endpoints that optionally use user info.
 */
export function getUserOptional(): TokenInfo | undefined {
  return requestContext.getStore()?.user
}

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const locale = this.parseLocale(context)
    const user = this.extractUser(context)
    return requestContext.run({ locale, user }, () => next.handle())
  }

  private parseLocale(context: ExecutionContext): Locale {
    const type = context.getType()

    if (type === 'http')
      return this.parseHttpLocale(context)

    if (type === 'ws')
      return this.parseWsLocale(context)

    return 'en-US'
  }

  private extractUser(context: ExecutionContext): TokenInfo | undefined {
    const type = context.getType()

    if (type === 'http') {
      const request = context.switchToHttp().getRequest()
      return request['user']
    }

    return undefined
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
