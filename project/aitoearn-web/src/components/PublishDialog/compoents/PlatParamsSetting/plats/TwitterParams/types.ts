import type { IPlatOption } from '@/components/PublishDialog/publishDialog.type'

export type TwitterOption = NonNullable<IPlatOption['twitter']>

export type TwitterReplySettings = NonNullable<TwitterOption['replySettings']>

export type TwitterPollConfig = NonNullable<TwitterOption['poll']>
