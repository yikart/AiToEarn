export class RelayAccountException extends Error {
  constructor(
    public readonly relayAccountRef: string,
    public readonly originalAccountId: string,
  ) {
    super('This account requires relay')
  }
}
