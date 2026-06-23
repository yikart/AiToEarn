import { z } from 'zod'

export enum WeChatOfficialCommentSwitch {
  Off = 0,
  On = 1,
}

export const WeChatOfficialOptionSchema = z.object({
  author: z.string().max(8).optional().describe('图文作者'),
  digest: z.string().max(120).optional().describe('图文摘要'),
  open_comment: z.enum(WeChatOfficialCommentSwitch).optional().describe('是否开启评论'),
  only_fans_can_comment: z.enum(WeChatOfficialCommentSwitch).optional().describe('是否仅粉丝可评论'),
  showCoverPic: z.boolean().optional().describe('是否显示封面'),
  sourceUrl: z.httpUrl().optional().describe('原文链接'),
})

export type WeChatOfficialOption = z.infer<typeof WeChatOfficialOptionSchema>
