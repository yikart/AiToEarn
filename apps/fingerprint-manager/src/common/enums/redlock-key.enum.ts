export class RedlockKey {
  static EnvironmentConfigTask = 'scheduler:environment-config-task'
  static EnvConfig: (envId: string) => string = (envId: string) => (
    `scheduler:env-config:${envId}`
  )
}
