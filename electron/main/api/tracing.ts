import netRequest from '.';

export enum TracingType {
  EVENT = 'event', // 事件
}

export enum TracingTag {
  AccountAdd = 'AccountAdd', // 账号添加
  VideoPul = 'VideoPul', // 视频发布
  OpenProjectUse = 'OpenProjectUse', // 开源项目调用
}

export interface Tracing {
  id: string;
  userId: string;
  type: TracingType;
  tag: TracingTag;
  accountId?: number; // 平台账号ID
  desc?: string;
  dataId?: string; // 关联数据id
  createTime: string;
  updateTime: string;
}

export class TracingApi {
  // 创建跟踪-账号添加
  async createTracingAccountAdd(account: {
    id: number;
    desc?: string;
  }): Promise<Tracing | null> {
    const inData: {
      type: TracingType;
      tag: string;
      accountId?: number; // 平台账号ID
      desc?: string;
      dataId?: string; // 关联数据id
    } = {
      type: TracingType.EVENT,
      tag: TracingTag.AccountAdd,
      accountId: account.id,
      desc: account.desc,
      dataId: account.id + '',
    };

    const res = await netRequest<{
      data: Tracing;
      code: number;
      msg: string;
    }>({
      method: 'POST',
      url: 'tracing',
      body: inData,
    });
    const {
      status,
      data: { data, code },
    } = res;
    if (status !== 200 && status !== 201) return null;
    if (!!code) return null;
    return data;
  }

  // 创建跟踪-视频发布
  async createTracingVideoPul(inData: {
    accountId: number;
    dataId: string; // 视频发布数据ID
    desc?: string;
  }): Promise<Tracing | null> {
    const body: {
      type: TracingType;
      tag: string;
      accountId?: number; // 平台账号ID
      desc?: string;
      dataId?: string; // 关联数据id
    } = {
      type: TracingType.EVENT,
      tag: TracingTag.VideoPul,
      accountId: inData.accountId,
      desc: inData.desc,
      dataId: inData.dataId + '',
    };

    const res = await netRequest<{
      data: Tracing;
      code: number;
      msg: string;
    }>({
      method: 'POST',
      url: 'tracing',
      body: body,
    });
    const {
      status,
      data: { data, code },
    } = res;
    if (status !== 200 && status !== 201) return null;
    if (!!code) return null;
    return data;
  }

  // 创建跟踪-开源项目调用
  async createTracingOpenProjectUse(inData: {
    desc?: string;
  }): Promise<Tracing | null> {
    const body: {
      type: TracingType;
      tag: string;
      accountId?: number; // 平台账号ID
      desc?: string;
      dataId?: string; // 关联数据id
    } = {
      type: TracingType.EVENT,
      tag: TracingTag.OpenProjectUse,
      desc: inData.desc,
    };

    const res = await netRequest<{
      data: Tracing;
      code: number;
      msg: string;
    }>({
      method: 'POST',
      url: 'tracing',
      body: body,
    });
    const {
      status,
      data: { data, code },
    } = res;
    if (status !== 200 && status !== 201) return null;
    if (!!code) return null;
    return data;
  }
}

export const tracingApi = new TracingApi();
