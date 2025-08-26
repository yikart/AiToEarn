import { Account } from '@/libs/database/schema/account.schema';
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema';

export abstract class InteracteBase {
  // 添加作品评论
  abstract addArcComment(
    account: Account,
    dataId: string,
    content: string,
  ): Promise<boolean>;

  // 获取作品的评论列表
  abstract getArcCommentList(
    publishRecord: PublishRecord,
    query: {
      pageNo: number;
      pageSize: number;
    },
  ): Promise<{ list: any[]; total: number }>;

  // 回复评论
  abstract replyComment(
    accountId: string,
    commentId: string,
    content: string,
  ): Promise<boolean>;

  // 删除评论
  abstract delComment(accountId: string, commentId: string): Promise<boolean>;
}
