export enum IncomeType {
  Task = 'task', // 任务
  TaskWithdraw = 'task_withdraw', // 任务提现扣除
  TaskBack = 'task_back', // 任务回退
  RewardBack = 'reward_back', // 奖励回退
}

// 提现状态
export enum IncomeStatus {
  WAIT = 0, // 待提现
  DO = 1, // 已经提现
}
