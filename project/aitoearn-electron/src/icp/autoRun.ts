/*
 * @Author: nevin
 * @Date: 2025-01-23 15:48:14
 * @LastEditTime: 2025-03-28 13:35:19
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
  autoRunId: number;
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
export async function ipcCreateAutoRun(
  info: {
    accountId: number;
    type: AutoRunType;
    cycleType: string;
  },
  data: Record<string, any>,
) {
  data.data = JSON.stringify(data.data);
  const res: string = await window.ipcRenderer.invoke(
    'ICP_AUTO_RUN_CREATE',
    info,
    data,
  );
  return res;
}

/**
 * 获取进程列表
 * @param query
 */
export async function ipcGetAutoRunList(
  pageInfo: {
    page: number;
    pageSize: number;
  },
  query: {
    type?: AutoRunType;
    status?: AutoRunStatus;
    cycleType?: string;
    accountId?: number;
    dataId?: string;
  },
): Promise<{
  list: AutoRun[];
  count: number;
}> {
  const res = await window.ipcRenderer.invoke(
    'ICP_AUTO_RUN_LIST',
    pageInfo,
    query,
  );
  return res;
}

/**
 * 更新自动进程状态
 * @param data
 */
export async function ipcUpdateAutoRunStatus(
  id: number,
  status: AutoRunStatus,
) {
  const res: string = await window.ipcRenderer.invoke(
    'ICP_AUTO_RUN_STATUS',
    id,
    status,
  );
  return res;
}

/**
 * 获取进运行记录列表
 * @param data
 */
export async function ipcGetAutoRunRecordList(
  pageInfo: {
    page: number;
    pageSize: number;
  },
  query: {
    autoRunId: number;
    type?: AutoRunType;
    status?: AutoRunRecordStatus;
    cycleType?: string;
  },
): Promise<{
  list: AutoRunRecord[];
  total: number;
}> {
  const res = await window.ipcRenderer.invoke(
    'ICP_AUTO_RUN_RECORD_LIST',
    pageInfo,
    query,
  );
  return res;
}

/**
 * 创建自动进程
 * @param data
 */
export async function ipcCreateAutoRunRecord(autoRunId: number) {
  const res: string = await window.ipcRenderer.invoke(
    'ICP_AUTO_RUN_RECORD_CREATE',
    autoRunId,
  );
  return res;
}

/**
 * 立即执行进程
 * @param id
 */
export async function ipcRunNowAutoRun(id: number) {
  const res: boolean = await window.ipcRenderer.invoke(
    'ICP_RUN_NOW_AUTO_RUN',
    id,
  );
  return res;
}
