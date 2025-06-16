import { request } from "@/utils/request";
import { PubType } from "@/app/config/publishConfig";

export interface PublishParams {
  type: PubType;
  title: string;
  desc: string;
  accountId: number;
  videoPath?: string;
  timingTime?: string;
  coverPath?: string;
  publishTime?: string;
  status?: number;
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
