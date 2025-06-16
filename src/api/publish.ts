import { request } from "@/utils/request";
import { PubType } from "@/app/config/publishConfig";

export enum AccountType {
  Douyin = "douyin", // 抖音
  Xhs = "xhs", // 小红书
  WxSph = "wxSph", // 微信视频号
  KWAI = "KWAI", // 快手
  YOUTUBE = "youtube", // youtube
  WxGzh = "wxGzh", // 微信公众号
  BILIBILI = "bilibili", // B站
}

export enum PubStatus {
  UNPUBLISH = 0, // 未发布/草稿
  RELEASED = 1, // 已发布
  FAIL = 2, // 发布失败
  PartSuccess = 3, // 部分成功
}

export interface PublishParams {
  flowId: string;
  type: PubType;
  title: string;
  desc?: string;
  accountId: string;
  accountType: AccountType;
  uid: string;
  videoUrl?: string;
  coverUrl?: string;
  imgList?: string[];
  publishTime?: string;
  status?: PubStatus;
  option?: any;
}

export interface PublishListResponse {
  code: number;
  data: {
    list: any[];
    total: number;
  };
  msg: string;
}

// 获取发布列表
export const apiGetPublishList = (pageNo: number, pageSize: number) => {
  return request<PublishListResponse>({
    url: `/publish/list/${pageNo}/${pageSize}`,
    method: "GET",
  });
};

// 获取草稿箱列表
export const apiGetDraftsList = (pageNo: number, pageSize: number) => {
  return request<PublishListResponse>({
    url: `/publish/drafts/list/${pageNo}/${pageSize}`,
    method: "GET",
  });
};

// 创建发布
export const apiCreatePublish = (data: PublishParams) => {
  return request({
    url: "/publish",
    method: "POST",
    data,
  });
};

// 更新发布状态
export const updatePublishStatusApi = (id: number, status: number) => {
  return request({
    url: `/publish/status/${id}`,
    method: "POST",
    data: { status },
  });
};

// 删除发布
export const deletePublishApi = (id: number) => {
  return request({
    url: `/publish/${id}`,
    method: "DELETE",
  });
};
