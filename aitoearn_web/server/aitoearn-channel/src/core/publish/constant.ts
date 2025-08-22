import { CronExpression } from '@nestjs/schedule'

// 定时任务间隔时间，1 分钟
export const PUSH_SCHEDULED_TASK_CRON_EXPRESSION = CronExpression.EVERY_10_MINUTES
// export const TIMED_TASK_INTERVAL = 2000

// 定时任务扫码跨度，在当前时间前后 ‘CRON_SCAN_WINDOW_MS’ 分钟内时间的任务才会被推送到任务队列
export const PUSH_SCHEDULED_TASK_QUERY_WINDOW_MS = 10 * 60 * 1000
// 发布任务时，如果在当前时间 + 'IMMEDIATE_PUBLISH_THRESHOLD_MS'内，则直接推送到任务队列
export const IMMEDIATE_PUSH_THRESHOLD_MS = 60 * 60 * 1000 * 2
// export const IMMEDIATE_PUSH_THRESHOLD_MS = 2 * 60 * 60 * 100000
