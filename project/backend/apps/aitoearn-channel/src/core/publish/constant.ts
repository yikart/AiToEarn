import { CronExpression } from '@nestjs/schedule'

export const PUbLISHING_SCHEDULED_TASK_CRON_EXPRESSION = CronExpression.EVERY_10_SECONDS
export const IMMEDIATE_PUBLISH_TOLERANCE_SECONDS = 10 * 1000
