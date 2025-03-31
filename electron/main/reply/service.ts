/*
 * @Author: nevin
 * @Date: 2025-01-24 17:10:35
 * @LastEditors: nevin
 * @Description: Reply reply
 */
import { Inject, Injectable } from '../core/decorators';
import PQueue from 'p-queue';
import { AccountModel } from '../../db/models/account';
import platController from '../plat';
import { toolsApi } from '../api/tools';
import { AutoRunService } from '../autoRun/service';
import { AutoRunModel } from '../../db/models/autoRun';
import { sysNotice } from '../../global/notice';
import { AutorReplyCommentScheduleEvent } from '../../../commont/types/reply';
import { Repository } from 'typeorm';
import { ReplyCommentRecordModel } from '../../db/models/replyCommentRecord';
import { AppDataSource } from '../../db';
import { getUserInfo } from '../user/comment';
import { AutoRunRecordStatus } from '../../db/models/autoRunRecord';
import { WorkData } from '../plat/plat.type';
import { GlobleCache } from '../../global/cache';
import { sleep } from '../../util/time';

/**
 * 获取缓存key
 * @param account
 * @returns
 */
function getCacheKey(account: AccountModel) {
  return `OneKeyReplyCommentCacheKey_${account.id}`;
}

@Injectable()
export class ReplyService {
  replyQueue: PQueue;
  private replyCommentRecordRepository: Repository<ReplyCommentRecordModel>;

  constructor() {
    this.replyQueue = new PQueue({ concurrency: 2 });
    this.replyCommentRecordRepository = AppDataSource.getRepository(
      ReplyCommentRecordModel,
    );
  }

  @Inject(AutoRunService)
  private readonly autoRunService!: AutoRunService;

  // 创建评论记录
  async create(
    userId: string,
    account: AccountModel,
    comment: {
      id: string;
      commentContent: string;
      replyContent: string;
    },
  ) {
    return await this.replyCommentRecordRepository.save({
      userId,
      accountId: account.id,
      type: account.type,
      commentId: comment.id + '',
      commentContent: comment.commentContent,
      replyContent: comment.replyContent,
    });
  }

  // 获取平台的评论记录
  async getReplyCommentRecord(
    userId: string,
    account: AccountModel,
    commentId: string,
  ) {
    return await this.replyCommentRecordRepository.findOne({
      where: {
        userId,
        accountId: account.id,
        type: account.type,
        commentId: commentId + '',
      },
    });
  }

  /**
   * 自动一键评论
   * 规则:评论所有的一级评论,已经在评论记录的不评论
   */
  async autorReplyComment(
    account: AccountModel,
    data: WorkData,
    scheduleEvent: (data: {
      tag: AutorReplyCommentScheduleEvent;
      status: -1 | 0 | 1; // -1 错误 0 进行中 1 完成
      data?: any; // 数据
      error?: any;
    }) => void,
  ) {
    const userInfo = getUserInfo();
    // 1. 获取作品的评论列表, 如果返回
    let theHasMore = true;
    let thePcursor = undefined;

    // 设置缓存
    GlobleCache.setCache(getCacheKey(account), data, 60 * 15);

    try {
      scheduleEvent({
        tag: AutorReplyCommentScheduleEvent.Start,
        status: 0,
      });

      while (theHasMore) {
        // 重设缓存时间
        GlobleCache.updateCacheTTL(getCacheKey(account), 60 * 15);

        scheduleEvent({
          tag: AutorReplyCommentScheduleEvent.GetCommentListStart,
          status: 0,
        });
        const {
          list,
          pageInfo: { pcursor, hasMore },
        } = await platController.getCommentList(account, data, thePcursor);

        if (list.length === 0) {
          scheduleEvent({
            tag: AutorReplyCommentScheduleEvent.End,
            status: 0,
          });
          return true;
        }

        scheduleEvent({
          tag: AutorReplyCommentScheduleEvent.GetCommentListEnd,
          status: 0,
        });

        // 2. 循环AI回复评论
        for (const element of list) {
          sleep(5);
          const oldRecord = await this.getReplyCommentRecord(
            userInfo.id,
            account,
            element.commentId,
          );
          if (oldRecord) continue;

          let hadReply = false;
          for (const reply of element.subCommentList) {
            if (account.uid === reply.userId) {
              hadReply = true;
              break;
            }
          }

          if (!hadReply) {
            const aiRes = await toolsApi.aiRecoverReview({
              content: element.content,
            });

            // AI接口错误
            if (!aiRes) {
              scheduleEvent({
                tag: AutorReplyCommentScheduleEvent.Error,
                status: -1,
                error: '未获得AI产出内容',
              });
              return false;
            }

            scheduleEvent({
              tag: AutorReplyCommentScheduleEvent.ReplyCommentStart,
              data: {
                content: element.content,
                aiContent: aiRes,
              },
              status: 0,
            });

            const replyRes = await platController.replyComment(
              account,
              element.commentId,
              aiRes,
              {
                dataId: data.dataId,
                comment: element,
              },
            );

            //  错误处理
            if (!replyRes) {
              scheduleEvent({
                tag: AutorReplyCommentScheduleEvent.ReplyCommentEnd,
                status: -1,
                error: '回复评论失败',
              });
            } else {
              scheduleEvent({
                tag: AutorReplyCommentScheduleEvent.ReplyCommentEnd,
                status: 0,
              });

              // 创建评论记录
              this.create(userInfo.id, account, {
                id: element.commentId,
                commentContent: element.content,
                replyContent: aiRes,
              });
            }
          }
        }

        scheduleEvent({
          tag: AutorReplyCommentScheduleEvent.ReplyCommentEnd,
          status: 0,
        });

        thePcursor = pcursor;
        theHasMore = !!hasMore;

        if (!theHasMore) {
          scheduleEvent({
            tag: AutorReplyCommentScheduleEvent.End,
            status: 0,
          });
          return true;
        }
      }
    } catch (error) {
      scheduleEvent({
        tag: AutorReplyCommentScheduleEvent.Error,
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
    data: WorkData,
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
      this.autorReplyComment(
        account,
        data,
        (e: {
          tag: AutorReplyCommentScheduleEvent;
          status: -1 | 0 | 1;
          error?: any;
        }) => {
          if (e.tag === AutorReplyCommentScheduleEvent.Start) {
            sysNotice('自动机评论回复任务执行开始', `任务ID:${autoRun.id}`);
          }

          if (e.tag === AutorReplyCommentScheduleEvent.End) {
            sysNotice('自动机评论回复任务执行结束', `任务ID:${autoRun.id}`);
            this.autoRunService.updateAutoRunRecordStatus(
              recordData.id,
              AutoRunRecordStatus.SUCCESS,
            );
          }

          if (e.tag === AutorReplyCommentScheduleEvent.Error) {
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
