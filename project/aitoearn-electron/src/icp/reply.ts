import { PlatType } from '@@/AccountEnum';

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
  option?: {
    xsec_token: string;
  };
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

/**
 * 获取作品列表
 */
export async function icpCreatorList(accountId: number, pcursor?: string) {
  const res: {
    list: WorkData[];
    pageInfo: {
      count: number;
      hasMore: boolean;
      pcursor?: string;
    };
  } = await window.ipcRenderer.invoke('ICP_CREATOR_LIST', accountId, pcursor);
  return res;
}

/**
 * 获取评论列表
 */
export async function icpGetCommentList(
  accountId: number,
  data: WorkData,
  pcursor?: string,
) {
  const res: {
    list: CommentData[];
    pageInfo: {
      count: number;
      hasMore: boolean;
      pcursor?: string;
    };
  } = await window.ipcRenderer.invoke(
    'ICP_COMMENT_LIST',
    accountId,
    data,
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
export async function icpReplyCommentList(accountId: number, data: WorkData) {
  const res: boolean = await window.ipcRenderer.invoke(
    'ICP_REPLY_COMMENT_LIST_BY_AI',
    accountId,
    data,
  );
  return res;
}

/**
 * 创建一键回复自动进程
 * @param data
 */
export async function ipcCreateAutoRunOfReply(
  accountId: number,
  data: WorkData, // 作品ID
  cycleType: string,
) {
  const res: string = await window.ipcRenderer.invoke(
    'ICP_AUTO_RUN_CREATE_REPLY',
    accountId,
    data,
    cycleType,
  );
  return res;
}

export enum AutorReplyCacheStatus {
  DOING = 0,
  DONE = 1,
  REEOR = 2,
}
/**
 * 获取一键回复的进程信息
 * @returns
 */
export async function ipcGetAutoRunOfReplyInfo() {
  const res: {
    status: AutorReplyCacheStatus;
    message: string;
    createTime?: number;
    updateTime?: number;
    title: string;
    dataId?: string;
  } = await window.ipcRenderer.invoke('ICP_GET_AUTO_REPLY_INFO');
  return res;
}

/**
 * 获取AI评论截流的记录列表
 * @param page
 * @param query
 */
export async function ipcGetReplyCommentRecordList(
  page: {
    page_size: number;
    page_no: number;
  },
  query: {
    accountId?: number;
    type?: PlatType;
  },
) {
  const res: string = await window.ipcRenderer.invoke(
    'ICP_GET_REPLAY_COMMENT_RECORD_LIST',
    page,
    query,
  );
  return res;
}
