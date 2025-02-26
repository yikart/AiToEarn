import { AppDataSource } from '../../db';
import { Injectable } from '../core/decorators';
import { Repository } from 'typeorm';
import { AccountStatsModel } from '../../db/models/accountStats';
import { VideoStatsModel } from '../../db/models/videoStats';
import { AccountModel } from '../../db/models/account';
import { VideoModel } from '../../db/models/video';
import { AccountType } from '../../../commont/AccountEnum';

@Injectable()
export class DataCenterService {
  private accountStatsRepository: Repository<AccountStatsModel>;
  private videoStatsRepository: Repository<VideoStatsModel>;
  private accountRepository: Repository<AccountModel>;
  private videoRepository: Repository<VideoModel>;

  constructor() {
    this.accountStatsRepository =
      AppDataSource.getRepository(AccountStatsModel);
    this.videoStatsRepository = AppDataSource.getRepository(VideoStatsModel);
    this.accountRepository = AppDataSource.getRepository(AccountModel);
    this.videoRepository = AppDataSource.getRepository(VideoModel);
  }

  // 更新账号统计数据
  async updateAccountStats(
    userId: string,
    accountId: number,
    stats: Partial<AccountStatsModel>,
  ) {
    // 创建统计记录
    const accountStats = this.accountStatsRepository.create({
      userId,
      accountId,
      ...stats,
    });
    await this.accountStatsRepository.save(accountStats);

    // 更新账号总统计数据
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (account) {
      account.fansCount = stats.fansCount ?? account.fansCount;
      account.readCount = (account.readCount || 0) + (stats.readCount || 0);
      account.likeCount = (account.likeCount || 0) + (stats.likeCount || 0);
      account.collectCount =
        (account.collectCount || 0) + (stats.collectCount || 0);
      account.forwardCount =
        (account.forwardCount || 0) + (stats.forwardCount || 0);
      account.commentCount =
        (account.commentCount || 0) + (stats.commentCount || 0);
      account.income = (account.income || 0) + (stats.income || 0);
      account.lastStatsTime = new Date();
      await this.accountRepository.save(account);
    }
  }

  // 更新视频统计数据
  async updateVideoStats(
    userId: string,
    videoId: number,
    accountId: number,
    stats: Partial<VideoStatsModel>,
  ) {
    // 创建视频统计记录
    const videoStats = this.videoStatsRepository.create({
      userId,
      videoId,
      accountId,
      ...stats,
    });
    await this.videoStatsRepository.save(videoStats);

    // 更新视频总统计数据
    const video = await this.videoRepository.findOne({
      where: { id: videoId },
    });
    if (video) {
      video.readCount = (video.readCount || 0) + (stats.readCount || 0);
      video.likeCount = (video.likeCount || 0) + (stats.likeCount || 0);
      video.commentCount =
        (video.commentCount || 0) + (stats.commentCount || 0);
      video.collectCount =
        (video.collectCount || 0) + (stats.collectCount || 0);
      video.forwardCount =
        (video.forwardCount || 0) + (stats.forwardCount || 0);
      video.income = (video.income || 0) + (stats.income || 0);
      video.lastStatsTime = new Date();
      await this.videoRepository.save(video);

      // 同步更新账号统计数据
      const accountStats = this.accountStatsRepository.create({
        userId,
        accountId,
        readCount: stats.readCount || 0,
        likeCount: stats.likeCount || 0,
        collectCount: stats.collectCount || 0,
        forwardCount: stats.forwardCount || 0,
        commentCount: stats.commentCount || 0,
        income: stats.income || 0,
      });
      await this.accountStatsRepository.save(accountStats);

      // 更新账号总统计数据
      const account = await this.accountRepository.findOne({
        where: { id: accountId },
      });
      if (account) {
        account.readCount = (account.readCount || 0) + (stats.readCount || 0);
        account.likeCount = (account.likeCount || 0) + (stats.likeCount || 0);
        account.collectCount =
          (account.collectCount || 0) + (stats.collectCount || 0);
        account.forwardCount =
          (account.forwardCount || 0) + (stats.forwardCount || 0);
        account.commentCount =
          (account.commentCount || 0) + (stats.commentCount || 0);
        account.income = (account.income || 0) + (stats.income || 0);
        account.lastStatsTime = new Date();
        await this.accountRepository.save(account);
      }
    }
  }

  // 获取账号统计历史数据
  async getAccountStatsHistory(userId: string, accountId: number) {
    return this.accountStatsRepository.find({
      where: { userId, accountId },
      order: { id: 'DESC' },
    });
  }

  // 获取视频统计历史数据
  async getVideoStatsHistory(userId: string, videoId: number) {
    return this.videoStatsRepository.find({
      where: { userId, videoId },
      order: { id: 'DESC' },
    });
  }

  // 获取账号统计数据列表
  async getAccountStatsList(
    userId: string,
    startTime?: Date,
    endTime?: Date,
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      accountType?: AccountType;
      accountName?: string;
    },
  ) {
    const qb = this.accountStatsRepository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.account', 'account')
      .where('stats.userId = :userId', { userId });

    if (startTime && endTime) {
      qb.andWhere('stats.createdAt BETWEEN :startTime AND :endTime', {
        startTime,
        endTime,
      });
    }

    if (filters?.accountType) {
      qb.andWhere('account.type = :accountType', {
        accountType: filters.accountType,
      });
    }

    if (filters?.accountName) {
      qb.andWhere(
        '(account.nickname LIKE :name OR account.account LIKE :name)',
        { name: `%${filters.accountName}%` },
      );
    }

    const [items, total] = await qb
      .orderBy('stats.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取视频统计数据列表
  async getVideoStatsList(
    userId: string,
    startTime?: Date,
    endTime?: Date,
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      accountType?: AccountType;
      accountName?: string;
      videoTitle?: string;
    },
  ) {
    const qb = this.videoStatsRepository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.video', 'video')
      .leftJoinAndSelect('video.account', 'account')
      .where('stats.userId = :userId', { userId });

    if (startTime && endTime) {
      qb.andWhere('stats.createdAt BETWEEN :startTime AND :endTime', {
        startTime,
        endTime,
      });
    }

    if (filters?.accountType) {
      qb.andWhere('account.type = :accountType', {
        accountType: filters.accountType,
      });
    }

    if (filters?.accountName) {
      qb.andWhere(
        '(account.nickname LIKE :name OR account.account LIKE :name)',
        { name: `%${filters.accountName}%` },
      );
    }

    if (filters?.videoTitle) {
      qb.andWhere('video.title LIKE :title', {
        title: `%${filters.videoTitle}%`,
      });
    }

    const [items, total] = await qb
      .orderBy('stats.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
