export class RelayAccountException extends Error {
  public readonly accountIdMap: Map<string, string>

  constructor(
    public readonly relayAccountRef: string,
    public readonly originalAccountId: string,
    accountIdMap?: Map<string, string>,
  ) {
    super('This account requires relay')
    this.accountIdMap = accountIdMap ?? new Map([[originalAccountId, relayAccountRef]])
  }
}
