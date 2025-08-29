export enum CloudSpaceStatus {
  Creating = 'creating',
  Configuring = 'configuring',
  Ready = 'ready',
  Error = 'error',
  Terminated = 'terminated',
}

export enum CloudSpaceRegion {
  Washington = 'us-ws',
  LosAngeles = 'us-ca',
  London = 'uk-london',
  Singapore = 'sg',
  Tokyo = 'jpn-tky',
  Hongkong = 'hk',
}

export enum CloudInstanceStatus {
  Creating = 'Creating',
  Running = 'Running',
  Stopped = 'Stopped',
  Error = 'Error',
}
