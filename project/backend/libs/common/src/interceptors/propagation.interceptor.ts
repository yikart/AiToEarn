import { AsyncLocalStorage } from 'node:async_hooks'
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { SSE_METADATA } from '@nestjs/common/constants'
import { Observable } from 'rxjs'

interface Store {
  headers: Record<string, string | string[] | undefined>
}

export const propagationContext = new AsyncLocalStorage<Store>()

export const COMMON_PROPAGATION_HEADERS = [
  'x-request-id',
  'x-b3-traceid',
  'x-b3-spanid',
  'x-b3-parentspanid',
  'x-b3-sampled',
  'x-b3-flags',
  'x-ot-span-context',
  'grpc-trace-bin',
  'traceparent',
  'x-cloud-trace-context',
  'x-amzn-trace-id',
  'x-client-version',
  'x-client-type',
]

@Injectable()
export class PropagationInterceptor implements NestInterceptor {
  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return propagationContext.run({ headers: this.getHeaders(context) }, () => next.handle())
  }

  private getHttpHeaders(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()

    if (!Reflect.getMetadata(SSE_METADATA, context.getHandler()))
      response.header('x-request-id', request.headers['x-request-id'])

    return request.headers
  }

  private getWsHeaders(context: ExecutionContext) {
    const host = context.switchToWs()
    const socket = host.getClient()
    const data = host.getData()
    const headers = socket.handshake.headers
    if (data?.headers) {
      return {
        ...headers,
        ...data.headers,
      }
    }
    return headers
  }

  private getRpcHeaders(context: ExecutionContext) {
    const rpcContext = context.switchToRpc().getContext()
    const metadata = rpcContext.getMap ? rpcContext.getMap() : {}
    return metadata
  }

  private getHeaders(context: ExecutionContext) {
    const type = context.getType()
    if (type === 'http')
      return this.getHttpHeaders(context)

    if (type === 'ws')
      return this.getWsHeaders(context)

    if (type === 'rpc')
      return this.getRpcHeaders(context)

    return {}
  }
}
