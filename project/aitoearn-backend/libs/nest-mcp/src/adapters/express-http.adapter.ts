import type { Request, Response } from 'express'
import {
  HttpAdapter,
  HttpRequest,
  HttpResponse,
} from '../interfaces/http-adapter.interface'

/**
 * Express HTTP adapter that implements the generic HTTP interface
 */
export class ExpressHttpAdapter implements HttpAdapter {
  adaptRequest(req: Request): HttpRequest {
    return {
      url: req.url,
      method: req.method,
      headers: req.headers as Record<string, string | string[] | undefined>,
      query: req.query,
      body: req.body,
      params: req.params as Record<string, string>,
      get: (name: string) => req.get(name),
      raw: req,
    }
  }

  adaptResponse(res: Response): HttpResponse {
    return {
      status: (code: number) => {
        res.status(code)
        return this.adaptResponse(res)
      },
      json: (body: any) => {
        res.json(body)
        return this.adaptResponse(res)
      },
      send: (body: string) => {
        res.send(body)
        return this.adaptResponse(res)
      },
      write: (chunk: any) => res.write(chunk),
      setHeader: (name: string, value: string | string[]) =>
        res.setHeader(name, value),
      get headersSent() {
        return res.headersSent
      },
      get writable() {
        return res.writable
      },
      get closed() {
        return res.destroyed || res.writableEnded
      },
      on: (event: string, listener: (...args: any[]) => void) => {
        res.on(event, listener)
      },
      raw: res,
    }
  }
}
