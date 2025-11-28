/*
 * @Description: AI Agent 内容生成任务接口
 */
import http from '@/utils/request'

// 任务状态枚举
export enum TaskStatus {
  Thinking = 'THINKING',
  Waiting = 'WAITING', // 等待
  GeneratingContent = 'GENERATING_CONTENT', // 内容生成中
  GeneratingImage = 'GENERATING_IMAGE', // 图片生成中
  GeneratingVideo = 'GENERATING_VIDEO', // 视频生成中
  GeneratingText = 'GENERATING_TEXT', // 文本生成中
  Completed = 'COMPLETED', // 完成
  Failed = 'FAILED', // 失败
  Cancelled = 'CANCELLED', // 取消
}

// 媒体类型
export enum MediaType {
  Video = 'VIDEO',
  Image = 'IMAGE',
}

// 媒体文件
export interface Media {
  type: MediaType
  url: string
  coverUrl?: string // 视频封面URL（可选）
}

// 任务详情
export interface TaskDetail {
  id: string
  userId: string
  prompt: string
  title: string
  description: string
  tags: string[]
  status: TaskStatus
  medias: Media[]
  errorMessage: string
  createdAt: string
}

// 创建任务请求参数
export interface CreateTaskParams {
  prompt: string
}

// 创建任务响应
export interface CreateTaskResponse {
  id: string
}

export const agentApi = {
  /**
   * 创建AI生成任务
   * @param params 
   */
  async createTask(params: CreateTaskParams) {
    const res = await http.post<CreateTaskResponse>('agent/tasks', params)
    return res
  },

  /**
   * 获取任务详情
   * @param taskId 任务ID
   */
  async getTaskDetail(taskId: string) {
    const res = await http.get<TaskDetail>(`agent/tasks/${taskId}`)
    return res
  },
}

