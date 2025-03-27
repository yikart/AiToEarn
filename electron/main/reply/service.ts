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
    dataId: string,
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

    try {
      scheduleEvent({
        tag: AutorReplyCommentScheduleEvent.Start,
        status: 0,
      });

      while (theHasMore) {
        scheduleEvent({
          tag: AutorReplyCommentScheduleEvent.GetCommentListStart,
          status: 0,
        });
        const {
          list,
          pageInfo: { pcursor, hasMore },
        } = await platController.getCommentList(account, dataId, thePcursor);

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
                dataId,
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
  }

  /**
   * 添加作品回复评论的任务到队列
   * @param account
   * @param dataId
   */
  addReplyQueue(account: AccountModel, dataId: string, autoRun: AutoRunModel) {
    this.replyQueue.add(() => {
      this.autorReplyComment(
        account,
        dataId,
        (e: {
          tag: AutorReplyCommentScheduleEvent;
          status: -1 | 0 | 1;
          error?: any;
        }) => {
          this.autoRunService.sendAutoRunProgress(
            autoRun.id,
            e.status,
            e.error,
          );

          sysNotice(
            '评论回复任务执行',
            `评论回复任务执行--${e.tag}--${e.status}`,
          );
        },
      );
    });
  }
}
