import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, query } = req
    const startTime = Date.now()
    Logger.debug(`-----${method} ${originalUrl}`, {
      body,
      query,
      startTime,
    })
    next()
  }
}
