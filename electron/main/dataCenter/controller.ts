import { Controller, Icp, Inject, Scheduled } from '../core/decorators';
import { DataCenterService } from './service';
import { getUserInfo, getUserToken } from '../user/comment';
import { AccountStatsModel } from 'electron/db/models/accountStats';
import { VideoStatsModel } from 'electron/db/models/videoStats';
import { AccountType } from '../../../commont/AccountEnum';
import { dataCenterApi } from '../api/data-center';

@Controller()
export class DataCenterController {
  @Inject(DataCenterService)
  private readonly dataCenterService!: DataCenterService;

  // 每30分钟同步账号数据
  @Scheduled('*/30 * * * *', 'sync_accounts')
  async syncAccounts() {
    try {
      const userInfo = await getUserInfo();
      const token = getUserToken();
      if (!userInfo || !token) return;

      const accounts = await dataCenterApi.getAccountsByUserId(
        userInfo.id,
        token,
      );
      for (const account of accounts) {
        await this.dataCenterService.updateAccountStats(
          userInfo.id,
          account.id,
          {
            fansCount: account.fansCount,
            readCount: account.readCount,
            likeCount: account.likeCount,
            collectCount: account.collectCount,
            forwardCount: account.forwardCount,
            commentCount: account.commentCount,
            income: account.income,
          },
        );
      }
    } catch (error) {
      console.error('Failed to sync accounts:', error);
    }
  }

  // 每30分钟同步视频数据
  @Scheduled('*/30 * * * *', 'sync_videos')
  async syncVideos() {
    try {
      const userInfo = await getUserInfo();
      const token = getUserToken();
      if (!userInfo || !token) return;

      const videos = await dataCenterApi.getVideosByUserId(userInfo.id, token);
      for (const video of videos) {
        await this.dataCenterService.updateVideoStats(
          userInfo.id,
          video.id,
          video.accountId,
          {
            readCount: video.readCount,
            likeCount: video.likeCount,
            collectCount: video.collectCount,
            forwardCount: video.forwardCount,
            commentCount: video.commentCount,
            income: video.income,
          },
        );
      }
    } catch (error) {
      console.error('Failed to sync videos:', error);
    }
  }

  // 每30分钟同步账号统计数据
  @Scheduled('*/30 * * * *', 'sync_account_stats')
  async syncAccountStats() {
    try {
      const userInfo = await getUserInfo();
      const token = getUserToken();
      if (!userInfo || !token) return;

      const accounts = await dataCenterApi.getAccountsByUserId(
        userInfo.id,
        token,
      );
      for (const account of accounts) {
        const stats = await dataCenterApi.getAccountStats(
          {
            userId: userInfo.id,
            accountId: account.id,
            videoId: 0,
            type: account.type,
          },
          token,
        );

        if (stats.length > 0) {
          const latestStats = stats[0];
          await this.dataCenterService.updateAccountStats(
            userInfo.id,
            account.id,
            {
              fansCount: latestStats.fansCount,
              readCount: latestStats.readCount,
              likeCount: latestStats.likeCount,
              collectCount: latestStats.collectCount,
              forwardCount: latestStats.forwardCount,
              commentCount: latestStats.commentCount,
              income: latestStats.income,
            },
          );
        }
      }
    } catch (error) {
      console.error('Failed to sync account stats:', error);
    }
  }

  // 每30分钟同步视频统计数据
  @Scheduled('*/30 * * * *', 'sync_video_stats')
  async syncVideoStats() {
    try {
      const userInfo = await getUserInfo();
      const token = getUserToken();
      if (!userInfo || !token) return;

      const videos = await dataCenterApi.getVideosByUserId(userInfo.id, token);
      for (const video of videos) {
        const stats = await dataCenterApi.getVideoStats(
          {
            userId: userInfo.id,
            accountId: video.accountId,
            videoId: video.id,
            type: video.type,
          },
          token,
        );

        if (stats.length > 0) {
          const latestStats = stats[0];
          await this.dataCenterService.updateVideoStats(
            userInfo.id,
            video.id,
            video.accountId,
            {
              readCount: latestStats.readCount,
              likeCount: latestStats.likeCount,
              collectCount: latestStats.collectCount,
              forwardCount: latestStats.forwardCount,
              commentCount: latestStats.commentCount,
              income: latestStats.income,
            },
          );
        }
      }
    } catch (error) {
      console.error('Failed to sync video stats:', error);
    }
  }

  // 更新账号统计数据
  @Icp('ICP_DATA_CENTER_UPDATE_ACCOUNT_STATS')
  async updateAccountStats(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
    stats: Partial<AccountStatsModel>,
  ) {
    const userInfo = await getUserInfo();
    return this.dataCenterService.updateAccountStats(
      userInfo.id,
      accountId,
      stats,
    );
  }

  // 更新视频统计数据
  @Icp('ICP_DATA_CENTER_UPDATE_VIDEO_STATS')
  async updateVideoStats(
    event: Electron.IpcMainInvokeEvent,
    videoId: number,
    accountId: number,
    stats: Partial<VideoStatsModel>,
  ) {
    const userInfo = await getUserInfo();
    return this.dataCenterService.updateVideoStats(
      userInfo.id,
      videoId,
      accountId,
      stats,
    );
  }

  // 获取账号统计历史数据
  @Icp('ICP_DATA_CENTER_GET_ACCOUNT_STATS_HISTORY')
  async getAccountStatsHistory(
    event: Electron.IpcMainInvokeEvent,
    accountId: number,
  ) {
    const userInfo = await getUserInfo();
    return this.dataCenterService.getAccountStatsHistory(
      userInfo.id,
      accountId,
    );
  }

  // 获取视频统计历史数据
  @Icp('ICP_DATA_CENTER_GET_VIDEO_STATS_HISTORY')
  async getVideoStatsHistory(
    event: Electron.IpcMainInvokeEvent,
    videoId: number,
  ) {
    const userInfo = await getUserInfo();
    return this.dataCenterService.getVideoStatsHistory(userInfo.id, videoId);
  }

  // 获取账号统计数据列表
  @Icp('ICP_DATA_CENTER_GET_ACCOUNT_STATS_LIST')
  async getAccountStatsList(
    event: Electron.IpcMainInvokeEvent,
    params: {
      startTime?: string;
      endTime?: string;
      page?: number;
      pageSize?: number;
      accountType?: AccountType;
      accountName?: string;
    },
  ) {
    const userInfo = await getUserInfo();
    const startTime = params.startTime ? new Date(params.startTime) : undefined;
    const endTime = params.endTime ? new Date(params.endTime) : undefined;

    return this.dataCenterService.getAccountStatsList(
      userInfo.id,
      startTime,
      endTime,
      params.page,
      params.pageSize,
      params,
    );
  }

  // 获取视频统计数据列表
  @Icp('ICP_DATA_CENTER_GET_VIDEO_STATS_LIST')
  async getVideoStatsList(
    event: Electron.IpcMainInvokeEvent,
    params: {
      startTime?: string;
      endTime?: string;
      page?: number;
      pageSize?: number;
      accountType?: AccountType;
      accountName?: string;
      videoTitle?: string;
    },
  ) {
    const userInfo = await getUserInfo();
    const startTime = params.startTime ? new Date(params.startTime) : undefined;
    const endTime = params.endTime ? new Date(params.endTime) : undefined;

    return this.dataCenterService.getVideoStatsList(
      userInfo.id,
      startTime,
      endTime,
      params.page,
      params.pageSize,
      params,
    );
  }
}
