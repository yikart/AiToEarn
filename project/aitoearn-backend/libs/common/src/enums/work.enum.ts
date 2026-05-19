export enum WorkStatus {
  DELETED = 'deleted',
  NORMAL = 'normal',
  UNKNOWN = 'unknown',
  LINK_ERROR = 'link_error',
}

export const POST_DATA_UNAVAILABLE_WORK_STATUSES = [WorkStatus.DELETED, WorkStatus.LINK_ERROR]
