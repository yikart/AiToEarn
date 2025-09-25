export enum WithdrawRecordType {
  Task = 'task', // 任务
  Reward = 'reward', // 奖励
}

export enum WithdrawRecordStatus {
  Pending = 0,
  Success = 1,
  Failed = -1,
}
