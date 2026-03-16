export class RedlockKey {
  static CreditsExpirationCheck = 'scheduler:credits-expiration-check'
  static VideoTaskStatusCheck = 'scheduler:video-task-status-check'
  static AgentTaskTimeout = 'scheduler:agent-task-timeout'
  static AgentHealthCheck = 'scheduler:agent-health-check'
  static AideoTaskStatusCheck = 'scheduler:aideo-task-status-check'
  static NewApiChannelCheck = 'scheduler:new-api-channel-check'
  static AssetsPendingCheck = 'scheduler:assets-pending-check'
  static AssetsExpiredCleanup = 'scheduler:assets-expired-cleanup'
  static AssetsR2EventsProcess = 'scheduler:assets-r2-events-process'
  static PublishingTaskEnqueue = 'scheduler:publishing-task-enqueue'
}
