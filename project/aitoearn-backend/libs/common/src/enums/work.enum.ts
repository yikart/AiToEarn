export enum WorkStatus {
  DELETED = 'deleted', // 作品已删除
  NORMAL = 'normal', // 作品正常
  UNKNOWN = 'unknown', // 作品状态未知
  LINK_ERROR = 'link_error', // 作品链接错误
}

export const POST_DATA_UNAVAILABLE_WORK_STATUSES = [WorkStatus.DELETED, WorkStatus.LINK_ERROR]
