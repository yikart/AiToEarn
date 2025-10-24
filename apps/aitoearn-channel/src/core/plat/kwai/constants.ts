export const KWAI_TIME_CONSTANTS = {
  AUTH_TASK_EXPIRE: 5 * 60, // for oauth task
  AUTH_TASK_EXTEND: 3 * 60, // extend oauth task
  TOKEN_REFRESH_MARGIN: 10 * 60, // margin for token refresh
  TOKEN_REFRESH_THRESHOLD: 15 * 60, // threshold for token refresh
} as const
