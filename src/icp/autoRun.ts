/*
 * @Author: nevin
 * @Date: 2025-01-23 15:48:14
 * @LastEditTime: 2025-03-18 22:23:06
 * @LastEditors: nevin
 * @Description: 自动进程
 */

export enum AutoRunType {
  ReplyComment = 1, // 回复评论
}

// 状态 进行中 暂停 删除
export enum AutoRunStatus {
  DOING = 2, // 进行中
  PAUSE = 3, // 暂停
  DELETE = 4, // 删除
}

export interface AutoRun {
  id: number;
  userId: string;
  accountId: number;
  runCount: number;
  status: AutoRunStatus;
  type: AutoRunType;
  cycleType: string;
  createTime: string;
  updateTime: string;
}

export enum AutoRunRecordStatus {
  DOING = 1, // 进行中
  FAIL = 2, // 失败
  SUCCESS = 3, // 完成
}

export interface AutoRunRecord {
  id: number;
  userId: string;
  status: AutoRunRecordStatus;
  type: AutoRunType;
  cycleType: string;
  createTime: string;
  updateTime: string;
}

/**
 * 创建自动进程
 * @param data
 */
export async function ipcCreateAutoRun(data: {
  accountId: number;
  type: AutoRunType;
  cycleType: string;
}) {
  const res: string = await window.ipcRenderer.invoke(
    'ICP_AUTO_RUN_CREATE',
    data,
  );
  return res;
}

/**
 * 获取进程列表
 * @param data
 */
export async function ipcGetAutoRunList() {
  const res: AutoRun[] = await window.ipcRenderer.invoke('ICP_AUTO_RUN_LIST');
  return res;
}

/**
 * 获取进程列表
 * @param data
 */
export async function ipcGetAutoRunRecordList() {
  const res: AutoRunRecord[] = await window.ipcRenderer.invoke(
    'ICP_AUTO_RUN_RECORD_LIST',
  );
  return res;
}
