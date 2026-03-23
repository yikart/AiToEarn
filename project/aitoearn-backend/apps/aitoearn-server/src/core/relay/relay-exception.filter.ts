import type { Request, Response } from 'express'
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
} from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { RelayRequiredException } from './relay-required.exception'

interface RelayConfig {
  serverUrl: string
  apiKey: string
}

@Catch(RelayRequiredException)
export class RelayExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RelayExceptionFilter.name)

  constructor(private readonly relayConfig: RelayConfig | undefined) {}

  async catch(exception: RelayRequiredException, host: ArgumentsHost) {
    if (!this.relayConfig) {
      throw exception
    }

    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    const { originalAccountId, relayAccountRef } = exception

    const forwardHeaders: Record<string, string> = {}
    for (const [key, value] of Object.entries(request.headers)) {
      if (key === 'authorization' || key === 'host' || key === 'content-length') {
        continue
      }
      if (typeof value === 'string') {
        forwardHeaders[key] = value
      }
    }
    forwardHeaders['x-api-key'] = this.relayConfig.apiKey

    const targetUrl = `${this.relayConfig.serverUrl}${request.originalUrl}`.replaceAll(
      originalAccountId,
      relayAccountRef,
    )

    const targetBody = request.body
      ? JSON.parse(
          JSON.stringify(request.body).replaceAll(
            originalAccountId,
            relayAccountRef,
          ),
        )
      : undefined

    try {
      const proxyResponse = await axios({
        method: request.method as any,
        url: targetUrl,
        data: targetBody,
        headers: forwardHeaders,
        validateStatus: () => true,
      })

      response.status(proxyResponse.status).json(proxyResponse.data)
    }
    catch (error) {
      this.logger.error({ message: 'Relay proxy failed', error, targetUrl })
      throw new AppException(ResponseCode.RelayServerUnavailable)
    }
  }
}
