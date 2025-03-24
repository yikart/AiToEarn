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
import { AutorReplyCommentScheduleEvent } from './comment';
import { AutoRunService } from '../autoRun/service';
import { AutoRunModel } from '../../db/models/autoRun';

@Injectable()
export class ReplyService {
  replyQueue: PQueue;
  constructor() {
    this.replyQueue = new PQueue({ concurrency: 2 });
  }

  @Inject(AutoRunService)
  private readonly autoRunService!: AutoRunService;

  /**
   * 自动一键评论
   * 规则:评论所有的一级评论,已有自己的评论的不评论
   */
  async autorReplyComment(
    account: AccountModel,
    dataId: string,
    scheduleEvent: (data: {
      tag: AutorReplyCommentScheduleEvent;
      status: -1 | 0 | 1;
      error?: any;
    }) => void,
  ) {
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
          status: 1,
        });
        const {
          list,
          pageInfo: { pcursor, hasMore },
        } = await platController.getCommentList(account, dataId, thePcursor);

        scheduleEvent({
          tag: AutorReplyCommentScheduleEvent.GetCommentListEnd,
          status: 0,
        });

        if (list.length === 0) {
          scheduleEvent({
            tag: AutorReplyCommentScheduleEvent.End,
            status: 0,
          });
          return true;
        }

        scheduleEvent({
          tag: AutorReplyCommentScheduleEvent.ReplyCommentStart,
          status: 0,
        });

        // 2. 循环AI回复评论
        for (const element of list) {
          const aiRes = await toolsApi.aiRecoverReview({
            content: element.content,
          });

          if (account.uid !== element.userId) {
            let hadReply = false;
            for (const reply of element.subCommentList) {
              if (account.uid === reply.userId) {
                hadReply = true;
                break;
              }
            }

            if (!hadReply) {
              platController.replyComment(account, element.commentId, aiRes, {
                dataId,
                comment: element,
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
        },
      );
    });
  }
}
