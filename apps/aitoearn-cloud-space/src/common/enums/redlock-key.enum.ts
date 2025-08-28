export class RedlockKey {
  static CloudSpaceConfigTask = 'scheduler:cloudSpace-config-task'
  static EnvConfig: (envId: string) => string = (envId: string) => (
    `scheduler:env-config:${envId}`
  )
}
