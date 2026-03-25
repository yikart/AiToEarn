import type { AssetsConfig } from '@yikart/assets'
import type { Method } from 'axios'
import type { Request, Response } from 'express'
import {
  ArgumentsHost,
  Catch,
  Logger,
} from '@nestjs/common'
import { AppException, GlobalExceptionFilter, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { concatMap, from, of } from 'rxjs'
import { z } from 'zod'
import { relayConfigSchema } from '../../config'
import { RelayAccountException } from './relay-account.exception'
import { RelayAuthException } from './relay-auth.exception'
import { RelayClientService } from './relay-client.service'

type RelayConfig = z.infer<typeof relayConfigSchema>

@Catch(RelayAccountException, RelayAuthException)
export class RelayExceptionFilter extends GlobalExceptionFilter<unknown> {
  protected override readonly logger = new Logger(RelayExceptionFilter.name)
  private readonly localUrlPrefixes: string[]

  constructor(
    private readonly relayConfig: RelayConfig | undefined,
    private readonly assetsConfig: AssetsConfig | undefined,
    private readonly relayClientService: RelayClientService | undefined,
  ) {
    super()
    this.localUrlPrefixes = []
    if (assetsConfig?.endpoint) {
      this.localUrlPrefixes.push(assetsConfig.endpoint.replace(/\/+$/, ''))
    }
    if (assetsConfig?.cdnEndpoint) {
      this.localUrlPrefixes.push(assetsConfig.cdnEndpoint.replace(/\/+$/, ''))
    }
  }

  override catch(exception: RelayAccountException | RelayAuthException, host: ArgumentsHost) {
    if (!this.relayConfig) {
      return super.catch(exception, host)
    }

    return from(this.handleRelay(exception, host)).pipe(concatMap(v => v || of(v)))
  }

  private async handleRelay(exception: RelayAccountException | RelayAuthException, host: ArgumentsHost) {
    const relayConfig = this.relayConfig!
    try {
      const ctx = host.switchToHttp()
      const request = ctx.getRequest<Request & { user?: { id?: string } }>()
      const response = ctx.getResponse<Response>()

      const forwardHeaders = this.buildForwardHeaders(request)

      let targetUrl: string
      let targetBody: unknown

      if (exception instanceof RelayAccountException) {
        const { originalAccountId, relayAccountRef } = exception
        targetUrl = `${relayConfig.serverUrl}${request.originalUrl}`.replaceAll(
          originalAccountId,
          relayAccountRef,
        )
        targetBody = request.body
          ? JSON.parse(
              JSON.stringify(request.body).replaceAll(
                originalAccountId,
                relayAccountRef,
              ),
            )
          : undefined

        targetBody = await this.replaceLocalUrls(targetBody)
      }
      else {
        const userId = request.user?.id
        const callbackUrl = new URL(relayConfig.callbackUrl)
        if (userId) {
          callbackUrl.searchParams.set('userId', userId)
        }
        const callbackUrlStr = callbackUrl.toString()

        const isGet = request.method.toUpperCase() === 'GET'
        if (isGet) {
          const url = new URL(`${relayConfig.serverUrl}${request.originalUrl}`)
          url.searchParams.set('callbackUrl', callbackUrlStr)
          url.searchParams.set('callbackMethod', 'POST')
          targetUrl = url.toString()
          targetBody = undefined
        }
        else {
          targetUrl = `${relayConfig.serverUrl}${request.originalUrl}`
          targetBody = {
            ...request.body,
            callbackUrl: callbackUrlStr,
            callbackMethod: 'POST',
          }
        }
      }

      try {
        const proxyResponse = await axios({
          method: request.method as Method,
          url: targetUrl,
          data: targetBody,
          headers: forwardHeaders,
          validateStatus: () => true,
        })

        response.status(proxyResponse.status).json(proxyResponse.data)
      }
      catch (error) {
        this.logger.error(error, 'Relay proxy request failed')
        return super.catch(new AppException(ResponseCode.RelayServerUnavailable), host)
      }
    }
    catch (error) {
      this.logger.error(error, 'Relay exception filter failed')
      return super.catch(error as Error, host)
    }
  }

  private async replaceLocalUrls(body: unknown): Promise<unknown> {
    if (!body || this.localUrlPrefixes.length === 0 || !this.relayClientService) {
      return body
    }

    let bodyStr = JSON.stringify(body)
    const urlPattern = new RegExp(
      `(${this.localUrlPrefixes.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})/[^"\\s]+`,
      'g',
    )

    const localUrls = [...new Set(bodyStr.match(urlPattern) || [])]

    for (const localUrl of localUrls) {
      let downloadUrl = localUrl
      const cdnPrefix = this.assetsConfig?.cdnEndpoint?.replace(/\/+$/, '')
      const endpointPrefix = this.assetsConfig?.endpoint?.replace(/\/+$/, '')
      if (cdnPrefix && endpointPrefix && localUrl.startsWith(cdnPrefix)) {
        const bucket = this.assetsConfig?.bucketName || ''
        const internalBase = `${endpointPrefix}${bucket ? `/${bucket}` : ''}`
        downloadUrl = localUrl.replace(cdnPrefix, internalBase)
      }
      const relayUrl = await this.relayClientService.uploadFileFromLocalUrl(downloadUrl)
      bodyStr = bodyStr.replaceAll(localUrl, relayUrl)
    }

    return JSON.parse(bodyStr)
  }

  private buildForwardHeaders(request: Request): Record<string, string> {
    const forwardHeaders: Record<string, string> = {}
    for (const [key, value] of Object.entries(request.headers)) {
      if (key === 'authorization' || key === 'host' || key === 'content-length') {
        continue
      }
      if (typeof value === 'string') {
        forwardHeaders[key] = value
      }
    }
    forwardHeaders['x-api-key'] = this.relayConfig!.apiKey
    return forwardHeaders
  }
}
