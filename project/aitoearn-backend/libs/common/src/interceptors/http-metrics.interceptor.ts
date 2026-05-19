import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { Request, Response } from 'express'
import { Injectable } from '@nestjs/common'
import { Counter, Gauge, Histogram } from 'prom-client'
import { tap } from 'rxjs'

const EXCLUDED_PATHS = new Set(['/metrics', '/health'])

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.003, 0.03, 0.1, 0.3, 1.5, 10],
})

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
})

const httpRequestsInFlight = new Gauge({
  name: 'http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
  labelNames: ['method'] as const,
})

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== 'http')
      return next.handle()

    const req = context.switchToHttp().getRequest<Request>()
    if (EXCLUDED_PATHS.has(req.path))
      return next.handle()

    const res = context.switchToHttp().getResponse<Response>()
    const route = req.route
      ? this.normalizeRoute(`${req.baseUrl}${req.route.path}`)
      : this.getRouteFromMetadata(context)

    const end = httpRequestDuration.startTimer()
    httpRequestsInFlight.inc({ method: req.method })

    const recordMetrics = () => {
      const statusCode = String(res.statusCode)
      const labels = { method: req.method, route, status_code: statusCode }

      end(labels)
      httpRequestTotal.inc(labels)
      httpRequestsInFlight.dec({ method: req.method })
    }

    return next.handle().pipe(
      tap({ next: recordMetrics, error: recordMetrics }),
    )
  }

  private normalizeRoute(raw: string): string {
    return raw.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  }

  private getRouteFromMetadata(context: ExecutionContext): string {
    const controllerPath = Reflect.getMetadata('path', context.getClass()) || ''
    const handlerPath = Reflect.getMetadata('path', context.getHandler()) || ''
    const prefix = Array.isArray(controllerPath) ? controllerPath[0] : controllerPath
    const handler = Array.isArray(handlerPath) ? handlerPath[0] : handlerPath
    return this.normalizeRoute(`/${prefix}/${handler}`)
  }
}
