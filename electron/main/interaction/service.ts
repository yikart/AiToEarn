/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: interactionRecord InteractionRecord
 */
import { Inject, Injectable } from '../core/decorators';
import PQueue from 'p-queue';
import { AccountModel } from '../../db/models/account';
import platController from '../plat';
import { toolsApi } from '../api/tools';
import { AutoRunService } from '../autoRun/service';
import { AutoRunModel } from '../../db/models/autoRun';
import { sysNotice } from '../../global/notice';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../db';
import { getUserInfo } from '../user/comment';
import { AutoRunRecordStatus } from '../../db/models/autoRunRecord';
import { GlobleCache } from '../../global/cache';
import { sleep } from '../../util/time';
import { InteractionRecordModel } from '../../db/models/interactionRecord';
import { AutorWorksInteractionScheduleEvent } from '../../../commont/types/interaction';
import { WorkData } from '../plat/plat.type';

/**
 * 获取缓存key
 * @param account
 * @returns
 */
function getCacheKey(account?: AccountModel) {
  return `OneKeyInteractionWorksCacheKey_${account?.id || 0}`;
}

@Injectable()
export class InteractionService {
  replyQueue: PQueue;
  private interactionRecordRepository: Repository<InteractionRecordModel>;

  constructor() {
    this.replyQueue = new PQueue({ concurrency: 2 });
    this.interactionRecordRepository = AppDataSource.getRepository(
      InteractionRecordModel,
    );
  }

  @Inject(AutoRunService)
  private readonly autoRunService!: AutoRunService;

  // 创建评论记录
  async create(
    userId: string,
    account: AccountModel,
    works: {
      worksId: string;
      worksTitle?: string;
      worksCover?: string;
    },
    commentContent: string,
    isLike: 0 | 1,
    isCollect: 0 | 1,
  ) {
    return await this.interactionRecordRepository.save({
      userId,
      accountId: account.id,
      type: account.type,
      worksId: works.worksId,
      worksTitle: works.worksTitle,
      worksCover: works.worksCover,
      commentContent,
      isLike: isLike,
      replyContent: isCollect,
    });
  }

  // 获互动记录
  async getInteractionRecord(
    userId: string,
    account: AccountModel,
    worksId: string,
  ) {
    return await this.interactionRecordRepository.findOne({
      where: {
        userId,
        accountId: account.id,
        type: account.type,
        worksId: worksId + '',
      },
    });
  }

  /**
   * 互动:作品评论,收藏,点赞
   */
  async interactionOneData(
    account: AccountModel,
    works: WorkData,
    option: {
      commentContent: string; // 评论内容
    },
    scheduleEvent: (data: {
      tag: AutorWorksInteractionScheduleEvent;
      status: -1 | 0 | 1; // -1 错误 0 进行中 1 完成
      data?: any; // 数据
      error?: any;
    }) => void,
  ) {
    const userInfo = getUserInfo();
    if (GlobleCache.getCache(getCacheKey(account))) {
      sysNotice('请勿重复执行', `该账户有正在执行的任务`);
      return false;
    }

    try {
      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.Start,
        status: 0,
      });

      // 重设缓存时间
      GlobleCache.updateCacheTTL(getCacheKey(account), 60 * 15);

      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.GetCommentListStart,
        status: 0,
      });

      // 历史记录
      const oldRecord = await this.getInteractionRecord(
        userInfo.id,
        account,
        works.dataId,
      );
      if (oldRecord) return false;

      if (!option.commentContent) {
        const aiRes = await toolsApi.aiRecoverReview({
          content: (works.desc || '') + (works.title || ''),
        });

        // AI接口错误
        if (!aiRes) {
          scheduleEvent({
            tag: AutorWorksInteractionScheduleEvent.Error,
            status: -1,
            error: '未获得AI产出内容',
          });
          return false;
        }

        option.commentContent = aiRes;
      }

      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.ReplyCommentStart,
        data: {
          aiContent: option.commentContent,
        },
        status: 0,
      });

      // ----- 1-评论作品 -----
      const commentWorksRes = await platController.createCommentByOther(
        account,
        works.dataId,
        option.commentContent,
      );

      //  错误处理
      if (!commentWorksRes) {
        scheduleEvent({
          tag: AutorWorksInteractionScheduleEvent.ReplyCommentEnd,
          status: -1,
          error: '回复评论失败',
        });
      }

      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.ReplyCommentEnd,
        status: 0,
      });

      // ----- 2-点赞作品 -----
      let isLike: 0 | 1 = 0;
      try {
        const isLikeRes = await platController.dianzanDyOther(
          account,
          works.dataId,
        );
        isLike = isLikeRes ? 1 : 0;
      } catch (error) {
        scheduleEvent({
          tag: AutorWorksInteractionScheduleEvent.Error,
          status: 0,
          error,
          data: {
            isLike,
          },
        });
      }

      // ----- 3-收藏作品 -----
      let isCollect: 0 | 1 = 0;
      try {
        const isCollectRes = await platController.shoucangDyOther(
          account,
          works.dataId,
        );
        isCollect = isCollectRes ? 1 : 0;
      } catch (error) {
        scheduleEvent({
          tag: AutorWorksInteractionScheduleEvent.Error,
          status: 0,
          error,
          data: {
            isLike,
          },
        });
      }

      // 创建评论记录
      this.create(
        userInfo.id,
        account,
        {
          worksId: works.dataId,
          worksTitle: works.title,
          worksCover: works.coverUrl,
        },
        option.commentContent,
        isLike,
        isCollect,
      );

      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.ReplyCommentEnd,
        status: 0,
      });
    } catch (error) {
      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.Error,
        status: -1,
        error,
      });
      return false;
    }
  }

  /**
   * 自动一键互动:作品评论,收藏,点赞
   * 规则:评论作品,已经评论不评论
   */
  async autorInteraction(
    account: AccountModel,
    worksList: WorkData[],
    option: {
      commentContent: string; // 评论内容
    },
    scheduleEvent: (data: {
      tag: AutorWorksInteractionScheduleEvent;
      status: -1 | 0 | 1; // -1 错误 0 进行中 1 完成
      data?: any; // 数据
      error?: any;
    }) => void,
  ) {
    const userInfo = getUserInfo();
    // 设置缓存
    GlobleCache.setCache(getCacheKey(account), worksList, 60 * 15);

    try {
      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.Start,
        status: 0,
      });

      // 重设缓存时间
      GlobleCache.updateCacheTTL(getCacheKey(account), 60 * 15);

      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.GetCommentListStart,
        status: 0,
      });

      // 2. 循环AI回复评论
      for (const works of worksList) {
        sleep(5);
        const oldRecord = await this.getInteractionRecord(
          userInfo.id,
          account,
          works.dataId,
        );
        if (oldRecord) continue;

        if (!option.commentContent) {
          const aiRes = await toolsApi.aiRecoverReview({
            content: (works.desc || '') + (works.title || ''),
          });

          // AI接口错误
          if (!aiRes) {
            scheduleEvent({
              tag: AutorWorksInteractionScheduleEvent.Error,
              status: -1,
              error: '未获得AI产出内容',
            });
            return false;
          }

          option.commentContent = aiRes;
        }

        scheduleEvent({
          tag: AutorWorksInteractionScheduleEvent.ReplyCommentStart,
          data: {
            aiContent: option.commentContent,
          },
          status: 0,
        });

        // ----- 1-评论作品 -----
        const commentWorksRes = await platController.createCommentByOther(
          account,
          works.dataId,
          option.commentContent,
        );

        //  错误处理
        if (!commentWorksRes) {
          scheduleEvent({
            tag: AutorWorksInteractionScheduleEvent.ReplyCommentEnd,
            status: -1,
            error: '回复评论失败',
          });
          continue;
        }

        scheduleEvent({
          tag: AutorWorksInteractionScheduleEvent.ReplyCommentEnd,
          status: 0,
        });

        // ----- 2-点赞作品 -----
        let isLike: 0 | 1 = 0;
        try {
          const isLikeRes = await platController.dianzanDyOther(
            account,
            works.dataId,
          );
          isLike = isLikeRes ? 1 : 0;
        } catch (error) {
          scheduleEvent({
            tag: AutorWorksInteractionScheduleEvent.Error,
            status: 0,
            error,
            data: {
              isLike,
            },
          });
        }

        // ----- 3-收藏作品 -----
        let isCollect: 0 | 1 = 0;
        try {
          const isCollectRes = await platController.shoucangDyOther(
            account,
            works.dataId,
          );
          isCollect = isCollectRes ? 1 : 0;
        } catch (error) {
          scheduleEvent({
            tag: AutorWorksInteractionScheduleEvent.Error,
            status: 0,
            error,
            data: {
              isLike,
            },
          });
        }

        // 创建评论记录
        this.create(
          userInfo.id,
          account,
          {
            worksId: works.dataId,
            worksTitle: works.title,
            worksCover: works.coverUrl,
          },
          option.commentContent,
          isLike,
          isCollect,
        );
      }

      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.ReplyCommentEnd,
        status: 0,
      });
    } catch (error) {
      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.Error,
        status: -1,
        error,
      });
      return false;
    }

    // 清除缓存
    GlobleCache.delCache(getCacheKey(account));
  }

  /**
   * 添加作品回复评论的任务到队列
   * @param account
   * @param dataId
   */
  async addReplyQueue(
    account: AccountModel,
    worksList: WorkData[],
    option: {
      commentContent: string; // 评论内容
    },
    autoRun: AutoRunModel,
  ): Promise<{
    status: 0 | 1;
    message?: string;
  }> {
    // 查看缓存,有的就不执行
    if (GlobleCache.getCache(getCacheKey(account))) {
      sysNotice('请勿重复执行', `该账户有正在执行的任务,任务ID:${autoRun.id}`);

      return {
        status: 0,
        message: '该账户有正在执行的任务,请勿重复执行',
      };
    }

    // 创建任务执行记录
    const recordData = await this.autoRunService.createAutoRunRecord(autoRun);

    // 添加到队列
    this.replyQueue.add(() => {
      this.autorInteraction(
        account,
        worksList,
        option,
        (e: {
          tag: AutorWorksInteractionScheduleEvent;
          status: -1 | 0 | 1;
          error?: any;
        }) => {
          if (e.tag === AutorWorksInteractionScheduleEvent.Start) {
            sysNotice('自动机评论回复任务执行开始', `任务ID:${autoRun.id}`);
          }

          if (e.tag === AutorWorksInteractionScheduleEvent.End) {
            sysNotice('自动机评论回复任务执行结束', `任务ID:${autoRun.id}`);
            this.autoRunService.updateAutoRunRecordStatus(
              recordData.id,
              AutoRunRecordStatus.SUCCESS,
            );
          }

          if (e.tag === AutorWorksInteractionScheduleEvent.Error) {
            sysNotice('自动机评论回复任务-错误!!!', `任务ID:${autoRun.id}`);
            this.autoRunService.updateAutoRunRecordStatus(
              recordData.id,
              AutoRunRecordStatus.FAIL,
            );
          }
        },
      );
    });

    return {
      status: 1,
    };
  }
}
