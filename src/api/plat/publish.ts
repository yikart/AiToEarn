// 创建发布
import { request } from "@/utils/request";
import {
  GetPublishListParams,
  PublishParams,
  PublishRecordItem,
} from "@/api/plat/types/publish.types";
import { parseTopicString } from "@/utils";

// 创建发布
export const apiCreatePublish = (data: PublishParams) => {
  const { topics, cleanedString } = parseTopicString(data.desc || "");
  data.topics = [...new Set(data.topics?.concat(topics))];
  data.desc = cleanedString;

  return request({
    url: "/plat/publish/create",
    method: "POST",
    data,
  });
};

// 查询发布列表
export const getPublishList = (data: GetPublishListParams) => {
  return request<PublishRecordItem[]>({
    url: "/plat/publish/getList",
    method: "POST",
    data,
  });
};

// 修改发布任务时间
export const updatePublishRecordTimeApi = (data: {
  id: string;
  publishTime: string;
}) => {
  return request({
    url: "/plat/publish/updateTaskTime",
    method: "POST",
    data,
  });
};

// 删除发布任务
export const deletePublishRecordApi = (id: string) => {
  return request({
    url: `/plat/publish/delete/${id}`,
    method: "DELETE",
  });
};

// 立即发布任务
export const nowPubTaskApi = (id: string) => {
  return request({
    url: `/plat/publish/nowPubTask/${id}`,
    method: "POST",
  });
};
