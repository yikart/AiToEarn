export enum IncomeRecordType {
  Task = 'task', // 任务
  TaskWithdraw = 'task_withdraw', // 任务提现扣除
  TaskBack = 'task_back', // 任务回退
  RewardBack = 'reward_back', // 奖励回退
}

// 提现状态
export enum IncomeRecordStatus {
  Pending = 0, // 等待
  Processing = 1, // 提现已提交
}
