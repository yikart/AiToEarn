import type { Locale } from './messages'
import template from 'art-template'

export enum NotificationMessageKey {
  AiReviewSkipped = 'ai_review_skipped',
  TaskSubmitted = 'task_submitted',
  TaskReviewRejected = 'task_review_rejected',
  TaskReviewApproved = 'task_review_approved',
  TaskSettled = 'task_settled',
  TaskReminderNewTask = 'task_reminder_new_task',
  TaskReminderAccountBinding = 'task_reminder_account_binding',
  TaskReminderLogin = 'task_reminder_login',
  TaskReminderAccountLogin = 'task_reminder_account_login',
  InteractionAiReviewFailed = 'interaction_ai_review_failed',
  TaskPunish = 'task_punish',
  AgentResult = 'agent_result',
  AgentResultRequiresAction = 'agent_result_requires_action',
  AgentForwarded = 'agent_forwarded',
  AppRelease = 'app_release',
}

type MessageValue = string | ((data: unknown) => string)

interface NotificationMessageDef {
  readonly title: Record<Locale, MessageValue>
  readonly content: Record<Locale, MessageValue>
}

const notificationMessages: Record<NotificationMessageKey, NotificationMessageDef> = {
  [NotificationMessageKey.AiReviewSkipped]: {
    title: {
      'en-US': 'Task needs manual review',
      'zh-CN': '任务需要手动审核',
    },
    content: {
      'en-US': template.compile('AI review was skipped for task "{{taskTitle}}". Please review manually.'),
      'zh-CN': template.compile('任务"{{taskTitle}}"的 AI 审核已跳过，请手动审核。'),
    },
  },

  [NotificationMessageKey.TaskSubmitted]: {
    title: {
      'en-US': 'New task submission',
      'zh-CN': '新任务提交',
    },
    content: {
      'en-US': template.compile('A user has submitted work for task "{{taskTitle}}". Please review.'),
      'zh-CN': template.compile('有用户提交了任务"{{taskTitle}}"的作品，请审核。'),
    },
  },

  [NotificationMessageKey.TaskReviewRejected]: {
    title: {
      'en-US': 'Task review rejected',
      'zh-CN': '任务审核被拒绝',
    },
    content: {
      'en-US': template.compile('Your submission for task "{{taskTitle}}" was rejected. {{rejectionReason}}'),
      'zh-CN': template.compile('您提交的任务"{{taskTitle}}"审核未通过。{{rejectionReason}}'),
    },
  },

  [NotificationMessageKey.TaskReviewApproved]: {
    title: {
      'en-US': 'Task review approved',
      'zh-CN': '任务审核通过',
    },
    content: {
      'en-US': template.compile('Your submission for task "{{taskTitle}}" has been approved.'),
      'zh-CN': template.compile('您提交的任务"{{taskTitle}}"已审核通过。'),
    },
  },

  [NotificationMessageKey.TaskSettled]: {
    title: {
      'en-US': 'Task settlement completed',
      'zh-CN': '任务结算完成',
    },
    content: {
      'en-US': template.compile('Your task "{{taskTitle}}" has been settled. Earnings have been credited to your balance.'),
      'zh-CN': template.compile('您的任务"{{taskTitle}}"已完成结算，收益已计入余额。'),
    },
  },

  [NotificationMessageKey.TaskReminderNewTask]: {
    title: {
      'en-US': 'You have a new task',
      'zh-CN': '您有新任务',
    },
    content: {
      'en-US': 'You have a new task',
      'zh-CN': '您有新任务',
    },
  },

  [NotificationMessageKey.TaskReminderAccountBinding]: {
    title: {
      'en-US': 'Account binding required',
      'zh-CN': '需要绑定账号',
    },
    content: {
      'en-US': 'Please authorize your account to complete task settlement',
      'zh-CN': '请授权您的账号以完成任务结算',
    },
  },

  [NotificationMessageKey.TaskReminderLogin]: {
    title: {
      'en-US': 'Task reminder',
      'zh-CN': '任务提醒',
    },
    content: {
      'en-US': 'Please login to complete the task',
      'zh-CN': '请登录以完成任务',
    },
  },

  [NotificationMessageKey.TaskReminderAccountLogin]: {
    title: {
      'en-US': 'Account Login Reminder',
      'zh-CN': '账号登录提醒',
    },
    content: {
      'en-US': template.compile('{{message}}'),
      'zh-CN': template.compile('{{message}}'),
    },
  },

  [NotificationMessageKey.InteractionAiReviewFailed]: {
    title: {
      'en-US': 'Interaction task needs manual review',
      'zh-CN': '互动任务需要人工审核',
    },
    content: {
      'en-US': template.compile('AI review failed for interaction task "{{taskTitle}}". Reason: {{reason}}. Please review manually.'),
      'zh-CN': template.compile('互动任务"{{taskTitle}}"的 AI 审核未通过，原因：{{reason}}，请手动复审。'),
    },
  },

  [NotificationMessageKey.TaskPunish]: {
    title: {
      'en-US': 'Punishment',
      'zh-CN': '处罚通知',
    },
    content: {
      'en-US': template.compile('You have been punished for {{taskTitle}}'),
      'zh-CN': template.compile('您因"{{taskTitle}}"受到处罚'),
    },
  },

  [NotificationMessageKey.AgentResult]: {
    title: {
      'en-US': template.compile('Agent Result {{status}}'),
      'zh-CN': template.compile('代理任务结果：{{status}}'),
    },
    content: {
      'en-US': template.compile('Your Agent Task [{{taskId}}] is {{status}}'),
      'zh-CN': template.compile('您的代理任务 [{{taskId}}] 状态为{{status}}'),
    },
  },

  [NotificationMessageKey.AgentResultRequiresAction]: {
    title: {
      'en-US': 'Agent Result RequiresAction',
      'zh-CN': '代理任务需要操作',
    },
    content: {
      'en-US': template.compile('Your Agent Task [{{taskId}}] requires action (e.g., connect a channel)'),
      'zh-CN': template.compile('您的代理任务 [{{taskId}}] 需要操作（例如：连接频道）'),
    },
  },

  [NotificationMessageKey.AgentForwarded]: {
    title: {
      'en-US': 'Forwarded Agent Task',
      'zh-CN': '转发的代理任务',
    },
    content: {
      'en-US': template.compile('Task {{taskId}} has been forwarded to you.'),
      'zh-CN': template.compile('任务 {{taskId}} 已转发给您。'),
    },
  },
  [NotificationMessageKey.AppRelease]: {
    title: {
      'en-US': 'New version released',
      'zh-CN': '新版本发布',
    },
    content: {
      'en-US': template.compile('A new {{platform}} version {{version}} has been released.'),
      'zh-CN': template.compile('{{platform}} 新版本 {{version}} 已发布。'),
    },
  },
}

function resolveValue(value: MessageValue, vars?: Record<string, unknown>): string {
  if (typeof value === 'string') {
    return value
  }
  return value(vars ?? {})
}

export function resolveNotificationMessage(
  messageKey: NotificationMessageKey,
  locale: Locale,
  vars?: Record<string, unknown>,
): { title: string, content: string } {
  const def = notificationMessages[messageKey]
  if (!def) {
    return { title: String(messageKey), content: String(messageKey) }
  }
  return {
    title: resolveValue(def.title[locale] ?? def.title['en-US'], vars),
    content: resolveValue(def.content[locale] ?? def.content['en-US'], vars),
  }
}

export function resolveNotificationMessageAllLocales(
  messageKey: NotificationMessageKey,
  vars?: Record<string, unknown>,
): Record<Locale, { title: string, content: string }> {
  return {
    'en-US': resolveNotificationMessage(messageKey, 'en-US', vars),
    'zh-CN': resolveNotificationMessage(messageKey, 'zh-CN', vars),
  }
}
