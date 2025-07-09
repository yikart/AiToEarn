import { PubType } from "@/app/config/publishConfig";
import { PlatType } from "@/app/config/platConfig";

export enum PublishStatus {
  FAIL = -1, // 发布失败
  UNPUBLISH = 0, // 未发布
  RELEASED = 1, // 已发布
  PUB_LOADING = 2, // 发布中
}

// 创建发布入参
export interface PublishParams {
  // 传入账号UID
  flowId: string;
  type: PubType;
  title: string;
  desc?: string;
  // 传入 account
  accountId: string;
  accountType: PlatType;
  videoUrl?: string;
  coverUrl?: string;
  imgList?: string[];
  // 话题
  topics?: string[];
  publishTime?: string;
  option?: any;
}

// 查询发布列表入参
export interface GetPublishListParams {
  filter?: {
    accountId?: string;
    accountType?: PlatType;
    type?: PubType;
    status?: PublishStatus;
    time?: [Date, Date];
  };
  pageNo: number;
  pageSize: number;
}

// 发布记录item数据
export interface PublishRecordItem {
  dataId: string;
  id: string;
  flowId: string;
  type: string;
  title: string;
  desc: string;
  accountId: string;
  accountType: PlatType;
  uid: string;
  videoUrl?: string;
  coverUrl?: string;
  imgUrlList: string[];
  publishTime: Date;
  status: PublishStatus;
  errorMsg: string;
  option: any;
}

// 发布记录返回值
export interface PublishListResponse {
  totalCount: number;
  list: PublishRecordItem[];
}
