import { Injectable } from '@nestjs/common'
import { PaginationVo } from '@yikart/common'
import { NatsClient } from '@yikart/nats-client'
import {
  AppConfigListDto,
  AppConfigListVo,
  AppConfigVo,
  AppReleaseVo,
  BatchDeleteDto,
  BlogVo,
  CheckVersionDto,
  CheckVersionVo,
  CreateAppReleaseDto,
  CreateBlogDto,
  CreateFeedbackDto,
  CreateNotificationsByUserDto,
  DeleteAppReleaseDto,
  DeleteConfigDto,
  FeedbackVo,
  GetAppConfigDto,
  GetAppReleaseByIdDto,
  GetUnreadCountDto,
  MarkAsReadDto,
  NotificationVo,
  OperationResultVo,
  QueryAppReleaseDto,
  QueryNotificationsDto,
  UnreadCountVo,
  UpdateAppReleaseDto,
  UpdateConfigDto,
  UpdateConfigsDto,
} from './aitoearn-other-client.interface'

@Injectable()
export class AitoearnOtherClient {
  constructor(private readonly natsClient: NatsClient) {}

  // ==================== AppRelease Module Methods ====================

  /**
   * 创建版本发布（管理端）
   */
  async createAppRelease(data: CreateAppReleaseDto): Promise<void> {
    return this.natsClient.send('other.appRelease.create', data)
  }

  /**
   * 更新版本发布（管理端）
   */
  async updateAppRelease(data: UpdateAppReleaseDto): Promise<void> {
    return this.natsClient.send('other.appRelease.update', data)
  }

  /**
   * 删除版本发布（管理端）
   */
  async deleteAppRelease(data: DeleteAppReleaseDto): Promise<void> {
    return this.natsClient.send('other.appRelease.delete', data)
  }

  /**
   * 获取版本发布详情（管理端）
   */
  async getAppReleaseDetail(data: GetAppReleaseByIdDto): Promise<AppReleaseVo> {
    return this.natsClient.send('other.appRelease.detail', data)
  }

  /**
   * 查询版本发布列表（管理端）
   */
  async getAppReleaseList(query: QueryAppReleaseDto): Promise<PaginationVo<AppReleaseVo>> {
    return this.natsClient.send('other.appRelease.list', query)
  }

  /**
   * 检查版本更新（客户端）
   */
  async checkVersion(data: CheckVersionDto): Promise<CheckVersionVo> {
    return this.natsClient.send('other.appRelease.checkVersion', data)
  }

  /**
   * 获取最新版本信息（客户端）
   */
  async getLatestAppRelease(query: QueryAppReleaseDto): Promise<AppReleaseVo | null> {
    return this.natsClient.send('other.appRelease.latest', query)
  }

  // ==================== Notification Module Methods ====================

  /**
   * 为用户创建通知
   */
  async createNotificationForUser(data: CreateNotificationsByUserDto): Promise<void> {
    return this.natsClient.send('other.notification.createForUser', data)
  }

  /**
   * 获取用户通知列表
   */
  async getUserNotifications(data: QueryNotificationsDto): Promise<PaginationVo<NotificationVo>> {
    return this.natsClient.send('other.notification.list', data)
  }

  /**
   * 获取通知详情
   */
  async getNotificationDetail(data: { id: string, userId: string }): Promise<NotificationVo> {
    return this.natsClient.send('other.notification.detail', data)
  }

  /**
   * 标记通知为已读
   */
  async markNotificationsAsRead(data: MarkAsReadDto): Promise<OperationResultVo> {
    return this.natsClient.send('other.notification.markRead', data)
  }

  /**
   * 标记所有通知为已读
   */
  async markAllNotificationsAsRead(data: { userId: string }): Promise<OperationResultVo> {
    return this.natsClient.send('other.notification.markAllRead', data)
  }

  /**
   * 删除通知
   */
  async deleteNotifications(data: BatchDeleteDto): Promise<OperationResultVo> {
    return this.natsClient.send('other.notification.delete', data)
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(data: GetUnreadCountDto): Promise<UnreadCountVo> {
    return this.natsClient.send('other.notification.unreadCount', data)
  }

  // ==================== Feedback Module Methods ====================

  /**
   * 创建反馈
   */
  async createFeedback(data: CreateFeedbackDto): Promise<FeedbackVo> {
    return this.natsClient.send('other.feedback.create', data)
  }

  // ==================== Blog Module Methods ====================

  /**
   * 创建博客
   */
  async createBlog(data: CreateBlogDto): Promise<BlogVo> {
    return this.natsClient.send('other.blog.create', data)
  }

  // ==================== AppConfig Module Methods ====================

  /**
   * 获取应用配置
   */
  async getAppConfig(data: GetAppConfigDto): Promise<AppConfigVo> {
    return this.natsClient.send('other.appConfigs.list', data)
  }

  /**
   * 更新配置
   */
  async updateConfig(data: UpdateConfigDto): Promise<{ success: boolean, data: AppConfigVo }> {
    return this.natsClient.send('other.appConfigs.update', data)
  }

  /**
   * 批量更新配置
   */
  async batchUpdateConfigs(data: UpdateConfigsDto): Promise<{ success: boolean, data: AppConfigVo[] }> {
    return this.natsClient.send('other.appConfigs.batchUpdate', data)
  }

  /**
   * 删除配置
   */
  async deleteConfig(data: DeleteConfigDto): Promise<{ success: boolean, message: string }> {
    return this.natsClient.send('other.appConfigs.delete', data)
  }

  /**
   * 获取配置列表
   */
  async getConfigList(data: AppConfigListDto): Promise<AppConfigListVo> {
    return this.natsClient.send('other.appConfigs.getList', data)
  }
}
