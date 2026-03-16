import { HttpAdapter } from '../interfaces/http-adapter.interface'
import { ExpressHttpAdapter } from './express-http.adapter'

/**
 * Factory for creating HTTP adapters based on the detected framework
 */
export class HttpAdapterFactory {
  private static expressAdapter: ExpressHttpAdapter | null = null

  /**
   * Get the appropriate HTTP adapter for the given request/response objects
   */
  static getAdapter(req: any, res: any): HttpAdapter {
    // Check if it's Express by looking for Express-specific properties
    if (this.isExpressRequest(req) && this.isExpressResponse(res)) {
      if (!this.expressAdapter) {
        this.expressAdapter = new ExpressHttpAdapter()
      }
      return this.expressAdapter
    }

    // Default to Express adapter for backward compatibility
    if (!this.expressAdapter) {
      this.expressAdapter = new ExpressHttpAdapter()
    }
    return this.expressAdapter
  }

  /**
   * Check if the request object is from Express
   */
  private static isExpressRequest(req: any): boolean {
    return Boolean(
      req
      && typeof req === 'object'
      && typeof req.get === 'function'
      && req.method !== undefined
      && req.url !== undefined
      && !req.routeOptions, // Fastify-specific property
    )
  }

  /**
   * Check if the response object is from Express
   */
  private static isExpressResponse(res: any): boolean {
    return Boolean(
      res
      && typeof res === 'object'
      && typeof res.status === 'function'
      && typeof res.json === 'function'
      && typeof res.send === 'function'
      && res.headersSent !== undefined
      && !res.sent, // Fastify-specific property
    )
  }
}
