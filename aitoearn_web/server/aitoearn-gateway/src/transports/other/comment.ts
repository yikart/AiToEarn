export enum FeedbackType {
  errReport = 'errReport', // 错误反馈
  feedback = 'feedback', // 反馈
  msgReport = 'msgReport', // 消息举报
  msgFeedback = 'msgFeedback', // 消息反馈
}

export interface Feedback {
  id: string
  userId: string
  userName: string
  content: string
  type: FeedbackType
  tagList: string[]
  fileUrlList: string[]
  createAt: Date
  updatedAt: Date
}

export interface CreateFeedback {
  userId: string
  userName: string
  content: string
  type?: FeedbackType
  tagList?: string[]
  fileUrlList?: string[]
}
