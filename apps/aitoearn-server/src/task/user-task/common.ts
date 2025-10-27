export enum UserTaskStatus {
  DOING = 'doing', // 进行中
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 已通过
  REJECTED = 'rejected', // 已拒绝
  CANCELLED = 'cancelled', // 已取消
  DEL = 'del', // 已删除或回退
}
