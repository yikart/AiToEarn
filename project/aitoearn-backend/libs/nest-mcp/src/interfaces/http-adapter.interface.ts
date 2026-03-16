/**
 * Generic HTTP request interface that abstracts Express and Fastify request objects
 */
export interface HttpRequest {
  url?: string
  method?: string
  headers: Record<string, string | string[] | undefined>
  query: Record<string, any>
  body?: any
  params?: Record<string, string>
  /**
   * Get a header value by name (case-insensitive)
   */
  get?: (name: string) => string | undefined
  /**
   * Access to the raw framework-specific request object
   */
  raw?: any
}

/**
 * Generic HTTP response interface that abstracts Express and Fastify response objects
 */
export interface HttpResponse {
  /**
   * Set the response status code
   */
  status: (code: number) => this

  /**
   * Send a JSON response
   */
  json: (body: any) => this | void

  /**
   * Send a text response
   */
  send: (body: string) => this | void

  /**
   * Write data to the response stream
   */
  write: (chunk: any) => boolean | void

  /**
   * Set a response header
   */
  setHeader?: (name: string, value: string | string[]) => void

  /**
   * Check if headers have been sent
   */
  readonly headersSent?: boolean

  /**
   * Check if the response is writable
   */
  readonly writable?: boolean

  /**
   * Check if the response is closed
   */
  readonly closed?: boolean

  /**
   * Listen for events
   */
  on?: (event: string, listener: (...args: any[]) => void) => void

  /**
   * Access to the raw framework-specific response object
   */
  raw?: any
}

/**
 * HTTP adapter interface for framework-specific implementations
 */
export interface HttpAdapter {
  /**
   * Adapt a framework-specific request to the generic HttpRequest interface
   */
  adaptRequest: (req: any) => HttpRequest

  /**
   * Adapt a framework-specific response to the generic HttpResponse interface
   */
  adaptResponse: (res: any) => HttpResponse
}
