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

/**
 * 获取作品列表
 */
export async function icpCreatorList(
  accountId: number,
  pageInfo: {
    pageNo: number;
    pageSize: number;
  },
) {
  const res: {
    list: WorkData[];
    count: number;
  } = await window.ipcRenderer.invoke('ICP_CREATOR_LIST', accountId, pageInfo);
  return res;
}

/**
 * 获取作品列表
 */
export async function icpGetCommentList(accountId: number, dataId: string) {
  const res: {
    list: WorkData[];
    count: number;
  } = await window.ipcRenderer.invoke('ICP_COMMENT_LIST', accountId, dataId);
  return res;
}
