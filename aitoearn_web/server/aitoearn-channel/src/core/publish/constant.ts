// 定时任务间隔时间，一小时
export const TIMED_TASK_INTERVAL = 1000 * 60 * 60
// export const TIMED_TASK_INTERVAL = 2000

// 定时任务扫码跨度，在当前时间前后 ‘CRON_SCAN_WINDOW_MS’ 分钟内时间的任务才会被推送到任务队列
export const CRON_SCAN_WINDOW_MS = 1000 * 60 * 90

// 发布任务时，如果在当前时间 + 'IMMEDIATE_PUBLISH_THRESHOLD_MS'内，则直接推送到任务队列
export const IMMEDIATE_PUSH_THRESHOLD_MS = 2 * 60 * 60 * 1000
// export const IMMEDIATE_PUSH_THRESHOLD_MS = 2 * 60 * 60 * 100000
