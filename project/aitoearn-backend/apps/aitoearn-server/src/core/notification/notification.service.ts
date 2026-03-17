import type { Locale } from '@yikart/common'
import { Injectable, Logger } from '@nestjs/common'
import { NotificationData, QueueService } from '@yikart/aitoearn-queue'
import {
  AppException,

  NotificationType,
  resolveNotificationMessage,
  ResponseCode,
} from '@yikart/common'
import { NotificationRepository, NotificationStatus, UserNotificationControlRepository, UserRepository } from '@yikart/mongodb'
import { EmailService } from './email.service'
import {
  BatchDeleteDto,
  MarkAsReadDto,
  QueryNotificationsDto,
  UpdateNotificationControlDto,
} from './notification.dto'

@Injectable()
export class NotificationService {
  logger = new Logger(NotificationService.name)

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly queueService: QueueService,
    private readonly emailService: EmailService,
    private readonly userRepository: UserRepository,
    private readonly userNotificationControlRepository: UserNotificationControlRepository,
  ) { }

  async createForUser(data: NotificationData) {
    const res = await this.queueService.addNotificationJob(data)
    return res
  }

  async sendNotification(inData: NotificationData) {
    const { userId, userType, type, relatedId, data } = inData
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    const userLocale: Locale = (user.locale as Locale) ?? 'en-US'

    let title: string
    let content: string

    if (inData.messageKey) {
      const resolved = resolveNotificationMessage(inData.messageKey, userLocale, inData.vars)
      title = resolved.title
      content = resolved.content
    }
    else {
      title = inData.title ?? ''
      content = inData.content ?? ''
    }

    const saved = await this.notificationRepository.create({
      userId,
      userType,
      title,
      content,
      type,
      relatedId,
      data,
      status: NotificationStatus.Unread,
    })

    const emailTypes: NotificationType[] = [
      NotificationType.AgentResult,
      NotificationType.AiReviewSkipped,
      NotificationType.TaskSubmitted,
      NotificationType.TaskReviewRejected,
      NotificationType.TaskReviewApproved,
      NotificationType.TaskSettled,
    ]

    if (emailTypes.includes(type)) {
      const control = await this.userNotificationControlRepository.findByUserId(userId)
      const shouldSendEmail = (control?.controls as Record<string, any>)?.[type]?.email ?? true

      if (shouldSendEmail) {
        const result = type === NotificationType.AgentResult
          ? await this.emailService.sendAgentResultEmail(user.mail, data.taskId, data.status, data.description, userLocale)
          : await this.emailService.sendTaskNotificationEmail(user.mail, title, content, type, userLocale)
        if (!result) {
          this.notificationRepository.updateChannelResult(saved.id, 'mail', false, 'send error')
        }
      }
      else {
        this.notificationRepository.updateChannelResult(saved.id, 'mail', false, 'user_disabled')
      }
    }

    return saved
  }

  async findByUser(userId: string, queryDto: QueryNotificationsDto) {
    return await this.notificationRepository.listWithPagination({
      userId,
      page: queryDto.page,
      pageSize: queryDto.pageSize,
      status: queryDto.status,
      type: queryDto.type,
    })
  }

  async findById(id: string, userId: string) {
    const notification = await this.notificationRepository.getByIdAndUserId(id, userId)

    if (!notification) {
      throw new AppException(ResponseCode.NotificationNotFound)
    }

    return notification
  }

  async markAsRead(userId: string, markDto: MarkAsReadDto) {
    return await this.notificationRepository.updateManyAsReadByIds(markDto.notificationIds, userId)
  }

  async markAllAsRead(userId: string) {
    return await this.notificationRepository.updateManyAsReadByUserId(userId)
  }

  async delete(userId: string, deleteDto: BatchDeleteDto) {
    return await this.notificationRepository.deleteManyByIds(deleteDto.notificationIds, userId)
  }

  async getUnreadCount(userId: string, filter?: {
    type?: NotificationType
  }) {
    return await this.notificationRepository.countByUserIdUnread(userId, filter)
  }

  async getNotificationControl(userId: string) {
    const control = await this.userNotificationControlRepository.findByUserId(userId)
    return this.buildNotificationControlResponse(control)
  }

  async updateNotificationControl(userId: string, updateDto: UpdateNotificationControlDto) {
    const control = await this.userNotificationControlRepository.upsertByUserId(
      userId,
      updateDto.controls,
    )
    return this.buildNotificationControlResponse(control)
  }

  private buildNotificationControlResponse(control: Awaited<ReturnType<typeof this.userNotificationControlRepository.findByUserId>>) {
    const allTypes = Object.values(NotificationType)
    const controls = allTypes.map((type) => {
      const typeControl = (control?.controls as Record<string, any>)?.[type]
      return {
        type,
        email: typeControl?.email ?? true,
      }
    })
    return { controls }
  }
}
