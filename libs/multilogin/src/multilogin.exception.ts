export class MultiloginError extends Error {
  public readonly statusCode?: number
  public response?: unknown

  constructor(message: string, statusCode?: number, response?: unknown) {
    super(message)
    this.name = 'MultiloginError'
    this.statusCode = statusCode
    this.response = response
  }
}

export class MultiloginRateLimitError extends MultiloginError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429)
    this.name = 'MultiloginRateLimitError'
  }
}
