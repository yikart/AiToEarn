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
import { PlatType } from '../../../commont/AccountEnum';
import { AccountService } from '../account/service';
import { UserService } from '../user/service';
// import { ReplyController } from '../reply/controller';


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
    commentRemark: string,
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
      commentRemark,
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
      type?: PlatType;
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
        order: {
          createTime: 'DESC',
        },
      });

    return backPageData(list, totalCount, page);
  }

  /**
   * 自动AI评论截流:作品评论,收藏,点赞
   * 规则:评论作品,已经评论不评论
   */
  async autorInteraction(
    account: AccountModel,
    worksList: WorkData[],
    option: {
      commentContent?: string; // 评论内容
      taskId?: string; // 任务ID
      platform?: string; // 平台ID
      likeProb?: any; // 点赞概率
      collectProb?: any; // 收藏概率
      commentProb?: any; // 评论概率
      commentType: any; // 评论类型
    },
    scheduleEvent: (data: {
      tag: AutorWorksInteractionScheduleEvent;
      status: -1 | 0 | 1; // -1 错误 0 进行中 1 完成
      data?: any; // 数据
      error?: any;
    }) => void,
  ) {
    const commentContentList = option.commentContent
      ? option.commentContent.split(',')
      : [];
    console.log('------ commentContentList ----', commentContentList);
    // return;

    const userInfo = getUserInfo();

    // 设置缓存
    const cacheData = new AutoInteractionCache({
      title: '互动任务',
    });

    try {
      console.log(
        '------ 开始执行互动任务，作品数量:',
        worksList.length,
        worksList[0],
      );
      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.Start,
        status: 0,
      });

      // 1. 循环AI回复评论
      let i = 0;
      for (const works of worksList) {
        // console.log('------ 开始处理作品:', works);
        // 等待
        if (i > 0) await sleep(10 * 1000);
        i++;
        const oldRecord = await this.getInteractionRecord(
          userInfo.id,
          account,
          works.dataId,
        );
        if (oldRecord) continue;

        // console.log('option.commentContent', option);
        let thisCommentContent = '';
        if (option.commentType && option.commentType == 'ai') {
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

          thisCommentContent = aiRes;
        }

        if (option.commentType && option.commentType == 'copy') {
          const commentList = await platController.getCommentList(
            account,
            {
              dataId: works.dataId,
              option: {
                xsec_token: works.data?.xsec_token || '',
              },
            },
            '0',
          );

          // console.log('------ commentList', commentList);

          const randomIndex = Math.floor(
            Math.random() * commentList.list.length,
          );
          thisCommentContent = commentList.list[randomIndex].content;

          // option.commentContent = aiRes;
        }

        console.log('------ option.commentType', option.commentType);
        if (option.commentType && option.commentType == 'custom') {
          // let commentContentList = option.commentContent.split(',');
          console.log('------ commentContentList', commentContentList);
          const randomIndex = Math.floor(
            Math.random() * commentContentList.length,
          );
          console.log('------ randomIndex', randomIndex);
          thisCommentContent = commentContentList[randomIndex];
        }
        console.log('------ option.commentContent', thisCommentContent);
        // return;

        scheduleEvent({
          tag: AutorWorksInteractionScheduleEvent.ReplyCommentStart,
          data: {
            aiContent: thisCommentContent,
          },
          status: 0,
        });

        // ----- 1-评论作品 -----
        console.log(
          '------ 开始评论作品:',
          works.dataId,
          thisCommentContent,
          works.author?.id,
        );

        // 判断是否执行评论
        const shouldComment =
          option.commentProb === 0
            ? false
            : !option.commentProb || Math.random() * 100 < option.commentProb;
        let commentWorksRes: any = {};

        if (shouldComment) {
          // if (option.commentContent.includes(',')) {
          //   const randomIndex = Math.floor(
          //     Math.random() * option.commentContent.split(',').length,
          //   );
          //   option.commentContent =
          //     option.commentContent.split(',')[randomIndex];
          // }

          console.log('------ option.commentContent', thisCommentContent);

          commentWorksRes = await platController.createCommentByOther(
            account,
            works.dataId,
            thisCommentContent,
            works.author?.id,
          );
          console.log('------ 评论作品结果:', commentWorksRes);

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
        }

        // ----- 2-点赞作品 -----
        let isLike: 0 | 1 = 0;
        // 判断是否执行点赞
        const randomLike = Math.random() * 100;
        console.log(
          '判断是否执行点赞',
          '概率:',
          option.likeProb,
          '随机值:',
          randomLike,
        );
        const shouldLike =
          option.likeProb === 0
            ? false
            : !option.likeProb || randomLike < option.likeProb;

        console.log('------ shouldLike', shouldLike);

        if (shouldLike) {
          try {
            console.log('------ 开始点赞作品:', works.dataId, works.author?.id);
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
        }

        // ----- 3-收藏作品 -----
        let isCollect: 0 | 1 = 0;

        // 判断是否执行收藏
        const randomCollect = Math.random() * 100;
        console.log(
          '判断是否执行收藏',
          '概率:',
          option.collectProb,
          '随机值:',
          randomCollect,
        );
        const shouldCollect =
          (option.collectProb === 0
            ? false
            : !option.collectProb || randomCollect < option.collectProb) &&
          option.platform != 'KWAI';

        if (shouldCollect) {
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

        let commentRemark = '';
        if (commentWorksRes.data) {
          if (commentWorksRes.data?.msg) {
            commentRemark = commentWorksRes.data.msg;
          } else {
            commentRemark = commentWorksRes.data.toast;
          }
        } else {
          commentRemark = '评论完成';
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
          commentRemark,
          thisCommentContent,
          isLike,
          isCollect, // 收藏状态设为0
        );
        console.log('------ 作品处理完成:', works.dataId);
      }

      console.log('------ 所有作品处理完成');
      scheduleEvent({
        tag: AutorWorksInteractionScheduleEvent.ReplyCommentEnd,
        status: 1,
      });

      return true;
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
        option as any,
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

  // 自动互动
  @Inject(UserService)
  private readonly userService!: UserService;
  @Inject(AccountService)
  private readonly accountService!: AccountService;

  // 获取自动互动列表
  async getAutorInteractionList(account: any, worksList: any, option: any) {
    console.log('------ server option.commentContent ----', option.commentContent);
    return await this.autorInteraction( 
        account,
        worksList,  
        {
            commentContent: option.commentContent || null, 
            platform: option.accountType, // 平台
            likeProb: 999, // 点赞概率
            collectProb: 999, // 收藏概率
            commentProb: 999, // 评论概率
            commentType: option.commentContent?'custom' : 'ai', // 评论类型
        },
        (e: {
          tag: AutorWorksInteractionScheduleEvent;
          status: -1 | 0 | 1;
          error?: any;
        }) => {
          console.log('------ e', e);
        },
    );
  }
}
