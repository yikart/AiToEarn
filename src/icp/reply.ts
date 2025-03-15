/*
 * @Author: nevin
 * @Date: 2025-01-23 15:48:14
 * @LastEditTime: 2025-02-14 22:36:25
 * @LastEditors: nevin
 * @Description:
 */
export type WorkData = {
  dataId: string;
  readCount?: number;
  likeCount?: number;
  collectCount?: number;
  forwardCount?: number;
  commentCount?: number; // 评论数量
  income?: number;
  title?: string;
  desc?: string;
  coverUrl?: string;
  videoUrl?: string;
};

export type CommentData = {
  dataId: string;
  commentId: string;
  parentCommentId?: string; // 上级评论ID
  content: string;
  likeCount?: number; // 点赞次数
  nikeName?: string;
  headUrl?: string;
  data: any; // 原数据
};

export enum PageType {
  paging = 'paging',
  cursor = 'cursor',
}

/**
 * 获取作品列表
 */
export async function icpCreatorList(
  accountId: number,
  pageInfo: {
    pageNo?: number;
    pageSize?: number;
    pcursor?: string; // 分页游标
  },
) {
  const res: {
    list: WorkData[];
    pageInfo: {
      pageType: PageType;
      count?: number;
      hasMore?: boolean;
      pcursor?: string;
    };
  } = await window.ipcRenderer.invoke('ICP_CREATOR_LIST', accountId, pageInfo);
  return res;
}

/**
 * 获取评论列表
 */
export async function icpGetCommentList(
  accountId: number,
  dataId: string,
  pageInfo: {
    pageNo?: number;
    pageSize?: number;
    pcursor?: string;
  },
) {
  const res: {
    list: CommentData[];
    pageInfo: {
      pageType: PageType;
      count?: number;
      hasMore?: boolean;
      pcursor?: string;
    };
  } = await window.ipcRenderer.invoke('ICP_COMMENT_LIST', accountId, dataId);
  return res;
}

/**
 * 创建评论
 */
export async function icpCreateComment(
  accountId: number,
  dataId: string,
  content: string,
) {
  const res: boolean = await window.ipcRenderer.invoke(
    'ICP_CREATE_COMMENT',
    accountId,
    dataId,
    content,
  );
  return res;
}

/**
 * 回复评论
 */
export async function icpReplyComment(
  accountId: number,
  commentId: string,
  content: string,
  option: {
    dataId?: string; // 作品ID
    data: any; // 辅助数据,原数据
  },
) {
  const res: boolean = await window.ipcRenderer.invoke(
    'ICP_REPLY_COMMENT',
    accountId,
    commentId,
    content,
    option,
  );
  return res;
}
