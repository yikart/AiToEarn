/*
 * @Author: nevin
 * @Date: 2025-01-23 15:48:14
 * @LastEditTime: 2025-03-20 22:39:03
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
  subCommentList: CommentData[]; // 子数据
};

export enum PageType {
  paging = 'paging',
  cursor = 'cursor',
}

/**
 * 点赞作品
 */
export async function icpDianzanDyOther(accountId: number, dataId: string) {
  const res: any = await window.ipcRenderer.invoke(
    'ICP_DIANZAN_DY_OTHER',
    accountId,
    dataId,
  );
  return res;
}

/**
 * 收藏作品
 */
export async function icpShoucangDyOther(accountId: number, dataId: string) {
  const res: any = await window.ipcRenderer.invoke(
    'ICP_SHOUCANG_DY_OTHER',
    accountId,
    dataId,
  );
  return res;
}

/**
 * 获取作品列表
 */
export async function icpCreatorList(accountId: number, pcursor?: string) {
  const res: {
    list: WorkData[];
    pageInfo: {
      pageType: PageType;
      count?: number;
      hasMore?: boolean;
      pcursor?: string;
    };
  } = await window.ipcRenderer.invoke('ICP_CREATOR_LIST', accountId, pcursor);
  return res;
}

/**
 * 获取评论列表
 */
export async function icpGetCommentListByOther(
  accountId: number,
  dataId: string,
  pcursor?: string,
) {
  const res: {
    list: CommentData[];
    pageInfo: {
      count?: number;
      hasMore: boolean;
      pcursor?: string;
    };
  } = await window.ipcRenderer.invoke(
    'ICP_COMMENT_LIST_BY_OTHER',
    accountId,
    dataId,
    pcursor,
  );
  return res;
}

/**
 * 获取二级评论列表
 */
export async function icpGetSecondCommentListByOther(
  accountId: number,
  dataId: string,
  root_comment_id: string,
  pcursor?: string,
) {
  const res: any = await window.ipcRenderer.invoke(
    'ICP_SECOND_COMMENT_LIST_BY_OTHER',
    accountId,
    dataId,
    root_comment_id,
    pcursor,
  );
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
  const res: any = await window.ipcRenderer.invoke(
    'ICP_CREATE_COMMENT_BY_OTHER',
    accountId,
    dataId,
    content,
  );
  return res;
}

/**
 * 回复评论
 */
export async function icpReplyCommentByOther(
  accountId: number,
  commentId: string,
  content: string,
  option: {
    dataId?: string; // 作品ID
    comment: any; // 辅助数据,原数据
  },
) {
  const res: boolean = await window.ipcRenderer.invoke(
    'ICP_REPLY_COMMENT_BY_OTHER',
    accountId,
    commentId,
    content,
    option,
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
    comment: any; // 辅助数据,原数据
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

/**
 * 一键作品回复评论
 */
export async function icpCreateCommentList(accountId: number, dataId: string) {
  const res: boolean = await window.ipcRenderer.invoke(
    'ICP_REPLY_COMMENT_LIST_BY_AI',
    accountId,
    dataId,
  );
  return res;
}

/**
 * 创建一键回复自动进程
 * @param data
 */
export async function ipcCreateAutoRunOfReply(
  accountId: number,
  dataId: string, // 作品ID
  cycleType: string,
) {
  const res: string = await window.ipcRenderer.invoke(
    'ICP_AUTO_RUN_CREATE_REPLY',
    accountId,
    dataId,
    cycleType,
  );
  return res;
}
