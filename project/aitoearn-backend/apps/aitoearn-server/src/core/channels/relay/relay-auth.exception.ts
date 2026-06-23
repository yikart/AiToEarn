export class RelayAuthException extends Error {
  constructor() {
    super('Auth request should be forwarded to relay server')
  }
}
