import { AccountType } from '@/transports/account/comment'

export interface InteractionRecord {
  id: string
  userId: string
  accountId: string
  type: AccountType
  worksId: string
  worksTitle?: string
  commentRemark?: string
  worksCover?: string
  commentContent: string
  isLike: 0 | 1
  isCollect: 0 | 1
  createAt: Date
  updatedAt: Date
}

export interface ReplyCommentRecord {
  id: string
  userId: string
  accountId: string
  type: AccountType
  commentId: string
  commentContent: string
  replyContent: string
  createAt: Date
  updatedAt: Date
}
