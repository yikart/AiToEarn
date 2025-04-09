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
import { FindOptionsWhere, Repository } from 'typeorm';
import { AppDataSource } from '../../db';
import { getUserInfo } from '../user/comment';
import { AutoRunRecordStatus } from '../../db/models/autoRunRecord';
import { sleep } from '../../util/time';
import { InteractionRecordModel } from '../../db/models/interactionRecord';
import { AutorWorksInteractionScheduleEvent } from '../../../commont/types/interaction';
import { WorkData } from '../plat/plat.type';
import { AutoInteractionCache } from './cacheData';
import { backPageData, CorrectQuery } from '../../global/table';
import { AccountType } from '../../../commont/AccountEnum';

@Injectable()
export class InteractionService {
  interactionQueue: PQueue;
  private interactionRecordRepository: Repository<InteractionRecordModel>;

  constructor() {
    this.interactionQueue = new PQueue({ concurrency: 1 });
    this.interactionRecordRepository = AppDataSource.getRepository(
      InteractionRecordModel,
    );
  }

  @Inject(AutoRunService)
  private readonly autoRunService!: AutoRunService;

  // 创建互动记录
  async createInteractionRecord(
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
      isCollect: isCollect,
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

  // 获取互动记录列表
  async getInteractionRecordList(
    userId: string,
    page: CorrectQuery,
    query: {
      accountId?: number;
      type?: AccountType;
    },
  ) {
    const filter: FindOptionsWhere<InteractionRecordModel> = {
      userId,
      ...(query.accountId && { accountId: query.accountId }),
      ...(query.type && { type: query.type }),
    };

    const [list, totalCount] =
      await this.interactionRecordRepository.findAndCount({
        where: filter,
      });

    return backPageData(list, totalCount, page);
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
      platform?: string; // 平台ID
      likeProb?: any; // 点赞概率
      collectProb?: any; // 收藏概率
      commentProb?: any; // 评论概率
    },
    scheduleEvent: (data: {
      tag: AutorWorksInteractionScheduleEvent;
      status: -1 | 0 | 1; // -1 错误 0 进行中 1 完成
      data?: any; // 数据
      error?: any;
    }) => void,
  ) {
    // console.log('------ autorInteraction', option);

    // return;

    const userInfo = getUserInfo();

    // 设置缓存
    const cacheData = new AutoInteractionCache({
      title: '互动任务',
    });

    try {
      console.log('------ 开始执行互动任务，作品数量:', worksList.length);
      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.Start,
        status: 0,
      });

      // 1. 循环AI回复评论
      for (const works of worksList) {
        console.log('------ 开始处理作品:', works.dataId);
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
            cacheData.delete();
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
          works.author?.id,
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
          console.log('------ 开始点赞作品:', works.dataId);
          const isLikeRes = await platController.dianzanDyOther(
            account,
            works.dataId,
            {
              authid: works.author?.id,
            },
          );
          isLike = isLikeRes ? 1 : 0;
          console.log('------ 点赞结果:', isLikeRes);
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

        if (option.platform != 'KWAI') {
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
        }

        // 创建互动记录
        this.createInteractionRecord(
          userInfo.id,
          account,
          {
            worksId: works.dataId,
            worksTitle: works.title,
            worksCover: works.coverUrl,
          },
          option.commentContent,
          isLike,
          isCollect, // 收藏状态设为0
        );
        console.log('------ 作品处理完成:', works.dataId);
      }

      console.log('------ 所有作品处理完成');
      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.ReplyCommentEnd,
        status: 0,
      });
    } catch (error) {
      console.error('------ 任务执行出错:', error);
      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.Error,
        status: -1,
        error,
      });
      return false;
    }

    // 清除缓存
    cacheData.delete();
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
    if (AutoInteractionCache.getInfo()) {
      sysNotice('请勿重复执行', `有正在执行的任务,任务ID:${autoRun.id}`);

      return {
        status: 0,
        message: '有正在执行的任务,请勿重复执行',
      };
    }

    // 创建任务执行记录
    const recordData = await this.autoRunService.createAutoRunRecord(autoRun);

    // 添加到队列
    this.interactionQueue.add(() => {
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
            sysNotice('自动互动任务执行开始', `任务ID:${autoRun.id}`);
          }

          if (e.tag === AutorWorksInteractionScheduleEvent.End) {
            sysNotice('自动互动任务执行结束', `任务ID:${autoRun.id}`);
            this.autoRunService.updateAutoRunRecordStatus(
              recordData.id,
              AutoRunRecordStatus.SUCCESS,
            );
          }

          if (e.tag === AutorWorksInteractionScheduleEvent.Error) {
            sysNotice('自动互动回复任务-错误!!!', `任务ID:${autoRun.id}`);
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
