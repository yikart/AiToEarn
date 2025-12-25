export enum UptimeStatus {
  NORMAL = 1, // 正常
  TIMEOUT = 2, // 超时
  UNAVAILABLE = 3, // 不可用
}

export enum UptimeModule {
  Agent = 'agent', // Agent
  Server = 'server', // 服务器
  Database = 'database', // 数据库
  Network = 'network', // 网络
  Other = 'other', // 其他
}

export enum UptimeType {
  AgentStatus = 'agentStatus',
}

export interface UptimeItem {
  id: string
  status: UptimeStatus
  module: UptimeModule
  type: UptimeType
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
