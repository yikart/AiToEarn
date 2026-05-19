import type { Locale } from './messages'
import template from 'art-template'

export enum NotificationMessageKey {
  AgentResult = 'agent_result',
  AgentResultRequiresAction = 'agent_result_requires_action',
  AppRelease = 'app_release',
}

type MessageValue = string | ((data: unknown) => string)

interface NotificationMessageDef {
  readonly title: Record<Locale, MessageValue>
  readonly content: Record<Locale, MessageValue>
}

const notificationMessages: Record<NotificationMessageKey, NotificationMessageDef> = {
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
