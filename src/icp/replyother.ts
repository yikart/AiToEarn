/*
 * @Author: nevin
 * @Date: 2025-01-23 15:48:14
 * @LastEditTime: 2025-03-20 22:39:03
 * @LastEditors: nevin
 * @Description: 评论他人
 */
import { AccountType } from '@@/AccountEnum';
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
  authorId?: string;
  author?: {
    id: string;
  };
  option?: {
    xsec_token: string;
  };
};

export type CommentData = {
  dataId: string;
  videoAuthId?: string;
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
export async function icpDianzanDyOther(
  accountId: number,
  dataId: string,
  option?: any,
) {
  const res: any = await window.ipcRenderer.invoke(
    'ICP_DIANZAN_DY_OTHER',
    accountId,
    dataId,
    option,
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
 * 搜索各平台内容
 */
export async function getCommentSearchNotes(
  accountId: number,
  qe?: string,
  pageInfo?: any,
) {
  const res: {
    list: WorkData[];
    orgList?: any;
    pageInfo: {
      pageType: PageType;
      count?: number;
      hasMore?: boolean;
      pcursor?: string;
    };
  } = await window.ipcRenderer.invoke(
    'ICP_SEARCH_NODE_LIST',
    accountId,
    qe,
    pageInfo,
  );
  return res;
}

/**
 * 获取评论列表
 */
export async function icpGetCommentListByOther(
  accountId: number,
  data: WorkData,
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
    data,
    pcursor,
  );
  return res;
}

/**
 * 获取二级评论列表
 */
export async function icpGetSecondCommentListByOther(
  accountId: number,
  data: WorkData,
  root_comment_id: string,
  pcursor?: string,
) {
  const res: any = await window.ipcRenderer.invoke(
    'ICP_SECOND_COMMENT_LIST_BY_OTHER',
    accountId,
    data,
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
  authorId?: string,
) {
  const res: any = await window.ipcRenderer.invoke(
    'ICP_CREATE_COMMENT_BY_OTHER',
    accountId,
    dataId,
    content,
    authorId,
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
    videoAuthId?: string; // 视频作者ID
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
 * 作品互动
 */
export async function icpInteractionOneData(
  accountId: number,
  works: WorkData,
  option: {
    commentContent: string; // 评论内容
  },
) {
  const res: boolean = await window.ipcRenderer.invoke(
    'ICP_INTERACTION_ONE_DATA',
    accountId,
    works,
    option,
  );
  return res;
}

/**
 * 一键AI互动
 */
export async function icpCreateInteractionOneKey(
  accountId: number,
  worksList: WorkData[],
  option: any
) {
  const res: boolean = await window.ipcRenderer.invoke(
    'ICP_INTERACTION_ONE_KEY',
    accountId,
    worksList,
    option,
  );
  return res;
}

/**
 * 创建一键互动自动进程
 * @param accountId
 * @param dataId
 * @param cycleType
 */
export async function ipcCreateAutoRunOfInteraction(
  accountId: number,
  dataId: string, // 作品ID
  cycleType: string,
) {
  const res: string = await window.ipcRenderer.invoke(
    'ICP_AUTO_RUN_INTERACTION',
    accountId,
    dataId,
    cycleType,
  );
  return res;
}

// 获取一键互动自动进程信息
export async function ipcGetAutoRunOfInteractionInfo() {
  const res: any = await window.ipcRenderer.invoke(
    'ICP_GET_AUTO_INTERACTION_INFO',
  );
  return res;
}

/**
 * 获取一键互动的记录列表
 * @param page
 * @param query
 */
export async function ipcGetInteractionRecordList(
  page: {
    page_size: number;
    page_no: number;
  },
  query: {
    accountId?: number;
    type?: AccountType;
  },
) {
  const res: string = await window.ipcRenderer.invoke(
    'ICP_GET_INTERACTION_RECORD_LIST',
    page,
    query,
  );
  return res;
}
